import { Platform } from 'react-native';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AmulApiClient } from './amulApi';
import { NotificationService } from './notificationService';
import { AmulProduct, PincodeLocation } from '../types/amul';

export const BACKGROUND_STOCK_RADAR_TASK = 'AMUL_BACKGROUND_STOCK_RADAR_TASK';

// Define the background task outside of React components
try {
  TaskManager.defineTask(BACKGROUND_STOCK_RADAR_TASK, async () => {
    try {
      console.log('🔄 [BackgroundFetch] Executing background Amul stock radar check...');

      const [savedTracked, savedSelectedPin, savedSound] = await Promise.all([
        AsyncStorage.getItem('@amul_tracked_products'),
        AsyncStorage.getItem('@amul_selected_pincode'),
        AsyncStorage.getItem('@amul_selected_alarm_sound'),
      ]);

      if (!savedTracked) {
        return BackgroundFetch.BackgroundFetchResult.NoData;
      }

      let trackedMap: Record<string, AmulProduct> = {};
      try {
        trackedMap = JSON.parse(savedTracked) || {};
      } catch (_e) {
        return BackgroundFetch.BackgroundFetchResult.NoData;
      }

      const trackedList = Object.values(trackedMap);
      if (trackedList.length === 0) {
        return BackgroundFetch.BackgroundFetchResult.NoData;
      }

      let selectedPin: PincodeLocation = {
        pincode: '',
        label: 'Select Location',
        address: '',
        storeId: '66505ff5145c16635e6cc74d',
        isDefault: true,
        serviceable: true,
      };

      if (savedSelectedPin) {
        try {
          selectedPin = JSON.parse(savedSelectedPin);
        } catch (_e) {}
      }

      const storeId = selectedPin.storeId || '66505ff5145c16635e6cc74d';
      const soundId = savedSound || 'digital_clock_beep';

      // Collect categories of all tracked products
      const categories = new Set<string>();
      categories.add('protein');
      trackedList.forEach((p) => {
        if (p.category) {
          categories.add(p.category.toLowerCase().trim());
        }
      });

      let hasRestocks = false;
      let hasTrackedUpdates = false;

      for (const cat of categories) {
        try {
          const liveProducts = await AmulApiClient.fetchStoreProducts(cat, storeId);
          if (!liveProducts || liveProducts.length === 0) continue;

          for (const liveProd of liveProducts) {
            if (trackedMap[liveProd.id]) {
              const wasInStock = Boolean(trackedMap[liveProd.id]?.variants?.[0]?.isInStock);
              const isNowInStock = Boolean(liveProd.variants?.[0]?.isInStock);

              if (wasInStock === false && isNowInStock === true) {
                console.log(`🚨 [BackgroundFetch] Restock detected in background for ${liveProd.title}!`);
                hasRestocks = true;

                await NotificationService.sendRestockNotification(
                  {
                    title: `⚡ Restock Alert: ${liveProd.title}`,
                    body: selectedPin.pincode
                      ? `Stock is live for Hub ${selectedPin.pincode}! Tap to buy now.`
                      : 'Stock is now live! Tap to buy now.',
                    productId: liveProd.id,
                    pincode: selectedPin.pincode,
                  },
                  soundId
                );
              }

              trackedMap[liveProd.id] = {
                ...liveProd,
                autoCartEnabled: true,
              };
              hasTrackedUpdates = true;
            }
          }
        } catch (catErr) {
          console.log(`⚠️ [BackgroundFetch] Error checking category ${cat}:`, catErr);
        }
      }

      if (hasTrackedUpdates) {
        await AsyncStorage.setItem('@amul_tracked_products', JSON.stringify(trackedMap));
      }

      return hasRestocks
        ? BackgroundFetch.BackgroundFetchResult.NewData
        : BackgroundFetch.BackgroundFetchResult.NoData;
    } catch (err) {
      console.log('❌ [BackgroundFetch] Task failed:', err);
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
  });
} catch (taskErr) {
  console.log('⚠️ [BackgroundFetch] Task definition error:', taskErr);
}

export const backgroundFetchService = {
  async registerBackgroundFetch() {
    if (Platform.OS === 'web') return;

    try {
      const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_STOCK_RADAR_TASK);
      if (!isRegistered) {
        await BackgroundFetch.registerTaskAsync(BACKGROUND_STOCK_RADAR_TASK, {
          minimumInterval: 15 * 60, // 15 minutes (OS minimum)
          stopOnTerminate: false, // Keep running after app closes
          startOnBoot: true, // Resume task after device reboot
        });
        console.log('✅ [BackgroundFetch] Background stock radar registered successfully');
      }
    } catch (err) {
      console.log('⚠️ [BackgroundFetch] Registration error:', err);
    }
  },
};
