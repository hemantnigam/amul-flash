import React from 'react';
import { Platform, Pressable } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Radio, User } from 'lucide-react-native';
import { useSessionStore } from '../../store/useSessionStore';

export default function TabLayout() {
  const { session, isInitialized } = useSessionStore();
  const insets = useSafeAreaInsets();

  // If user is not logged in or auth is still checking, do not render dashboard tabs
  if (!isInitialized || !session.isLoggedIn) {
    return null;
  }

  // Dynamically calculate bottom padding based on Android 3-button nav, gesture bar, or iOS home indicator
  const bottomInset = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'android' ? 12 : 8);
  const tabHeight = 60 + bottomInset;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#64748B',
        tabBarButton: (props) => (
          <Pressable
            {...(props as any)}
            android_ripple={null}
            style={({ pressed }) => [
              props.style as any,
              { opacity: pressed ? 0.75 : 1 },
            ]}
          />
        ),
        tabBarStyle: {
          height: tabHeight,
          paddingBottom: bottomInset,
          paddingTop: 8,
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E2E8F0',
          borderTopWidth: 1,
          boxShadow: '0 -2px 10px rgba(0,0,0,0.04)',
          elevation: 8,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '700',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Home size={size || 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="tracked"
        options={{
          title: 'Tracked',
          tabBarIcon: ({ color, size }) => <Radio size={size || 22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'Account',
          tabBarIcon: ({ color, size }) => <User size={size || 22} color={color} />,
        }}
      />
    </Tabs>
  );
}
