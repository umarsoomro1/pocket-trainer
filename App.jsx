import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigation from './navigation/AppNavigation';
import { AuthProvider } from './context/AuthContext';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppNavigation />
      </AuthProvider>
    </SafeAreaProvider>
  );
}