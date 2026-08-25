const express = require('express');
const router = express.Router();
const { 
  generateAndAssignPlan,
  getTodaysWorkout,
  completeWorkout,
  getDashboardData
} = require('../controllers/workoutController');
const { protect } = require('../middleware/authMiddleware');

router.post('/generate', protect, generateAndAssignPlan);
router.get('/today', protect, getTodaysWorkout);
router.post('/complete', protect, completeWorkout);
router.get('/dashboard', protect, getDashboardData);

module.exports = router;