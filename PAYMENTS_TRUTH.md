# PAYMENTS_TRUTH.md
# Moto Kitchen Ordering — Payments Contract (Stripe)

## 0) Purpose
This file defines the single source of truth for:
- how totals are calculated
- how Stripe checkout is created
- how webhooks create/confirm orders
- what "paid / refunded / failed" means
- what is in scope for MVP vs later

If code behavior conflicts with this file, the code is wrong.

---

## 1) Non-negotiables (must always be true)
1) **Server is source of truth for money**
   - Client cart is advisory only.
   - Server computes totals from DB rules + snapshots.

2) **Payment confirmation is webhook-driven**
   - We do NOT trust the success redirect alone.
   - Order becomes "paid" only after verified webhook.

3) **Idempotent by design**
   - Create-session and webhook handlers must be safe to retry.
   - Duplicate charges/orders must be prevented with DB constraints + idempotency keys.

4) **Snapshot everything at purchase time**
   - Item unit prices, delivery fee, VAT rate, discounts, etc.
   - Historical orders never change if menu/pricing rules change later.

---

## 2) Definitions
- **Tenant**: the brand/account context (Moto Kitchen now; multi-tenant later).
- **Pending order**: created before redirect to Stripe; reserves slot/stock (recommended).
- **Paid order**: webhook confirms payment AND amounts match server-computed total.
- **Session ID**: Stripe checkout.session.id
- **Payment Intent**: Stripe payment_intent id (primary unique payment reference)

---

## 3) MVP Scope (what we are building now)
✅ Stripe Checkout (hosted payment UI)  
✅ One-time payments for orders  
✅ Webhook confirmation (checkout.session.completed)  
✅ Full refunds via admin only  
✅ Email confirmation via webhook  
✅ Time slot capacity enforcement  
✅ VAT snapshot fields stored (invoice optional for B2C)

Not in MVP:
- partial refunds
- customer self-service refunds
- advanced fraud scoring
- stock reservations beyond time-slot logic (unless needed)

---

## 4) Order lifecycle (states)

### Payment status (system)
- `draft` (cart only, not stored) OR `pending` (if we create before Stripe)
- `paid`
- `failed`
- `canceled`
- `refunded`

### Fulfillment status (ops/admin)
- `new` (paid, not yet accepted)
- `accepted`
- `preparing`
- `ready`
- `completed`
- `cancelled` (ops cancel; payment status handles money)

---

## 5) Required Flow (happy path)

1) Customer selects items + slot + delivery/pickup + details
2) Client calls `POST /api/payments/create-session`
3) Server:
   - validates slot availability + min order + delivery rules
   - computes totals (items + fees + VAT + discounts)
   - creates **pending order** (recommended) with price snapshots
   - creates Stripe checkout session linked to pending order (metadata)
   - returns session URL
4) Customer pays in Stripe Checkout
5) Stripe webhook hits `POST /api/payments/webhook`
6) Server webhook handler:
   - verifies signature
   - dedupes event (unique stripe_event_id)
   - loads order by session/intent metadata
   - verifies paid amount/currency == server snapshot totals
   - marks payment_status = `paid`
   - sends confirmation email
7) Success page:
   - shows "processing payment" and **polls** until order becomes paid/confirmed

### Success page polling mechanism:
- polls `GET /api/orders/status?session_id={session_id}`
- interval: every 2 seconds for first 30 seconds, then every 5 seconds
- timeout: after 5 minutes, show "contact support" message with session_id
- customer can safely close/refresh page - polling resumes
- response includes: payment_status, order_number (if paid), email confirmation status

---

## 6) Webhook rules (strict)

### Events we handle (MVP)
- `checkout.session.completed` → mark paid (after verification), send email
- `charge.refunded` OR `payment_intent.refunded` → mark refunded, notify ops
(Exact event choice is implementation detail but MUST be consistent.)

### Verification checks (must pass before paid)
- signature valid
- event not already processed
- order exists and belongs to correct tenant
- currency matches expected (EUR)
- amount_total matches our stored snapshot total (in cents)
- payment_intent not already linked to another order

### Retry behavior
- If webhook fails processing, do NOT mark processed.
- System must allow Stripe retries to succeed later.

