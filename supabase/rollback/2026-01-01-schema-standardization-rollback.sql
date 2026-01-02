-- ROLLBACK: Schema Standardization Migration
-- Date: 2026-01-01
-- Use this ONLY if the migration caused issues

-- ============================================================================
-- ROLLBACK STEPS
-- ============================================================================

-- 1. Make business_email nullable again (in case migration failed midway)
ALTER TABLE tenants
ALTER COLUMN business_email DROP NOT NULL;

-- 2. Remove schema_migrations_log entry
DELETE FROM schema_migrations_log
WHERE migration_file = '2026-01-01-schema-standardization.sql';

-- 3. Drop schema_migrations_log table (if you want to completely revert)
-- DROP TABLE IF EXISTS schema_migrations_log;

-- 4. Remove column comments from time_slots
COMMENT ON COLUMN time_slots.slot_time IS NULL;
COMMENT ON COLUMN time_slots.is_active IS NULL;
COMMENT ON COLUMN time_slots.max_orders IS NULL;
COMMENT ON COLUMN time_slots.current_orders IS NULL;
COMMENT ON COLUMN time_slots.fulfillment_type IS NULL;
COMMENT ON COLUMN time_slots.generated_by_template IS NULL;
COMMENT ON COLUMN time_slots.is_overridden IS NULL;

-- ============================================================================
-- NOTE: DATA CANNOT BE ROLLED BACK
-- ============================================================================
-- The UPDATE statement that copied owner_email → business_email cannot be undone.
-- If you need to restore data, use a database backup.
--
-- However, this is NOT destructive because:
-- - owner_email and owner_phone columns were NOT dropped (commented out)
-- - All original data is still intact
-- - Only business_email/business_phone were populated (safe operation)

SELECT 'Rollback completed. Original data (owner_email/owner_phone) is still intact.' AS status;

