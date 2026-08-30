import React, { useContext } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';

import { AuthContext } from '../context/AuthContext';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ChatScreen from '../screens/ChatScreen';
import ActiveWorkoutScreen from '../screens/ActiveWorkoutScreen';
import ProgressSummaryScreen from '../screens/ProgressSummaryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AboutScreen from '../screens/AboutScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const appTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#0A0A0A',
    card: '#1E1E1E',
    text: '#FFFFFF',
  },
};

// In navigation/AppNavigation.jsx:
const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
      tabBarHideOnKeyboard: true, // <-- Prevents tab bar from jumping up over keyboard
      tabBarStyle: {
        backgroundColor: '#1E1E1E',
        borderTopColor: '#00FF7F44',
        height: 70,
        paddingBottom: 10,
        paddingTop: 5,
      },
      tabBarActiveTintColor: '#00FF7F',
      tabBarInactiveTintColor: '#BBBBBB',
    }}
  >
    <Tab.Screen 
      name="DashboardTab" 
      component={DashboardScreen} 
      options={{ tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />, title: "Home" }} 
    />
    <Tab.Screen 
      name="AITrainerTab" 
      component={ChatScreen} 
      options={{ tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles" size={size} color={color} />, title: "AI Trainer" }} 
    />
    <Tab.Screen 
      name="ProfileTab" 
      component={ProfileScreen} 
      options={{ tabBarIcon: ({ color, size }) => <Ionicons name="person" size={size} color={color} />, title: "Profile" }} 
    />
  </Tab.Navigator>
);

const AppStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MainTabs" component={MainTabs} />
    <Stack.Screen name="ActiveWorkout" component={ActiveWorkoutScreen} />
    <Stack.Screen name="ProgressSummary" component={ProgressSummaryScreen} />
    <Stack.Screen name="About" component={AboutScreen} />
  </Stack.Navigator>
);

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
  </Stack.Navigator>
);

const AppNavigation = () => {
  const { userToken, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: '#0A0A0A' }}>
        <ActivityIndicator size="large" color="#00FF7F" />
      </View>
    );
  }

  return (
    <NavigationContainer theme={appTheme}>
      {userToken === null ? <AuthStack /> : <AppStack />}
      <StatusBar style="light" />
    </NavigationContainer>
  );
};

export default AppNavigation;