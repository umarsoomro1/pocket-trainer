const rateLimit = require('express-rate-limit');

/**
 * Factory function to instantiate standardized rate limiters
 */
const createLimiter = ({ windowMs, max, message }) =>
  rateLimit({
    windowMs,
    max,
    statusCode: 429,
    standardHeaders: true,
    legacyHeaders: false,
    validate: { xForwardedForHeader: false, default: true },
    message: { message },
  });

// Strict limiter for sensitive auth routes (Login, Register)
const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: 'Too many login attempts. Please try again after 15 minutes.',
});

// Extra strict limiter for OTP request & verification (Stops abuse and brute force)
const otpLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 attempts per 15 minutes
  message: 'Too many reset attempts. Please try again after 15 minutes.',
});

// Chat endpoint limiter (Guards against Modal compute credit drainage)
const chatLimiter = createLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // 20 messages per minute
  message: 'You are sending messages too quickly. Please slow down.',
});

module.exports = { createLimiter, authLimiter, otpLimiter, chatLimiter };