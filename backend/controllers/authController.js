const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// 1. Request Password Reset (Generates & Stores Hashed OTP/Token)
// POST /api/auth/forgot-password
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase() });

    if (!user) {
      // Return 200 to prevent email enumeration attacks
      return res.status(200).json({ message: "If that email is registered, a reset code was sent." });
    }

    // Generate 6-digit OTP (or a random 32-byte hex token)
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash the code before saving to DB
    const hashedCode = crypto.createHash('sha256').update(resetCode).digest('hex');
    user.resetPasswordToken = hashedCode;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 Minutes
    await user.save();

    // TODO: Send email via Nodemailer / Resend
    // await sendEmail({ to: user.email, subject: "Your Reset Code", text: `Your code is ${resetCode}` });
    console.log(`[DEV ONLY] Password Reset OTP for ${user.email}: ${resetCode}`);

    res.status(200).json({ message: "Reset code sent to your email." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 2. Verify Token & Reset Password
// POST /api/auth/reset-password
exports.resetPassword = async (req, res) => {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const hashedCode = crypto.createHash('sha256').update(code.trim()).digest('hex');

    const user = await User.findOne({
      email: email.toLowerCase(),
      resetPasswordToken: hashedCode,
      resetPasswordExpires: { $gt: Date.now() } // Token must not be expired
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset code." });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    // Clear reset token fields
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: "Password updated successfully. You can now login." });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};