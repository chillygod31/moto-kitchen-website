-- Migration: Add delivery time slot support
-- Adds fulfillment_type, start_time, end_time, duration_minutes, delivery_zone_id to time_slots

-- ============================================================================
-- 1. Add new columns to time_slots table
-- ============================================================================

ALTER TABLE time_slots
  ADD COLUMN IF NOT EXISTS fulfillment_type TEXT CHECK (fulfillment_type IN ('pickup', 'delivery')) DEFAULT 'pickup',
  ADD COLUMN IF NOT EXISTS start_time TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS end_time TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 60,
  ADD COLUMN IF NOT EXISTS delivery_zone_id UUID REFERENCES delivery_zones(id) ON DELETE SET NULL;

-- ============================================================================
-- 2. Migrate existing data
-- ============================================================================

-- Set start_time and end_time for existing slots (assuming 60-minute slots)
UPDATE time_slots
SET 
  start_time = slot_time,
  end_time = slot_time + INTERVAL '60 minutes',
  duration_minutes = 60,
  fulfillment_type = 'pickup'
WHERE start_time IS NULL;

-- ============================================================================
-- 3. Add indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_time_slots_fulfillment_type ON time_slots(fulfillment_type);
CREATE INDEX IF NOT EXISTS idx_time_slots_delivery_zone ON time_slots(delivery_zone_id) WHERE delivery_zone_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_time_slots_start_time ON time_slots(start_time);

-- ============================================================================
-- 4. Add separate capacity settings to tenant_business_settings
-- ============================================================================

ALTER TABLE tenant_business_settings
  ADD COLUMN IF NOT EXISTS max_orders_per_pickup_slot INTEGER,
  ADD COLUMN IF NOT EXISTS max_orders_per_delivery_window INTEGER;

-- Set defaults based on existing max_orders_per_slot if it exists
UPDATE tenant_business_settings
SET 
  max_orders_per_pickup_slot = COALESCE(max_orders_per_pickup_slot, max_orders_per_slot, 10),
  max_orders_per_delivery_window = COALESCE(max_orders_per_delivery_window, 5)
WHERE max_orders_per_pickup_slot IS NULL OR max_orders_per_delivery_window IS NULL;

