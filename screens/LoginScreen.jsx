import React, { useState, useContext, useEffect, useRef } from 'react';
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

  // Multi-Step Reset Modal States
  const [modalVisible, setModalVisible] = useState(false);
  const [step, setStep] = useState(1); // 1: Email, 2: Code, 3: Password + Confirm Password
  const [resetEmail, setResetEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  // Resend Countdown Timer States
  const [timer, setTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const timerRef = useRef(null);

  const startCountdown = () => {
    setTimer(60);
    setCanResend(false);

    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const resetModalState = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setModalVisible(false);
    setStep(1);
    setResetCode('');
    setNewPassword('');
    setConfirmPassword('');
    setTimer(60);
    setCanResend(false);
  };

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

  // Step 1: Send 6-Digit Code
  const handleSendCode = async () => {
    if (!resetEmail.trim()) {
      return Alert.alert("Required", "Please enter your email address.");
    }
    setResetLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', { email: resetEmail.trim() });
      Alert.alert(
        "Notice",
        response.data?.message || "If an account with that email exists, a reset code was sent."
      );
      startCountdown();
      setStep(2);
    } catch (error) {
      Alert.alert("Error", error.response?.data?.message || "Failed to send reset code.");
    } finally {
      setResetLoading(false);
    }
  };

  // Resend Code handler (available on Step 2)
  const handleResendCode = async () => {
    if (!canResend || resetLoading) return;
    setResetLoading(true);
    try {
      const response = await api.post('/auth/forgot-password', { email: resetEmail.trim() });
      Alert.alert(
        "Notice",
        response.data?.message || "If an account with that email exists, a reset code was sent."
      );
      startCountdown();
    } catch (error) {
      Alert.alert("Error", error.response?.data?.message || "Failed to resend code.");
    } finally {
      setResetLoading(false);
    }
  };

  // Step 2: Validate Code format and advance
  const handleVerifyCodeStep = () => {
    if (!resetCode.trim() || resetCode.trim().length !== 6) {
      return Alert.alert("Invalid Code", "Please enter the complete 6-digit verification code.");
    }
    setStep(3);
  };

  // Step 3: Verify Password Match & Submit to Backend
  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      return Alert.alert("Required", "Please fill in both password fields.");
    }
    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return Alert.alert(
        "Weak Password",
        "Password must be at least 8 characters long, contain 1 uppercase letter, and 1 number."
      );
    }
    if (newPassword !== confirmPassword) {
      return Alert.alert("Mismatch", "New password and confirm password do not match.");
    }

    setResetLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email: resetEmail.trim(),
        code: resetCode.trim(),
        newPassword,
      });
      Alert.alert("Success", "Your password has been reset securely. You can now login.");
      resetModalState();
    } catch (error) {
      Alert.alert("Reset Failed", error.response?.data?.message || "Invalid or expired reset code.");
      setStep(2); // Send back to code step if invalid
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

      {/* 3-STEP SECURE RESET PASSWORD MODAL */}
      <Modal animationType="fade" transparent={true} visible={modalVisible}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalView}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {step === 1 && "Forgot Password"}
                {step === 2 && "Enter Verification Code"}
                {step === 3 && "Set New Password"}
              </Text>
              <TouchableOpacity onPress={resetModalState}>
                <Ionicons name="close-circle" size={26} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* STEP 1: Enter Email */}
            {step === 1 && (
              <>
                <Text style={styles.modalSubText}>
                  Enter your account email to receive a 6-digit verification code.
                </Text>
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
            )}

            {/* STEP 2: Enter 6-Digit Code */}
            {step === 2 && (
              <>
                <Text style={styles.modalSubText}>
                  If an account with that email exists, a reset code was sent.
                </Text>
                <TextInput
                  style={[styles.input, styles.codeInput]}
                  placeholder="000000"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="numeric"
                  maxLength={6}
                  value={resetCode}
                  onChangeText={setResetCode}
                />
                <TouchableOpacity style={styles.primaryButton} onPress={handleVerifyCodeStep}>
                  <Text style={styles.buttonText}>Continue</Text>
                </TouchableOpacity>

                {/* Resend Code with 60s Countdown Timer */}
                <View style={styles.resendRow}>
                  <TouchableOpacity onPress={handleResendCode} disabled={!canResend || resetLoading}>
                    <Text style={[styles.resendText, !canResend && styles.disabledResendText]}>
                      {canResend ? "Resend Code" : `Resend Code in ${timer}s`}
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity onPress={() => setStep(1)} style={{ marginTop: 12, alignItems: 'center' }}>
                  <Text style={styles.backStepText}>← Change Email</Text>
                </TouchableOpacity>
              </>
            )}

            {/* STEP 3: New Password & Confirm Password */}
            {step === 3 && (
              <>
                <Text style={styles.modalSubText}>Create a new password (min. 8 characters, 1 uppercase, 1 digit).</Text>
                <TextInput
                  style={styles.input}
                  placeholder="New Password"
                  placeholderTextColor={theme.textSecondary}
                  secureTextEntry
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm New Password"
                  placeholderTextColor={theme.textSecondary}
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <TouchableOpacity style={styles.primaryButton} onPress={handleResetPassword} disabled={resetLoading}>
                  {resetLoading ? <ActivityIndicator color={theme.background} /> : <Text style={styles.buttonText}>Update Password</Text>}
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setStep(2)} style={{ marginTop: 10, alignItems: 'center' }}>
                  <Text style={styles.backStepText}>← Back to Code</Text>
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
  codeInput: { textAlign: 'center', letterSpacing: 8, fontSize: 24, fontWeight: 'bold' },
  primaryButton: { backgroundColor: theme.accent, padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10, marginBottom: 15 },
  buttonText: { color: theme.background, fontSize: 18, fontWeight: 'bold' },
  linkText: { color: theme.textSecondary, textAlign: 'center', fontSize: 14 },
  linkHighlight: { color: theme.accent, fontWeight: 'bold' },
  backStepText: { color: theme.textSecondary, fontSize: 14, fontWeight: '500' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center' },
  modalView: { width: '88%', backgroundColor: theme.card, borderRadius: 20, padding: 24, elevation: 10 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: theme.textPrimary },
  modalSubText: { fontSize: 14, color: theme.textSecondary, marginBottom: 18, lineHeight: 20 },

  // Resend Component
  resendRow: { alignItems: 'center', marginTop: 4, marginBottom: 6 },
  resendText: { color: theme.accent, fontSize: 14, fontWeight: 'bold' },
  disabledResendText: { color: theme.textSecondary, fontWeight: 'normal' },
});