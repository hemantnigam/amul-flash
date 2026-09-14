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

      // Automatically sync all tracked items to Supabase cloud on launch
      const trackedItems = Object.values(trackedMap);
      if (trackedItems.length > 0) {
        fcmService.getToken().then((token) => {
          if (token) {
            supabaseService.syncAllTrackedProducts(
              token,
              trackedItems,
              selectedPincode.pincode,
              selectedPincode.storeId || '66505ff5145c16635e6cc74d'
            );
          }
        });
      }
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
      const currentPincode = get().selectedPincode.pincode || '';

      const hydratedProducts = liveProducts.map((p) => {
        const isTracked = trackedMap[p.id] !== undefined;
        if (isTracked) {
          const wasInStock = Boolean(trackedMap[p.id]?.variants?.[0]?.isInStock);
          const isNowInStock = Boolean(p.variants?.[0]?.isInStock);
          if (wasInStock === false && isNowInStock === true) {
            stockRadarService.handleRestockDetected(p, currentPincode);
          }
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
      const currentPincode = get().selectedPincode.pincode || '';

      const hydratedProducts = liveProducts.map((p) => {
        const isTracked = trackedMap[p.id] !== undefined;
        if (isTracked) {
          const wasInStock = Boolean(trackedMap[p.id]?.variants?.[0]?.isInStock);
          const isNowInStock = Boolean(p.variants?.[0]?.isInStock);
          if (wasInStock === false && isNowInStock === true) {
            stockRadarService.handleRestockDetected(p, currentPincode);
          }
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
      const currentPincode = get().selectedPincode.pincode || '';

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
                  const wasInStock = Boolean(state.trackedProductsMap[p.id]?.variants?.[0]?.isInStock);
                  const isNowInStock = Boolean(p.variants?.[0]?.isInStock);
                  if (wasInStock === false && isNowInStock === true) {
                    stockRadarService.handleRestockDetected(p, currentPincode);
                  }
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
          const wasInStock = Boolean(trackedMap[p.id]?.variants?.[0]?.isInStock);
          const isNowInStock = Boolean(p.variants?.[0]?.isInStock);
          if (wasInStock === false && isNowInStock === true) {
            stockRadarService.handleRestockDetected(p, pincode.pincode);
          }
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
            serviceable: true,
            distanceKm: 0,
          });
        }
      }
    });

    if (userPincodes.length > 0) {
      const customPincodes = currentPincodes.filter(
        (p) => !p.isSavedAddress && !userPincodes.some((u) => u.pincode === p.pincode)
      );
      const combined = [...userPincodes, ...customPincodes];

      let currentSelected = get().selectedPincode;
      const isSelectedValid = currentSelected?.pincode && combined.some((p) => p.pincode === currentSelected.pincode);

      const targetSelected = isSelectedValid
        ? combined.find((p) => p.pincode === currentSelected.pincode)!
        : (combined.find((p) => p.isDefault) || combined[0]);

      AsyncStorage.setItem(STORAGE_KEYS.PINCODES, JSON.stringify(combined)).catch(() => {});
      AsyncStorage.setItem(STORAGE_KEYS.SELECTED_PINCODE, JSON.stringify(targetSelected)).catch(() => {});

      set({
        pincodes: combined,
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

      // Sync tracked subscription to Supabase and FCM topic
      const willBeTracked = !isCurrentlyTracked;
      const activePin = state.selectedPincode.pincode || 'all';
      const activeStoreId = state.selectedPincode.storeId || '66505ff5145c16635e6cc74d';
      const targetProd = productObj || state.products.find((p) => p.id === productId) || state.allProductsMap[productId];

      fcmService.getToken().then((token) => {
        if (token && targetProd) {
          supabaseService.syncSubscription({
            fcmToken: token,
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

  refreshStock: async (sessionCookie?: string) => {
    await get().loadInitialData(sessionCookie);
    await stockRadarService.performLiveStockCheck();
  },
}));
