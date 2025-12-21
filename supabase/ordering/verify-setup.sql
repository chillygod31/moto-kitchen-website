-- ============================================================================
-- Comprehensive Database Verification
-- Run this to check if everything is set up correctly
-- ============================================================================

-- ============================================================================
-- 1. CHECK CORE TABLES EXIST
-- ============================================================================
SELECT 
  '1. Core Tables Check' as section,
  table_name,
  CASE WHEN EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = t.table_name
  ) THEN '✓ EXISTS' ELSE '✗ MISSING' END as status
FROM (VALUES 
  ('tenants'),
  ('tenant_members'),
  ('tenant_branding'),
  ('tenant_business_settings'),
  ('subscription_plans'),
  ('tenant_subscriptions'),
  ('menu_categories'),
  ('menu_items'),
  ('delivery_zones'),
  ('time_slots'),
  ('orders'),
  ('order_items'),
  ('payments')
) AS t(table_name)
ORDER BY table_name;

-- ============================================================================
-- 2. CHECK MOTO KITCHEN TENANT EXISTS
-- ============================================================================
SELECT 
  '2. Tenant Check' as section,
  name,
  slug,
  owner_email,
  status,
  onboarding_completed,
  CASE WHEN id IS NOT NULL THEN '✓ EXISTS' ELSE '✗ MISSING' END as status_check
FROM tenants
WHERE slug = 'moto-kitchen';

-- ============================================================================
-- 3. CHECK SUBSCRIPTION SETUP
-- ============================================================================
SELECT 
  '3. Subscription Check' as section,
  sp.name as plan_name,
  sp.slug as plan_slug,
  ts.status as subscription_status,
  CASE WHEN ts.id IS NOT NULL THEN '✓ LINKED' ELSE '✗ NOT LINKED' END as status_check
FROM tenants t
LEFT JOIN tenant_subscriptions ts ON ts.tenant_id = t.id
LEFT JOIN subscription_plans sp ON sp.id = ts.plan_id
WHERE t.slug = 'moto-kitchen';

-- ============================================================================
-- 4. CHECK MENU CATEGORIES
-- ============================================================================
SELECT 
  '4. Menu Categories' as section,
  mc.name as category_name,
  mc.sort_order,
  mc.is_active,
  COUNT(mi.id) as item_count,
  CASE WHEN COUNT(mi.id) > 0 THEN '✓ HAS ITEMS' ELSE '⚠ NO ITEMS' END as status_check
FROM menu_categories mc
LEFT JOIN menu_items mi ON mi.category_id = mc.id
JOIN tenants t ON mc.tenant_id = t.id
WHERE t.slug = 'moto-kitchen'
GROUP BY mc.id, mc.name, mc.sort_order, mc.is_active
ORDER BY mc.sort_order;

-- ============================================================================
-- 5. CHECK MENU ITEMS STRUCTURE
-- ============================================================================
SELECT 
  '5. Menu Items Summary' as section,
  COUNT(*) as total_items,
  COUNT(DISTINCT category_id) as categories_with_items,
  COUNT(CASE WHEN category_id IS NULL THEN 1 END) as items_without_category,
  COUNT(CASE WHEN is_available = true THEN 1 END) as available_items,
  SUM(CASE WHEN category_id IS NULL THEN 1 ELSE 0 END) as items_missing_category
FROM menu_items mi
JOIN tenants t ON mi.tenant_id = t.id
WHERE t.slug = 'moto-kitchen';

-- ============================================================================
-- 6. CHECK FOR ITEMS WITHOUT CATEGORIES (SHOULD BE 0)
-- ============================================================================
SELECT 
  '6. Items Without Categories' as section,
  mi.name,
  mi.id,
  CASE WHEN mi.category_id IS NULL THEN '✗ MISSING CATEGORY' ELSE '✓ HAS CATEGORY' END as status_check
FROM menu_items mi
JOIN tenants t ON mi.tenant_id = t.id
WHERE t.slug = 'moto-kitchen'
AND mi.category_id IS NULL;

