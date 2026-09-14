const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const https = require('https');

// 1. Load Firebase Service Account
let serviceAccount = null;
const possiblePaths = [
  path.join(process.env.HOME, 'Downloads/amul-flash-firebase-adminsdk-fbsvc-8e9ff19e13.json'),
  path.join(__dirname, '../service-account.json'),
];

for (const p of possiblePaths) {
  if (fs.existsSync(p)) {
    serviceAccount = JSON.parse(fs.readFileSync(p, 'utf8'));
    break;
  }
}

if (!serviceAccount) {
  console.error('❌ Could not find Firebase service account JSON file.');
  process.exit(1);
}

// 2. Fetch Latest FCM Token from Supabase
const SUPABASE_URL = 'https://armxxjwogyfelkysgzcx.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFybXh4andvZ3lmZWxreXNnemN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4OTg4NTQsImV4cCI6MjEwMzQ3NDg1NH0.GZ3SdsV6mit1SHf-uxEbS6UzhFRtfCAMmSSbMUDk6zY';

async function fetchLatestDeviceToken() {
  const customToken = process.argv[2];
  if (customToken) return customToken;

  const res = await fetch(`${SUPABASE_URL}/rest/v1/devices?select=fcm_token&order=last_active_at.desc&limit=1`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });
  const data = await res.json();
  if (data && data.length > 0 && data[0].fcm_token) {
    return data[0].fcm_token;
  }
  return null;
}

// 3. Generate Google OAuth2 Token
async function getAccessToken() {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: serviceAccount.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now,
  };

  const b64 = (obj) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const unsigned = `${b64(header)}.${b64(claim)}`;
  const sign = crypto.createSign('RSA-SHA256');
  sign.update(unsigned);
  const signature = sign.sign(serviceAccount.private_key, 'base64url');
  const jwt = `${unsigned}.${signature}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });
  const tokenData = await res.json();
  return tokenData.access_token;
}

// 4. Main Send Routine
async function main() {
  console.log('🔍 Fetching device token from Supabase...');
  const targetToken = await fetchLatestDeviceToken();

  if (!targetToken) {
    console.error('❌ No registered devices found in Supabase. Please open the app and tap "Cloud Radar Sync".');
    process.exit(1);
  }

  console.log(`🎯 Targeting device token: ${targetToken.slice(0, 18)}...`);
  console.log('🔑 Authenticating with Google Firebase...');
  const accessToken = await getAccessToken();

  console.log('🚨 Dispatching restock alarm notification to your phone...');
  const payload = {
    message: {
      token: targetToken,
      notification: {
        title: '⚡ Restock Alert: Protein Blueberry Lassi',
        body: 'Stock is live for Hub 110044 (30 units)! Tap to buy now.',
      },
      data: {
        productId: '66505ff5145c16635e6cc74d',
        pincode: '110044',
        title: '⚡ Restock Alert: Protein Blueberry Lassi',
        body: 'Stock is live for Hub 110044 (30 units)! Tap to buy now.',
        soundId: 'digital_clock_beep',
        unitsAdded: '30',
        timestamp: String(Date.now()),
      },
      android: {
        priority: 'high',
        notification: {
          channel_id: 'amul_ch_digital_clock_beep',
          sound: 'mixkit_alarm_digital_clock_beep_989',
          default_sound: false,
          notification_priority: 'PRIORITY_MAX',
          tag: `amul_drop_${Date.now()}`,
        },
      },
      apns: {
        payload: {
          aps: {
            sound: 'mixkit_alarm_digital_clock_beep_989.wav',
            badge: 1,
            'content-available': 1,
          },
        },
      },
    },
  };

  const url = `https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const result = await res.json();
  if (result.name) {
    console.log('✅ TEST ALERT DELIVERED TO YOUR PHONE SUCCESSFULLY!');
    console.log('📲 Check your phone screen now!');
  } else {
    console.error('❌ FCM Error response:', result);
  }
}

main().catch((err) => console.error('❌ Error:', err));
