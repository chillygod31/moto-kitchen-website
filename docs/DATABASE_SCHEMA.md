# Moto Kitchen - Database Schema Documentation

**Status:** Production Schema (v1.0)  
**Last Updated:** 2026-01-01  
**Database:** Supabase (PostgreSQL 15)

---

## 🎯 Purpose

This document is the **single source of truth** for the Moto Kitchen database schema. 

**Rules:**
1. ✅ **Before writing any migration**, update this document first
2. ✅ **Before deploying**, verify production matches this document
3. ✅ **Before coding**, generate TypeScript types from this schema
4. ✅ **All column names must match** code expectations exactly

---

## 📋 Core Tables

### `tenants`
Multi-tenant isolation. Each restaurant/business is a tenant.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | uuid | NO | Primary key |
| `name` | text | NO | Tenant business name (e.g. "Moto Kitchen NL") |
| `slug` | text | NO | URL-safe identifier (e.g. "moto-kitchen") |
| `business_email` | text | NO | Primary business email (used in APIs, emails) |
| `business_phone` | text | YES | Primary business phone |
| `owner_email` | text | NO | Owner account email (DEPRECATED - use business_email) |
| `owner_name` | text | YES | Owner name (DEPRECATED) |
| `owner_phone` | text | YES | Owner phone (DEPRECATED - use business_phone) |
| `status` | text | NO | Tenant status (active, suspended, etc.) |
| `onboarding_completed` | boolean | YES | Has completed setup wizard |
| `onboarding_step` | text | YES | Current onboarding step |
| `created_at` | timestamptz | YES | Account creation timestamp |
| `updated_at` | timestamptz | YES | Last modification timestamp |

**Indexes:**
- Primary key on `id`
- Unique on `slug`

**RLS Policies:**
- `Users can read their own tenant` (SELECT, authenticated)

**Migration TODO:**
- [ ] Remove `owner_email`, `owner_phone`, `owner_name` after consolidating to `business_*` columns

---

### `tenant_members`
User access to tenants. Multi-tenant RBAC.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | uuid | NO | Primary key |
| `tenant_id` | uuid | NO | FK → `tenants.id` |
| `user_id` | uuid | YES | FK → `auth.users.id` |
| `role` | text | NO | `owner`, `admin`, or `staff` |
| `created_at` | timestamptz | YES | Membership creation timestamp |

**Indexes:**
- Primary key on `id`
- Foreign key on `tenant_id`
- Index on `user_id`

**RLS Policies:**
- Users can read their own memberships
- Owners can manage memberships for their tenant

---

### `tenant_business_settings`
Business configuration (hours, capacity, time slots, etc).

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | uuid | NO | Primary key |
| `tenant_id` | uuid | NO | FK → `tenants.id` (unique constraint) |
| `timezone` | text | YES | IANA timezone (e.g. "Europe/Amsterdam") |
| `business_hours` | jsonb | YES | Opening hours per day: `{"monday": {"open": "09:00", "close": "18:00"}}` |
| `service_types` | text[] | YES | Array of enabled services: `["pickup", "delivery"]` |
| `min_order_value` | numeric | YES | Minimum order amount (€) |
| `accepting_orders` | boolean | YES | Global orders on/off switch |
| `lead_time_minutes` | integer | YES | Min minutes before pickup (e.g. 180 = 3 hours) |
| `max_orders_per_slot` | integer | YES | Default slot capacity (legacy) |
| `max_orders_per_pickup_slot` | integer | YES | Pickup slot capacity |
| `max_orders_per_delivery_window` | integer | YES | Delivery window capacity |
| `max_orders_per_day` | integer | YES | Daily order cap (optional) |
| `pickup_address` | text | YES | Pickup location address |
| `pickup_instructions` | text | YES | Instructions for customers |
| `blackout_dates` | date[] | YES | Fully closed dates (e.g. holidays) |
| `order_notes_max_length` | integer | YES | Max characters for order notes |
| `order_notes_policy` | text | YES | Policy text shown to customers |
| `slot_template` | jsonb | YES | Time slot generation rules (see below) |
| `notification_settings` | jsonb | YES | Email/SMS notification preferences |
| `created_at` | timestamptz | YES | Record creation timestamp |
| `updated_at` | timestamptz | YES | Last modification timestamp |

