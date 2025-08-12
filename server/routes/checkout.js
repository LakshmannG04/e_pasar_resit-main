// server/routes/checkout.js - Checkout Endpoint
require('dotenv').config();
const express = require('express');
const { sequelize } = require('../models');
const router = express.Router();
const { CART, TRANSACTIONS, PRODUCT_TRANSACTION_INFO, PAYMENT, PRODUCTS, DELIVERY_DETAILS } = require('../models');
const { checkAuth } = require('../functions/checkAuth');
const uuid = require('uuid'); // Used to generate transactionID
const { createCheckoutSession, retrieveCheckoutSession, cancelCheckoutSession } = require('../interfaces/payment_interface/stripe');
const { getDeliveryFee } = require('../interfaces/logistics_interface/mockup');




// function to set PaymentClaimStatus to INVALID and update AvailableQty in PRODUCTS table
const invalidateTransactionItems = async (transactionId, t) => {

  const transactionItems = await PRODUCT_TRANSACTION_INFO.findAll({ where: { TransactionID: transactionId }, transaction: t });

  for (const item of transactionItems) {
    item.PaymentClaimStatus = 'INVALID';
    await item.save({ transaction: t });

    const productEntry = await PRODUCTS.findByPk(item.ProductID, { transaction: t });
    productEntry.AvailableQty += item.Quantity;
    await productEntry.save({ transaction: t });
  }
};


//********************************************************************************************************************
// POST route to lock product quantity in db and return transaction ID

const transactionTTL = parseInt(process.env.TRANSACTION_TTL); // time-to-live for transactions
const MAX_TRANSACTION_ID_REGENERATION_ATTEMPTS = 10;

// Lock product qty in db
router.get('/lockQty', checkAuth(['User', 'Seller']), async (req, res) => {
  const user = req.user;

  const t = await sequelize.transaction();  // Create a new transaction
  const transactionId = uuid.v4(); // Generate a unique transaction ID for the session

  try {
    res.setHeader('Cache-Control', 'no-store');
    //if the user has an existing transaction pending, return error
    const existingTransaction = await TRANSACTIONS.findOne({ where: { UserID: user.id, TransactionState: 'PENDING' }, transaction: t });

    if (existingTransaction) {
      // Check if existing transaction has expired
      transactionExpiryTime = new Date(existingTransaction.CreatedAt);
      transactionExpiryTime.setMinutes(transactionExpiryTime.getMinutes() + transactionTTL);


      if (transactionExpiryTime < new Date()) {
        existingTransaction.TransactionState = 'FAILED';
        await existingTransaction.save({ transaction: t });
        await invalidateTransactionItems(existingTransaction.TransactionID, t);
      }
      else {
        await t.rollback();
        return res.status(410).json({ status: 410, message: 'User already has a pending transaction' });
      }
    }


    // check if transaction ID already exists
    const transactionIdExists = await TRANSACTIONS.findOne({ where: { TransactionID: transactionId }, transaction: t });
    let newIdGeneratedCount = 0;
    // Generate a new transaction ID if the current one already exists
    while (transactionIdExists) {

      if (newIdGeneratedCount > MAX_TRANSACTION_ID_REGENERATION_ATTEMPTS) {
        await t.rollback();
        return res.status(500).json({ status: 500, message: 'Error generating unique transaction ID' });
      }

      transactionId = uuid.v4();
      transactionIdExists = await TRANSACTIONS.findOne({ where: { TransactionID: transactionId }, transaction: t });
    }


    //save the transaction state in db (TRANSACTION_STATE table)
    await TRANSACTIONS.create(
      {
        TransactionID: transactionId,
        TransactionState: 'PENDING',
        UserID: user.id,
        CreatedAt: new Date()
      },
      { transaction: t }
    );


    //get all cart items related to the user
    const cartItems = await CART.findAll({ where: { UserID: user.id }, transaction: t });

    //check if user actually has items in cart
    if (cartItems.length === 0) {
      await t.rollback();
      return res.status(411).json({ status: 411, message: 'Cart is empty' });
    }

    //lock quantity for all items in the cart
    for (const item of cartItems) {

      const product = await PRODUCTS.findByPk(item.ProductID, { transaction: t });

      if (item.Quantity > product.AvailableQty) {
        await t.rollback();
        return res.status(412).json({ status: 412, message: `Insufficient stock for ID:${item.ProductID}` });
      }

      product.AvailableQty -= item.Quantity;
      await product.save({ transaction: t });

      if (product.PromoActive) {
        soldPrice = product.DiscPrice;
      } else {
        soldPrice = product.Price;
      }
      //save the transaction state in db (TRANSACTION_STATE table)
      await PRODUCT_TRANSACTION_INFO.create({
        TransactionID: transactionId,
        ProductID: item.ProductID,
        Quantity: item.Quantity,
        SoldPrice: soldPrice,
      }, { transaction: t });

    }


    await t.commit();  // Commit the transaction

    
    return res.status(200).json({ status: 200, message: 'Product quantity locked successfully', data: transactionId });


  } catch (error) {
    await t.rollback();  // Rollback if something goes wrong
    console.error(error);
    return res.status(413).json({ status: 413, message: `Error: ${error}` });
  }


});





