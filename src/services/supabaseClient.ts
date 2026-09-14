import { createClient, SupabaseClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { AmulProduct } from '../types/amul';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

let supabaseInstance: SupabaseClient | null = null;

const ExpoSafeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web' && typeof window === 'undefined') {
      return null;
    }
    try {
      return await AsyncStorage.getItem(key);
    } catch (_e) {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web' && typeof window === 'undefined') {
      return;
    }
    try {
      await AsyncStorage.setItem(key, value);
    } catch (_e) {}
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web' && typeof window === 'undefined') {
      return;
    }
    try {
      await AsyncStorage.removeItem(key);
    } catch (_e) {}
  },
};

if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  try {
    supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: ExpoSafeStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
    console.log('⚡ [SupabaseClient] Initialized successfully with project URL:', SUPABASE_URL);
  } catch (err) {
    console.log('⚠️ [SupabaseClient] Initialization error:', err);
    supabaseInstance = null;
  }
} else {
  console.log('ℹ️ [SupabaseClient] EXPO_PUBLIC_SUPABASE_URL or ANON_KEY not set. Operating in local mode.');
}

export const supabase = supabaseInstance;

export interface DeviceSubscriptionParams {
  fcmToken: string;
  productId: string;
  productTitle: string;
  pincode: string;
  storeId?: string;
  isTracked: boolean;
}

export const supabaseService = {
  isConfigured(): boolean {
    return Boolean(supabase);
  },

  /**
   * Register or update device record in Supabase
   */
  async registerDevice(fcmToken: string, soundId?: string): Promise<boolean> {
    if (!supabase || !fcmToken) return false;
    try {
      const payload: any = {
        fcm_token: fcmToken,
        platform: Platform.OS,
        last_active_at: new Date().toISOString(),
      };
      if (soundId) {
        payload.selected_sound_id = soundId;
      }
      const { error } = await supabase
        .from('devices')
        .upsert(payload, { onConflict: 'fcm_token' });

      if (error) {
        console.log('⚠️ [SupabaseService] registerDevice error:', error.message);
        return false;
      }
      return true;
    } catch (e) {
      console.log('⚠️ [SupabaseService] registerDevice exception:', e);
      return false;
    }
  },

  /**
   * Update device selected alarm ringtone sound
   */
  async updateDeviceSound(fcmToken: string, soundId: string): Promise<boolean> {
    if (!supabase || !fcmToken || !soundId) return false;
    try {
      const { error } = await supabase
        .from('devices')
        .upsert(
          {
            fcm_token: fcmToken,
            selected_sound_id: soundId,
            platform: Platform.OS,
            last_active_at: new Date().toISOString(),
          },
          { onConflict: 'fcm_token' }
        );

      if (error) {
        console.log('⚠️ [SupabaseService] updateDeviceSound error:', error.message);
        return false;
      }
      console.log(`🎵 [SupabaseService] Device alarm sound synced to cloud: ${soundId}`);
      return true;
    } catch (e) {
      console.log('⚠️ [SupabaseService] updateDeviceSound exception:', e);
      return false;
    }
  },

  /**
   * Sync a single tracked product subscription
   */
  async syncSubscription(params: DeviceSubscriptionParams): Promise<boolean> {
    if (!supabase || !params.fcmToken) return false;

    try {
      await this.registerDevice(params.fcmToken);

      if (params.isTracked) {
        const { error } = await supabase
          .from('tracked_subscriptions')
          .upsert(
            {
              fcm_token: params.fcmToken,
              product_id: params.productId,
              product_title: params.productTitle,
              pincode: params.pincode || 'all',
              store_id: params.storeId || '66505ff5145c16635e6cc74d',
              is_active: true,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'fcm_token,product_id,pincode' }
          );

        if (error) {
          console.log('⚠️ [SupabaseService] syncSubscription (insert) error:', error.message);
          return false;
        }
        console.log(`☁️ [SupabaseService] Tracked item synced to cloud: ${params.productTitle} (${params.pincode})`);
      } else {
        const { error } = await supabase
          .from('tracked_subscriptions')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .match({
            fcm_token: params.fcmToken,
            product_id: params.productId,
            pincode: params.pincode || 'all',
          });

        if (error) {
          console.log('⚠️ [SupabaseService] syncSubscription (deactivate) error:', error.message);
          return false;
        }
        console.log(`☁️ [SupabaseService] Tracked item deactivated in cloud: ${params.productTitle}`);
      }
      return true;
    } catch (e) {
      console.log('⚠️ [SupabaseService] syncSubscription exception:', e);
      return false;
    }
  },

  /**
   * Batch sync all tracked products for a device
   */
  async syncAllTrackedProducts(
    fcmToken: string,
    products: AmulProduct[],
    pincode: string,
    storeId: string
  ): Promise<boolean> {
    if (!supabase || !fcmToken || products.length === 0) return false;

    try {
      await this.registerDevice(fcmToken);

      const rows = products.map((p) => ({
        fcm_token: fcmToken,
        product_id: p.id,
        product_title: p.title,
        pincode: pincode || 'all',
        store_id: storeId || '66505ff5145c16635e6cc74d',
        is_active: true,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('tracked_subscriptions')
        .upsert(rows, { onConflict: 'fcm_token,product_id,pincode' });

      if (error) {
        console.log('⚠️ [SupabaseService] syncAllTrackedProducts error:', error.message);
        return false;
      }
      console.log(`☁️ [SupabaseService] Synced ${rows.length} tracked items to cloud`);
      return true;
    } catch (e) {
      console.log('⚠️ [SupabaseService] syncAllTrackedProducts exception:', e);
      return false;
    }
  },

  /**
   * Fetch recent restock history logged by cloud cron
   */
  async fetchDropHistory(limit = 20): Promise<any[]> {
    if (!supabase) return [];
    try {
      const { data, error } = await supabase
        .from('restock_events')
        .select('*')
        .order('detected_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.log('⚠️ [SupabaseService] fetchDropHistory error:', error.message);
        return [];
      }
      return data || [];
    } catch (e) {
      return [];
    }
  },
};
