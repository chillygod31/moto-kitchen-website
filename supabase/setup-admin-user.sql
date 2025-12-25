-- ============================================================================
-- Step 3: Create tenant_members Entry
-- 
-- This script links a Supabase Auth user to the Moto Kitchen tenant
-- 
-- INSTRUCTIONS:
-- 1. First, create a user in Supabase Dashboard → Authentication → Users
-- 2. Copy the User ID (UUID) from the user you created
-- 3. Run the queries below, replacing YOUR_USER_ID with the actual UUID
-- ============================================================================

-- Step 1: Find your tenant ID
SELECT id, name, slug 
FROM tenants 
WHERE slug = 'moto-kitchen';

-- Step 2: Check if tenant_members table exists and see its structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tenant_members' 
AND table_schema = 'public';

-- Step 3: Insert the tenant member entry
-- REPLACE 'YOUR_USER_ID_HERE' with the UUID from Supabase Auth
-- REPLACE 'YOUR_TENANT_ID_HERE' with the UUID from Step 1 query result

INSERT INTO tenant_members (tenant_id, user_id, role, created_at)
VALUES (
  (SELECT id FROM tenants WHERE slug = 'moto-kitchen'),  -- Auto-get tenant ID
  'YOUR_USER_ID_HERE',  -- Replace with actual user UUID from Supabase Auth
  'owner',  -- Role: 'owner', 'admin', or 'staff'
  NOW()
)
ON CONFLICT (tenant_id, user_id) DO NOTHING;  -- Prevent duplicates

-- Step 4: Verify the entry was created
SELECT 
  tm.id,
  tm.role,
  tm.created_at,
  t.name as tenant_name,
  t.slug as tenant_slug,
  au.email as user_email,
  au.id as user_id
FROM tenant_members tm
JOIN tenants t ON t.id = tm.tenant_id
LEFT JOIN auth.users au ON au.id = tm.user_id::uuid
WHERE t.slug = 'moto-kitchen';

-- ============================================================================
-- ALTERNATIVE: If you want to use the tenant ID directly
-- ============================================================================

-- First, get your tenant ID:
-- SELECT id FROM tenants WHERE slug = 'moto-kitchen';
-- Copy the UUID, then use it below:

-- INSERT INTO tenant_members (tenant_id, user_id, role, created_at)
-- VALUES (
--   'PASTE_TENANT_ID_HERE',
--   'PASTE_USER_ID_HERE',
--   'owner',
--   NOW()
-- );

