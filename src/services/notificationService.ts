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

const LOUD_CHANNEL_ID = 'amul_loud_alarm_channel_v12';

async function ensureLoudChannel(): Promise<string> {
  if (!notifeeModule || Platform.OS !== 'android') return LOUD_CHANNEL_ID;

  try {
    const channelId = await notifeeModule.createChannel({
      id: LOUD_CHANNEL_ID,
      name: 'Amul Restock Loud Alarm',
      importance: 4, // AndroidImportance.HIGH (4 = makes sound & peeks)
      sound: 'default',
      vibration: true,
      vibrationPattern: [300, 600, 300, 600],
      bypassDnd: true,
      badge: true,
    });
    return channelId;
  } catch (err) {
    console.log('⚠️ [ensureLoudChannel error]:', err);
    return LOUD_CHANNEL_ID;
  }
}

export const NotificationService = {
  async initialize() {
    if (Platform.OS === 'web') return;

    if (notifeeModule) {
      try {
        await notifeeModule.requestPermission();
        await ensureLoudChannel();
        console.log('✅ [NotificationService] Loud alarm channel v12 initialized successfully');
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
        const channelId = await ensureLoudChannel();
        await notifeeModule.displayNotification({
          title: payload.title,
          body: payload.body,
          android: {
            channelId: channelId,
            importance: 4,
            sound: 'default',
            category: 'alarm',
            loopSound: true,
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
            sound: 'default',
            critical: true,
            criticalVolume: 1.0,
          },
        });
        console.log('🚨 [Notifee] Triggered continuous alarm for:', soundItem.name);
      } catch (err) {
        console.log('❌ [Notifee triggerEmergencyAlarm error]:', err);
      }
    }
  },

  async previewNotificationSound(soundId: string) {
    if (Platform.OS === 'web') return;

    const soundItem =
      LOCAL_ALARM_SOUNDS.find((s) => s.id === soundId) || LOCAL_ALARM_SOUNDS[0];

    if (notifeeModule && notifeeModule.displayNotification) {
      try {
        const channelId = await ensureLoudChannel();
        await notifeeModule.displayNotification({
          title: `🔔 Alarm Sound: ${soundItem.name}`,
          body: `Playing loud alarm sound test for ${soundItem.name}`,
          android: {
            channelId: channelId,
            importance: 4,
            sound: 'default',
            category: 'alarm',
            loopSound: false,
            pressAction: {
              id: 'default',
            },
            vibrationPattern: [200, 400],
          },
          ios: {
            sound: 'default',
            critical: true,
            criticalVolume: 1.0,
          },
        });
        console.log('✅ [Notifee] Preview sound triggered on channel:', channelId);
      } catch (err) {
        console.log('❌ [Notifee preview error]:', err);
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
