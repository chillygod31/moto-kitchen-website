# Post-Payment Order Failure - Prevention Guide

## What Happened (Dec 30, 2025)

### The Bug
The `book_time_slot` RPC function had an **ambiguous column reference** SQL error:

```sql
-- ❌ BROKEN VERSION
CREATE FUNCTION book_time_slot(p_slot_id UUID, p_tenant_id UUID)
RETURNS TABLE(id UUID, current_orders INT, max_orders INT) AS $$  -- ⚠️ "id" conflicts with time_slots.id
BEGIN
  RETURN QUERY
  UPDATE time_slots
  SET current_orders = current_orders + 1
  WHERE id = p_slot_id  -- ⚠️ Which "id"? Ambiguous!
    AND tenant_id = p_tenant_id
    AND is_active = true
    AND (current_orders < max_orders)
  RETURNING time_slots.id, time_slots.current_orders, time_slots.max_orders;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### The Impact
1. ✅ Customer completes Stripe checkout
2. ✅ Stripe processes payment successfully ($27.00 charged)
3. ❌ Webhook tries to book time slot → **RPC fails with SQL error**
4. ❌ Order never created in database
5. ❌ No confirmation emails sent
6. ✅ Customer redirected to success page (because Stripe said "paid")
7. ❌ Success page shows misleading "Order Confirmed!" message
8. 😡 **Customer thinks order is placed, but nothing exists in the system**

### The Fix
Renamed the return columns to avoid ambiguity:

```sql
-- ✅ FIXED VERSION
CREATE FUNCTION book_time_slot(p_slot_id UUID, p_tenant_id UUID)
RETURNS TABLE(slot_id UUID, new_current_orders INT, slot_max_orders INT) AS $$
BEGIN
  RETURN QUERY
  UPDATE time_slots
  SET current_orders = current_orders + 1
  WHERE time_slots.id = p_slot_id
    AND time_slots.tenant_id = p_tenant_id
    AND time_slots.is_active = true
    AND (time_slots.current_orders < time_slots.max_orders)
  RETURNING time_slots.id, time_slots.current_orders, time_slots.max_orders;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## How to Prevent This in Future

### 1. **Webhook Monitoring**
Set up alerts for webhook failures:
- Monitor `webhook_events.error_message IS NOT NULL`
- Alert if more than 2 webhooks fail within 10 minutes
- Check Stripe Dashboard → Webhooks → Event logs daily

### 2. **Database Constraints**
The system already has these safety nets:
- `orders.tenant_id + order_number` unique constraint (prevents duplicates)
- `time_slots` unique constraint on `(tenant_id, fulfillment_type, slot_time)`
- RLS policies to prevent cross-tenant data leaks

### 3. **Customer-Facing Error Handling** ✅ NOW FIXED
Before: If webhook failed, success page showed generic "Order Confirmed!" (misleading)

After: If webhook fails after 10 seconds:
- Shows **"Payment Processed — Order Pending"** page
- Explains payment was successful, order will be manually processed
- Displays payment reference ID
- Shows contact info (WhatsApp, email)
- Reassures customer: "Our team has been notified"

### 4. **Testing Webhooks Locally**
Always use Stripe CLI to test webhook flow:

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Forward webhooks to local
stripe listen --forward-to http://localhost:3000/api/payments/webhook

# Terminal 3: Trigger test webhook
stripe trigger checkout.session.completed
```

### 5. **SQL Function Best Practices**
When writing Postgres functions:
- ✅ **Always fully qualify table names** (`time_slots.id`, not just `id`)
- ✅ **Avoid generic return column names** (`slot_id` instead of `id`)
- ✅ **Test RPC functions directly** in Supabase SQL Editor before deploying
- ✅ **Add `SECURITY DEFINER` carefully** (bypasses RLS)

### 6. **Webhook Idempotency**
The webhook already checks for duplicates:
```typescript
// Check if order already exists (idempotency)
const { data: existingPayment } = await supabase
  .from('payments')
  .select('order_id')
  .eq('stripe_session_id', session.id)
  .single()

if (existingPayment) {
  logger.info('Order already exists for session', { sessionId: session.id })
  return NextResponse.json({ received: true, message: 'Order already exists' })
}
```

This prevents duplicate orders if the webhook is retried by Stripe.

---

## Monitoring Checklist

### Daily (for first 2 weeks after launch):
- [ ] Check Stripe Dashboard → Webhooks → Event logs (any failed events?)
- [ ] Check Supabase `webhook_events` table: `SELECT * FROM webhook_events WHERE error_message IS NOT NULL`
- [ ] Check `orders.email_status`: `SELECT COUNT(*) FROM orders WHERE email_status = 'failed'`

### Weekly:
- [ ] Review `orders` vs `payments` count: Should always match 1:1
  ```sql
  SELECT 
    (SELECT COUNT(*) FROM orders) as order_count,
    (SELECT COUNT(*) FROM payments WHERE status = 'completed') as payment_count;
  ```
- [ ] Check for orphaned payments (payment exists but no order):
  ```sql
  SELECT p.* 
  FROM payments p
  LEFT JOIN orders o ON o.id = p.order_id
  WHERE o.id IS NULL AND p.status = 'completed';
  ```

---

## Manual Recovery Process

If a customer reports "paid but no order":

1. **Find the Stripe session ID** from customer email or Stripe Dashboard
2. **Check if payment exists**:
   ```sql
   SELECT * FROM payments WHERE stripe_session_id = 'cs_test_...';
   ```
3. **Check webhook logs**:
   ```sql
   SELECT * FROM webhook_events 
   WHERE payload->>'id' LIKE '%session_id%'
   ORDER BY created_at DESC;
   ```
4. **If payment exists but no order**:
   - Use `/api/orders/[id]/send-confirmation` to manually trigger order creation
   - Or create order manually in admin panel
5. **Refund if necessary** via Stripe Dashboard

---

## Files Changed in This Fix

### Fixed Files:
1. `/supabase/migrations/fix-book-time-slot-rpc.sql` - Fixed RPC function
2. `/app/order/order-success/page.tsx` - Added proper error handling for failed orders
3. `/app/api/payments/webhook/route.ts` - Added detailed diagnostic logging

### Related Files:
- `/lib/email-templates.ts` - Email generation
- `/app/api/payments/create-session/route.ts` - Stripe checkout creation
- `/app/api/payments/verify-session/route.ts` - Order verification after payment

---

## Key Takeaway

**Never trust that the order was created just because Stripe said "paid".**

The order success page now properly handles this scenario and gives customers clear communication about what's happening and what they should expect.

