const express = require('express');
const { PRODUCTS } = require('../models');
const { checkAuth } = require('../functions/checkAuth');
const { where } = require('sequelize');
const router = express.Router();

// set new promo
router.patch('/setPromo', checkAuth(['Seller']), async (req, res) => {
    const { ProductID, DiscountPrice, ExpiryDate } = req.body; //ExpiryDate must be 'YYYY-MM-DD' format

    try {

        // validate request body
        if (!ProductID || !DiscountPrice || !ExpiryDate) {
            return res.status(400).json({ status: 400, message: 'All fields are required' });
        }

        if (DiscountPrice < 0){
            return res.status(400).json({ status: 400, message: 'Discount price cannot be negative' });
        }

        // validate expiry date format
        const expiryDate = new Date(ExpiryDate);
        if (isNaN(expiryDate.getTime())) {
            return res.status(401).json({ status: 401, message: 'Invalid expiry date format' });
        }

        // validate expiry date is in the future
        const currentDate = new Date();
        if (expiryDate < currentDate) {
            return res.status(402).json({ status: 402, message: 'Expiry date must be in the future' });
        }

        // Check if promo already exists
        const existingPromo = await PRODUCTS.findOne( {where: { ProductID: ProductID, PromoActive: true }});
        if (existingPromo) {
            return res.status(403).json({ status: 403, message: 'There is already an active promo for this product.' });
        }

        // Check if product exists
        const product = await PRODUCTS.findOne({ where: { ProductID: ProductID } });
        if (!product) {
            return res.status(404).json({ status: 404, message: 'Product not found' });
        }

        product.PromoActive = true;
        product.DiscPrice = DiscountPrice;
        product.PromoEndDate = expiryDate;
        await product.save();

        // wrap the product ID, discount price, and expiry date in an object
        const returnData = {
            ProductID: product.ProductID,
            DiscountPrice: product.DiscPrice,
            PromoEndDate: product.PromoEndDate
        };

        return res.status(200).json({ status: 200, message: 'Promotion set successfully', data: returnData });

    } catch (err) {
        console.error('Error setting promo:', err);
        return res.status(405).json({ status: 405, message: `Error setting promo ${err}` });
    }
});


// get all active promos
router.get('/', checkAuth(['Seller']), async (req, res) => {
    const user = req.user;

    try {
        const promos = await PRODUCTS.findAll({
            where: { UserID: user.id, PromoActive: true },
            attributes: ['ProductID', 'ProductName', 'DiscPrice', 'PromoEndDate']
        });

        if (promos.length === 0) {
            return res.status(400).json({ status: 400, message: 'No active promos found' });
        }

        return res.status(200).json({ status: 200, message: 'Active promos fetched successfully', data: promos });

    } catch (err) {
        console.error('Error retrieving promos:', err);
        return res.status(401).json({ status: 401, message: `Error retrieving promos ${err}` });
    }
});



// delete promo
router.patch('/deletePromo', checkAuth(['Seller']), async (req, res) => {
    const { ProductID } = req.body;

    try {
        if (!ProductID) {
            return res.status(400).json({ status: 400, message: 'Product ID is required' });
        }

        // Check if promo exists
        const promo = await PRODUCTS.findOne({ where: { ProductID: ProductID, PromoActive: true } });
        if (!promo) {
            return res.status(401).json({ status: 401, message: 'Promo not found' });
        }

        promo.PromoActive = false;
        promo.DiscPrice = null;
        promo.PromoEndDate = null;
        await promo.save();

        return res.status(200).json({ status: 200, message: 'Promo deleted successfully' });

    } catch (err) {
        console.error('Error deleting promo:', err);
        return res.status(402).json({ status: 402, message: `Error deleting promo ${err}` });
    }
});


module.exports = router;