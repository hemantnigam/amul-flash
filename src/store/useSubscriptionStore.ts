import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabaseService, UserSubscriptionRecord } from '../services/supabaseClient';
import { useStockStore } from './useStockStore';

const STORAGE_KEY_SUBSCRIPTION = '@amul_user_subscription';

export const RAZORPAY_PAYMENT_LINKS = {
  '1_week_pass': 'https://rzp.io/rzp/ilpyAh9C',
  '1_month_pass': 'https://rzp.io/rzp/MmT6Uxtd',
} as const;

export interface SubscriptionState {
  subscription: UserSubscriptionRecord | null;
  isVipActive: boolean;
  isTrial: boolean;
  daysRemaining: number;
  isExpiringSoon: boolean; // Day 28 pre-expiry trigger (<= 2 days)
  isPaywallVisible: boolean;
  paywallReason: string;
  isPaymentDetailsVisible: boolean;
  isTrialExpiredPickerVisible: boolean;
  isLoading: boolean;

  // Actions
  initSubscription: (phoneNumber: string) => Promise<void>;
  verifySubscriptionStatus: (phoneNumber: string) => Promise<boolean>;
  checkGating: (action: 'track_product' | 'add_pincode' | 'view_stats', currentCount?: number) => boolean;
  openPaywall: (reason?: string) => void;
  closePaywall: () => void;
  openPaymentDetails: () => void;
  closePaymentDetails: () => void;
  purchasePass: (
    plan: '1_week_pass' | '1_month_pass',
    paymentMethod: string,
    phoneNumber?: string
  ) => Promise<boolean>;
  setTrialExpiredPickerVisible: (visible: boolean) => void;
  resolveExpiredTrackedItems: (keepProductId: string, phoneNumber?: string) => Promise<void>;
  simulateTrialExpiration: () => void; // Development/testing helper
}

export function parseFlexibleDate(dateInput?: string | number | null): number {
  if (!dateInput) return 0;
  if (typeof dateInput === 'number') return dateInput;
  const str = String(dateInput).trim();
  if (!str) return 0;

  // 1. Direct standard parse
  let ts = new Date(str).getTime();
  if (!isNaN(ts) && ts > 0) return ts;

  // 2. Fix PostgreSQL timestamp format like '2026-09-20 18:30:00+00' -> '2026-09-20T18:30:00+00:00'
  let isoFix = str.replace(' ', 'T');
  if (/[+-]\d{2}$/.test(isoFix)) {
    isoFix = isoFix + ':00'; // '+00' -> '+00:00'
  }
  ts = new Date(isoFix).getTime();
  if (!isNaN(ts) && ts > 0) return ts;

  // 3. Match DD-MM-YYYY or DD/MM/YYYY or DD-MM-YY or DD/MM/YY
  const ddmmyy = /^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/;
  const m1 = str.match(ddmmyy);
  if (m1) {
    const day = parseInt(m1[1], 10);
    const month = parseInt(m1[2], 10) - 1;
    let year = parseInt(m1[3], 10);
    if (year < 100) year = 2000 + year;
    return new Date(year, month, day, 23, 59, 59).getTime();
  }

  // 4. Match YYYY-MM-DD or YYYY/MM/DD
  const yyyymmdd = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/;
  const m2 = str.match(yyyymmdd);
  if (m2) {
    const year = parseInt(m2[1], 10);
    const month = parseInt(m2[2], 10) - 1;
    const day = parseInt(m2[3], 10);
    return new Date(year, month, day, 23, 59, 59).getTime();
  }

  return 0;
}

