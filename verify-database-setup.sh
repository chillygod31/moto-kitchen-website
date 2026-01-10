#!/bin/bash
echo "🔍 Verifying Database Setup..."
echo ""

# Load environment variables
source .env.local 2>/dev/null || true

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
  echo "❌ NEXT_PUBLIC_SUPABASE_URL not found in .env.local"
  exit 1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
  echo "❌ SUPABASE_SERVICE_ROLE_KEY not found in .env.local"
  exit 1
fi

echo "✅ Environment variables loaded"
echo ""

# Test 1: Verify CHECK constraint exists
echo "📋 Test 1: Checking if CHECK constraint exists..."
CONSTRAINT_CHECK=$(curl -s -X POST "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "sql_query": "SELECT conname FROM pg_constraint WHERE conname = '"'"'check_slot_capacity'"'"';"
  }' 2>&1)

if echo "$CONSTRAINT_CHECK" | grep -q "check_slot_capacity"; then
  echo "✅ CHECK constraint 'check_slot_capacity' exists"
else
  echo "⚠️  CHECK constraint may not exist or RPC not available"
fi
echo ""

# Test 2: Verify email_queue table exists
echo "📋 Test 2: Checking email_queue table..."
EMAIL_QUEUE_CHECK=$(curl -s -X GET "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/email_queue?limit=1" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json")

if echo "$EMAIL_QUEUE_CHECK" | grep -q '\['; then
  echo "✅ email_queue table accessible"
else
  echo "❌ email_queue table not accessible"
fi
echo ""

# Test 3: Verify cron_job_runs table exists
echo "📋 Test 3: Checking cron_job_runs table..."
CRON_CHECK=$(curl -s -X GET "${NEXT_PUBLIC_SUPABASE_URL}/rest/v1/cron_job_runs?limit=1" \
  -H "apikey: ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
  -H "Content-Type: application/json")

if echo "$CRON_CHECK" | grep -q '\['; then
  echo "✅ cron_job_runs table accessible"
else
  echo "❌ cron_job_runs table not accessible"
fi
echo ""

# Test 4: Check if Resend API key is configured
echo "📋 Test 4: Checking Resend configuration..."
if [ -n "$RESEND_API_KEY" ]; then
  echo "✅ RESEND_API_KEY configured"
else
  echo "⚠️  RESEND_API_KEY not found"
fi
echo ""

# Test 5: Check if Stripe keys are configured
echo "📋 Test 5: Checking Stripe configuration..."
if [ -n "$STRIPE_SECRET_KEY" ]; then
  if [[ "$STRIPE_SECRET_KEY" == sk_test_* ]]; then
    echo "✅ Stripe TEST key configured (sandbox mode)"
  elif [[ "$STRIPE_SECRET_KEY" == sk_live_* ]]; then
    echo "⚠️  Stripe LIVE key configured (production mode)"
  else
    echo "⚠️  Stripe key format unknown"
  fi
else
  echo "❌ STRIPE_SECRET_KEY not found"
fi
echo ""

echo "✅ Database verification complete!"
