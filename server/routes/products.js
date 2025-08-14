// server/routes/productRoute.js - Product Endpoint
const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const { verifyToken } = require('../functions/verifyToken');
const { checkAuth } = require('../functions/checkAuth');
const fs = require('fs');

// Import enhanced verification services
const { suggestCategory, verifyProductSuitability, getAvailableCategories } = require('../functions/categoryVerification');
const { generateProductImage, getImageOptions } = require('../functions/imageService');

const { sequelize, CATEGORY, PRODUCTS, CART, PRODUCT_VIEWS, DISPUTE_MSG, USERS, Sequelize } = require('../models');
const { Op } = Sequelize;

const imageFolderPath = path.join(__dirname, '..', 'images/products');

//********************************************************************************************************************
// GET route to fetch all products
router.get('/', async (req, res) => {
  try {
    const products = await PRODUCTS.findAll();
    if (products.length === 0) {
      return res.status(401).json({ status: 401, message: 'No products found' });
    }
    res.status(200).json({ status: 200, message: 'All products fetched successfully', data: products });
  } catch (err) {
    console.error('Error fetching products: ', err);
    if (err.name === 'SequelizeConnectionError') {
      res.status(402).json({ status: 402, message: 'Database connection error. Please try again later.' });
    } else if (err.name === 'SequelizeDatabaseError') {
      res.status(403).json({ status: 403, message: 'Database error. Please check the database configuration.' });
    } else {
      res.status(404).json({ status: 404, message: 'Error fetching products' });
    }
  }
});

//********************************************************************************************************************
// ROUTE TO FETCH IMAGES OF PRODUCTS (serve actual bytes)
router.get('/image/:id', async (req, res) => {
  try {
    const product = await PRODUCTS.findOne({ where: { ProductID: req.params.id } });
    if (!product) {
      return res.status(401).json({ status: 401, message: 'Invalid product id' });
    }

    const file = product.ProductImage || 'default.jpg';
    const imagePath = path.join(imageFolderPath, file);

    const tryDefault = () => {
      const fallback = path.join(imageFolderPath, 'default.jpg');
      if (fs.existsSync(fallback)) {
        const ext = path.extname('default.jpg').toLowerCase();
        const mime =
          ext === '.png' ? 'image/png' :
          ext === '.svg' ? 'image/svg+xml' :
          'image/jpeg';
        res.setHeader('Content-Type', mime);
        return fs.createReadStream(fallback).pipe(res);
      }
      return res.status(402).json({ status: 402, message: 'Image does not exist in server. Please upload new image.' });
    };

    if (!fs.existsSync(imagePath)) return tryDefault();

    const ext = path.extname(file).toLowerCase();
    const mime =
      ext === '.png' ? 'image/png' :
      ext === '.svg' ? 'image/svg+xml' :
      'image/jpeg';

    res.setHeader('Content-Type', mime);
    return fs.createReadStream(imagePath).pipe(res);
  } catch (err) {
    console.error('Error fetching product image: ', err);
    res.status(403).json({ status: 403, message: 'Error fetching product image' });
  }
});

//********************************************************************************************************************
// POST route to create a new product (SELLERS ONLY!)

if (!fs.existsSync(imageFolderPath)) {
  fs.mkdirSync(imageFolderPath, { recursive: true });
}

// Set up storage for uploaded images
// will save all uploaded images to the 'images/products' folder
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, imageFolderPath); // Specify the upload directory
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Use timestamp as filename (fixed)
  }
});

const upload = multer({ storage: storage });

