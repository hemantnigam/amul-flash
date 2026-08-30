import { Platform } from 'react-native';

let analyticsModule: any = null;

try {
  if (Platform.OS !== 'web') {
    // Dynamically require firebase analytics to avoid web compilation issues
    const analytics = require('@react-native-firebase/analytics');
    analyticsModule = analytics.default || analytics;
  }
} catch (e) {
  // Silent fallback when running on web or Expo Go dev client without native firebase build
  analyticsModule = null;
}

export const analyticsService = {
  /**
   * Log Screen Navigation Views
   */
  async logScreenView(screenName: string, screenClass?: string) {
    if (analyticsModule) {
      try {
        await analyticsModule().logScreenView({
          screen_name: screenName,
          screen_class: screenClass || screenName,
        });
      } catch (e) {}
    }
  },

  /**
   * Log User Product Searches
   */
  async logSearch(searchTerm: string, resultsCount?: number) {
    if (analyticsModule) {
      try {
        await analyticsModule().logEvent('search_product', {
          search_term: searchTerm,
          results_count: resultsCount || 0,
        });
      } catch (e) {}
    }
  },

  /**
   * Log Category Switch / Views
   */
  async logCategoryView(categorySlug: string) {
    if (analyticsModule) {
      try {
        await analyticsModule().logEvent('view_category', {
          category_name: categorySlug,
        });
      } catch (e) {}
    }
  },

  /**
   * Log Stock Radar Track/Untrack Toggle
   */
  async logTrackStock(productId: string, title: string, isTracked: boolean) {
    if (analyticsModule) {
      try {
        await analyticsModule().logEvent('toggle_stock_radar', {
          product_id: productId,
          product_title: title,
          is_tracked: isTracked,
        });
      } catch (e) {}
    }
  },

  /**
   * Log Live Restock Event Notification Triggered
   */
  async logRestockAlert(productId: string, title: string, pincode: string) {
    if (analyticsModule) {
      try {
        await analyticsModule().logEvent('restock_alert_triggered', {
          product_id: productId,
          product_title: title,
          pincode: pincode,
        });
      } catch (e) {}
    }
  },

  /**
   * Log User Login via OTP
   */
  async logUserLogin(userId: string, _mobile: string) {
    if (analyticsModule) {
      try {
        await analyticsModule().setUserId(userId);
        await analyticsModule().logLogin({
          method: 'amul_otp',
        });
      } catch (e) {}
    }
  },

  /**
   * Log Pincode / Store Location Change
   */
  async logPincodeChange(pincode: string, locationName: string) {
    if (analyticsModule) {
      try {
        await analyticsModule().logEvent('change_pincode_location', {
          pincode: pincode,
          location_name: locationName,
        });
      } catch (e) {}
    }
  },
};
