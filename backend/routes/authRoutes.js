const express = require('express');
const router = express.Router();
const { forgotPassword, resetPassword, loginUser, registerUser, getUserProfile, updateUserProfile, updatePassword } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgot-password', forgotPassword); // Step 1
router.post('/reset-password', resetPassword);   // Step 2

router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.put('/password', protect, updatePassword);

module.exports = router;