-- ============================================================================
-- Add CHECK Constraint to Prevent Slot Overbooking (Defense-in-Depth)
-- Migration: 2026-01-09
-- Purpose: Add database-level constraint to prevent current_orders > max_orders
-- ============================================================================

-- Add CHECK constraint to time_slots table
-- This is a safety net in addition to the atomic RPC function
ALTER TABLE time_slots
ADD CONSTRAINT check_slot_capacity
CHECK (
  max_orders IS NULL OR current_orders <= max_orders
);

-- Add comment explaining the constraint
COMMENT ON CONSTRAINT check_slot_capacity ON time_slots IS
'Ensures current_orders never exceeds max_orders. Defense-in-depth protection against overbooking.';

-- Verify constraint was added
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'check_slot_capacity'
  ) THEN
    RAISE NOTICE 'CHECK constraint check_slot_capacity added successfully';
  ELSE
    RAISE EXCEPTION 'Failed to add CHECK constraint';
  END IF;
END $$;
