# Stripe Payment Flow Testing Guide

## Overview

This guide explains how to test the Stripe payment integration in **TEST MODE** before going live.

**Current Status**: ✅ Stripe TEST keys configured
**Mode**: Sandbox/Test Mode
**Goal**: Validate all payment scenarios work correctly

---

## Test Cards (Stripe Provided)

### Successful Payments
- **4242 4242 4242 4242** - Visa (succeeds)
- **5555 5555 5555 4444** - Mastercard (succeeds)
- **3782 822463 10005** - American Express (succeeds)

### Failed Payments
- **4000 0000 0000 0002** - Card declined
- **4000 0000 0000 9995** - Insufficient funds
- **4000 0000 0000 0069** - Expired card
- **4000 0000 0000 0127** - Incorrect CVC

### 3D Secure (SCA Required)
- **4000 0025 0000 3155** - Requires authentication (use any CVC)

**Details for all cards**:
- Expiry: Any future date (e.g., 12/34)
- CVC: Any 3 digits (e.g., 123)
- ZIP: Any 5 digits (e.g., 12345)

---

## Automated Test Suite

### Run Tests

```bash
cd /Users/chilech/Desktop/moto\ kitchen\ /moto-kitchen-website
npm test -- stripe-payment-flow
```

### Test Scenarios Covered

1. ✅ **Successful payment** - Creates session, books slot, verifies pending order
2. ✅ **Expired session** - Simulates 30-minute expiry
3. ✅ **Slot full** - Verifies capacity enforcement
4. ✅ **Failed payment** - Setup for manual card decline test
5. ✅ **Concurrent payments** - 5 simultaneous checkouts

---

## Manual Testing Checklist

### Test 1: Complete Successful Order

**Steps**:
1. Go to: https://motokitchen.nl/order
2. Add items to cart
3. Proceed to checkout
4. Fill out customer info
5. Select pickup time slot
6. Click "Pay & Place Order"
7. Use test card: **4242 4242 4242 4242**
8. Complete payment

**Expected**:
- ✅ Redirects to order success page
- ✅ Order number displayed
- ✅ Confirmation email sent
- ✅ Order appears in admin dashboard with status "paid"
- ✅ Slot `current_orders` incremented by 1

**Verify in Database**:
```sql
SELECT 
  order_number, 
  payment_status, 
  status, 
  stripe_session_id,
  total
FROM orders
WHERE customer_email = 'your-test-email@example.com'
ORDER BY created_at DESC
LIMIT 1;
```

---

### Test 2: Declined Payment

**Steps**:
1-6. Same as Test 1
7. Use test card: **4000 0000 0000 0002** (declined)
8. Attempt payment

**Expected**:
- ❌ Payment fails with "Card was declined" message
- ✅ Order remains in `pending` status
- ✅ Slot stays reserved (for 30 minutes)
- ✅ Customer can try again with different card

**Verify in Database**:
```sql
SELECT 
  order_number,
  payment_status,
  expires_at,
  stripe_session_id
FROM orders
WHERE payment_status = 'pending'
  AND expires_at > NOW()
ORDER BY created_at DESC;
```

---

### Test 3: Expired Session

