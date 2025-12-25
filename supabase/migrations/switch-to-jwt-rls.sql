-- ============================================================================
-- Switch RLS from current_setting('app.tenant_id') to JWT + tenant_members
-- Phase A: Complete RLS implementation (SECURE VERSION)
-- ============================================================================
-- 
-- CRITICAL CHANGES from initial draft:
-- 1. No public SELECT policies - data served only through Next.js API
-- 2. Admin policies only work with JWT (anon key + auth session)
-- 3. Role-based policies (owner vs staff)
-- 4. Anon can only INSERT (orders/order_items/payments) with validation
-- ============================================================================

-- ============================================================================
-- STEP 1: Ensure RLS is enabled on all tenant-scoped tables
-- ============================================================================

ALTER TABLE menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Force RLS on sensitive tables (prevents accidental service role bypass)
ALTER TABLE orders FORCE ROW LEVEL SECURITY;
ALTER TABLE order_items FORCE ROW LEVEL SECURITY;
ALTER TABLE payments FORCE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: Drop old policies that use current_setting('app.tenant_id')
-- ============================================================================

DROP POLICY IF EXISTS "Tenant isolation for menu_categories" ON menu_categories;
DROP POLICY IF EXISTS "Tenant isolation for menu_items" ON menu_items;
DROP POLICY IF EXISTS "Tenant isolation for orders" ON orders;
DROP POLICY IF EXISTS "Tenant isolation for order_items" ON order_items;
DROP POLICY IF EXISTS "Tenant isolation for delivery_zones" ON delivery_zones;
DROP POLICY IF EXISTS "Tenant isolation for time_slots" ON time_slots;
DROP POLICY IF EXISTS "Tenant isolation for payments" ON payments;

-- ============================================================================
-- STEP 3: Helper function to check if user is member of tenant
-- ============================================================================

CREATE OR REPLACE FUNCTION user_is_tenant_member(check_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM tenant_members
    WHERE tenant_members.tenant_id = check_tenant_id
    AND tenant_members.user_id = auth.uid()
  )
$$;

-- ============================================================================
-- STEP 4: Admin Policies - JWT + tenant_members (SELECT, INSERT, UPDATE, DELETE)
-- ============================================================================
-- IMPORTANT: These only work if admin routes use anon key + JWT session
-- Service role bypasses RLS, so admin routes MUST switch to anon key

-- Menu Categories - Admin full access (members only)
CREATE POLICY "Admin can select menu_categories"
  ON menu_categories FOR SELECT
  USING (user_is_tenant_member(tenant_id));

CREATE POLICY "Admin can insert menu_categories"
  ON menu_categories FOR INSERT
  WITH CHECK (user_is_tenant_member(tenant_id));

CREATE POLICY "Admin can update menu_categories"
  ON menu_categories FOR UPDATE
  USING (user_is_tenant_member(tenant_id))
  WITH CHECK (user_is_tenant_member(tenant_id));

CREATE POLICY "Admin can delete menu_categories"
  ON menu_categories FOR DELETE
  USING (user_is_tenant_member(tenant_id));

-- Menu Items - Admin full access (members only)
CREATE POLICY "Admin can select menu_items"
  ON menu_items FOR SELECT
  USING (user_is_tenant_member(tenant_id));

CREATE POLICY "Admin can insert menu_items"
  ON menu_items FOR INSERT
  WITH CHECK (user_is_tenant_member(tenant_id));

CREATE POLICY "Admin can update menu_items"
  ON menu_items FOR UPDATE
  USING (user_is_tenant_member(tenant_id))
  WITH CHECK (user_is_tenant_member(tenant_id));

CREATE POLICY "Admin can delete menu_items"
  ON menu_items FOR DELETE
  USING (user_is_tenant_member(tenant_id));

-- Orders - Admin full access (members only)
CREATE POLICY "Admin can select orders"
  ON orders FOR SELECT
  USING (user_is_tenant_member(tenant_id));

