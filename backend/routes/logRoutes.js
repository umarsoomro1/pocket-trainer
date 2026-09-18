const express = require('express');
const router = express.Router();
const CrashLog = require('../models/CrashLog');
const rateLimit = require('express-rate-limit');

// Rate limiter specifically for client error dispatch (prevents crash-loop spam)
const clientLogLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  statusCode: 429,
  validate: false,
  message: { message: 'Too many crash reports submitted.' },
});

// @desc    Ingest mobile client crash reports
// @route   POST /api/logs/client-crash
// @access  Public / Optional Auth
router.post('/client-crash', clientLogLimiter, async (req, res, next) => {
  try {
    const { message, stack, componentStack, deviceInfo, userId } = req.body;

    if (!message) {
      return res.status(400).json({ message: 'Error message is required.' });
    }

    await CrashLog.create({
      source: 'client',
      message: String(message).slice(0, 1000),
      stack: stack ? String(stack).slice(0, 5000) : undefined,
      ip: req.ip,
      userId: userId || undefined,
      metadata: {
        componentStack: componentStack ? String(componentStack).slice(0, 3000) : undefined,
        deviceInfo: deviceInfo || {},
      },
    });

    res.status(201).json({ status: 'logged' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;