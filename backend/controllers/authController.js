const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { z } = require('zod');
const User = require('../models/User');
const { sendPasswordResetEmail } = require('../services/emailService');

// F3: Fail immediately if JWT_SECRET is unset; use shortened token lifespan
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('FATAL: JWT_SECRET environment variable is missing.');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

// F6: Password complexity rule: min 8 chars, 1 uppercase, 1 digit
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long.')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
  .regex(/[0-9]/, 'Password must contain at least one number.');

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email('Please provide a valid email address.'),
  password: passwordSchema,
  dob: z.string().optional(),
  weight: z.union([z.number(), z.string()]).optional(),
  goal: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Please provide a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
});

const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Please provide a valid email address.'),
});

const resetPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Please provide a valid email address.'),
  code: z.string().trim().length(6, 'Reset code must be exactly 6 digits.'),
  newPassword: passwordSchema,
});

const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required.'),
  newPassword: passwordSchema,
});

// @desc    Register a new user
// @route   POST /api/auth/register
const registerUser = async (req, res, next) => {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ 
        message: parseResult.error.errors.map((e) => e.message).join(' ') 
      });
    }

    const { email, password, dob, weight, goal } = parseResult.data;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const numericWeight = weight !== undefined && weight !== '' ? Number(weight) : undefined;

    const user = await User.create({
      email,
      password: hashedPassword,
      dob,
      weight: numericWeight,
      goal,
      weightHistory: numericWeight ? [{ weight: numericWeight, date: new Date() }] : [],
    });

    res.status(201).json({
      _id: user._id,
      email: user.email,
      token: generateToken(user._id),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
const loginUser = async (req, res, next) => {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ 
        message: parseResult.error.errors.map((e) => e.message).join(' ') 
      });
    }

    const { email, password } = parseResult.data;
    const user = await User.findOne({ email });

    if (user && (await bcrypt.compare(password, user.password))) {
      res.json({
        _id: user._id,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password.' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Request password reset code & dispatch email
// @route   POST /api/auth/forgot-password
const forgotPassword = async (req, res, next) => {
  try {
    const parseResult = forgotPasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ 
        message: parseResult.error.errors.map((e) => e.message).join(' ') 
      });
    }

    const { email } = parseResult.data;
    const user = await User.findOne({ email });

    const genericMessage = 'If an account with that email exists, a reset code was sent.';

    // Anti-enumeration: Identical response regardless of user presence
    if (!user) {
      return res.status(200).json({ message: genericMessage });
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedCode = crypto.createHash('sha256').update(resetCode).digest('hex');

    user.resetPasswordToken = hashedCode;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
    await user.save();

    await sendPasswordResetEmail(user.email, resetCode);

    res.status(200).json({ message: genericMessage });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify code & reset password
// @route   POST /api/auth/reset-password
const resetPassword = async (req, res, next) => {
  try {
    const parseResult = resetPasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ 
        message: parseResult.error.errors.map((e) => e.message).join(' ') 
      });
    }

    const { email, code, newPassword } = parseResult.data;
    const hashedCode = crypto.createHash('sha256').update(code).digest('hex');

    const user = await User.findOne({
      email,
      resetPasswordToken: hashedCode,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset code.' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    
    // Invalidate OTP tokens immediately after use
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Password updated successfully. You can now login.' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (user) {
      res.json(user);
    } else {
      res.status(404).json({ message: 'User not found.' });
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile biometrics & record weight tracking history
// @route   PUT /api/auth/profile
const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    if (req.body.weight !== undefined && req.body.weight !== null && req.body.weight !== '') {
      const numericWeight = Number(req.body.weight);
      if (!Number.isNaN(numericWeight)) {
        user.weight = numericWeight;

        if (!Array.isArray(user.weightHistory)) {
          user.weightHistory = [];
        }

        user.weightHistory.push({
          weight: numericWeight,
          date: new Date(),
        });
      }
    }

    if (req.body.goal) user.goal = req.body.goal;
    if (req.body.dob) user.dob = req.body.dob;

    const updatedUser = await user.save();
    res.json(updatedUser);
  } catch (error) {
    next(error);
  }
};

// @desc    Update password (authenticated)
// @route   PUT /api/auth/password
const updatePassword = async (req, res, next) => {
  try {
    const parseResult = updatePasswordSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ 
        message: parseResult.error.errors.map((e) => e.message).join(' ') 
      });
    }

    const { currentPassword, newPassword } = parseResult.data;
    const user = await User.findById(req.user._id);

    if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
      return res.status(400).json({ message: 'Current password is incorrect.' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: 'Password updated successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  getUserProfile,
  updateUserProfile,
  updatePassword,
};