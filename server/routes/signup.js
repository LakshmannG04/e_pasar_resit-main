// server/routes/signup.js - Signup Endpoint
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const { USERS, SELLER_INFO } = require('../models');
const { checkAuth } = require('../functions/checkAuth');


// POST route to handle user signup
router.post('/', async (req, res) => {
  const { username, password, email, firstName, lastName, contactNo } = req.body;

   // Input validation
   if (!username || !password || !email || !firstName || !lastName || !contactNo ) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Hash the user's password before storing it in the database
    const hashedPassword = await bcrypt.hash(password, 12).catch((err) => {
      console.error('Error hashing password:', err);
      res.status(401).send('Error hashing password');
      return; // Prevents further execution after sending an error response
    });

    if (!hashedPassword) {
      return; // Make sure the flow stops if password hashing fails
    }

    const newUser = await USERS.create({
      Username: username,
      Password: hashedPassword,
      Email: email,
      FirstName: firstName,
      LastName: lastName,
      ContactNo: contactNo,
      UserAuth: 'User',
    });

    // Create JWT token for automatic login after signup
    const token = jwt.sign(
      { id: newUser.UserID, userAuth: newUser.UserAuth },
      process.env.JWT_SECRET_KEY,
      { expiresIn: '24h' }
    );

    res.status(200).json({ 
      status: 200, 
      message: 'Sign Up successful',
      data: token
    });

    } 
  catch (err) {
    console.error('Error during signup process:', err);
    
    // Handle specific database errors
    if (err.name === 'SequelizeUniqueConstraintError') {
      if (err.fields && err.fields.Username) {
        return res.status(400).json({ status: 400, message: 'Username already exists' });
      }
      if (err.fields && err.fields.Email) {
        return res.status(400).json({ status: 400, message: 'Email already exists' });
      }
    }
    
    res.status(500).json({ status: 500, message: 'Error registering user' });
  }
});



router.post('/seller', checkAuth(['User']), async (req, res) => {
  const {comRegNum, comAddress} = req.body;

  const user = req.user;

  if (!comRegNum || !comAddress) {
    return res.status(400).json({ status: 400, message: 'Required fields not provided.' });
  }

  try {
    const seller = await SELLER_INFO.create({
      UserID: user.id,
      ComRegNum: comRegNum,
      ComAddress: comAddress,
      IsVerified: 'Pending',
    });

    res.status(200).json({ status: 200, message: 'Seller application submitted successfully' });

  } catch (err) {
    console.error('Error submitting seller application:', err);
    res.status(400).json({ status: 400, message: `Error submitting seller application: ${err}` });
  }

});

module.exports = router;