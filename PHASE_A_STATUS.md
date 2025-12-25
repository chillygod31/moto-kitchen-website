# Phase A Status - Current Progress

## ✅ Completed

1. **RLS Migration** - ✅ Complete
   - Migration run successfully
   - JWT-based policies created
   - Public SELECT revoked
   - Anon INSERT allowed for orders

2. **Supabase Auth Integration** - ✅ Complete
   - Admin login uses Supabase Auth
   - JWT sessions stored in cookies
   - Admin layout updated to use new auth
   - Session API route updated

3. **Admin User Setup** - ✅ Complete
   - Admin user created in Supabase Auth
   - tenant_members entry created
   - Login tested and working

## ⏳ Next: Update Admin Routes to Use JWT

**Current State:**
- Admin routes still use `createServerAdminClient()` (service role)
- Service role bypasses RLS, so policies don't apply
- Tenant isolation only enforced at app level (`.eq('tenant_id', ...)`)

**Required Changes:**
Update admin routes to use `createServerAuthClient()` (anon key + JWT) so RLS policies apply.

**Files to update:**
- `app/api/admin/menu/items/route.ts`
- `app/api/admin/menu/items/[id]/route.ts`
- `app/api/admin/menu/categories/route.ts`
- `app/api/orders/route.ts` (GET method)
- `app/api/orders/[id]/route.ts`
- `app/api/quotes/route.ts`
- `app/api/quotes/[id]/route.ts`

**Pattern:**
```typescript
// OLD:
import { createServerAdminClient } from '@/lib/supabase/server-admin'
const supabase = createServerAdminClient()

// NEW:
import { createServerAuthClient } from '@/lib/supabase/server-auth'
const supabase = await createServerAuthClient()
// RLS policies will now enforce tenant isolation automatically
```

---

## After Admin Routes Updated

Once admin routes use JWT:
- ✅ RLS will enforce tenant isolation at DB level
- ✅ Cross-tenant access will be blocked by RLS
- ✅ Phase A core requirements met
- ⏳ Can proceed to role-based RLS (optional)
- ⏳ Can run runtime tests

---

**Status**: Phase A is ~70% complete. Admin routes update is the last critical piece.

