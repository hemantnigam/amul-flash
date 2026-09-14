// @ts-nocheck
// =========================================================================
// Supabase Edge Function: amul-radar-cron (Runs in Deno Cloud Runtime)
// 24/7 Cloud Stock Poller with Upstash Redis Diffing & FCM Alert Dispatcher
// =========================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';

interface TrackedRow {
  product_id: string;
  product_title: string;
  pincode: string;
  store_id: string;
}

// 1. Upstash Redis Helper using Fetch REST API
class UpstashRedis {
  private url: string;
  private token: string;

  constructor(url: string, token: string) {
    this.url = url.replace(/\/$/, '');
    this.token = token;
  }

  async get(key: string): Promise<string | null> {
    if (!this.url || !this.token) return null;
    try {
      const res = await fetch(`${this.url}/get/${encodeURIComponent(key)}`, {
        headers: { Authorization: `Bearer ${this.token}` },
      });
      const data = await res.json();
      return data.result;
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
}

// 2. Pure Deno Google OAuth2 Token Generator for Firebase HTTP v1 API
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

// 3. Dispatch FCM Push Notification via HTTP v1
async function sendFcmNotification(
  serviceAccount: any,
  accessToken: string,
  target: { token?: string; topic?: string },
  payload: { title: string; body: string; productId: string; pincode: string; soundId?: string }
) {
  const projectId = serviceAccount.project_id || 'amul-flash';
  const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

  const soundId = payload.soundId || 'digital_clock_beep';
  const soundResName = SOUND_MAP[soundId] || 'mixkit_alarm_digital_clock_beep_989';
  const nowTs = String(Date.now());

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
      unitsAdded: '30',
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
        tag: `amul_drop_${nowTs}`,
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

// 4. Main Request Handler (Invoked by Upstash QStash or Manual HTTP Call)
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

    const supabase = createClient(supabaseUrl, supabaseKey);
    const redis = new UpstashRedis(upstashUrl, upstashToken);

    let serviceAccount: any = null;
    let fcmAccessToken = '';
    if (serviceAccountJson) {
      try {
        serviceAccount = JSON.parse(serviceAccountJson);
        fcmAccessToken = await getGoogleAccessToken(serviceAccount);
      } catch (e) {
        console.error('⚠️ Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON:', e);
      }
    }

    // A. Query all distinct tracked products and pincodes
    const { data: subs, error: subsErr } = await supabase
      .from('tracked_subscriptions')
      .select('product_id, product_title, pincode, store_id')
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

    // B. For each store, fetch live product stock
    for (const [storeId, items] of Object.entries(storeMap)) {
      try {
        const amulUrl = `https://shop.amul.com/api/1/entity/ms.products?limit=50&substore=${storeId}&v=6`;
        const res = await fetch(amulUrl, {
          headers: {
            'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
            'base_url': 'https://shop.amul.com/en/',
            'referer': 'https://shop.amul.com/en/',
          },
        });

        if (!res.ok) continue;
        const json = await res.json();
        const liveProducts = json.data || [];

        for (const tracked of items) {
          const matched = liveProducts.find((p: any) => p._id === tracked.product_id || p.id === tracked.product_id);
          if (!matched) continue;

          const isInStock = Boolean(matched.inventory_quantity > 0 || matched.available === true);
          const stockCount = matched.inventory_quantity || (isInStock ? 20 : 0);

          const stockKey = `amul:stock:${tracked.pincode}:${tracked.product_id}`;
          const cooldownKey = `amul:cooldown:${tracked.product_id}:${tracked.pincode}`;

          // Read previous stock state from Upstash Redis
          const prevStockVal = await redis.get(stockKey);
          const wasInStock = prevStockVal === '1' || prevStockVal === 'true';
          const isCooldown = Boolean(await redis.get(cooldownKey));

          // Detect transition: Previously Out of Stock (0) -> Now In Stock (>0)
          if (!wasInStock && isInStock && !isCooldown) {
            console.log(`🚨 Restock detected for ${tracked.product_title} in Hub ${tracked.pincode}!`);

            // 1. Set 3-minute alert cooldown in Redis
            await redis.setex(cooldownKey, 180, '1');

            // 2. Fetch all subscribed users and devices for this product & pincode
            const { data: subsList } = await supabase
              .from('tracked_subscriptions')
              .select('fcm_token, phone_number')
              .eq('product_id', tracked.product_id)
              .eq('pincode', tracked.pincode)
              .eq('is_active', true);

            // Collect direct tokens and phone numbers
            const directTokens: string[] = [];
            const phoneNumbers: string[] = [];
            if (subsList) {
              for (const s of subsList) {
                if (s.fcm_token) directTokens.push(s.fcm_token);
                if (s.phone_number) phoneNumbers.push(s.phone_number);
              }
            }

            // Query all active devices linked to these phone numbers
            let userDevices: any[] = [];
            if (phoneNumbers.length > 0) {
              const { data: devByPhone } = await supabase
                .from('devices')
                .select('fcm_token, selected_sound_id')
                .in('phone_number', phoneNumbers)
                .eq('is_active', true);
              if (devByPhone) userDevices = devByPhone;
            }

            // Also include direct tokens if any
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

            // 3. Dispatch FCM Push Notifications
            const alertPayload = {
              title: `⚡ Restock Alert: ${tracked.product_title}`,
              body: `Stock is live for Hub ${tracked.pincode}! Tap to buy now.`,
              productId: tracked.product_id,
              pincode: tracked.pincode,
            };

            // Broadcast to Topic
            const cleanPin = tracked.pincode.replace(/[^a-zA-Z0-9_-]/g, '_');
            const cleanProd = tracked.product_id.replace(/[^a-zA-Z0-9_-]/g, '_');
            const topic = `restock_${cleanPin}_${cleanProd}`.slice(0, 80);

            if (serviceAccount && fcmAccessToken) {
              await sendFcmNotification(serviceAccount, fcmAccessToken, { topic }, alertPayload);

              // Send to all active user device tokens with their individual selected alarm sound
              for (const dev of userDevices) {
                if (dev.fcm_token) {
                  const devSound = dev.selected_sound_id || 'digital_clock_beep';
                  await sendFcmNotification(
                    serviceAccount,
                    fcmAccessToken,
                    { token: dev.fcm_token },
                    { ...alertPayload, soundId: devSound }
                  );
                }
              }
            }

            // 4. Log to Supabase restock_events
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
              pincode: tracked.pincode,
              stockCount,
              devicesAlerted: devices?.length || 0,
            });
          }

          // Update current stock state in Redis
          await redis.set(stockKey, isInStock ? '1' : '0');
        }
      } catch (err) {
        console.error(`⚠️ Error checking store ${storeId}:`, err);
      }
    }

    return new Response(
      JSON.stringify({
        status: 'success',
        checkedStores: Object.keys(storeMap).length,
        totalTrackedItems: subs.length,
        restocksDetected: alertResults,
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
