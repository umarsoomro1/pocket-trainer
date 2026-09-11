const rateLimit = require('express-rate-limit');

// Strict limiter for sensitive auth routes (Login, Register)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  statusCode: 429,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, default: true },
  message: { message: 'Too many login attempts. Please try again after 15 minutes.' }
});

// Extra strict limiter for OTP request & verification (Stops abuse and brute force)
const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // Max 5 attempts per 15 minutes
  statusCode: 429,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false, default: true },
  message: { message: 'Too many reset attempts. Please try again after 15 minutes.' }
});

// Chat endpoint limiter (Guards against Modal compute credit drainage)
const chatLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20,
  statusCode: 429,
  validate: { xForwardedForHeader: false, default: true },
  message: { message: 'You are sending messages too quickly. Please slow down.' }
});

module.exports = { authLimiter, otpLimiter, chatLimiter };