**`slot_template` JSONB Structure:**
```json
{
  "windows": [
    {
      "start": "11:00",
      "end": "13:00",
      "interval_minutes": 30
    },
    {
      "start": "17:00",
      "end": "21:00",
      "interval_minutes": 30
    }
  ],
  "timezone": "Europe/Amsterdam",
  "days_ahead_customer": 4,
  "days_ahead_admin": 7,
  "default_capacity": 2,
  "exclude_same_day": true
}
```

**Indexes:**
- Primary key on `id`
- Unique constraint on `tenant_id`

---

### `time_slots`
Available pickup/delivery time slots (auto-generated + manually edited).

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | uuid | NO | Primary key |
| `tenant_id` | uuid | NO | FK → `tenants.id` |
| `slot_time` | timestamptz | NO | **Primary slot time** (used in queries/orders) |
| `max_orders` | integer | NO | Maximum orders for this slot |
| `current_orders` | integer | YES | **Atomic counter** of booked orders |
| `is_active` | boolean | YES | **Admin-controlled** active flag |
| `fulfillment_type` | text | YES | `pickup` or `delivery` |
| `generated_by_template` | boolean | YES | TRUE if auto-generated |
| `is_overridden` | boolean | YES | TRUE if admin manually edited |
| `created_at` | timestamptz | YES | Record creation timestamp |
| `updated_at` | timestamptz | YES | Last modification timestamp |
| `start_time` | timestamptz | YES | **TODO: Verify if used** |
| `end_time` | timestamptz | YES | **TODO: Verify if used** |
| `duration_minutes` | integer | YES | **TODO: Verify if used** |
| `delivery_zone_id` | uuid | YES | **TODO: Implement for delivery zones** |
| `is_available` | boolean | YES | **TODO: Remove if redundant with is_active** |

**Indexes:**
- Primary key on `id`
- Unique constraint on `(tenant_id, fulfillment_type, slot_time)`
- Index on `tenant_id`
- Index on `slot_time` (for time range queries)

**RLS Policies:**
- Authenticated users can read active slots for their tenant
- Admin can update slots

**RPC Functions:**
- `book_time_slot(slot_id)` - Atomically increment `current_orders`
- `release_time_slot(slot_id)` - Atomically decrement `current_orders`

---

### `menu_categories`
Menu category organization.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | uuid | NO | Primary key |
| `tenant_id` | uuid | NO | FK → `tenants.id` |
| `name` | text | NO | Category name (e.g. "Mains", "Sides") |
| `sort_order` | integer | YES | Display order |
| `is_active` | boolean | YES | Visible to customers |
| `created_at` | timestamptz | YES | Record creation timestamp |
| `updated_at` | timestamptz | YES | Last modification timestamp |

---

### `menu_items`
Menu items available for ordering.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | uuid | NO | Primary key |
| `tenant_id` | uuid | NO | FK → `tenants.id` |
| `category_id` | uuid | YES | FK → `menu_categories.id` |
| `name` | text | NO | Item name |
| `description` | text | YES | Item description |
| `price` | numeric | NO | Current price |
| `image_url` | text | YES | Image path/URL |
| `dietary_tags` | jsonb | YES | Array of tags (e.g. `["vegan", "gluten-free"]`) |
| `is_available` | boolean | YES | Available for ordering |
| `is_published` | boolean | YES | Visible to customers |
| `sort_order` | integer | YES | Display order within category |
| `created_at` | timestamptz | YES | Record creation timestamp |
| `updated_at` | timestamptz | YES | Last modification timestamp |

---

### `orders`
Customer orders (both pending and completed).

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | uuid | NO | Primary key |
| `tenant_id` | uuid | NO | FK → `tenants.id` |
| `order_number` | text | NO | Human-readable order number (auto-increment per tenant) |
| `customer_name` | text | NO | Customer name |
| `customer_email` | text | YES | Customer email |
| `customer_phone` | text | NO | Customer phone |
| `fulfillment_type` | text | NO | `pickup` or `delivery` |
| `scheduled_for` | timestamptz | YES | Pickup/delivery time |
| `delivery_address` | text | YES | Delivery street address |
| `postcode` | text | YES | Delivery postcode |
| `city` | text | YES | Delivery city |
| `subtotal` | numeric | NO | Items total |
| `delivery_fee` | numeric | YES | Delivery charge |
| `service_fee` | numeric | YES | Service fee |
| `admin_fee` | numeric | YES | Admin fee |
| `total` | numeric | NO | Final total (subtotal + fees) |
| `status` | text | NO | Order status: `new`, `preparing`, `ready`, `completed`, `cancelled` |
| `payment_status` | text | NO | Payment status: `pending`, `paid`, `expired`, `paid_pending_resolution`, `refunded` |
| `notes` | text | YES | Customer order notes |
| `admin_notes` | text | YES | Internal staff notes |
| `email_sent_at` | timestamptz | YES | Confirmation email sent timestamp |
| `email_status` | text | YES | Email delivery status: `pending`, `sent`, `failed` |
| `time_slot_id` | uuid | YES | FK → `time_slots.id` |
| `expires_at` | timestamptz | YES | Pending order expiry time (matches Stripe session expiry) |
| `stripe_session_id` | text | YES | Stripe Checkout session ID |
| `stripe_payment_intent_id` | text | YES | Stripe Payment Intent ID |
| `reservation_released` | boolean | YES | TRUE if slot reservation was released after expiry |
| `slot_released_at` | timestamptz | YES | When slot reservation was released |
| `created_at` | timestamptz | YES | Order creation timestamp |
| `updated_at` | timestamptz | YES | Last modification timestamp |

