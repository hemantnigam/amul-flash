import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useStockStore } from '../store/useStockStore';
import { NotificationService } from './notificationService';
import { RestockEvent } from '../types/amul';

const FCM_TOKEN_STORAGE_KEY = '@amul_fcm_token';

let messagingModule: any = null;
try {
  if (Platform.OS !== 'web') {
    messagingModule = require('@react-native-firebase/messaging').default;
  }
} catch (_err) {
  messagingModule = null;
}

class FCMService {
  private currentToken: string | null = null;
  private isInitialized = false;

  /**
   * Helper to format a valid FCM topic string
   */
  getTopicName(pincode: string, productId: string): string {
    const cleanPin = (pincode || 'all').replace(/[^a-zA-Z0-9_-]/g, '_');
    const cleanProd = productId.replace(/[^a-zA-Z0-9_-]/g, '_');
    return `restock_${cleanPin}_${cleanProd}`.slice(0, 80);
  }

  async initialize(onTokenReceived?: (token: string) => void): Promise<string> {
    if (this.isInitialized) {
      const token = await this.getToken();
      if (onTokenReceived) onTokenReceived(token);
      return token;
    }

    let token = await this.getToken();

    if (messagingModule) {
      try {
        // 1. Request user permission for notifications
        await messagingModule().requestPermission();

        // 2. Register device for remote messages (iOS only)
        if (Platform.OS === 'ios' && !messagingModule().isDeviceRegisteredForRemoteMessages) {
          await messagingModule().registerDeviceForRemoteMessages();
        }

        // 3. Fetch real FCM device token
        const fcmToken = await messagingModule().getToken();
        if (fcmToken) {
          this.currentToken = fcmToken;
          await AsyncStorage.setItem(FCM_TOKEN_STORAGE_KEY, fcmToken);
          token = fcmToken;
          console.log('🔥 [FCMService] Real FCM Token registered:', fcmToken.slice(0, 15) + '...');
        }

        // 4. Listen for token refreshes
        messagingModule().onTokenRefresh(async (newToken: string) => {
          this.currentToken = newToken;
          await AsyncStorage.setItem(FCM_TOKEN_STORAGE_KEY, newToken);
          console.log('🔄 [FCMService] FCM Token refreshed:', newToken.slice(0, 15) + '...');
          if (onTokenReceived) {
            onTokenReceived(newToken);
          }
        });

        // 5. Handle Foreground Push Messages
        messagingModule().onMessage(async (remoteMessage: any) => {
          console.log('📩 [FCMService] Foreground message received:', remoteMessage);
          await this.handleIncomingRestockPayload(remoteMessage);
        });

        // 6. Handle Background Notification Tap (App in background)
        messagingModule().onNotificationOpenedApp(async (remoteMessage: any) => {
          console.log('📲 [FCMService] App opened from background notification:', remoteMessage);
          await this.handleIncomingRestockPayload(remoteMessage);
        });

        // 7. Handle Cold-Start Notification Click (App was completely closed)
        const initialMessage = await messagingModule().getInitialNotification();
        if (initialMessage) {
          console.log('🚀 [FCMService] Cold-start notification:', initialMessage);
          await this.handleIncomingRestockPayload(initialMessage);
        }
      } catch (error) {
        console.log('⚠️ [FCMService] Notification permission / setup info:', error);
      }
    }

    if (onTokenReceived && token) {
      onTokenReceived(token);
    }

    this.isInitialized = true;
    return token;
  }

