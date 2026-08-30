import { Platform } from 'react-native';

export interface NotificationPayload {
  title: string;
  body: string;
  productId?: string;
  pincode?: string;
}

let notifeeModule: any = null;
try {
  notifeeModule = require('@notifee/react-native').default;
} catch (e) {}

export const NotificationService = {
  async initialize() {
    if (!notifeeModule || Platform.OS === 'web') return;

    try {
      await notifeeModule.createChannel({
        id: 'amul_restock_notifications',
        name: 'Amul Restock Notifications',
        importance: 4, // AndroidImportance.HIGH
        sound: 'default',
        vibration: true,
      });

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
            channelId: 'amul_restock_notifications',
            importance: 4,
            sound: 'default',
            pressAction: {
              id: 'default',
            },
          },
          ios: {
            sound: 'default',
          },
        });
      } catch (err) {}
    }
  },
};
