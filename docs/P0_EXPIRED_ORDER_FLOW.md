# P0 Expired Order Recovery - Flow Diagrams

## 🔄 Complete Flow: Before vs After Fix

### ❌ BEFORE FIX (Broken)

```
┌─────────────────────────────────────────────────────────────────┐
│ Customer Journey                                                 │
└─────────────────────────────────────────────────────────────────┘

Minute 0:  Customer clicks "Pay with Stripe"
           ├─→ Stripe session created (expires: 30 min)
           └─→ Pending order created (expires: 20 min) ⚠️ MISMATCH
                └─→ Slot counter incremented (+1)

Minute 15: Customer still on Stripe payment page...

Minute 20: ⏰ Order expires
           └─→ Cleanup job runs
                ├─→ Order: 'pending' → 'expired'
                └─→ Slot counter decremented (-1)

Minute 25: Customer finally clicks "Pay" ✅
           └─→ Stripe: Payment successful
                └─→ Redirect to success page
                     └─→ Shows "Processing..." (polling for order)

           ⚡ Webhook arrives at /api/payments/webhook
           ├─→ Looks for: WHERE payment_status = 'pending'
           ├─→ ❌ NOT FOUND (order is 'expired', not 'pending')
           └─→ ❌ EXCEPTION: "No pending order found"
                ├─→ Returns 500 to Stripe
                ├─→ Stripe retries (but keeps failing)
                └─→ Admin alert sent 🚨

Minute 26: Success page times out
           └─→ Shows "Order Confirmed!" ❌ LIE
                └─→ Customer thinks order placed
                └─→ Restaurant has no order
                └─→ 💥 CRITICAL FAILURE

Minute 30: Stripe session expires
           └─→ Stripe stops retrying webhook
                └─→ Order lost forever
```

---

### ✅ AFTER FIX (Working)

```
┌─────────────────────────────────────────────────────────────────┐
│ Customer Journey                                                 │
└─────────────────────────────────────────────────────────────────┘

Minute 0:  Customer clicks "Pay with Stripe"
           ├─→ Stripe session created (expires: 30 min)
           └─→ Pending order created (expires: 30 min) ✅ ALIGNED
                ├─→ expires_at = Stripe session expires_at
                ├─→ reservation_released = false
                └─→ Slot counter incremented (+1)

Minute 15: Customer still on Stripe payment page...

Minute 25: Customer finally clicks "Pay" ✅
           └─→ Stripe: Payment successful
                └─→ Redirect to success page
                     └─→ Shows "Processing..." (polling for order)

           ⚡ Webhook arrives at /api/payments/webhook
           ├─→ Looks for: WHERE payment_status IN ('pending', 'expired') ✅
           ├─→ ✅ FOUND (order is 'pending')
           ├─→ Slot available? ✅ Yes
           └─→ ✅ SUCCESS
                ├─→ Order: 'pending' → 'paid'
                ├─→ Payment record created
                ├─→ Emails queued
                └─→ Webhook marked processed

Minute 26: Success page receives order
           └─→ Shows "Order Confirmed!" ✅ TRUTH
                ├─→ Order number: #12345
                ├─→ Timeline shown
                └─→ ✅ HAPPY CUSTOMER

Minute 30: Stripe session expires (no longer needed)
```

---

## 🔄 Edge Case: Late Payment After Cleanup

### Scenario: Customer Pays After Old Order Expired

```
┌─────────────────────────────────────────────────────────────────┐
│ Edge Case: Old Order (20-min expiry) + Late Payment             │
└─────────────────────────────────────────────────────────────────┘

Minute 0:  OLD order created (expires: 20 min) ⚠️ Old system
           └─→ Slot counter incremented (+1)

Minute 20: ⏰ Order expires
           └─→ Cleanup job runs
                ├─→ Order: 'pending' → 'expired'
                ├─→ reservation_released = true ✅
                ├─→ slot_released_at = NOW()
                └─→ Slot counter decremented (-1)

Minute 25: Customer pays ✅
           
           ⚡ Webhook arrives
           ├─→ Looks for: WHERE payment_status IN ('pending', 'expired') ✅
           ├─→ ✅ FOUND (order is 'expired')
           ├─→ Check: reservation_released? ✅ true
           └─→ Check: Slot available?
                
                ┌─────────────────────────────────────────────────┐
                │ BRANCH A: Slot Still Available                  │
                └─────────────────────────────────────────────────┘
                ├─→ ✅ Slot available
                ├─→ Re-book slot (counter +1) ✅
                ├─→ Order: 'expired' → 'paid'
                ├─→ Alert: "Auto-recovered" (medium severity)
                └─→ Emails queued
                     └─→ ✅ Order confirmed
                
                ┌─────────────────────────────────────────────────┐
                │ BRANCH B: Slot Now Full                         │
                └─────────────────────────────────────────────────┘
                ├─→ ❌ Slot full (another customer booked it)
                ├─→ Order: 'expired' → 'paid_pending_resolution' 🚨
                ├─→ Alert: "Slot full - manual action" (CRITICAL)
                ├─→ Emails queued (marked pending resolution)
                └─→ Admin must choose:
                     ├─→ Option 1: Reschedule to next slot
                     └─→ Option 2: Refund with apology
```