-- ============================================================================
-- 7. CHECK DELIVERY ZONES
-- ============================================================================
SELECT 
  '7. Delivery Zones' as section,
  COUNT(*) as zone_count,
  SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active_zones,
  CASE WHEN COUNT(*) > 0 THEN '✓ EXISTS' ELSE '⚠ NONE CREATED' END as status_check
FROM delivery_zones dz
JOIN tenants t ON dz.tenant_id = t.id
WHERE t.slug = 'moto-kitchen';

-- ============================================================================
-- 8. CHECK TIME SLOTS
-- ============================================================================
SELECT 
  '8. Time Slots' as section,
  COUNT(*) as slot_count,
  MIN(slot_time) as earliest_slot,
  MAX(slot_time) as latest_slot,
  SUM(CASE WHEN is_available = true THEN 1 ELSE 0 END) as available_slots,
  CASE WHEN COUNT(*) > 0 THEN '✓ EXISTS' ELSE '⚠ NONE CREATED' END as status_check
FROM time_slots ts
JOIN tenants t ON ts.tenant_id = t.id
WHERE t.slug = 'moto-kitchen';

-- ============================================================================
-- 9. CHECK FOREIGN KEY RELATIONSHIPS
-- ============================================================================
SELECT 
  '9. Foreign Key Check' as section,
  'menu_items → tenants' as relationship,
  COUNT(*) as items_with_valid_tenant,
  CASE WHEN COUNT(*) = (SELECT COUNT(*) FROM menu_items mi2 JOIN tenants t2 ON mi2.tenant_id = t2.id WHERE t2.slug = 'moto-kitchen') 
    THEN '✓ VALID' ELSE '✗ INVALID' END as status_check
FROM menu_items mi
JOIN tenants t ON mi.tenant_id = t.id
WHERE t.slug = 'moto-kitchen'

UNION ALL

SELECT 
  '9. Foreign Key Check',
  'menu_items → menu_categories',
  COUNT(*),
  CASE WHEN COUNT(*) = (SELECT COUNT(*) FROM menu_items mi2 JOIN tenants t2 ON mi2.tenant_id = t2.id WHERE t2.slug = 'moto-kitchen' AND mi2.category_id IS NOT NULL)
    THEN '✓ VALID' ELSE '✗ INVALID' END
FROM menu_items mi
JOIN menu_categories mc ON mi.category_id = mc.id
JOIN tenants t ON mi.tenant_id = t.id
WHERE t.slug = 'moto-kitchen';

-- ============================================================================
-- 10. CHECK TABLE COLUMNS (VERIFY STRUCTURE)
-- ============================================================================
SELECT 
  '10. Menu Items Columns' as section,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'menu_items'
AND column_name IN ('id', 'tenant_id', 'category_id', 'name', 'price', 'description')
ORDER BY ordinal_position;

-- ============================================================================
-- 11. SAMPLE DATA CHECK
-- ============================================================================
SELECT 
  '11. Sample Menu Items' as section,
  mc.name as category,
  mi.name as item_name,
  mi.price,
  mi.is_available
FROM menu_items mi
JOIN menu_categories mc ON mi.category_id = mc.id
JOIN tenants t ON mi.tenant_id = t.id
WHERE t.slug = 'moto-kitchen'
ORDER BY mc.sort_order, mi.sort_order
LIMIT 10;

-- ============================================================================
-- FINAL SUMMARY
-- ============================================================================
SELECT 
  'SUMMARY' as section,
  'Moto Kitchen Tenant' as check_item,
  CASE WHEN EXISTS (SELECT FROM tenants WHERE slug = 'moto-kitchen') THEN '✓' ELSE '✗' END as tenant_status,
  (SELECT COUNT(*) FROM menu_categories mc JOIN tenants t ON mc.tenant_id = t.id WHERE t.slug = 'moto-kitchen')::text as categories_count,
  (SELECT COUNT(*) FROM menu_items mi JOIN tenants t ON mi.tenant_id = t.id WHERE t.slug = 'moto-kitchen')::text as items_count,
  CASE WHEN EXISTS (
    SELECT FROM menu_items mi 
    JOIN tenants t ON mi.tenant_id = t.id 
    WHERE t.slug = 'moto-kitchen' AND mi.category_id IS NULL
  ) THEN '✗ Has items without categories' ELSE '✓ All items have categories' END as category_status;

