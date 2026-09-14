# Amul Flash 24/7 Cloud Stock Poller (Supabase + Upstash + FCM)

This directory contains the backend cloud infrastructure that monitors Amul stock drops 24/7 and delivers real-time push alerts to devices even when the mobile app is killed or the device is asleep.

## Quick Setup Guide

### 1. Supabase Database Setup
1. Go to your [Supabase Dashboard](https://supabase.com/dashboard).
2. Open the **SQL Editor**.
3. Copy the contents of [`schema.sql`](./schema.sql) and click **Run**.
4. Copy your **Project URL** and **anon public key** from `Settings` -> `API` and add them to `.env`:
   ```bash
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```

### 2. Deploy Supabase Edge Function
Install the Supabase CLI (if not already installed) and deploy:
```bash
# Link your local project
npx supabase link --project-ref your-project-ref

# Deploy the stock radar edge function
npx supabase functions deploy amul-radar-cron --no-verify-jwt
```

### 3. Set Edge Function Secrets
In Supabase Dashboard -> **Edge Functions** -> **Secrets** (or via CLI `npx supabase secrets set ...`):
```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
UPSTASH_REDIS_REST_URL=https://your-upstash-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token
FIREBASE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
```

> **Tip:** You can obtain the Firebase Service Account JSON from Firebase Console -> **Project Settings** -> **Service accounts** -> **Generate new private key**.

### 4. Configure Upstash QStash (24/7 Polling Cron)
In your terminal:
```bash
QSTASH_TOKEN="your_qstash_token" \
EDGE_FUNCTION_URL="https://your-project.supabase.co/functions/v1/amul-radar-cron" \
./supabase/functions/amul-radar-cron/setup_qstash.sh
```

---

## How It Works Under The Hood

1. **Client Registration:** When the mobile app starts, `fcmService` registers the device's FCM token in Supabase.
2. **Track Subscription:** When a user turns on "Track" on an item, it syncs to `tracked_subscriptions` and subscribes to the FCM topic `restock_{pincode}_{productId}`.
3. **24/7 Polling:** Upstash QStash triggers the Edge Function every few seconds.
4. **Sub-millisecond Diffing:** Upstash Redis compares live Amul API inventory against cached inventory in `<1ms`.
5. **Wake-Up Siren:** When stock transitions from `0 ➔ >0`, FCM sends a high-priority push message that wakes the phone and sounds the siren alarm.
