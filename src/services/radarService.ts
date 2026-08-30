import { AmulApiClient } from './amulApi';
import { useStockStore } from '../store/useStockStore';
import { NotificationService } from './notificationService';
import { RestockEvent } from '../types/amul';

class StockRadarService {
  private intervalId: any = null;
  private isRunning: boolean = false;
  private previousStockMap: Record<string, boolean> = {}; // productId -> isInStock
  private checkIntervalMs: number = 20000; // Poll every 20 seconds

  startMonitoring() {
    if (this.isRunning) return;
    this.isRunning = true;
    console.log('📡 [StockRadarService] Starting Live Amul Stock Radar (Interval: 20s)');

    // Run initial baseline check immediately
    this.performLiveStockCheck();

    // Loop
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

  async performLiveStockCheck() {
    try {
      const state = useStockStore.getState();
      const pincode = state.selectedPincode.pincode;
      const storeId = state.selectedPincode.storeId || '66505ff5145c16635e6cc74d';
      const category = state.selectedCategory || 'protein';

      console.log(`🔍 [StockRadarService] Polling live Amul API for Category: ${category}, Store: ${storeId} (${pincode})`);

      const liveProducts = await AmulApiClient.fetchStoreProducts(category, storeId);
      if (!liveProducts || liveProducts.length === 0) return;

      const trackedMap = state.trackedProductsMap || {};

      for (const liveProd of liveProducts) {
        const isNowInStock = Boolean(liveProd.variants[0]?.isInStock);
        const wasInStock = this.previousStockMap[liveProd.id];
        const isTracked = Boolean(trackedMap[liveProd.id]);

        // Detect Transition: OUT OF STOCK -> IN STOCK for TRACKED items ONLY!
        if (isTracked && wasInStock === false && isNowInStock === true) {
          console.log(`🚨 [StockRadarService] TRACKED RESTOCK DETECTED via API for: ${liveProd.title}!`);

          const restockEvent: RestockEvent = {
            id: `drop_${Date.now()}_${liveProd.id}`,
            productId: liveProd.id,
            productName: liveProd.title,
            pincode: pincode,
            timestamp: Date.now(),
            unitsAdded: liveProd.variants[0]?.stockCount || 20,
            survivalDurationSecs: 300,
            variantName: liveProd.variants[0]?.name || 'Standard',
          };

          // 1. Show in-app full screen alarm overlay + banner
          useStockStore.getState().triggerAlarmEvent(restockEvent);

          // 2. Dispatch High-Priority Restock Notification
          await NotificationService.sendRestockNotification(
            {
              title: `⚡ Restock Alert: ${liveProd.title}`,
              body: `Stock is now live for Pincode ${pincode}! Tap to buy now.`,
              productId: liveProd.id,
              pincode: pincode,
            },
            state.selectedAlarmSoundId || 'digital_clock_beep'
          );

          // 3. Log to Activity Feed
          state.addActivityLog({
            type: 'restock',
            title: `Live Restock: ${liveProd.title}`,
            description: `Restock confirmed via Amul API for Hub ${pincode}`,
            pincode: pincode,
            status: 'success',
          });
        }

        // Record stock state for next cycle comparison
        this.previousStockMap[liveProd.id] = isNowInStock;
      }

      // Update store with live API products without corrupting state
      const hydrated = liveProducts.map((p) => ({
        ...p,
        autoCartEnabled: trackedMap[p.id] !== undefined ? Boolean(trackedMap[p.id]) : false,
      }));

      useStockStore.setState({
        products: hydrated,
        lastUpdated: Date.now(),
      });
    } catch (err) {
      console.log('⚠️ [StockRadarService] Live check error:', err);
    }
  }
}

export const stockRadarService = new StockRadarService();