// Enhanced product validation with agricultural verification
const validateProduct = async (req, res, next) => {
  const { productName, price, category, description } = req.body;

  if (!productName || !price || !category) {
    return res.status(403).json({ status: 403, message: 'Required fields not provided' });
  }

  try {
    // Check if category exists
    const categoryExists = await CATEGORY.findOne({ where: { CategoryID: category } });
    if (!categoryExists) {
      return res.status(404).json({ status: 404, message: 'Invalid category' });
    }

    // Enhanced Agricultural Product Verification
    const productDescription = description || 'No description available';
    const verificationResult = await verifyProductSuitability(productName, productDescription);

    if (!verificationResult.approved) {
      return res.status(422).json({ 
        status: 422, 
        message: 'Product not approved for agricultural marketplace',
        error: 'PRODUCT_VERIFICATION_FAILED',
        details: {
          reason: verificationResult.reason,
          message: verificationResult.message,
          confidence: verificationResult.confidence,
          recommendation: verificationResult.recommendation,
          forbiddenKeywords: verificationResult.forbiddenKeywords,
          matchedKeywords: verificationResult.matchedKeywords
        }
      });
    }

    // If approved but suggested category differs from selected, warn the user
    if (verificationResult.suggestedCategory && 
        verificationResult.suggestedCategory !== parseInt(category) && 
        verificationResult.confidence > 40) {
      
      req.categoryWarning = {
        suggestedCategory: verificationResult.suggestedCategory,
        suggestedCategoryName: verificationResult.categoryName,
        confidence: verificationResult.confidence,
        message: `Our AI suggests this product might fit better in the ${verificationResult.categoryName} category (${verificationResult.confidence}% confidence)`
      };
    }

    // Store verification result for use in product creation
    req.verificationResult = verificationResult;
    next();

  } catch (err) {
    console.error('Error in product validation:', err);
    return res.status(500).json({ 
      status: 500, 
      message: 'Error validating product. Please try again.',
      error: 'VALIDATION_ERROR'
    });
  }
};

// ACTUAL POST route to create a new product
router.post('/', checkAuth(['Seller']), upload.single('image'), validateProduct, async (req, res) => {
  try {
    let { productName, price, MOQ, availableQty, description, category, useAutoImage } = req.body;
    const user = req.user;

    if (!MOQ) MOQ = 1;
    if (!availableQty) availableQty = 1;
    if (!description) description = 'No description available';

    let img = 'default.jpg';

    if (price < 0) return res.status(600).json({ status: 600, message: 'Price cannot be negative' });
    if (MOQ < 1) return res.status(601).json({ status: 601, message: 'Minimum Order Quantity cannot be less than 1' });
    if (availableQty < 0) return res.status(602).json({ status: 602, message: 'Available Quantity cannot be negative' });

    const categoryExists = await CATEGORY.findOne({ where: { CategoryID: category } });
    if (!categoryExists) return res.status(603).json({ status: 603, message: 'Category does not exist' });

    const productEntry = await PRODUCTS.create({
      UserID: user.id,
      ProductName: productName,
      Price: price,
      MOQ: MOQ,
      AvailableQty: availableQty,
      ProductImage: img,
      Description: description,
      CategoryID: category
    });

    let imageProcessed = false;

    // Manual upload
    if (req.file) {
      const newFileName = `${productEntry.ProductID}${path.extname(req.file.originalname)}`;
      const oldPath = path.join(imageFolderPath, req.file.filename);
      const newPath = path.join(imageFolderPath, newFileName);

      fs.rename(oldPath, newPath, (err) => {
        if (err) {
          console.error('Error renaming file:', err);
          fs.unlink(oldPath, (err2) => {
            if (err2) console.error(err2);
          });
          return res.status(405).json({ status: 405, message: 'Error uploading image', data: productEntry.get() });
        }
      });

      productEntry.ProductImage = newFileName;
      await productEntry.save();
      imageProcessed = true;
    }
    // Auto image
    else if (useAutoImage === 'true' || useAutoImage === true) {
      try {
        const imageResult = await generateProductImage(productName, categoryExists.CategoryName);
        if (imageResult.success) {
          productEntry.ProductImage = imageResult.imagePath;
          await productEntry.save();
          imageProcessed = true;
        }
      } catch (autoImageError) {
        console.error('Error in auto image generation:', autoImageError);
      }
    }

    // Enhanced response with verification info
    const responseData = {
      ...productEntry.get(), 
      imageProcessed,
      verification: {
        approved: req.verificationResult.approved,
        confidence: req.verificationResult.confidence,
        reason: req.verificationResult.reason,
        matchedKeywords: req.verificationResult.matchedKeywords
      }
    };

    // Add category warning if present
    if (req.categoryWarning) {
      responseData.categoryWarning = req.categoryWarning;
    }

    res.status(200).json({
      status: 200,
      message: req.categoryWarning 
        ? `Product created successfully. ${req.categoryWarning.message}`
        : 'Product created successfully and verified as agricultural item',
      data: responseData
    });
  } catch (err) {
    if (err.name === 'SequelizeValidationError') {
      res.status(406).json({ status: 406, message: 'Validation error', errors: err.errors.map(e => e.message) });
    } else {
      res.status(407).json({ status: 407, message: `Error creating product: ${err}` });
      console.log(err);
    }
  }
});

