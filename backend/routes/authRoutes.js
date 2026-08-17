const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  loginUser, 
  getUserProfile, 
  updateProfile, 
  updatePassword, 
  resetPassword 
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// @route   POST /api/auth/register
router.post('/register', registerUser);

// @route   POST /api/auth/login
router.post('/login', loginUser);

// @route   GET /api/auth/profile
router.get('/profile', protect, getUserProfile);

// @route   PUT /api/auth/profile
router.put('/profile', protect, updateProfile);

// @route   PUT /api/auth/password
router.put('/password', protect, updatePassword);

// @route   POST /api/auth/reset-password
router.post('/reset-password', resetPassword);

module.exports = router;