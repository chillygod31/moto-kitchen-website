# RLS Migration Status

**Migration File**: `supabase/migrations/switch-to-jwt-rls.sql`  
**Status**: ✅ Ready to run  
**Last Updated**: 2025-12-25

---

## ✅ Completed

1. **Migration file created** - `switch-to-jwt-rls.sql`
   - Drops old `current_setting('app.tenant_id')` policies
   - Creates JWT + tenant_members based policies for admin
   - Revokes public SELECT on all tables
   - Allows anon INSERT for orders/order_items/payments with validation

2. **Customer routes updated** (temporary service role usage):
   - ✅ `/api/menu` - switched to `createServerAdminClient()`
   - ✅ `/api/time-slots` - switched to `createServerAdminClient()`
   - ✅ `/api/business-settings` - switched to `createServerAdminClient()`
   - ✅ `/api/orders/stats` - switched to `createServerAdminClient()`
   - All routes keep `.eq('tenant_id', tenantId)` filtering for defense in depth

3. **Migration guide created** - `RLS_MIGRATION_GUIDE.md`

---

## ⏳ Next Steps

### Step 1: Run Migration (READY)

1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `supabase/migrations/switch-to-jwt-rls.sql`
3. Run the migration
4. Verify policies were created:
   ```sql
   SELECT tablename, policyname 
   FROM pg_policies 
   WHERE schemaname = 'public' 
   AND tablename IN ('menu_items', 'orders', 'order_items')
   ORDER BY tablename, policyname;
   ```

### Step 2: Test Customer Routes

Test that these still work:
- ✅ `/api/menu` - should return menu items
- ✅ `/api/time-slots` - should return time slots
- ✅ `/api/business-settings` - should return settings
- ✅ `/api/orders` POST - should create orders (anon INSERT allowed)
- ✅ `/api/contact` POST - should create quote requests

### Step 3: Integrate Supabase Auth (FUTURE)

**Not started yet** - Required for admin routes to use JWT-based RLS:

1. Replace password-based admin auth with Supabase Auth
2. Create users in Supabase Auth dashboard
3. Create entries in `tenant_members` table linking users to tenants
4. Update admin routes to use anon key with JWT token
5. Remove service role usage from admin CRUD operations

---

## 📋 Migration Checklist

Before running:
- [x] Migration file created
- [x] Customer routes updated to use service role (temporary)
- [ ] Review migration SQL one more time
- [ ] Backup database (recommended)

After running:
- [ ] Verify migration succeeded
- [ ] Test customer routes work
- [ ] Test admin routes still work (service role bypasses RLS)
- [ ] Document that admin routes need JWT migration next

---

## ⚠️ Important Notes

1. **Customer routes**: Now use service role temporarily - this is acceptable for MVP. Tenant isolation still enforced via app-level filtering.

2. **Admin routes**: Still use service role, so RLS policies don't apply yet. This needs to be fixed in Phase 2 (Supabase Auth integration).

3. **Order creation**: Works with anon key because INSERT is allowed by RLS policy (with validation).

4. **No public SELECT**: Direct table access is blocked, data must come through Next.js API routes.

---

## 🔄 After Migration

- Admin routes will continue working (service role bypasses RLS)
- Customer routes will continue working (now using service role)
- Order creation will work (anon INSERT allowed)
- RLS policies are in place for when admin switches to JWT
- Public SELECT is blocked (security improvement)

---

**Next Major Task**: Supabase Auth integration for admin routes (Phase 2)

