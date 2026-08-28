import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Zap } from 'lucide-react-native';
import { NotificationService } from '../services/notificationService';
import { useSessionStore } from '../store/useSessionStore';

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { session, isInitialized, loadSavedSession } = useSessionStore();

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

  // Clean splash loader while checking saved Keystore session on boot
  if (!isInitialized) {
    return (
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <View style={styles.splashContainer}>
          <View style={styles.brandRow}>
            <Text style={styles.brandTitleAmul}>Amul</Text>
            <View style={styles.flashBadge}>
              <Zap size={13} color="#FFFFFF" />
              <Text style={styles.flashText}>FLASH</Text>
            </View>
          </View>
          <ActivityIndicator size="small" color="#2563EB" style={{ marginTop: 12 }} />
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
            title: 'Delivery Hubs & Radar',
            headerStyle: { backgroundColor: '#FFFFFF' },
            headerTintColor: '#0037B0',
            headerTitleStyle: { fontWeight: '800' },
          }}
        />
        <Stack.Screen
          name="cart"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
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
    letterSpacing: 0.5,
  },
});
