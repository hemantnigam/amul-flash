import { AppState } from 'react-native';
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AmulProduct, PincodeLocation, ActivityLog, RestockEvent, AmulCategory } from '../types/amul';
import { AmulApiClient } from '../services/amulApi';
import { stockRadarService } from '../services/radarService';
import { NotificationService } from '../services/notificationService';
import { alarmSoundService } from '../services/alarmSoundService';
import { fcmService } from '../services/fcmService';
import { supabaseService } from '../services/supabaseClient';

const STORAGE_KEYS = {
  TRACKED_PRODUCTS: '@amul_tracked_products',
  ALARM_SOUND: '@amul_selected_alarm_sound',
  ALARM_OVERLAY: '@amul_alarm_overlay_enabled',
  PINCODES: '@amul_user_pincodes',
  SELECTED_PINCODE: '@amul_selected_pincode',
};

interface StockStoreState {
  products: AmulProduct[];
  categories: AmulCategory[];
  selectedCategory: string;
  pincodes: PincodeLocation[];
  selectedPincode: PincodeLocation;
  activityLogs: ActivityLog[];
  activeDropAlert: RestockEvent | null;
  isSimulatingDrop: boolean;
  isLoadingProducts: boolean;
  lastUpdated: number;
  trackedProductsMap: Record<string, AmulProduct>;
  allProductsMap: Record<string, AmulProduct>;
  selectedAlarmSoundId: string;
  activeAlarmEvent: RestockEvent | null;
  alarmOverlayEnabled: boolean;
  isPreferencesLoaded: boolean;

  loadSavedPreferences: () => Promise<void>;
  loadInitialData: (sessionCookie?: string) => Promise<void>;
  setSelectedCategory: (categorySlug: string, sessionCookie?: string) => Promise<void>;
  setSelectedPincode: (pincode: PincodeLocation, sessionCookie?: string) => Promise<void>;
  addPincode: (pincode: PincodeLocation) => void;
  removePincode: (pincodeStr: string) => void;
  syncPincodesFromAddresses: (addresses: any[]) => void;
  toggleAutoCartForProduct: (productId: string, productObj?: AmulProduct) => void;
  triggerSimulatedDrop: (productId?: string) => Promise<void>;
  triggerDelayedDropTest: (delaySeconds?: number) => Promise<void>;
  dismissDropAlert: () => void;
  triggerAlarmEvent: (event: RestockEvent) => void;
  dismissAlarmEvent: () => void;
  setAlarmOverlayEnabled: (enabled: boolean) => void;
  setSelectedAlarmSoundId: (soundId: string) => void;
  addActivityLog: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
  syncCloudTrackedProductsForUser: (phoneNumber: string) => Promise<void>;
  pruneTrackedProducts: (allowedIds: string[]) => void;
  prunePincodesForFreeUser: () => void;
  refreshStock: (sessionCookie?: string) => Promise<void>;
  fetchAllCategoriesProducts: (sessionCookie?: string) => Promise<void>;
}

const DEFAULT_USER_PINCODE: PincodeLocation = {
  pincode: '',
  label: 'Select Location',
  address: 'No location selected',
  storeId: '66505ff5145c16635e6cc74d',
  isDefault: true,
  serviceable: true,
};