//********************************************************************************************************************
// POST route to add delivery details and return payment page URL from payment gateway

router.post('/proceedToPayment', checkAuth(['User', 'Seller']), async (req, res) => {

  const user = req.user;
  const { transactionId, deliveryDetails } = req.body; //deliveryDetails is an object with FirstName, LastName, ContactNo, Address

  const t = await sequelize.transaction();  // Create a new transaction

  try {

    // ************ Check if compulsory fields are provided ************

    if (!transactionId || !deliveryDetails.FirstName || !deliveryDetails.ContactNo || !deliveryDetails.Address) {
      await t.rollback();
      return res.status(420).json({ status: 420, message: 'Compulsory fields not provided (Transaction ID or Delivery Details)' });
    }


    // ************ Check if transaction ID is valid AND not expired ************

    // find all entries with the given transaction ID, user ID, and PENDING state
    const transaction = await TRANSACTIONS.findAll({ where: { TransactionID: transactionId, UserID: user.id, TransactionState: 'PENDING' }, transaction: t });

    // Check if transaction exists
    if (transaction.length === 0) {
      await t.rollback();
      return res.status(421).json({ status: 421, message: 'Invalid transaction ID' });
    }

    // Check if there is collision of transaction ID
    if (transaction.length > 1) {
      for (const entry of transaction) {
        entry.TransactionState = 'FAILED';
        await entry.save({ transaction: t });

        await invalidateTransactionItems(entry.TransactionID, t);

      }

      await t.commit();  // Commit the transaction
      return res.status(422).json({ status: 422, message: 'Collision occurred. Collided transactions aborted.' });
    }

    if (transaction[0].PaymentID !== null) {
      const existing_session = await retrieveCheckoutSession(transaction[0].PaymentID);
      await t.commit();
      return res.status(200).json({ status: 200, message: 'Retrieved existing checkout session.', data: existing_session.url });
    }

    // Check if transaction has expired
    transactionExpiryTime = new Date(transaction[0].CreatedAt);
    transactionExpiryTime.setMinutes(transactionExpiryTime.getMinutes() + transactionTTL);

    if (transactionExpiryTime < new Date()) {

      transaction[0].TransactionState = 'FAILED';
      await transaction[0].save({ transaction: t });

      await invalidateTransactionItems(transaction[0].TransactionID, t);

      await t.commit();  // Commit the transaction
      return res.status(423).json({ status: 423, message: 'Transaction expired' });
    }


    var lastName;
    if (!deliveryDetails.LastName) {
      lastName = '';
    } else {
      lastName = deliveryDetails.LastName;
    }



    // ************ Add delivery details to DB ************
    // 
    const deliveryFee = await getDeliveryFee(); // Mockup function does not accept any parameters
    const delivery_details = await DELIVERY_DETAILS.create({
      DeliveryFee: deliveryFee,
      DeliveryStatus: 'Processing',
      FirstName: deliveryDetails.FirstName,
      LastName: lastName,
      ContactNo: deliveryDetails.ContactNo,
      Address: deliveryDetails.Address
    }, { transaction: t });

    transaction[0].DeliveryID = delivery_details.DeliveryID;
    await transaction[0].save({ transaction: t });



    // ************ Calculate total amount to be paid ************
    // 
    const transactionItems = await PRODUCT_TRANSACTION_INFO.findAll({ where: { TransactionID: transactionId }, transaction: t });

    if (transactionItems.length === 0) {
      await t.rollback();
      return res.status(424).json({ status: 424, message: 'Error retrieving transaction items' });
    }

    let totalAmount = 0;

    for (const item of transactionItems) {
      const product = await PRODUCTS.findByPk(item.ProductID, { transaction: t });

      if (product.length === 0) {
        await t.rollback();
        return res.status(425).json({ status: 425, message: 'Error retrieving product info' });
      }

      let price = product.Price;

      if (product.PromoActive && product.PromoEndDate >= new Date().toISOString().split('T')[0]) {
        price = product.DiscPrice;
      }


      totalAmount += price * item.Quantity;
    }

    // add estimate delivery fee into total amount
    totalAmount += deliveryFee;

    // ************ Call payment gateway API to get payment URL ************

    const success_url = `http://${process.env.FRONTEND_IP}:${process.env.FRONTEND_PORT}/${process.env.TRANSACTION_SUCCESS_URL}`;
    const cancel_url = `http://${process.env.FRONTEND_IP}:${process.env.FRONTEND_PORT}/${process.env.TRANSACTION_CANCEL_URL}`;

    // Call payment gateway API to get payment URL
    const session_object = await createCheckoutSession(totalAmount, transactionId, success_url, cancel_url);

    if (!session_object) {
      await t.rollback();
      return res.status(426).json({ status: 426, message: 'Error creating checkout session' });
    }

    const payment_page_url = session_object.url;



    // ************ Add payment session ID to DB ************
    //
    await PAYMENT.create(
      {
        PaymentID: session_object.id,
        Amount: totalAmount,
        PaymentDate: new Date()
      },
      { transaction: t }
    );

    transaction[0].PaymentID = session_object.id;
    await transaction[0].save({ transaction: t });


    // ************ commit the transaction and return to URL to frontend ************
    //
    await t.commit();  // Commit the transaction

    //return the payment URL
    return res.status(200).json({ status: 200, message: 'Checkout session created successful.', data: payment_page_url });

  } catch (error) {
    await t.rollback();  // Rollback if something goes wrong
    console.error(error);
    return res.status(427).json({ status: 427, message: error });
  }

});


