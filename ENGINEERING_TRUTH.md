# ENGINEERING_TRUTH.md
# SaaS Engineering Truth (Source of Truth)

## 0) Purpose
This document is the single source of truth for:
- architecture decisions
- security boundaries
- tenant isolation approach
- environment + operational rules
- what must be tested before launch

If code or a PR conflicts with this file, this file wins.

---

## 1) Core stack
- Frontend: Next.js (storefront + admin)
- Backend: Next.js API routes (server-controlled access)
- Database/Auth: Supabase (Postgres + Auth)
- Payments: Stripe Checkout + webhooks
- Email: provider of choice (SMTP/Resend/etc), tracked in DB
- Deploy: Vercel

---

## 2) Multi-tenancy model (hard rule)
Every tenant-scoped table has a `tenant_id` column.
No tenant can access another tenant's data **under any circumstance**.

### Tenant resolution
Tenant is resolved per request from:
- hostname (preferred), and/or
- path segment (fallback)

Middleware injects a resolved tenant identifier into the request context.

Invalid/missing tenant must return a clear:
- `tenant-not-found` page (storefront)
- 404/tenant error (API)

---

## 3) Data access policy (hard rule)
### Storefront
- Public users do NOT get direct table access to tenant tables.
- Menu is served via Next.js API (`/api/menu`) with tenant scoping.
- Order creation is via Next.js API with validation + anti-abuse.

### Admin
- Admin CRUD must NOT use service role by default.
- Admin routes use JWT session (anon key + user token).
- Service role is allowed only for tightly-scoped system operations.

---

## 4) RLS strategy (canonical)
We use JWT-based RLS with tenant membership checks:
- Tenant isolation enforced in Postgres (not "trust the app")
- `tenant_members` table maps user_id → tenant_id → role
- Policies enforce:
  - user can only access rows for their tenant
  - role constraints for write/destructive actions

**FORCE RLS** enabled on sensitive tables (orders, order_items, payments).
No public SELECT from base tables if the UI is served via API.

---

## 5) Roles & RBAC (canonical)
Roles are:
- `owner`
- `staff`

RBAC rules are enforced at:
1) DB (RLS policies for tenant + role)
2) API route permission checks (defense in depth)

At minimum:
- owner can perform destructive admin actions
- staff cannot delete critical entities or change business-critical settings

RBAC must have explicit tests (see Test Gates).

---

## 6) Validation (canonical)
All write endpoints use Zod schemas.
Invalid payloads return:
- 400 with a safe error message
- no partial writes

---

## 7) Payments (canonical)
Use Stripe Checkout for one-off payments for Moto Kitchen.
Flow:
1) Create Checkout Session (server-only)
2) Redirect user to Stripe
3) Webhook updates payment status (source of truth)
4) Order is marked paid/failed/cancelled/refunded via webhook events

Hard rules:
- Webhooks must verify signature
- Webhooks must be idempotent
- Payment status in DB must be derived from Stripe events, not UI assumptions
- Store Stripe references (session_id, payment_intent_id, customer_id)
- Keep webhook_events table for debug/replay

---

## 8) Observability (canonical)
Every API request includes:
- Request ID
- Tenant context
- Structured logs

Error tracking integration (Sentry-ready wrapper).
Minimum production monitoring:
- uptime ping to health endpoint
- alerting on elevated error rates

---

## 9) Security hardening (canonical)
Must exist and be active:
- rate limiting (checkout/order routes)
- CSRF protection for authenticated admin actions (where applicable)
- secure cookies (httpOnly, secure, sameSite)
- no secrets in client bundle
- service role key never used client-side

---

## 10) Test gates (must pass before launch)
### Phase A gate (security + isolation)
Must be verified with runtime tests:
- RLS isolation: cross-tenant access blocked
- tenant resolution: unknown domain/path blocked
- admin protection: 401 when unauthenticated
- RBAC tests: owner vs staff permission differences (explicit)
- rate limiting: 429 on abuse
- CSRF: 403 on missing/invalid token where required
- request ID appears in headers + logs

### Go-live gate (Moto Kitchen)
Must pass before accepting real payments:
- Stripe config valid in environment
- webhook endpoint receiving events correctly
- email sending works + status tracked
- slot capacity enforcement works under real orders
- blackout dates + lead time cutoff enforced
- mobile tests: iPhone Safari + Android Chrome
- E2E test orders completed:
  - 5 successful payments
  - 2 failed payments
  - 2 cancelled
  - 1 refunded

---

## 11) Environments (canonical)
- Local dev uses `.env.local`
- Preview deployments use Vercel Preview env vars
- Production uses Vercel Production env vars

Stripe has separate keys + webhooks for:
- test mode
- live mode

---

## 12) Scale assumptions (design constraints)
Target growth:
- 10 tenants in 3–6 months
- 500 tenants in ~2 years

Engineering principles to support this:
- strict tenant isolation
- minimize per-tenant manual setup
- safe onboarding path (future Phase B2)
- indexes on `tenant_id` for tenant-scoped tables
- avoid shared global state between tenants

---

## 13) What changes require updating this file
Any change to:
- tenant resolution
- RLS/RBAC strategy
- payment flow
- admin auth/session handling
- public access rules

must update ENGINEERING_TRUTH.md in the same PR.
