import { create } from 'zustand';
import { AmulProduct, PincodeLocation, ActivityLog, RestockEvent, AmulCategory } from '../types/amul';
import { AmulApiClient } from '../services/amulApi';
import { stockRadarService } from '../services/radarService';
import { NotificationService } from '../services/notificationService';
import { alarmSoundService } from '../services/alarmSoundService';

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

  loadInitialData: async (sessionCookie?: string) => {
    set({ isLoadingProducts: true });
    try {
      // 1. Fetch live categories
      const liveCategories = await AmulApiClient.fetchCategories(sessionCookie);
      set({ categories: liveCategories });

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
    } catch (_e) {
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
              prods.forEach((p) => {
                updated[p.id] = {
                  ...p,
                  autoCartEnabled: state.trackedProductsMap[p.id] !== undefined ? Boolean(state.trackedProductsMap[p.id]) : false,
                };
              });
              return { allProductsMap: updated };
            });
          }
        } catch (_err) {}
      }
    } catch (_e) {}
  },

  setSelectedPincode: async (pincode: PincodeLocation, sessionCookie?: string) => {
    set({ selectedPincode: pincode, isLoadingProducts: true });
    try {
      const substoreId = pincode.storeId || '66505ff5145c16635e6cc74d';
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

      // Background re-fetch all categories with new store
      get().fetchAllCategoriesProducts(sessionCookie);
    } catch (_e) {
      set({ isLoadingProducts: false });
    }
  },

  addPincode: (pincode: PincodeLocation) => {
    set((state) => {
      const exists = state.pincodes.some((p) => p.pincode === pincode.pincode);
      if (exists) return state;
      return {
        pincodes: [...state.pincodes, pincode],
      };
    });
  },

  removePincode: (pincodeStr: string) => {
    set((state) => {
      const updated = state.pincodes.filter((p) => p.pincode !== pincodeStr);
      const isSelected = state.selectedPincode.pincode === pincodeStr;
      return {
        pincodes: updated,
        selectedPincode: isSelected
          ? updated[0] || DEFAULT_USER_PINCODE
          : state.selectedPincode,
      };
    });
  },

  syncPincodesFromAddresses: (addresses: any[]) => {
    if (!addresses || addresses.length === 0) return;

    const userPincodes: PincodeLocation[] = addresses.map((addr, idx) => ({
      pincode: addr.pincode || '',
      label: addr.addressType || (idx === 0 ? 'Home' : `Address ${idx + 1}`),
      address: [addr.addressLine1, addr.addressLine2, addr.city, addr.state]
        .filter(Boolean)
        .join(', '),
      storeId: '66505ff5145c16635e6cc74d',
      isDefault: addr.isDefault || idx === 0,
      serviceable: true,
    })).filter(p => !!p.pincode);

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

    try {
      const dropEvent: RestockEvent = {
        id: `drop_${Date.now()}`,
        productId: targetProduct.id,
        productName: targetProduct.title,
        pincode: state.selectedPincode.pincode || '110044',
        timestamp: Date.now(),
        unitsAdded: 30,
        survivalDurationSecs: 180,
        variantName: targetProduct.variants[0]?.name || 'Standard Pack',
      };

      // Trigger in-app full screen alarm overlay + continuous audio
      get().triggerAlarmEvent(dropEvent);

      // Send standard push notification with selected sound
      await NotificationService.sendRestockNotification(
        {
          title: `⚡ Restock Alert: ${targetProduct.title}`,
          body: `Stock is now live for Hub ${state.selectedPincode.pincode || '110044'}! Tap to view.`,
          productId: targetProduct.id,
          pincode: state.selectedPincode.pincode || '110044',
        },
        state.selectedAlarmSoundId || 'digital_clock_beep'
      );

      // Stock Tracker Log
      get().addActivityLog({
        type: 'restock',
        title: `Test Restock Alert: ${targetProduct.title}`,
        description: `Notification sent for Hub ${state.selectedPincode.pincode || '110044'}`,
        pincode: state.selectedPincode.pincode || '110044',
        status: 'success',
      });
    } finally {
      set({ isSimulatingDrop: false });
    }
  },

  triggerDelayedDropTest: async (delaySeconds = 5) => {
    const state = get();
    const targetProduct =
      state.products.find((p) => !p.variants[0]?.isInStock) || state.products[0];

    if (!targetProduct) return;

    await NotificationService.scheduleDelayedNotification(
      {
        title: `⚡ Restock Alert: ${targetProduct.title}`,
        body: `Stock is now live for Hub ${state.selectedPincode.pincode || '110044'}! Tap to view.`,
        productId: targetProduct.id,
        pincode: state.selectedPincode.pincode || '110044',
      },
      delaySeconds,
      state.selectedAlarmSoundId || 'digital_clock_beep'
    );
  },

  triggerAlarmEvent: (event: RestockEvent) => {
    if (get().alarmOverlayEnabled) {
      alarmSoundService.startAlarm(get().selectedAlarmSoundId);
      set({ activeAlarmEvent: event, activeDropAlert: event });
    }
  },

  dismissAlarmEvent: () => {
    alarmSoundService.stopAlarm();
    set({ activeAlarmEvent: null });
  },

  setAlarmOverlayEnabled: (enabled: boolean) => {
    set({ alarmOverlayEnabled: enabled });
  },

  dismissDropAlert: () => {
    alarmSoundService.stopAlarm();
    set({ activeDropAlert: null, activeAlarmEvent: null });
  },

  setSelectedAlarmSoundId: (soundId: string) => {
    set({ selectedAlarmSoundId: soundId });
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
