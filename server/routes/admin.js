// server/routes/admin.js - Admin Endpoint
const express = require('express');
const router = express.Router();

const { USERS, SELLER_INFO } = require('../models');
const { Op, where } = require('sequelize');
const bcrypt = require('bcrypt');
const { checkAuth } = require('../functions/checkAuth');



// GET route to fetch user and seller accounts (admin/superAdmin only)
router.get('/users', checkAuth(['SuperAdmin', 'Admin']), async (req, res) => {
  
  const loggedInUser = req.user;
  let returnUserAuth;

  try {

    if (loggedInUser.userAuth === 'SuperAdmin') {
      returnUserAuth = ['User', 'Seller', 'Admin'];
    } else {
      returnUserAuth = ['User', 'Seller'];
    }

    const users = await USERS.findAll({
      attributes: ['UserID', 'Username', 'Email', 'FirstName', 'LastName', 'ContactNo', 'UserAuth', 'AccountState'],
      include: [{
        model: SELLER_INFO,
        attributes: ['IsVerified'], // Get seller status
        required: false // Left join, in case not all users applied as sellers
    }],
      where: { UserAuth: {[Op.in]: returnUserAuth} } // Fetch only User and Seller accounts
    });

    if (users.length === 0) {
      return res.status(200).json({ status: 200, message: users });
    }

    res.status(200).json({ status: 200, message: 'Users fetched successfully', data: users });
  } catch (err) {
    console.log('Error fetching users:', err);
    res.status(400).json({ status: 400, message: `Error fetching users: ${err}` });
  }
});



// GET route to fetch all seller applications info (admin/superAdmin only)
router.get('/seller_application/:id', checkAuth(['SuperAdmin', 'Admin']), async (req, res) => {
  
  const userID = req.params.id;

  try {
    const applicationInfo = await SELLER_INFO.findOne({
      attributes: ['UserID', 'ComRegNum', 'ComAddress', 'IsVerified'],
      include: [{
        model: USERS,
        attributes: ['Username', 'Email', 'FirstName', 'LastName', 'ContactNo']
      }],
      where: { UserID: userID }
    });

    if (!applicationInfo) {
      return res.status(400).json({ status: 400, message: "Application not found for the given ID" });
    }

    return res.status(200).json({ status: 200, message: 'Seller application fetched successfully', data: applicationInfo });
  } catch (err) {
    console.log('Error fetching seller applications:', err);
    res.status(401).json({ status: 401, message: `Error fetching seller application: ${err}` });
  }
});



// PATCH /changeAccountStatus - Suspend a user by ID
router.patch('/changeAccountStatus', checkAuth(['SuperAdmin', 'Admin']), async (req, res) => {
  const { id, state } = req.body;
  const adminUser = req.user;

  if (!id) {
      return res.status(400).json({ message: 'User ID is required' });
  }

  try {
      const user = await USERS.findOne({ where: { UserID: id } });

      if (!user) {
          return res.status(401).json({ status: 401, message: 'Invalid user ID' });
      }

      if (user.UserAuth === 'SuperAdmin') {
          return res.status(402).json({ status: 402, message: 'Cannot suspend SuperAdmin accounts' });
      }

      if (adminUser.userAuth === 'Admin' && user.UserAuth === 'Admin') {
          return res.status(403).json({ status: 403, message: 'Admins cannot suspend other Admin accounts' });
      }

      user.AccountState = state;
      await user.save();

      if (state === 'Suspended') {
        returnMessage = 'User suspended successfully';
      }
      else {
        returnMessage = 'User account activated successfully';
      }

      return res.status(200).json({ status: 200, message: returnMessage });


  } catch (err) {
      console.error('Error suspending user:', err);
      return res.status(404).json({ status: 404, message: `Error suspending user: ${err}` });
  }
});




// PATCH /approve-seller - Approve a seller registration
router.patch('/approve-seller', checkAuth(['SuperAdmin', 'Admin']), async (req, res) => {
  
  const { id } = req.body;

  try {
      const seller = await SELLER_INFO.findOne({ where: { UserID: id } });

      if (!seller) {
          return res.status(400).json({ status: 400, message: 'ID not associated with a seller application' });
      }

      if (seller.IsVerified === 'Approved') {
          return res.status(401).json({ status: 401, message: 'Seller application is already processed' });
      }

      const user = await USERS.findOne({where: {UserID: id}});

      if (!user) {
          return res.status(402).json({ status: 402, message: 'Database entries inconsistent' });
      }

      seller.IsVerified = 'Approved';
      await seller.save();

      user.UserAuth = 'Seller';
      await user.save();

      return res.status(200).json({ status: 200, message: 'Seller approved successfully' });

  } catch (err) {
      console.error('Error approving seller:', err);
      res.status(403).json({ status: 403, message: `Error approving seller: ${err}` });
  }
});


// PATCH /reject-seller - Reject a seller registration
router.patch('/reject-seller', checkAuth(['SuperAdmin', 'Admin']), async (req, res) => {
  const { id } = req.body;

  try {
    const seller = await SELLER_INFO.findOne({ where: { UserID: id } });

    if (!seller){
      return res.status(400).json({ status: 400, message: 'ID not associated with a seller application' });
    }

    if (seller.IsVerified === 'Rejected') {
      return res.status(401).json({ status: 401, message: 'Seller application has already been processed' });
    }

    seller.IsVerified = 'Rejected';
    await seller.save();

    return res.status(200).json({ status: 200, message: 'Seller application rejected successfully' });

  } catch (err) {
    console.error('Error rejecting seller application:', err);
    res.status(402).json({ status: 402, message: `Error rejecting seller application: ${err}` });
  }


});



// POST /add-admin - Add a new Admin account (SuperAdmin only)
router.post('/add-admin', checkAuth(['SuperAdmin']), async (req, res) => {

  const { username, password, firstName, lastName, email, contactNo } = req.body;

  try {
      const hashedPassword = await bcrypt.hash(password, 12);

      await USERS.create({
          Username: username,
          Password: hashedPassword,
          FirstName: firstName,
          LastName: lastName,
          Email: email,
          ContactNo: contactNo,
          UserAuth: 'Admin'
      });

      return res.status(200).json({ status: 200, message: 'Admin account created successfully' });

  } catch (err) {
      console.error('Error creating admin:', err);
      return res.status(400).json({ status: 400, message: `Error creating admin account: ${err}` });
  }
});


module.exports = router;