//********************************************************************************************************************
// PATCH route to edit product info (SELLERS ONLY!)
router.patch('/edit/:id', checkAuth(['Seller']), async (req, res) => {
  const { id } = req.params;
  const { productName, price, MOQ, availableQty, description, category } = req.body;
  const user = req.user;

  const t = await sequelize.transaction();
  try {
    const product = await PRODUCTS.findOne({ where: { ProductID: id }, transaction: t });
    if (!product) {
      await t.rollback();
      return res.status(601).json({ status: 601, message: 'Invalid product ID' });
    }

    if (product.UserID !== user.id) {
      await t.rollback();
      return res.status(602).json({ status: 602, message: 'User not authorized to edit this product' });
    }

    if (productName) product.ProductName = productName;

    if (price !== undefined) {
      if (price >= 0) product.Price = price;
      else {
        await t.rollback();
        return res.status(603).json({ status: 603, message: 'Price cannot be negative' });
      }
    }

    if (MOQ !== undefined) {
      if (MOQ >= 1) product.MOQ = MOQ;
      else {
        await t.rollback();
        return res.status(604).json({ status: 604, message: 'Minimum Order Quantity cannot be less than 1' });
      }
    }

    if (availableQty !== undefined) {
      if (availableQty >= 0) product.AvailableQty = availableQty;
      else {
        await t.rollback();
        return res.status(605).json({ status: 605, message: 'Available Quantity cannot be negative' });
      }
    }

    if (description) product.Description = description;

    if (category) {
      const categoryExists = await CATEGORY.findOne({ where: { CategoryID: category } });
      if (categoryExists) product.CategoryID = category;
      else {
        await t.rollback();
        return res.status(606).json({ status: 606, message: 'Invalid category' });
      }
    }

    await product.save({ transaction: t });
    await t.commit();
    return res.status(200).json({ status: 200, message: 'Product updated successfully', data: product.get() });
  } catch (err) {
    await t.rollback();
    return res.status(501).json({ status: 501, message: `Error: ${err}` });
  }
});

//********************************************************************************************************************
// route to update product image
router.patch('/imageEdit/:id', checkAuth(['Seller']), upload.single('image'), async (req, res) => {
  const { id: productID } = req.params;
  const user = req.user;

  try {
    const product = await PRODUCTS.findOne({ where: { ProductID: productID } });

    if (req.file) {
      let existingFileName;
      let oldImageExists = 0;

      if (product.ProductImage === 'default.jpg') {
        existingFileName = `${product.ProductID}${path.extname(req.file.originalname)}`;
      } else {
        existingFileName = product.ProductImage;
        oldImageExists = 1;
      }

      const existingPath = path.join(imageFolderPath, existingFileName);
      const newUnrenamedPath = path.join(imageFolderPath, req.file.filename);

      if (user.id !== product.UserID) {
        fs.unlink(newUnrenamedPath, (err) => {
          if (err) console.error(err);
        });
        return res.status(600).json({ status: 600, message: 'User not authorized to edit this product' });
      }

      if (oldImageExists && fs.existsSync(existingPath)) {
        fs.unlink(existingPath, (err) => {
          if (err) console.error(err);
        });
      }

      fs.rename(newUnrenamedPath, existingPath, async (err) => {
        if (err) {
          console.error('Error renaming file:', err);
          fs.unlink(newUnrenamedPath, (err2) => {
            if (err2) console.error(err2);
          });

          product.ProductImage = 'default.jpg';
          await product.save();
          return res.status(601).json({ status: 601, message: 'Error uploading new image', data: product.get() });
        }
      });

      product.ProductImage = existingFileName;
      await product.save();

      return res.status(200).json({ status: 200, message: 'Product image updated successfully', data: product.get() });
    }

    return res.status(602).json({ status: 602, message: 'No image uploaded' });
  } catch (err) {
    return res.status(603).json({ status: 603, message: `Error: ${err}` });
  }
});

//********************************************************************************************************************
// route to change product status between active / inactive (Only if not product status is not Suspended)

