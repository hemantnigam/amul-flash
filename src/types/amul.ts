export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface NutritionInfo {
  proteinGrams: number;
  calories: number;
  carbsGrams: number;
  fatGrams: number;
  servingSize: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  packSize: string;
  packCount: number;
  price: number;
  originalPrice?: number;
  isInStock: boolean;
  stockCount: number;
  sku: string;
}

export type ProductCategory =
  | 'all'
  | 'protein'
  | 'organic'
  | 'kitchen-essentials'
  | 'tea-and-snacks'
  | 'chocolates'
  | 'peanut-butter'
  | 'beverages'
  | 'camel-milk'
  | 'sweets'
  | 'milk'
  | 'ghee'
  | 'cake'
  | 'infant-food'
  | 'fresh-cream'
  | 'panchamrit'
  | 'milk-powders'
  | string;

export interface AmulCategory {
  id: string;
  name: string;
  slug: string;
  icon?: string;
  itemCount?: number;
}

export interface AmulProduct {
  id: string;
  title: string;
  category: ProductCategory;
  flavor?: string;
  imageUrl: string;
  nutrition?: NutritionInfo;
  defaultPrice: number;
  variants: ProductVariant[];
  description: string;
  isPopular?: boolean;
  trackedPincodes?: string[];
  autoCartEnabled?: boolean;
}

export interface PincodeLocation {
  pincode: string;
  label: string; // e.g. "Home", "Office", "Gym"
  address: string;
  storeId: string;
  isDefault?: boolean;
  distanceKm?: number;
  serviceable: boolean;
}

export interface RestockEvent {
  id: string;
  productId: string;
  productName: string;
  pincode: string;
  timestamp: number;
  unitsAdded: number;
  survivalDurationSecs: number;
  variantName: string;
}

export interface ActivityLog {
  id: string;
  type: 'restock' | 'auto_cart' | 'heartbeat' | 'checkout' | 'alert' | 'fallback' | 'order' | 'info';
  title: string;
  description: string;
  timestamp: number;
  status: 'success' | 'warning' | 'error' | 'info';
  pincode?: string;
  productId?: string;
  metadata?: Record<string, any>;
}

export interface FallbackRule {
  primaryProductId: string;
  fallbackProductIds: string[];
  enabled: boolean;
  autoSwitchOnDepletion: boolean;
}

export interface BasketBundlerSettings {
  autoBundleForFreeShipping: boolean;
  minimumOrderValue: number;
  selectedAddonProductIds: string[];
}

export interface RefillItem {
  id: string;
  productId: string;
  productName: string;
  currentUnits: number;
  dailyIntake: number; // units per day
  warningDaysThreshold: number;
  batchNumber: string;
  expiryDate: string;
  lastRestockedDate: string;
}

export interface AmulSession {
  mobile: string;
  sessionCookie: string;
  jwtToken?: string;
  expiresAt: number;
  isLoggedIn: boolean;
  lastHeartbeat: number;
  defaultAddressId?: string;
}
