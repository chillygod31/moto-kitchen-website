-- ============================================================================
-- Create Delivery Zones for Moto Kitchen
-- Sets up delivery zones based on Dutch postcode prefixes
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

  -- Insert delivery zones
  -- Adjust postcodes and fees based on your delivery area
  
  INSERT INTO delivery_zones (tenant_id, name, rule_type, postcode_prefix, fee, min_order, is_active) VALUES
  -- Amsterdam area (10xx, 20xx)
  (moto_kitchen_id, 'Amsterdam - 10xx', 'postcode', '10', 5.00, 0, true),
  (moto_kitchen_id, 'Amsterdam - 20xx', 'postcode', '20', 5.00, 0, true),
  
  -- Utrecht area (30xx)
  (moto_kitchen_id, 'Utrecht Area', 'postcode', '30', 7.50, 0, true),
  
  -- Eindhoven area (50xx)
  (moto_kitchen_id, 'Eindhoven Area', 'postcode', '50', 10.00, 0, true),
  
  -- The Hague area (25xx, 26xx)
  (moto_kitchen_id, 'The Hague - 25xx', 'postcode', '25', 8.00, 0, true),
  (moto_kitchen_id, 'The Hague - 26xx', 'postcode', '26', 8.00, 0, true),
  
  -- Nijmegen area (60xx)
  (moto_kitchen_id, 'Nijmegen Area', 'postcode', '60', 10.00, 0, true)
  ON CONFLICT (tenant_id, postcode_prefix) DO UPDATE
  SET fee = EXCLUDED.fee,
      min_order = EXCLUDED.min_order,
      is_active = EXCLUDED.is_active;

  RAISE NOTICE 'Delivery zones created successfully!';
END $$;

-- Verify zones were created
SELECT 
  name,
  postcode_prefix,
  fee,
  min_order,
  is_active
FROM delivery_zones
WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'moto-kitchen')
ORDER BY fee, postcode_prefix;
