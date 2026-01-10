#!/bin/bash

# Get CRON_SECRET from .env.local
CRON_SECRET=$(grep "^CRON_SECRET=" .env.local | cut -d '=' -f2)

if [ -z "$CRON_SECRET" ]; then
  echo "❌ CRON_SECRET not found in .env.local"
  exit 1
fi

echo "🔍 Testing email queue cron job..."
echo "📧 Checking for pending emails in database..."

# Make the request
curl -X POST http://localhost:3000/api/cron/process-email-queue \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -w "\n\nHTTP Status: %{http_code}\n" \
  -s

echo ""
echo "✅ Test complete"