---

## 7) Create-session rules (strict)

- Endpoint must be **rate limited**.
- Endpoint must be **idempotent**:
  - same cart fingerprint + customer + slot within N minutes should return same session/order

### Server must reject:
- slot over capacity
- blackout date
- below min order
- invalid delivery zone/address if delivery

### Additional validation:
- max 5 sessions per email per hour (prevent spam)
- max 3 failed payment attempts per email per day (card testing)
- disposable email detection (optional: warn or block mailinator, etc.)
- delivery address validation: real postcode format

### Later (post-MVP):
- velocity checks per phone number
- repeated high-value orders to same address

---

## 8) Time slot capacity rules

- Capacity enforcement must be **atomic**.
- If we use pending orders:
  - pending reserves a slot for X minutes (e.g. 20)
  - pending expires automatically; reservation released
- If slot fills while customer is paying:
  - define rule:
    - recommended: reservation guarantees the slot until expiry
    - if reservation expired before payment completes → webhook should fail gracefully and trigger refund/manual resolution policy

### Timezone:
- all slot times stored in Europe/Amsterdam (or UTC + display Amsterdam)
- DST transitions must not create duplicate/missing slots

---

## 9) Pricing + VAT snapshot fields (minimum)

### For each order:
- `currency` (EUR)
- `items_subtotal_gross`
- `delivery_fee_gross`
- `discount_total_gross` (if any)
- `order_total_gross`
- `vat_total`
- `order_total_net`
- `vat_scheme` (basic tag)

### For each order item:
- `unit_price_gross_at_purchase`
- `quantity`
- `line_total_gross`
- `vat_rate_at_purchase`
- `vat_amount_line`

### VAT Implementation (MVP):
**VAT calculation method:**
- prices in menu are INCLUSIVE of VAT (gross)
- we calculate net = gross / (1 + vat_rate)

**VAT Rates (NL Standard):**
- Food items: 9% VAT
- Beverages: 21% VAT
- Delivery fee: 21% VAT (service charge)

**Accounting:**
- All prices shown to customer are gross (inclusive)
- Invoice shows gross, net, VAT breakdown
- Historical rates stored with order (never recalculated)

---

## 10) Refund policy (MVP)

- Refunds are **admin-only**
- Only **full refunds** in MVP
- Refund triggers:
  - Stripe refund created → webhook updates order payment_status=`refunded`
- Customer messaging:
  - refund confirmation email is optional MVP, but admin dashboard must show refunded.

### Refund eligibility rules (RECOMMENDED):
- Customer can cancel up to 2 hours before slot → automatic refund
- After 2 hours, refund requires admin approval
- No refunds after order marked "preparing"

### What happens if customer pays for unavailable slot:
- Webhook checks capacity again
- If slot now full, auto-refund with explanation email

### Later:
- partial refunds + item-level adjustments

---

## 11) Email contract (MVP)

### Email is sent when:
- webhook confirms paid (never from success redirect)

### Email must include:
- order number
- items + quantities
- pickup/delivery choice + address
- time slot date/time
- totals (gross + VAT if shown)
- support contact

### Email status fields:
- `email_status`: queued/sent/failed
- `email_sent_at`
- admin can "resend confirmation"

---

## 12) Data integrity + DB constraints (minimum)

**Unique constraints:**
- unique `stripe_event_id` (per tenant)
- unique `payment_intent_id` (per tenant)
- unique `stripe_session_id` (per tenant)
- pending order expiry index (for cleanup job)

**RLS protection:**
- all rows have `tenant_id` and are protected by RLS

### Indexes required for performance:
- `orders.payment_status` (filtering paid orders)
- `orders.created_at` (date range queries)
- `orders.tenant_id + time_slot_id` (capacity checks)
- `webhook_events.processed + created_at` (finding unprocessed)
- `payments.stripe_payment_intent_id` (lookup on webhook)

---

## 13) Observability (minimum)

- Log webhook failures with reason + order/session references
- Alert on "webhook permanently failing" (simple alert)
- Support lookup capability:
  - find order by email / phone / payment_intent / session_id

---

## 14) Launch gates (definition of done)

