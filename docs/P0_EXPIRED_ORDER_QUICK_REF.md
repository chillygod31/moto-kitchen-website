# P0 Expired Order Recovery - Quick Reference

## 🚀 Deploy in 3 Steps

### 1. Run Migration (5 min)
```bash
# Open Supabase SQL Editor
# Copy/paste: supabase/migrations/2025-12-31-01-fix-expired-order-recovery.sql
# Click "Run"
```

### 2. Verify (1 min)
```sql
-- Check columns added
SELECT reservation_released, slot_released_at 
FROM orders 
LIMIT 1;

-- Should return columns (even if null)
```

### 3. Test (2 min)
```bash
# Place test order
# Check: Order expires_at should be ~30 min from now (not 20 min)
SELECT order_number, expires_at, NOW(), expires_at - NOW() as time_remaining
FROM orders 
WHERE payment_status = 'pending'
ORDER BY created_at DESC 
LIMIT 1;

-- time_remaining should be ~30 minutes
```

---

## 🐛 What Was Fixed

| Problem | Fix | Impact |
|---------|-----|--------|
| Webhook only looked for `pending` orders | Now looks for `pending` OR `expired` | Late payments (min 20-30) now work |
| Order expired at 20 min, Stripe at 30 min | Order expires at 30 min (from Stripe) | Gap eliminated |
| Slot counter could be wrong on recovery | Added `reservation_released` tracking | Counters stay accurate |
| No recovery path for full slots | Added `paid_pending_resolution` status | Manual recovery possible |

---

## 🔍 How to Spot Issues

### Normal (No Action Needed) ✅
```
Alert: "Customer paid after order expired but auto-recovered"
Severity: Medium
Action: None (review only)
```

### Requires Action 🚨
```
Alert: "Customer paid after order expired and slot is now full"
Severity: Critical
Status: paid_pending_resolution
Action: Go to /admin/recovery → Reschedule or Refund
```

### Should Never Happen ❌
```
Error: "No order found for session"
Action: Check migration ran correctly, check webhook logs
```

---

## 📊 Timeline Examples

### Scenario 1: Normal Payment
```
00:00 → Order created (expires 00:30)
00:15 → Customer pays ✅
        Webhook: Order 'pending' → 'paid' ✅
```

### Scenario 2: Late Payment (Slot Available)
```
00:00 → Order created (expires 00:30)
00:25 → Customer pays ✅
        Webhook: Order 'pending' → 'paid' ✅
        (No expiry because order expires at 30 min now)
```

### Scenario 3: Very Late Payment (Old Order, Slot Available)
```
00:00 → Order created (old system, expires 00:20)
00:21 → Cleanup: 'pending' → 'expired', slot released
00:25 → Customer pays ✅
        Webhook: Order 'expired' → 'paid' ✅
        Alert: "Auto-recovered" (medium)
```

### Scenario 4: Late Payment (Slot Full)
```
00:00 → Order created (old system, expires 00:20)
00:21 → Cleanup: 'pending' → 'expired', slot released
00:22 → Another customer books slot (now full)
00:25 → Original customer pays ✅
        Webhook: Order 'expired' → 'paid_pending_resolution' 🚨
        Alert: "Slot full - manual action required" (critical)
```

---

## 🧪 Quick Tests

### Test 1: Check Expiry Alignment
```sql
-- Place test order, then check:
SELECT 
  order_number,
  expires_at,
  EXTRACT(EPOCH FROM (expires_at - created_at))/60 as minutes_until_expiry
FROM orders 
WHERE payment_status = 'pending'
ORDER BY created_at DESC 
LIMIT 1;

-- minutes_until_expiry should be ~30 (not 20)
```

### Test 2: Check Reservation Tracking
```sql
-- After cleanup runs:
SELECT 
  order_number,
  payment_status,
  reservation_released,
  slot_released_at
FROM orders 
WHERE payment_status = 'expired'
ORDER BY created_at DESC 
LIMIT 5;

-- reservation_released should be true for expired orders
```

### Test 3: Check Webhook Finds Expired Orders
```sql
-- Manually expire an order:
UPDATE orders 
SET payment_status = 'expired', reservation_released = true
WHERE order_number = 'YOUR_TEST_ORDER';

-- Then trigger webhook (complete payment in Stripe)
-- Order should be found and processed (check webhook_events table)
```

---

## 📁 Files Changed

```
✅ supabase/migrations/2025-12-31-01-fix-expired-order-recovery.sql (NEW)
✅ app/api/payments/create-session/route.ts (MODIFIED)
✅ docs/P0_EXPIRED_ORDER_RECOVERY.md (NEW)
✅ docs/P0_EXPIRED_ORDER_FIX_SUMMARY.md (NEW)
✅ docs/P0_EXPIRED_ORDER_QUICK_REF.md (NEW - this file)
```

---

## 🔗 Full Documentation

- **Overview**: `docs/P0_EXPIRED_ORDER_RECOVERY.md`
- **Implementation**: `docs/P0_EXPIRED_ORDER_FIX_SUMMARY.md`
- **Quick Ref**: `docs/P0_EXPIRED_ORDER_QUICK_REF.md` (this file)

---

## ✅ Checklist

- [ ] Migration run in Supabase
- [ ] Columns verified (`reservation_released`, `slot_released_at`)
- [ ] Test order expires at 30 min (not 20 min)
- [ ] Test webhook finds expired orders
- [ ] Test slot counter stays accurate
- [ ] Admin recovery page shows alerts
- [ ] Deploy to production

---

**Status**: Ready to deploy  
**Risk**: Low (backwards compatible)  
**Time**: 5 minutes  

**Questions?** Check the full docs or test locally first.

