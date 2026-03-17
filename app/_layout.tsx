import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useState, useEffect } from 'react';
import * as SplashScreen from 'expo-splash-screen';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { CustomSplashScreen } from '../src/components/CustomSplashScreen';
import { SecurityOverlay } from '../components/security/SecurityOverlay';

// Prevent native splash screen from auto-hiding so we can transition smoothly
SplashScreen.preventAutoHideAsync().catch(() => {});

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [appReady, setAppReady] = useState(false);

  return (
    <>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
      
      {/* Security Overlay for app locking */}
      <SecurityOverlay />
      
      {/* Our Custom Animated Splash Screen acts as an overlay */}
      {!appReady && <CustomSplashScreen onComplete={() => setAppReady(true)} />}
    </>
  );
}
