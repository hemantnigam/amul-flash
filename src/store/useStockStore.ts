import { create } from 'zustand';
import { AmulProduct, AmulCategory, PincodeLocation, ActivityLog, RestockEvent } from '../types/amul';
import { NotificationService } from '../services/notificationService';
import { AmulApiClient, DEFAULT_CATEGORIES } from '../services/amulApi';
import { alarmSoundService } from '../services/alarmSoundService';
import { stockRadarService } from '../services/radarService';

interface StockStoreState {
  products: AmulProduct[];
  categories: AmulCategory[];
  selectedCategory: string;
  pincodes: PincodeLocation[];
  selectedPincode: PincodeLocation;
  activityLogs: ActivityLog[];
  activeDropAlert: RestockEvent | null;
  activeAlarmEvent: RestockEvent | null;
  alarmOverlayEnabled: boolean;
  selectedAlarmSoundId: string;
  isSimulatingDrop: boolean;
  isLoadingProducts: boolean;
  lastUpdated: number;
  trackedProductsMap: Record<string, AmulProduct>;
  allProductsMap: Record<string, AmulProduct>;

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
  setAlarmOverlayEnabled: (enabled: boolean) => void;
  setSelectedAlarmSoundId: (soundId: string) => void;
  triggerAlarmEvent: (event: RestockEvent) => void;
  dismissAlarmEvent: () => void;
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
  categories: DEFAULT_CATEGORIES,
  selectedCategory: 'protein',
  pincodes: [],
  selectedPincode: DEFAULT_USER_PINCODE,
  activityLogs: [],
  activeDropAlert: null,
  activeAlarmEvent: null,
  alarmOverlayEnabled: true,
  selectedAlarmSoundId: 'digital_clock_beep',
  isSimulatingDrop: false,
  isLoadingProducts: false,
  lastUpdated: Date.now(),
  trackedProductsMap: {},
  allProductsMap: {},

  loadInitialData: async (sessionCookie?: string) => {
    set({ isLoadingProducts: true });
    try {
      // 1. Fetch live categories
      const liveCategories = await AmulApiClient.fetchCategories(sessionCookie);
      const activeCategories = liveCategories.length > 0 ? liveCategories : DEFAULT_CATEGORIES;
      set({ categories: activeCategories });

      // 2. Fetch live products for selected category from Amul API
      const substoreId = get().selectedPincode.storeId || '66505ff5145c16635e6cc74d';
      const liveProducts = await AmulApiClient.fetchStoreProducts(get().selectedCategory, substoreId, sessionCookie);

      const trackedMap = get().trackedProductsMap;
      const hydratedProducts = liveProducts.map((p) => ({
        ...p,
        autoCartEnabled: trackedMap[p.id] !== undefined ? Boolean(trackedMap[p.id]) : false,
      }));

      const newAllMap = { ...get().allProductsMap };
      hydratedProducts.forEach((p) => {
        newAllMap[p.id] = p;
      });

      set({
        products: hydratedProducts,
        allProductsMap: newAllMap,
        isLoadingProducts: false,
        lastUpdated: Date.now(),
      });

      // 3. Background pre-fetch remaining categories
      get().fetchAllCategoriesProducts(sessionCookie);

      // 4. Start Live Stock Radar Polling
      stockRadarService.startMonitoring();
    } catch (e) {
      set({ isLoadingProducts: false });
    }
  },

  setSelectedCategory: async (categorySlug: string, sessionCookie?: string) => {
    set({ selectedCategory: categorySlug, isLoadingProducts: true });
    try {
      const substoreId = get().selectedPincode.storeId || '66505ff5145c16635e6cc74d';
      const liveProducts = await AmulApiClient.fetchStoreProducts(categorySlug, substoreId, sessionCookie);

      const trackedMap = get().trackedProductsMap;
      const hydratedProducts = liveProducts.map((p) => ({
        ...p,
        autoCartEnabled: trackedMap[p.id] !== undefined ? Boolean(trackedMap[p.id]) : false,
      }));

      const newAllMap = { ...get().allProductsMap };
      hydratedProducts.forEach((p) => {
        newAllMap[p.id] = p;
      });

      set({
        products: hydratedProducts,
        allProductsMap: newAllMap,
        isLoadingProducts: false,
        lastUpdated: Date.now(),
      });
    } catch (e) {
      set({ isLoadingProducts: false });
    }
  },

