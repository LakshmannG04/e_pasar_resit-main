require('dotenv').config();
const express = require('express');
const { sequelize } = require('../models');
const router = express.Router();
const { CART, TRANSACTIONS, PRODUCT_TRANSACTION_INFO, PAYMENT, PRODUCTS, DELIVERY_DETAILS } = require('../models');
const { gateway } = require('../interfaces/payment_interface/stripe');
const { createDeliveryOrder } = require('../interfaces/logistics_interface/mockup');


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
// SUCCESS/FAIL webhook route for payment gateway to call

router.post('/stripeWebhook', async (req, res) => {

    const webhookSecret = process.env.STRIPE_WEBHOOK_SK;
    const payload = req.rawBody;
    const stripe_signature = req.headers['stripe-signature'];
  
    let event;
  
    const t = await sequelize.transaction();  // Create a new transaction
  
    try {
  
        // Verify the webhook signature
        try {
            event = gateway.webhooks.constructEvent(payload, stripe_signature, webhookSecret);
        } catch (err) {
            await t.rollback();
            console.log("Stripe Error: " + err);
            return res.status(430).json({ status: 430, message: `Webhook Error: ${err.message}` });
        }
    
        let transaction;
        let transactionId;
        let session;
  
        switch (event.type) {
            
            //******* SUCCESSFUL PAYMENT CASE *******//
            case 'checkout.session.completed':

                // Handle the event
                session = event.data.object;
                transactionId = session.metadata.transaction_id;

                // find all entries with the given transaction ID, user ID, and PENDING state
                transaction = await TRANSACTIONS.findAll({ where: { TransactionID: transactionId, TransactionState: 'PENDING' }, transaction: t });

                // Check if transaction exists
                if (!transaction) {
                    await t.rollback();
                    return res.status(431).json({ status: 431, message: 'Invalid transaction ID' });
                }


                // Check if there is collision of transaction ID
                if (transaction.length !== 1) {
                    for (const entry of transaction) {
                    entry.TransactionState = 'PAID BUT COLLIDED';
                    await entry.save({ transaction: t });
                    }
                    console.log("Collision occurred. Collided transactions on hold.");
                    return res.status(432).json({ status: 432, message: 'Collision occurred. Collided transactions on hold.' });
                }
        
                transaction[0].TransactionState = 'APPROVED';
                await transaction[0].save({ transaction: t });
        
        
                const transactionItems = await PRODUCT_TRANSACTION_INFO.findAll({ where: { TransactionID: transactionId }, transaction: t });
        
                for (const item of transactionItems) {
                    item.PaymentClaimStatus = 'UNCLAIMED';
                    await item.save({ transaction: t });
                }
        
        
                //clear cart
                const userID = transaction[0].UserID;
                const cartItems = await CART.findAll({ where: { UserID: userID }, transaction: t });
        
                for (const item of cartItems) {
                    await item.destroy({ transaction: t });
                }
        
        
                // Add payment details to DB
                const paymentMethod = session.payment_method_types[0];
                const payment = await PAYMENT.findByPk( transaction[0].PaymentID ,{ transaction: t } );
                payment.PaymentType = paymentMethod;
                if (paymentMethod === 'card') {
                    const paymentIntent = await gateway.paymentIntents.retrieve(session.payment_intent);
                    const paymentDetails = await gateway.paymentMethods.retrieve(paymentIntent.payment_method);
                    payment.CardType = paymentDetails.card.brand;
                    payment.CardLast4Digits = paymentDetails.card.last4;
                }
                await payment.save({ transaction: t });
        
        
                // Call delivery service API to schedule delivery
                const trackingID = await createDeliveryOrder();
                const deliveryDetails = await DELIVERY_DETAILS.findOne({ where: { DeliveryID: transaction[0].DeliveryID }, transaction: t });
                deliveryDetails.TrackingNo = trackingID;
                await deliveryDetails.save({ transaction: t });

        
                await t.commit();  // Commit the transaction
        
                return res.status(200).json({ status: 200, message: 'Payment confirmed. Order placed successfully.' });
    
    
    
            //******* FAILED/EXPIRED PAYMENT CASE *******//
            case 'checkout.session.async_payment_failed':
            case 'checkout.session.expired':
    

                // Handle the event
                session = event.data.object;
                transactionId = session.metadata.transaction_id;
                
                // find all entries with the given transaction ID, user ID, and PENDING state
                transaction = await TRANSACTIONS.findAll({ where: { TransactionID: transactionId, TransactionState: 'PENDING' }, transaction: t });

                // Check if transaction exists
                if (!transaction) {
                    await t.rollback();
                    return res.status(431).json({ status: 431, message: 'Invalid transaction ID' });
                }

                // Check if there is collision of transaction ID
                if (transaction.length > 1) {
                    for (const entry of transaction) {
                    entry.TransactionState = 'FAILED';
                    await entry.save({ transaction: t });
                    await invalidateTransactionItems(entry.TransactionID, t);
                    }
        
                    return res.status(441).json({ status: 441, message: 'Collision occurred. Collided transactions aborted.' });
                }
        
                transaction[0].TransactionState = 'FAILED';
                await transaction[0].save({ transaction: t });
                await invalidateTransactionItems(transaction[0].TransactionID, t);
        
                await t.commit();  // Commit the transaction
        
                return res.status(200).json({ status: 200, message: 'Payment failed. Transaction aborted.' });
        
                
                default:
                await t.commit();
                return res.status(201).json({ status: 201, message: 'Event not handled' });
            }
  
      
  
    } catch (error) {
        await t.rollback();  // Rollback if something goes wrong
        console.log(error);
        return res.status(450).json({ status: 450, message: error });
  
    }
  
  });
  
  
  
  
  module.exports = router;