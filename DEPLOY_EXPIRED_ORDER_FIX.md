# 🚀 Deploy: Expired Order Recovery Fix

## What This Fixes

**Critical Bug**: Customers who paid between minutes 20-30 would succeed in Stripe but their order wouldn't be created because the webhook couldn't find the expired order.

**Impact**: Payment succeeded, no order created, customer confused, restaurant loses order.

**Solution**: 3-part fix that eliminates the expiry gap, tracks slot reservations, and provides manual recovery for edge cases.

---

## 📋 Deployment Checklist (5 Minutes)

### Step 1: Run Migration in Supabase (2 min)

1. Open Supabase Dashboard → SQL Editor
2. Copy/paste the entire contents of:
   ```
   supabase/migrations/2025-12-31-01-fix-expired-order-recovery.sql
   ```
3. Click "Run"
4. Verify success (should see "Success. No rows returned")

### Step 2: Verify Changes (1 min)

Run this query in SQL Editor:

```sql
-- Check new columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'orders' 
  AND column_name IN ('reservation_released', 'slot_released_at');

-- Should return 2 rows:
-- reservation_released | boolean | YES
-- slot_released_at     | timestamp with time zone | YES
```

### Step 3: Test Locally (2 min)

```bash
# Start dev server
npm run dev

# Place a test order
# Check the order's expires_at:
```

Run in Supabase SQL Editor:

```sql
SELECT 
  order_number,
  payment_status,
  created_at,
  expires_at,
  EXTRACT(EPOCH FROM (expires_at - created_at))/60 as minutes_until_expiry
FROM orders 
WHERE payment_status = 'pending'
ORDER BY created_at DESC 
LIMIT 1;

-- minutes_until_expiry should be ~30 (not 20)
```

### Step 4: Deploy to Production (Auto)

```bash
# Commit and push
git add .
git commit -m "fix: P0 expired order recovery - align expiry times, add reservation tracking"
git push origin main

# Vercel will auto-deploy
```

### Step 5: Run Migration in Production Supabase (1 min)

1. Open **Production** Supabase Dashboard → SQL Editor
2. Copy/paste the same migration file
3. Click "Run"
4. Verify success

---

## ✅ What Changed

### 1. Order Expiry Aligned with Stripe ✅
- **Before**: Order expired at 20 minutes (hardcoded)
- **After**: Order expires at 30 minutes (from Stripe session)
- **Impact**: Eliminates 10-minute gap where customer can pay but order is expired

### 2. Webhook Finds Expired Orders ✅
- **Before**: `WHERE payment_status = 'pending'`
- **After**: `WHERE payment_status IN ('pending', 'expired')`
- **Impact**: Late payments (minutes 20-30) now work instead of failing

### 3. Slot Reservation Tracking ✅
- **Before**: No tracking of whether slot was released
- **After**: `reservation_released` and `slot_released_at` columns
- **Impact**: Slot counters stay accurate even with late payments

### 4. Manual Recovery for Edge Cases ✅
- **Before**: No recovery path if slot is full
- **After**: `paid_pending_resolution` status + admin alerts
- **Impact**: Admin can reschedule or refund instead of losing order

---

## 🧪 How to Test

### Test 1: Normal Payment (Should Work Same as Before)
```bash
1. Place order
2. Pay immediately
3. Check: Order status = 'paid', emails sent
```

### Test 2: Late Payment (New: Should Auto-Recover)
```bash
1. Place order
2. Manually expire it:
   UPDATE orders SET payment_status = 'expired', reservation_released = true WHERE order_number = 'XXX';
3. Complete payment in Stripe
4. Check: Order status = 'paid', alert logged (medium severity)
```

### Test 3: Late Payment + Slot Full (New: Should Alert)
```bash
1. Place order
2. Manually expire it and fill slot:
   UPDATE orders SET payment_status = 'expired', reservation_released = true WHERE order_number = 'XXX';
   UPDATE time_slots SET current_orders = max_orders WHERE id = 'YYY';
3. Complete payment in Stripe
4. Check: Order status = 'paid_pending_resolution', critical alert sent
5. Check: /admin/recovery shows alert
```

---

## 🔍 Monitoring

### What to Watch For

| Alert | Severity | Meaning | Action |
|-------|----------|---------|--------|
| "Customer paid after order expired but auto-recovered" | Medium | Late payment, slot re-booked | Review only |
| "Customer paid after order expired and slot is now full" | **Critical** | Late payment, slot full | **Reschedule or refund** |
| "No order found for session" | **Critical** | Webhook failure | Investigate |