  fetchAllCategoriesProducts: async (sessionCookie?: string) => {
    try {
      const substoreId = get().selectedPincode.storeId || '66505ff5145c16635e6cc74d';
      const categories = get().categories || DEFAULT_CATEGORIES;
      const trackedMap = get().trackedProductsMap;

      const priorityCats = categories.slice(0, 6);
      for (const cat of priorityCats) {
        if (cat.slug !== get().selectedCategory) {
          const catProducts = await AmulApiClient.fetchStoreProducts(cat.slug, substoreId, sessionCookie);
          if (catProducts && catProducts.length > 0) {
            const updatedMap = { ...get().allProductsMap };
            catProducts.forEach((p) => {
              updatedMap[p.id] = {
                ...p,
                autoCartEnabled: trackedMap[p.id] !== undefined ? Boolean(trackedMap[p.id]) : false,
              };
            });
            set({ allProductsMap: updatedMap });
          }
        }
      }
    } catch (e) {}
  },

  setSelectedPincode: async (pincode, sessionCookie?: string) => {
    set({ selectedPincode: pincode, isLoadingProducts: true, lastUpdated: Date.now() });

    get().addActivityLog({
      type: 'info' as any,
      title: `Switched location to ${pincode.label} (${pincode.pincode})`,
      description: `Active store cluster set to ${pincode.storeId}`,
      status: 'info',
    });

    try {
      const liveProducts = await AmulApiClient.fetchStoreProducts(get().selectedCategory, pincode.storeId, sessionCookie);
      const trackedMap = get().trackedProductsMap;
      const hydratedProducts = liveProducts.map((p) => ({
        ...p,
        autoCartEnabled: trackedMap[p.id] !== undefined ? true : p.autoCartEnabled,
      }));

      set({ products: hydratedProducts, isLoadingProducts: false });
    } catch (e) {
      set({ isLoadingProducts: false });
    }
  },

  addPincode: (pincode) => {
    set((state) => {
      const updated = [...state.pincodes, pincode];
      const shouldSelect = !state.selectedPincode.pincode;
      return {
        pincodes: updated,
        selectedPincode: shouldSelect ? pincode : state.selectedPincode,
      };
    });
  },

  removePincode: (pincodeStr) => {
    set((state) => {
      const target = state.pincodes.find((p) => p.pincode === pincodeStr);
      if (target?.isSavedAddress) return state;

      const remaining = state.pincodes.filter((p) => p.pincode !== pincodeStr);
      let newSelected = state.selectedPincode;
      if (state.selectedPincode.pincode === pincodeStr) {
        newSelected = remaining.length > 0 ? remaining[0] : DEFAULT_USER_PINCODE;
      }
      return {
        pincodes: remaining,
        selectedPincode: newSelected,
      };
    });
  },

  syncPincodesFromAddresses: (addresses) => {
    if (!addresses || addresses.length === 0) return;

    const userPincodes: PincodeLocation[] = [];

    addresses.forEach((addr: any) => {
      const pin = addr.pincode || addr.zip || addr.postcode;
      if (pin && String(pin).trim().length === 6) {
        const pinStr = String(pin).trim();
        const exists = userPincodes.some((p) => p.pincode === pinStr);
        if (!exists) {
          userPincodes.push({
            pincode: pinStr,
            label: addr.name ? `${addr.name}'s Address` : (addr.city || 'Saved Address'),
            address: `${addr.addressLine1 || addr.address || 'Saved Delivery Address'}${addr.city ? ', ' + addr.city : ''}`,
            storeId: '66505ff5145c16635e6cc74d',
            isDefault: addr.isDefault || userPincodes.length === 0,
            isSavedAddress: true,
            serviceable: true,
          });
        }
      }
    });

    if (userPincodes.length > 0) {
      const customPincodes = get().pincodes.filter(
        (p) => !userPincodes.some((u) => u.pincode === p.pincode) && p.pincode !== '110044'
      );
      const combined = [...userPincodes, ...customPincodes];
      const defaultPin = combined.find((p) => p.isDefault) || combined[0];

      set({
        pincodes: combined,
        selectedPincode: defaultPin,
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
          productObj || state.products.find((p) => p.id === productId);
        if (targetProduct) {
          newTrackedMap[productId] = { ...targetProduct, autoCartEnabled: true };
        }
      }

      const updatedProducts = state.products.map((p) =>
        p.id === productId ? { ...p, autoCartEnabled: !isCurrentlyTracked } : p
      );

      return {
        trackedProductsMap: newTrackedMap,
        products: updatedProducts,
      };
    });
  },

