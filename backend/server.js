const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const connectDB = require('./config/db');

// Load environment variables
dotenv.config();

const app = express();

// Global Middleware
app.use(helmet()); 
app.use(cors()); 
app.use(express.json()); 

// Ensure MongoDB is connected on every serverless invocation without freezing imports
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("Database connection failure:", err.message);
    res.status(500).json({ message: "Database connection failed", error: err.message });
  }
});

// Root & Health Verification Endpoints
app.get('/', (req, res) => {
  res.status(200).json({ status: 'healthy', message: 'PocketTrainer API Online' });
});

app.get('/api', (req, res) => {
  res.status(200).json({ status: 'healthy', message: 'PocketTrainer /api Endpoint Online' });
});

// Route Middlewares - Mounted with both prefixes so requests never 404
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/auth', require('./routes/authRoutes'));

app.use('/api/workouts', require('./routes/workoutRoutes'));
app.use('/workouts', require('./routes/workoutRoutes'));

app.use('/api/chat', require('./routes/chatRoutes'));
app.use('/chat', require('./routes/chatRoutes'));

// Only start listening locally; avoid calling listen in production/Vercel
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;