import React from 'react';
import { LoadingScreen } from '../../src/components/LoadingScreen';
import { AuthScreen } from '../../src/screens/AuthScreen';
import { MainScreen } from '../../src/screens/MainScreen';
import { useAuth, useAuthUser } from '../../src/store/hooks';

export default function HomeScreen() {
  const { initializationComplete } = useAuth();
  const { user, isAuthenticated, isLoading } = useAuthUser();

  // Show loading spinner while initializing auth
  if (!initializationComplete || isLoading) {
    return <LoadingScreen message="Initializing..." fullScreen={true} />;
  }

  // Show auth screen if not authenticated
  if (!isAuthenticated || !user) {
    return <AuthScreen />;
  }

  // Show main app screen if authenticated
  return <MainScreen />;
}
