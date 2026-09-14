import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NotificationService } from '../services/notificationService';
import { backgroundFetchService } from '../services/backgroundFetchService';
import { fcmService } from '../services/fcmService';
import { supabaseService } from '../services/supabaseClient';
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

function getFirebaseMessagingInstance(): any {
  if (Platform.OS === 'web') return null;
  try {
    const mod = require('@react-native-firebase/messaging');
    if (!mod) return null;
    if (typeof mod.getMessaging === 'function') {
      return mod.getMessaging();
    }
    if (mod.default && typeof mod.default.getMessaging === 'function') {
      return mod.default.getMessaging();
    }
    if (typeof mod === 'function') {
      return mod();
    }
    if (typeof mod.default === 'function') {
      return mod.default();
    }
    if (typeof mod.onMessage === 'function') {
      return mod;
    }
    if (mod.default && typeof mod.default.onMessage === 'function') {
      return mod.default;
    }
    return null;
  } catch (_e) {
    return null;
  }
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
    backgroundFetchService.registerBackgroundFetch();
    fcmService.initialize((token) => {
      supabaseService.registerDevice(token);
    });
    useThemeStore.getState().loadSavedTheme();
    useStockStore.getState().loadSavedPreferences();
    AmulApiClient.onSessionExpired(() => {
      logout();
    });
    loadSavedSession();

    // Helper to safely trigger alarm event from any notification payload
    const handleNotificationPayload = (title: string, data: any) => {
      console.log('🚨 [RootLayout] Handling notification payload:', { title, data });
      if (!data) data = {};
      let prodId = data.productId || data.product_id || data.id;
      if (!prodId && typeof data.body === 'string' && data.body.includes('productId')) {
        try {
          const parsed = JSON.parse(data.body);
          prodId = parsed.productId || parsed.product_id;
        } catch (_e) {}
      }

      if (!prodId) {
        const trackedKeys = Object.keys(useStockStore.getState().trackedProductsMap);
        prodId = trackedKeys[0] || useStockStore.getState().products[0]?.id || '66505ff5145c16635e6cc74d';
      }

      const pincode = data.pincode || useStockStore.getState().selectedPincode.pincode || 'all';
      const cleanTitle = (title || data.title || 'Amul Restock Alert').replace(/^⚡\s*(Restock Alert:\s*)?/i, '');

      useStockStore.getState().triggerAlarmEvent({
        id: `drop_${Date.now()}_${prodId}`,
        productId: prodId,
        productName: cleanTitle || 'Amul Protein Product',
        pincode: pincode,
        timestamp: Date.now(),
        unitsAdded: Number(data.unitsAdded || data.stockCount || 30),
        survivalDurationSecs: 300,
        variantName: data.variantName || 'Standard Pack',
      });
    };

    // 1. Firebase Messaging Foreground onMessage Listener (Scenario B - App Open)
    let fbUnsubscribe: any = null;
    try {
      const messagingInstance = getFirebaseMessagingInstance();
      if (messagingInstance && typeof messagingInstance.onMessage === 'function') {
        fbUnsubscribe = messagingInstance.onMessage(async (remoteMessage: any) => {
          console.log('🔥 [RootLayout] Firebase Foreground message received:', remoteMessage);
          handleNotificationPayload(
            remoteMessage?.notification?.title || remoteMessage?.data?.title || '⚡ Amul Restock Alert!',
            remoteMessage?.data || {}
          );
        });
        console.log('✅ [RootLayout] Firebase onMessage listener attached');
      }
    } catch (fbErr) {
      console.log('⚠️ [RootLayout] Firebase onMessage attach error:', fbErr);
    }

    // 2. Handle cold-start notification click (Notifee)
    if (notifeeModule && notifeeModule.getInitialNotification) {
      notifeeModule.getInitialNotification().then((initialNotification: any) => {
        if (initialNotification?.notification) {
          handleNotificationPayload(
            initialNotification.notification.title || '',
            initialNotification.notification.data
          );
        }
      }).catch(() => {});
    }

    // 3. Handle cold-start notification click (Expo Notifications)
    if (expoNotificationsModule && expoNotificationsModule.getLastNotificationResponseAsync) {
      expoNotificationsModule.getLastNotificationResponseAsync().then((response: any) => {
        if (response?.notification) {
          handleNotificationPayload(
            response.notification.request?.content?.title || '',
            response.notification.request?.content?.data
          );
        }
      }).catch(() => {});
    }

    // 4. Handle foreground notification click (Notifee)
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
          handleNotificationPayload(
            detail?.notification?.title || '',
            detail?.notification?.data
          );
        }
      });
    }

    // 5. Handle Expo Notifications RECEIVED in foreground (Scenario B - App open)
    let expoReceivedSub: any = null;
    if (expoNotificationsModule && expoNotificationsModule.addNotificationReceivedListener) {
      try {
        expoReceivedSub = expoNotificationsModule.addNotificationReceivedListener((notification: any) => {
          console.log('⚡ [Expo Notification Received in Foreground]:', notification);
          handleNotificationPayload(
            notification?.request?.content?.title || '',
            notification?.request?.content?.data
          );
        });
      } catch (_e) {}
    }

    // 6. Handle Expo Notifications response (tap / click in background or cold start)
    let expoSub: any = null;
    if (expoNotificationsModule && expoNotificationsModule.addNotificationResponseReceivedListener) {
      try {
        expoSub = expoNotificationsModule.addNotificationResponseReceivedListener((response: any) => {
          console.log('👆 [Expo Notification Tapped]:', response);
          handleNotificationPayload(
            response?.notification?.request?.content?.title || '',
            response?.notification?.request?.content?.data
          );
        });
      } catch (_e) {}
    }

    return () => {
      if (typeof fbUnsubscribe === 'function') {
        fbUnsubscribe();
      }
      if (typeof notifeeUnsubscribe === 'function') {
        notifeeUnsubscribe();
      }
      if (expoSub && typeof expoSub.remove === 'function') {
        expoSub.remove();
      }
      if (expoReceivedSub && typeof expoReceivedSub.remove === 'function') {
        expoReceivedSub.remove();
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

