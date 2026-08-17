import React, { useContext, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator, Alert, Modal, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axiosConfig';
import { theme } from '../theme';

const ProfileScreen = () => {
  const { logout } = useContext(AuthContext);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [modalVisible, setModalVisible] = useState(false);
  const [editType, setEditType] = useState(''); // 'weight', 'goal', 'password', 'dob'
  const [inputValue, setInputValue] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/auth/profile');
      setUserProfile(response.data);
    } catch (error) {
      Alert.alert("Error", "Could not load profile data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const calculateAge = (dobString) => {
    if (!dobString) return '--';
    const diffMs = Date.now() - new Date(dobString).getTime();
    const ageDt = new Date(diffMs);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
  };

  const formatGoal = (goalStr) => {
    if (!goalStr) return "";
    return goalStr.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  const openEditModal = (type) => {
    setEditType(type);
    setInputValue('');
    setCurrentPassword('');
    setModalVisible(true);
  };

  const handleSaveEdit = async () => {
    try {
      if (editType === 'password') {
        if (!currentPassword || !inputValue) return Alert.alert("Error", "Please fill all fields.");
        await api.put('/auth/password', { currentPassword, newPassword: inputValue });
        Alert.alert("Success", "Password updated successfully.");
      } 
      else if (editType === 'weight') {
        await api.put('/auth/profile', { weight: parseFloat(inputValue) });
        fetchProfile();
      } 
      else if (editType === 'goal') {
        await api.put('/auth/profile', { goal: inputValue.toLowerCase().replace(' ', '_') });
        fetchProfile();
      }
      else if (editType === 'dob') {
        await api.put('/auth/profile', { dob: inputValue });
        fetchProfile();
      }
      setModalVisible(false);
    } catch (error) {
      Alert.alert("Update Failed", error.response?.data?.message || "Something went wrong.");
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.headerTitle}>My Profile</Text>

        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={50} color={theme.background} />
          </View>
          <Text style={styles.emailText}>{userProfile?.email}</Text>
        </View>

        <Text style={styles.sectionHeader}>Biometrics</Text>
        <View style={styles.statsCard}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Age</Text>
            <Text style={styles.statValue}>{calculateAge(userProfile?.dob)} yrs</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Current Weight</Text>
            <Text style={styles.statValue}>{userProfile?.weight} lbs</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Primary Goal</Text>
            <Text style={styles.statValue}>{formatGoal(userProfile?.goal)}</Text>
          </View>
        </View>

        <Text style={styles.sectionHeader}>Account Settings</Text>
        <View style={styles.settingsCard}>
          <TouchableOpacity style={styles.settingsRow} onPress={() => openEditModal('dob')}>
            <Ionicons name="calendar-outline" size={24} color={theme.textPrimary} />
            <Text style={styles.settingsText}>Update Date of Birth</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          <View style={styles.divider} />
          
          <TouchableOpacity style={styles.settingsRow} onPress={() => openEditModal('weight')}>
            <Ionicons name="scale-outline" size={24} color={theme.textPrimary} />
            <Text style={styles.settingsText}>Update Weight</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          <View style={styles.divider} />
          
          <TouchableOpacity style={styles.settingsRow} onPress={() => openEditModal('goal')}>
            <Ionicons name="flag-outline" size={24} color={theme.textPrimary} />
            <Text style={styles.settingsText}>Change Primary Goal</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          <View style={styles.divider} />
          
          <TouchableOpacity style={styles.settingsRow} onPress={() => openEditModal('password')}>
            <Ionicons name="lock-closed-outline" size={24} color={theme.textPrimary} />
            <Text style={styles.settingsText}>Change Password</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
          <View style={styles.divider} />
          
          <TouchableOpacity style={styles.settingsRow} onPress={logout}>
            <Ionicons name="log-out-outline" size={24} color="#FF4C4C" />
            <Text style={[styles.settingsText, { color: '#FF4C4C' }]}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal animationType="fade" transparent={true} visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <Text style={styles.modalTitle}>
              {editType === 'weight' ? 'Update Weight' : editType === 'goal' ? 'Change Goal' : editType === 'dob' ? 'Update DOB' : 'Change Password'}
            </Text>

            {editType === 'password' && (
              <TextInput
                style={styles.input}
                placeholder="Current Password"
                placeholderTextColor={theme.textSecondary}
                secureTextEntry
                value={currentPassword}
                onChangeText={setCurrentPassword}
              />
            )}

            <TextInput
              style={styles.input}
              placeholder={editType === 'weight' ? 'New Weight (lbs)' : editType === 'goal' ? 'e.g. Muscle Gain, Weight Loss' : editType === 'dob' ? 'YYYY-MM-DD' : 'New Password'}
              placeholderTextColor={theme.textSecondary}
              secureTextEntry={editType === 'password'}
              keyboardType={editType === 'weight' ? 'numeric' : 'default'}
              value={inputValue}
              onChangeText={setInputValue}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: '#333' }]} onPress={() => setModalVisible(false)}>
                <Text style={styles.modalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, { backgroundColor: theme.accent }]} onPress={handleSaveEdit}>
                <Text style={[styles.modalBtnText, { color: theme.background }]}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.background },
  container: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 40 },
  headerTitle: { fontSize: 32, fontWeight: 'bold', color: theme.textPrimary, marginBottom: 30 },
  avatarContainer: { alignItems: 'center', marginBottom: 40 },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: theme.accent, justifyContent: 'center', alignItems: 'center', marginBottom: 15, shadowColor: theme.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 5, elevation: 6 },
  emailText: { fontSize: 18, color: theme.textSecondary, fontWeight: '500' },
  sectionHeader: { fontSize: 18, fontWeight: 'bold', color: theme.textPrimary, marginBottom: 15, marginLeft: 5 },
  statsCard: { backgroundColor: theme.card, borderRadius: 16, padding: 20, marginBottom: 30, shadowColor: theme.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 4 },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  statLabel: { fontSize: 16, color: theme.textSecondary },
  statValue: { fontSize: 16, fontWeight: 'bold', color: theme.textPrimary },
  settingsCard: { backgroundColor: theme.card, borderRadius: 16, padding: 10, shadowColor: theme.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 5, elevation: 4 },
  settingsRow: { flexDirection: 'row', alignItems: 'center', padding: 15 },
  settingsText: { flex: 1, fontSize: 16, color: theme.textPrimary, marginLeft: 15, fontWeight: '500' },
  divider: { height: 1, backgroundColor: '#333333', marginVertical: 5 },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  modalView: { width: '85%', backgroundColor: theme.card, borderRadius: 20, padding: 25, elevation: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: theme.textPrimary, marginBottom: 20, textAlign: 'center' },
  input: { backgroundColor: theme.background, color: theme.textPrimary, borderWidth: 1, borderColor: theme.shadow, borderRadius: 10, padding: 15, marginBottom: 15, fontSize: 16 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  modalBtn: { flex: 1, padding: 15, borderRadius: 10, alignItems: 'center', marginHorizontal: 5 },
  modalBtnText: { color: theme.textPrimary, fontSize: 16, fontWeight: 'bold' }
});