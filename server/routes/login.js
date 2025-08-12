// server/routes/loginRoute.js - Login Endpoint
require('dotenv').config();
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

//getting reference to the USERS table from database
const { USERS } = require('../models');

//getting the secret key from the environment variable
const SECRET_KEY = process.env.JWT_SECRET_KEY;


// POST route to handle user login
router.post('/', async (req, res) => {
  const { username, password } = req.body;
  console.log('[LOGIN] Body:', req.body);

  try {

    if (!username || !password) {
      return res.status(400).json({ status: 400, message: 'Username and password required' });
    }

    // Fetch user from the database
    const result = await USERS.findOne({ where: { Username: username } });
    console.log('[LOGIN] Found user?', !!result);


    if (!result) {
      return res.status(404).json({ status: 404, message: 'User not found' });
    }

    if(result.AccountState === 'Suspended'){
      return res.status(402).json({ status: 402, message: 'Account is suspended' });
    }


    // Compare provided password with stored hashed password
    const isValidPassword = await bcrypt.compare(password, result.Password);
    console.log('[LOGIN] Password match?', isValidPassword);

    if (!isValidPassword) {
      return res.status(401).json({ status: 401, message: 'Invalid password' });
    }
    else{
      // Login Success
      const user = { id: result.UserID, username: result.Username, userAuth: result.UserAuth };
      const token = jwt.sign(user, SECRET_KEY, { expiresIn: '0.3h' });
      const returnData = { token, userAuth: user.userAuth };
      res.status(200).json({ status: 200, message: 'Login successful', data: returnData });
    }
    
    
    
  }
  catch (err) {
    console.log('Error during login process:', err);
    res.status(500).send('Error logging in');
  }
});

module.exports = router;