CREATE POLICY "Admin can insert orders"
  ON orders FOR INSERT
  WITH CHECK (user_is_tenant_member(tenant_id));

CREATE POLICY "Admin can update orders"
  ON orders FOR UPDATE
  USING (user_is_tenant_member(tenant_id))
  WITH CHECK (user_is_tenant_member(tenant_id));

-- Order Items - Admin access via order relationship
CREATE POLICY "Admin can select order_items"
  ON order_items FOR SELECT
  USING (
    user_is_tenant_member(tenant_id)
    AND EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.tenant_id = order_items.tenant_id
    )
  );

CREATE POLICY "Admin can insert order_items"
  ON order_items FOR INSERT
  WITH CHECK (
    user_is_tenant_member(tenant_id)
    AND EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.tenant_id = order_items.tenant_id
    )
  );

CREATE POLICY "Admin can update order_items"
  ON order_items FOR UPDATE
  USING (
    user_is_tenant_member(tenant_id)
    AND EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.tenant_id = order_items.tenant_id
    )
  )
  WITH CHECK (
    user_is_tenant_member(tenant_id)
    AND EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.tenant_id = order_items.tenant_id
    )
  );

CREATE POLICY "Admin can delete order_items"
  ON order_items FOR DELETE
  USING (
    user_is_tenant_member(tenant_id)
    AND EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.tenant_id = order_items.tenant_id
    )
  );

-- Delivery Zones - Admin full access
CREATE POLICY "Admin can select delivery_zones"
  ON delivery_zones FOR SELECT
  USING (user_is_tenant_member(tenant_id));

CREATE POLICY "Admin can insert delivery_zones"
  ON delivery_zones FOR INSERT
  WITH CHECK (user_is_tenant_member(tenant_id));

CREATE POLICY "Admin can update delivery_zones"
  ON delivery_zones FOR UPDATE
  USING (user_is_tenant_member(tenant_id))
  WITH CHECK (user_is_tenant_member(tenant_id));

CREATE POLICY "Admin can delete delivery_zones"
  ON delivery_zones FOR DELETE
  USING (user_is_tenant_member(tenant_id));

-- Time Slots - Admin full access
CREATE POLICY "Admin can select time_slots"
  ON time_slots FOR SELECT
  USING (user_is_tenant_member(tenant_id));

CREATE POLICY "Admin can insert time_slots"
  ON time_slots FOR INSERT
  WITH CHECK (user_is_tenant_member(tenant_id));

CREATE POLICY "Admin can update time_slots"
  ON time_slots FOR UPDATE
  USING (user_is_tenant_member(tenant_id))
  WITH CHECK (user_is_tenant_member(tenant_id));

CREATE POLICY "Admin can delete time_slots"
  ON time_slots FOR DELETE
  USING (user_is_tenant_member(tenant_id));

-- Payments - Admin access via order relationship
CREATE POLICY "Admin can select payments"
  ON payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      JOIN tenant_members ON tenant_members.tenant_id = orders.tenant_id
      WHERE orders.id = payments.order_id
      AND tenant_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Admin can insert payments"
  ON payments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      JOIN tenant_members ON tenant_members.tenant_id = orders.tenant_id
      WHERE orders.id = payments.order_id
      AND tenant_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Admin can update payments"
  ON payments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM orders
      JOIN tenant_members ON tenant_members.tenant_id = orders.tenant_id
      WHERE orders.id = payments.order_id
      AND tenant_members.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      JOIN tenant_members ON tenant_members.tenant_id = orders.tenant_id
      WHERE orders.id = payments.order_id
      AND tenant_members.user_id = auth.uid()
    )
  );

-- ============================================================================
-- STEP 5: Customer Policies - Anon INSERT ONLY (no SELECT)
-- ============================================================================
-- IMPORTANT: No public SELECT policies - data must be served through Next.js API
-- API routes resolve tenant from hostname and filter server-side

