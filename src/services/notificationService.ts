import { Platform } from 'react-native';
import { LOCAL_ALARM_SOUNDS, LocalSoundItem } from '../constants/alarmSounds';
import { alarmSoundService } from './alarmSoundService';

export interface NotificationPayload {
  title: string;
  body: string;
  productId?: string;
  pincode?: string;
}

// Safely load Notifee
let notifeeModule: any = null;
try {
  notifeeModule = require('@notifee/react-native').default;
} catch (_e) {
  notifeeModule = null;
}

// Safely load Expo Notifications
let expoNotifications: any = null;
try {
  expoNotifications = require('expo-notifications');
  if (expoNotifications && expoNotifications.setNotificationHandler) {
    expoNotifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });
  }
} catch (_e) {
  expoNotifications = null;
}

const RESTOCK_CHANNEL_ID = 'amul_restock_alerts';

async function ensureNotificationChannel(): Promise<string> {
  if (!notifeeModule || Platform.OS !== 'android') return RESTOCK_CHANNEL_ID;

  try {
    const channelId = await notifeeModule.createChannel({
      id: RESTOCK_CHANNEL_ID,
      name: 'Amul Restock Alerts',
      importance: 4, // AndroidImportance.HIGH (Heads-up notification banner)
      visibility: 1, // AndroidVisibility.PUBLIC (Shows on Lock Screen)
      sound: 'default',
      vibration: true,
      vibrationPattern: [300, 500, 300, 500],
      badge: true,
    });
    return channelId;
  } catch (err) {
    console.log('⚠️ [ensureNotificationChannel error]:', err);
    return RESTOCK_CHANNEL_ID;
  }
}

export const NotificationService = {
  async initialize() {
    if (Platform.OS === 'web') return;

    if (notifeeModule) {
      try {
        await notifeeModule.requestPermission();
        await ensureNotificationChannel();
        console.log('✅ [NotificationService] Restock notification channel initialized');
      } catch (err) {
        console.log('⚠️ [NotificationService initialize error]:', err);
      }
    }

    if (expoNotifications && expoNotifications.requestPermissionsAsync) {
      try {
        await expoNotifications.requestPermissionsAsync();
      } catch (_e) {}
    }
  },

  async sendRestockNotification(payload: NotificationPayload, soundId: string = 'digital_clock_beep') {
    if (Platform.OS === 'web') return;

    const soundItem: LocalSoundItem =
      LOCAL_ALARM_SOUNDS.find((s) => s.id === soundId) || LOCAL_ALARM_SOUNDS[0];

    // Trigger custom audio playback via expo-audio
    try {
      alarmSoundService.previewSound(soundItem.id);
    } catch (_e) {}

    // 1. Primary delivery via Notifee
    if (notifeeModule && notifeeModule.displayNotification) {
      try {
        const channelId = await ensureNotificationChannel();
        await notifeeModule.displayNotification({
          title: payload.title,
          body: payload.body,
          data: {
            productId: payload.productId || '',
            pincode: payload.pincode || '',
          },
          android: {
            channelId: channelId,
            importance: 4,
            visibility: 1,
            pressAction: {
              id: 'default',
              launchActivity: 'default',
            },
            vibrationPattern: [300, 500, 300, 500],
          },
          ios: {
            sound: 'default',
          },
        });
        console.log('🔔 [NotificationService] Restock notification dispatched with sound:', soundItem.name);
        return;
      } catch (err) {
        console.log('❌ [NotificationService displayNotification error]:', err);
      }
    }

    // 2. Fallback via Expo Notifications
    if (expoNotifications && expoNotifications.scheduleNotificationAsync) {
      try {
        await expoNotifications.scheduleNotificationAsync({
          content: {
            title: payload.title,
            body: payload.body,
            data: {
              productId: payload.productId || '',
              pincode: payload.pincode || '',
            },
          },
          trigger: null, // Display immediately
        });
      } catch (_e) {}
    }
  },

  async scheduleDelayedNotification(
    payload: NotificationPayload,
    delaySeconds: number = 5,
    soundId: string = 'digital_clock_beep'
  ) {
    if (Platform.OS === 'web') return;

    const soundItem: LocalSoundItem =
      LOCAL_ALARM_SOUNDS.find((s) => s.id === soundId) || LOCAL_ALARM_SOUNDS[0];

    console.log(`⏱️ [NotificationService] Scheduling ${delaySeconds}s delayed notification for:`, payload.title);

    // 1. Primary: Trigger notification via Notifee timestamp trigger
    if (notifeeModule && notifeeModule.createTriggerNotification) {
      try {
        const channelId = await ensureNotificationChannel();
        const triggerTime = Date.now() + delaySeconds * 1000;

        await notifeeModule.createTriggerNotification(
          {
            title: payload.title,
            body: payload.body,
            data: {
              productId: payload.productId || '',
              pincode: payload.pincode || '',
            },
            android: {
              channelId: channelId,
              importance: 4,
              visibility: 1,
              pressAction: {
                id: 'default',
                launchActivity: 'default',
              },
              vibrationPattern: [300, 500, 300, 500],
            },
            ios: {
              sound: 'default',
            },
          },
          {
            type: 0, // TriggerType.TIMESTAMP
            timestamp: triggerTime,
          }
        );
        console.log('✅ [NotificationService] Notifee timestamp trigger scheduled successfully');
      } catch (err) {
        console.log('⚠️ [Notifee createTriggerNotification error]:', err);
      }
    }

    // 2. Fallback / Complementary: Expo Notifications TimeInterval Trigger
    if (expoNotifications && expoNotifications.scheduleNotificationAsync) {
      try {
        await expoNotifications.scheduleNotificationAsync({
          content: {
            title: payload.title,
            body: payload.body,
            data: {
              productId: payload.productId || '',
              pincode: payload.pincode || '',
            },
          },
          trigger: {
            type: 'timeInterval',
            seconds: delaySeconds,
            repeats: false,
          } as any,
        });
      } catch (_e) {}
    }

    // 3. Local JS setTimeout for sound playback if app remains in memory
    setTimeout(() => {
      try {
        alarmSoundService.previewSound(soundItem.id);
      } catch (_e) {}
    }, delaySeconds * 1000);
  },

  async cancelAllNotifications() {
    if (notifeeModule && notifeeModule.cancelAllNotifications) {
      try {
        await notifeeModule.cancelAllNotifications();
      } catch (_e) {}
    }
    if (expoNotifications && expoNotifications.cancelAllScheduledNotificationsAsync) {
      try {
        await expoNotifications.cancelAllScheduledNotificationsAsync();
      } catch (_e) {}
    }
  },
};