**Indexes:**
- Primary key on `id`
- Unique on `(tenant_id, order_number)`
- Index on `stripe_session_id`
- Index on `time_slot_id`
- Index on `scheduled_for` (for upcoming orders queries)
- Index on `payment_status` (for filtering)

---

### `order_items`
Line items within an order (snapshot of menu items at time of order).

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | uuid | NO | Primary key |
| `tenant_id` | uuid | NO | FK → `tenants.id` |
| `order_id` | uuid | NO | FK → `orders.id` |
| `menu_item_id` | uuid | NO | FK → `menu_items.id` (original item) |
| `name_snapshot` | text | NO | **Snapshot** of item name at order time |
| `unit_price` | numeric | NO | **Snapshot** of price at order time |
| `quantity` | integer | NO | Quantity ordered |
| `line_total` | numeric | NO | `unit_price * quantity` |
| `notes` | text | YES | Special requests for this item |
| `created_at` | timestamptz | YES | Record creation timestamp |

**Indexes:**
- Primary key on `id`
- Foreign key on `order_id` (cascading delete)

---

### `payments`
Payment transaction records.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | uuid | NO | Primary key |
| `order_id` | uuid | NO | FK → `orders.id` (unique) |
| `provider` | text | NO | Payment provider (`stripe`) |
| `provider_reference` | text | YES | Provider transaction ID |
| `amount` | numeric | NO | Payment amount |
| `status` | text | NO | Payment status: `pending`, `completed`, `failed`, `refunded` |
| `stripe_session_id` | text | YES | Stripe Checkout session ID |
| `stripe_payment_intent_id` | text | YES | Stripe Payment Intent ID |
| `stripe_customer_id` | text | YES | Stripe Customer ID |
| `created_at` | timestamptz | YES | Payment creation timestamp |
| `updated_at` | timestamptz | YES | Last modification timestamp |

**Indexes:**
- Primary key on `id`
- Unique on `order_id`
- Index on `stripe_session_id`
- Index on `stripe_payment_intent_id`

---

### `webhook_events`
Stripe webhook event log (for idempotency).

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | uuid | NO | Primary key |
| `stripe_event_id` | text | YES | Stripe event ID (unique) |
| `event_type` | text | NO | Event type (e.g. `checkout.session.completed`) |
| `payload` | jsonb | NO | Full webhook payload |
| `processed` | boolean | YES | TRUE if successfully processed |
| `error_message` | text | YES | Error details if processing failed |
| `created_at` | timestamptz | YES | Event received timestamp |

**Indexes:**
- Primary key on `id`
- Unique on `stripe_event_id` (prevents duplicate processing)

---

### `webhook_alerts`
Critical alerts from webhook failures.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | uuid | NO | Primary key |
| `tenant_id` | uuid | NO | FK → `tenants.id` |
| `alert_type` | text | NO | Type: `webhook_failure`, `expired_order_paid`, `slot_full`, etc. |
| `severity` | text | NO | Severity: `critical`, `high`, `medium`, `low` |
| `session_id` | text | YES | Stripe session ID related to alert |
| `order_id` | uuid | YES | FK → `orders.id` |
| `error_message` | text | YES | Error description |
| `metadata` | jsonb | YES | Additional context |
| `acknowledged` | boolean | YES | TRUE if admin has reviewed |
| `acknowledged_by` | uuid | YES | FK → `auth.users.id` |
| `acknowledged_at` | timestamptz | YES | When alert was acknowledged |
| `created_at` | timestamptz | YES | Alert creation timestamp |

