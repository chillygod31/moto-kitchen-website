# P0 Payment Safety - Manual Testing Guide

This guide walks through manual testing of the P0 Payment Safety system using Stripe CLI and the local development environment.

## Prerequisites

1. **Migrations Applied**: Run all 4 P0 migrations in Supabase
2. **Environment Variables Set**:
   ```bash
   ADMIN_ALERT_EMAIL=chilechhaa@gmail.com
   CRON_SECRET=<your-secure-random-string>
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   RESEND_API_KEY=re_...
   RESEND_FROM_EMAIL=orders@motokitchen.nl
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

3. **Stripe CLI Installed and Running**:
   ```bash
   stripe listen --forward-to http://localhost:3000/api/payments/webhook
   ```

4. **Dev Server Running**:
   ```bash
   npm run dev
   ```

## Test Scenario 1: Happy Path - Successful Payment

**Goal**: Verify the complete flow from checkout to order confirmation.

### Steps:

1. **Add items to cart**:
   - Go to `http://localhost:3000/order`
   - Add at least one item to cart
   - Click "Checkout"

2. **Fill checkout form**:
   - Customer Name: Test Customer
   - Email: test@example.com
   - Phone: +31612345678
   - Select pickup or delivery
   - Select a time slot (if pickup)

3. **Create Stripe session**:
   - Click "Pay with Stripe"
   - Verify you're redirected to Stripe Checkout

4. **Complete payment**:
   - Use test card: `4242 4242 4242 4242`
   - Expiry: Any future date
   - CVC: Any 3 digits
   - Complete payment

5. **Verify webhook processing**:
   - Check Stripe CLI logs for `checkout.session.completed` event
   - Check terminal logs for webhook processing

6. **Verify order success page**:
   - Should show "Order Confirmed!" (not "Processing...")
   - Should display order number
   - Should show order details (items, total, pickup/delivery info)
   - Should show 3-step timeline

7. **Verify database**:
   ```sql
   SELECT * FROM orders WHERE payment_status = 'paid' ORDER BY created_at DESC LIMIT 1;
   SELECT * FROM email_queue WHERE order_id = '<order_id>';
   SELECT * FROM webhook_events ORDER BY created_at DESC LIMIT 1;
   ```

8. **Verify emails queued**:
   - Check `email_queue` table
   - Should have entries for customer_confirmation and admin_alert

### Expected Results:
- ✅ Pending order created before redirect
- ✅ Stripe session created successfully
- ✅ Webhook processed successfully
- ✅ Order status: `paid`
- ✅ Emails queued
- ✅ Success page shows order details
- ✅ No alerts in `webhook_alerts` table

---

## Test Scenario 2: Pending Order Expiry

**Goal**: Verify that pending orders expire and slot counters are decremented.

### Steps:

1. **Create a pending order** (complete checkout but don't pay):
   - Add items to cart
   - Go to checkout
   - Fill form and click "Pay with Stripe"
   - **Close the Stripe Checkout tab immediately** (don't complete payment)

2. **Verify pending order created**:
   ```sql
   SELECT * FROM orders WHERE payment_status = 'pending' ORDER BY created_at DESC LIMIT 1;
   ```
   - Note the `order_id`, `time_slot_id`, and `expires_at`

3. **Check slot counter incremented**:
   ```sql
   SELECT * FROM time_slots WHERE id = '<time_slot_id>';
   ```
   - `current_orders` should have increased by 1

4. **Wait for expiry** (or manually expire):
   ```sql
   UPDATE orders 
   SET expires_at = NOW() - INTERVAL '1 minute' 
   WHERE id = '<order_id>';
   ```

5. **Manually trigger cleanup**:
   ```bash
   curl -X POST http://localhost:3000/api/cron/cleanup-pending-orders \
     -H "Authorization: Bearer $CRON_SECRET" \
     -H "Content-Type: application/json"
   ```

6. **Verify order expired**:
   ```sql
   SELECT * FROM orders WHERE id = '<order_id>';
   ```
   - `payment_status` should be `expired`

7. **Verify slot counter decremented**:
   ```sql
   SELECT * FROM time_slots WHERE id = '<time_slot_id>';
   ```
   - `current_orders` should have decreased by 1

### Expected Results:
- ✅ Pending order created
- ✅ Slot counter incremented
- ✅ After expiry + cleanup: order status = `expired`
- ✅ Slot counter decremented back
- ✅ No orphaned slot reservations

---

## Test Scenario 3: Payment After Expiry (Auto-Recovery)

**Goal**: Verify that if a customer pays after their order expires, the system auto-recovers if the slot is still available.

### Steps:

1. **Create pending order and let it expire**:
   - Follow Scenario 2 steps 1-4
   - Run cleanup to mark as expired

2. **Verify slot still has capacity**:
   ```sql
   SELECT * FROM time_slots WHERE id = '<time_slot_id>';
   ```
   - Ensure `current_orders < max_orders`

3. **Manually trigger webhook** (simulating late payment):
   ```sql
   SELECT process_webhook_atomically(
     'evt_manual_test_recovery',
     '<stripe_session_id>',
     'pi_manual_test_recovery',
     '<tenant_id>'
   );
   ```

4. **Verify auto-recovery**:
   ```sql
   SELECT * FROM orders WHERE id = '<order_id>';
   ```
   - `payment_status` should be `paid`

5. **Verify slot re-booked**:
   ```sql
   SELECT * FROM time_slots WHERE id = '<time_slot_id>';
   ```
   - `current_orders` should have increased by 1 again

6. **Check for medium-severity alert**:
   ```sql
   SELECT * FROM webhook_alerts WHERE order_id = '<order_id>';
   ```
   - Should have `severity = 'medium'` and `auto_recovered = true`

### Expected Results:
- ✅ Order paid successfully despite expiry
- ✅ Slot re-booked atomically
- ✅ Medium-severity alert logged (for monitoring)
- ✅ Emails queued
- ✅ No customer impact

---

## Test Scenario 4: Payment After Expiry (Slot Full - Critical Alert)

**Goal**: Verify that if a customer pays after expiry and the slot is now full, a critical alert is created.

### Steps:

1. **Create pending order and let it expire**:
   - Follow Scenario 2 steps 1-4

2. **Fill the slot completely**:
   ```sql
   UPDATE time_slots 
   SET current_orders = max_orders 
   WHERE id = '<time_slot_id>';
   ```

3. **Attempt to process webhook**:
   ```sql
   SELECT process_webhook_atomically(
     'evt_manual_test_critical',
     '<stripe_session_id>',
     'pi_manual_test_critical',
     '<tenant_id>'
   );
   ```
   - This should **fail** with an error

4. **Verify critical alert created**:
   ```sql
   SELECT * FROM webhook_alerts 
   WHERE session_id = '<stripe_session_id>' 
   AND severity = 'critical';
   ```
   - Should have `requires_refund = true`

5. **Verify admin alert email sent**:
   - Check your email at `chilechhaa@gmail.com`
   - Subject should be: "🚨 URGENT: Payment Completed But Order Failed"

### Expected Results:
- ✅ Webhook fails (returns 500 to Stripe)
- ✅ Critical alert logged
- ✅ Admin email sent immediately
- ✅ Order remains in `pending` state (not marked as paid)
- ✅ Stripe will retry webhook automatically

---

## Test Scenario 5: Admin Recovery Workflow

**Goal**: Verify that admins can manually recover failed payments.

### Steps:

1. **Create a critical alert** (use Scenario 4)

2. **Navigate to admin recovery page**:
   - Go to `http://localhost:3000/admin/recovery`
   - You should see the critical alert

3. **Test recovery action**:
   - Click "Create Order + Send Email"
   - Verify success message

4. **Verify order created**:
   ```sql
   SELECT * FROM orders WHERE stripe_session_id = '<session_id>';
   ```
   - Order should now exist with `payment_status = 'paid'`

5. **Verify alert acknowledged**:
   ```sql
   SELECT * FROM webhook_alerts WHERE session_id = '<session_id>';
   ```
   - `acknowledged` should be `true`

6. **Test refund action** (optional):
   - For a different failed payment, click "Issue Refund"
   - Verify refund issued in Stripe Dashboard

### Expected Results:
- ✅ Admin can view all unresolved alerts
- ✅ Recovery creates order + queues emails
- ✅ Alert is marked as acknowledged
- ✅ Refunds work correctly
- ✅ Links to Stripe Dashboard work

---

## Test Scenario 6: Webhook Deduplication

**Goal**: Verify that replaying the same webhook doesn't create duplicate orders.

### Steps:

1. **Complete a successful payment** (Scenario 1)

2. **Get the Stripe event ID** from webhook_events table:
   ```sql
   SELECT * FROM webhook_events ORDER BY created_at DESC LIMIT 1;
   ```

3. **Replay the webhook** (using Stripe CLI):
   ```bash
   stripe events resend <event_id>
   ```

4. **Check logs**:
   - Should see "already_processed" in logs

5. **Verify no duplicate order**:
   ```sql
   SELECT COUNT(*) FROM orders WHERE stripe_session_id = '<session_id>';
   ```
   - Count should be 1

### Expected Results:
- ✅ Second webhook returns "already_processed"
- ✅ No duplicate order created
- ✅ No duplicate emails queued
- ✅ Slot counter not incremented twice

---

## Test Scenario 7: Email Queue Processing

**Goal**: Verify that queued emails are sent by the cron job.

### Steps:

1. **Complete a payment** (queues emails)

2. **Manually trigger email processor**:
   ```bash
   curl -X POST http://localhost:3000/api/cron/process-email-queue \
     -H "Authorization: Bearer $CRON_SECRET" \
     -H "Content-Type: application/json"
   ```

3. **Check response**:
   - Should show `success_count: 2` (customer + admin emails)

4. **Verify emails sent**:
   ```sql
   SELECT * FROM email_queue WHERE order_id = '<order_id>';
   ```
   - `status` should be `sent`
   - `sent_at` should be populated

5. **Check order email status**:
   ```sql
   SELECT email_status FROM orders WHERE id = '<order_id>';
   ```
   - Should be `sent`

6. **Verify email received**:
   - Check `chilechhaa@gmail.com` (with TEST_EMAIL_REDIRECT)
   - Should receive both customer and admin emails

### Expected Results:
- ✅ Email processor sends queued emails
- ✅ Email queue status updated
- ✅ Order email_status updated
- ✅ Emails received
- ✅ Cron job logged to `cron_job_runs`

---

## Test Scenario 8: Health Check Endpoint

**Goal**: Verify health monitoring works.

### Steps:

1. **Call health check endpoint**:
   ```bash
   curl http://localhost:3000/api/cron/health
   ```

2. **Verify response**:
   ```json
   {
     "status": "healthy",
     "checks": {
       "cleanup_job": {
         "status": "healthy",
         "last_run": "...",
         "minutes_since_last_run": 3
       },
       "email_processor": {
         "status": "healthy",
         "last_run": "...",
         "minutes_since_last_run": 1
       },
       "database": {
         "status": "healthy"
       }
     }
   }
   ```

3. **Test unhealthy state** (stop running cron jobs):
   - Wait 15 minutes without running cron jobs
   - Call health check again
   - Should return 503 and `"status": "unhealthy"`

### Expected Results:
- ✅ Health check returns 200 when healthy
- ✅ Health check returns 503 when unhealthy
- ✅ Shows last run times for all jobs
- ✅ Database connectivity check works

---

## Test Scenario 9: Slot Booking Rollback

**Goal**: Verify that if Stripe session creation succeeds but DB fails, Stripe session is expired.

### Steps:

This scenario is difficult to test manually. To simulate:

1. **Temporarily break the database connection** (in `create-session/route.ts`):
   ```typescript
   // After creating Stripe session, throw an error
   throw new Error('Simulated DB failure');
   ```

2. **Attempt checkout**

3. **Verify Stripe session was expired**:
   - Check Stripe Dashboard
   - Session should show as "expired"

4. **Verify no order created**:
   ```sql
   SELECT * FROM orders WHERE stripe_session_id = '<session_id>';
   ```
   - Should return 0 rows

5. **Verify no slot reserved**:
   - Slot counter should not have changed

### Expected Results:
- ✅ Stripe session expired on DB failure
- ✅ No pending order created
- ✅ No slot reserved
- ✅ Clean rollback

---

## Final Checklist

After completing all test scenarios, verify:

- [ ] Happy path works end-to-end
- [ ] Pending orders expire and cleanup correctly
- [ ] Expired orders auto-recover when possible
- [ ] Critical alerts created when recovery impossible
- [ ] Admin recovery UI works
- [ ] Webhook deduplication works
- [ ] Email queue processing works
- [ ] Health check endpoint works
- [ ] No orphaned slot reservations
- [ ] No duplicate orders
- [ ] All alerts logged correctly

## Troubleshooting

### Stripe CLI not forwarding webhooks

```bash
# Restart Stripe CLI
stripe listen --forward-to http://localhost:3000/api/payments/webhook
```

### CRON_SECRET mismatch

```bash
# Generate new secret
openssl rand -base64 32

# Update .env.local
CRON_SECRET=<new-secret>

# Restart dev server
npm run dev
```

### Emails not sending

- Check `RESEND_API_KEY` is set
- Check `email_queue` for `failed` status
- Check `error_message` column for details

### Database constraint violations

- Ensure all 4 migrations are applied in order
- Check for existing test data conflicts
- Clean test data between runs

## Next Steps

Once manual testing is complete:
1. Document any issues found
2. Update automated tests if needed
3. Deploy to staging
4. Run same tests in staging
5. Monitor for 24 hours before production

