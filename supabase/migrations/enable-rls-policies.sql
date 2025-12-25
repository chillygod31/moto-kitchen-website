-- ============================================================================
-- Enable Row-Level Security (RLS) and Create Tenant Isolation Policies
-- Phase A: Foundation - Production-safe multi-tenant RLS
-- ============================================================================
-- 
-- This migration enables RLS on all tenant-scoped tables and creates
-- policies that enforce tenant isolation using tenant_id filtering.
--
-- IMPORTANT: After running this migration, all queries must set tenant context
-- using SET LOCAL app.tenant_id = 'tenant-uuid' before accessing tenant-scoped tables.
-- ============================================================================

-- ============================================================================
-- STEP 1: Enable RLS on Tenant-Scoped Tables
-- ============================================================================

-- Menu tables
ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

-- Order tables
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Delivery & time management
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;

-- Payments (tenant-scoped via order_id → orders.tenant_id)
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: Create Tenant Isolation Policies
-- ============================================================================

-- Menu Categories Policies
CREATE POLICY "Tenant isolation for menu_categories"
  ON menu_categories FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Menu Items Policies
CREATE POLICY "Tenant isolation for menu_items"
  ON menu_items FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Orders Policies
CREATE POLICY "Tenant isolation for orders"
  ON orders FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Order Items Policies (isolated via tenant_id directly)
CREATE POLICY "Tenant isolation for order_items"
  ON order_items FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Delivery Zones Policies
CREATE POLICY "Tenant isolation for delivery_zones"
  ON delivery_zones FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Time Slots Policies
CREATE POLICY "Tenant isolation for time_slots"
  ON time_slots FOR ALL
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- Payments Policies (isolated via order relationship)
CREATE POLICY "Tenant isolation for payments"
  ON payments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = payments.order_id
      AND orders.tenant_id = current_setting('app.tenant_id', true)::uuid
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = payments.order_id
      AND orders.tenant_id = current_setting('app.tenant_id', true)::uuid
    )
  );

-- ============================================================================
-- STEP 3: Drop existing policies if they exist (idempotent)
-- ============================================================================

-- Note: DROP POLICY IF EXISTS is not available in all PostgreSQL versions
-- This migration assumes clean state. If policies exist, they should be
-- dropped manually first, or use a more complex migration script.

-- ============================================================================
-- STEP 4: Grant necessary permissions
-- ============================================================================

-- Ensure anon role has access to tenant-scoped tables (RLS will enforce isolation)
-- These grants are typically already set, but ensuring they exist
GRANT SELECT ON menu_categories TO anon;
GRANT SELECT ON menu_items TO anon;
GRANT SELECT ON orders TO anon;
GRANT SELECT ON order_items TO anon;
GRANT SELECT ON delivery_zones TO anon;
GRANT SELECT ON time_slots TO anon;
GRANT SELECT ON payments TO anon;

GRANT INSERT ON orders TO anon;
GRANT INSERT ON order_items TO anon;
GRANT INSERT ON payments TO anon;

GRANT UPDATE ON orders TO anon;
GRANT UPDATE ON payments TO anon;

-- Admin tables should already have proper permissions via service role

-- ============================================================================
-- NOTES:
-- ============================================================================
--
-- 1. Tenant context must be set before any queries:
--    SET LOCAL app.tenant_id = 'tenant-uuid-here';
--
-- 2. Use lib/db/tenant-context.ts helper to set context safely
--
-- 3. RLS policies use current_setting('app.tenant_id', true) which:
--    - Returns NULL if not set (blocks all access)
--    - Returns UUID if set (allows access to matching tenant_id)
--
-- 4. Service role key bypasses RLS, so admin routes using server-admin client
--    must still enforce tenant isolation in application code.
--
-- 5. Customer routes using server-app client (anon key) will be enforced
--    by RLS policies.
--
-- ============================================================================