### Where to Check

1. **Admin Dashboard**: `/admin/dashboard`
   - Should show alert banner if critical issues exist

2. **Recovery Page**: `/admin/recovery`
   - Shows orders with `paid_pending_resolution` status
   - Shows unacknowledged webhook alerts

3. **Supabase Logs**: Check `webhook_alerts` table
   ```sql
   SELECT * FROM webhook_alerts 
   WHERE acknowledged = false 
   ORDER BY created_at DESC;
   ```

---

## 📁 Files Changed

### New Files
- ✅ `supabase/migrations/2025-12-31-01-fix-expired-order-recovery.sql`
- ✅ `docs/P0_EXPIRED_ORDER_RECOVERY.md` (full documentation)
- ✅ `docs/P0_EXPIRED_ORDER_FIX_SUMMARY.md` (implementation summary)
- ✅ `docs/P0_EXPIRED_ORDER_QUICK_REF.md` (quick reference)
- ✅ `docs/P0_EXPIRED_ORDER_FLOW.md` (flow diagrams)
- ✅ `DEPLOY_EXPIRED_ORDER_FIX.md` (this file)

### Modified Files
- ✅ `app/api/payments/create-session/route.ts` (passes Stripe expiry to RPC)

### Database Changes
- ✅ `orders` table: Added `reservation_released`, `slot_released_at`
- ✅ `orders` table: Added `paid_pending_resolution` to payment status
- ✅ RPC: `create_pending_order_with_slot()` updated
- ✅ RPC: `cleanup_expired_pending_orders()` updated
- ✅ RPC: `process_webhook_atomically()` updated

---

## 🚨 Rollback Plan (If Needed)

If something goes wrong:

1. **Revert code changes**:
   ```bash
   git revert HEAD
   git push origin main
   ```

2. **Revert database changes** (run in Supabase SQL Editor):
   ```sql
   -- Remove new columns
   ALTER TABLE orders 
     DROP COLUMN IF EXISTS reservation_released,
     DROP COLUMN IF EXISTS slot_released_at;
   
   -- Restore old payment status check
   ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_payment_status_check;
   ALTER TABLE orders ADD CONSTRAINT orders_payment_status_check 
     CHECK (payment_status IN ('pending', 'unpaid', 'paid', 'refunded', 'expired'));
   
   -- Revert RPC functions (copy from previous migration files)
   ```

3. **Verify**: Test that orders still work with old system

---

## ❓ FAQ

### Q: Will this affect existing orders?
**A**: No. Existing orders are unaffected. New columns default to `false`/`null`, and the webhook logic is backwards compatible.

### Q: What if a customer paid before this fix?
**A**: Use the admin recovery page (`/admin/recovery`) to manually create the order or issue a refund.

### Q: How often does cleanup run?
**A**: Every 5 minutes (configured in Supabase cron or Vercel cron).

### Q: What happens if cleanup hasn't run yet but order is expired?
**A**: Webhook checks both `payment_status = 'expired'` AND `expires_at < NOW()`, so it handles both cases.

### Q: Can I test this locally without waiting 30 minutes?
**A**: Yes! Manually set `expires_at` to a past time or `payment_status` to 'expired' in Supabase, then trigger the webhook.

---

## 📞 Support

If you encounter issues:

1. Check logs: Supabase → Logs → API Gateway
2. Check webhook events: `SELECT * FROM webhook_events ORDER BY created_at DESC LIMIT 10;`
3. Check alerts: `SELECT * FROM webhook_alerts ORDER BY created_at DESC LIMIT 10;`
4. Check order status: `SELECT * FROM orders WHERE order_number = 'XXX';`

---

## ✅ Success Criteria

After deployment, verify:

- [ ] New orders expire at 30 minutes (not 20)
- [ ] Webhook can find expired orders
- [ ] Slot counters stay accurate
- [ ] Admin recovery page shows alerts
- [ ] Late payments auto-recover (if slot available)
- [ ] Late payments alert admin (if slot full)

---

**Status**: ✅ Ready to deploy  
**Risk Level**: Low (backwards compatible)  
**Estimated Time**: 5 minutes  
**Rollback Time**: 2 minutes  

---

## 🎯 Deploy Now

```bash
# 1. Run migration in Supabase (copy/paste SQL file)
# 2. Verify columns added (run verification query)
# 3. Test locally (place order, check expires_at)
# 4. Commit and push (Vercel auto-deploys)
# 5. Run migration in production Supabase
# 6. Monitor /admin/recovery for alerts
```

**That's it!** The fix is live and protecting your customers. 🎉

