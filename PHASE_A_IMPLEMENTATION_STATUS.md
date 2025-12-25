# Phase A Implementation Status

## ✅ Completed

1. **Installed @supabase/ssr** - For proper cookie-based session management
2. **Created server-auth.ts** - Helper for authenticated Supabase clients with JWT
3. **Created server-admin.ts** - Admin auth helpers using Supabase Auth
4. **Updated admin login page** - Now uses email/password instead of just password
5. **Updated admin auth route** - Now uses Supabase Auth instead of password-based

## ⏳ In Progress

### Next Steps (Critical):

1. **Fix cookie handling in auth route** - @supabase/ssr cookie management needs refinement
2. **Update all admin routes** to use `createServerAuthClient()` instead of `createServerAdminClient()`
3. **Update getAdminTenantId** to use new auth system
4. **Run RLS migration** in Supabase SQL Editor

### Files that need updating:

- `app/api/admin/menu/items/route.ts` - Switch to JWT client
- `app/api/admin/menu/items/[id]/route.ts` - Switch to JWT client
- `app/api/admin/menu/categories/route.ts` - Switch to JWT client
- `app/api/orders/route.ts` (GET method) - Switch to JWT client
- `app/api/orders/[id]/route.ts` - Switch to JWT client
- `app/api/quotes/route.ts` - Switch to JWT client
- `app/api/quotes/[id]/route.ts` - Switch to JWT client
- `lib/admin-auth.ts` - Update to use new auth system (or deprecate)

## 🔍 Issues to Resolve

1. **Cookie handling**: @supabase/ssr uses different cookie names. Need to ensure cookies are properly set/forwarded in API routes.

2. **getAdminTenantId**: Currently uses old password-based session. Needs to use Supabase Auth session.

## 📝 Notes

- Admin routes currently still use `createServerAdminClient()` (service role)
- Need to switch to `createServerAuthClient()` for RLS to apply
- Customer routes will continue using service role temporarily (acceptable for MVP)