**Indexes:**
- Primary key on `id`
- Index on `acknowledged` (for filtering unresolved alerts)
- Index on `severity` and `created_at` (for prioritization)

---

### `email_queue`
Asynchronous email sending queue.

| Column | Type | Nullable | Description |
|--------|------|----------|-------------|
| `id` | uuid | NO | Primary key |
| `order_id` | uuid | NO | FK → `orders.id` |
| `recipient` | text | NO | Email recipient address |
| `email_type` | text | NO | Template type: `customer_confirmation`, `admin_alert` |
| `template_data` | jsonb | YES | Email template data (order details, etc.) |
| `status` | text | NO | Status: `pending`, `sent`, `failed` |
| `attempts` | integer | YES | Number of send attempts |
| `last_attempt_at` | timestamptz | YES | Last send attempt timestamp |
| `error_message` | text | YES | Error details if sending failed |
| `sent_at` | timestamptz | YES | Successful send timestamp |
| `created_at` | timestamptz | YES | Queue entry creation timestamp |

**Indexes:**
- Primary key on `id`
- Index on `status` (for cron job queries)
- Index on `created_at` (for retry logic)

---

## 🔐 RLS (Row-Level Security) Policies

All tables have RLS enabled. Key policies:

1. **Tenant Isolation**: Users can only access data for tenants they're members of
2. **Role-Based Access**: `owner` > `admin` > `staff` permissions
3. **Public Read (Limited)**: Some endpoints allow public read for customer-facing data (menu, time slots)

---

## 🔧 RPC Functions (Stored Procedures)

### `book_time_slot(p_slot_id UUID)`
Atomically increment `current_orders` for a time slot.

**Returns:** `(slot_id, new_current_orders, slot_max_orders)`

### `release_time_slot(p_slot_id UUID)`
Atomically decrement `current_orders` for a time slot.

**Returns:** `(slot_id, new_current_orders)`

### `create_pending_order_with_slot(...)`
Create a pending order and atomically reserve a time slot in one transaction.

**Returns:** `(order_id, order_number, slot_booked)`

### `process_webhook_atomically(...)`
Process Stripe webhook, update order status, queue emails - all atomically.

**Returns:** `JSONB` with status and metadata

### `cleanup_expired_pending_orders()`
Mark expired pending orders as `expired` and release their slot reservations.

**Returns:** `JSONB` with cleanup statistics

---

## 📝 Migration Standards

### Before Writing a Migration:
1. ✅ Update this `DATABASE_SCHEMA.md` file
2. ✅ Review with team (for production changes)
3. ✅ Test migration on local DB first
4. ✅ Write both UP and DOWN migration (reversible)

### Migration File Naming:
```
supabase/migrations/YYYY-MM-DD-descriptive-name.sql
```

### Migration Template:
```sql
-- Migration: [Description]
-- Date: YYYY-MM-DD
-- Author: [Your Name]

-- UP Migration
[Your schema changes here]

-- Verification
DO $$
BEGIN
  -- Add checks to verify migration succeeded
  RAISE NOTICE 'Migration completed successfully';
END $$;
```

---

## 🔍 Schema Validation

### Generate TypeScript Types:
```bash
npx supabase gen types typescript --local > lib/database.types.ts
```

### Run Schema Tests:
```bash
npm run test:schema
```

---

## 📌 TODO / Known Issues

- [ ] **Remove deprecated columns** from `tenants`: `owner_email`, `owner_phone`, `owner_name`
- [ ] **Audit `time_slots` columns**: Verify if `start_time`, `end_time`, `duration_minutes`, `is_available` are used
- [ ] **Add foreign key constraints**: Some FKs might be missing
- [ ] **Add check constraints**: Validate status enums at DB level
- [ ] **Implement delivery zones**: `delivery_zone_id` in `time_slots` is not yet used

---

## 📚 Related Documentation

- [ENGINEERING_TRUTH.md](../ENGINEERING_TRUTH.md) - Engineering contract and RLS strategy
- [PAYMENTS_TRUTH.md](../PAYMENTS_TRUTH.md) - Payment flow and Stripe integration
- [P0_IMPLEMENTATION_COMPLETE.md](./P0_IMPLEMENTATION_COMPLETE.md) - P0 payment safety system
- [TRUTH_FILES_GUIDE.md](../TRUTH_FILES_GUIDE.md) - How to maintain truth files

---

**Last Schema Update:** 2026-01-01  
**Schema Version:** 1.0  
**Production Status:** ✅ Ready (pending standardization migration)

