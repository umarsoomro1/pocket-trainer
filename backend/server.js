const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const Sentry = require('@sentry/node');
const pino = require('pino');
const pinoHttp = require('pino-http');
const connectDB = require('./config/db');
const CrashLog = require('./models/CrashLog'); // Import CrashLog model

dotenv.config();

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  formatters: {
    level: (label) => ({ level: label }),
  },
  base: {
    env: process.env.NODE_ENV || 'development',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
  });
}

const app = express();

app.set('trust proxy', 1);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req: (req) => ({
        id: req.id,
        method: req.method,
        url: req.url,
        ip: req.ip,
      }),
      res: (res) => ({
        statusCode: res.statusCode,
      }),
    },
  })
);

app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function (body) {
    if (res.statusCode === 429) {
      logger.warn({
        event: 'SECURITY_RATE_LIMIT_EXCEEDED',
        path: req.path,
        ip: req.ip,
        method: req.method,
      });
      if (process.env.SENTRY_DSN) {
        Sentry.captureMessage(
          `[SECURITY] 429 Rate limit exceeded on ${req.method} ${req.path} by IP ${req.ip}`,
          'warning'
        );
      }
    } else if (res.statusCode === 401 && req.path.includes('/auth')) {
      logger.warn({
        event: 'SECURITY_AUTH_FAILURE',
        path: req.path,
        ip: req.ip,
        method: req.method,
      });
    }
    return originalJson.call(this, body);
  };
  next();
});

const allowedOrigins = [
  'http://localhost:8081',
  'http://localhost:19006',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Blocked by CORS security policy.'));
    },
  })
);

app.use(helmet());
app.use(express.json({ limit: '100kb' }));

app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    next(err);
  }
});

// Root & Health Verification Endpoints
app.get('/', (req, res) => {
  res.status(200).json({ status: 'healthy', message: 'PocketTrainer API Online' });
});

app.get('/api', (req, res) => {
  res.status(200).json({ status: 'healthy', message: 'PocketTrainer /api Endpoint Online' });
});

// Route Middlewares
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/auth', require('./routes/authRoutes'));

app.use('/api/workouts', require('./routes/workoutRoutes'));
app.use('/workouts', require('./routes/workoutRoutes'));

app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/chat', require('./routes/chatRoutes'));

// Crash logging endpoint
app.use('/api/logs', require('./routes/logRoutes'));

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint not found.' });
});

if (typeof Sentry.setupExpressErrorHandler === 'function') {
  Sentry.setupExpressErrorHandler(app);
}

// Centralized Production Error Handler (Persists Server Crashes)
app.use((err, req, res, next) => {
  logger.error({ err, path: req.path, method: req.method }, '[SERVER ERROR]');

  // Non-blocking write to MongoDB CrashLog
  CrashLog.create({
    source: 'server',
    message: err.message || 'Unknown server error',
    stack: err.stack,
    route: req.path,
    method: req.method,
    ip: req.ip,
    userId: req.user ? req.user._id : undefined,
  }).catch((dbErr) => {
    logger.error({ dbErr }, 'Failed to persist crash log to MongoDB');
  });

  if (process.env.SENTRY_DSN) {
    Sentry.captureException(err);
  }

  const isProduction = process.env.NODE_ENV === 'production';
  const statusCode = err.status || err.statusCode || 500;

  res.status(statusCode).json({
    message: isProduction && statusCode === 500 
      ? 'An internal server error occurred.' 
      : err.message,
    ...(isProduction ? {} : { stack: err.stack }),
  });
});

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
}

module.exports = app;