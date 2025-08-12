// server/routes/orders.js - Order Management Endpoint Using Sequelize
const express = require('express');
const router = express.Router();
const { TRANSACTIONS, PRODUCTS, DELIVERY_DETAILS, PRODUCT_TRANSACTION_INFO, USERS } = require('../models');
const { checkAuth } = require('../functions/checkAuth');


// GET /orders - Get all completed and pending orders relevant to Seller (Seller only)
router.get('/', checkAuth(['Seller']), async (req, res) => {
    
    const user = req.user;

    try {

        const orders = await PRODUCT_TRANSACTION_INFO.findAll({
            include: [
                {
                    model: PRODUCTS,
                    attributes: ['UserID', 'ProductName']
                },
                {
                    model: TRANSACTIONS,
                    attributes: ['TransactionState'],
                    include: [
                        {
                            model: DELIVERY_DETAILS,
                            attributes: ['DeliveryID', 'DeliveryStatus', 'FirstName', 'LastName', 'ContactNo', 'Address']
                        }
                    ]
                }
            ],
            where: { '$PRODUCT.UserID$': user.id, '$TRANSACTION.TransactionState$': 'APPROVED' },
            order: [['TransactionID', 'ASC']]
        });

        if (orders.length === 0) {
            return res.status(400).json({ status: 400, message: 'No orders found' });
        }


        //group the orders together by TransactionID
        let groupedOrders = [];
        groupedOrders[0] = [];
        let index = 0;
        orders.forEach(order => {
            if (index === 0) {
                groupedOrders[0].push(order);
                index++;
            } else if (order.TransactionID === groupedOrders[index-1][0].TransactionID) {
                groupedOrders[index-1].push(order);
            } else {
                groupedOrders[index] = [];
                groupedOrders[index].push(order);
                index++;
            }
        });

        res.status(200).json({ status: 200, message: 'Orders fetched successfully', data: groupedOrders });
        
    } catch (err) {
        console.error('Error retrieving orders:', err);
        res.status(401).json({ status: 401, message: 'Error retrieving orders' });
    }
});



// GET /orders - Get order details of a specific user (User only)
router.get('/user', checkAuth(['User', 'Seller']), async (req, res) => {
    
    const user = req.user;

    try {

        const orders = await TRANSACTIONS.findAll({
            attributes: ['TransactionID', 'CreatedAt'],
            include: [
                {
                    model: PRODUCT_TRANSACTION_INFO,
                    attributes: ['Quantity', 'SoldPrice'],
                    include: [
                        {
                            model: PRODUCTS,
                            attributes: ['ProductName']
                        }
                        
                    ]
                },
                {
                    model: DELIVERY_DETAILS,
                    attributes: ['DeliveryID', 'TrackingNo', 'DeliveryStatus', 'FirstName', 'LastName', 'ContactNo', 'Address'],
                }
            ],
            where: { '$TRANSACTIONS.UserID$': user.id, '$TRANSACTIONS.TransactionState$': 'APPROVED' },
            order: [['CreatedAt', 'DESC']]
        });


        if (orders.length === 0) {
            return res.status(400).json({ status: 400, message: 'No orders found' });
        }


        res.status(200).json({ status: 200, message: 'Orders fetched successfully', data: orders });
        
    } catch (err) {
        console.error('Error retrieving orders:', err);
        res.status(401).json({ status: 401, message: 'Error retrieving orders' });
    }
});




module.exports = router;
