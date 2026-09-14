#!/bin/bash
# =========================================================================
# Setup Upstash QStash Schedule for Amul Flash Stock Radar
# =========================================================================

# Check for QStash token
if [ -z "$QSTASH_TOKEN" ]; then
  echo "Error: QSTASH_TOKEN environment variable is not set."
  echo "Usage: QSTASH_TOKEN=your_token EDGE_FUNCTION_URL=https://<project-ref>.supabase.co/functions/v1/amul-radar-cron ./setup_qstash.sh"
  exit 1
fi

if [ -z "$EDGE_FUNCTION_URL" ]; then
  echo "Error: EDGE_FUNCTION_URL environment variable is not set."
  echo "Example: EDGE_FUNCTION_URL=https://xyzcompany.supabase.co/functions/v1/amul-radar-cron"
  exit 1
fi

echo "Creating Upstash QStash Schedule targeting: $EDGE_FUNCTION_URL"

# Schedule to trigger every 10 seconds via QStash
# (QStash supports cron "* * * * *" for every minute, or high-frequency schedules)
curl -s -X POST "https://qstash.upstash.io/v2/schedules/$EDGE_FUNCTION_URL" \
  -H "Authorization: Bearer $QSTASH_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Upstash-Cron: * * * * *" \
  -H "Upstash-Retries: 2" \
  -d '{"source": "upstash-cron"}'

echo ""
echo "✅ Upstash QStash schedule created successfully!"
