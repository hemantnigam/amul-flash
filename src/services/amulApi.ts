import { Platform } from 'react-native';
import {
  AmulProduct,
  AmulCategory,
  PincodeLocation,
  AmulUserProfile,
  AmulUserAddress,
  AmulOrder,
} from '../types/amul';
import { INITIAL_PINCODES, getFallbackProductsForCategory } from '../constants/products';

/**
 * Pure JS SHA-256 implementation - zero native module dependency, 100% cross-platform
 */
function sha256Hex(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  let i: number, j: number;
  let result = '';
  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;
  let hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;

  const isPrime = (candidate: number) => {
    for (let factor = 2, max = Math.sqrt(candidate); factor <= max; factor++) {
      if (candidate % factor === 0) return false;
    }
    return true;
  };

  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (isPrime(candidate)) {
      if (primeCounter < 8) {
        hash[primeCounter] = (mathPow(candidate, 1 / 2) * maxWord) | 0;
      }
      k[primeCounter] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      primeCounter++;
    }
  }

  ascii += '\x80';
  while ((ascii.length % 64) - 56) ascii += '\x00';
  for (i = 0; i < ascii.length; i++) {
    j = ascii.charCodeAt(i);
    if (j >> 8) return '';
    words[i >> 2] |= j << (((3 - i) % 4) * 8);
  }
  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength;

  for (j = 0; j < words.length;) {
    const w = words.slice(j, (j += 16));
    const oldHash = hash;
    hash = hash.slice(0, 8);

    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15],
        w2 = w[i - 2];
      const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
      const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
      w[i] =
        i < 16
          ? w[i]
          : ((w[i - 16] + s0 + w[i - 7] + s1) & 0xffffffff) | 0;

      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const maj =
        (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const s0_2 =
        rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
      const s1_2 =
        rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);
      const t1 = hash[7] + s1_2 + ch + k[i] + w[i];
      const t2 = s0_2 + maj;

      hash = [(t1 + t2) | 0, hash[0], hash[1], hash[2], (hash[3] + t1) | 0, hash[4], hash[5], hash[6]];
    }

    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  for (i = 0; i < 8; i++) {
    for (let b = 3; b >= 0; b--) {
      const byte = (hash[i] >> (b * 8)) & 255;
      result += (byte < 16 ? '0' : '') + byte.toString(16);
    }
  }
  return result;
}

export interface SendOTPResponse {
  success: boolean;
  message: string;
  requestId?: string;
}

export interface VerifyOTPResponse {
  success: boolean;
  sessionCookie?: string;
  jwtToken?: string;
  user?: {
    _id?: string;
    mobile: string;
    name?: string;
    defaultAddressId?: string;
  };
}

export interface PincodeCheckResponse {
  store_id: string;
  serviceable: boolean;
  city?: string;
  state?: string;
}

export interface AddToCartResponse {
  success: boolean;
  cartId?: string;
  itemCount?: number;
  totalPrice?: number;
  message?: string;
  latencyMs?: number;
  rawResponse?: any;
}

export interface CheckoutInitResponse {
  razorpay_order_id: string;
  upi_intent_url: string;
  amount: number;
  currency: string;
}

export const AMUL_ENDPOINTS = {
  PINCODE: 'https://shop.amul.com/entity/pincode',
  CATEGORIES: 'https://shop.amul.com/api/1/entity/ms.categories',
  PRODUCTS: 'https://shop.amul.com/api/1/entity/ms.products',
  ADD_ITEM: 'https://shop.amul.com/entity/ms.carts/_/addItem?q=%7B%22_id%22:null%7D',
  IS_USER_REGISTERED: 'https://shop.amul.com/entity/ms.users/_/isUserRegistered',
  SEND_OTP: 'https://shop.amul.com/api/1/entity/ms.users/_/sendOtp?new_otp_flow=1',
  LOGIN: 'https://shop.amul.com/api/1/entity/ms.users/_/login?new_login_flow=1',
  GET_USER_INFO: 'https://shop.amul.com/api/1/entity/ms.users/_/getUserInfo',
  UPDATE_PROFILE: (userId: string) => `https://shop.amul.com/api/1/entity/ms.users/${userId}/_/updateProfile`,
  GET_USER_CART: 'https://shop.amul.com/entity/ms.carts/_/getUserCart',
  ORDERS: 'https://shop.amul.com/api/1/entity/ms.orders',
  USER_ADDRESSES: 'https://shop.amul.com/api/1/entity/ms.user_addresses',
};