**Steps**:
1. Create order (don't complete payment)
2. Wait 30 minutes
3. Check order status

**Expected**:
- ✅ Order automatically marked as `expired`
- ✅ Slot released (`current_orders` decremented)
- ✅ Stripe session expired

**Verify with Cron Job**:
```bash
curl -X POST https://motokitchen.nl/api/cron/cleanup-pending-orders \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

**Check Database**:
```sql
SELECT 
  order_number,
  payment_status,
  expires_at,
  created_at
FROM orders
WHERE payment_status = 'expired'
ORDER BY created_at DESC
LIMIT 5;
```

---

### Test 4: Slot Full Scenario

**Steps**:
1. Identify a time slot with capacity (e.g., max_orders = 10)
2. Create 10 test orders for that slot
3. Attempt 11th order

**Expected**:
- ✅ First 10 orders succeed
- ❌ 11th order fails with "Slot is full" error
- ✅ `current_orders` stays at 10 (not 11)

**Check Slot Capacity**:
```sql
SELECT 
  slot_time,
  current_orders,
  max_orders,
  fulfillment_type
FROM time_slots
WHERE id = 'YOUR_SLOT_ID';
```

---

### Test 5: Webhook Processing

**Steps**:
1. Make a test payment
2. Check webhook events in Stripe Dashboard
3. Verify webhook was received and processed

**Stripe Dashboard**:
- Go to: https://dashboard.stripe.com/test/webhooks
- Find your webhook endpoint
- Check recent events
- Look for `checkout.session.completed`

**Expected**:
- ✅ Webhook received within 5 seconds
- ✅ HTTP 200 response returned
- ✅ Order status updated to `paid`
- ✅ Email queued for customer

**Verify Webhook Logs**:
```sql
SELECT 
  stripe_event_id,
  event_type,
  processed,
  created_at
FROM webhook_events
ORDER BY created_at DESC
LIMIT 10;
```

---

### Test 6: Webhook Retry (Network Failure Simulation)

**Steps**:
1. Temporarily break the webhook endpoint (return 500)
2. Make a test payment
3. Stripe will auto-retry (exponential backoff)
4. Fix the endpoint
5. Verify order updates

**Expected**:
- ✅ Stripe retries up to 3 times
- ✅ Order eventually updates when endpoint recovers
- ✅ No duplicate processing (deduplication works)

**Simulate Failure** (temporary code change):
```typescript
// In app/api/payments/webhook/route.ts
export async function POST(request: NextRequest) {
  // Temporarily return 500 to simulate failure
  return NextResponse.json({ error: 'Simulated failure' }, { status: 500 })
}
```

---

### Test 7: Concurrent Checkouts

**Steps**:
1. Open 5 browser tabs
2. Add items to cart in each tab
3. Proceed to checkout in all tabs
4. Select the SAME time slot in all tabs
5. Click "Pay" in rapid succession

**Expected**:
- ✅ All 5 payments succeed (if capacity allows)
- ✅ No race conditions
- ✅ `current_orders` correctly reflects 5 bookings
- ✅ No double-booking

---

## Monitoring & Debugging

### Check Payment Logs

**Server Logs** (during local dev):
```bash
# Watch logs in real-time
tail -f /path/to/logs/payment.log
```

**Production Logs** (Vercel):
- Go to: Vercel Dashboard → Your Project → Logs
- Filter by: `/api/payments`
- Look for errors or warnings

### Check Webhook Status

**Stripe Dashboard**:
1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click your webhook endpoint
3. View recent events
4. Check for failed attempts

### Check Database State

```sql
-- Recent orders
SELECT order_number, payment_status, total, created_at
FROM orders
ORDER BY created_at DESC
LIMIT 20;

-- Pending orders (should expire)
SELECT order_number, expires_at, created_at
FROM orders
WHERE payment_status = 'pending'
  AND expires_at < NOW();

-- Slot capacity
SELECT slot_time, current_orders, max_orders
FROM time_slots
WHERE is_active = true
ORDER BY slot_time;

-- Webhook events
SELECT stripe_event_id, event_type, processed, created_at
FROM webhook_events
ORDER BY created_at DESC
LIMIT 20;
```

---

## Common Issues & Troubleshooting

### Issue: Webhook not receiving events

**Cause**: Webhook secret mismatch or endpoint not configured

**Fix**:
1. Check `.env.local` has correct `STRIPE_WEBHOOK_SECRET`
2. Verify webhook endpoint in Stripe Dashboard
3. Use ngrok/localtunnel for local testing:
   ```bash
   npx stripe listen --forward-to localhost:3000/api/payments/webhook
   ```

### Issue: Order stuck in "pending"

**Cause**: Webhook not processed or customer didn't complete payment

**Fix**:
1. Check webhook events in Stripe Dashboard
2. Manually run cleanup cron:
   ```bash
   curl -X POST https://motokitchen.nl/api/cron/cleanup-pending-orders \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

### Issue: Slot overbooking

**Cause**: Race condition (should not happen with atomic RPC)

**Fix**:
1. Verify CHECK constraint is applied:
   ```sql
   SELECT conname FROM pg_constraint 
   WHERE conname = 'check_slot_capacity';
   ```
2. Reset slot capacity:
   ```sql
   UPDATE time_slots
   SET current_orders = (
     SELECT COUNT(*) FROM orders
     WHERE time_slot_id = time_slots.id
       AND payment_status IN ('paid', 'pending')
   )
   WHERE id = 'SLOT_ID';
   ```

---

## Production Readiness Checklist

Before switching to production Stripe keys:

- [ ] All automated tests passing
- [ ] Manual Test 1 (successful payment) verified
- [ ] Manual Test 2 (declined card) verified
- [ ] Manual Test 3 (expiry) verified
- [ ] Manual Test 4 (slot full) verified
- [ ] Manual Test 5 (webhook) verified
- [ ] Manual Test 7 (concurrent) verified
- [ ] Webhook endpoint SSL configured
- [ ] Webhook secret rotated for production
- [ ] Email notifications working
- [ ] Admin dashboard showing orders
- [ ] Refund process tested (manual via Stripe Dashboard)
- [ ] Double booking prevention verified (CHECK constraint applied)

---

## Next Steps

1. **Run automated tests**: `npm test -- stripe-payment-flow`
2. **Complete manual tests** (checklist above)
3. **Monitor logs** for any errors
4. **Document edge cases** you discover
5. **When ready**: Switch to production keys (NOT YET!)

---

## Test Mode Indicators

To verify you're in test mode:

✅ Stripe keys start with `sk_test_` and `whsec_test_`
✅ Stripe Dashboard shows "Test Mode" toggle enabled
✅ Test cards work (4242 4242 4242 4242)
✅ No real money is charged

**NEVER** use production keys until Phase 1 is 100% complete!