Before live launch:
- All tests pass (happy path + failed payment + webhook replay + concurrency slot test)
- Can safely retry webhook events without duplicates
- Success page works even if webhook takes 30–60 seconds
- Email retry/resend works
- Rate limiting enabled
- Tenant context cannot be spoofed in prod

---

## 15) Open questions (decided before build)

**Q: Do we create pending orders before Stripe?**  
→ RECOMMENDATION: YES (enables better UX + inventory control)

**Q: Slot reservation duration?**  
→ RECOMMENDATION: 20 minutes (Stripe checkout typically takes 2-5 min)

**Q: Cutoff/lead time rules?**  
→ RECOMMENDATION: orders must be placed 2 hours before slot (gives kitchen prep time)

**Q: Delivery fee VAT?**  
→ DECIDED: 21% VAT (service charge in NL)

---

## 16) Customer Error Handling

### When create-session fails:
- `slot_unavailable` → "Sorry, this time slot just filled up. Please choose another."
- `below_min_order` → "Minimum order is €25. Current total: €X"
- `blackout_date` → "Delivery unavailable on this date. Next available: [date]"
- `invalid_zone` → "We don't deliver to this address yet. Try pickup?"

### When payment fails:
- `card_declined` → show Stripe message + "try another card" button
- `payment_timeout` → "Payment incomplete. Check your email or contact support."

### When webhook delayed (>60 sec):
- success page shows: "Confirming your payment... This can take 1-2 minutes."
- after 5 minutes: "Your payment is processing. Check your email for confirmation."

---

## 17) Operations Integration (MVP)

### How kitchen receives orders:
- Admin dashboard shows new paid orders in real-time
- Notification timing: immediately after webhook marks paid
- Notification includes: items, quantities, time slot, delivery/pickup, address, customer phone

### If notification fails:
- retry N times
- log + alert if still failing
- admin dashboard shows "notification pending" warning

---

## 18) Service Degradation Handling

### If Stripe webhook endpoint unreachable:
- Stripe retries for 3 days
- we must have manual "reprocess webhook event" admin tool
- or: poll Stripe API for session status as backup

### If email provider (Resend) down:
- mark `email_status='queued'`
- retry with exponential backoff (1min, 5min, 30min)
- after 24h, manual admin resend required

### If Supabase connection fails during webhook:
- log event_id to file/queue
- do NOT mark processed
- allow Stripe retry to succeed later

---

## 19) Data & Privacy (MVP)

### Customer can request:
- order history lookup by email
- [GDPR requires data deletion capability]

### Retention:
- orders: keep indefinitely for accounting (or decide max years)
- webhook_events: keep for 90 days (debugging), then archive/delete
- pending expired orders: delete after 7 days
- customer emails: [DECIDE: keep for marketing or purge after order fulfilled?]

### Never store:
- full card numbers (Stripe handles this)
- CVV codes (never see these)

---

## 20) What changes require updating this file

Any change to:
- payment flow (Stripe integration, webhooks)
- order lifecycle states
- VAT rates or pricing rules
- refund policy or eligibility
- slot capacity enforcement
- email delivery contract
- webhook event handling
- time zone or cutoff rules

must update PAYMENTS_TRUTH.md in the same PR.

---

## 21) Implementation checklist

- [ ] Rate limiting on create-session endpoint
- [ ] Idempotency key implementation in create-session
- [ ] Webhook signature verification (Stripe)
- [ ] Webhook event deduplication (stripe_event_id unique)
- [ ] Amount verification in webhook (matches snapshot)
- [ ] Pending order creation + expiry
- [ ] Slot capacity atomic check + decrement
- [ ] Email sending on webhook (not redirect)
- [ ] Email retry/resend mechanism
- [ ] Success page polling (2/5 sec intervals, 5 min timeout)
- [ ] Payment status DB field + indexes
- [ ] Stripe metadata storage (session_id, payment_intent_id)
- [ ] Admin refund button
- [ ] Webhook event logging + audit trail
- [ ] Error messages per failure type
- [ ] Mobile checkout testing (iOS Safari + Android Chrome)
- [ ] E2E test: happy path payment
- [ ] E2E test: declined card
- [ ] E2E test: webhook replay safety
- [ ] E2E test: slot capacity + concurrency