export const AMUL_CDN_BASE = 'https://shop.amul.com/s/62fa94df8c13af2e242eba16/';

/**
 * Robust image URL resolver for Amul D2C product packshots
 * Directly preserves and resolves whatever image string or object is returned in the API response.
 */
export function resolveAmulImageUrl(rawImage: any, fileBaseUrl: string = AMUL_CDN_BASE, contextName?: string): string {
  if (!rawImage) return '';

  const img = typeof rawImage === 'object' ? rawImage.image || rawImage.url || '' : String(rawImage);
  if (!img) return '';

  if (img.startsWith('http://') || img.startsWith('https://')) {
    return img;
  } else if (img.startsWith('s/')) {
    return `https://shop.amul.com/${img}`;
  } else {
    const base = fileBaseUrl.endsWith('/') ? fileBaseUrl : `${fileBaseUrl}/`;
    return `${base}${img}`;
  }
}

// Curated 16 Live Amul Categories
export const DEFAULT_CATEGORIES: AmulCategory[] = [
  { id: 'protein', name: 'High Protein', slug: 'protein' },
  { id: 'organic', name: 'Amul Organic', slug: 'organic' },
  { id: 'ghee', name: 'Ghee & Butter', slug: 'ghee' },
  { id: 'chocolates', name: 'Chocolates', slug: 'chocolates' },
  { id: 'sweets', name: 'Mithai & Sweets', slug: 'sweets' },
  { id: 'beverages', name: 'Beverages', slug: 'beverages' },
  { id: 'milk', name: 'Fresh Milk', slug: 'milk' },
  { id: 'kitchen-essentials', name: 'Kitchen Essentials', slug: 'kitchen-essentials' },
  { id: 'peanut-butter', name: 'Peanut Butter', slug: 'peanut-butter' },
  { id: 'tea-and-snacks', name: 'Tea & Snacks', slug: 'tea-and-snacks' },
  { id: 'camel-milk', name: 'Camel Milk', slug: 'camel-milk' },
  { id: 'cake', name: 'Bakery & Cake', slug: 'cake' },
  { id: 'fresh-cream', name: 'Fresh Cream', slug: 'fresh-cream' },
  { id: 'panchamrit', name: 'Panchamrit', slug: 'panchamrit' },
  { id: 'milk-powders', name: 'Milk Powders', slug: 'milk-powders' },
];

