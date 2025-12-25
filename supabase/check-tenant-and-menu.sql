-- ============================================================================
-- Quick Check: Moto Kitchen Tenant and Menu Items
-- Run this in Supabase SQL Editor to verify tenant and menu data exists
-- ============================================================================

-- 1. Check Moto Kitchen tenant exists
SELECT 
  id,
  name,
  slug,
  status,
  owner_email,
  created_at
FROM tenants
WHERE slug = 'moto-kitchen';

-- 2. Count menu items for Moto Kitchen
SELECT 
  t.name as tenant_name,
  t.slug,
  COUNT(mi.id) as menu_items_count,
  COUNT(mc.id) as categories_count
FROM tenants t
LEFT JOIN menu_items mi ON mi.tenant_id = t.id
LEFT JOIN menu_categories mc ON mc.tenant_id = t.id
WHERE t.slug = 'moto-kitchen'
GROUP BY t.id, t.name, t.slug;

-- 3. List menu categories for Moto Kitchen
SELECT 
  mc.id,
  mc.name,
  mc.sort_order,
  mc.is_active,
  COUNT(mi.id) as item_count
FROM menu_categories mc
JOIN tenants t ON t.id = mc.tenant_id
LEFT JOIN menu_items mi ON mi.category_id = mc.id AND mi.tenant_id = t.id
WHERE t.slug = 'moto-kitchen'
GROUP BY mc.id, mc.name, mc.sort_order, mc.is_active
ORDER BY mc.sort_order;

-- 4. List menu items for Moto Kitchen (first 20)
SELECT 
  mi.id,
  mi.name,
  mi.price,
  mi.is_available,
  mc.name as category_name
FROM menu_items mi
JOIN tenants t ON t.id = mi.tenant_id
LEFT JOIN menu_categories mc ON mc.id = mi.category_id
WHERE t.slug = 'moto-kitchen'
ORDER BY mc.sort_order, mi.sort_order
LIMIT 20;

-- 5. Check RLS policies on menu_items
SELECT 
  tablename,
  policyname,
  cmd,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'menu_items'
ORDER BY policyname;

-- 6. Check if RLS is enabled
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('menu_items', 'menu_categories', 'orders')
ORDER BY tablename;

-- 7. Check permissions on menu_items
SELECT 
  grantee,
  privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
AND table_name = 'menu_items'
ORDER BY grantee, privilege_type;