//********************************************************************************************************************
// route to delete product (Seller & Admin only)
router.patch('/toggleStatus', checkAuth(['Seller', 'SuperAdmin', 'Admin']), async (req, res) => {
  const { products, newStatus } = req.body; //array of product IDs to delete
  const user = req.user;

  var failedDeletions = [];

  try {
    if (newStatus !== 'Active' && newStatus !== 'Inactive') {
      return res.status(400).json({ status: 400, message: 'Invalid status provided' });
    }

    for (const productID of products) {
      const product = await PRODUCTS.findOne({ where: { ProductID: productID } });

      if (!product) {
        failedDeletions.push({ productID: productID, message: 'Invalid product ID' });
        continue;
      }

      if (user.userAuth === 'Seller' && product.UserID !== user.id) {
        failedDeletions.push({ productID: productID, message: 'User not authorized to edit this product' });
        continue;
      }

      product.ProdStatus = newStatus;
      await product.save();

      if (newStatus === 'Inactive') {
        const cart = await CART.findAll({ where: { ProductID: productID } });
        for (const cartItem of cart) {
          cartItem.destroy();
        }
      }
    }

    return res.status(200).json({ status: 200, message: "Products' status edit completed. Please check data to see if any edits failed.", data: failedDeletions });
  } catch (err) {
    return res.status(401).json({ status: 401, message: `Error: ${err}` });
  }
});

//********************************************************************************************************************
// NEW API ENDPOINTS FOR CLIENT REQUIREMENTS

// Enhanced route to verify product before creation (dry-run)
router.post('/verify-product', checkAuth(['Seller']), async (req, res) => {
  try {
    const { productName, description } = req.body;

    if (!productName || !description) {
      return res.status(400).json({
        status: 400,
        message: 'Product name and description are required for verification'
      });
    }

    const verificationResult = await verifyProductSuitability(productName, description);

    res.status(200).json({
      status: 200,
      message: verificationResult.approved 
        ? 'Product verification passed - ready for listing'
        : 'Product verification failed - cannot be listed',
      data: verificationResult
    });
  } catch (error) {
    console.error('Error in product verification:', error);
    res.status(500).json({
      status: 500,
      message: 'Error verifying product'
    });
  }
});

// Route to suggest category based on product description
router.post('/suggest-category', checkAuth(['Seller']), async (req, res) => {
  try {
    const { productName, description } = req.body;

    if (!productName || !description) {
      return res.status(400).json({
        status: 400,
        message: 'Product name and description are required for category suggestion'
      });
    }

    const suggestion = await suggestCategory(productName, description);

    res.status(200).json({
      status: 200,
      message: 'Category suggestion generated successfully',
      data: suggestion
    });
  } catch (error) {
    console.error('Error in category suggestion:', error);
    res.status(500).json({
      status: 500,
      message: 'Error generating category suggestion'
    });
  }
});

// Route to get available categories with their keywords
router.get('/categories-info', async (req, res) => {
  try {
    const categoriesInfo = getAvailableCategories();

    res.status(200).json({
      status: 200,
      message: 'Categories information retrieved successfully',
      data: categoriesInfo
    });
  } catch (error) {
    console.error('Error getting categories info:', error);
    res.status(500).json({
      status: 500,
      message: 'Error retrieving categories information'
    });
  }
});

// Route to generate real image for product using Unsplash API
router.post('/generate-image', checkAuth(['Seller']), async (req, res) => {
  try {
    const { productName, category } = req.body;

    if (!productName) {
      return res.status(400).json({
        status: 400,
        message: 'Product name is required for image generation'
      });
    }

    console.log(`🎨 Generating image for: ${productName} (${category})`);
    
    // Use real Unsplash API to generate image
    const result = await generateProductImage(productName, category);
    
    if (result.success) {
      res.status(200).json({
        status: 200,
        message: 'Real image generated and downloaded successfully from Unsplash',
        data: {
          imagePath: result.imagePath,
          imageInfo: {
            photographer: result.imageInfo.photographer,
            photographerUrl: result.imageInfo.photographerUrl,
            source: 'Unsplash API',
            note: 'High-quality image downloaded from Unsplash and saved to server'
          }
        }
      });
    } else {
      // Fallback to demo mode if API fails
      const timestamp = Date.now();
      const sanitizedName = productName.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
      const imagePath = `demo_${sanitizedName}_${timestamp}.jpg`;
      
      res.status(200).json({
        status: 200,
        message: 'Fallback: Demo image generated (Unsplash API unavailable)',
        data: {
          imagePath: imagePath,
          imageInfo: {
            photographer: 'Demo System',
            photographerUrl: '#',
            source: 'Demo Mode',
            note: 'Unsplash API failed, using demo mode. Error: ' + result.error,
            error: result.error
          }
        }
      });
    }
  } catch (error) {
    console.error('Error generating image:', error);
    res.status(500).json({
      status: 500,
      message: 'Error generating product image',
      error: error.message
    });
  }
});

