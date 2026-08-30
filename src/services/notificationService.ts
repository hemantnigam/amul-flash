import { Platform } from 'react-native';
import { LOCAL_ALARM_SOUNDS, LocalSoundItem } from '../constants/alarmSounds';

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

const VISUAL_ALERT_CHANNEL_ID = 'amul_restock_visual_alert_v13';

async function ensureAlertChannel(): Promise<string> {
  if (!notifeeModule || Platform.OS !== 'android') return VISUAL_ALERT_CHANNEL_ID;

  try {
    const channelId = await notifeeModule.createChannel({
      id: VISUAL_ALERT_CHANNEL_ID,
      name: 'Amul Restock Flash Alert',
      importance: 4, // AndroidImportance.HIGH (shows heads-up banner & wakes screen)
      sound: undefined, // Let expo-audio handle the custom WAV sound without duplicate system beeps
      vibration: true,
      vibrationPattern: [300, 600, 300, 600],
      bypassDnd: true,
      badge: true,
    });
    return channelId;
  } catch (err) {
    console.log('⚠️ [ensureAlertChannel error]:', err);
    return VISUAL_ALERT_CHANNEL_ID;
  }
}

export const NotificationService = {
  async initialize() {
    if (Platform.OS === 'web') return;

    if (notifeeModule) {
      try {
        await notifeeModule.requestPermission();
        await ensureAlertChannel();
        console.log('✅ [NotificationService] Restock alert channel initialized');
      } catch (err) {
        console.log('⚠️ [Notifee initialize error]:', err);
      }
    }
  },

  async triggerEmergencyAlarm(payload: NotificationPayload, soundId: string = 'digital_clock_beep') {
    if (Platform.OS === 'web') return;

    const soundItem: LocalSoundItem =
      LOCAL_ALARM_SOUNDS.find((s) => s.id === soundId) || LOCAL_ALARM_SOUNDS[0];

    if (notifeeModule && notifeeModule.displayNotification) {
      try {
        const channelId = await ensureAlertChannel();
        await notifeeModule.displayNotification({
          title: payload.title,
          body: payload.body,
          android: {
            channelId: channelId,
            importance: 4,
            category: 'alarm',
            pressAction: {
              id: 'default',
              launchActivity: 'default',
            },
            fullScreenAction: {
              id: 'default',
              launchActivity: 'default',
            },
            vibrationPattern: [300, 600, 300, 600],
          },
          ios: {
            critical: true,
            criticalVolume: 1.0,
          },
        });
        console.log('🚨 [Notifee] Visual drop banner displayed for:', soundItem.name);
      } catch (err) {
        console.log('❌ [Notifee triggerEmergencyAlarm error]:', err);
      }
    }
  },

  async cancelAllNotifications() {
    if (notifeeModule && notifeeModule.cancelAllNotifications) {
      try {
        await notifeeModule.cancelAllNotifications();
      } catch (_e) {}
    }
  },
};
