# Stripe Webhook Troubleshooting Guide

## Problem: Order shows in Stripe but not in Admin Panel

This means the webhook isn't creating the order in your database. Here's how to fix it:

## Step 1: Check if Webhook Events Table Exists

Run this in Supabase SQL Editor:

```sql
SELECT * FROM webhook_events ORDER BY created_at DESC LIMIT 5;
```

If you get an error, run the migration:

```sql
-- Create webhook_events table
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  stripe_event_id TEXT UNIQUE,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_webhook_events_stripe_event_id ON webhook_events(stripe_event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON webhook_events(created_at);
```

## Step 2: Check Your Environment Variables

Make sure `.env.local` has:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Step 3: Test Webhooks Locally (Recommended)

### Option A: Use Stripe CLI (Best for Development)

1. **Install Stripe CLI:**
   ```bash
   brew install stripe/stripe-cli/stripe
   ```

2. **Login:**
   ```bash
   stripe login
   ```

3. **Forward webhooks to local server:**
   ```bash
   stripe listen --forward-to localhost:3000/api/payments/webhook
   ```

4. **Copy the webhook secret** (starts with `whsec_`) and add to `.env.local`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

5. **Restart your dev server**

6. **Test with a payment:**
   - Place an order through checkout
   - You should see webhook events in the Stripe CLI terminal
   - Check your database for the order

### Option B: Use Stripe Dashboard Webhooks (For Production/Testing)

1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. Enter your webhook URL:
   - **Local:** Use ngrok or similar: `https://your-ngrok-url.ngrok.io/api/payments/webhook`
   - **Production:** `https://yourdomain.com/api/payments/webhook`
4. Select events to listen for:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Copy the webhook signing secret and add to `.env.local`

## Step 4: Check Webhook Events in Database

Run this query to see if webhooks are being received:

```sql
SELECT 
  event_type,
  processed,
  error_message,
  created_at,
  payload->>'id' as stripe_event_id
FROM webhook_events 
ORDER BY created_at DESC 
LIMIT 10;
```

**If no events appear:**
- Webhooks aren't reaching your server
- Check webhook URL is correct
- Check if server is running and accessible
- Check Stripe Dashboard → Webhooks → Recent events

**If events appear but `processed = false`:**
- Check `error_message` column for errors
- Common issues:
  - Missing `tenant_id` in metadata
  - Invalid cart items structure
  - Database constraint violations

## Step 5: Check Orders Table

```sql
SELECT 
  order_number,
  customer_name,
  status,
  payment_status,
  total,
  created_at
FROM orders 
ORDER BY created_at DESC 
LIMIT 10;
```

## Step 6: Manual Webhook Test

If webhooks aren't working, you can manually trigger one:

```bash
# Using Stripe CLI
stripe trigger checkout.session.completed
```

Or manually create an order by calling the webhook handler with test data.

## Common Issues

### Issue 1: Webhook Secret Mismatch

**Symptom:** Webhook events show "signature verification failed"

**Fix:** Make sure `STRIPE_WEBHOOK_SECRET` matches the secret from:
- Stripe CLI (if using local testing)
- Stripe Dashboard → Webhooks → Your endpoint → Signing secret

### Issue 2: Missing tenant_id in Metadata

**Symptom:** Webhook events show "Missing tenant_id in metadata"

**Fix:** Check that `create-session` route includes `tenant_id` in metadata (it should)

### Issue 3: Cart Items Structure Mismatch

**Symptom:** Order created but no order_items

**Fix:** The webhook expects cart items with `id` field (menu_item_id). Check that cart items sent to Stripe include the menu item ID.

### Issue 4: Webhook Not Accessible

**Symptom:** No webhook events in database

**Fix:** 
- For local: Use Stripe CLI or ngrok
- For production: Ensure webhook URL is publicly accessible
- Check server logs for webhook requests

## Debugging Commands

```bash
# Check recent webhook events
cd moto-kitchen-website
npx tsx scripts/check-webhook-events.ts

# Check server logs (if running)
# Look for webhook-related errors in terminal
```

## Next Steps After Fixing

1. Place a test order
2. Check `webhook_events` table for new event
3. Check `orders` table for new order
4. Check `order_items` table for items
5. Check `payments` table for payment record
6. Verify order appears in admin panel

