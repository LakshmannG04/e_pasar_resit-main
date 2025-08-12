// server/routes/cart.js - Cart Endpoint
const express = require('express');
const router = express.Router();
const { CART, PRODUCTS } = require('../models');
const { checkAuth } = require('../functions/checkAuth');



// Add product to cart
router.post('/add', checkAuth(['User','Seller']), async (req, res) => {
  const { productId, quantity } = req.body;

  user = req.user;
  itemExists = false;

  if (!productId || !quantity) {
    return res.status(400).json({ status: 400, message: 'Product ID and Quantity are required' });
  }

  try {
    // Find the product to check MOQ and AvailableQTY
    const product = await PRODUCTS.findOne({where: {ProductID: productId} });
    if (!product || product.ProdStatus === 'Inactive') {
      return res.status(401).json({ status: 401, message: 'Product not found or is removed from listing' });
    }

    const cartEntry = await CART.findOne({ where: { UserID: user.id, ProductID: productId } });
    if (cartEntry) {
      itemExists = true;
    }

    if (!itemExists && quantity < product.MOQ) {
      return res.status(402).json({ status: 402, message: `Minimum order quantity for ${product.ProductName} is ${product.MOQ}` });
    }


    // if item exists in cart, add the quantity to the existing quantity
    // else, total quantity is just the quantity submitted in request
    if (itemExists) {
      totalQtyInCart = (parseInt(cartEntry.Quantity) + parseInt(quantity)).toString();
    } else {
      totalQtyInCart = quantity;
    }

    //check total quantity in cart against available quantity
    if (totalQtyInCart > product.AvailableQTY) {
      return res.status(403).json({ status: 403, message: `Insufficient stock for ${product.ProductName}. Available quantity: ${product.AvailableQTY}` });
    }
    
    // Add to cart or update existing entry
    if (cartEntry) {
      // Add quantity if the product is already in the cart
      cartEntry.Quantity = totalQtyInCart;
      await cartEntry.save();
    } else {
      // Add new product to cart
      await CART.create({ UserID: user.id, ProductID: productId, Quantity: totalQtyInCart });
    }
    res.status(200).json({ status: 200, message: 'Product added to cart successfully' });
  } catch (err) {
    console.error('Error adding product to cart:', err);
    res.status(404).json({ status: 404, message: `Error adding product to cart: ${err}` });
  }
});

// Edit product quantity in cart
router.put('/edit', checkAuth(['User','Seller']), async (req, res) => {
  const { productId, quantity } = req.body;

  if (!productId || !quantity) {
    return res.status(400).json({ status: 400, message: 'Product ID and Quantity are required' });
  }

  try {
    // Find the product to check MOQ and AvailableQTY
    const product = await PRODUCTS.findByPk(productId);
    if (!product) {
      return res.status(401).json({ status: 401, message: 'Product not found' });
    }

    if (quantity < product.MOQ) {
      return res.status(402).json({ status: 402, message: `Minimum order quantity for ${product.ProductName} is ${product.MOQ}` });
    }

    if (quantity > product.AvailableQTY) {
      return res.status(403).json({ status: 403, message: `Insufficient stock for ${product.ProductName}. Available quantity: ${product.AvailableQTY}` });
    }

    // Find the cart entry to update

    const cartEntry = await CART.findOne({ where: { UserID: user.id, ProductID: productId } })

    if (!cartEntry) {
      return res.status(404).json({ status: 404, message: 'Cart item not found' });
    }

    // Update quantity
    cartEntry.Quantity = quantity;
    await cartEntry.save();

    res.status(200).json({ status: 200, message: 'Cart item updated successfully' });
  } catch (err) {
    console.error('Error editing cart item:', err);
    res.status(405).json({ status: 405, message: `Error editing cart item: ${err}` });
  }
});

// View cart
router.get('/view', checkAuth(['User','Seller']), async (req, res) => {
  try {

    user = req.user;

    const cartItems = await CART.findAll({
      where: { UserID: user.id },
      include: [{ model: PRODUCTS, attributes: ['ProductName', 'Price', 'MOQ'] }]
    });

    if (!cartItems.length) {
      return res.status(404).json({ status: 404, message: 'No items in cart' });
    }

    res.status(200).json({ status: 200, message: 'Cart items fetched successfully', data: cartItems });
  } catch (err) {
    console.error('Error fetching cart items:', err);
    res.status(400).json({ status: 400, message: `Error fetching cart items: ${err}` });
  }
});

// Delete specific cart item by productId
router.delete('/delete/:productId', checkAuth(['User','Seller']), async (req, res) => {
  const { productId } = req.params;

  try {
    const deletedItem = await CART.destroy({ where: { UserID: req.user.id, ProductID: productId } });

    if (!deletedItem) {
      return res.status(404).json({ status: 404, message: 'Cart item not found' });
    }

    res.status(200).json({ status: 200, message: 'Cart item deleted successfully' });
  } catch (err) {
    console.error('Error deleting cart item:', err);
    res.status(400).json({ status: 400, message: `Error deleting cart item: ${err}` });
  }
});

// Clear cart
router.delete('/clear', checkAuth(['User','Seller']), async (req, res) => {
  try {
    await CART.destroy({ where: { UserID: user.id } });
    res.status(200).json({ status: 200, message: 'Cart cleared successfully' });
  } catch (err) {
    console.error('Error clearing cart:', err);
    res.status(400).json({ status: 400, message: `Error clearing cart: ${err}` });
  }
});

module.exports = router;
