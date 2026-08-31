import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NotificationService } from '../services/notificationService';
import { useSessionStore } from '../store/useSessionStore';
import { AmulApiClient } from '../services/amulApi';
import { BrandLogoHeader } from '../components/BrandLogoHeader';
import { FullScreenAlarmOverlay } from '../components/FullScreenAlarmOverlay';
import { useStockStore } from '../store/useStockStore';
import { useThemeStore } from '../store/useThemeStore';
import { useAppTheme } from '../hooks/useAppTheme';

import {
  useFonts,
  Sora_400Regular,
  Sora_500Medium,
  Sora_600SemiBold,
  Sora_700Bold,
  Sora_800ExtraBold,
} from '@expo-google-fonts/sora';

let notifeeModule: any = null;
try {
  notifeeModule = require('@notifee/react-native').default;
} catch (_e) {
  notifeeModule = null;
}

let expoNotificationsModule: any = null;
try {
  expoNotificationsModule = require('expo-notifications');
} catch (_e) {
  expoNotificationsModule = null;
}

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { session, isInitialized, loadSavedSession, loadUserData, logout } = useSessionStore();
  const { isDark, colors } = useAppTheme();

  const [fontsLoaded] = useFonts({
    Sora_400Regular,
    Sora_500Medium,
    Sora_600SemiBold,
    Sora_700Bold,
    Sora_800ExtraBold,
  });

  useEffect(() => {
    NotificationService.initialize();
    useThemeStore.getState().loadSavedTheme();
    useStockStore.getState().loadSavedPreferences();
    AmulApiClient.onSessionExpired(() => {
      logout();
    });
    loadSavedSession();

    // Handle cold-start notification click (Notifee)
    if (notifeeModule && notifeeModule.getInitialNotification) {
      notifeeModule.getInitialNotification().then((initialNotification: any) => {
        const prodId = initialNotification?.notification?.data?.productId;
        const pincode = initialNotification?.notification?.data?.pincode;
        if (prodId) {
          useStockStore.getState().triggerAlarmEvent({
            id: `drop_${Date.now()}_${prodId}`,
            productId: prodId,
            productName: initialNotification?.notification?.title || 'Amul Restock Alert',
            pincode: pincode || useStockStore.getState().selectedPincode.pincode,
            timestamp: Date.now(),
            unitsAdded: 30,
            survivalDurationSecs: 180,
            variantName: 'Standard Pack',
          });
        }
      });
    }

    // Handle foreground notification click (Notifee)
    let notifeeUnsubscribe: any = null;
    if (notifeeModule && notifeeModule.onForegroundEvent) {
      notifeeUnsubscribe = notifeeModule.onForegroundEvent(({ type, detail }: any) => {
        // If user tapped 'Stop Alarm' action button
        if (detail?.pressAction?.id === 'stop_alarm') {
          if (detail?.notification?.id) {
            notifeeModule.cancelNotification(detail.notification.id);
          }
          useStockStore.getState().dismissAlarmEvent();
          return;
        }

        // Type 1 = PRESS, Type 2 = ACTION_PRESS (e.g. 'Open App')
        if (type === 1 || type === 2) {
          if (detail?.notification?.id) {
            notifeeModule.cancelNotification(detail.notification.id);
          }
          const prodId = detail?.notification?.data?.productId;
          const pincode = detail?.notification?.data?.pincode;
          if (prodId) {
            useStockStore.getState().triggerAlarmEvent({
              id: `drop_${Date.now()}_${prodId}`,
              productId: prodId,
              productName: detail?.notification?.title || 'Amul Restock Alert',
              pincode: pincode || useStockStore.getState().selectedPincode.pincode,
              timestamp: Date.now(),
              unitsAdded: 30,
              survivalDurationSecs: 180,
              variantName: 'Standard Pack',
            });
          }
        }
      });
    }

    // Handle Expo Notifications response (tap / click)
    let expoSub: any = null;
    if (expoNotificationsModule && expoNotificationsModule.addNotificationResponseReceivedListener) {
      try {
        expoSub = expoNotificationsModule.addNotificationResponseReceivedListener((response: any) => {
          const prodId = response?.notification?.request?.content?.data?.productId;
          const pincode = response?.notification?.request?.content?.data?.pincode;
          if (prodId) {
            useStockStore.getState().triggerAlarmEvent({
              id: `drop_${Date.now()}_${prodId}`,
              productId: prodId,
              productName: response?.notification?.request?.content?.title || 'Amul Restock Alert',
              pincode: pincode || useStockStore.getState().selectedPincode.pincode,
              timestamp: Date.now(),
              unitsAdded: 30,
              survivalDurationSecs: 180,
              variantName: 'Standard Pack',
            });
          }
        });
      } catch (_e) {}
    }

    return () => {
      if (typeof notifeeUnsubscribe === 'function') {
        notifeeUnsubscribe();
      }
      if (expoSub && typeof expoSub.remove === 'function') {
        expoSub.remove();
      }
    };
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
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={[styles.splashContainer, { backgroundColor: colors.background }]}>
          <BrandLogoHeader size="large" showSubtitle />
          <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 24 }} />
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
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
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.primary,
            headerTitleStyle: { fontWeight: '800', color: colors.text },
          }}
        />
        <Stack.Screen
          name="locations"
          options={{
            headerShown: true,
            title: 'Delivery Locations',
            headerStyle: { backgroundColor: colors.surface },
            headerTintColor: colors.primary,
            headerTitleStyle: { fontWeight: '800', color: colors.text },
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
    alignItems: 'center',
    justifyContent: 'center',
  },
});