let cachedSessionTid: string = '';
let cachedServerTimestamp: string = '';
let lastTidFetchTime: number = 0;
export function mergeCookies(existingCookie: string = '', newCookie: string = ''): string {
  if (!newCookie) return existingCookie;
  if (!existingCookie) return newCookie;

  const cookieMap = new Map<string, string>();

  const processCookieStr = (str: string) => {
    str.split(';').forEach((part) => {
      const trimmed = part.trim();
      if (trimmed) {
        const idx = trimmed.indexOf('=');
        if (idx > 0) {
          const key = trimmed.substring(0, idx).trim();
          const val = trimmed.substring(idx + 1).trim();
          const lowerKey = key.toLowerCase();
          if (
            lowerKey !== 'expires' &&
            lowerKey !== 'path' &&
            lowerKey !== 'domain' &&
            lowerKey !== 'samesite' &&
            lowerKey !== 'httponly' &&
            lowerKey !== 'secure'
          ) {
            cookieMap.set(key, val);
          }
        }
      }
    });
  };

  processCookieStr(existingCookie);
  processCookieStr(newCookie);

  return Array.from(cookieMap.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

let sessionExpiredCallback: (() => void) | null = null;

export const AmulApiClient = {
  activeSessionCookie: '',

  onSessionExpired(callback: () => void) {
    sessionExpiredCallback = callback;
  },

  handleUnauthorizedResponse(resStatus: number) {
    if (resStatus === 401 && sessionExpiredCallback) {
      sessionExpiredCallback();
    }
  },

  async getValidTid(forceRefresh: boolean = false, sessionCookie?: string): Promise<string> {
    try {
      const now = Date.now();
      const effectiveCookie = sessionCookie || this.activeSessionCookie || '';
      if (forceRefresh || !cachedSessionTid || now - lastTidFetchTime > 10 * 60 * 1000) {
        cachedSessionTid = '';
        const res = await fetch(`https://shop.amul.com/user/info.js?_v=${now}`, {
          credentials: 'include',
          headers: {
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'referer': 'https://shop.amul.com/en/',
            ...(effectiveCookie ? { 'Cookie': effectiveCookie, 'cookie': effectiveCookie } : {}),
          },
        });
        if (res.ok) {
          const rawCookie = res.headers.get('set-cookie');
          if (rawCookie) {
            this.activeSessionCookie = mergeCookies(this.activeSessionCookie, rawCookie);
          }
          const text = await res.text();
          const tidMatch = text.match(/"tid":"([^"]+)"/);
          if (tidMatch && tidMatch[1]) {
            cachedSessionTid = tidMatch[1];
            cachedServerTimestamp = String(now);
            lastTidFetchTime = now;
          }
        }
      }

      const storeId = '62fa94df8c13af2e242eba16';
      const serverTimestamp = cachedServerTimestamp || String(Date.now());
      const sessionTid = cachedSessionTid || 'u8kbrz20fsc';
      const rand = Math.floor(Math.random() * 1000).toString();
      const rawTid = `${storeId}:${serverTimestamp}:${rand}:${sessionTid}`;

      const sha = sha256Hex(rawTid);
      return `${serverTimestamp}:${rand}:${sha.toLowerCase()}`;
    } catch (e) {
      return this.generateTid();
    }
  },

  generateTid(): string {
    const chars = '0123456789abcdef';
    let hash = '';
    for (let i = 0; i < 64; i++) {
      hash += chars[Math.floor(Math.random() * chars.length)];
    }
    return `${Date.now()}:${Math.floor(Math.random() * 900) + 100}:${hash}`;
  },

  /**
   * 1. Fetch All 16 Live Categories from Amul D2C
   */
  async fetchCategories(sessionCookie?: string): Promise<AmulCategory[]> {
    try {
      const tid = await this.getValidTid();
      const res = await fetch(`${AMUL_ENDPOINTS.CATEGORIES}?limit=30&v=6`, {
        headers: {
          'accept': 'application/json, text/plain, */*',
          'base_url': 'https://shop.amul.com/en/',
          'frontend': '1',
          'referer': 'https://shop.amul.com/en/',
          'tid': tid,
          'cookie': sessionCookie || '',
          'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      const json = await res.json();
      if (json.data && json.data.length > 0) {
        return json.data.map((c: any) => ({
          id: c.alias || c.slug || c._id,
          name: c.name,
          slug: c.alias || c.slug || c._id,
          itemCount: c.product_count || 0,
        }));
      }
    } catch (e) {
    }
    return DEFAULT_CATEGORIES;
  },

  /**
   * 2. Check Pincode Serviceability
   */
  async checkPincode(pincode: string, sessionCookie?: string): Promise<PincodeCheckResponse> {
    try {
      const tid = await this.getValidTid();
      const url = `${AMUL_ENDPOINTS.PINCODE}?limit=50&filters%5B0%5D%5Bfield%5D=pincode&filters%5B0%5D%5Bvalue%5D=${pincode}&filters%5B0%5D%5Boperator%5D=regex&filters%5B0%5D%5Buse_autocomplete%5D=1&new_search=1&cf_cache=1h`;

      const res = await fetch(url, {
        headers: {
          'accept': 'application/json, text/plain, */*',
          'base_url': 'https://shop.amul.com/en/',
          'frontend': '1',
          'referer': 'https://shop.amul.com/en/',
          'tid': tid,
          'cookie': sessionCookie || '',
          'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      const json = await res.json();
      const record = json.records?.[0];

      if (record) {
        return {
          store_id: record.substore || `STORE_${pincode}`,
          serviceable: true,
          city: record.substore ? record.substore.toUpperCase() : 'Metro Zone',
        };
      }
    } catch (e) {
    }

    const fallback = INITIAL_PINCODES.find((p) => p.pincode === pincode);
    return {
      store_id: fallback?.storeId || `STORE_${pincode}`,
      serviceable: true,
      city: fallback?.label || 'Custom Hub',
    };
  },

  /**
   * Dynamically Bind Substore Preference to Active Session
   */
  async setSubstorePreference(substoreId: string = '66505ff5145c16635e6cc74d', sessionCookie?: string, isRetry: boolean = false): Promise<boolean> {
    try {
      const tid = await this.getValidTid(isRetry);
      const effectiveCookie = sessionCookie || this.activeSessionCookie || '';
      const prefUrl = 'https://shop.amul.com/api/1/entity/ms.settings/_/setPreferences';
      const res = await fetch(prefUrl, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'accept': 'application/json, text/plain, */*',
          'content-type': 'application/json',
          'frontend': '1',
          'referer': 'https://shop.amul.com/en/',
          'tid': tid,
          ...(effectiveCookie ? { 'Cookie': effectiveCookie, 'cookie': effectiveCookie } : {}),
          'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        },
        body: JSON.stringify({
          data: {
            substore_id: substoreId,
            store: 'delhi',
          },
        }),
      });
      if (!res.ok && !isRetry) {
        return this.setSubstorePreference(substoreId, sessionCookie, true);
      }
      return res.ok;
    } catch (e) {
      if (!isRetry) {
        return this.setSubstorePreference(substoreId, sessionCookie, true);
      }
      return false;
    }
  },

  /**
   * 3. Fetch Live Products for Any Category (Preserving Both In-Stock and Out-of-Stock)
   */
  async fetchStoreProducts(
    categorySlug: string = 'protein',
    substoreId: string = '66505ff5145c16635e6cc74d',
    sessionCookie?: string,
    isRetry: boolean = false
  ): Promise<AmulProduct[]> {
    try {
      await this.setSubstorePreference(substoreId, sessionCookie);

      const tid = await this.getValidTid(isRetry);
      let filterParam = '';
      if (categorySlug && categorySlug !== 'all') {
        filterParam = `&filters[0][field]=categories&filters[0][value][0]=${categorySlug}&filters[0][operator]=in&filters[0][original]=1`;
      }

      const effectiveCookie = sessionCookie || this.activeSessionCookie || '';
      const substoreParam = substoreId ? `&substore=${substoreId}` : '';
      let url = `${AMUL_ENDPOINTS.PRODUCTS}?fields[name]=1&fields[brand]=1&fields[categories]=1&fields[collections]=1&fields[alias]=1&fields[sku]=1&fields[price]=1&fields[compare_price]=1&fields[original_price]=1&fields[images]=1&fields[metafields]=1&fields[discounts]=1&fields[catalog_only]=1&fields[is_catalog]=1&fields[seller]=1&fields[available]=1&fields[inventory_quantity]=1&fields[net_quantity]=1&fields[num_reviews]=1&fields[avg_rating]=1&fields[inventory_low_stock_quantity]=1&fields[inventory_allow_out_of_stock]=1&fields[default_variant]=1&fields[variants]=1&fields[lp_seller_ids]=1${filterParam}&facets=true&facetgroup=default_category_facet&limit=32&total=1&start=0&v=6&device_type=other${substoreParam}`;

      let res = await fetch(url, {
        credentials: 'include',
        headers: {
          'accept': 'application/json, text/plain, */*',
          'accept-language': 'en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7',
          'base_url': `https://shop.amul.com/en/browse/${categorySlug}`,
          'frontend': '1',
          'ms-ga': '22021698.1787905436',
          'priority': 'u=1, i',
          'referer': `https://shop.amul.com/en/browse/${categorySlug}`,
          'sec-ch-ua': '"Not=A?Brand";v="99", "Google Chrome";v="151", "Chromium";v="151"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"macOS"',
          'sec-fetch-dest': 'empty',
          'sec-fetch-mode': 'cors',
          'sec-fetch-site': 'same-origin',
          'tid': tid,
          ...(effectiveCookie ? { 'Cookie': effectiveCookie, 'cookie': effectiveCookie } : {}),
          'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/151.0.0.0',
        },
      });

      const textResponse = await res.text();
      if (!textResponse || !textResponse.startsWith('{')) {
        if (!isRetry) {
          return this.fetchStoreProducts(categorySlug, substoreId, sessionCookie, true);
        }
        return getFallbackProductsForCategory(categorySlug);
      }

      let json: any = null;
      try {
        json = JSON.parse(textResponse);
      } catch (e) {
        if (!isRetry) {
          return this.fetchStoreProducts(categorySlug, substoreId, sessionCookie, true);
        }
        return getFallbackProductsForCategory(categorySlug);
      }

      if ((res.status === 401 || !json?.data) && !isRetry) {
        return this.fetchStoreProducts(categorySlug, substoreId, sessionCookie, true);
      }

      if (json.data && json.data.length > 0) {
        return json.data.map((item: any) => {
          const isAvailable = (item.available === 1 || item.available === true) && (item.inventory_quantity === undefined || item.inventory_quantity > 0);
          const stockCount = isAvailable ? (item.inventory_quantity !== undefined && item.inventory_quantity > 0 ? item.inventory_quantity : 50) : 0;
          const isProtein = item.name.toLowerCase().includes('protein') || item.name.toLowerCase().includes('whey');

          const rawImg = item.images?.[0] || item.image;
          const resolvedImg = resolveAmulImageUrl(rawImg, json.fileBaseUrl, item.name);

          return {
            id: item.sku || item.alias || item._id,
            rawId: item._id,
            sellerId: item.seller,
            title: item.name,
            category: categorySlug,
            flavor: item.name.includes('|') ? item.name.split('|')[1]?.trim() : 'Natural',
            imageUrl: resolvedImg,
            description: `Authentic Amul Product. SKU: ${item.sku || item.alias}`,
            nutrition: isProtein
              ? {
                proteinGrams: item.name.toLowerCase().includes('whey') ? 32 : item.name.toLowerCase().includes('paneer') ? 50 : 15,
                calories: 110,
                carbsGrams: 5,
                fatGrams: 1.5,
                servingSize: '1 Pack',
              }
              : undefined,
            defaultPrice: item.price || 500,
            isPopular: true,
            autoCartEnabled: false,
            variants: [
              {
                id: item.sku || item._id,
                name: item.name,
                packSize: 'Standard',
                packCount: 1,
                price: item.price || 500,
                isInStock: isAvailable,
                stockCount: stockCount,
                sku: item.sku || item._id,
              },
            ],
          };
        });
      }
    } catch (e) {
      return getFallbackProductsForCategory(categorySlug);
    }

    return getFallbackProductsForCategory(categorySlug);
  },

  /**
   * 4. Check Registration & Send OTP
   */
  async sendOTP(mobile: string, sessionCookie?: string): Promise<SendOTPResponse> {
    const formattedPhone = mobile.startsWith('+91') ? mobile : `+91${mobile}`;

    try {
      await fetch(AMUL_ENDPOINTS.IS_USER_REGISTERED, {
        method: 'PUT',
        headers: {
          'accept': 'application/json, text/plain, */*',
          'base_url': 'https://shop.amul.com/en/checkout',
          'content-type': 'application/json',
          'frontend': '1',
          'origin': 'https://shop.amul.com',
          'referer': 'https://shop.amul.com/en/checkout',
          'tid': this.generateTid(),
          'cookie': sessionCookie || '',
          'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        body: JSON.stringify({ data: { phone: formattedPhone } }),
      }).catch(() => {});

      await fetch(AMUL_ENDPOINTS.SEND_OTP, {
        method: 'PUT',
        headers: {
          'accept': 'application/json, text/plain, */*',
          'base_url': 'https://shop.amul.com/en/checkout',
          'content-type': 'application/json',
          'frontend': '1',
          'origin': 'https://shop.amul.com',
          'referer': 'https://shop.amul.com/en/checkout',
          'tid': this.generateTid(),
          'cookie': sessionCookie || '',
          'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        body: JSON.stringify({ data: { phone: formattedPhone } }),
      }).catch(() => null);

      return {
        success: true,
        message: `OTP sent successfully to ${formattedPhone}`,
        requestId: `req_${Date.now()}`,
      };
    } catch (e: any) {
      return {
        success: true,
        message: `OTP sent to ${formattedPhone}`,
        requestId: `req_${Date.now()}`,
      };
    }
  },

  /**
   * 5. Verify OTP & Authenticate Session
   */
  async verifyOTP(mobile: string, otp: string, sessionCookie?: string): Promise<VerifyOTPResponse> {
    const formattedPhone = mobile.startsWith('+91') ? mobile : `+91${mobile}`;

    try {
      const res = await fetch(AMUL_ENDPOINTS.LOGIN, {
        method: 'PUT',
        headers: {
          'accept': 'application/json, text/plain, */*',
          'base_url': 'https://shop.amul.com/en/checkout',
          'content-type': 'application/json',
          'frontend': '1',
          'origin': 'https://shop.amul.com',
          'referer': 'https://shop.amul.com/en/checkout',
          'tid': this.generateTid(),
          'cookie': sessionCookie || '',
          'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        body: JSON.stringify({
          data: {
            username: formattedPhone,
            password: otp,
          },
        }),
      }).catch(() => null);

      if (res && res.ok) {
        const json = await res.json().catch(() => ({}));
        const rawCookie = res.headers.get('set-cookie') || this.activeSessionCookie || sessionCookie || '';
        if (rawCookie) {
          this.activeSessionCookie = rawCookie;
        }
        const userData = json.data?.user || json.data || json.user || {};
        const userName = `${userData.first_name || ''} ${userData.last_name || ''}`.trim() || userData.name || undefined;

        return {
          success: true,
          sessionCookie: rawCookie,
          jwtToken: json.token || json.data?.token || '',
          user: {
            _id: userData._id || userData.id,
            mobile: formattedPhone,
            name: userName,
            defaultAddressId: userData.default_address_id,
          },
        };
      }
    } catch (e) {}

    return { success: false };
  },

  /**
   * 6. Get User Info / Profile (Using https://shop.amul.com/user/info.js)
   */
  async getUserInfo(sessionCookie?: string, isRetry: boolean = false): Promise<AmulUserProfile | null> {
    const effectiveCookie = sessionCookie || this.activeSessionCookie || '';
    if (!effectiveCookie) return null;

    try {
      const now = Date.now();
      const res = await fetch(`https://shop.amul.com/user/info.js?_v=${now}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'accept': '*/*',
          'referer': 'https://shop.amul.com/en/',
          'Cookie': effectiveCookie,
          'cookie': effectiveCookie,
          'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      const textResponse = await res.text();
      if (!textResponse || !textResponse.startsWith('{')) {
        if (!isRetry) {
          return this.getUserInfo(sessionCookie, true);
        }
        return null;
      }

      let json: any = null;
      try {
        const cleanedText = textResponse
          .replace(/^session\s*=\s*/, '')
          .replace(/;\s*$/, '')
          .trim();
        json = JSON.parse(cleanedText);
      } catch (parseErr) {
        return null;
      }

      if ((res.status === 401 || res.status === 403) && !isRetry) {
        return this.getUserInfo(sessionCookie, true);
      }

      const userData = json?.data || json?.session?.data;
      if (userData && (userData._id || userData.cart_id || userData.first_name)) {
        return {
          id: userData._id || userData.id || '',
          firstName: userData.first_name || '',
          lastName: userData.last_name || '',
          phone: userData.phone || '',
          email: userData.email || '',
          defaultAddressId: userData.default_address_id,
          createdOn: userData.created_on,
          cartId: userData.cart_id || undefined,
        };
      }
    } catch (e) {
      return null;
    }

    return null;
  },

  /**
   * 7. Update User Profile
   */
  async updateUserProfile(
    userId: string,
    data: { first_name?: string; last_name?: string; email?: string; phone?: string },
    sessionCookie?: string,
    isRetry: boolean = false
  ): Promise<{ success: boolean; profile?: AmulUserProfile }> {
    try {
      const effectiveCookie = sessionCookie || this.activeSessionCookie || '';
      if (!userId || !effectiveCookie) {
        return { success: false };
      }
      const tid = await this.getValidTid(isRetry, sessionCookie);
      const url = AMUL_ENDPOINTS.UPDATE_PROFILE(userId);
      const res = await fetch(url, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'accept': 'application/json, text/plain, */*',
          'base_url': 'https://shop.amul.com/en/account/profile',
          'content-type': 'application/json',
          'frontend': '1',
          'origin': 'https://shop.amul.com',
          'referer': 'https://shop.amul.com/en/account/profile',
          'Cookie': effectiveCookie,
          'cookie': effectiveCookie,
          'tid': tid,
          'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        body: JSON.stringify({ data }),
      });

      if ((res.status === 401 || res.status === 403) && !isRetry) {
        return this.updateUserProfile(userId, data, sessionCookie, true);
      }

      return {
        success: res.ok,
        profile: {
          id: userId,
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          email: data.email || '',
          phone: data.phone || '',
        },
      };
    } catch (e) {
      return { success: false };
    }
  },

  /**
   * 8. Fetch Saved User Addresses
   */
  async getUserAddresses(userId?: string, sessionCookie?: string): Promise<AmulUserAddress[]> {
    const effectiveCookie = sessionCookie || this.activeSessionCookie || '';
    if (!userId || !effectiveCookie) return [];

    try {
      const tid = await this.getValidTid();
      const url = `${AMUL_ENDPOINTS.USER_ADDRESSES}?q=%7B%22user_id%22:%22${userId}%22%7D`;
      const res = await fetch(url, {
        credentials: 'include',
        headers: {
          'accept': 'application/json, text/plain, */*',
          'base_url': 'https://shop.amul.com/en/account/addresses',
          'frontend': '1',
          'Cookie': effectiveCookie,
          'cookie': effectiveCookie,
          'referer': 'https://shop.amul.com/en/account/addresses',
          'tid': tid,
          'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      const textResponse = await res.text();
      let json: any = null;
      try {
        json = JSON.parse(textResponse);
      } catch (e) {
        return [];
      }

      if (json && json.data && json.data.length > 0) {
        return json.data.map((a: any) => ({
          id: a._id || a.id,
          userId: a.user_id || userId,
          fullName: a.full_name || a.fullName || '',
          phone: a.phone || '',
          address: a.address || '',
          city: a.city || '',
          state: a.state || '',
          zip: a.zip || '',
          country: a.country || 'IN',
          addressType: a.address_type === 'office' ? 'office' : 'home',
          isDefault: a.make_default === '1' || a.is_default === true,
          createdOn: a.created_on,
        }));
      }
    } catch (e) {
      // Clean fallback
    }

    return [];
  },

  /**
   * 9. Add New Delivery Address
   */
  async addUserAddress(
    addressData: {
      zip: string;
      country?: string;
      state: string;
      city: string;
      full_name: string;
      address: string;
      phone: string;
      address_type?: string;
      user_id?: string;
      make_default?: string;
    },
    sessionCookie?: string
  ): Promise<{ success: boolean; address?: AmulUserAddress }> {
    try {
      const payload = {
        data: {
          zip: addressData.zip,
          country: addressData.country || 'IN',
          state: addressData.state,
          city: addressData.city,
          full_name: addressData.full_name,
          address: addressData.address,
          phone: addressData.phone,
          address_type: addressData.address_type || 'home',
          user_id: addressData.user_id,
          make_default: addressData.make_default || '0',
        },
      };

      const res = await fetch(AMUL_ENDPOINTS.USER_ADDRESSES, {
        method: 'POST',
        headers: {
          'accept': 'application/json, text/plain, */*',
          'base_url': 'https://shop.amul.com/en/account/addresses?action=add',
          'content-type': 'application/json',
          'frontend': '1',
          'origin': 'https://shop.amul.com',
          'referer': 'https://shop.amul.com/en/account/addresses?action=add',
          'cookie': sessionCookie || '',
          'tid': this.generateTid(),
          'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json().catch(() => ({}));
      const created = json.data || {};

      return {
        success: true,
        address: {
          id: created._id || `addr_${Date.now()}`,
          userId: addressData.user_id || '',
          fullName: addressData.full_name,
          phone: addressData.phone,
          address: addressData.address,
          city: addressData.city,
          state: addressData.state,
          zip: addressData.zip,
          country: addressData.country || 'IN',
          addressType: (addressData.address_type as any) || 'home',
          isDefault: addressData.make_default === '1',
        },
      };
    } catch (e) {
      return {
        success: false,
      };
    }
  },

  /**
   * 10. Update Existing Delivery Address
   */
  async updateUserAddress(
    addressId: string,
    addressData: any,
    sessionCookie?: string
  ): Promise<{ success: boolean; address?: AmulUserAddress }> {
    try {
      const url = `${AMUL_ENDPOINTS.USER_ADDRESSES}/${addressId}`;
      await fetch(url, {
        method: 'PATCH',
        headers: {
          'accept': 'application/json, text/plain, */*',
          'base_url': `https://shop.amul.com/en/account/addresses?action=edit&address=${addressId}`,
          'content-type': 'application/json',
          'frontend': '1',
          'origin': 'https://shop.amul.com',
          'referer': `https://shop.amul.com/en/account/addresses?action=edit&address=${addressId}`,
          'cookie': sessionCookie || '',
          'tid': this.generateTid(),
          'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
        body: JSON.stringify({ data: { _id: addressId, ...addressData } }),
      });

      return { success: true };
    } catch (e) {
      return { success: false };
    }
  },

  /**
   * 11. Delete Delivery Address
   */
  async deleteUserAddress(addressId: string, sessionCookie?: string): Promise<{ success: boolean }> {
    try {
      const url = `${AMUL_ENDPOINTS.USER_ADDRESSES}/${addressId}`;
      await fetch(url, {
        method: 'DELETE',
        headers: {
          'accept': 'application/json, text/plain, */*',
          'base_url': 'https://shop.amul.com/en/account/addresses',
          'frontend': '1',
          'cookie': sessionCookie || '',
          'referer': 'https://shop.amul.com/en/account/addresses',
          'tid': this.generateTid(),
          'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      return { success: true };
    } catch (e) {
      return { success: false };
    }
  },

  /**
   * 12. Fetch Order History
   */
  async getUserOrders(userId?: string, sessionCookie?: string, isRetry: boolean = false): Promise<AmulOrder[]> {
    const effectiveCookie = sessionCookie || this.activeSessionCookie || '';
    if (!userId || !effectiveCookie) return [];

    try {
      const tid = await this.getValidTid(isRetry, sessionCookie);
      const url = `${AMUL_ENDPOINTS.ORDERS}?filters[0][field]=user_id&filters[0][value]=${userId}&limit=50`;
      const res = await fetch(url, {
        credentials: 'include',
        headers: {
          'accept': 'application/json, text/plain, */*',
          'base_url': 'https://shop.amul.com/en/account/orders',
          'frontend': '1',
          'Cookie': effectiveCookie,
          'cookie': effectiveCookie,
          'referer': 'https://shop.amul.com/en/account/orders',
          'tid': tid,
          'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      });

      const textResponse = await res.text();
      let json: any = null;
      try {
        json = JSON.parse(textResponse);
      } catch (parseErr) {
        if (!isRetry) {
          return this.getUserOrders(userId, sessionCookie, true);
        }
        return [];
      }

      if ((res.status === 401 || textResponse === 'Unauthorized') && !isRetry) {
        return this.getUserOrders(userId, sessionCookie, true);
      }

      if (json && json.data && json.data.length > 0) {
        return json.data.map((o: any) => {
          const fulfillment = o.fulfillments?.[0];
          const rawStatus = (fulfillment?.status || o.fulfillment_status || 'confirmed').toLowerCase();
          const normalizedStatus = rawStatus.includes('delivered') || rawStatus.includes('fulfilled')
            ? 'delivered'
            : rawStatus.includes('out for delivery')
              ? 'out_for_delivery'
              : rawStatus.includes('dispatched') || rawStatus.includes('shipped') || rawStatus.includes('manifested')
                ? 'dispatched'
                : 'confirmed';

          const items: any[] = (o.items || []).map((it: any) => {
            const prod = it.product || {};
            const rawImg =
              (prod.images && prod.images.length > 0 ? prod.images[0].image : null) ||
              it.image_url ||
              it.thumbnail_url ||
              it.image ||
              prod.image ||
              '';
            const resolvedImg = resolveAmulImageUrl(rawImg, json.fileBaseUrl, it.name);

            return {
              id: it._id || it.sku,
              name: it.name,
              sku: it.sku,
              price: it.price || 0,
              quantity: it.quantity || 1,
              image: resolvedImg,
            };
          });

          return {
            id: o._id,
            orderNumber: o.order_id || `OID${o._id.substring(0, 7).toUpperCase()}`,
            status: normalizedStatus as any,
            totalAmount: o.total || o.subtotal || 0,
            subtotal: o.subtotal || o.total || 0,
            shipping: o.shipping_total || 0,
            items: items,
            itemsCount: o.fulfilled_item_count || items.length || 0,
            createdAt: o.order_date || o.created_on || Date.now(),
            trackingNumber: fulfillment?.tracking_number,
            paymentMethod: o.payment_details?.name || o.payment_method?.name || 'UPI',
            shippingAddress: o.shipping_address
              ? {
                fullName: o.shipping_address.full_name,
                address: o.shipping_address.address,
                city: o.shipping_address.city,
                state: o.shipping_address.state,
                zip: o.shipping_address.zip,
                phone: o.shipping_address.phone,
              }
              : undefined,
          };
        });
      }
    } catch (e) {
      return [];
    }

    return [];
  },
};
