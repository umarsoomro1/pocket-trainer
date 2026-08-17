import React, { useState, useContext } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { theme } from '../theme';

const RegisterScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dob, setDob] = useState('');
  const [weight, setWeight] = useState('');
  const [goal, setGoal] = useState('muscle_gain');
  const [loading, setLoading] = useState(false);
  
  const { register } = useContext(AuthContext);

  const handleRegister = async () => {
    if (!email || !password || !dob || !weight) {
      Alert.alert("Error", "Please fill out all biometric data.");
      return;
    }
    
    setLoading(true);
    try {
      await register({
        email,
        password,
        dob,
        weight: parseFloat(weight),
        goal
      });
    } catch (error) {
      Alert.alert("Registration Failed", error.response?.data?.message || "Check your network connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Join the Program</Text>
      <Text style={styles.subHeader}>Set your baseline stats for the AI.</Text>

      <TextInput style={styles.input} placeholder="Email" placeholderTextColor={theme.textSecondary} autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="Password" placeholderTextColor={theme.textSecondary} secureTextEntry value={password} onChangeText={setPassword} />
      
      <View style={styles.row}>
        <TextInput style={[styles.input, styles.halfInput]} placeholder="DOB (YYYY-MM-DD)" placeholderTextColor={theme.textSecondary} value={dob} onChangeText={setDob} />
        <TextInput style={[styles.input, styles.halfInput]} placeholder="Weight (lbs)" placeholderTextColor={theme.textSecondary} keyboardType="numeric" value={weight} onChangeText={setWeight} />
      </View>

      <Text style={styles.label}>Primary Goal</Text>
      <View style={styles.goalContainer}>
        {['weight_loss', 'maintenance', 'muscle_gain'].map((g) => (
          <TouchableOpacity 
            key={g} 
            style={[styles.goalButton, goal === g && styles.goalButtonActive]}
            onPress={() => setGoal(g)}
          >
            <Text style={[styles.goalText, goal === g && styles.goalTextActive]}>
              {g.replace('_', ' ').toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={handleRegister} disabled={loading}>
        {loading ? <ActivityIndicator color={theme.background} /> : <Text style={styles.buttonText}>Create Profile</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.linkText}>Already have an account? <Text style={styles.linkHighlight}>Login</Text></Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: theme.background, justifyContent: 'center', padding: 20 },
  header: { fontSize: 32, fontWeight: 'bold', color: theme.accent, textAlign: 'center', marginBottom: 5, marginTop: 40 },
  subHeader: { fontSize: 16, color: theme.textSecondary, textAlign: 'center', marginBottom: 30 },
  input: { borderWidth: 1, borderColor: theme.shadow, backgroundColor: theme.card, borderRadius: 10, padding: 15, color: theme.textPrimary, marginBottom: 15, fontSize: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  halfInput: { width: '48%' },
  label: { color: theme.textPrimary, fontSize: 16, marginBottom: 10, marginTop: 5 },
  goalContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  goalButton: { flex: 1, borderWidth: 1, borderColor: '#555', paddingVertical: 10, borderRadius: 8, marginHorizontal: 4, alignItems: 'center' },
  goalButtonActive: { borderColor: theme.accent, backgroundColor: theme.shadow },
  goalText: { color: theme.textSecondary, fontSize: 12, fontWeight: 'bold' },
  goalTextActive: { color: theme.accent },
  primaryButton: { backgroundColor: theme.accent, padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 20 },
  buttonText: { color: theme.background, fontSize: 16, fontWeight: 'bold' },
  linkText: { color: theme.textSecondary, textAlign: 'center', fontSize: 14, marginBottom: 40 },
  linkHighlight: { color: theme.accent, fontWeight: 'bold' }
});