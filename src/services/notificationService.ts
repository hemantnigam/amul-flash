import { Platform } from 'react-native';

export interface NotificationPayload {
  title: string;
  body: string;
  productId?: string;
  pincode?: string;
  isEmergencyAlarm?: boolean;
}

let notifeeModule: any = null;
try {
  // Dynamically require to ensure graceful web/simulator fallback
  notifeeModule = require('@notifee/react-native').default;
} catch (e) {
  // Graceful fallback for non-native environments
}

export const NotificationService = {
  async initialize() {
    if (!notifeeModule || Platform.OS === 'web') return;

    try {
      // Create high-priority emergency alarm channel for restock drops
      await notifeeModule.createChannel({
        id: 'amul_restock_alarm',
        name: 'Amul Restock Drop Alarms',
        importance: 4, // AndroidImportance.HIGH
        sound: 'alarm',
        vibration: true,
        bypassDnd: true,
      });

      // Request notification permissions
      await notifeeModule.requestPermission();
    } catch (err) {
      console.warn('Failed to initialize Notifee channels:', err);
    }
  },

  async triggerEmergencyAlarm(payload: NotificationPayload) {
    console.log('[NotificationService] Triggering Emergency Alert:', payload);

    if (notifeeModule && Platform.OS !== 'web') {
      try {
        await notifeeModule.displayNotification({
          title: payload.title,
          body: payload.body,
          android: {
            channelId: 'amul_restock_alarm',
            importance: 4,
            sound: 'alarm',
            pressAction: {
              id: 'default',
            },
            actions: [
              {
                title: '⚡ 1-Tap Pay',
                pressAction: {
                  id: 'flash_pay',
                },
              },
              {
                title: '🛒 View Cart',
                pressAction: {
                  id: 'view_cart',
                },
              },
            ],
          },
        });
      } catch (err) {
        console.warn('Notifee display error:', err);
      }
    }
  },
};
