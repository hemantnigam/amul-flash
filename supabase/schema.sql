-- =========================================================
-- Amul Flash Supabase Database Schema
-- Run this script in the Supabase SQL Editor (supabase.com/dashboard)
-- =========================================================

-- 1. Devices Table
CREATE TABLE IF NOT EXISTS public.devices (
    fcm_token TEXT PRIMARY KEY,
    platform TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tracked Subscriptions Table
CREATE TABLE IF NOT EXISTS public.tracked_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fcm_token TEXT NOT NULL REFERENCES public.devices(fcm_token) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    product_title TEXT NOT NULL,
    pincode TEXT NOT NULL DEFAULT 'all',
    store_id TEXT NOT NULL DEFAULT '66505ff5145c16635e6cc74d',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_device_product_pincode UNIQUE (fcm_token, product_id, pincode)
);

-- Indexes for lightning fast polling lookups by cloud cron
CREATE INDEX IF NOT EXISTS idx_subs_active_pincode_store 
ON public.tracked_subscriptions (is_active, pincode, store_id);

CREATE INDEX IF NOT EXISTS idx_subs_product_id 
ON public.tracked_subscriptions (product_id);

-- 3. Restock Events Table (Drop History & Analytics)
CREATE TABLE IF NOT EXISTS public.restock_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id TEXT NOT NULL,
    product_title TEXT NOT NULL,
    pincode TEXT,
    store_id TEXT,
    stock_count INTEGER DEFAULT 0,
    units_added INTEGER DEFAULT 0,
    detected_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_restock_detected_at 
ON public.restock_events (detected_at DESC);

-- =========================================================
-- Row Level Security (RLS) Policies
-- =========================================================

ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracked_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restock_events ENABLE ROW LEVEL SECURITY;

-- Allow devices to register and update their activity
CREATE POLICY "Allow public insert and update for devices"
ON public.devices
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Allow devices to manage their subscriptions
CREATE POLICY "Allow public access for tracked subscriptions"
ON public.tracked_subscriptions
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Allow public read of restock events, and service role write
CREATE POLICY "Allow public read of restock events"
ON public.restock_events
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Allow service role insert into restock events"
ON public.restock_events
FOR INSERT
TO service_role
WITH CHECK (true);