---

## 🔍 Slot Counter Tracking

### How `reservation_released` Prevents Double-Counting

```
┌─────────────────────────────────────────────────────────────────┐
│ Slot Counter Lifecycle                                           │
└─────────────────────────────────────────────────────────────────┘

INITIAL STATE:
  Slot: current_orders = 5, max_orders = 10
  Order: payment_status = 'pending', reservation_released = false

─────────────────────────────────────────────────────────────────

SCENARIO 1: Normal Payment (No Expiry)
  
  Minute 10: Customer pays
             ├─→ Webhook: Order 'pending' → 'paid'
             ├─→ Slot counter: NO CHANGE (already counted at creation)
             └─→ reservation_released: stays false
  
  Result: Slot counter = 5 ✅ Correct

─────────────────────────────────────────────────────────────────

SCENARIO 2: Order Expires, Then Customer Pays

  Minute 21: Cleanup runs
             ├─→ Order: 'pending' → 'expired'
             ├─→ reservation_released = true ✅
             ├─→ slot_released_at = NOW()
             └─→ Slot counter: 5 → 4 (decremented)
  
  Minute 25: Customer pays
             ├─→ Webhook: Order 'expired' → 'paid'
             ├─→ Check: reservation_released? ✅ true
             ├─→ Slot counter: 4 → 5 (re-incremented) ✅
             └─→ Result: Slot counter = 5 ✅ Correct

─────────────────────────────────────────────────────────────────

SCENARIO 3: Order Expires (Cleanup Hasn't Run Yet), Then Customer Pays

  Minute 20: Order expires_at reached (but cleanup hasn't run yet)
  
  Minute 21: Customer pays (before cleanup)
             ├─→ Webhook: Order 'pending' → 'paid'
             ├─→ Check: reservation_released? ❌ false
             ├─→ Slot counter: NO CHANGE ✅ Correct
             └─→ Result: Slot counter = 5 ✅ Correct
  
  Minute 22: Cleanup runs
             ├─→ Finds order with payment_status = 'paid'
             └─→ Skips it (only processes 'pending' orders)
```

---

## 🎯 Decision Tree: Webhook Processing

```
┌─────────────────────────────────────────────────────────────────┐
│ Webhook: process_webhook_atomically()                           │
└─────────────────────────────────────────────────────────────────┘

START
  │
  ├─→ Check: Event already processed?
  │   ├─→ YES: Check order is paid?
  │   │   ├─→ YES: Return 'already_processed' ✅
  │   │   └─→ NO: RAISE EXCEPTION (previous webhook failed) 🚨
  │   └─→ NO: Continue...
  │
  ├─→ Find order: WHERE payment_status IN ('pending', 'expired')
  │   ├─→ NOT FOUND: RAISE EXCEPTION 🚨
  │   └─→ FOUND: Continue...
  │
  ├─→ Check: Order expired?
  │   │
  │   ├─→ NO (payment_status = 'pending', expires_at > NOW)
  │   │   └─→ NORMAL FLOW
  │   │        ├─→ Order: 'pending' → 'paid'
  │   │        ├─→ Slot counter: NO CHANGE
  │   │        ├─→ Queue emails
  │   │        └─→ Return 'success' ✅
  │   │
  │   └─→ YES (payment_status = 'expired' OR expires_at < NOW)
  │        │
  │        ├─→ Check: Slot available?
  │        │   │
  │        │   ├─→ YES (slot not full, is_active = true)
  │        │   │   └─→ AUTO-RECOVERY FLOW
  │        │   │        ├─→ Check: reservation_released?
  │        │   │        │   ├─→ YES: Re-book slot (counter +1)
  │        │   │        │   └─→ NO: Don't increment (already counted)
  │        │   │        ├─→ Order: 'expired' → 'paid'
  │        │   │        ├─→ Alert: "Auto-recovered" (medium)
  │        │   │        ├─→ Queue emails
  │        │   │        └─→ Return 'success' (was_expired=true) ✅
  │        │   │
  │        │   └─→ NO (slot full or inactive)
  │        │        └─→ MANUAL RESOLUTION FLOW
  │        │             ├─→ Order: 'expired' → 'paid_pending_resolution' 🚨
  │        │             ├─→ Alert: "Slot full - manual action" (CRITICAL)
  │        │             ├─→ Queue emails (marked pending resolution)
  │        │             └─→ Return 'paid_pending_resolution' 🚨
  │        │
  │        └─→ No slot assigned (delivery order)
  │             └─→ Order: 'expired' → 'paid'
  │                  ├─→ Alert: "Paid after expiry" (medium)
  │                  └─→ Return 'success' ✅
  │
  └─→ Mark webhook processed
       └─→ END
```