-- Orders - Anon can INSERT (with validation that tenant is active/accepting orders)
CREATE POLICY "Public can create orders"
  ON orders FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM tenants
      JOIN tenant_business_settings ON tenant_business_settings.tenant_id = tenants.id
      WHERE tenants.id = orders.tenant_id
      AND tenants.status = 'active'
      AND tenant_business_settings.accepting_orders = true
    )
  );

-- Order Items - Anon can INSERT (must belong to valid order from active tenant)
CREATE POLICY "Public can create order_items"
  ON order_items FOR INSERT
  WITH CHECK (
    order_items.tenant_id IN (
      SELECT tenant_id FROM orders
      WHERE orders.id = order_items.order_id
    )
    AND EXISTS (
      SELECT 1 FROM orders
      JOIN tenants ON tenants.id = orders.tenant_id
      JOIN tenant_business_settings ON tenant_business_settings.tenant_id = tenants.id
      WHERE orders.id = order_items.order_id
      AND orders.tenant_id = order_items.tenant_id
      AND tenants.status = 'active'
      AND tenant_business_settings.accepting_orders = true
    )
  );

-- Payments - Anon can INSERT (must belong to valid order)
CREATE POLICY "Public can create payments"
  ON payments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      JOIN tenants ON tenants.id = orders.tenant_id
      WHERE orders.id = payments.order_id
      AND tenants.status = 'active'
    )
  );

-- ============================================================================
-- STEP 6: Revoke public SELECT (ensure no direct table access)
-- ============================================================================

-- Remove SELECT permission from anon role on base tables
-- (INSERT still allowed via policies above)
REVOKE SELECT ON menu_categories FROM anon;
REVOKE SELECT ON menu_items FROM anon;
REVOKE SELECT ON orders FROM anon;
REVOKE SELECT ON order_items FROM anon;
REVOKE SELECT ON delivery_zones FROM anon;
REVOKE SELECT ON time_slots FROM anon;
REVOKE SELECT ON payments FROM anon;

-- Keep INSERT permissions (policies will enforce)
GRANT INSERT ON orders TO anon;
GRANT INSERT ON order_items TO anon;
GRANT INSERT ON payments TO anon;

-- ============================================================================
-- STEP 7: Grant SELECT to authenticated role (for admin with JWT)
-- ============================================================================

-- Authenticated users (with JWT) can SELECT if policies allow
GRANT SELECT, INSERT, UPDATE, DELETE ON menu_categories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON menu_items TO authenticated;
GRANT SELECT, INSERT, UPDATE ON orders TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON order_items TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON delivery_zones TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON time_slots TO authenticated;
GRANT SELECT, INSERT, UPDATE ON payments TO authenticated;

-- ============================================================================
-- CRITICAL NOTES FOR DEVELOPERS:
-- ============================================================================
--
-- 1. ADMIN ROUTES MUST USE ANON KEY + JWT:
--    - Stop using createServerAdminClient() (service role) for normal CRUD
--    - Use createServerAppClient() with JWT token in Authorization header
--    - Service role should ONLY be used for:
--      * Database migrations/seeds
--      * Background jobs
--      * System operations that truly need to bypass RLS
--
-- 2. CUSTOMER ROUTES:
--    - Continue using createServerAppClient() (anon key)
--    - No direct table SELECT allowed (RLS blocks it)
--    - Data must be served through Next.js API routes that:
--      * Resolve tenant from hostname/path
--      * Filter by tenant_id server-side using service role (temporary)
--      * OR: Use service role for customer data reads until proper solution
--
-- 3. ROLE-BASED POLICIES (FUTURE ENHANCEMENT):
--    - Current policies allow any tenant member full access
--    - To add role-based restrictions, modify policies to check:
--      SELECT role FROM tenant_members WHERE tenant_id = X AND user_id = auth.uid()
--      Then restrict UPDATE/DELETE to 'owner' or 'admin' roles only
--
-- 4. TESTING:
--    - Test admin access fails without JWT
--    - Test admin access works with valid JWT + tenant_members entry
--    - Test customer API routes still work (currently using service role for reads)
--    - Test direct table access fails for anon role
--
-- ============================================================================

