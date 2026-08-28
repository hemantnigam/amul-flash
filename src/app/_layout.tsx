import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Theme } from '../constants/theme';
import { NotificationService } from '../services/notificationService';
import { useSessionStore } from '../store/useSessionStore';
import { useStockStore } from '../store/useStockStore';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { session, isInitialized, loadSavedSession } = useSessionStore();
  const { loadInitialData } = useStockStore();

  useEffect(() => {
    NotificationService.initialize();
    loadSavedSession();
    loadInitialData();
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === 'login';

    // If user is not logged in and not already on the login screen, redirect to login
    if (!session.isLoggedIn && !inAuthGroup) {
      router.replace('/login');
    } else if (session.isLoggedIn && inAuthGroup) {
      // If user is logged in and on the login screen, route to tabs home
      router.replace('/(tabs)');
    }
  }, [session.isLoggedIn, isInitialized, segments]);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Theme.colors.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="product/[id]"
          options={{
            headerShown: true,
            title: 'Product Details',
            headerStyle: { backgroundColor: Theme.colors.surfaceContainerLowest },
            headerTintColor: Theme.colors.primary,
            headerTitleStyle: { fontWeight: '700' },
          }}
        />
        <Stack.Screen
          name="locations"
          options={{
            headerShown: true,
            title: 'Radius Radar & Locations',
            headerStyle: { backgroundColor: Theme.colors.surfaceContainerLowest },
            headerTintColor: Theme.colors.primary,
            headerTitleStyle: { fontWeight: '700' },
          }}
        />
        <Stack.Screen
          name="fallback"
          options={{
            headerShown: true,
            title: 'Fallback & Basket Rules',
            headerStyle: { backgroundColor: Theme.colors.surfaceContainerLowest },
            headerTintColor: Theme.colors.primary,
            headerTitleStyle: { fontWeight: '700' },
          }}
        />
        <Stack.Screen
          name="refill"
          options={{
            headerShown: true,
            title: 'Refill & Expiry Tracker',
            headerStyle: { backgroundColor: Theme.colors.surfaceContainerLowest },
            headerTintColor: Theme.colors.primary,
            headerTitleStyle: { fontWeight: '700' },
          }}
        />
        <Stack.Screen
          name="checkout"
          options={{
            presentation: 'modal',
            headerShown: true,
            title: 'Flash Checkout',
            headerStyle: { backgroundColor: Theme.colors.surfaceContainerLowest },
            headerTintColor: Theme.colors.primary,
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