// Route to get multiple image options for selection
router.post('/image-options', checkAuth(['Seller']), async (req, res) => {
  try {
    const { productName, category, count = 5 } = req.body;

    if (!productName) {
      return res.status(400).json({
        status: 400,
        message: 'Product name is required'
      });
    }

    let categoryName = category;
    if (category && !isNaN(category)) {
      const categoryRecord = await CATEGORY.findOne({ where: { CategoryID: category } });
      categoryName = categoryRecord ? categoryRecord.CategoryName : '';
    }

    const imageOptions = await getImageOptions(productName, categoryName, count);

    res.status(200).json({
      status: 200,
      message: 'Image options retrieved successfully',
      data: imageOptions
    });
  } catch (error) {
    console.error('Error getting image options:', error);
    res.status(500).json({
      status: 500,
      message: 'Error retrieving image options'
    });
  }
});

// Route to track product views (Feature 3: View Counter)
router.post('/track-view/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    const userToken = req.headers['authorization'];
    const userAgent = req.headers['user-agent'];

    const product = await PRODUCTS.findOne({ where: { ProductID: productId } });
    if (!product) {
      return res.status(404).json({
        status: 404,
        message: 'Product not found'
      });
    }

    let userId = null;

    if (userToken) {
      try {
        const tokenData = await verifyToken(userToken);
        userId = tokenData.id;
      } catch (error) {
        console.log('Anonymous view tracked');
      }
    }

    await PRODUCT_VIEWS.create({
      ProductID: productId,
      UserID: userId,
      UserAgent: userAgent
    });

    res.status(200).json({
      status: 200,
      message: 'Product view tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking product view:', error);
    res.status(500).json({
      status: 500,
      message: 'Error tracking product view'
    });
  }
});

// Route to get product view statistics
router.get('/view-stats/:id', async (req, res) => {
  try {
    const productId = req.params.id;

    const totalViews = await PRODUCT_VIEWS.count({
      where: { ProductID: productId }
    });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentViews = await PRODUCT_VIEWS.count({
      where: {
        ProductID: productId,
        ViewedAt: {
          [Op.gte]: sevenDaysAgo
        }
      }
    });

    res.status(200).json({
      status: 200,
      message: 'View statistics retrieved successfully',
      data: {
        totalViews,
        recentViews,
        productId: productId
      }
    });
  } catch (error) {
    console.error('Error getting view stats:', error);
    res.status(500).json({
      status: 500,
      message: 'Error retrieving view statistics'
    });
  }
});

// Route to get popular products (most viewed)
router.get('/popular', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const productsWithViews = await sequelize.query(`
            SELECT 
                p.ProductID,
                p.ProductName,
                p.Price,
                p.DiscPrice,
                p.PromoActive,
                p.CategoryID,
                p.Description,
                p.AvailableQty,
                p.ProdStatus,
                COUNT(pv.ViewID) as viewCount
            FROM PRODUCTS p
            LEFT JOIN PRODUCT_VIEWS pv ON p.ProductID = pv.ProductID
            WHERE p.ProdStatus = 'Active'
            GROUP BY p.ProductID
            ORDER BY viewCount DESC
            LIMIT :limit
        `, {
      replacements: { limit },
      type: sequelize.QueryTypes.SELECT
    });

    res.status(200).json({
      status: 200,
      message: 'Popular products retrieved successfully',
      data: productsWithViews
    });
  } catch (error) {
    console.error('Error getting popular products:', error);
    res.status(500).json({
      status: 500,
      message: 'Error retrieving popular products'
    });
  }
});

//********************************************************************************************************************
// RECOMMENDATION SYSTEM ENDPOINTS

