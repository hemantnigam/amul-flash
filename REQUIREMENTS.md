# Amul Flash — Product Requirements Document (PRD)

---

## 1. Executive Summary & Vision

### 1.1 Problem Statement
Amul's high-protein line (**High Protein Whey, Protein Lassi 15g/25g, Protein Buttermilk 15g, High Protein Paneer, and specialty dairy**) are exclusively sold on `shop.amul.com` and suffer from severe supply bottlenecks across India. Products restock irregularly and sell out within **30 to 120 seconds**.

### 1.2 App Vision
A dedicated, high-performance mobile application built with **React Native (Expo)**, **Supabase**, and **Firebase Cloud Messaging (FCM)** that acts as an **instantaneous flash restock monitor and fast checkout assistant** for Amul D2C products.

---

## 2. Monetization & Subscription Architecture

### 2.1 Core Strategy: Quality Free, Capacity Paid
The app adopts a **Utility-First & Volume-Gated Model**:
- **Zero Compromise on Quality:** All users (Free and Paid) receive the full-fidelity alert experience (loud siren alarms, all 8 custom ringtones, instant zero-latency delivery, and 1-tap quick buy).
- **Monetization on Scale & Intelligence:** Free tier allows monitoring **1 product in 1 pincode**. Paid passes unlock **unlimited products**, **multi-pincode tracking**, and the **Graphical Stats & Drop Intelligence Screen**.

### 2.2 Feature Gating Matrix

| Feature | 🆓 Free Tier (Default) | ⚡ Paid Pass (₹5 / Week) |
| :--- | :---: | :---: |
| **Tracked Products** | Max 1 Product | **Unlimited Products** (Whey, Lassi, Paneer, etc.) |
| **Monitored Pincodes** | Max 1 Pincode | **Multiple / Unlimited Pincodes** (Home, Office, Gym) |
| **Graphical Stats Screen** | ❌ (Blurred Teaser) | **✅ Full Interactive Charts & Intelligence** |
| **High-Priority Siren Alarm** | ✅ Included for all | ✅ Included for all |
| **Custom Ringtone Roster** | ✅ All 8 sounds included | ✅ All 8 sounds included |
| **Alert Delivery Speed** | ⚡ Instant (<2s) | ⚡ Instant (<2s) |
| **1-Tap Quick Buy Overlay** | ✅ Included for all | ✅ Included for all |

### 2.3 Sachet / Micro-Pass Pricing Ladder (INR)
- **1-Week Pass:** **₹5** *(Trial & single restock cycle)*
- **1-Month Pass:** **₹19** *(₹4.75/week • Most Popular)*
- **3-Month Pass:** **₹49** *(Gym training block)*
- **1-Year VIP Pass:** **₹149** *(Best Value)*
- **Payment Method:** Direct UPI Intent (PhonePe, Google Pay, Paytm, BHIM).

---

## 3. 30-Day VIP Free Trial & Retention Journey

### 3.1 Automatic 30-Day Trial on First Login
- Every user who registers/logs in with their verified **Mobile Number (`phone_number`)** is automatically granted a **30-Day VIP Pass**.
- **Trial Benefits:** Unlimited products, unlimited pincodes, and full access to the Graphical Stats screen for the first 30 days.
- **Database Tracking:**
  ```sql
  INSERT INTO public.user_subscriptions (
      phone_number,
      plan_name,
      starts_at,
      expires_at,
      status
  ) VALUES (
      '9876543210',
      '30_day_welcome_trial',
      NOW(),
      NOW() + INTERVAL '30 days',
      'active'
  );
  ```

### 3.2 In-App Trial Badge & Counter
- Displays a clean visual badge on the **Tracked** and **Account** screens:
  > **🎁 30-Day VIP Access Active • [ 24 Days Remaining ]**

