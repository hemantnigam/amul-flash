-- =========================================================
-- Amul Flash Supabase Database Schema (Mobile-Number Centric)
-- Run this script in the Supabase SQL Editor (supabase.com/dashboard)
-- =========================================================

-- 1. Devices Table (Attached to User Mobile Number)
CREATE TABLE IF NOT EXISTS public.devices (
    fcm_token TEXT PRIMARY KEY,
    phone_number TEXT,
    platform TEXT,
    selected_sound_id TEXT DEFAULT 'alert_alarm',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_active_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist if table was already created
ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS selected_sound_id TEXT DEFAULT 'alert_alarm';
ALTER TABLE public.devices ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_devices_phone ON public.devices (phone_number);
CREATE INDEX IF NOT EXISTS idx_devices_last_active ON public.devices (last_active_at DESC);

-- 2. Tracked Subscriptions Table (Owned by User Mobile Number & Synced Across Devices)
CREATE TABLE IF NOT EXISTS public.tracked_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number TEXT,
    fcm_token TEXT REFERENCES public.devices(fcm_token) ON DELETE SET NULL,
    product_id TEXT NOT NULL,
    product_title TEXT NOT NULL,
    pincode TEXT NOT NULL DEFAULT 'all',
    store_id TEXT NOT NULL DEFAULT '66505ff5145c16635e6cc74d',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist if table was already created
ALTER TABLE public.tracked_subscriptions ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Unique constraint on (phone_number, product_id, pincode) when phone_number is present
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_phone_product_pincode'
    ) THEN
        ALTER TABLE public.tracked_subscriptions 
        ADD CONSTRAINT unique_phone_product_pincode UNIQUE (phone_number, product_id, pincode);
    END IF;
EXCEPTION
    WHEN others THEN NULL;
END $$;

-- Indexes for lightning fast polling lookups by cloud cron
CREATE INDEX IF NOT EXISTS idx_subs_active_pincode_store 
ON public.tracked_subscriptions (is_active, pincode, store_id);

CREATE INDEX IF NOT EXISTS idx_subs_product_id 
ON public.tracked_subscriptions (product_id);

CREATE INDEX IF NOT EXISTS idx_subs_phone_number 
ON public.tracked_subscriptions (phone_number);

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

-- 4. Stale Device Pruning Procedure
CREATE OR REPLACE FUNCTION public.cleanup_stale_devices(days_threshold INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.devices
    WHERE last_active_at < (NOW() - (days_threshold || ' days')::INTERVAL);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =========================================================
-- Row Level Security (RLS) Policies
-- =========================================================

ALTER TABLE public.devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tracked_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restock_events ENABLE ROW LEVEL SECURITY;

-- Allow public insert and update for devices
DO $$
BEGIN
    DROP POLICY IF EXISTS "Allow public insert and update for devices" ON public.devices;
    CREATE POLICY "Allow public insert and update for devices"
    ON public.devices
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);
END $$;

-- Allow public access for tracked subscriptions
DO $$
BEGIN
    DROP POLICY IF EXISTS "Allow public access for tracked subscriptions" ON public.tracked_subscriptions;
    CREATE POLICY "Allow public access for tracked subscriptions"
    ON public.tracked_subscriptions
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);
END $$;

-- Allow public read of restock events, and service role write
DO $$
BEGIN
    DROP POLICY IF EXISTS "Allow public read of restock events" ON public.restock_events;
    CREATE POLICY "Allow public read of restock events"
    ON public.restock_events
    FOR SELECT
    TO anon, authenticated
    USING (true);

    DROP POLICY IF EXISTS "Allow service role insert into restock events" ON public.restock_events;
    CREATE POLICY "Allow service role insert into restock events"
    ON public.restock_events
    FOR INSERT
    TO service_role
    WITH CHECK (true);
END $$;
