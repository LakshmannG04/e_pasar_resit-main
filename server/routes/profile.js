const express = require('express');
const { USERS } = require('../models');
const { checkAuth } = require('../functions/checkAuth');
const router = express.Router();

// GET /profile - Fetch User Profile
router.get('/', checkAuth(['SuperAdmin', 'Admin', 'Seller', 'User']), async (req, res) => {
  const user = req.user;
  try {
    const userProfile = await USERS.findOne({
      attributes: ['UserID', 'Username', 'Email', 'FirstName', 'LastName', 'ContactNo', 'UserAuth'],
      where: { UserID: user.id },
    });

    if (!userProfile) {
      return res.status(404).json({ status: 404, message: 'User not found' });
    }

    return res.status(200).json({ status: 200, data: userProfile });
  } catch (err) {
    console.error('Error fetching profile:', err);
    res.status(500).json({ status: 500, message: `Error fetching profile: ${err}` });
  }
});

// PATCH /profile - Update User Profile
router.patch('/', checkAuth(['SuperAdmin', 'Admin', 'Seller', 'User']), async (req, res) => {
  const user = req.user;
  const { FirstName, LastName, Email, ContactNo } = req.body;

  try {
    const userProfile = await USERS.findOne({ where: { UserID: user.id } });

    if (!userProfile) {
      return res.status(404).json({ status: 404, message: 'User not found' });
    }

    if (FirstName !== undefined) userProfile.FirstName = FirstName;
    if (LastName !== undefined) userProfile.LastName = LastName;
    if (Email !== undefined) userProfile.Email = Email;
    if (ContactNo !== undefined) userProfile.ContactNo = ContactNo;

    await userProfile.save();

    res.status(200).json({ status: 200, message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ status: 500, message: `Error updating profile: ${err}` });
  }
});

module.exports = router;
