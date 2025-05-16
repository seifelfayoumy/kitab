import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { SplashScreen, Stack, useRouter, useSegments, useRootNavigationState } from 'expo-router';
import { useFonts } from 'expo-font';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { FontProvider } from '@/contexts/FontContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { initializeFirebase } from '@/config/firebase';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

// Handle navigation based on auth state
function AuthNavigationProvider({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const rootNavigationState = useRootNavigationState();
  
  useEffect(() => {
    if (loading || !rootNavigationState?.key) return;
    
    const inAuthGroup = segments[0] === 'auth';
    const currentRoute = segments.join('/');

    // Handle routing based on auth state
    if (!user) {
      // User is not logged in and not on an auth screen
      if (!inAuthGroup) {
        router.replace('/auth/login');
      }
    } else {
      // User is logged in
      if (!user.displayName || !user.avatar) {
        // User needs to create a profile
        if (currentRoute !== 'auth/profile-creation') {
          router.replace('/auth/profile-creation');
        }
      } else if (inAuthGroup) {
        // User has complete profile but is on auth screen
        router.replace('/(tabs)');
      }
    }
  }, [user, loading, segments, router, rootNavigationState?.key]);

  return <>{children}</>;
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Initialize Firebase when the app loads
  useEffect(() => {
    initializeFirebase();
  }, []);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return <View style={styles.container} />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <FontProvider>
        <AuthProvider>
          <AuthNavigationProvider>
            <Stack screenOptions={{ headerShown: false }} />
          </AuthNavigationProvider>
        </AuthProvider>
      </FontProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
