const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

const app = express();

// Trust reverse proxy (Vercel) so req.ip and rate limiters work reliably
app.set('trust proxy', 1);

// F4: Restrict CORS to authorized origins while permitting mobile direct client networking
const allowedOrigins = [
  'http://localhost:8081',
  'http://localhost:19006',
  'http://localhost:3000',
  process.env.FRONTEND_URL, // Add your Vercel deployment URL in dashboard env vars
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow mobile apps / curl / Postman (which lack an origin header) or whitelisted origins
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Blocked by CORS security policy.'));
    },
    credentials: true,
  })
);

// Baseline HTTP headers
app.use(helmet());

// F7: Protect against oversized request payloads
app.use(express.json({ limit: '100kb' }));

// Ensure MongoDB is connected on every serverless invocation without freezing imports
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

// 404 Handler for unmatched endpoints
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint not found.' });
});

// F8: Centralized Production Error Handler (Suppresses internal stack traces & driver leaks)
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]:', err);

  const isProduction = process.env.NODE_ENV === 'production';
  const statusCode = err.status || err.statusCode || 500;

  res.status(statusCode).json({
    message: isProduction && statusCode === 500 
      ? 'An internal server error occurred.' 
      : err.message,
    ...(isProduction ? {} : { stack: err.stack }),
  });
});

// Only start listening locally; avoid calling listen in production/Vercel
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;