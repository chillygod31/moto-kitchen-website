-- ============================================================================
-- Add Audit Fields (created_by, updated_by) to Key Tables
-- Phase A: Foundation - Production-safe audit tracking
-- ============================================================================
--
-- This migration adds created_by and updated_by columns to key tables
-- for tracking who created/updated records.
--
-- Note: These fields reference auth.users.id and will be populated
-- from tenant context once Supabase Auth is fully integrated.
-- ============================================================================

-- ============================================================================
-- STEP 1: Add audit fields to key tables
-- ============================================================================

-- Menu tables
ALTER TABLE menu_items 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

ALTER TABLE menu_categories 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Order tables
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Time slots
ALTER TABLE time_slots 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- Delivery zones
ALTER TABLE delivery_zones 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);

-- ============================================================================
-- STEP 2: Create indexes for audit fields (optional, for queries)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_menu_items_created_by ON menu_items(created_by) WHERE created_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_menu_items_updated_by ON menu_items(updated_by) WHERE updated_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_created_by ON orders(created_by) WHERE created_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_updated_by ON orders(updated_by) WHERE updated_by IS NOT NULL;

-- ============================================================================
-- STEP 3: Update triggers to populate updated_by
-- ============================================================================
--
-- Note: We'll populate updated_by via application code for now.
-- In the future, we can create a trigger function that reads from
-- current_setting('app.user_id', true) if we set it in the session.
--
-- For now, application code should set updated_by before updates.
-- ============================================================================

-- ============================================================================
-- NOTES:
-- ============================================================================
--
-- 1. created_by should be set when inserting new records
-- 2. updated_by should be set when updating existing records
-- 3. These fields are nullable because:
--    - Customer orders won't have auth.users (created_by = NULL is OK)
--    - System operations might not have user context
--    - Legacy data won't have these fields
--
-- 4. Application code should populate these fields:
--    - For admin operations: Set from authenticated user
--    - For customer operations: Leave as NULL (or use system user)
--
-- ============================================================================

