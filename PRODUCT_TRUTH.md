# PRODUCT_TRUTH.md (v1 — keep this short + enforceable)

## Rule
If anything conflicts with this file, this file wins.

## What we're building
A multi-tenant ordering + admin system for food businesses.
Tenant #1 is Moto Kitchen (Netherlands, EUR).

## Who it's for
- Customers: browse menu → cart → checkout → pay → confirmation
- Tenant owner/staff: manage menu, settings, and orders in an admin dashboard

## Moto Kitchen (Tenant #1) — Launch Requirements (B1)
### Storefront must do
- Show menu (categories + search)
- Add to cart, update quantities, persist cart
- Checkout with: name, email, phone, fulfillment (pickup/delivery), date/time slot, notes
- Enforce: opening hours, lead time/cutoff, blackout dates, slot capacity
- Confirmation page: order number + pickup/delivery details + "what happens next"

### Payments must do
- Stripe Checkout for one-off payments
- Webhooks update payment status (source of truth)
- Handle: succeeded / failed / cancelled / refunded

### Notifications must do
- Customer confirmation email
- Admin new-order email
- Admin "resend confirmation" button

### Admin must do
- Orders list + filters + search
- Order detail view with items, time, notes/allergens
- Status workflow (confirmed/preparing/ready/completed/cancelled)
- Printable kitchen ticket
- Internal admin notes on orders

### Legal + trust must exist before public launch
- /terms (refund/cancellation policy)
- /privacy (data handling + Stripe)
- /cookie-policy + cookie consent banner
- allergen disclaimer on checkout

## Non-goals (for now)
We are NOT building yet:
- SaaS billing/subscriptions
- Stripe Connect / marketplace payouts
- loyalty points, promo engines
- driver routing
- inventory management

## Definition of "Launch Ready"
Moto Kitchen can take paid orders on mobile end-to-end reliably, without manual fixes.
