/**
 * School ID Card Automation System – School App
 * Login: Mobile + OTP. Features: Dashboard, Class/Student list, Preview approve/reject,
 * Correction raise, Delivery confirm, Reports. No photo capture/upload or direct student edit.
 */

import React from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import { StudentProvider } from './src/context/StudentContext';
import FrameShapeMaskHost from './src/components/FrameShapeMaskHost';
import SplashScreen from './src/screens/SplashScreen';
import AuthStack from './src/navigation/AuthStack';
import BottomTabs from './src/navigation/BottomTabs';

function AppContent() {
  const { isLoggedIn, isReady } = useAuth();

  if (!isReady) {
    return <SplashScreen />;
  }
  if (!isLoggedIn) {
    return (
      <NavigationContainer>
        <AuthStack />
      </NavigationContainer>
    );
  }
  return (
    <NavigationContainer>
      <BottomTabs />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor="#f1f5f9" />
      <AuthProvider>
        <StudentProvider>
          <FrameShapeMaskHost />
          <AppContent />
        </StudentProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
