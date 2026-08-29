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
    } catch (err) {}
  },

  async triggerEmergencyAlarm(payload: NotificationPayload) {
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
                title: '⚡ View Details',
                pressAction: {
                  id: 'view_details',
                },
              },
            ],
          },
        });
      } catch (err) {}
    }
  },
};
