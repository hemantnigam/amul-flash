// @ts-nocheck
// =========================================================================
// Supabase Edge Function: amul-radar-cron (Runs in Deno Cloud Runtime)
// 24/7 Cloud Stock Poller with Upstash Redis Diffing & FCM Siren Dispatcher
// =========================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

interface TrackedRow {
  product_id: string;
  product_title: string;
  pincode: string;
  store_id: string;
  fcm_token?: string;
  phone_number?: string;
}

// 1. Upstash Redis Helper using Fetch REST API
class UpstashRedis {
  private url: string;
  private token: string;

  constructor(url: string, token: string) {
    this.url = (url || '').replace(/\/$/, '');
    this.token = token || '';
  }

  async get(key: string): Promise<string | null> {
    if (!this.url || !this.token) return null;
    try {
      const res = await fetch(`${this.url}/get/${encodeURIComponent(key)}`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });
      const data = await res.json();
      return data.result ?? null;
    } catch (_e) {
      return null;
    }
  }

  async set(key: string, value: string): Promise<boolean> {
    if (!this.url || !this.token) return false;
    try {
      const res = await fetch(`${this.url}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });
      const data = await res.json();
      return data.result === 'OK';
    } catch (_e) {
      return false;
    }
  }

  async setex(key: string, seconds: number, value: string): Promise<boolean> {
    if (!this.url || !this.token) return false;
    try {
      const res = await fetch(`${this.url}/setex/${encodeURIComponent(key)}/${seconds}/${encodeURIComponent(value)}`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });
      const data = await res.json();
      return data.result === 'OK';
    } catch (_e) {
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.url || !this.token) return false;
    try {
      const res = await fetch(`${this.url}/del/${encodeURIComponent(key)}`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });
      const data = await res.json();
      return data.result > 0;
    } catch (_e) {
      return false;
    }
  }
}

// 2. Pure Web Crypto SHA-256 Helper
async function sha256Hex(ascii: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(ascii);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// 3. Cookie Normalizer / Merger for StoreHippo Session
function mergeCookies(existingCookie: string = '', newCookie: string = ''): string {
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

// 4. Pure Deno Google OAuth2 Token Generator for Firebase HTTP v1 API
async function getGoogleAccessToken(serviceAccount: any): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claimSet = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  function b64Url(str: string) {
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

  const encodedHeader = b64Url(JSON.stringify(header));
  const encodedClaim = b64Url(JSON.stringify(claimSet));
  const unsignedToken = `${encodedHeader}.${encodedClaim}`;

  // Import RSA Private Key
  const pem = serviceAccount.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '');

  const binaryDer = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryDer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const jwt = `${unsignedToken}.${encodedSignature}`;

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenRes.json();
  return tokenData.access_token;
}

const SOUND_MAP: Record<string, string> = {
  digital_clock_beep: 'mixkit_alarm_digital_clock_beep_989',
  alert_alarm: 'mixkit_alert_alarm_1005',
  battleship_alarm: 'mixkit_battleship_alarm_1001',
  digital_buzzer: 'mixkit_digital_clock_digital_alarm_buzzer_992',
  spaceship_alarm: 'mixkit_spaceship_alarm_998',
  classic_winner: 'mixkit_classic_winner_alarm_1997',
  sound_alert_hall: 'mixkit_sound_alert_in_hall_1006',
  interface_hint: 'mixkit_interface_hint_notification_911',
};

// 5. Dispatch FCM Push Notification via HTTP v1
async function sendFcmNotification(
  serviceAccount: any,
  accessToken: string,
  target: { token?: string; topic?: string },
  payload: { title: string; body: string; productId: string; pincode: string; soundId?: string; unitsAdded?: number }
) {
  const projectId = serviceAccount.project_id || 'amul-flash';
  const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

  const soundId = payload.soundId || 'classic_winner';
  const soundResName = SOUND_MAP[soundId] || 'mixkit_classic_winner_alarm_1997';
  const nowTs = String(Date.now());
  const unitsText = payload.unitsAdded ? String(payload.unitsAdded) : '30';

  const message: any = {
    notification: {
      title: payload.title,
      body: payload.body,
    },
    data: {
      productId: String(payload.productId),
      pincode: String(payload.pincode),
      title: String(payload.title),
      body: String(payload.body),
      soundId: soundId,
      unitsAdded: unitsText,
      timestamp: nowTs,
    },
    android: {
      priority: 'high',
      notification: {
        channel_id: `amul_ch_${soundId}`,
        sound: soundResName,
        default_sound: false,
        notification_priority: 'PRIORITY_MAX',
        visibility: 'PUBLIC',
        tag: `amul_drop_${payload.productId}`,
      },
    },
    apns: {
      payload: {
        aps: {
          sound: `${soundResName}.wav`,
          badge: 1,
          'content-available': 1,
        },
      },
    },
  };

  if (target.token) {
    message.token = target.token;
  } else if (target.topic) {
    message.topic = target.topic;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  });

  return res.json();
}

// 6. Fetch Amul Live Inventory with StoreHippo Authentication Flow
async function fetchAmulStoreProducts(storeId: string, categories: string[] = ['protein', 'beverages', 'ghee']): Promise<{ products: any[]; error?: string }> {
  try {
    const now = Date.now();
    let sessionCookie = '';

    // Step A: Fetch info.js to get session tid & set-cookie
    const infoRes = await fetch(`https://shop.amul.com/user/info.js?_v=${now}`, {
      headers: {
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'referer': 'https://shop.amul.com/en/',
      },
    });

    const rawSetCookie = infoRes.headers.get('set-cookie');
    if (rawSetCookie) sessionCookie = mergeCookies(sessionCookie, rawSetCookie);

    const infoText = await infoRes.text();
    const tidMatch = infoText.match(/"tid":"([^"]+)"/);
    const sessionTid = tidMatch ? tidMatch[1] : 'u8kbrz20fsc';

    const amulStoreGlobalId = '62fa94df8c13af2e242eba16';
    const rand = Math.floor(Math.random() * 1000).toString();
    const rawTid = `${amulStoreGlobalId}:${now}:${rand}:${sessionTid}`;
    const sha = await sha256Hex(rawTid);
    const tid = `${now}:${rand}:${sha.toLowerCase()}`;

    // Step B: Bind Substore Preference
    const prefRes = await fetch('https://shop.amul.com/api/1/entity/ms.settings/_/setPreferences', {
      method: 'POST',
      headers: {
        'accept': 'application/json, text/plain, */*',
        'content-type': 'application/json',
        'frontend': '1',
        'referer': 'https://shop.amul.com/en/',
        'tid': tid,
        ...(sessionCookie ? { 'cookie': sessionCookie, 'Cookie': sessionCookie } : {}),
        'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      body: JSON.stringify({
        data: {
          substore_id: storeId,
          store: 'delhi',
        },
      }),
    });

    const prefSetCookie = prefRes.headers.get('set-cookie');
    if (prefSetCookie) sessionCookie = mergeCookies(sessionCookie, prefSetCookie);

    // Step C: Fetch products across target categories
    const allProducts: any[] = [];
    const seenIds = new Set<string>();

    for (const cat of categories) {
      try {
        const filterParam = `&filters[0][field]=categories&filters[0][value][0]=${cat}&filters[0][operator]=in&filters[0][original]=1`;
        const substoreParam = storeId ? `&substore=${storeId}` : '';
        const url = `https://shop.amul.com/api/1/entity/ms.products?fields[name]=1&fields[description]=1&fields[brand]=1&fields[categories]=1&fields[collections]=1&fields[alias]=1&fields[sku]=1&fields[price]=1&fields[compare_price]=1&fields[original_price]=1&fields[images]=1&fields[metafields]=1&fields[discounts]=1&fields[catalog_only]=1&fields[is_catalog]=1&fields[seller]=1&fields[available]=1&fields[inventory_quantity]=1&fields[net_quantity]=1&fields[num_reviews]=1&fields[avg_rating]=1&fields[inventory_low_stock_quantity]=1&fields[inventory_allow_out_of_stock]=1&fields[default_variant]=1&fields[variants]=1&fields[lp_seller_ids]=1${filterParam}&facets=true&facetgroup=default_category_facet&limit=100&total=1&start=0&v=6&device_type=other${substoreParam}`;

        const prodRes = await fetch(url, {
          headers: {
            'accept': 'application/json, text/plain, */*',
            'accept-language': 'en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7',
            'base_url': `https://shop.amul.com/en/browse/${cat}`,
            'frontend': '1',
            'referer': `https://shop.amul.com/en/browse/${cat}`,
            'tid': tid,
            ...(sessionCookie ? { 'cookie': sessionCookie, 'Cookie': sessionCookie } : {}),
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/151.0.0.0',
          },
        });

        if (!prodRes.ok) continue;
        const json = await prodRes.json();
        const items = json.data || [];

        for (const item of items) {
          const uid = item._id || item.sku || item.alias;
          if (uid && !seenIds.has(uid)) {
            seenIds.add(uid);
            allProducts.push(item);
          }
        }
      } catch (catErr) {
        console.error(`⚠️ Failed to fetch category ${cat}:`, catErr);
      }
    }

    return { products: allProducts };
  } catch (err: any) {
    return { products: [], error: err?.message || String(err) };
  }
}

