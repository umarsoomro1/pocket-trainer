import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../theme';

const AboutScreen = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Header with Back Navigation */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={26} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>About Project</Text>
        <View style={{ width: 26 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* App Title & Version Banner */}
        <View style={styles.heroCard}>
          <Ionicons name="barbell" size={48} color={theme.accent} style={{ marginBottom: 10 }} />
          <Text style={styles.appTitle}>Pocket Trainer</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>Version 1.0.0 · AI-Powered Fitness</Text>
          </View>
        </View>

        {/* Developer Credit Card */}
        <Text style={styles.sectionHeader}>Developer Credit</Text>
        <View style={styles.creditCard}>
          <View style={styles.avatarCircle}>
            <Ionicons name="code-slash" size={24} color={theme.background} />
          </View>
          <View style={styles.creditInfo}>
            <Text style={styles.creditLabel}>Lead Developer</Text>
            <Text style={styles.creditName}>Muhammad Umar Soomro</Text>
            <Text style={styles.creditRole}>Computer Engineering Student</Text>
          </View>
        </View>

        {/* Project Description */}
        <Text style={styles.sectionHeader}>Project Overview</Text>
        <View style={styles.card}>
          <Text style={styles.bodyText}>
            Pocket Trainer is an intelligent fitness mobile platform built to replace static workout templates with dynamic, highly personalized 4-week training routines tailored to individual biometrics, split preferences, and fitness goals.
          </Text>
        </View>

        {/* Architecture & Tech Stack Details */}
        <Text style={styles.sectionHeader}>System Architecture</Text>
        <View style={styles.card}>
          <View style={styles.featureRow}>
            <Ionicons name="hardware-chip-outline" size={20} color={theme.accent} style={styles.featureIcon} />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Fine-Tuned LLaMA 3.1 8B</Text>
              <Text style={styles.featureDesc}>Hosted serverless on cloud NVIDIA T4 GPUs via Modal Labs for JSON program generation and conversational fitness coaching.</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.featureRow}>
            <Ionicons name="film-outline" size={20} color={theme.accent} style={styles.featureIcon} />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>RapidAPI Exercise Demonstrations</Text>
              <Text style={styles.featureDesc}>Dynamic fetching of exercise animation GIFs to guide movement mechanics and execution.</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.featureRow}>
            <Ionicons name="stats-chart-outline" size={20} color={theme.accent} style={styles.featureIcon} />
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Progress & Streak Analytics</Text>
              <Text style={styles.featureDesc}>Real-time streak computation, workout history, and weight progression visualizations backed by MongoDB.</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default AboutScreen;

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: theme.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: theme.shadow,
    backgroundColor: theme.background,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: theme.textPrimary },
  backButton: { padding: 4 },
  container: { paddingHorizontal: 20, paddingBottom: 40, paddingTop: 20 },
  heroCard: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 25,
    elevation: 4,
    shadowColor: theme.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  appTitle: { fontSize: 28, fontWeight: 'bold', color: theme.textPrimary, marginBottom: 8 },
  badge: {
    backgroundColor: '#00FF7F22',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeText: { color: theme.accent, fontSize: 13, fontWeight: 'bold' },
  sectionHeader: { fontSize: 18, fontWeight: 'bold', color: theme.textPrimary, marginBottom: 12, marginLeft: 4 },
  creditCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 25,
    elevation: 4,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  creditInfo: { flex: 1 },
  creditLabel: { fontSize: 12, color: theme.accentAlt, fontWeight: 'bold', textTransform: 'uppercase' },
  creditName: { fontSize: 18, fontWeight: 'bold', color: theme.textPrimary, marginTop: 2 },
  creditRole: { fontSize: 14, color: theme.textSecondary, marginTop: 1 },
  card: {
    backgroundColor: theme.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 25,
    elevation: 4,
  },
  bodyText: { fontSize: 15, color: theme.textSecondary, lineHeight: 24 },
  featureRow: { flexDirection: 'row', alignItems: 'flex-start' },
  featureIcon: { marginRight: 12, marginTop: 2 },
  featureContent: { flex: 1 },
  featureTitle: { fontSize: 16, fontWeight: 'bold', color: theme.textPrimary, marginBottom: 4 },
  featureDesc: { fontSize: 14, color: theme.textSecondary, lineHeight: 20 },
  divider: { height: 1, backgroundColor: '#333333', marginVertical: 15 },
});