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

    // 1. Get raw JSON from Modal Llama AI
    const generatedData = await generateWorkoutPlan(user, planType || "General");

    // 2. Loop through exercises and fetch GIFs from RapidAPI
    if (generatedData.schedule && Array.isArray(generatedData.schedule)) {
      for (let i = 0; i < generatedData.schedule.length; i++) {
        let day = generatedData.schedule[i];
        if (day.exercises && day.exercises.length > 0) {
          await Promise.all(
            day.exercises.map(async (exercise) => {
              const gifUrl = await getExerciseGif(exercise.name);
              exercise.gif_url = gifUrl || null;
            })
          );
        }
      }
    }

    // 3. Save fully populated plan to MongoDB
    const newPlan = await WorkoutPlan.create({
      userId: user._id,
      title: generatedData.title,
      schedule: generatedData.schedule
    });

    user.active_program_id = newPlan._id;
    user.current_day_index = 1;
    await user.save();

    res.status(201).json({ message: "Plan generated successfully!", planId: newPlan._id });
  } catch (error) {
    console.error("Workout Generation Error:", error);
    res.status(500).json({ message: error.message });
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

    res.status(200).json({
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
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get today's workout for the active plan
// @route   GET /api/workouts/today
// @access  Private
const getTodaysWorkout = async (req, res) => {
  try {
    const user = req.user;

    if (!user.active_program_id) {
      return res.status(404).json({ message: 'No active plan found. Please generate one.' });
    }

    const plan = await WorkoutPlan.findById(user.active_program_id);
    if (!plan) {
      return res.status(404).json({ message: 'Workout plan not found in database.' });
    }

    const currentDay = user.current_day_index;
    const session = plan.schedule[currentDay - 1];

    const todayDate = new Date().toISOString().split('T')[0];
    const lastWorkout = user.last_workout_date ? new Date(user.last_workout_date).toISOString().split('T')[0] : null;
    const isCompletedToday = lastWorkout === todayDate;

    if (!session) {
      return res.status(200).json({ 
        programTitle: plan.title, 
        currentDay, 
        totalDays: plan.schedule.length, 
        session: null,
        isCompletedToday
      });
    }

    res.status(200).json({
      programTitle: plan.title,
      currentDay,
      totalDays: plan.schedule.length,
      session,
      isCompletedToday,
      lastWorkoutDate: user.last_workout_date
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
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

    user.current_day_index += 1;
    user.last_workout_date = new Date(); 
    await user.save();

    res.status(200).json({ message: 'Workout marked as complete!', nextDay: user.current_day_index });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { 
  generateAndAssignPlan, 
  getDashboardData, 
  getTodaysWorkout, 
  completeWorkout 
};