// Route to get personalized recommendations for a user
router.get('/recommendations/user', checkAuth(['User', 'Seller', 'Admin', 'SuperAdmin']), async (req, res) => {
  try {
    const user = req.user;
    const limit = parseInt(req.query.limit) || 8;

    const userViews = await PRODUCT_VIEWS.findAll({
      where: { UserID: user.id },
      include: [{
        model: PRODUCTS,
        where: { ProdStatus: 'Active' },
        include: [{
          model: CATEGORY,
          attributes: ['CategoryName']
        }]
      }],
      order: [['ViewedAt', 'DESC']],
      limit: 10
    });

    const viewedProductIds = userViews.map(view => view.ProductID);
    const viewedCategories = [...new Set(userViews.map(view => view.PRODUCT.CategoryID))];

    let recommendations = [];

    if (viewedProductIds.length > 0) {
      const coViewedProducts = await sequelize.query(`
                SELECT 
                    p.ProductID,
                    p.ProductName,
                    p.Price,
                    p.DiscPrice,
                    p.PromoActive,
                    p.ProductImage,
                    p.Description,
                    p.CategoryID,
                    p.AvailableQty,
                    COUNT(pv.ViewID) as coViewCount
                FROM PRODUCTS p
                INNER JOIN PRODUCT_VIEWS pv ON p.ProductID = pv.ProductID
                WHERE p.ProdStatus = 'Active' 
                    AND p.ProductID NOT IN (${viewedProductIds.join(',')})
                    AND pv.UserID IN (
                        SELECT DISTINCT UserID 
                        FROM PRODUCT_VIEWS 
                        WHERE ProductID IN (${viewedProductIds.join(',')})
                        AND UserID IS NOT NULL
                    )
                GROUP BY p.ProductID
                ORDER BY coViewCount DESC, p.ProductID DESC
                LIMIT ${Math.ceil(limit * 0.6)}
            `, { type: sequelize.QueryTypes.SELECT });

      recommendations = [...recommendations, ...coViewedProducts];
    }

    if (recommendations.length < limit && viewedCategories.length > 0) {
      const categoryRecommendations = await PRODUCTS.findAll({
        where: {
          ProdStatus: 'Active',
          CategoryID: { [Op.in]: viewedCategories },
          ProductID: {
            [Op.notIn]: [
              ...viewedProductIds,
              ...recommendations.map(r => r.ProductID)
            ]
          }
        },
        order: sequelize.literal('RANDOM()'),
        limit: limit - recommendations.length
      });

      recommendations = [...recommendations, ...categoryRecommendations];
    }

    if (recommendations.length < limit) {
      const popularProducts = await sequelize.query(`
                SELECT 
                    p.ProductID,
                    p.ProductName,
                    p.Price,
                    p.DiscPrice,
                    p.PromoActive,
                    p.ProductImage,
                    p.Description,
                    p.CategoryID,
                    p.AvailableQty,
                    COUNT(pv.ViewID) as viewCount
                FROM PRODUCTS p
                LEFT JOIN PRODUCT_VIEWS pv ON p.ProductID = pv.ProductID
                WHERE p.ProdStatus = 'Active'
                    AND p.ProductID NOT IN (${[...viewedProductIds, ...recommendations.map(r => r.ProductID)].join(',') || '0'})
                GROUP BY p.ProductID
                ORDER BY viewCount DESC, p.ProductID DESC
                LIMIT ${limit - recommendations.length}
            `, { type: sequelize.QueryTypes.SELECT });

      recommendations = [...recommendations, ...popularProducts];
    }

    res.status(200).json({
      status: 200,
      message: 'Personalized recommendations retrieved successfully',
      data: {
        recommendations: recommendations.slice(0, limit),
        recommendationType: 'personalized',
        basedOn: viewedProductIds.length > 0 ? 'viewing_history' : 'popular_products'
      }
    });
  } catch (error) {
    console.error('Error getting user recommendations:', error);
    res.status(500).json({
      status: 500,
      message: 'Error retrieving recommendations'
    });
  }
});

