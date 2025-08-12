// server/routes/productRoute.js - Product Endpoint
const express = require('express');
const router = express.Router();
const { checkAuth } = require('../functions/checkAuth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const { CATEGORY } = require('../models');

const imageFolderPath = path.join(__dirname, '..', 'images/categories');

//********************************************************************************************************************
// GET route to fetch all category types
router.get('/', async (req, res) => {
  try {
    const category = await CATEGORY.findAll();
    if (category.length === 0) {
      return res.status(401).json({ status: 401, message: 'Category table is empty in database' });
    }
    res.status(200).json({ status: 200, message: 'Category names fetched successfully', data: category });
  } catch (err) {
    console.error('Error fetching category: ', err);
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
// ROUTE TO FETCH IMAGES OF CATEGORIES (serve actual bytes)
router.get('/image/:id', async (req, res) => {
  try {
    const category = await CATEGORY.findOne({ where: { CategoryID: req.params.id } });
    if (!category) {
      return res.status(401).json({ status: 401, message: 'Invalid category id' });
    }

    const file = category.CategoryImage || 'default.jpg';
    const imagePath = path.join(imageFolderPath, file);
    if (!fs.existsSync(imagePath)) {
      return res.status(402).json({ status: 402, message: 'Image does not exist in server. Please upload new image.' });
    }

    const ext = path.extname(file).toLowerCase();
    const mime =
      ext === '.png' ? 'image/png' :
      ext === '.svg' ? 'image/svg+xml' :
      'image/jpeg';

    res.setHeader('Content-Type', mime);
    return fs.createReadStream(imagePath).pipe(res);
  } catch (err) {
    console.error('Error fetching category image: ', err);
    res.status(403).json({ status: 403, message: 'Error fetching category image' });
  }
});

//********************************************************************************************************************
// POST route to create a new category (ADMIN ONLY!)

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

// ACTUAL POST route to create a new category
router.post('/', checkAuth(['Admin', 'SuperAdmin']), upload.single('image'), async (req, res) => {
  try {
    const { categoryName } = req.body;
    if (!categoryName) {
      return res.status(403).json({ status: 403, message: 'Category name not provided' });
    }

    let img = 'default.jpg';

    const categoryEntry = await CATEGORY.create({ CategoryName: categoryName, CategoryImage: img });

    if (req.file) {
      const newFileName = `${categoryEntry.CategoryID}${path.extname(req.file.originalname)}`;
      const oldPath = path.join(imageFolderPath, req.file.filename);
      const newPath = path.join(imageFolderPath, newFileName);

      fs.rename(oldPath, newPath, (err) => {
        if (err) {
          console.error('Error renaming file:', err);
          fs.unlink(oldPath, (err2) => {
            if (err2) console.error(err2);
          });
          return res.status(404).json({ status: 404, message: 'Error uploading image', data: categoryEntry.get() });
        }
      });

      categoryEntry.CategoryImage = newFileName;
      await categoryEntry.save();
    }

    res.status(200).json({ status: 200, message: 'New category created successfully', data: categoryEntry.get() });
  } catch (err) {
    if (err.name === 'SequelizeValidationError') {
      res.status(404).json({ status: 405, message: 'Validation error', errors: err.errors.map(e => e.message) });
    } else {
      res.status(405).json({ status: 406, message: `Error creating new category: ${err}` });
      console.log(err);
    }
  }
});

module.exports = router;