export function computeSubscriptionMetrics(sub: UserSubscriptionRecord | null) {
  if (!sub) {
    return {
      isVipActive: false,
      isTrial: false,
      daysRemaining: 0,
      isExpiringSoon: false,
    };
  }

  const now = Date.now();
  const startTime = parseFlexibleDate(sub.starts_at);
  const expiryTime = parseFlexibleDate(sub.expires_at);
  const diffMs = expiryTime - now;
  const days = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  
  // Active purely when current time is within [starts_at, expires_at] and expires_at is strictly in the future
  const isActive = expiryTime > 0 && diffMs > 0 && (!startTime || now >= startTime);
  const isTrial = isActive && sub.plan_name === '30_day_welcome_trial';
  const isExpiringSoon = isActive && isTrial && days <= 2 && days > 0;

  console.log('📊 [computeSubscriptionMetrics]', {
    plan: sub.plan_name,
    starts_at: sub.starts_at,
    expires_at: sub.expires_at,
    parsedExpiry: expiryTime > 0 ? new Date(expiryTime).toISOString() : 'invalid',
    now: new Date(now).toISOString(),
    diffMs,
    isActive,
    daysRemaining: days,
  });

  return {
    isVipActive: isActive,
    isTrial,
    daysRemaining: days,
    isExpiringSoon,
  };
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  subscription: null,
  isVipActive: false,
  isTrial: false,
  daysRemaining: 0,
  isExpiringSoon: false,
  isPaywallVisible: false,
  paywallReason: '',
  isPaymentDetailsVisible: false,
  isTrialExpiredPickerVisible: false,
  isLoading: false,

  initSubscription: async (phoneNumber: string) => {
    if (!phoneNumber) return;
    set({ isLoading: true });

    const cleanKey = phoneNumber.replace(/[^0-9]/g, '').slice(-10);

    try {
      // 1. Load cached subscription from AsyncStorage for 0ms initial render
      const cached = await AsyncStorage.getItem(`${STORAGE_KEY_SUBSCRIPTION}_${cleanKey}`);
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as UserSubscriptionRecord;
          const metrics = computeSubscriptionMetrics(parsed);
          set({
            subscription: parsed,
            ...metrics,
          });
        } catch (_e) {}
      }

      // 2. Fetch or auto-provision 30-Day VIP Welcome Pass in Supabase
      const cloudSub = await supabaseService.getOrCreateUserSubscription(phoneNumber);
      if (cloudSub) {
        const metrics = computeSubscriptionMetrics(cloudSub);
        set({
          subscription: cloudSub,
          ...metrics,
          isLoading: false,
        });
        await AsyncStorage.setItem(`${STORAGE_KEY_SUBSCRIPTION}_${cleanKey}`, JSON.stringify(cloudSub)).catch(() => {});

        // 3. If trial is expired and user has >1 products tracked, trigger resolution modal
        if (!metrics.isVipActive) {
          const stockStore = useStockStore.getState();
          const trackedCount = Object.keys(stockStore.trackedProductsMap).length;
          if (trackedCount > 1) {
            set({ isTrialExpiredPickerVisible: true });
          }
        }
      } else {
        set({ isLoading: false });
      }
    } catch (e) {
      console.log('⚠️ [useSubscriptionStore] initSubscription error:', e);
      set({ isLoading: false });
    }
  },

  verifySubscriptionStatus: async (phoneNumber: string) => {
    if (!phoneNumber) return false;
    const cleanKey = phoneNumber.replace(/[^0-9]/g, '').slice(-10);
    try {
      const cloudSub = await supabaseService.fetchUserSubscription(phoneNumber);
      if (cloudSub) {
        const metrics = computeSubscriptionMetrics(cloudSub);
        set({
          subscription: cloudSub,
          ...metrics,
        });
        await AsyncStorage.setItem(`${STORAGE_KEY_SUBSCRIPTION}_${cleanKey}`, JSON.stringify(cloudSub)).catch(() => {});
        return metrics.isVipActive;
      }
      return false;
    } catch (_e) {
      return false;
    }
  },

  checkGating: (action, currentCount = 0) => {
    const { isVipActive } = get();

    // If VIP or 30-Day Trial is active, all features are unlocked without restriction
    if (isVipActive) {
      return true;
    }

    // Free Tier limits:
    if (action === 'track_product') {
      if (currentCount >= 1) {
        set({
          isPaywallVisible: true,
          paywallReason: 'Free plan allows tracking 1 product. Unlock VIP Pass for unlimited restock alerts across all Amul items.',
        });
        return false;
      }
      return true;
    }

    if (action === 'add_pincode') {
      if (currentCount >= 1) {
        set({
          isPaywallVisible: true,
          paywallReason: 'Free plan is limited to 1 delivery pincode. Upgrade to VIP Pass to monitor multiple pincodes (Home, Office, Gym).',
        });
        return false;
      }
      return true;
    }

    if (action === 'view_stats') {
      set({
        isPaywallVisible: true,
        paywallReason: 'Unlock Drop Intelligence, 24-hour peak restock histograms, and demand heatmaps with VIP Pass.',
      });
      return false;
    }

    return true;
  },

  openPaywall: (reason) => {
    const { isVipActive, isTrial, isExpiringSoon } = get();
    // If user has active welcome pack with > 2 days remaining, show details modal instead of payment paywall
    if (isVipActive && isTrial && !isExpiringSoon) {
      set({ isPaymentDetailsVisible: true, isPaywallVisible: false });
      return;
    }

    set({
      isPaywallVisible: true,
      paywallReason: reason || 'Unlock Unlimited Tracking, Multi-Hub Monitoring & Drop Intelligence.',
    });
  },

  closePaywall: () => {
    set({ isPaywallVisible: false });
  },

  openPaymentDetails: () => {
    set({ isPaymentDetailsVisible: true });
  },

  closePaymentDetails: () => {
    set({ isPaymentDetailsVisible: false });
  },

  purchasePass: async (plan, paymentMethod, phoneNumber) => {
    const amount = plan === '1_week_pass' ? 7 : 25;
    const paymentId = `upi_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    try {
      const activePhone = phoneNumber || get().subscription?.phone_number;
      if (!activePhone) return false;

      const updatedSub = await supabaseService.activateSubscriptionPlan(
        activePhone,
        plan,
        amount,
        paymentId
      );

      if (updatedSub) {
        const metrics = computeSubscriptionMetrics(updatedSub);
        set({
          subscription: updatedSub,
          ...metrics,
          isPaywallVisible: false,
          isTrialExpiredPickerVisible: false,
        });

        await AsyncStorage.setItem(
          `${STORAGE_KEY_SUBSCRIPTION}_${activePhone}`,
          JSON.stringify(updatedSub)
        ).catch(() => {});

        return true;
      }
      return false;
    } catch (e) {
      console.log('⚠️ [useSubscriptionStore] purchasePass error:', e);
      return false;
    }
  },

  setTrialExpiredPickerVisible: (visible) => {
    set({ isTrialExpiredPickerVisible: visible });
  },

  resolveExpiredTrackedItems: async (keepProductId, _phoneNumber) => {
    const stockStore = useStockStore.getState();
    const trackedMap = { ...stockStore.trackedProductsMap };

    // Keep only the selected product, remove others
    Object.keys(trackedMap).forEach((id) => {
      if (id !== keepProductId) {
        stockStore.toggleAutoCartForProduct(id);
      }
    });

    set({ isTrialExpiredPickerVisible: false });
  },

  simulateTrialExpiration: () => {
    const current = get().subscription;
    if (!current) return;
    const expiredSub: UserSubscriptionRecord = {
      ...current,
      expires_at: new Date(Date.now() - 1000 * 60).toISOString(),
    };
    const metrics = computeSubscriptionMetrics(expiredSub);
    set({
      subscription: expiredSub,
      ...metrics,
    });
  },
}));