// Route to get product-based recommendations (similar products)
router.get('/recommendations/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const limit = parseInt(req.query.limit) || 6;

    const baseProduct = await PRODUCTS.findOne({
      where: { ProductID: productId, ProdStatus: 'Active' }
    });

    if (!baseProduct) {
      return res.status(404).json({
        status: 404,
        message: 'Product not found'
      });
    }

    let recommendations = [];

    const coViewedProducts = await sequelize.query(`
            SELECT DISTINCT
                p.ProductID,
                p.ProductName,
                p.Price,
                p.DiscPrice,
                p.PromoActive,
                p.ProductImage,
                p.Description,
                p.CategoryID,
                p.AvailableQty,
                COUNT(pv2.ViewID) as coViewCount
            FROM PRODUCTS p
            INNER JOIN PRODUCT_VIEWS pv2 ON p.ProductID = pv2.ProductID
            WHERE p.ProdStatus = 'Active' 
                AND p.ProductID != :productId
                AND pv2.UserID IN (
                    SELECT DISTINCT UserID 
                    FROM PRODUCT_VIEWS 
                    WHERE ProductID = :productId AND UserID IS NOT NULL
                )
            GROUP BY p.ProductID
            ORDER BY coViewCount DESC
            LIMIT ${Math.ceil(limit * 0.5)}
        `, {
      replacements: { productId },
      type: sequelize.QueryTypes.SELECT
    });

    recommendations = [...recommendations, ...coViewedProducts];

    const priceMin = baseProduct.Price * 0.5;
    const priceMax = baseProduct.Price * 1.5;

    const similarProducts = await PRODUCTS.findAll({
      where: {
        ProdStatus: 'Active',
        CategoryID: baseProduct.CategoryID,
        ProductID: {
          [Op.notIn]: [
            parseInt(productId),
            ...recommendations.map(r => r.ProductID)
          ]
        },
        Price: {
          [Op.between]: [priceMin, priceMax]
        }
      },
      order: sequelize.literal('RANDOM()'),
      limit: limit - recommendations.length
    });

    recommendations = [...recommendations, ...similarProducts];

    if (recommendations.length < limit) {
      const sellerProducts = await PRODUCTS.findAll({
        where: {
          ProdStatus: 'Active',
          UserID: baseProduct.UserID,
          ProductID: {
            [Op.notIn]: [
              parseInt(productId),
              ...recommendations.map(r => r.ProductID)
            ]
          }
        },
        order: sequelize.literal('RANDOM()'),
        limit: limit - recommendations.length
      });

      recommendations = [...recommendations, ...sellerProducts];
    }

    res.status(200).json({
      status: 200,
      message: 'Product recommendations retrieved successfully',
      data: {
        baseProduct: baseProduct,
        recommendations: recommendations.slice(0, limit),
        recommendationType: 'product_based'
      }
    });
  } catch (error) {
    console.error('Error getting product recommendations:', error);
    res.status(500).json({
      status: 500,
      message: 'Error retrieving product recommendations'
    });
  }
});

// Route to get trending/popular recommendations
router.get('/recommendations/trending', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    const category = req.query.category;

    let whereClause = 'p.ProdStatus = "Active"';
    let replacements = { limit };

    if (category && category !== 'all') {
      whereClause += ' AND p.CategoryID = :category';
      replacements.category = category;
    }

    const trendingProducts = await sequelize.query(`
            SELECT 
                p.ProductID,
                p.ProductName,
                p.Price,
                p.DiscPrice,
                p.PromoActive,
                p.ProductImage,
                p.Description,
                p.CategoryID,
                p.AvailableQty,
                COUNT(pv.ViewID) as recentViews,
                AVG(pv.ViewedAt) as avgViewDate
            FROM PRODUCTS p
            LEFT JOIN PRODUCT_VIEWS pv ON p.ProductID = pv.ProductID 
                AND pv.ViewedAt >= datetime('now', '-7 days')
            WHERE ${whereClause}
            GROUP BY p.ProductID
            ORDER BY recentViews DESC, avgViewDate DESC, p.ProductID DESC
            LIMIT :limit
        `, { replacements, type: sequelize.QueryTypes.SELECT });

    res.status(200).json({
      status: 200,
      message: 'Trending recommendations retrieved successfully',
      data: {
        recommendations: trendingProducts,
        recommendationType: 'trending',
        timeframe: 'last_7_days',
        category: category || 'all'
      }
    });
  } catch (error) {
    console.error('Error getting trending recommendations:', error);
    res.status(500).json({
      status: 500,
      message: 'Error retrieving trending recommendations'
    });
  }
});

