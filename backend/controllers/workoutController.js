const WorkoutPlan = require('../models/WorkoutPlan');
const User = require('../models/User');
const { generateWorkoutPlan } = require('../services/aiService');
const { getExerciseGif } = require('../services/exerciseService');

// @desc    Generate and assign a new plan to the user
// @route   POST /api/workouts/generate
// @access  Private
const generateAndAssignPlan = async (req, res) => {
  try {
    const user = req.user; 
    const { planType } = req.body || {}; 

    console.log(`[GENERATION START] User: ${user._id} | Split: ${planType || 'General'}`);

    // 1. Get structured baseline plan with built-in alternating core exercises
    const generatedData = await generateWorkoutPlan(user, planType || "Push Pull Legs (PPL)");

    if (!generatedData || !Array.isArray(generatedData.schedule) || generatedData.schedule.length === 0) {
      return res.status(422).json({ 
        message: "Failed to assemble workout split. Please retry." 
      });
    }

    // 2. Fetch exercise demonstration GIFs (parallel non-blocking with 1.5s timeout)
    const gifPromises = [];
    generatedData.schedule.forEach((day) => {
      (day.exercises || []).forEach((exercise) => {
        gifPromises.push(
          (async () => {
            try {
              const fetchPromise = getExerciseGif(exercise.name);
              const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 1500));
              exercise.gif_url = await Promise.race([fetchPromise, timeoutPromise]);
            } catch (err) {
              exercise.gif_url = null;
            }
          })()
        );
      });
    });

    await Promise.allSettled(gifPromises);

    // 3. Save new plan to MongoDB
    const newPlan = await WorkoutPlan.create({
      userId: user._id,
      title: generatedData.title || `${planType || 'Custom'} Program`,
      schedule: generatedData.schedule
    });

    user.active_program_id = newPlan._id;
    user.current_day_index = 1;
    await user.save();

    console.log(`[GENERATION SUCCESS] Plan ID ${newPlan._id} saved successfully.`);

    return res.status(201).json({ 
      message: "Plan generated successfully!", 
      planId: newPlan._id 
    });

  } catch (error) {
    console.error("[GENERATION ERROR]:", error.message);
    return res.status(500).json({ 
      message: error.message || "Failed to generate plan." 
    });
  }
};

// @desc    Get active workout session for today (supports /active and /today)
// @route   GET /api/workouts/active, GET /api/workouts/today
// @access  Private
const getTodaysWorkout = async (req, res) => {
  try {
    const user = req.user;

    if (!user.active_program_id) {
      return res.status(404).json({ message: 'No active plan found. Please generate one.' });
    }

    const plan = await WorkoutPlan.findById(user.active_program_id);
    if (!plan || !plan.schedule || plan.schedule.length === 0) {
      return res.status(404).json({ message: 'Workout plan not found in database.' });
    }

    const currentDay = user.current_day_index || 1;
    // Modulo index allows repeating master splits across multiple weeks
    const scheduleIndex = (currentDay - 1) % plan.schedule.length;
    const session = plan.schedule[scheduleIndex];

    const todayDate = new Date().toISOString().split('T')[0];
    const lastWorkout = user.last_workout_date ? new Date(user.last_workout_date).toISOString().split('T')[0] : null;
    const isCompletedToday = lastWorkout === todayDate;

    return res.status(200).json({
      planId: plan._id,
      programTitle: plan.title,
      currentDay,
      totalDays: plan.schedule.length,
      currentSession: session,
      session,
      isCompletedToday,
      lastWorkoutDate: user.last_workout_date
    });
  } catch (error) {
    console.error("Get Active Workout Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get dashboard progress and chart data
// @route   GET /api/workouts/dashboard
// @access  Private
const getDashboardData = async (req, res) => {
  try {
    const user = req.user;
    const workoutsCompleted = user.current_day_index > 1 ? user.current_day_index - 1 : 0;
    
    const recentWeights = user.weightHistory && user.weightHistory.length > 0 
      ? user.weightHistory.slice(-7) 
      : [{ weight: user.weight, date: new Date() }]; 
    
    let chartLabels = recentWeights.map(log => {
      const d = new Date(log.date);
      return `${d.getMonth() + 1}/${d.getDate()}`;
    });
    let chartWeights = recentWeights.map(log => log.weight);

    if (chartWeights.length === 1) {
      chartLabels.push("Now");
      chartWeights.push(chartWeights[0]);
    }

    return res.status(200).json({
      stats: {
        workoutsCompleted,
        currentStreak: workoutsCompleted,
        totalDays: 28 
      },
      chartData: {
        labels: chartLabels.length > 0 ? chartLabels : ["No Data", "No Data"],
        datasets: [{ data: chartWeights.length > 0 ? chartWeights : [0, 0] }]
      }
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Mark today's workout as complete and advance the day index
// @route   POST /api/workouts/complete
// @access  Private
const completeWorkout = async (req, res) => {
  try {
    const user = req.user;

    if (!user.active_program_id) {
      return res.status(400).json({ message: 'No active plan to complete.' });
    }

    user.current_day_index = (user.current_day_index || 1) + 1;
    user.last_workout_date = new Date(); 
    await user.save();

    return res.status(200).json({ 
      message: 'Workout marked as complete!', 
      nextDay: user.current_day_index 
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  generateAndAssignPlan, 
  getDashboardData, 
  getTodaysWorkout, 
  getActiveWorkout: getTodaysWorkout,
  completeWorkout 
};