### 3.3 2-Day Pre-Expiry Push Reminder (Day 28 Notification)
- When a user reaches **Day 28** (2 days before trial expiration), a high-priority system push notification is automatically sent:
  - **Title:** `⏳ Your Amul Flash VIP Trial ends in 2 days`
  - **Body:** `Keep all your tracked items, multi-hub alerts, and restock stats active for just ₹5/week. Tap to extend!`
  - **Action:** Opens the Subscription Modal with 1-tap UPI payment.

### 3.4 Trial Expiration & Graceful Fallback (Day 30+)
- If the trial expires without purchasing a pass:
  - User seamlessly transitions to the **Free Tier (1 Product, 1 Pincode)**.
  - If multiple products were tracked, the app presents a clean picker asking which 1 favorite product they want to keep active, or allows renewing for ₹5.

---

## 4. Graphical Stats & Drop Intelligence Screen

### 4.1 Overview
An insider analytics and demand intelligence hub available to Paid Pass and 30-Day Trial users.

### 4.2 Interactive Graphical Components:

1. **Peak Restock Hours (24-Hour Histogram Bar Chart):**
   - Visual bar chart rendered via `react-native-svg` showing drop frequency across all 24 hours.
   - Prime drop windows (e.g. 11:30 AM – 1:00 PM & 6:30 PM – 8:00 PM) glow in vibrant orange/amber.

2. **Most Tracked Products Leaderboard (Demand Meter):**
   - Top 5 products nationwide with thumbnails, live subscriber counts, and dynamic progress bars indicating demand share (e.g. Blueberry Lassi 88%, Whey 64%).

3. **Weekly Restock Heatmap (7-Day Pills):**
   - Interactive Monday-to-Sunday pills displaying restock probabilities (e.g. Tuesday 🔥 38%, Thursday 🔥 42%).

4. **Pincode Activity Gauge (Hot / Cold Radar Meter):**
   - Visual speedometer/activity gauge calculating the restock frequency of the user's active delivery hub.

5. **Live Restock Timeline Feed:**
   - Real-time event cards showing stock drops across India as they happen with units added and timestamps.

---

## 5. Technical Architecture & Database Schema

### 5.1 Supabase Schema

```sql
-- 1. Devices Table (Keyed to User Mobile Number)
CREATE TABLE public.devices (
    fcm_token TEXT PRIMARY KEY,
    phone_number TEXT,
    platform TEXT,
    selected_sound_id TEXT DEFAULT 'alert_alarm',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tracked Subscriptions Table
CREATE TABLE public.tracked_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number TEXT,
    fcm_token TEXT REFERENCES public.devices(fcm_token) ON DELETE SET NULL,
    product_id TEXT NOT NULL,
    product_title TEXT NOT NULL,
    pincode TEXT NOT NULL DEFAULT 'all',
    store_id TEXT NOT NULL DEFAULT '66505ff5145c16635e6cc74d',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_phone_product_pincode UNIQUE (phone_number, product_id, pincode)
);

-- 3. User Subscriptions Table (Trial & Paid Pass Management)
CREATE TABLE public.user_subscriptions (
    phone_number TEXT PRIMARY KEY,
    plan_name TEXT NOT NULL DEFAULT '30_day_welcome_trial',
    starts_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'expired'
    payment_id TEXT,
    amount_paid INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Restock Events Table (Permanent History & Intelligence)
CREATE TABLE public.restock_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT NOT NULL,
    product_title TEXT NOT NULL,
    pincode TEXT,
    store_id TEXT,
    stock_count INTEGER DEFAULT 0,
    units_added INTEGER DEFAULT 0,
    detected_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 6. End-to-End User Flow Summary

1. **Install & Login:** User verifies phone number via zero-click OTP. Device token registers to `phone_number`, and a 30-Day VIP Pass is automatically activated.
2. **30-Day VIP Experience:** User tracks multiple products across multiple pincodes, views full graphical radar stats, and receives loud siren alarms.
3. **Day 28 Push Reminder:** 2 days before trial ends, user receives a push notification to extend for ₹5/week.
4. **Post-Trial Choice:** User unlocks ₹5 weekly pass (via UPI) or continues with 1 free product forever.
