# P0 Payment Safety: Expired Order Recovery Fix

## 🚨 Critical Bug Fixed

**Problem**: Customers who paid between minutes 20-30 would have their payment accepted by Stripe, but the webhook would fail to create an order because:
1. Order expired at 20 minutes (cleanup marked it as 'expired')
2. Stripe session expired at 30 minutes (customer could still pay)
3. Webhook only looked for `payment_status = 'pending'`, not 'expired'
4. Result: Payment succeeded, no order created, customer confused

---

## ✅ The 3-Part Fix

### Fix 1: Webhook Finds Orders Regardless of Status

**Before:**
```sql
WHERE payment_status = 'pending'  -- ❌ Missed expired orders
```

**After:**
```sql
WHERE payment_status IN ('pending', 'expired')  -- ✅ Finds both
```

**Impact**: Webhook can now process late payments (minutes 20-30) instead of failing.

---

### Fix 2: Align Expiry Times (Eliminate the Gap)

**Before:**
- Order expiry: 20 minutes (hardcoded)
- Stripe expiry: 30 minutes (hardcoded)
- **Gap**: 10-minute window where customer can pay but order is expired

**After:**
- Order expiry: **Uses Stripe session `expires_at`** (30 minutes)
- Stripe expiry: 30 minutes
- **Gap**: Eliminated ✅

**Implementation:**
```typescript
// create-session/route.ts
const stripeExpiresAt = new Date(stripeSession.expires_at * 1000).toISOString()

await supabase.rpc('create_pending_order_with_slot', {
  p_stripe_expires_at: stripeExpiresAt  // ✅ Pass Stripe expiry to order
})
```

**Result**: Orders and Stripe sessions expire at the same time, preventing the gap.

---

### Fix 3: Prevent Double-Counting Slot Capacity

**Problem**: If cleanup releases a slot at minute 21, and webhook re-books it at minute 25, we need to track whether the reservation was already released.

**Solution**: Add reservation tracking fields:
- `reservation_released` (boolean): Has the slot been released by cleanup?
- `slot_released_at` (timestamp): When was it released?

**Logic:**
```sql
-- Cleanup function (minute 21)
UPDATE orders
SET 
  payment_status = 'expired',
  reservation_released = true,     -- ✅ Mark as released
  slot_released_at = NOW()
WHERE payment_status = 'pending' AND expires_at < NOW();

UPDATE time_slots
SET current_orders = current_orders - 1  -- Decrement counter
WHERE id IN (SELECT time_slot_id FROM expired_orders);
```

```sql
-- Webhook function (minute 25)
IF v_reservation_released = true THEN
  -- Slot was released by cleanup, so re-book it
  UPDATE time_slots
  SET current_orders = current_orders + 1  -- ✅ Re-increment
  WHERE id = v_slot_id;
ELSE
  -- Slot was never released, so don't increment again
  -- (order expired but cleanup hasn't run yet)
END IF;
```

**Result**: Slot counters stay accurate even with late payments.

---

## 🔄 Recovery Scenarios

### Scenario 1: Customer Pays Late, Slot Still Available ✅

```
Minute 0:  Order created (expires_at = minute 30)
Minute 25: Customer pays
           ↓
Webhook:   Finds order (status='pending')
           Slot available? Yes
           Action: Mark as 'paid', send emails
           Result: ✅ Order confirmed normally
```

### Scenario 2: Customer Pays After Expiry, Slot Still Available ✅

```
Minute 0:  Order created (expires_at = minute 30)
Minute 20: (Hypothetical early expiry for old orders)
Minute 21: Cleanup runs
           → Order marked 'expired'
           → Slot counter decremented
           → reservation_released = true
Minute 25: Customer pays
           ↓
Webhook:   Finds order (status='expired')
           Slot available? Yes
           Action: Re-book slot, mark as 'paid', send emails
           Alert: "Customer paid after expiry but auto-recovered"
           Result: ✅ Order confirmed with alert
```

### Scenario 3: Customer Pays After Expiry, Slot Now Full 🚨

```
Minute 0:  Order created (expires_at = minute 30)
Minute 21: Cleanup runs → slot released
Minute 22: Another customer books the slot (now full)
Minute 25: Original customer pays
           ↓
Webhook:   Finds order (status='expired')
           Slot available? No (full)
           Action: Mark as 'paid_pending_resolution'
           Alert: CRITICAL - requires manual action
           Options: 
             1. Reschedule to next available slot (with customer confirmation)
             2. Refund with apology
           Result: 🚨 Manual intervention required
```

---

## 🆕 New Payment Status: `paid_pending_resolution`

**When Used**: Customer paid successfully, but order cannot be fulfilled automatically (e.g., slot is now full).

**What Happens**:
1. Order marked as `paid_pending_resolution`
2. Payment recorded in Stripe ✅
3. Critical alert sent to admin 🚨
4. Emails queued but marked as "pending resolution"
5. Admin must choose action:
   - **Reschedule**: Move to next available slot, notify customer
   - **Refund**: Issue refund, send apology email