// 7. Match Tracked Item against Live Catalog
function matchTrackedProduct(liveProducts: any[], trackedId: string, trackedTitle: string) {
  const normTracked = (trackedId || '').toLowerCase().trim();
  const normTitle = (trackedTitle || '').toLowerCase().trim();

  for (const p of liveProducts) {
    const pId = (p._id || '').toLowerCase();
    const pSku = (p.sku || '').toLowerCase();
    const pAlias = (p.alias || '').toLowerCase();
    const pName = (p.name || '').toLowerCase();

    // 1. Direct match on main product
    if (pId === normTracked || pSku === normTracked || pAlias === normTracked) {
      const isInStock = (p.available === 1 || p.available === true) && (p.inventory_quantity === undefined || p.inventory_quantity > 0);
      const qty = p.inventory_quantity !== undefined && p.inventory_quantity > 0 ? p.inventory_quantity : (isInStock ? 30 : 0);
      return { matched: true, item: p, isInStock, stockCount: qty, title: p.name || trackedTitle };
    }

    // 2. Check variants
    if (Array.isArray(p.variants)) {
      for (const v of p.variants) {
        const vId = (v._id || '').toLowerCase();
        const vSku = (v.sku || '').toLowerCase();
        if (vId === normTracked || vSku === normTracked) {
          const isInStock = (v.available === 1 || v.available === true) && (v.inventory_quantity === undefined || v.inventory_quantity > 0);
          const qty = v.inventory_quantity !== undefined && v.inventory_quantity > 0 ? v.inventory_quantity : (isInStock ? 30 : 0);
          return { matched: true, item: v, isInStock, stockCount: qty, title: v.name || p.name || trackedTitle };
        }
      }
    }

    // 3. Fallback match by Title keywords
    if (normTitle && normTitle.length > 5 && (pName === normTitle || pName.includes(normTitle) || normTitle.includes(pName))) {
      const isInStock = (p.available === 1 || p.available === true) && (p.inventory_quantity === undefined || p.inventory_quantity > 0);
      const qty = p.inventory_quantity !== undefined && p.inventory_quantity > 0 ? p.inventory_quantity : (isInStock ? 30 : 0);
      return { matched: true, item: p, isInStock, stockCount: qty, title: p.name || trackedTitle };
    }
  }

  return { matched: false, isInStock: false, stockCount: 0, title: trackedTitle };
}

