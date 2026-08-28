import React, { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
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
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === 'login';

    if (!session.isLoggedIn && !inAuthGroup) {
      router.replace('/login');
    } else if (session.isLoggedIn && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session.isLoggedIn, isInitialized, segments]);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#FAF8FF' },
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
            headerStyle: { backgroundColor: '#FFFFFF' },
            headerTintColor: '#0037B0',
            headerTitleStyle: { fontWeight: '800' },
          }}
        />
        <Stack.Screen
          name="locations"
          options={{
            headerShown: true,
            title: 'Delivery Hubs & Radar',
            headerStyle: { backgroundColor: '#FFFFFF' },
            headerTintColor: '#0037B0',
            headerTitleStyle: { fontWeight: '800' },
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}
