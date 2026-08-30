import { Platform, Alert } from 'react-native';
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

const VISUAL_ALERT_CHANNEL_ID = 'amul_restock_emergency_alarm_v17';

async function ensureAlertChannel(): Promise<string> {
  if (!notifeeModule || Platform.OS !== 'android') return VISUAL_ALERT_CHANNEL_ID;

  try {
    const channelId = await notifeeModule.createChannel({
      id: VISUAL_ALERT_CHANNEL_ID,
      name: 'Amul Emergency Restock Alarm',
      importance: 4, // AndroidImportance.HIGH (Required by Android to wake display)
      visibility: 1, // AndroidVisibility.PUBLIC (Shows on all lock screens)
      sound: 'default',
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

  async checkAndRequestAlarmPermission(): Promise<boolean> {
    if (Platform.OS !== 'android' || !notifeeModule) return true;
    try {
      const settings = await notifeeModule.getNotificationSettings();
      console.log('📱 [NotificationService] Android Alarm Permission:', settings.android?.alarm);
      if (settings.android?.alarm === 0) {
        Alert.alert(
          '⏰ Exact Alarm Permission Needed',
          'To wake your phone screen at the exact second a restock occurs while your phone is locked, Android requires "Alarms & Reminders" permission.\n\nPlease toggle it ON in the next screen.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Open Settings',
              onPress: async () => {
                await notifeeModule.openAlarmSettings();
              },
            },
          ]
        );
        return false;
      }
      return true;
    } catch (e) {
      console.log('⚠️ [checkAndRequestAlarmPermission error]:', e);
      return true;
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
          data: {
            productId: payload.productId || '',
            pincode: payload.pincode || '',
            soundId: soundId,
            isAlarmTrigger: 'true',
          },
          android: {
            channelId: channelId,
            importance: 4,
            category: 'alarm',
            visibility: 1, // AndroidVisibility.PUBLIC (Display on lock screen)
            wakeUpScreen: true,
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

  async scheduleDelayedLockScreenAlarm(
    payload: NotificationPayload,
    delaySeconds: number = 8,
    soundId: string = 'digital_clock_beep'
  ) {
    if (Platform.OS === 'web') return;

    if (notifeeModule && notifeeModule.createTriggerNotification) {
      try {
        const channelId = await ensureAlertChannel();
        const triggerTimestamp = Date.now() + delaySeconds * 1000;

        await notifeeModule.createTriggerNotification(
          {
            title: payload.title,
            body: payload.body,
            data: {
              productId: payload.productId || '',
              pincode: payload.pincode || '',
              soundId: soundId,
              isAlarmTrigger: 'true',
            },
            android: {
              channelId: channelId,
              importance: 4, // AndroidImportance.HIGH
              category: 'alarm',
              visibility: 1, // AndroidVisibility.PUBLIC (Shows on Lock Screen)
              wakeUpScreen: true, // Turns display ON
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
          },
          {
            type: 0, // TriggerType.TIMESTAMP
            timestamp: triggerTimestamp,
            alarmManager: {
              allowWhileIdle: true, // Wakes phone from deep sleep/Doze mode!
            },
          }
        );
        console.log(`⏰ [Notifee] Scheduled Native Alarm via Android AlarmManager for ${delaySeconds}s from now (allowWhileIdle: true)`);
      } catch (err) {
        console.log('❌ [Notifee scheduleDelayedLockScreenAlarm error]:', err);
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