---

## 📊 Status Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ Order Payment Status Lifecycle                                   │
└─────────────────────────────────────────────────────────────────┘

                    ┌─────────────┐
                    │   pending   │ ← Order created
                    └──────┬──────┘
                           │
           ┌───────────────┼───────────────┐
           │               │               │
           │ (expires)     │ (pays)        │ (cancels)
           ▼               ▼               ▼
      ┌─────────┐    ┌─────────┐    ┌─────────┐
      │ expired │    │  paid   │    │ unpaid  │
      └────┬────┘    └────┬────┘    └─────────┘
           │              │
           │ (pays late)  │ (refund)
           │              │
           ▼              ▼
    ┌──────────────┐ ┌──────────┐
    │ paid (auto)  │ │ refunded │
    └──────────────┘ └──────────┘
           │
           │ (slot full)
           ▼
    ┌────────────────────────┐
    │ paid_pending_resolution│ 🚨 Manual action required
    └───────────┬────────────┘
                │
        ┌───────┴────────┐
        │                │
        │ (reschedule)   │ (refund)
        ▼                ▼
    ┌─────────┐    ┌──────────┐
    │  paid   │    │ refunded │
    └─────────┘    └──────────┘
```

---

## 🔧 Database State Changes

### Normal Payment Flow

```sql
-- T0: Order created
INSERT INTO orders (
  payment_status,      -- 'pending'
  expires_at,          -- NOW() + 30 min (from Stripe)
  reservation_released -- false
);

UPDATE time_slots SET current_orders = current_orders + 1;

-- T1: Customer pays (minute 10)
-- Webhook arrives
UPDATE orders SET 
  payment_status = 'paid',
  expires_at = NULL;
-- Slot counter: NO CHANGE (already counted)
```

### Expired Order Auto-Recovery Flow

```sql
-- T0: Order created (old system, 20-min expiry)
INSERT INTO orders (
  payment_status,      -- 'pending'
  expires_at,          -- NOW() + 20 min (old)
  reservation_released -- false
);

UPDATE time_slots SET current_orders = current_orders + 1;

-- T1: Cleanup runs (minute 21)
UPDATE orders SET 
  payment_status = 'expired',
  reservation_released = true,
  slot_released_at = NOW();

UPDATE time_slots SET current_orders = current_orders - 1;

-- T2: Customer pays (minute 25)
-- Webhook arrives
UPDATE orders SET 
  payment_status = 'paid',
  expires_at = NULL;

-- Check: reservation_released = true, so re-book
UPDATE time_slots SET current_orders = current_orders + 1;
```

### Manual Resolution Flow (Slot Full)

```sql
-- T0: Order created
-- T1: Cleanup releases slot
-- T2: Another customer books slot (now full)
-- T3: Original customer pays (minute 25)

-- Webhook arrives
UPDATE orders SET 
  payment_status = 'paid_pending_resolution',  -- 🚨 Not 'paid'
  expires_at = NULL;

-- Slot counter: NO CHANGE (slot is full)

INSERT INTO webhook_alerts (
  alert_type, severity, error_message
) VALUES (
  'expired_order_paid', 'critical',
  'Customer paid after order expired and slot is now full'
);

-- Admin must manually:
-- Option 1: Reschedule
UPDATE orders SET 
  payment_status = 'paid',
  time_slot_id = 'new_slot_id';

-- Option 2: Refund
UPDATE orders SET payment_status = 'refunded';
-- (Also issue Stripe refund via API)
```

---

## ✅ Summary

| Fix | Before | After |
|-----|--------|-------|
| **Expiry Gap** | Order: 20 min, Stripe: 30 min | Both: 30 min ✅ |
| **Webhook Lookup** | `= 'pending'` | `IN ('pending', 'expired')` ✅ |
| **Slot Tracking** | None | `reservation_released` flag ✅ |
| **Manual Recovery** | None | `paid_pending_resolution` status ✅ |
| **Customer Impact** | "No order found" error | Auto-recovery or manual resolution ✅ |

---

**Result**: No more lost orders due to late payments! 🎉

