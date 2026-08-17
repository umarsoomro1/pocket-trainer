import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

const ProgressSummaryScreen = ({ route, navigation }) => {
  const { sessionTitle, completedCount, totalCount } = route.params;
  
  // Quick animation for the checkmark
  const scaleAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 5,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleReturnHome = () => {
    // Pops all screens off the stack and returns to the Dashboard tabs
    navigation.popToTop();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        
        <Animated.View style={[styles.iconContainer, { transform: [{ scale: scaleAnim }] }]}>
          <Ionicons name="checkmark-done" size={60} color={theme.background} />
        </Animated.View>

        <Text style={styles.title}>Workout Complete!</Text>
        <Text style={styles.subtitle}>Great job finishing {sessionTitle}.</Text>

        <View style={styles.statsCard}>
          <Text style={styles.statsHeader}>Session Summary</Text>
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{completedCount}</Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{totalCount}</Text>
              <Text style={styles.statLabel}>Total Exercises</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.homeButton} onPress={handleReturnHome}>
          <Text style={styles.homeButtonText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default ProgressSummaryScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  iconContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: theme.accent, justifyContent: 'center', alignItems: 'center', marginBottom: 30, shadowColor: theme.shadow, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 15, elevation: 10 },
  title: { fontSize: 32, fontWeight: 'bold', color: theme.textPrimary, marginBottom: 10, textAlign: 'center' },
  subtitle: { fontSize: 16, color: theme.textSecondary, marginBottom: 40, textAlign: 'center' },
  statsCard: { width: '100%', backgroundColor: theme.card, borderRadius: 16, padding: 25, elevation: 5 },
  statsHeader: { color: theme.textSecondary, fontSize: 14, fontWeight: '600', textTransform: 'uppercase', marginBottom: 20, textAlign: 'center', letterSpacing: 1 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statBox: { flex: 1, alignItems: 'center' },
  statNumber: { fontSize: 36, fontWeight: 'bold', color: theme.accent },
  statLabel: { fontSize: 14, color: theme.textSecondary, marginTop: 5 },
  divider: { width: 1, height: 50, backgroundColor: '#333' },
  footer: { padding: 20, paddingBottom: 40 },
  homeButton: { backgroundColor: theme.card, paddingVertical: 18, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: theme.accent },
  homeButtonText: { color: theme.accent, fontSize: 18, fontWeight: 'bold' }
});