const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// @desc    Register new user & collect biometrics
// @route   POST /api/auth/register
const registerUser = async (req, res) => {
  try {
    const { email, password, dob, weight, goal } = req.body;

    // 1. Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    // 2. Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 3. Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      dob,
      weight,
      goal,
      weightHistory: [{ weight, date: new Date() }] // Log initial weight
    });

    if (user) {
      res.status(201).json({
        _id: user.id,
        email: user.email,
        token: generateToken(user._id)
      });
    } else {
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Authenticate a user & get JWT
// @route   POST /api/auth/login
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check if user exists in the database
    const user = await User.findOne({ email });

    // 2. Compare the plain text password with the hashed password in the DB
    if (user && (await bcrypt.compare(password, user.password))) {
      res.status(200).json({
        _id: user.id,
        email: user.email,
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get user profile data
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = req.user; 
    
    if (user) {
      res.status(200).json({
        email: user.email,
        dob: user.dob,
        weight: user.weight,
        goal: user.goal
      });
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update user biometrics/profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const user = req.user;
    const { weight, goal, dob } = req.body;

    if (weight && weight !== user.weight) {
      user.weight = weight;
      user.weightHistory.push({ weight: parseFloat(weight), date: new Date() });
    }
    if (goal) user.goal = goal;
    if (dob) user.dob = dob;

    await user.save();

    res.status(200).json({
      message: "Profile updated successfully",
      weight: user.weight,
      goal: user.goal,
      dob: user.dob
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Change password (Inside app)
// @route   PUT /api/auth/password
// @access  Private
const updatePassword = async (req, res) => {
  try {
    const user = req.user;
    const { currentPassword, newPassword } = req.body;

    if (user && (await bcrypt.compare(currentPassword, user.password))) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      await user.save();
      res.status(200).json({ message: "Password updated successfully" });
    } else {
      res.status(401).json({ message: "Incorrect current password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Prototype: Reset password (Login screen)
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found" });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ message: "Password reset successful. You can now log in." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser, getUserProfile, updateProfile, updatePassword, resetPassword };