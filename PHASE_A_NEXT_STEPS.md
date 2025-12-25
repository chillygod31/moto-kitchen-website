# Phase A Implementation - Next Steps

## Current Status

✅ **Completed:**
- Installed @supabase/ssr
- Created server-auth helpers
- Updated admin login to use email/password
- Updated admin auth route to use Supabase Auth

⏳ **Next Critical Steps:**

## Step 1: Run RLS Migration (5 minutes)

**Action:** Copy and run `supabase/migrations/switch-to-jwt-rls.sql` in Supabase SQL Editor

**Verify:**
```sql
-- Check policies exist
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('menu_items', 'orders', 'order_items')
ORDER BY tablename, policyname;
```

## Step 2: Create Admin User in Supabase Auth

**Action:**
1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add user" → "Create new user"
3. Enter:
   - Email: `admin@motokitchen.nl` (or your email)
   - Password: [choose secure password]
   - Auto Confirm User: ✅ (checked)
4. Save and copy the User ID (UUID)

## Step 3: Create tenant_members Entry

**Action:** Run in Supabase SQL Editor:
```sql
-- Get your tenant ID
SELECT id FROM tenants WHERE slug = 'moto-kitchen';

-- Insert tenant member (replace YOUR_USER_ID and YOUR_TENANT_ID)
INSERT INTO tenant_members (tenant_id, user_id, role)
VALUES (
  'YOUR_TENANT_ID',
  'YOUR_USER_ID',
  'owner'
);
```

## Step 4: Test Admin Login

**Action:**
1. Go to `/admin/login`
2. Enter email and password
3. Should redirect to `/admin/quotes`
4. Check browser DevTools → Application → Cookies
5. Should see Supabase auth cookies set

## Step 5: Update Admin Routes to Use JWT (After login works)

**Files to update:**
- `app/api/admin/menu/items/route.ts`
- `app/api/admin/menu/items/[id]/route.ts`
- `app/api/admin/menu/categories/route.ts`
- `app/api/orders/route.ts` (GET method)
- `app/api/orders/[id]/route.ts`
- `app/api/quotes/route.ts`
- `app/api/quotes/[id]/route.ts`

**Pattern for each route:**
```typescript
// OLD (service role):
import { createServerAdminClient } from '@/lib/supabase/server-admin'
const supabase = createServerAdminClient()
const tenantId = await getAdminTenantId(request)

// NEW (JWT with RLS):
import { createServerAuthClient } from '@/lib/supabase/server-auth'
import { getAdminTenantId } from '@/lib/auth/server-admin'
const supabase = await createServerAuthClient()
const tenantId = await getAdminTenantId(request)
// RLS policies will enforce tenant isolation automatically
```

## Step 6: Update lib/admin-auth.ts (Deprecate or Update)

**Option A:** Keep for backward compatibility, mark as deprecated
**Option B:** Update to use new auth system
**Option C:** Remove and update all references

## Testing Checklist

After each step:
- [ ] Admin login works
- [ ] Admin routes load data
- [ ] Cross-tenant access is blocked (RLS)
- [ ] Customer routes still work
- [ ] Order creation works (anon INSERT)

## Known Issues / TODOs

1. Cookie handling in API routes may need refinement
2. Multi-tenant user selection (future: allow user to select tenant)
3. Role-based restrictions (owner vs staff) - Phase 2

