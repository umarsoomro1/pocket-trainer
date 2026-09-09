const rateLimit = require('express-rate-limit');

// Strict limiter for sensitive auth routes (Login, Register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again after 15 minutes.' }
});

// Extra strict limiter for OTP verification (Stops 6-digit brute force)
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Max 5 verification attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many reset attempts. Please request a new code.' }
});

// Chat endpoint limiter (Guards against Modal compute credit drainage)
const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20,
  message: { message: 'You are sending messages too quickly. Please slow down.' }
});

module.exports = { authLimiter, otpLimiter, chatLimiter };