  /**
   * Handle incoming FCM message payload and trigger in-app alarm and notifications
   */
  private async handleIncomingRestockPayload(remoteMessage: any) {
    if (!remoteMessage) return;

    const data = remoteMessage.data || {};
    const notification = remoteMessage.notification || {};

    const productId = data.productId || data.product_id;
    const pincode = data.pincode || useStockStore.getState().selectedPincode.pincode;
    const title = notification.title || data.title || '⚡ Amul Restock Alert!';
    const body = notification.body || data.body || 'Tracked item is back in stock!';
    const soundId = data.soundId || useStockStore.getState().selectedAlarmSoundId || 'digital_clock_beep';

    if (productId) {
      const restockEvent: RestockEvent = {
        id: `fcm_${Date.now()}_${productId}`,
        productId: productId,
        productName: title.replace(/^⚡ Restock Alert:\s*/, ''),
        pincode: pincode,
        timestamp: Date.now(),
        unitsAdded: Number(data.unitsAdded || data.stockCount || 30),
        survivalDurationSecs: 300,
        variantName: data.variantName || 'Standard Pack',
      };

      // 1. Fire full-screen in-app alarm siren & overlay
      useStockStore.getState().triggerAlarmEvent(restockEvent);

      // 2. Dispatch local high-priority heads-up notification with looping sound
      await NotificationService.sendRestockNotification(
        {
          title,
          body,
          productId,
          pincode,
        },
        soundId
      );

      // 3. Log to activity logs
      useStockStore.getState().addActivityLog({
        type: 'restock',
        title: `Cloud Restock Alert: ${restockEvent.productName}`,
        description: pincode ? `Cloud drop alert delivered for Hub ${pincode}` : 'Cloud drop alert delivered',
        pincode: pincode,
        status: 'success',
      });
    }
  }

  /**
   * Subscribe device to a product / pincode topic
   */
  async subscribeToTopic(topic: string): Promise<boolean> {
    if (!messagingModule) return false;
    try {
      await messagingModule().subscribeToTopic(topic);
      console.log(`📡 [FCMService] Subscribed to topic: ${topic}`);
      return true;
    } catch (err) {
      console.log(`⚠️ [FCMService] Error subscribing to topic ${topic}:`, err);
      return false;
    }
  }

  /**
   * Unsubscribe device from a topic
   */
  async unsubscribeFromTopic(topic: string): Promise<boolean> {
    if (!messagingModule) return false;
    try {
      await messagingModule().unsubscribeFromTopic(topic);
      console.log(`📡 [FCMService] Unsubscribed from topic: ${topic}`);
      return true;
    } catch (err) {
      console.log(`⚠️ [FCMService] Error unsubscribing from topic ${topic}:`, err);
      return false;
    }
  }

  async getToken(): Promise<string> {
    if (this.currentToken) return this.currentToken;
    const saved = await AsyncStorage.getItem(FCM_TOKEN_STORAGE_KEY);
    if (saved) {
      this.currentToken = saved;
      return saved;
    }

    if (messagingModule) {
      try {
        const token = await messagingModule().getToken();
        if (token) {
          this.currentToken = token;
          await AsyncStorage.setItem(FCM_TOKEN_STORAGE_KEY, token);
          return token;
        }
      } catch (_e) {}
    }

    // Fallback: persistent device installation identifier
    let fallbackId = await AsyncStorage.getItem('@amul_device_uuid');
    if (!fallbackId) {
      fallbackId = `dev_${Platform.OS}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      await AsyncStorage.setItem('@amul_device_uuid', fallbackId);
    }
    this.currentToken = fallbackId;
    return fallbackId;
  }
}

export const fcmService = new FCMService();

// Register background message handler outside of component lifecycle
if (messagingModule && typeof messagingModule().setBackgroundMessageHandler === 'function') {
  messagingModule().setBackgroundMessageHandler(async (remoteMessage: any) => {
    console.log('🌙 [FCMService] Background message received:', remoteMessage);
    const data = remoteMessage.data || {};
    const notification = remoteMessage.notification || {};
    const productId = data.productId || data.product_id;
    const pincode = data.pincode;
    const title = notification.title || data.title || '⚡ Amul Restock Alert!';
    const body = notification.body || data.body || 'Tracked item is back in stock!';
    const soundId = data.soundId || 'digital_clock_beep';

    if (productId) {
      await NotificationService.sendRestockNotification(
        {
          title,
          body,
          productId,
          pincode,
        },
        soundId
      );
    }
  });
}
