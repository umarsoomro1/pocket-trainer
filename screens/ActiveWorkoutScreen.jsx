import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../api/axiosConfig';
import { theme } from '../theme';
import { Image } from 'expo-image';

const ActiveWorkoutScreen = ({ route, navigation }) => {
  const { sessionData } = route.params;
  const [completedExercises, setCompletedExercises] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // Modal State
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);

  const toggleExercise = (index) => {
    if (completedExercises.includes(index)) {
      setCompletedExercises(completedExercises.filter((i) => i !== index));
    } else {
      setCompletedExercises([...completedExercises, index]);
    }
  };

  const openExerciseInfo = (exercise) => {
    console.log("EXERCISE DATA:", exercise);
    setSelectedExercise(exercise);
    setImageError(false); // Reset the error state when opening a new modal
    setInfoModalVisible(true);
  };

  const handleFinishWorkout = async () => {
    const hasExercises = sessionData.exercises && sessionData.exercises.length > 0;
    
    if (hasExercises && completedExercises.length === 0) {
      return Alert.alert("Hold on", "Complete at least one exercise!");
    }

    setIsSubmitting(true);
    try {
      await api.post('/workouts/complete');
      navigation.replace('ProgressSummary', { 
        sessionTitle: sessionData.title, 
        completedCount: hasExercises ? completedExercises.length : 0, 
        totalCount: hasExercises ? sessionData.exercises.length : 0 
      });
    } catch (error) {
      Alert.alert("Error", "Could not save progress.");
      setIsSubmitting(false);
    }
  };

  const renderExercise = ({ item, index }) => {
    const isDone = completedExercises.includes(index);
    return (
      <View style={[styles.exerciseCard, isDone && styles.exerciseCardDone]}>
        <View style={styles.exerciseInfo}>
          <Text style={[styles.exerciseName, isDone && styles.textMuted]}>{item.name}</Text>
          <View style={styles.statsRow}>
            <Text style={[styles.statText, isDone && styles.textMuted]}>Sets: {item.sets}</Text>
            <Text style={[styles.statText, isDone && styles.textMuted]}>Reps: {item.reps_target}</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.infoBtn} onPress={() => openExerciseInfo(item)}>
          <Ionicons name="information-circle-outline" size={26} color={theme.accentAlt} />
        </TouchableOpacity>

        <TouchableOpacity style={[styles.checkbox, isDone && styles.checkboxDone]} onPress={() => toggleExercise(index)}>
          {isDone && <Ionicons name="checkmark" size={24} color={theme.background} />}
        </TouchableOpacity>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Ionicons name="battery-charging-outline" size={80} color={theme.accent} />
      <Text style={styles.emptyStateTitle}>Rest & Recovery</Text>
      <Text style={styles.emptyStateText}>Take it easy today. Let your muscles recover. Hit 'Finish & Save' to log your recovery day!</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="close" size={28} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Active Session</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.titleContainer}>
        <Text style={styles.sessionTitle}>{sessionData.title}</Text>
      </View>

      <FlatList 
        data={sessionData.exercises || []} 
        keyExtractor={(item, index) => index.toString()} 
        renderItem={renderExercise} 
        contentContainerStyle={styles.listContainer} 
        ListEmptyComponent={renderEmptyState} 
      />

      <View style={styles.footer}>
        <TouchableOpacity style={styles.finishButton} onPress={handleFinishWorkout} disabled={isSubmitting}>
          {isSubmitting ? <ActivityIndicator color={theme.background} /> : <Text style={styles.finishButtonText}>Finish & Save</Text>}
        </TouchableOpacity>
      </View>

      {/* EXERCISE INFO MODAL */}
      <Modal animationType="slide" transparent={true} visible={infoModalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedExercise?.name}</Text>
              <TouchableOpacity onPress={() => setInfoModalVisible(false)}>
                <Ionicons name="close-circle" size={30} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
            
            {/* Downloaded GIF with Error Handling */}
            {selectedExercise?.gif_url && !imageError ? (
              <Image 
                source={{ uri: selectedExercise.gif_url }} 
                style={styles.gifImage} 
                resizeMode="contain"
                onError={() => setImageError(true)} 
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="image-outline" size={60} color={theme.textSecondary} />
                <Text style={{color: theme.textSecondary, marginTop: 10}}>No Image Available</Text>
              </View>
            )}

            <View style={styles.infoSection}>
              <Text style={styles.infoLabel}>Primary Muscle Target</Text>
              <Text style={styles.infoValue}>{selectedExercise?.muscle || "Target Muscle Data Unavailable"}</Text>
            </View>
            
            <View style={styles.infoSection}>
              <Text style={styles.infoLabel}>Benefits & Form</Text>
              <Text style={styles.infoValue}>{selectedExercise?.benefits || "Benefit Data Unavailable."}</Text>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ActiveWorkoutScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 15 },
  headerTitle: { color: theme.textSecondary, fontSize: 18, fontWeight: '600' },
  backBtn: { padding: 5 },
  titleContainer: { paddingHorizontal: 20, marginBottom: 20 },
  sessionTitle: { fontSize: 28, fontWeight: 'bold', color: theme.textPrimary },
  listContainer: { paddingHorizontal: 20, paddingBottom: 100 },
  
  exerciseCard: { flexDirection: 'row', backgroundColor: theme.card, borderRadius: 16, padding: 20, marginBottom: 15, alignItems: 'center', justifyContent: 'space-between' },
  exerciseCardDone: { borderColor: theme.accent, backgroundColor: '#00FF7F11', borderWidth: 1 },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: 18, fontWeight: 'bold', color: theme.textPrimary, marginBottom: 8 },
  statsRow: { flexDirection: 'row', gap: 15 },
  statText: { color: theme.textSecondary, fontSize: 14 },
  textMuted: { color: '#666666', textDecorationLine: 'line-through' },
  infoBtn: { padding: 10 },
  checkbox: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: theme.textSecondary, justifyContent: 'center', alignItems: 'center', marginLeft: 10 },
  checkboxDone: { backgroundColor: theme.accent, borderColor: theme.accent },
  
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 20, backgroundColor: theme.background },
  finishButton: { backgroundColor: theme.accent, paddingVertical: 18, borderRadius: 12, alignItems: 'center' },
  finishButtonText: { color: theme.background, fontSize: 18, fontWeight: 'bold' },
  
  emptyStateContainer: { alignItems: 'center', justifyContent: 'center', marginTop: 80, paddingHorizontal: 20 },
  emptyStateTitle: { color: theme.textPrimary, fontSize: 24, fontWeight: 'bold', marginTop: 20 },
  emptyStateText: { color: theme.textSecondary, fontSize: 16, textAlign: 'center', marginTop: 10, lineHeight: 24 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: theme.card, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, minHeight: '60%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: theme.textPrimary, flex: 1 },
  gifImage: { width: '100%', height: 200, borderRadius: 16, marginBottom: 20 },
  imagePlaceholder: { width: '100%', height: 200, backgroundColor: '#111', borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: '#333' },
  infoSection: { marginBottom: 20 },
  infoLabel: { fontSize: 14, color: theme.accentAlt, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 5 },
  infoValue: { fontSize: 16, color: theme.textPrimary, lineHeight: 24 }
});