export const useStockStore = create<StockStoreState>((set, get) => ({
  products: [],
  categories: [],
  selectedCategory: 'protein',
  pincodes: [],
  selectedPincode: DEFAULT_USER_PINCODE,
  activityLogs: [],
  activeDropAlert: null,
  activeAlarmEvent: null,
  alarmOverlayEnabled: true,
  isSimulatingDrop: false,
  isLoadingProducts: false,
  lastUpdated: Date.now(),
  trackedProductsMap: {},
  allProductsMap: {},
  selectedAlarmSoundId: 'digital_clock_beep',
  isPreferencesLoaded: false,

  loadSavedPreferences: async () => {
    try {
      const [savedTracked, savedSound, savedOverlay, savedPincodes, savedSelectedPin] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.TRACKED_PRODUCTS),
        AsyncStorage.getItem(STORAGE_KEYS.ALARM_SOUND),
        AsyncStorage.getItem(STORAGE_KEYS.ALARM_OVERLAY),
        AsyncStorage.getItem(STORAGE_KEYS.PINCODES),
        AsyncStorage.getItem(STORAGE_KEYS.SELECTED_PINCODE),
      ]);

      let trackedMap: Record<string, AmulProduct> = get().trackedProductsMap;
      if (savedTracked) {
        try {
          const parsed = JSON.parse(savedTracked);
          if (parsed && typeof parsed === 'object') {
            trackedMap = parsed;
          }
        } catch (_e) {}
      }

      let soundId = get().selectedAlarmSoundId;
      if (savedSound) {
        soundId = savedSound;
      }

      let overlay = get().alarmOverlayEnabled;
      if (savedOverlay !== null && savedOverlay !== undefined) {
        overlay = savedOverlay === 'true';
      }

      let pincodes = get().pincodes;
      if (savedPincodes) {
        try {
          const parsedPins = JSON.parse(savedPincodes);
          if (Array.isArray(parsedPins) && parsedPins.length > 0) {
            pincodes = parsedPins;
          }
        } catch (_e) {}
      }

      let selectedPincode = get().selectedPincode;
      if (savedSelectedPin) {
        try {
          const parsedSelected = JSON.parse(savedSelectedPin);
          if (parsedSelected?.pincode) {
            selectedPincode = parsedSelected;
          }
        } catch (_e) {}
      }

      let isVip = false;
      try {
        const { useSubscriptionStore } = require('./useSubscriptionStore');
        isVip = useSubscriptionStore.getState().isVipActive;
      } catch (_e) {}

      if (!isVip && pincodes.length > 1) {
        const primaryPin = pincodes.find((p) => p.isSavedAddress) || pincodes.find((p) => p.isDefault) || pincodes[0];
        pincodes = [primaryPin];
        selectedPincode = primaryPin;
      }

      // Seed radar stock tracker with loaded preferences
      stockRadarService.seedPreviousStock(trackedMap);

      set({
        trackedProductsMap: trackedMap,
        selectedAlarmSoundId: soundId,
        alarmOverlayEnabled: overlay,
        pincodes,
        selectedPincode,
        isPreferencesLoaded: true,
      });

      // Automatically sync device token, sound, and tracked items to Supabase cloud on launch
      fcmService.getToken().then((token) => {
        if (token) {
          let userPhone: string | undefined;
          try {
            const { useSessionStore } = require('./useSessionStore');
            userPhone = useSessionStore.getState().session?.mobile || undefined;
          } catch (_e) {}

          supabaseService.registerDevice(token, userPhone, soundId);
          const trackedItems = Object.values(trackedMap);
          if (trackedItems.length > 0) {
            supabaseService.syncAllTrackedProducts(
              token,
              userPhone,
              trackedItems,
              selectedPincode.pincode,
              selectedPincode.storeId || '66505ff5145c16635e6cc74d'
            );
          }
        }
      });
    } catch (e) {
      console.log('⚠️ [useStockStore] Error loading saved preferences:', e);
      set({ isPreferencesLoaded: true });
    }
  },

  loadInitialData: async (sessionCookie?: string) => {
    set({ isLoadingProducts: true });
    try {
      // Ensure saved preferences & tracked products are loaded from AsyncStorage first
      if (!get().isPreferencesLoaded) {
        await get().loadSavedPreferences();
      }

      // 1. Fetch live categories
      const liveCategories = await AmulApiClient.fetchCategories(sessionCookie);
      set({ categories: liveCategories });

      // 2. Fetch live products for selected category from Amul API
      const substoreId = get().selectedPincode.storeId || '66505ff5145c16635e6cc74d';
      const liveProducts = await AmulApiClient.fetchStoreProducts(get().selectedCategory, substoreId, sessionCookie);

      const trackedMap = { ...get().trackedProductsMap };
      let hasTrackedUpdates = false;

      const hydratedProducts = liveProducts.map((p) => {
        const isTracked = trackedMap[p.id] !== undefined;
        if (isTracked) {
          const isNowInStock = Boolean(p.variants?.[0]?.isInStock);
          stockRadarService.setProductStockState(p.id, isNowInStock);
          trackedMap[p.id] = { ...p, autoCartEnabled: true };
          hasTrackedUpdates = true;
        }
        return {
          ...p,
          autoCartEnabled: isTracked,
        };
      });

      if (hasTrackedUpdates) {
        AsyncStorage.setItem(STORAGE_KEYS.TRACKED_PRODUCTS, JSON.stringify(trackedMap)).catch(() => {});
      }

      const newAllMap = { ...get().allProductsMap };
      hydratedProducts.forEach((p) => {
        newAllMap[p.id] = p;
      });

      set({
        products: hydratedProducts,
        allProductsMap: newAllMap,
        trackedProductsMap: trackedMap,
        isLoadingProducts: false,
        lastUpdated: Date.now(),
      });

      // 3. Background pre-fetch remaining categories and check tracked items
      get().fetchAllCategoriesProducts(sessionCookie);

      // 4. Start Live Stock Radar Polling
      stockRadarService.startMonitoring();
    } catch (_e) {
      set({ isLoadingProducts: false });
    }
  },

  setSelectedCategory: async (categorySlug: string, sessionCookie?: string) => {
    set({ selectedCategory: categorySlug, isLoadingProducts: true });
    try {
      const substoreId = get().selectedPincode.storeId || '66505ff5145c16635e6cc74d';
      const liveProducts = await AmulApiClient.fetchStoreProducts(categorySlug, substoreId, sessionCookie);

      const trackedMap = { ...get().trackedProductsMap };
      let hasTrackedUpdates = false;

      const hydratedProducts = liveProducts.map((p) => {
        const isTracked = trackedMap[p.id] !== undefined;
        if (isTracked) {
          const isNowInStock = Boolean(p.variants?.[0]?.isInStock);
          stockRadarService.setProductStockState(p.id, isNowInStock);
          trackedMap[p.id] = { ...p, autoCartEnabled: true };
          hasTrackedUpdates = true;
        }
        return {
          ...p,
          autoCartEnabled: isTracked,
        };
      });

      if (hasTrackedUpdates) {
        AsyncStorage.setItem(STORAGE_KEYS.TRACKED_PRODUCTS, JSON.stringify(trackedMap)).catch(() => {});
      }

      const newAllMap = { ...get().allProductsMap };
      hydratedProducts.forEach((p) => {
        newAllMap[p.id] = p;
      });

      set({
        products: hydratedProducts,
        allProductsMap: newAllMap,
        trackedProductsMap: trackedMap,
        isLoadingProducts: false,
        lastUpdated: Date.now(),
      });
    } catch (_e) {
      set({ isLoadingProducts: false });
    }
  },

  fetchAllCategoriesProducts: async (sessionCookie?: string) => {
    try {
      const categories = get().categories;
      const substoreId = get().selectedPincode.storeId || '66505ff5145c16635e6cc74d';
      const currentSlug = get().selectedCategory;

      for (const cat of categories) {
        if (cat.slug === currentSlug) continue;
        try {
          const prods = await AmulApiClient.fetchStoreProducts(cat.slug, substoreId, sessionCookie);
          if (prods && prods.length > 0) {
            set((state) => {
              const updated = { ...state.allProductsMap };
              const updatedTracked = { ...state.trackedProductsMap };
              let trackedChanged = false;

              prods.forEach((p) => {
                const isTracked = state.trackedProductsMap[p.id] !== undefined;
                if (isTracked) {
                  const isNowInStock = Boolean(p.variants?.[0]?.isInStock);
                  stockRadarService.setProductStockState(p.id, isNowInStock);
                  updatedTracked[p.id] = { ...p, autoCartEnabled: true };
                  trackedChanged = true;
                }
                updated[p.id] = {
                  ...p,
                  autoCartEnabled: isTracked,
                };
              });

              if (trackedChanged) {
                AsyncStorage.setItem(STORAGE_KEYS.TRACKED_PRODUCTS, JSON.stringify(updatedTracked)).catch(() => {});
              }

              return {
                allProductsMap: updated,
                ...(trackedChanged ? { trackedProductsMap: updatedTracked } : {}),
              };
            });
          }
        } catch (_err) {}
      }
    } catch (_e) {}
  },

  setSelectedPincode: async (pincode: PincodeLocation, sessionCookie?: string) => {
    set({ selectedPincode: pincode, isLoadingProducts: true });
    AsyncStorage.setItem(STORAGE_KEYS.SELECTED_PINCODE, JSON.stringify(pincode)).catch(() => {});
    try {
      const substoreId = pincode.storeId || '66505ff5145c16635e6cc74d';
      const liveProducts = await AmulApiClient.fetchStoreProducts(get().selectedCategory, substoreId, sessionCookie);

      const trackedMap = { ...get().trackedProductsMap };
      let hasTrackedUpdates = false;

      const hydratedProducts = liveProducts.map((p) => {
        const isTracked = trackedMap[p.id] !== undefined;
        if (isTracked) {
          const isNowInStock = Boolean(p.variants?.[0]?.isInStock);
          stockRadarService.setProductStockState(p.id, isNowInStock);
          trackedMap[p.id] = { ...p, autoCartEnabled: true };
          hasTrackedUpdates = true;
        }
        return {
          ...p,
          autoCartEnabled: isTracked,
        };
      });

      if (hasTrackedUpdates) {
        AsyncStorage.setItem(STORAGE_KEYS.TRACKED_PRODUCTS, JSON.stringify(trackedMap)).catch(() => {});
      }

      const newAllMap = { ...get().allProductsMap };
      hydratedProducts.forEach((p) => {
        newAllMap[p.id] = p;
      });

      set({
        products: hydratedProducts,
        allProductsMap: newAllMap,
        trackedProductsMap: trackedMap,
        isLoadingProducts: false,
        lastUpdated: Date.now(),
      });

      // Background re-fetch all categories with new store
      get().fetchAllCategoriesProducts(sessionCookie);

      // Trigger instant radar check across all tracked categories for new pincode
      stockRadarService.performLiveStockCheck();
    } catch (_e) {
      set({ isLoadingProducts: false });
    }
  },

  addPincode: (pincode: PincodeLocation) => {
    set((state) => {
      const exists = state.pincodes.some((p) => p.pincode === pincode.pincode);
      if (exists) return state;

      try {
        const { useSubscriptionStore } = require('./useSubscriptionStore');
        const canAdd = useSubscriptionStore.getState().checkGating('add_pincode', state.pincodes.length);
        if (!canAdd) {
          return state;
        }
      } catch (_e) {}

      const updated = [...state.pincodes, pincode];
      AsyncStorage.setItem(STORAGE_KEYS.PINCODES, JSON.stringify(updated)).catch(() => {});
      return {
        pincodes: updated,
      };
    });
  },

  removePincode: (pincodeStr: string) => {
    set((state) => {
      const updated = state.pincodes.filter((p) => p.pincode !== pincodeStr);
      const isSelected = state.selectedPincode.pincode === pincodeStr;
      const nextSelected = isSelected
        ? updated[0] || DEFAULT_USER_PINCODE
        : state.selectedPincode;
      AsyncStorage.setItem(STORAGE_KEYS.PINCODES, JSON.stringify(updated)).catch(() => {});
      if (isSelected) {
        AsyncStorage.setItem(STORAGE_KEYS.SELECTED_PINCODE, JSON.stringify(nextSelected)).catch(() => {});
      }
      return {
        pincodes: updated,
        selectedPincode: nextSelected,
      };
    });
  },

  syncPincodesFromAddresses: (addresses: any[]) => {
    if (!addresses || addresses.length === 0) return;

    let isVip = false;
    try {
      const { useSubscriptionStore } = require('./useSubscriptionStore');
      isVip = useSubscriptionStore.getState().isVipActive;
    } catch (_e) {}

    const currentPincodes = get().pincodes;
    const userPincodes: PincodeLocation[] = [];

    addresses.forEach((addr: any, idx: number) => {
      const rawPin = addr.pincode || addr.zip || addr.postal_code || addr.postcode || addr.postalCode;
      if (rawPin) {
        const pinStr = String(rawPin).trim();
        if (pinStr.length === 6 && !userPincodes.some((p) => p.pincode === pinStr)) {
          const rawType = (addr.addressType || (idx === 0 ? 'Home' : `Address ${idx + 1}`)).trim();
          const typeName = rawType.charAt(0).toUpperCase() + rawType.slice(1);
          const label = `${typeName} (${pinStr})`;

          const fullAddress = [
            addr.address || addr.addressLine1,
            addr.addressLine2,
            addr.city,
            addr.state,
            pinStr,
          ].filter(Boolean).join(', ');

          userPincodes.push({
            pincode: pinStr,
            label,
            address: fullAddress || `Delivery Hub for ${pinStr}`,
            storeId: addr.storeId || '66505ff5145c16635e6cc74d',
            isDefault: Boolean(addr.isDefault) || idx === 0,
            isSavedAddress: true,
            serviceable: true,
            distanceKm: 0,
          });
        }
      }
    });

    if (userPincodes.length > 0) {
      let finalPincodes: PincodeLocation[] = [];

      if (!isVip) {
        // Free user can only track 1 pincode: strictly keep primary saved address
        const primarySaved = userPincodes.find((p) => p.isDefault) || userPincodes[0];
        finalPincodes = [primarySaved];
      } else {
        const customPincodes = currentPincodes.filter(
          (p) => !p.isSavedAddress && !userPincodes.some((u) => u.pincode === p.pincode)
        );
        finalPincodes = [...userPincodes, ...customPincodes];
      }

      let currentSelected = get().selectedPincode;
      const isSelectedValid = currentSelected?.pincode && finalPincodes.some((p) => p.pincode === currentSelected.pincode);

      const targetSelected = isSelectedValid
        ? finalPincodes.find((p) => p.pincode === currentSelected.pincode)!
        : (finalPincodes.find((p) => p.isDefault) || finalPincodes[0]);

      AsyncStorage.setItem(STORAGE_KEYS.PINCODES, JSON.stringify(finalPincodes)).catch(() => {});
      AsyncStorage.setItem(STORAGE_KEYS.SELECTED_PINCODE, JSON.stringify(targetSelected)).catch(() => {});

      set({
        pincodes: finalPincodes,
        selectedPincode: targetSelected,
      });
    }
  },

  toggleAutoCartForProduct: (productId, productObj) => {
    set((state) => {
      const isCurrentlyTracked = !!state.trackedProductsMap[productId];
      const newTrackedMap = { ...state.trackedProductsMap };

      if (isCurrentlyTracked) {
        delete newTrackedMap[productId];
      } else {
        // Enforce VIP gating if attempting to track more than 1 product on Free plan
        try {
          const { useSubscriptionStore } = require('./useSubscriptionStore');
          const canTrack = useSubscriptionStore.getState().checkGating(
            'track_product',
            Object.keys(state.trackedProductsMap).length
          );
          if (!canTrack) {
            return state;
          }
        } catch (_e) {}

        const targetProduct =
          productObj || state.products.find((p) => p.id === productId) || state.allProductsMap[productId];
        if (targetProduct) {
          const inStock = Boolean(targetProduct.variants?.[0]?.isInStock);
          newTrackedMap[productId] = { ...targetProduct, autoCartEnabled: true };
          stockRadarService.setProductStockState(productId, inStock);
        }
      }

      AsyncStorage.setItem(STORAGE_KEYS.TRACKED_PRODUCTS, JSON.stringify(newTrackedMap)).catch((e) => {
        console.log('⚠️ Failed to persist tracked products map:', e);
      });

      const updatedProducts = state.products.map((p) =>
        p.id === productId ? { ...p, autoCartEnabled: !isCurrentlyTracked } : p
      );

      const updatedAllMap = { ...state.allProductsMap };
      if (updatedAllMap[productId]) {
        updatedAllMap[productId] = {
          ...updatedAllMap[productId],
          autoCartEnabled: !isCurrentlyTracked,
        };
      }

      // Sync tracked subscription to Supabase and FCM topic tied to mobile number
      const willBeTracked = !isCurrentlyTracked;
      const activePin = state.selectedPincode.pincode || 'all';
      const activeStoreId = state.selectedPincode.storeId || '66505ff5145c16635e6cc74d';
      const targetProd = productObj || state.products.find((p) => p.id === productId) || state.allProductsMap[productId];

      let userPhone: string | undefined;
      try {
        const { useSessionStore } = require('./useSessionStore');
        userPhone = useSessionStore.getState().session?.mobile || undefined;
      } catch (_e) {}

      fcmService.getToken().then((token) => {
        if (token && targetProd) {
          supabaseService.syncSubscription({
            fcmToken: token,
            phoneNumber: userPhone,
            productId: targetProd.id,
            productTitle: targetProd.title,
            pincode: activePin,
            storeId: activeStoreId,
            isTracked: willBeTracked,
          });

          const topic = fcmService.getTopicName(activePin, targetProd.id);
          if (willBeTracked) {
            fcmService.subscribeToTopic(topic);
          } else {
            fcmService.unsubscribeFromTopic(topic);
          }
        }
      });

      return {
        trackedProductsMap: newTrackedMap,
        products: updatedProducts,
        allProductsMap: updatedAllMap,
      };
    });
  },

  triggerSimulatedDrop: async (productId) => {
    const state = get();
    const targetProduct = productId
      ? state.products.find((p) => p.id === productId) || state.products[0]
      : state.products.find((p) => !p.variants?.[0]?.isInStock) || state.products[0];

    if (!targetProduct) return;

    set({ isSimulatingDrop: true });

    const activePincode = state.selectedPincode.pincode || state.pincodes[0]?.pincode || '';

    try {
      const dropEvent: RestockEvent = {
        id: `drop_${Date.now()}`,
        productId: targetProduct.id,
        productName: targetProduct.title,
        pincode: activePincode,
        timestamp: Date.now(),
        unitsAdded: 30,
        survivalDurationSecs: 180,
        variantName: targetProduct.variants?.[0]?.name || 'Standard Pack',
      };

      // Trigger in-app full screen alarm overlay + continuous audio
      get().triggerAlarmEvent(dropEvent);

      // Send standard push notification with selected sound
      await NotificationService.sendRestockNotification(
        {
          title: `⚡ Restock Alert: ${targetProduct.title}`,
          body: activePincode ? `Stock is now live for Hub ${activePincode}! Tap to view.` : 'Stock is now live! Tap to view.',
          productId: targetProduct.id,
          pincode: activePincode,
        },
        state.selectedAlarmSoundId || 'digital_clock_beep'
      );

      // Stock Tracker Log
      get().addActivityLog({
        type: 'restock',
        title: `Test Restock Alert: ${targetProduct.title}`,
        description: activePincode ? `Notification sent for Hub ${activePincode}` : 'Notification sent for live restock',
        pincode: activePincode,
        status: 'success',
      });
    } finally {
      set({ isSimulatingDrop: false });
    }
  },

  triggerDelayedDropTest: async (delaySeconds = 5) => {
    const state = get();
    const targetProduct =
      state.products.find((p) => !p.variants?.[0]?.isInStock) || state.products[0];

    if (!targetProduct) return;

    const activePincode = state.selectedPincode.pincode || state.pincodes[0]?.pincode || '';

    const dropEvent: RestockEvent = {
      id: `drop_${Date.now()}_${targetProduct.id}`,
      productId: targetProduct.id,
      productName: targetProduct.title,
      pincode: activePincode,
      timestamp: Date.now(),
      unitsAdded: 30,
      survivalDurationSecs: 180,
      variantName: targetProduct.variants?.[0]?.name || 'Standard Pack',
    };

    // 1. Schedule background system notification
    await NotificationService.scheduleDelayedNotification(
      {
        title: `⚡ Restock Alert: ${targetProduct.title}`,
        body: activePincode ? `Stock is now live for Hub ${activePincode}! Tap to view.` : 'Stock is now live! Tap to view.',
        productId: targetProduct.id,
        pincode: activePincode,
      },
      delaySeconds,
      state.selectedAlarmSoundId || 'digital_clock_beep'
    );

    // 2. Schedule in-app alarm event overlay + continuous audio when the delay ends (only if app is active in foreground)
    setTimeout(() => {
      if (AppState.currentState === 'active') {
        get().triggerAlarmEvent(dropEvent);
      }
      get().addActivityLog({
        type: 'restock',
        title: `Test Restock Alert: ${targetProduct.title}`,
        description: activePincode ? `Notification sent for Hub ${activePincode}` : 'Notification sent for live restock',
        pincode: activePincode,
        status: 'success',
      });
    }, delaySeconds * 1000);
  },

  triggerAlarmEvent: (event: RestockEvent) => {
    alarmSoundService.startAlarm(get().selectedAlarmSoundId || 'digital_clock_beep');
    set({ activeAlarmEvent: event, activeDropAlert: event });
  },

  dismissAlarmEvent: () => {
    alarmSoundService.stopAlarm();
    NotificationService.cancelAllNotifications();
    set({ activeAlarmEvent: null });
  },

  setAlarmOverlayEnabled: (enabled: boolean) => {
    set({ alarmOverlayEnabled: enabled });
    AsyncStorage.setItem(STORAGE_KEYS.ALARM_OVERLAY, String(enabled)).catch(() => {});
  },

  dismissDropAlert: () => {
    alarmSoundService.stopAlarm();
    NotificationService.cancelAllNotifications();
    set({ activeDropAlert: null, activeAlarmEvent: null });
  },

  setSelectedAlarmSoundId: (soundId: string) => {
    set({ selectedAlarmSoundId: soundId });
    AsyncStorage.setItem(STORAGE_KEYS.ALARM_SOUND, soundId).catch(() => {});
    let userPhone: string | undefined;
    try {
      const { useSessionStore } = require('./useSessionStore');
      userPhone = useSessionStore.getState().session?.mobile || undefined;
    } catch (_e) {}

    fcmService.getToken().then((token) => {
      if (token) {
        supabaseService.updateDeviceSound(token, soundId, userPhone);
      }
    });
  },

  addActivityLog: (log) => {
    const newLog: ActivityLog = {
      ...log,
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      timestamp: Date.now(),
    };
    set((state) => ({
      activityLogs: [newLog, ...state.activityLogs.slice(0, 49)],
    }));
  },

  syncCloudTrackedProductsForUser: async (phoneNumber: string) => {
    if (!phoneNumber) return;
    try {
      const cloudSubs = await supabaseService.fetchUserTrackedProducts(phoneNumber);
      if (cloudSubs && cloudSubs.length > 0) {
        let isVip = false;
        try {
          const { useSubscriptionStore } = require('./useSubscriptionStore');
          isVip = useSubscriptionStore.getState().isVipActive;
        } catch (_e) {}

        // If free tier, only allow at most 1 product
        const allowedSubs = isVip ? cloudSubs : cloudSubs.slice(0, 1);
        if (!isVip && cloudSubs.length > 1) {
          // Prune extra products from Supabase
          supabaseService.pruneUserTrackedProducts(phoneNumber, [allowedSubs[0].product_id]);
        }

        const trackedMap = { ...get().trackedProductsMap };
        let hasUpdates = false;

        for (const sub of allowedSubs) {
          if (!trackedMap[sub.product_id]) {
            const existingProd = get().allProductsMap[sub.product_id] || get().products.find((p) => p.id === sub.product_id);
            const prod: AmulProduct = existingProd || {
              id: sub.product_id,
              title: sub.product_title,
              brand: 'Official',
              category: 'protein',
              image: 'https://shop.amul.com/placeholder.png',
              variants: [{ id: `${sub.product_id}_var`, name: 'Standard Pack', price: 0, isInStock: false }],
              autoCartEnabled: true,
            };
            trackedMap[sub.product_id] = { ...prod, autoCartEnabled: true };
            hasUpdates = true;
          }
        }

        // If not VIP and trackedMap has more than 1 item, prune locally
        if (!isVip && Object.keys(trackedMap).length > 1) {
          const keepKey = allowedSubs[0]?.product_id || Object.keys(trackedMap)[0];
          const singleTrackedMap: Record<string, AmulProduct> = { [keepKey]: trackedMap[keepKey] };
          await AsyncStorage.setItem(STORAGE_KEYS.TRACKED_PRODUCTS, JSON.stringify(singleTrackedMap)).catch(() => {});
          set({ trackedProductsMap: singleTrackedMap });
        } else if (hasUpdates) {
          await AsyncStorage.setItem(STORAGE_KEYS.TRACKED_PRODUCTS, JSON.stringify(trackedMap)).catch(() => {});
          set({ trackedProductsMap: trackedMap });
          console.log(`☁️ [useStockStore] Restored ${allowedSubs.length} tracked items from cloud for user ${phoneNumber}`);
        }
      }
    } catch (err) {
      console.log('⚠️ [useStockStore] Error syncing cloud tracked products:', err);
    }
  },

  pruneTrackedProducts: (allowedIds: string[]) => {
    const state = get();
    const newTrackedMap: Record<string, AmulProduct> = {};

    Object.entries(state.trackedProductsMap).forEach(([id, prod]) => {
      if (allowedIds.includes(id)) {
        newTrackedMap[id] = prod;
      } else {
        // Unsubscribe from FCM topic
        const activePin = state.selectedPincode.pincode || 'all';
        const topic = fcmService.getTopicName(activePin, id);
        fcmService.unsubscribeFromTopic(topic);
      }
    });

    AsyncStorage.setItem(STORAGE_KEYS.TRACKED_PRODUCTS, JSON.stringify(newTrackedMap)).catch(() => {});

    const updatedProducts = state.products.map((p) => ({
      ...p,
      autoCartEnabled: !!newTrackedMap[p.id],
    }));

    const updatedAllMap = { ...state.allProductsMap };
    Object.keys(updatedAllMap).forEach((id) => {
      updatedAllMap[id] = {
        ...updatedAllMap[id],
        autoCartEnabled: !!newTrackedMap[id],
      };
    });

    set({
      trackedProductsMap: newTrackedMap,
      products: updatedProducts,
      allProductsMap: updatedAllMap,
    });
  },

  prunePincodesForFreeUser: () => {
    const state = get();
    if (state.pincodes.length <= 1) return;

    // Prefer saved address (or default), fallback to first
    const primaryPin = state.pincodes.find((p) => p.isSavedAddress) || state.pincodes.find((p) => p.isDefault) || state.pincodes[0];
    const newPincodes = [primaryPin];

    AsyncStorage.setItem(STORAGE_KEYS.PINCODES, JSON.stringify(newPincodes)).catch(() => {});
    AsyncStorage.setItem(STORAGE_KEYS.SELECTED_PINCODE, JSON.stringify(primaryPin)).catch(() => {});

    set({
      pincodes: newPincodes,
      selectedPincode: primaryPin,
    });
    console.log(`📍 [useStockStore] Pruned pincodes for Free User to single location: ${primaryPin.pincode}`);
  },

  refreshStock: async (sessionCookie?: string) => {
    await get().loadInitialData(sessionCookie);
    await stockRadarService.performLiveStockCheck();
  },
}));