**Admin UI** (`/admin/recovery`):
```tsx
<div className="alert-card critical">
  <h3>⚠️ Payment Accepted - Slot Full</h3>
  <p>Order #{order_number}</p>
  <p>Customer: {customer_name} ({customer_email})</p>
  <p>Original slot: {slot_time} (now full)</p>
  <p>Amount: €{total}</p>
  
  <div className="actions">
    <button onClick={() => rescheduleOrder(order_id)}>
      📅 Reschedule to Next Slot
    </button>
    <button onClick={() => refundOrder(order_id)}>
      💰 Issue Refund
    </button>
  </div>
</div>
```

---

## 📊 Database Changes

### New Columns on `orders` Table

```sql
ALTER TABLE orders
  ADD COLUMN reservation_released BOOLEAN DEFAULT false,
  ADD COLUMN slot_released_at TIMESTAMP WITH TIME ZONE;
```

### New Payment Status

```sql
ALTER TABLE orders
  ADD CONSTRAINT orders_payment_status_check 
  CHECK (payment_status IN (
    'pending', 
    'unpaid', 
    'paid', 
    'refunded', 
    'expired', 
    'paid_pending_resolution'  -- ✅ New status
  ));
```

---

## 🧪 Testing Scenarios

### Test 1: Normal Payment (No Expiry)
```bash
# Customer pays within 30 minutes
✅ Expected: Order marked 'paid', emails sent, slot counted
```

### Test 2: Late Payment (Slot Available)
```bash
# Simulate: Manually mark order as 'expired' before webhook
UPDATE orders SET payment_status = 'expired', reservation_released = true WHERE id = '...';

# Then trigger webhook
✅ Expected: Order marked 'paid', alert logged, slot re-booked
```

### Test 3: Late Payment (Slot Full)
```bash
# Simulate: Mark order expired AND fill the slot
UPDATE orders SET payment_status = 'expired', reservation_released = true WHERE id = '...';
UPDATE time_slots SET current_orders = max_orders WHERE id = '...';

# Then trigger webhook
✅ Expected: Order marked 'paid_pending_resolution', critical alert sent
```

### Test 4: Duplicate Webhook (Already Paid)
```bash
# Replay same webhook event
✅ Expected: Returns 'already_processed', no duplicate order
```

### Test 5: Duplicate Webhook (Failed Previously)
```bash
# Simulate: Event exists but order not paid
INSERT INTO webhook_events (stripe_event_id, processed) VALUES ('evt_123', false);

# Then send webhook
✅ Expected: Raises exception, sends critical alert, retries
```

---

## 🔍 Monitoring & Alerts

### Alert Types

| Alert Type | Severity | Trigger | Action Required |
|------------|----------|---------|-----------------|
| `expired_order_paid` (auto-recovered) | Medium | Customer paid late but slot available | Review only |
| `expired_order_paid` (slot full) | **Critical** | Customer paid late, slot now full | **Manual action required** |
| `webhook_failure` | **Critical** | Any webhook processing error | Investigate immediately |

### Admin Dashboard Indicators

```tsx
// /admin/dashboard
<AlertBanner>
  🚨 3 orders require manual resolution
  <Link href="/admin/recovery">Resolve Now</Link>
</AlertBanner>
```

---

## 📋 Deployment Checklist

- [ ] Run migration: `2025-12-31-01-fix-expired-order-recovery.sql`
- [ ] Verify new columns exist: `reservation_released`, `slot_released_at`
- [ ] Verify new status allowed: `paid_pending_resolution`
- [ ] Test webhook with expired order (slot available)
- [ ] Test webhook with expired order (slot full)
- [ ] Verify admin recovery UI shows critical alerts
- [ ] Verify emails still send for `paid_pending_resolution` orders
- [ ] Test Stripe expiry alignment (order expires at 30 min, not 20 min)

---

## 🎯 Success Criteria

✅ **No more "Payment succeeded but no order" incidents**
- Webhook finds orders regardless of pending/expired status

✅ **No more 10-minute gap between order/Stripe expiry**
- Orders use Stripe `expires_at` (30 minutes)

✅ **Slot counters stay accurate**
- Reservation tracking prevents double-counting

✅ **Manual recovery path for edge cases**
- `paid_pending_resolution` status + admin UI for reschedule/refund

✅ **Full visibility into late payments**
- Alerts logged for all expired order scenarios

---

## 🔗 Related Documentation

- [PAYMENTS_TRUTH.md](../PAYMENTS_TRUTH.md) - Payment system contract
- [P0_IMPLEMENTATION_COMPLETE.md](./P0_IMPLEMENTATION_COMPLETE.md) - Full P0 safety system
- [P0_SAFETY_VERIFICATION.md](./P0_SAFETY_VERIFICATION.md) - Webhook safety analysis
- [POST_PAYMENT_ORDER_FAILURE.md](./POST_PAYMENT_ORDER_FAILURE.md) - Original incident report

---

## 🚀 What Changed vs. Original P0 Plan

| Original Plan | This Fix |
|---------------|----------|
| Order expiry: 20 min (hardcoded) | Order expiry: 30 min (from Stripe) ✅ |
| Webhook looks for 'pending' only | Webhook looks for 'pending' OR 'expired' ✅ |
| No slot reservation tracking | Added `reservation_released` flag ✅ |
| No recovery path for full slots | Added `paid_pending_resolution` status ✅ |
| Silent failure on late payment | Critical alerts + admin UI ✅ |

---

**Last Updated**: 2025-12-31  
**Status**: ✅ Ready for deployment  
**Approved By**: Owner (based on user feedback)

