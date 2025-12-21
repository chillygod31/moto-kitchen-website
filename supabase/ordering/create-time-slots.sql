-- ============================================================================
-- Create Time Slots for Moto Kitchen
-- Generates time slots for the next 7 days with multiple slots per day
-- Run this in Supabase SQL Editor AFTER running COMPLETE_SCHEMA_FRESH.sql
-- ============================================================================

DO $$
DECLARE
  moto_kitchen_id UUID;
BEGIN
  -- Get tenant ID
  SELECT id INTO moto_kitchen_id FROM tenants WHERE slug = 'moto-kitchen';
  
  IF moto_kitchen_id IS NULL THEN
    RAISE EXCEPTION 'Moto Kitchen tenant not found. Please run COMPLETE_SCHEMA_FRESH.sql first.';
  END IF;

  -- Create time slots for the next 7 days
  -- Three slots per day: 12:00, 17:00, 19:00
  -- Adjust times and max_orders as needed
  
  INSERT INTO time_slots (tenant_id, slot_time, max_orders, current_orders, is_available)
  SELECT 
    moto_kitchen_id,
    slot_date + slot_time::time,
    10,  -- max orders per slot (adjust as needed)
    0,   -- current orders
    true -- available
  FROM 
    generate_series(
      CURRENT_DATE + INTERVAL '1 day',  -- Start tomorrow
      CURRENT_DATE + INTERVAL '7 days',  -- Next 7 days
      INTERVAL '1 day'
    ) AS slot_date,
    (VALUES ('12:00:00'), ('17:00:00'), ('19:00:00')) AS slot_times(slot_time);

  RAISE NOTICE 'Time slots created successfully for next 7 days!';
END $$;

-- Verify slots were created
SELECT 
  slot_time,
  max_orders,
  current_orders,
  is_available
FROM time_slots
WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'moto-kitchen')
ORDER BY slot_time;
