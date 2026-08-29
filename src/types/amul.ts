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
  rawId?: string;
  sellerId?: string;
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
  isSavedAddress?: boolean;
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

export interface AmulSession {
  mobile: string;
  sessionCookie: string;
  jwtToken?: string;
  expiresAt: number;
  isLoggedIn: boolean;
  lastHeartbeat: number;
  userId?: string;
  userName?: string;
  defaultAddressId?: string;
}

export interface AmulUserProfile {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  defaultAddressId?: string;
  createdOn?: string;
  cartId?: string;
}

export interface AmulUserAddress {
  id: string;
  userId?: string;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  addressType: 'home' | 'office' | 'other';
  isDefault: boolean;
  createdOn?: string;
}

export interface AmulOrderItem {
  id: string;
  name: string;
  sku: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface AmulOrder {
  id: string;
  orderNumber: string;
  status: 'confirmed' | 'dispatched' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'pending';
  totalAmount: number;
  subtotal: number;
  shipping: number;
  items: AmulOrderItem[];
  itemsCount: number;
  shippingAddress?: Partial<AmulUserAddress>;
  createdAt: number | string;
  trackingNumber?: string;
  paymentMethod?: string;
}
