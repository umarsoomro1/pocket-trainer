import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axiosConfig';
import { theme } from '../theme';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);

  // Secure Reset Modal States
  const [modalVisible, setModalVisible] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1); // Step 1: Request code, Step 2: Enter code & new password
  const [resetLoading, setResetLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
    } catch (error) {
      Alert.alert("Login Failed", error.response?.data?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendCode = async () => {
    if (!resetEmail) {
      return Alert.alert("Required", "Please enter your email.");
    }
    setResetLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: resetEmail });
      Alert.alert("Code Sent", "Check your email for the 6-digit verification code.");
      setStep(2);
    } catch (error) {
      Alert.alert("Error", error.response?.data?.message || "Failed to send code.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleVerifyAndReset = async () => {
    if (!resetCode || !newPassword) {
      return Alert.alert("Required", "Please fill in both the code and new password.");
    }
    setResetLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email: resetEmail,
        code: resetCode,
        newPassword
      });
      Alert.alert("Success", "Your password has been reset securely. You can now login.");
      setModalVisible(false);
      setStep(1);
      setResetCode('');
      setNewPassword('');
    } catch (error) {
      Alert.alert("Reset Failed", error.response?.data?.message || "Invalid or expired code.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Pocket Trainer</Text>
      <Text style={styles.subHeader}>Welcome Back</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={theme.textSecondary}
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor={theme.textSecondary}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.primaryButton} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color={theme.background} /> : <Text style={styles.buttonText}>Login</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => { setResetEmail(email); setModalVisible(true); }} style={{ marginBottom: 15 }}>
        <Text style={styles.linkText}>Forgot Password? <Text style={styles.linkHighlight}>Reset Here</Text></Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.linkText}>Don't have an account? <Text style={styles.linkHighlight}>Register</Text></Text>
      </TouchableOpacity>

      {/* SECURE RESET PASSWORD MODAL */}
      <Modal animationType="fade" transparent={true} visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{step === 1 ? "Forgot Password" : "Enter Verification Code"}</Text>
              <TouchableOpacity onPress={() => { setModalVisible(false); setStep(1); }}>
                <Ionicons name="close-circle" size={26} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            {step === 1 ? (
              <>
                <Text style={styles.modalSubText}>Enter your account email to receive a secure 6-digit reset code.</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Your Email Address"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={resetEmail}
                  onChangeText={setResetEmail}
                />
                <TouchableOpacity style={styles.primaryButton} onPress={handleSendCode} disabled={resetLoading}>
                  {resetLoading ? <ActivityIndicator color={theme.background} /> : <Text style={styles.buttonText}>Send Code</Text>}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.modalSubText}>Enter the code sent to {resetEmail} and your new password.</Text>
                <TextInput
                  style={styles.input}
                  placeholder="6-Digit Code"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="numeric"
                  value={resetCode}
                  onChangeText={setResetCode}
                />
                <TextInput
                  style={styles.input}
                  placeholder="New Password"
                  placeholderTextColor={theme.textSecondary}
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <TouchableOpacity style={styles.primaryButton} onPress={handleVerifyAndReset} disabled={resetLoading}>
                  {resetLoading ? <ActivityIndicator color={theme.background} /> : <Text style={styles.buttonText}>Reset Password</Text>}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background, justifyContent: 'center', padding: 20 },
  header: { fontSize: 36, fontWeight: 'bold', color: theme.accent, textAlign: 'center', marginBottom: 5 },
  subHeader: { fontSize: 18, color: theme.textSecondary, textAlign: 'center', marginBottom: 40 },
  input: { borderWidth: 1, borderColor: theme.shadow, backgroundColor: theme.card, borderRadius: 10, padding: 15, color: theme.textPrimary, marginBottom: 15, fontSize: 16 },
  primaryButton: { backgroundColor: theme.accent, padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10, marginBottom: 20 },
  buttonText: { color: theme.background, fontSize: 18, fontWeight: 'bold' },
  linkText: { color: theme.textSecondary, textAlign: 'center', fontSize: 14 },
  linkHighlight: { color: theme.accent, fontWeight: 'bold' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center' },
  modalView: { width: '88%', backgroundColor: theme.card, borderRadius: 20, padding: 24, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: theme.textPrimary },
  modalSubText: { fontSize: 14, color: theme.textSecondary, marginBottom: 18, lineHeight: 20 }
});