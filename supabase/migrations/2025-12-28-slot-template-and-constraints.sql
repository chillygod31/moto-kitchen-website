-- Slot management improvements (templates, blackout, constraints, capacity)

-- Add template + blackout to tenant_business_settings
ALTER TABLE tenant_business_settings
  ADD COLUMN IF NOT EXISTS blackout_dates DATE[],
  ADD COLUMN IF NOT EXISTS slot_template JSONB;

-- Seed default slot template if null
UPDATE tenant_business_settings
SET slot_template = COALESCE(
  slot_template,
  '{
    "timezone": "Europe/Amsterdam",
    "days_ahead_customer": 4,
    "days_ahead_admin": 7,
    "exclude_same_day": true,
    "windows": [
      {"start": "11:00", "end": "13:00", "interval_minutes": 30},
      {"start": "17:00", "end": "21:00", "interval_minutes": 30}
    ],
    "default_capacity": 2
  }'::jsonb
)
WHERE slot_template IS NULL;

-- Extend time_slots for template + overrides
ALTER TABLE time_slots
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS generated_by_template BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_overridden BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS fulfillment_type TEXT DEFAULT 'pickup';

-- Ensure slot_time is timestamptz (UTC)
ALTER TABLE time_slots
  ALTER COLUMN slot_time TYPE TIMESTAMPTZ USING slot_time::timestamptz;

-- Unique constraint for idempotent upserts
ALTER TABLE time_slots
  DROP CONSTRAINT IF EXISTS unique_slot_per_tenant;

ALTER TABLE time_slots
  ADD CONSTRAINT unique_slot_per_tenant UNIQUE (tenant_id, fulfillment_type, slot_time);

CREATE INDEX IF NOT EXISTS idx_time_slots_tenant_type_time
  ON time_slots (tenant_id, fulfillment_type, slot_time);

CREATE INDEX IF NOT EXISTS idx_time_slots_active
  ON time_slots (tenant_id, fulfillment_type, slot_time)
  WHERE is_active = true;

-- Orders link to a slot (optional)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS time_slot_id UUID REFERENCES time_slots(id);

-- RPC for atomic booking (capacity check)
CREATE OR REPLACE FUNCTION book_time_slot(p_slot_id UUID, p_tenant_id UUID)
RETURNS TABLE(slot_id UUID, new_current_orders INT, slot_max_orders INT) AS $$
BEGIN
  RETURN QUERY
  UPDATE time_slots
  SET current_orders = current_orders + 1
  WHERE time_slots.id = p_slot_id
    AND time_slots.tenant_id = p_tenant_id
    AND time_slots.is_active = true
    AND (time_slots.current_orders < time_slots.max_orders)
  RETURNING time_slots.id, time_slots.current_orders, time_slots.max_orders;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


