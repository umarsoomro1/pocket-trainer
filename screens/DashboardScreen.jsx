import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert, ScrollView, Dimensions, Modal } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { Calendar } from 'react-native-calendars'; // RE-ADDED CALENDAR
import api from '../api/axiosConfig';
import { theme } from '../theme';

const screenWidth = Dimensions.get("window").width;

const DashboardScreen = ({ navigation }) => {
  const [todaysData, setTodaysData] = useState(null);
  const [progressStats, setProgressStats] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Generation Modal States
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedPlanType, setSelectedPlanType] = useState('Push Pull Legs (PPL)');
  const [isGenerating, setIsGenerating] = useState(false);

  // Calendar Real-Time Date State
  const todayString = new Date().toISOString().split('T')[0];
  const [markedDates, setMarkedDates] = useState({
    [todayString]: { selected: true, marked: true, selectedColor: theme.accent, selectedTextColor: theme.background }
  });

  // Countdown Timer State
  const [timeToMidnight, setTimeToMidnight] = useState('');

  const planOptions = ['Push Pull Legs (PPL)', 'Single Muscle (Bro Split)', 'Upper / Lower', 'Full Body'];

  const fetchDashboard = async () => {
    try {
      if (!todaysData) setLoading(true); 
      
      const [todayRes, dashRes] = await Promise.all([
        api.get('/workouts/today').catch(() => null),
        api.get('/workouts/dashboard').catch(() => null)
      ]);

      if (todayRes) setTodaysData(todayRes.data);
      if (dashRes) {
        setProgressStats(dashRes.data.stats);
        setChartData(dashRes.data.chartData);
      }
    } catch (error) {
      Alert.alert("Error", "Could not load dashboard.");
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
    }, [])
  );

  // Midnight Countdown Logic
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const diff = tomorrow - now; // Difference in milliseconds

      const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeToMidnight(`${h}h ${m}m ${s}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleGeneratePlan = async () => {
    setIsGenerating(true);
    try {
      await api.post('/workouts/generate', { planType: selectedPlanType });
      setModalVisible(false);
      Alert.alert("Success", "Your new AI plan is ready!");
      fetchDashboard(); 
    } catch (error) {
      Alert.alert("Generation Failed", "The AI is currently busy. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading && !isGenerating) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  // Assuming your backend sends a boolean flag indicating if today's workout is done
  const isCompletedToday = todaysData?.isCompletedToday || false; 

  return (
    <View style={{flex: 1, backgroundColor: theme.background}}>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerTitle}>Overview</Text>
          <Text style={styles.subText}>Track your consistency</Text>
        </View>

        {progressStats && (
          <View style={styles.progressContainer}>
            <Text style={styles.sectionHeader}>Overall Progress</Text>
            <View style={styles.statsCard}>
              <View style={styles.statBox}>
                <Ionicons name="barbell" size={24} color={theme.accent} style={styles.statIcon} />
                <Text style={styles.statNumber}>{progressStats.workoutsCompleted}</Text>
                <Text style={styles.statLabel}>Completed</Text>
              </View>
              <View style={styles.verticalDivider} />
              <View style={styles.statBox}>
                <Ionicons name="flame" size={24} color={theme.accentAlt} style={styles.statIcon} />
                <Text style={styles.statNumber}>{progressStats.currentStreak}</Text>
                <Text style={styles.statLabel}>Day Streak</Text>
              </View>
              <View style={styles.verticalDivider} />
              <View style={styles.statBox}>
                <Ionicons name="calendar" size={24} color={theme.textPrimary} style={styles.statIcon} />
                <Text style={styles.statNumber}>{progressStats.totalDays}</Text>
                <Text style={styles.statLabel}>Total Days</Text>
              </View>
            </View>
          </View>
        )}

        {/* REAL-TIME ACTIVITY CALENDAR */}
        <Text style={styles.sectionHeader}>Activity Calendar</Text>
        <View style={styles.calendarContainer}>
          <Calendar
            theme={{
              calendarBackground: theme.card,
              textSectionTitleColor: theme.textSecondary,
              selectedDayBackgroundColor: theme.accent,
              selectedDayTextColor: theme.background,
              todayTextColor: theme.accentAlt,
              dayTextColor: theme.textPrimary,
              textDisabledColor: '#444444',
              monthTextColor: theme.accent,
              arrowColor: theme.accent,
            }}
            markedDates={markedDates}
            hideExtraDays={true}
          />
        </View>

        {chartData && (
          <View style={{marginBottom: 30}}>
            <Text style={styles.sectionHeader}>Weight Progress (lbs)</Text>
            <LineChart
              data={chartData}
              width={screenWidth - 40}
              height={220}
              chartConfig={{
                backgroundColor: theme.card,
                backgroundGradientFrom: theme.card,
                backgroundGradientTo: theme.card,
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(0, 255, 127, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                propsForDots: { r: "5", strokeWidth: "2", stroke: theme.accentAlt }
              }}
              bezier
              style={{ borderRadius: 16, elevation: 4 }}
            />
          </View>
        )}

        {todaysData?.session ? (
          <View style={styles.todaysPlanContainer}>
            <Text style={styles.sectionHeader}>Today's Plan</Text>
            <View style={styles.sessionCard}>
              <Text style={styles.programTitle}>{todaysData.programTitle}</Text>
              <Text style={styles.dayText}>Day {todaysData.currentDay}</Text>
              <View style={styles.divider} />
              <Text style={styles.sessionTitle}>{todaysData.session.title}</Text>
              
              {/* CONDITIONAL BUTTON RENDER BASED ON COMPLETION STATUS */}
              {isCompletedToday ? (
                <View style={styles.disabledButton}>
                  <Text style={styles.disabledButtonText}>Workout Complete!</Text>
                  <Text style={styles.timerText}>Next session in {timeToMidnight}</Text>
                </View>
              ) : (
                <TouchableOpacity style={styles.startButton} onPress={() => navigation.navigate('ActiveWorkout', { sessionData: todaysData.session })}>
                  <Text style={styles.startButtonText}>Start Workout</Text>
                  <Ionicons name="play" size={20} color={theme.background} style={{ marginLeft: 8 }} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.centeredMessage}>
            <Text style={styles.sectionHeader}>Ready to start?</Text>
            <Text style={styles.subText}>Generate a customized AI program to begin.</Text>
            <TouchableOpacity style={styles.generateButton} onPress={() => setModalVisible(true)}>
              <Text style={styles.generateButtonText}>Get Your Workout Plan</Text>
              <Ionicons name="flash" size={20} color={theme.background} style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Generation Modal */}
      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {isGenerating ? (
              <View style={{alignItems: 'center', paddingVertical: 40}}>
                <ActivityIndicator size="large" color={theme.accent} />
                <Text style={{color: theme.textPrimary, fontSize: 18, marginTop: 20, fontWeight: 'bold'}}>Building your plan...</Text>
                <Text style={{color: theme.textSecondary, marginTop: 10, textAlign: 'center'}}>The AI is structuring your sets and reps. This takes a few seconds.</Text>
              </View>
            ) : (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Choose Plan Style</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <Ionicons name="close-circle" size={30} color={theme.textSecondary} />
                  </TouchableOpacity>
                </View>

                {planOptions.map((plan) => (
                  <TouchableOpacity 
                    key={plan} 
                    style={[styles.planOptionBtn, selectedPlanType === plan && styles.planOptionActive]}
                    onPress={() => setSelectedPlanType(plan)}
                  >
                    <Text style={[styles.planOptionText, selectedPlanType === plan && styles.planOptionTextActive]}>{plan}</Text>
                    {selectedPlanType === plan && <Ionicons name="checkmark-circle" size={24} color={theme.accent} />}
                  </TouchableOpacity>
                ))}

                <TouchableOpacity style={styles.buildButton} onPress={handleGeneratePlan}>
                  <Text style={styles.buildButtonText}>Build My Program</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default DashboardScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background, paddingHorizontal: 20 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  centeredMessage: { alignItems: 'center', marginTop: 20, paddingBottom: 40 },
  headerContainer: { marginTop: 60, marginBottom: 20 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: theme.textPrimary },
  subText: { color: theme.textSecondary, fontSize: 14, marginTop: 4 },
  
  progressContainer: { marginBottom: 25 },
  sectionHeader: { fontSize: 20, fontWeight: 'bold', color: theme.textPrimary, marginBottom: 15 },
  statsCard: { flexDirection: 'row', backgroundColor: theme.card, borderRadius: 16, paddingVertical: 20, paddingHorizontal: 10, elevation: 6 },
  statBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  statIcon: { marginBottom: 8 },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: theme.textPrimary },
  statLabel: { fontSize: 12, color: theme.textSecondary, marginTop: 4, textTransform: 'uppercase' },
  verticalDivider: { width: 1, backgroundColor: '#333', marginVertical: 10 },
  
  calendarContainer: { borderRadius: 16, overflow: 'hidden', marginBottom: 30, elevation: 5, backgroundColor: theme.card },
  
  todaysPlanContainer: { marginBottom: 20 },
  sessionCard: { backgroundColor: theme.card, padding: 20, borderRadius: 16, elevation: 6 },
  programTitle: { fontSize: 16, fontWeight: '600', color: theme.accentAlt },
  dayText: { fontSize: 14, color: theme.textSecondary, marginTop: 2 },
  divider: { height: 1, backgroundColor: '#333', marginVertical: 15 },
  sessionTitle: { fontSize: 22, fontWeight: 'bold', color: theme.textPrimary, marginBottom: 5 },
  
  startButton: { flexDirection: 'row', backgroundColor: theme.accent, paddingVertical: 16, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 25 },
  startButtonText: { color: theme.background, fontSize: 18, fontWeight: 'bold' },
  
  // Disabled Button Styles
  disabledButton: { backgroundColor: '#333', paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 25 },
  disabledButtonText: { color: theme.textSecondary, fontSize: 16, fontWeight: 'bold' },
  timerText: { color: theme.accentAlt, fontSize: 14, marginTop: 4, fontWeight: '600' },
  
  generateButton: { flexDirection: 'row', backgroundColor: theme.accentAlt, paddingVertical: 16, paddingHorizontal: 30, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 25 },
  generateButtonText: { color: theme.background, fontSize: 18, fontWeight: 'bold' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: theme.card, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: theme.textPrimary },
  planOptionBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 18, borderRadius: 12, borderWidth: 1, borderColor: '#333', marginBottom: 10 },
  planOptionActive: { borderColor: theme.accent, backgroundColor: '#00FF7F11' },
  planOptionText: { color: theme.textSecondary, fontSize: 16, fontWeight: '500' },
  planOptionTextActive: { color: theme.accent, fontWeight: 'bold' },
  buildButton: { backgroundColor: theme.accent, paddingVertical: 18, borderRadius: 12, alignItems: 'center', marginTop: 20 },
  buildButtonText: { color: theme.background, fontSize: 18, fontWeight: 'bold' }
});