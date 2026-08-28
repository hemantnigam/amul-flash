import { create } from 'zustand';
import { AmulProduct, PincodeLocation, ActivityLog, RestockEvent } from '../types/amul';
import { INITIAL_PRODUCTS, INITIAL_PINCODES, INITIAL_ACTIVITY_LOGS } from '../constants/products';
import { NotificationService } from '../services/notificationService';
import { AmulApiClient } from '../services/amulApi';

interface StockStoreState {
  products: AmulProduct[];
  pincodes: PincodeLocation[];
  selectedPincode: PincodeLocation;
  activityLogs: ActivityLog[];
  activeDropAlert: RestockEvent | null;
  isSimulatingDrop: boolean;
  lastUpdated: number;

  // Actions
  setSelectedPincode: (pincode: PincodeLocation) => void;
  addPincode: (pincode: PincodeLocation) => void;
  removePincode: (pincodeStr: string) => void;
  toggleAutoCartForProduct: (productId: string) => void;
  triggerSimulatedDrop: (productId?: string) => Promise<void>;
  dismissDropAlert: () => void;
  addActivityLog: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
  refreshStock: () => Promise<void>;
}

export const useStockStore = create<StockStoreState>((set, get) => ({
  products: INITIAL_PRODUCTS,
  pincodes: INITIAL_PINCODES,
  selectedPincode: INITIAL_PINCODES[0],
  activityLogs: INITIAL_ACTIVITY_LOGS,
  activeDropAlert: null,
  isSimulatingDrop: false,
  lastUpdated: Date.now(),

  setSelectedPincode: (pincode) => {
    set({ selectedPincode: pincode, lastUpdated: Date.now() });
    get().addActivityLog({
      type: 'info' as any,
      title: `Switched location to ${pincode.label} (${pincode.pincode})`,
      description: `Active store cluster set to ${pincode.storeId}`,
      status: 'info',
    });
  },

  addPincode: (pincode) => {
    set((state) => ({
      pincodes: [...state.pincodes, pincode],
    }));
  },

  removePincode: (pincodeStr) => {
    set((state) => ({
      pincodes: state.pincodes.filter((p) => p.pincode !== pincodeStr),
    }));
  },

  toggleAutoCartForProduct: (productId) => {
    set((state) => ({
      products: state.products.map((p) =>
        p.id === productId ? { ...p, autoCartEnabled: !p.autoCartEnabled } : p
      ),
    }));
  },

  addActivityLog: (log) => {
    const newLog: ActivityLog = {
      ...log,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
    };
    set((state) => ({
      activityLogs: [newLog, ...state.activityLogs].slice(0, 50),
    }));
  },

  dismissDropAlert: () => {
    set({ activeDropAlert: null });
  },

  triggerSimulatedDrop: async (targetProductId) => {
    const state = get();
    const target =
      state.products.find((p) => p.id === targetProductId) ||
      state.products.find((p) => p.id === 'amul-protein-lassi-plain') ||
      state.products[0];

    set({ isSimulatingDrop: true });

    // 1. Update product to In Stock with limited units
    const restockCount = Math.floor(Math.random() * 20) + 10;
    set((s) => ({
      products: s.products.map((p) =>
        p.id === target.id
          ? {
              ...p,
              variants: p.variants.map((v) => ({
                ...v,
                isInStock: true,
                stockCount: restockCount,
              })),
            }
          : p
      ),
      lastUpdated: Date.now(),
    }));

    const dropEvent: RestockEvent = {
      id: `drop_${Date.now()}`,
      productId: target.id,
      productName: target.title,
      pincode: state.selectedPincode.pincode,
      timestamp: Date.now(),
      unitsAdded: restockCount,
      survivalDurationSecs: 165,
      variantName: target.variants[0]?.name || 'Pack of 30',
    };

    set({ activeDropAlert: dropEvent });

    // 2. Add Activity Log
    state.addActivityLog({
      type: 'restock',
      title: `⚡ FLASH DROP: ${target.title}`,
      description: `${restockCount} units available at ${state.selectedPincode.label} (${state.selectedPincode.pincode}). Selling out fast!`,
      status: 'warning',
    });

    // 3. Trigger Emergency Notification / Alarm
    await NotificationService.triggerEmergencyAlarm({
      title: `🚨 AMUL FLASH RESTOCK: ${target.title}`,
      body: `${restockCount} units just dropped at ${state.selectedPincode.label}! Tap to checkout in < 3s.`,
      productId: target.id,
      pincode: state.selectedPincode.pincode,
      isEmergencyAlarm: true,
    });

    // 4. Headless Auto-Cart Simulation if enabled
    if (target.autoCartEnabled) {
      const cartRes = await AmulApiClient.instantAddToCart(
        target.id,
        target.variants[0].id,
        1
      );
      state.addActivityLog({
        type: 'auto_cart',
        title: `Headless Auto-Cart Reserved (${cartRes.latencyMs}ms)`,
        description: `1x ${target.variants[0].name} safely locked in cart for your session.`,
        status: 'success',
      });
    }

    set({ isSimulatingDrop: false });
  },

  refreshStock: async () => {
    set({ lastUpdated: Date.now() });
    await new Promise((r) => setTimeout(r, 600));
  },
}));
