import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axiosConfig';
import { theme } from '../theme';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);

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

  const handleResetPassword = () => {
    if (!email) {
      Alert.alert("Required", "Please enter your email address in the field above first.");
      return;
    }
    
    Alert.prompt(
      "Reset Password",
      "Enter your new password below:",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Reset", 
          onPress: async (newPassword) => {
            try {
              await api.post('/auth/reset-password', { email, newPassword });
              Alert.alert("Success", "Password reset successfully. You can now log in.");
            } catch (error) {
              Alert.alert("Error", error.response?.data?.message || "Reset failed");
            }
          }
        }
      ],
      "secure-text"
    );
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

      <TouchableOpacity onPress={handleResetPassword} style={{ marginBottom: 15 }}>
        <Text style={styles.linkText}>Forgot Password? <Text style={styles.linkHighlight}>Reset Here</Text></Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.linkText}>Don't have an account? <Text style={styles.linkHighlight}>Register</Text></Text>
      </TouchableOpacity>
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
  linkHighlight: { color: theme.accent, fontWeight: 'bold' }
});