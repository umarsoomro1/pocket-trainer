import React, { useEffect } from 'react';
import { registerForPushNotificationsAsync } from './services/notificationService';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigation from './navigation/AppNavigation';
import { AuthProvider } from './context/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AuthProvider>
          <AppNavigation />
        </AuthProvider>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}