# RLS Migration Guide: Switching to JWT + tenant_members

**Status:** ⚠️ Migration created but NOT YET RUN

**Important:** This migration will break customer-facing routes if run immediately. Read this guide first.

---

## Current State

- **Admin routes**: Use `createServerAdminClient()` (service role) - bypasses RLS
- **Customer routes**: Use `createServerAppClient()` (anon key) - currently uses `.eq('tenant_id', ...)` app-level filtering
- **RLS policies**: Use `current_setting('app.tenant_id')` which is never set

---

## What the Migration Does

1. ✅ Drops old `current_setting('app.tenant_id')` policies
2. ✅ Creates JWT + tenant_members based policies for admin
3. ✅ Revokes public SELECT on all tables (anon can't read directly)
4. ✅ Allows anon INSERT for orders/order_items/payments (with validation)
5. ✅ Grants permissions to `authenticated` role (for admin with JWT)

---

## ⚠️ BREAKING CHANGES

### Customer Routes Will Break Initially

After running the migration:
- Customer routes using `createServerAppClient()` will fail SELECT queries
- This is by design - no public SELECT is allowed
- **Temporary solution**: Customer routes must use service role for SELECT until proper solution

### Admin Routes Need Changes

After running the migration:
- Admin routes using `createServerAdminClient()` will still work (service role bypasses RLS)
- BUT: RLS policies won't apply, so tenant isolation isn't DB-enforced
- **Required**: Switch admin routes to use anon key + JWT (Supabase Auth)

---

## Migration Strategy (3 Phases)

### Phase 1: Run Migration + Temporary Service Role for Customer Reads

**Status**: ✅ Migration file ready

1. Run migration: `switch-to-jwt-rls.sql`
2. Update customer routes to use service role for SELECT (temporary)
   - `/api/menu` - use `createServerAdminClient()` for reads
   - `/api/time-slots` - use `createServerAdminClient()` for reads
   - `/api/business-settings` - use `createServerAdminClient()` for reads
   - Keep `.eq('tenant_id', tenantId)` filtering (defense in depth)

**Why**: Allows migration to run without breaking customer routes, while RLS is properly enforced for INSERT operations.

### Phase 2: Integrate Supabase Auth for Admin

**Status**: ⏳ Not started

1. Replace password-based admin auth with Supabase Auth
2. Create users in Supabase Auth
3. Create entries in `tenant_members` table
4. Update admin routes to:
   - Use `createServerAppClient()` (anon key)
   - Pass JWT token in Authorization header
   - Remove service role usage (except system operations)

### Phase 3: Proper Customer Data Access (Future)

**Status**: ⏳ Future enhancement

Options:
- Create read-only service account per tenant
- Use Supabase RLS with domain-based tenant resolution
- Keep service role for customer reads but document it as acceptable

---

## Running the Migration

### Prerequisites

- ✅ Migration file created: `supabase/migrations/switch-to-jwt-rls.sql`
- ⏳ Customer routes updated to use service role for SELECT (temporary)
- ⏳ Supabase Auth integration started for admin

### Steps

1. **Update customer routes first** (to prevent breakage):
   ```typescript
   // Change from:
   const supabase = createServerAppClient()
   
   // To (temporary):
   const supabase = createServerAdminClient()
   // Keep .eq('tenant_id', tenantId) filtering
   ```

2. **Run migration in Supabase SQL Editor**:
   - Copy contents of `switch-to-jwt-rls.sql`
   - Run in Supabase Dashboard → SQL Editor

3. **Verify migration**:
   ```sql
   -- Check policies exist
   SELECT tablename, policyname 
   FROM pg_policies 
   WHERE schemaname = 'public' 
   AND tablename IN ('menu_items', 'orders', 'order_items')
   ORDER BY tablename, policyname;
   
   -- Check RLS is enabled
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' 
   AND tablename IN ('menu_items', 'orders');
   ```

4. **Test customer routes**:
   - `/api/menu` should still work (using service role)
   - `/api/orders` POST should work (anon INSERT allowed)
   - Direct table access should fail (anon SELECT revoked)

5. **Test admin routes** (after Supabase Auth):
   - Admin routes with JWT should work
   - Admin routes without JWT should fail
   - Cross-tenant access should be blocked by RLS

---

## Code Changes Required

### 1. Update Customer Routes (Temporary - Use Service Role)

Files to update:
- `app/api/menu/route.ts`
- `app/api/time-slots/route.ts`
- `app/api/business-settings/route.ts`

Change:
```typescript
// FROM:
const supabase = createServerAppClient()

// TO (temporary):
const supabase = createServerAdminClient()
// Keep .eq('tenant_id', tenantId) for defense in depth
```

### 2. Update Admin Routes (After Supabase Auth Integration)

Files to update (future):
- All files in `app/api/admin/*`
- Switch from `createServerAdminClient()` to `createServerAppClient()` with JWT

---

## Rollback Plan

If migration causes issues:

```sql
-- Restore old policies (if needed)
-- Note: This would restore the broken current_setting approach
-- Better to fix the code than rollback

-- Re-grant SELECT to anon (temporary rollback)
GRANT SELECT ON menu_categories TO anon;
GRANT SELECT ON menu_items TO anon;
GRANT SELECT ON orders TO anon;
GRANT SELECT ON order_items TO anon;
GRANT SELECT ON delivery_zones TO anon;
GRANT SELECT ON time_slots TO anon;
GRANT SELECT ON payments TO anon;
```

---

## Next Steps

1. ✅ Migration file created
2. ⏳ Update customer routes to use service role (temporary)
3. ⏳ Run migration
4. ⏳ Test customer routes work
5. ⏳ Start Supabase Auth integration for admin
6. ⏳ Switch admin routes to use JWT

---

## Questions?

- Why no public SELECT? To prevent cross-tenant data leakage in multi-tenant SaaS
- Why service role for customer reads? Temporary solution until proper tenant-scoped access
- Why JWT for admin? So RLS policies can enforce tenant isolation at DB level
- What about performance? Service role for customer reads is acceptable for MVP, optimize later

