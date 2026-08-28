import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Theme } from '../constants/theme';
import { NotificationService } from '../services/notificationService';

export default function RootLayout() {
  useEffect(() => {
    NotificationService.initialize();
  }, []);

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
          name="login"
          options={{
            headerShown: true,
            title: 'Amul D2C Session',
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
