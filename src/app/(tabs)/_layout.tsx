import React from 'react';
import { Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Home, LayoutGrid, User } from 'lucide-react-native';
import { useSessionStore } from '../../store/useSessionStore';

export default function TabLayout() {
  const { session, isInitialized } = useSessionStore();

  // If user is not logged in or auth is still checking, do not render dashboard tabs
  if (!isInitialized || !session.isLoggedIn) {
    return null;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#64748B',
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 86 : 68,
          paddingBottom: Platform.OS === 'ios' ? 26 : 10,
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
        name="products"
        options={{
          title: 'Catalog',
          tabBarIcon: ({ color, size }) => <LayoutGrid size={size || 22} color={color} />,
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
