-- ============================================================================
-- DROP OLD ORDERING SYSTEM TABLES
-- This removes the old structure so we can start fresh with the multi-tenant schema
-- ⚠️ WARNING: This will delete ALL data in these tables!
-- ⚠️ Only run this if you don't have important orders/data to preserve
-- ============================================================================

-- Drop in reverse dependency order (child tables first)
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS menu_items CASCADE;
DROP TABLE IF EXISTS time_slots CASCADE;
DROP TABLE IF EXISTS delivery_rules CASCADE;  -- Old table name
DROP TABLE IF EXISTS delivery_zones CASCADE;   -- New table name (if exists)

-- Verify drops (should return empty or only quote_requests)
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name NOT IN ('quote_requests')  -- Keep the original website table
ORDER BY table_name;

