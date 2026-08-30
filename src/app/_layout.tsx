import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NotificationService } from '../services/notificationService';
import { useSessionStore } from '../store/useSessionStore';
import { useStockStore } from '../store/useStockStore';
import { alarmSoundService } from '../services/alarmSoundService';
import { AmulApiClient } from '../services/amulApi';
import { BrandLogoHeader } from '../components/BrandLogoHeader';

import {
  useFonts,
  Sora_400Regular,
  Sora_500Medium,
  Sora_600SemiBold,
  Sora_700Bold,
  Sora_800ExtraBold,
} from '@expo-google-fonts/sora';

import { FullScreenAlarmOverlay } from '../components/FullScreenAlarmOverlay';

let notifeeModule: any = null;
try {
  notifeeModule = require('@notifee/react-native').default;
} catch (_e) {
  notifeeModule = null;
}

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { session, isInitialized, loadSavedSession, loadUserData, logout } = useSessionStore();

  const [fontsLoaded] = useFonts({
    Sora_400Regular,
    Sora_500Medium,
    Sora_600SemiBold,
    Sora_700Bold,
    Sora_800ExtraBold,
  });

  useEffect(() => {
    NotificationService.initialize();
    AmulApiClient.onSessionExpired(() => {
      logout();
    });
    loadSavedSession();

    // Check if app was launched by a Full-Screen Alarm Notification
    if (notifeeModule && notifeeModule.getInitialNotification) {
      notifeeModule.getInitialNotification().then((initialNotification: any) => {
        if (initialNotification?.notification) {
          const soundId = useStockStore.getState().selectedAlarmSoundId;
          alarmSoundService.startAlarm(soundId);
          useStockStore.setState({
            activeAlarmEvent: {
              id: `drop_${Date.now()}`,
              productId: initialNotification.notification.data?.productId || 'protein',
              productName: initialNotification.notification.title || 'Restock Alert',
              pincode: useStockStore.getState().selectedPincode.pincode,
              timestamp: Date.now(),
              unitsAdded: 30,
              survivalDurationSecs: 180,
              variantName: 'Standard Pack',
            },
          });
        }
      });
    }

    // Listen for incoming alarm events
    if (notifeeModule && notifeeModule.onForegroundEvent) {
      const unsubscribe = notifeeModule.onForegroundEvent(({ type, detail }: any) => {
        if (type === 1 /* DELIVERED */ || type === 3 /* PRESS */ || type === 7 /* ACTION_PRESS */) {
          if (detail.notification?.data?.isAlarmTrigger === 'true') {
            const soundId = useStockStore.getState().selectedAlarmSoundId;
            alarmSoundService.startAlarm(soundId);
            useStockStore.setState({
              activeAlarmEvent: {
                id: `drop_${Date.now()}`,
                productId: detail.notification.data?.productId || 'protein',
                productName: detail.notification.title || 'Restock Alert',
                pincode: useStockStore.getState().selectedPincode.pincode,
                timestamp: Date.now(),
                unitsAdded: 30,
                survivalDurationSecs: 180,
                variantName: 'Standard Pack',
              },
            });
          }
        }
      });
      return () => unsubscribe();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === 'login';

    if (!session.isLoggedIn && !inAuthGroup) {
      router.replace('/login');
    } else if (session.isLoggedIn) {
      loadUserData();
      if (inAuthGroup) {
        router.replace('/(tabs)');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.isLoggedIn, isInitialized, segments]);

  // Clean splash loader while checking saved Keystore session on boot and loading fonts
  if (!isInitialized || !fontsLoaded) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <View style={styles.splashContainer}>
          <BrandLogoHeader size="large" showSubtitle />
          <ActivityIndicator size="small" color="#2563EB" style={{ marginTop: 24 }} />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#FAF8FF' },
          animation: 'fade',
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
            title: 'Delivery Locations',
            headerStyle: { backgroundColor: '#FFFFFF' },
            headerTintColor: '#0037B0',
            headerTitleStyle: { fontWeight: '800' },
          }}
        />

        <Stack.Screen
          name="orders"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen
          name="addresses"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
      </Stack>
      <FullScreenAlarmOverlay />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: '#FAF8FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandTitleAmul: {
    fontSize: 34,
    fontWeight: '900',
    fontFamily: 'PlusJakartaSans_800ExtraBold_Italic',
    color: '#0037B0',
    letterSpacing: -0.5,
    fontStyle: 'italic',
  },
  flashBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B00',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 2,
  },
  flashText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    letterSpacing: 0.5,
  },
});