  triggerSimulatedDrop: async (productId) => {
    const state = get();
    const targetProduct = productId
      ? state.products.find((p) => p.id === productId) || state.products[0]
      : state.products.find((p) => !p.variants[0]?.isInStock) || state.products[0];

    if (!targetProduct) return;

    set({ isSimulatingDrop: true });

    // Create the restock drop event payload (WITHOUT mutating real product in-stock state)
    const dropEvent: RestockEvent = {
      id: `drop_${Date.now()}`,
      productId: targetProduct.id,
      productName: targetProduct.title,
      pincode: state.selectedPincode.pincode,
      timestamp: Date.now(),
      unitsAdded: 30,
      survivalDurationSecs: 180,
      variantName: targetProduct.variants[0]?.name || 'Standard Pack',
    };

    if (state.alarmOverlayEnabled) {
      alarmSoundService.startAlarm(state.selectedAlarmSoundId);
      set({
        activeDropAlert: dropEvent,
        activeAlarmEvent: dropEvent,
        isSimulatingDrop: false,
        lastUpdated: Date.now(),
      });
    } else {
      set({
        activeDropAlert: dropEvent,
        isSimulatingDrop: false,
        lastUpdated: Date.now(),
      });
    }

    // Play Emergency Alarm & Notification
    await NotificationService.triggerEmergencyAlarm(
      {
        title: `⚡ TEST RESTOCK DROP: ${targetProduct.title}`,
        body: `Testing alarm sound & overlay for Pincode ${state.selectedPincode.pincode}!`,
        productId: targetProduct.id,
        pincode: state.selectedPincode.pincode,
      },
      state.selectedAlarmSoundId
    );

    // Stock Tracker Log
    get().addActivityLog({
      type: 'restock',
      title: `Test Drop Alert: ${targetProduct.title}`,
      description: `Alarm tested for Hub ${state.selectedPincode.pincode}`,
      pincode: state.selectedPincode.pincode,
      status: 'success',
    });
  },

  triggerDelayedDropTest: async (delaySeconds = 8) => {
    const state = get();
    const targetProduct =
      state.products.find((p) => !p.variants[0]?.isInStock) || state.products[0];
    const soundId = state.selectedAlarmSoundId || 'digital_clock_beep';

    console.log(`⏱️ [triggerDelayedDropTest] Scheduling native AlarmManager alarm for ${delaySeconds}s from now.`);

    await NotificationService.scheduleDelayedLockScreenAlarm(
      {
        title: `⚡ TEST RESTOCK DROP: ${targetProduct ? targetProduct.title : 'Amul Whey Protein'}`,
        body: `Lock-Screen Wake Alarm Test for Pincode ${state.selectedPincode.pincode}!`,
        productId: targetProduct ? targetProduct.id : 'protein',
        pincode: state.selectedPincode.pincode,
      },
      delaySeconds,
      soundId
    );
  },

  setAlarmOverlayEnabled: (enabled: boolean) => {
    set({ alarmOverlayEnabled: enabled });
  },

  setSelectedAlarmSoundId: (soundId: string) => {
    set({ selectedAlarmSoundId: soundId });
  },

  triggerAlarmEvent: (event: RestockEvent) => {
    if (get().alarmOverlayEnabled) {
      alarmSoundService.startAlarm(get().selectedAlarmSoundId);
      set({ activeAlarmEvent: event });
    }
  },

  dismissAlarmEvent: () => {
    alarmSoundService.stopAlarm();
    set({ activeAlarmEvent: null });
  },

  dismissDropAlert: () => {
    alarmSoundService.stopAlarm();
    set({ activeDropAlert: null, activeAlarmEvent: null });
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
  },
}));
