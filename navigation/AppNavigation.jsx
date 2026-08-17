import React, { useContext } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';

import { AuthContext } from '../context/AuthContext';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ChatScreen from '../screens/ChatScreen';

// We will create these two files in the next step
import ActiveWorkoutScreen from '../screens/ActiveWorkoutScreen';
import ProgressSummaryScreen from '../screens/ProgressSummaryScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const appTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#0A0A0A',
    card: '#1E1E1E',
    text: '#FFFFFF',
  },
};

// 1. The Bottom Tabs
const MainTabs = () => (
  <Tab.Navigator
    screenOptions={{
      headerShown: false,
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

// 2. The Master App Stack (Wraps Tabs + Full Screen Workouts)
const AppStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="MainTabs" component={MainTabs} />
    <Stack.Screen name="ActiveWorkout" component={ActiveWorkoutScreen} />
    <Stack.Screen name="ProgressSummary" component={ProgressSummaryScreen} />
  </Stack.Navigator>
);

// 3. The Auth Stack
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