import { Redis } from '@upstash/redis';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local if running standalone
const UPSTASH_URL = process.env.EXPO_PUBLIC_UPSTASH_REDIS_REST_URL || 'https://natural-amoeba-201049.upstash.io';
const UPSTASH_TOKEN = process.env.EXPO_PUBLIC_UPSTASH_REDIS_REST_TOKEN || 'gQAAAAAAAxFZAAIgcDI0YWIyYWQ5YzVjNjc0MzM3YmE0NTAzMDAyNTZhYjEyZQ';
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://armxxjwogyfelkysgzcx.supabase.co';
const SUPABASE_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFybXh4andvZ3lmZWxreXNnemN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4OTg4NTQsImV4cCI6MjEwMzQ3NDg1NH0.GZ3SdsV6mit1SHf-uxEbS6UzhFRtfCAMmSSbMUDk6zY';

const redis = new Redis({
  url: UPSTASH_URL,
  token: UPSTASH_TOKEN,
});

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export interface ScrapedAmulProduct {
  name: string;
  sku: string;
  price: number;
  available: number;
  inventory_quantity: number;
  alias?: string;
  images?: string[];
  substore?: string;
}

/**
 * Fetch live protein products directly from Amul D2C Cloud API
 */
export async function fetchLiveAmulProteinProducts(substoreId: string = '66505ff5145c16635e6cc74d'): Promise<ScrapedAmulProduct[]> {
  const url = `https://shop.amul.com/api/1/entity/ms.products?fields[name]=1&fields[brand]=1&fields[categories]=1&fields[collections]=1&fields[alias]=1&fields[sku]=1&fields[price]=1&fields[compare_price]=1&fields[original_price]=1&fields[images]=1&fields[available]=1&fields[inventory_quantity]=1&fields[variants]=1&filters[0][field]=categories&filters[0][value][0]=protein&filters[0][operator]=in&filters[0][original]=1&limit=32&substore=${substoreId}&v=6`;

  const response = await fetch(url, {
    headers: {
      'accept': 'application/json, text/plain, */*',
      'base_url': 'https://shop.amul.com/en/browse/protein',
      'frontend': '1',
      'referer': 'https://shop.amul.com/en/browse/protein',
      'tid': '1787905699669:9:27ee6fbe695d53ddd6d23651dab82c0eb4cac3708afc1869048ca64e7c5df53c',
      'cookie': 'jsessionid=s%3Aec5cZOHkdSeT9OxX4bPFJ%2Bkh.HHGNRjH7gQzQXnq2krq9KWUeicfxeYjmQzh%2BeJOyNCU;',
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  });

  const json = await response.json();
  return json.data || [];
}

/**
 * Run a single poll cycle: Fetch -> Compare with Upstash Redis -> Alert on Delta Diff
 */
export async function runPollCycle(pincode: string = '110044', substoreId: string = '66505ff5145c16635e6cc74d') {
  console.log(`\n🔍 [${new Date().toLocaleTimeString()}] Polling Amul D2C for Pincode ${pincode}...`);
  const products = await fetchLiveAmulProteinProducts(substoreId);

  console.log(`📦 Found ${products.length} High-Protein SKUs in live catalog.`);

  let restockEventsFound = 0;

  for (const product of products) {
    const redisKey = `stock:${pincode}:${product.sku}`;
    const previousState: any = await redis.get(redisKey);

    const isNowAvailable = product.available === 1 && product.inventory_quantity > 0;
    const wasAvailable = previousState?.available === 1;

    // Detect Restock Transition
    if (!wasAvailable && isNowAvailable) {
      restockEventsFound++;
      console.log(`🚨 [RESTOCK DETECTED] ${product.name}`);
      console.log(`   Units Available: ${product.inventory_quantity} | Price: ₹${product.price}`);

      // Log in Supabase
      try {
        await supabase.from('restock_events').insert({
          pincode,
          product_id: product.sku,
          units_added: product.inventory_quantity,
        });
      } catch (e) {
        // Table may be created or pending
      }
    }

    // Update Redis with latest state & 1-day TTL
    await redis.set(
      redisKey,
      {
        name: product.name,
        price: product.price,
        available: product.available,
        inventory_quantity: product.inventory_quantity,
        lastUpdated: Date.now(),
      },
      { ex: 86400 }
    );
  }

  console.log(`✅ Polling complete. Cached ${products.length} SKUs in Upstash Redis. (Restocks: ${restockEventsFound})`);
}

// Run poll cycle
runPollCycle().catch(console.error);

