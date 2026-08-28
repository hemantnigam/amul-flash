import { create } from 'zustand';
import { AmulProduct, AmulCategory, PincodeLocation, ActivityLog, RestockEvent } from '../types/amul';
import { INITIAL_PRODUCTS, INITIAL_PINCODES, INITIAL_ACTIVITY_LOGS } from '../constants/products';
import { NotificationService } from '../services/notificationService';
import { AmulApiClient, DEFAULT_CATEGORIES } from '../services/amulApi';

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

  // Actions
  loadInitialData: () => Promise<void>;
  setSelectedCategory: (categorySlug: string) => Promise<void>;
  setSelectedPincode: (pincode: PincodeLocation) => Promise<void>;
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
  categories: DEFAULT_CATEGORIES,
  selectedCategory: 'protein',
  pincodes: INITIAL_PINCODES,
  selectedPincode: INITIAL_PINCODES[0],
  activityLogs: INITIAL_ACTIVITY_LOGS,
  activeDropAlert: null,
  isSimulatingDrop: false,
  isLoadingProducts: false,
  lastUpdated: Date.now(),

  loadInitialData: async () => {
    set({ isLoadingProducts: true });
    try {
      // 1. Fetch all 16 live categories
      const liveCategories = await AmulApiClient.fetchCategories();
      set({ categories: liveCategories.length > 0 ? liveCategories : DEFAULT_CATEGORIES });

      // 2. Fetch live products for default category (protein)
      const substoreId = get().selectedPincode.storeId || '66505ff5145c16635e6cc74d';
      const liveProducts = await AmulApiClient.fetchStoreProducts(get().selectedCategory, substoreId);

      set({
        products: liveProducts,
        isLoadingProducts: false,
        lastUpdated: Date.now(),
      });
    } catch (e) {
      console.warn('Initial data load error:', e);
      set({ isLoadingProducts: false });
    }
  },

  setSelectedCategory: async (categorySlug: string) => {
    set({ selectedCategory: categorySlug, isLoadingProducts: true });
    try {
      const substoreId = get().selectedPincode.storeId || '66505ff5145c16635e6cc74d';
      const liveProducts = await AmulApiClient.fetchStoreProducts(categorySlug, substoreId);
      set({
        products: liveProducts,
        isLoadingProducts: false,
        lastUpdated: Date.now(),
      });
    } catch (e) {
      console.warn('Category change product load error:', e);
      set({ isLoadingProducts: false });
    }
  },

  setSelectedPincode: async (pincode) => {
    set({ selectedPincode: pincode, isLoadingProducts: true, lastUpdated: Date.now() });

    get().addActivityLog({
      type: 'info' as any,
      title: `Switched location to ${pincode.label} (${pincode.pincode})`,
      description: `Active store cluster set to ${pincode.storeId}`,
      status: 'info',
    });

    // Re-fetch products for new location cluster
    try {
      const liveProducts = await AmulApiClient.fetchStoreProducts(get().selectedCategory, pincode.storeId);
      set({ products: liveProducts, isLoadingProducts: false });
    } catch (e) {
      set({ isLoadingProducts: false });
    }
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

  triggerSimulatedDrop: async (productId) => {
    const state = get();
    const targetProduct = productId
      ? state.products.find((p) => p.id === productId) || state.products[0]
      : state.products.find((p) => !p.variants[0]?.isInStock) || state.products[0];

    if (!targetProduct) return;

    set({ isSimulatingDrop: true });

    // 1. Update product to In Stock with 30 units
    const updatedProducts = state.products.map((p) => {
      if (p.id === targetProduct.id) {
        return {
          ...p,
          variants: p.variants.map((v) => ({
            ...v,
            isInStock: true,
            stockCount: 30,
          })),
        };
      }
      return p;
    });

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

    set({
      products: updatedProducts,
      activeDropAlert: dropEvent,
      isSimulatingDrop: false,
      lastUpdated: Date.now(),
    });

    // 2. Play Emergency Alarm & Notification
    await NotificationService.triggerEmergencyAlarm({
      title: `⚡ FLASH DROP: ${targetProduct.title}`,
      body: `30 units restocked for Pincode ${state.selectedPincode.pincode}! Auto-cart reserving now...`,
      productId: targetProduct.id,
      pincode: state.selectedPincode.pincode,
      isEmergencyAlarm: true,
    });

    // 3. Headless Auto-Cart
    if (targetProduct.autoCartEnabled) {
      const cartResult = await AmulApiClient.instantAddToCart(
        targetProduct.id,
        targetProduct.variants[0]?.sku || targetProduct.id,
        1
      );

      get().addActivityLog({
        type: 'auto_cart' as any,
        title: `Auto-Cart Locked: ${targetProduct.title}`,
        description: `Reserved in ${cartResult.latencyMs}ms. Cart ID: ${cartResult.cartId}`,
        pincode: state.selectedPincode.pincode,
        status: 'success',
      });
    }
  },

  dismissDropAlert: () => {
    set({ activeDropAlert: null });
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

  refreshStock: async () => {
    await get().loadInitialData();
  },
}));