// 8. Main Edge Function Request Handler
Deno.serve(async (req: Request) => {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const upstashUrl = Deno.env.get('UPSTASH_REDIS_REST_URL') || '';
    const upstashToken = Deno.env.get('UPSTASH_REDIS_REST_TOKEN') || '';
    const serviceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON') || '';

    if (!supabaseUrl || !supabaseKey) {
      return new Response(JSON.stringify({ error: 'Supabase credentials missing' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Parse optional test flags
    let forceAlert = false;
    let resetCache = false;
    if (req.method === 'POST') {
      try {
        const body = await req.json();
        forceAlert = Boolean(body?.force_alert);
        resetCache = Boolean(body?.reset_stock_cache);
      } catch (_e) {}
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const redis = new UpstashRedis(upstashUrl, upstashToken);

    let serviceAccount: any = null;
    let fcmAccessToken = '';
    if (serviceAccountJson) {
      try {
        serviceAccount = JSON.parse(serviceAccountJson);
        fcmAccessToken = await getGoogleAccessToken(serviceAccount);
      } catch (e) {
        console.error('⚠️ Failed to authenticate with Google Firebase:', e);
      }
    }

    // A. Query all distinct tracked products and pincodes from Supabase
    const { data: subs, error: subsErr } = await supabase
      .from('tracked_subscriptions')
      .select('product_id, product_title, pincode, store_id, fcm_token, phone_number')
      .eq('is_active', true);

    if (subsErr || !subs || subs.length === 0) {
      return new Response(JSON.stringify({ status: 'idle', message: 'No active tracked subscriptions' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Group subscriptions by store_id
    const storeMap: Record<string, TrackedRow[]> = {};
    for (const sub of subs as TrackedRow[]) {
      const sId = sub.store_id || '66505ff5145c16635e6cc74d';
      if (!storeMap[sId]) storeMap[sId] = [];
      storeMap[sId].push(sub);
    }

    const alertResults: any[] = [];
    const stockDiagnostics: any[] = [];

    // B. Scan each substore's inventory
    for (const [storeId, items] of Object.entries(storeMap)) {
      // Fetch live products for standard categories
      const { products: liveProducts, error: fetchErr } = await fetchAmulStoreProducts(
        storeId,
        ['protein', 'beverages', 'ghee', 'organic', 'chocolates', 'sweets', 'milk']
      );

      if (fetchErr || liveProducts.length === 0) {
        console.error(`⚠️ Failed to retrieve products for store ${storeId}:`, fetchErr);
        continue;
      }

      for (const tracked of items) {
        const match = matchTrackedProduct(liveProducts, tracked.product_id, tracked.product_title);
        const isInStock = match.isInStock;
        const stockCount = match.stockCount;

        const stockKey = `amul:stock:${tracked.pincode}:${tracked.product_id}`;
        const cooldownKey = `amul:cooldown:${tracked.product_id}:${tracked.pincode}`;

        if (resetCache) {
          await redis.del(stockKey);
          await redis.del(cooldownKey);
        }

        // Read previous stock state from Upstash Redis
        const prevStockVal = await redis.get(stockKey);
        const wasExplicitlyOutOfStock = prevStockVal === '0';
        const wasInStock = prevStockVal === '1';
        const isCooldown = Boolean(await redis.get(cooldownKey));

        stockDiagnostics.push({
          sku: tracked.product_id,
          title: tracked.product_title,
          pincode: tracked.pincode,
          matched: match.matched,
          liveInStock: isInStock,
          stockCount,
          wasInStock,
          wasExplicitlyOutOfStock,
          isCooldown,
        });

        // Strict True Restock condition:
        // 1. MUST be: Was previously Out-of-Stock (0), is NOW In-Stock (>0), and NOT in cooldown (300s)
        // 2. OR explicit test flag (forceAlert) is provided
        //
        // Note: If an item was ALREADY in stock and stock drops (e.g. 775 -> 766 -> 50),
        // wasExplicitlyOutOfStock is FALSE, so NO alert is sent.
        // If an item is first observed (prevStockVal === null), baseline is set without alerting.
        const isRealRestock = wasExplicitlyOutOfStock && isInStock && !isCooldown;
        const shouldAlert = isRealRestock || (forceAlert && isInStock);

        if (shouldAlert) {
          console.log(`🚨 RESTOCK DETECTED: [${tracked.product_id}] ${tracked.product_title} in Hub ${tracked.pincode} (Qty: ${stockCount})`);

          // 1. Set 5-minute alert cooldown in Redis (300 seconds)
          await redis.setex(cooldownKey, 300, '1');

          // 2. Query all active subscribers for this product & pincode
          const { data: subsList } = await supabase
            .from('tracked_subscriptions')
            .select('fcm_token, phone_number')
            .eq('product_id', tracked.product_id)
            .eq('pincode', tracked.pincode)
            .eq('is_active', true);

          const directTokens: string[] = [];
          const phoneNumbers: string[] = [];
          if (subsList) {
            for (const s of subsList) {
              if (s.fcm_token) directTokens.push(s.fcm_token);
              if (s.phone_number) phoneNumbers.push(s.phone_number);
            }
          }

          // Query active devices linked to these users
          let userDevices: any[] = [];
          if (phoneNumbers.length > 0) {
            const { data: devByPhone } = await supabase
              .from('devices')
              .select('fcm_token, selected_sound_id')
              .in('phone_number', phoneNumbers)
              .eq('is_active', true);
            if (devByPhone) userDevices = devByPhone;
          }

          if (directTokens.length > 0) {
            const { data: devByToken } = await supabase
              .from('devices')
              .select('fcm_token, selected_sound_id')
              .in('fcm_token', directTokens)
              .eq('is_active', true);
            if (devByToken) {
              for (const d of devByToken) {
                if (!userDevices.some((ud) => ud.fcm_token === d.fcm_token)) {
                  userDevices.push(d);
                }
              }
            }
          }

          // 3. Dispatch FCM Push Notifications (SINGLE DISPATCH per device to avoid duplicate tray notifications)
          const alertPayload = {
            title: `⚡ Restock Alert: ${tracked.product_title}`,
            body: `Stock is live for Hub ${tracked.pincode} (${stockCount} units available)! Tap to buy now.`,
            productId: tracked.product_id,
            pincode: tracked.pincode,
            unitsAdded: stockCount,
          };

          let pushSuccessCount = 0;
          if (serviceAccount && fcmAccessToken) {
            if (userDevices.length > 0) {
              // Send targeted alert to each registered device with its personalized sound
              for (const dev of userDevices) {
                if (dev.fcm_token) {
                  const devSound = dev.selected_sound_id || 'classic_winner';
                  const fcmRes = await sendFcmNotification(
                    serviceAccount,
                    fcmAccessToken,
                    { token: dev.fcm_token },
                    { ...alertPayload, soundId: devSound }
                  );
                  if (fcmRes?.name) pushSuccessCount++;
                }
              }
            } else {
              // Fallback to topic ONLY if no direct registered device tokens are found
              const cleanPin = tracked.pincode.replace(/[^a-zA-Z0-9_-]/g, '_');
              const cleanProd = tracked.product_id.replace(/[^a-zA-Z0-9_-]/g, '_');
              const topic = `restock_${cleanPin}_${cleanProd}`.slice(0, 80);
              await sendFcmNotification(serviceAccount, fcmAccessToken, { topic }, alertPayload);
              pushSuccessCount++;
            }
          }

          // 4. Log to Supabase restock_events table
          await supabase.from('restock_events').insert({
            product_id: tracked.product_id,
            product_title: tracked.product_title,
            pincode: tracked.pincode,
            store_id: storeId,
            stock_count: stockCount,
            units_added: stockCount,
          });

          alertResults.push({
            product: tracked.product_title,
            productId: tracked.product_id,
            pincode: tracked.pincode,
            stockCount,
            devicesAlerted: pushSuccessCount,
          });
        }

        // Update current stock state in Redis: 1 if in stock, 0 if out of stock
        await redis.set(stockKey, isInStock ? '1' : '0');
      }
    }

    return new Response(
      JSON.stringify({
        status: 'success',
        checkedStores: Object.keys(storeMap).length,
        totalTrackedItems: subs.length,
        restocksDetected: alertResults,
        diagnostics: stockDiagnostics,
        timestamp: new Date().toISOString(),
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (globalErr: any) {
    return new Response(JSON.stringify({ error: globalErr?.message || String(globalErr) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