router.get('/getTransactionID', checkAuth(['User', 'Seller']), async (req, res) => {

  const user = req.user;

  const t = await sequelize.transaction();  // Create a new transaction
  try {
    res.setHeader('Cache-Control', 'no-store');
    const transaction = await TRANSACTIONS.findOne({ where: { UserID: user.id, TransactionState: 'PENDING' }, transaction: t });

    if (transaction.length === 0) {
      return res.status(430).json({ status: 430, message: 'No pending transaction found' });
    }

    if (transaction.length > 1) {
      for (const entry of transaction) {
        entry.TransactionState = 'FAILED';
        await entry.save();
        await invalidateTransactionItems(entry.TransactionID);
      }
      await t.commit();  // Commit the transaction
      return res.status(431).json({ status: 431, message: 'Multiple transaction ID detected, aborting all transactions.' });
    }


    // Check if existing transaction has expired
    transactionExpiryTime = new Date(transaction.CreatedAt);
    transactionExpiryTime.setMinutes(transactionExpiryTime.getMinutes() + transactionTTL);


    if (transactionExpiryTime < new Date()) {
      transaction.TransactionState = 'FAILED';
      await transaction.save({ transaction: t });
      await invalidateTransactionItems(transaction.TransactionID, t);
      await t.commit();  // Commit the transaction
      return res.status(432).json({ status: 432, message: 'Pending transaction expired.' });
    }
    
    await t.commit();  // Commit the transaction
    return res.status(200).json({ status: 200, message: 'Transaction ID retrieved successfully.', data: transaction.TransactionID });
  
  } catch (error) {
    await t.rollback();  // Rollback if something goes wrong
    console.log(error);
    return res.status(433).json({ status: 433, message: error });
  }

});


router.get('/cancelCheckoutSession', checkAuth(['User', 'Seller']), async (req, res) => {
  
  console.log("Executing cancelCheckoutSession");

  const user = req.user;

  try{
    const t = await sequelize.transaction();  // Create a new transaction

    const transaction = await TRANSACTIONS.findOne({ where: { UserID: user.id, TransactionState: 'PENDING' } });

    if (!transaction) {
      console.log('No pending transaction found');
      return res.status(440).json({ status: 440, message: 'No pending transaction found' });
    }

    if (transaction.PaymentID === null) {
      console.log('No checkout session found');
      return res.status(441).json({ status: 441, message: 'No checkout session found' });
    }

    const session = await cancelCheckoutSession(transaction.PaymentID);

    if (!session) {
      console.log('Error cancelling checkout session');
      return res.status(442).json({ status: 442, message: 'Error cancelling checkout session' });
    }

    transaction.TransactionState = 'FAILED';
    await transaction.save({ transaction: t });
    await invalidateTransactionItems(transaction.TransactionID, t);

    await t.commit();
    console.log('Checkout session cancelled successfully');
    return res.status(200).json({ status: 200, message: 'Checkout session cancelled successfully.' });

  } catch (error) {
    console.log(error);
    return res.status(443).json({ status: 443, message: error });
  }

});


//********************************************************************************************************************
// GET route to fetch delivery fee estimate

router.get('/getDeliveryFee/:postcode', async (req, res) => {

  const { postcode } = req.params;

  if (!postcode) {
    return res.status(400).json({ status: 400, message: 'Postcode not provided' });
  }

  try {
  // Call delivery fee API to get delivery fee estimate
    const deliveryFee = await getDeliveryFee(); // Mockup function does not accept any parameters
    return res.status(200).json({ status: 200, message: 'Delivery fee fetched successfully', data: deliveryFee });
  } catch (error) {
    return res.status(401).json({ status: 401, message: `Error fetching delivery fee: ${error}` });
  }
  

});



module.exports = router;