// Route to get category-based recommendations
router.get('/recommendations/category/:categoryId', async (req, res) => {
  try {
    const { categoryId } = req.params;
    const limit = parseInt(req.query.limit) || 8;

    const categoryRecommendations = await sequelize.query(`
            SELECT 
                p.ProductID,
                p.ProductName,
                p.Price,
                p.DiscPrice,
                p.PromoActive,
                p.ProductImage,
                p.Description,
                p.CategoryID,
                p.AvailableQty,
                COUNT(pv.ViewID) as viewCount
            FROM PRODUCTS p
            LEFT JOIN PRODUCT_VIEWS pv ON p.ProductID = pv.ProductID
            WHERE p.ProdStatus = 'Active' AND p.CategoryID = :categoryId
            GROUP BY p.ProductID
            ORDER BY viewCount DESC, p.ProductID DESC
            LIMIT :limit
        `, {
      replacements: { categoryId, limit },
      type: sequelize.QueryTypes.SELECT
    });

    const category = await CATEGORY.findOne({
      where: { CategoryID: categoryId },
      attributes: ['CategoryName']
    });

    res.status(200).json({
      status: 200,
      message: 'Category recommendations retrieved successfully',
      data: {
        recommendations: categoryRecommendations,
        recommendationType: 'category_based',
        category: category ? category.CategoryName : 'Unknown',
        categoryId: categoryId
      }
    });
  } catch (error) {
    console.error('Error getting category recommendations:', error);
    res.status(500).json({
      status: 500,
      message: 'Error retrieving category recommendations'
    });
  }
});

//********************************************************************************************************************
// GET route to fetch a single product OR products of a category OR seller ID
// IMPORTANT: Keep this route LAST to avoid conflicts with specific routes
router.get('/:searchBy/:id', async (req, res) => {
  const { searchBy } = req.params;
  let id;

  const userToken = req.headers['authorization'];

  if (userToken) {
    const temp = await verifyToken(userToken);
    id = temp.id;
    console.log('id: ', id);
  } else {
    id = req.params.id;
  }

  if (!searchBy || !id) {
    return res.status(401).json({ status: 401, message: 'Required parameters (searchBy or id) not provided.' });
  }

  if (searchBy === 'category') {
    try {
      const products = await PRODUCTS.findAll({ where: { CategoryID: id } });
      if (products.length === 0) {
        return res.status(402).json({ status: 402, message: `No products found for category ID=${id}` });
      }
      res.status(200).json({ status: 200, message: 'Product by category fetched successfully', data: products });
    } catch (err) {
      res.status(403).json({ status: 403, message: `Error fetching products: ${err}` });
    }
  } else if (searchBy === 'product') {
    try {
      const product = await PRODUCTS.findOne({ 
        where: { ProductID: id },
        include: [{
          model: USERS,
          attributes: ['UserID', 'Username', 'FirstName', 'LastName', 'UserAuth'],
          required: false // LEFT JOIN in case user doesn't exist
        }]
      });
      if (!product) {
        return res.status(404).json({ status: 404, message: `Product ID ${id} does not exist` });
      }
      
      // Add seller information to the response
      const productWithSeller = {
        ...product.toJSON(),
        Seller: product.USER ? {
          UserID: product.USER.UserID,
          Username: product.USER.Username,
          FirstName: product.USER.FirstName,
          LastName: product.USER.LastName,
          UserAuth: product.USER.UserAuth
        } : null
      };
      
      res.status(200).json({ 
        status: 200, 
        message: 'Single product with seller info fetched successfully', 
        data: productWithSeller 
      });
    } catch (err) {
      console.error('Error fetching product with seller:', err);
      res.status(403).json({ status: 403, message: `Error fetching product: ${err}` });
    }
  } else if (searchBy === 'seller') {
    try {
      const products = await PRODUCTS.findAll({ where: { UserID: id } });
      if (products.length === 0) {
        return res.status(405).json({ status: 405, message: `No products found for seller ID=${id}` });
      }
      res.status(200).json({ status: 200, message: 'Product by seller fetched successfully', data: products });
    } catch (err) {
      res.status(406).json({ status: 406, message: `Error fetching products: ${err}` });
    }
  } else {
    return res.status(405).json({ status: 405, message: 'Invalid searchBy parameter' });
  }
});

module.exports = router;
