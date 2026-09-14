import { AppState, AppStateStatus, NativeEventSubscription } from 'react-native';
import { AmulApiClient } from './amulApi';
import { useStockStore } from '../store/useStockStore';
import { NotificationService } from './notificationService';
import { RestockEvent, AmulProduct } from '../types/amul';
import { analyticsService } from './analyticsService';
import AsyncStorage from '@react-native-async-storage/async-storage';

class StockRadarService {
  private intervalId: any = null;
  private isRunning: boolean = false;
  private isChecking: boolean = false;
  private previousStockMap: Record<string, boolean> = {}; // productId -> isInStock
  private checkIntervalMs: number = 15000; // Poll every 15 seconds for rapid drop detection
  private appStateSubscription: NativeEventSubscription | null = null;
  private lastAlertTimeMap: Record<string, number> = {}; // productId -> timestamp (cooldown)

  constructor() {
    this.setupAppStateListener();
  }

  private setupAppStateListener() {
    try {
      this.appStateSubscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
        if (nextAppState === 'active' && this.isRunning) {
          console.log('📱 [StockRadarService] App resumed to foreground, running instant stock radar check...');
          this.performLiveStockCheck();
        }
      });
    } catch (_e) {}
  }

  /**
   * Seed previous stock map from known store state or persistent cache
   */
  seedPreviousStock(trackedMap: Record<string, AmulProduct>) {
    if (!trackedMap) return;
    Object.values(trackedMap).forEach((p) => {
      const inStock = Boolean(p.variants?.[0]?.isInStock);
      this.previousStockMap[p.id] = inStock;
    });
  }

  /**
   * Explicitly set or update stock state for a product
   */
  setProductStockState(productId: string, inStock: boolean) {
    this.previousStockMap[productId] = inStock;
  }

  startMonitoring() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log(`📡 [StockRadarService] Starting Live Amul Stock Radar (Interval: ${this.checkIntervalMs / 1000}s)`);

    // Seed previous stock from existing tracked products
    const state = useStockStore.getState();
    this.seedPreviousStock(state.trackedProductsMap);

    // Run initial baseline check immediately
    this.performLiveStockCheck();

    // Periodic Polling Loop
    this.intervalId = setInterval(() => {
      this.performLiveStockCheck();
    }, this.checkIntervalMs);
  }

  stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('📡 [StockRadarService] Stopped Stock Radar');
  }

  /**
   * Centralized Restock Alert Dispatcher
   */
  async handleRestockDetected(product: AmulProduct, pincode: string) {
    const now = Date.now();
    const lastAlert = this.lastAlertTimeMap[product.id] || 0;
    // 60-second cooldown per product to avoid repeating identical alert if radar ticks rapidly
    if (now - lastAlert < 60000) {
      console.log(`⏳ [StockRadarService] Alert cooldown active for ${product.title}`);
      return;
    }
    this.lastAlertTimeMap[product.id] = now;

    console.log(`🚨 [StockRadarService] RESTOCK CONFIRMED FOR: ${product.title} (Pincode: ${pincode})!`);

    const unitsAdded = product.variants?.[0]?.stockCount || 20;
    const restockEvent: RestockEvent = {
      id: `drop_${now}_${product.id}`,
      productId: product.id,
      productName: product.title,
      pincode: pincode,
      timestamp: now,
      unitsAdded: unitsAdded,
      survivalDurationSecs: 300,
      variantName: product.variants?.[0]?.name || 'Standard Pack',
    };

    const state = useStockStore.getState();

    // 1. In-app full screen alarm overlay + looping audio
    state.triggerAlarmEvent(restockEvent);

    // 2. Dispatch High-Priority System Push Notification (Notifee / Expo with sound)
    await NotificationService.sendRestockNotification(
      {
        title: `⚡ Restock Alert: ${product.title}`,
        body: pincode ? `Stock is now live for Hub ${pincode}! Tap to buy now.` : 'Stock is now live! Tap to buy now.',
        productId: product.id,
        pincode: pincode,
      },
      state.selectedAlarmSoundId || 'digital_clock_beep'
    );

    // 3. Log to Activity Feed
    state.addActivityLog({
      type: 'restock',
      title: `Live Restock: ${product.title}`,
      description: pincode ? `Restock confirmed via Amul API for Hub ${pincode}` : 'Restock confirmed via Amul API',
      pincode: pincode,
      status: 'success',
    });

    // 4. Analytics
    analyticsService.logRestockAlert(product.id, product.title, pincode);
  }

  /**
   * Multi-Category Live Stock Check
   */
  async performLiveStockCheck() {
    if (this.isChecking) return;
    this.isChecking = true;

    try {
      const state = useStockStore.getState();
      const pincode = state.selectedPincode.pincode || '';
      const storeId = state.selectedPincode.storeId || '66505ff5145c16635e6cc74d';
      const activeCategory = state.selectedCategory || 'protein';
      const trackedMap = { ...state.trackedProductsMap };

      // Collect all unique categories that need monitoring:
      // Active category + categories of all currently tracked items
      const categoriesToPoll = new Set<string>();
      categoriesToPoll.add(activeCategory);

      Object.values(trackedMap).forEach((tp) => {
        if (tp.category) {
          categoriesToPoll.add(tp.category.toLowerCase().trim());
        }
      });

      console.log(`🔍 [StockRadarService] Radar polling categories: [${Array.from(categoriesToPoll).join(', ')}] for Store: ${storeId}`);

      let hasTrackedUpdates = false;
      const updatedAllMap = { ...state.allProductsMap };
      let updatedActiveCategoryProducts: AmulProduct[] | null = null;

      for (const categorySlug of categoriesToPoll) {
        try {
          const liveProducts = await AmulApiClient.fetchStoreProducts(categorySlug, storeId);
          if (!liveProducts || liveProducts.length === 0) continue;

          for (const liveProd of liveProducts) {
            const isNowInStock = Boolean(liveProd.variants?.[0]?.isInStock);
            const isTracked = trackedMap[liveProd.id] !== undefined;

            // Determine wasInStock:
            // 1. From previousStockMap if recorded
            // 2. Or from trackedMap previous variant state if available
            let wasInStock: boolean | undefined = this.previousStockMap[liveProd.id];
            if (wasInStock === undefined && isTracked) {
              const prevTracked = trackedMap[liveProd.id];
              wasInStock = Boolean(prevTracked?.variants?.[0]?.isInStock);
            }

            // Detect Restock Transition: (Previously Out of Stock OR false) -> Now In Stock!
            if (isTracked && wasInStock === false && isNowInStock === true) {
              await this.handleRestockDetected(liveProd, pincode);
            }

            // Record stock status for next comparison
            this.previousStockMap[liveProd.id] = isNowInStock;

            // If tracked, sync latest product data
            if (isTracked) {
              trackedMap[liveProd.id] = {
                ...liveProd,
                autoCartEnabled: true,
              };
              hasTrackedUpdates = true;
            }

            updatedAllMap[liveProd.id] = {
              ...liveProd,
              autoCartEnabled: isTracked,
            };
          }

          if (categorySlug === activeCategory) {
            updatedActiveCategoryProducts = liveProducts.map((p) => ({
              ...p,
              autoCartEnabled: trackedMap[p.id] !== undefined,
            }));
          }
        } catch (catErr) {
          console.log(`⚠️ [StockRadarService] Error polling category ${categorySlug}:`, catErr);
        }
      }

      if (hasTrackedUpdates) {
        AsyncStorage.setItem('@amul_tracked_products', JSON.stringify(trackedMap)).catch(() => {});
      }

      // Sync state updates
      useStockStore.setState({
        ...(updatedActiveCategoryProducts ? { products: updatedActiveCategoryProducts } : {}),
        allProductsMap: updatedAllMap,
        trackedProductsMap: trackedMap,
        lastUpdated: Date.now(),
      });
    } catch (err) {
      console.log('⚠️ [StockRadarService] Live check error:', err);
    } finally {
      this.isChecking = false;
    }
  }
}

export const stockRadarService = new StockRadarService();
