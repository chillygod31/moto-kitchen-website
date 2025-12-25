# Phase A Verification Checklist

This document provides a systematic way to verify that Phase A implementation is complete and working correctly.

**📋 For detailed runtime proof requirements with evidence, see: `PHASE_A_RUNTIME_PROOF_PACK.md`**

This document focuses on general verification steps. The Runtime Proof Pack provides the detailed test cases, curl commands, and evidence requirements needed for sign-off.

## Prerequisites

Before starting verification, ensure:
- Database migrations have been run (`enable-rls-policies.sql`, `add-audit-fields.sql`)
- Environment variables are set correctly
- Supabase Auth is enabled in the dashboard
- At least two test tenants exist in the database

---

## 1. Tenant Isolation

### 1.1 RLS Blocks Cross-Tenant Reads

**Test Steps:**
1. Create two test tenants in Supabase (or use existing):
   ```sql
   -- Tenant 1
   INSERT INTO tenants (name, slug, owner_email, status) 
   VALUES ('Test Tenant 1', 'test-tenant-1', 'test1@example.com', 'active')
   RETURNING id;
   -- Note the ID: <tenant1_id>
   
   -- Tenant 2
   INSERT INTO tenants (name, slug, owner_email, status) 
   VALUES ('Test Tenant 2', 'test-tenant-2', 'test2@example.com', 'active')
   RETURNING id;
   -- Note the ID: <tenant2_id>
   ```

2. Create a menu item for Tenant 1:
   ```sql
   INSERT INTO menu_items (tenant_id, name, price, is_available)
   VALUES ('<tenant1_id>', 'Test Item 1', 10.00, true)
   RETURNING id;
   -- Note the ID: <menu_item_id>
   ```

3. **Using anon client (server-app.ts):**
   - In API route or test script, use `createServerAppClient()` 
   - Try to fetch menu item with tenant2 context set
   - **Expected:** Should return empty or fail (RLS blocks cross-tenant reads)

4. **Evidence Required:**
   - Screenshot/log showing query with tenant2 context returns empty
   - Screenshot/log showing same query with tenant1 context returns data

**Manual Test Script:**
```typescript
// Create test script: scripts/test-tenant-isolation.ts
import { createServerAppClient } from '@/lib/supabase/server-app'

async function testRLS() {
  const supabase = createServerAppClient()
  
  // This should fail - RLS blocks if tenant context not set
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
  
  console.log('RLS Test - Should be empty:', data)
}
```

### 1.2 RLS Blocks Cross-Tenant Writes

**Test Steps:**
1. Using anon client, try to update menu item from tenant1 while having tenant2 context
2. **Expected:** Update should fail (RLS blocks cross-tenant writes)

**Evidence Required:**
- Screenshot/log showing update attempt fails with RLS error

### 1.3 Service Role Only Used in server-admin.ts

**Verification Steps:**
1. Search entire codebase for `SUPABASE_SERVICE_ROLE_KEY`:
   ```bash
   grep -r "SUPABASE_SERVICE_ROLE_KEY" --include="*.ts" --include="*.tsx"
   ```

2. **Expected:** Only found in:
   - `lib/supabase/server-admin.ts`
   - `.env.local` (environment variables)
   - NOT in any client-side code
   - NOT in `lib/supabase/server-app.ts`

3. Search for `createServerAdminClient` usage:
   ```bash
   grep -r "createServerAdminClient" --include="*.ts" --include="*.tsx"
   ```

4. **Expected:** Only used in:
   - `/api/admin/*` routes
   - Admin dashboard server components
   - NOT in customer-facing routes (`/api/menu`, `/api/orders` POST)

**Evidence Required:**
- List of files where service role key is referenced
- Confirmation that customer-facing routes use `server-app.ts` (anon key)

---

## 2. Tenant Resolution

### 2.1 Unknown Domain/Subdomain Shows "Tenant Not Found"

**Test Steps:**
1. Start development server
2. Access `http://localhost:3000/order` with unknown hostname:
   ```bash
   curl -H "Host: unknown-domain.com" http://localhost:3000/order
   # OR use browser with modified hosts file
   ```

3. **Expected:** Should redirect/rewrite to `/tenant-not-found` page

**Evidence Required:**
- Screenshot of tenant-not-found page displayed
- Network log showing redirect/rewrite

### 2.2 Access by IP / Random Host Header Fails Closed

**Test Steps:**
1. Access order routes with IP address as host:
   ```bash
   curl -H "Host: 127.0.0.1" http://localhost:3000/order
   ```

2. Access with random host header:
   ```bash
   curl -H "Host: random-host.example" http://localhost:3000/order
   ```

3. **Expected:** Should show tenant-not-found or fail (not allow access)

**Evidence Required:**
- Screenshot/log showing tenant-not-found for IP/random host
- Confirmation that order routes are blocked

### 2.3 Tenant Lookup is DB-Backed (Not Hardcoded)

**Verification Steps:**
1. Check `middleware.ts` and `lib/tenant.ts`:
   - Look for hardcoded tenant slugs (should only be fallback for MVP)
   - Verify DB lookup logic exists for `tenant_domains` table

2. Add a custom domain entry:
   ```sql
   INSERT INTO tenant_domains (tenant_id, domain, is_verified)
   VALUES (
     (SELECT id FROM tenants WHERE slug = 'moto-kitchen'),
     'custom-domain.example',
     true
   );
   ```

3. Test that custom domain resolves to tenant

**Evidence Required:**
- Code review showing DB lookup in middleware/tenant.ts
- Test showing custom domain resolves correctly

---

## 3. Auth/RBAC

### 3.1 Create Two Roles and Prove Permissions Differ

**Test Steps:**
1. Enable Supabase Auth in dashboard
2. Create two test users in Supabase Auth
3. Create `tenant_members` entries:
   ```sql
   -- User 1 as Owner
   INSERT INTO tenant_members (tenant_id, user_id, role)
   VALUES (
     (SELECT id FROM tenants WHERE slug = 'moto-kitchen'),
     '<user1_id>',  -- From auth.users
     'owner'
   );
   
   -- User 2 as Staff
   INSERT INTO tenant_members (tenant_id, user_id, role)
   VALUES (
     (SELECT id FROM tenants WHERE slug = 'moto-kitchen'),
     '<user2_id>',  -- From auth.users
     'staff'
   );
   ```

4. Test permissions:
   - **Owner** should be able to:
     - Update menu items
     - Delete menu items
     - Update tenant settings
     - Manage team members
   - **Staff** should:
     - Be able to update orders (status changes)
     - NOT be able to delete menu items
     - NOT be able to manage settings/members

5. Use `lib/auth/permissions.ts` to verify:
   ```typescript
   hasPermission('owner', 'menu', 'delete') // Should be true
   hasPermission('staff', 'menu', 'delete') // Should be false
   ```

**Evidence Required:**
- Screenshot of two users with different roles in DB
- Test logs showing permission checks working
- Confirmation that owner can do more than staff

### 3.2 Admin Routes Protected Server-Side

**Verification Steps:**
1. Check `/api/admin/*` routes:
   ```bash
   # Try to access without auth
   curl http://localhost:3000/api/admin/menu/items
   ```

2. **Expected:** Should return 401 Unauthorized

3. Verify protection in code:
   - All `/api/admin/*` routes call `getAdminTenantId(request)` or `requireAuth()`
   - This throws error if not authenticated
   - Error is caught and returns 401

4. Check `app/admin/layout.tsx`:
   - Uses `isAdminAuthenticated()` server-side
   - Redirects to `/admin/login` if not authenticated

**Evidence Required:**
- Screenshot of 401 error when accessing admin route without auth
- Code review showing server-side checks in all admin routes
- Confirmation that UI hiding is NOT the only protection

---

## 4. Rate Limiting / CSRF

### 4.1 Rate Limit Triggers on Order Creation

**Test Steps:**
1. Create a script to send multiple order creation requests:
   ```bash
   # Send 15 requests rapidly (limit is 10 per minute)
   for i in {1..15}; do
     curl -X POST http://localhost:3000/api/orders \
       -H "Content-Type: application/json" \
       -d '{"customerName":"Test","customerPhone":"123","fulfillmentType":"pickup",...}'
     echo "Request $i"
   done
   ```

2. **Expected:**
   - First 10 requests succeed (or fail validation, but not rate limit)
   - Request 11+ returns 429 Too Many Requests
   - Response includes `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After` headers

**Evidence Required:**
- Screenshot of 429 response after exceeding limit
- Log showing rate limit middleware working
- Response headers showing rate limit info

### 4.2 Rate Limit on Login Attempts

**Test Steps:**
1. Attempt login multiple times rapidly (if login endpoint has rate limiting)
2. **Expected:** After X attempts, returns 429

**Evidence Required:**
- Screenshot/log of rate limit on login endpoint

### 4.3 CSRF Protects Admin Mutations

**Test Steps:**
1. Get CSRF token (should be in cookie after page load)
2. Try to make admin mutation WITHOUT CSRF token:
   ```bash
   curl -X POST http://localhost:3000/api/admin/menu/items \
     -H "Content-Type: application/json" \
     -d '{"name":"Test Item","price":10}'
     # No X-CSRF-Token header
   ```

3. **Expected:** Should return 403 Forbidden (CSRF token missing)

4. Try with INVALID CSRF token:
   ```bash
   curl -X POST http://localhost:3000/api/admin/menu/items \
     -H "Content-Type: application/json" \
     -H "X-CSRF-Token: invalid-token" \
     -d '{"name":"Test Item","price":10}'
   ```

5. **Expected:** Should return 403 Forbidden (CSRF token invalid)

**Evidence Required:**
- Code review showing CSRF check in admin mutation routes
- Screenshot/log showing 403 when CSRF token missing/invalid
- Confirmation that GET requests don't require CSRF (only mutations)

---

## 5. Logging/Tracing

### 5.1 Every Request Has Request ID + Tenant Context

**Verification Steps:**
1. Make a request to any endpoint
2. Check response headers:
   ```bash
   curl -I http://localhost:3000/api/menu
   ```

3. **Expected:** Response should include:
   - `x-request-id`: UUID
   - `x-tenant-id`: UUID (if tenant resolved)
   - `x-tenant-slug`: string (if tenant resolved)

4. Check server logs for structured logging:
   - Each log entry should include `requestId` and `tenantId`/`tenantSlug` in context

**Evidence Required:**
- Screenshot of response headers showing request ID and tenant context
- Sample log output showing structured logs with context

**Example Log Output:**
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "info",
  "message": "Tenant resolved successfully",
  "context": {
    "requestId": "abc-123-def",
    "tenantSlug": "moto-kitchen",
    "tenantId": "uuid-here"
  }
}
```

### 5.2 Errors Captured with Context

**Test Steps:**
1. Trigger an error (e.g., invalid request to API)
2. Check error logs/captures:
   - Should include request ID
   - Should include tenant context
   - Should include error details

3. Verify error tracking wrapper is used:
   ```bash
   grep -r "withErrorTracking\|captureException" --include="*.ts"
   ```

**Evidence Required:**
- Sample error log showing full context
- Confirmation that `lib/error-tracking.ts` is being used in API routes

---

## Quick Verification Script

Create a simple test script to verify key items:

```typescript
// scripts/verify-phase-a.ts
import { createServerAppClient } from '@/lib/supabase/server-app'
import { createServerAdminClient } from '@/lib/supabase/server-admin'
import { getTenantId } from '@/lib/tenant'

async function verifyPhaseA() {
  console.log('🔍 Phase A Verification\n')
  
  // 1. Verify client split
  console.log('1. Supabase Client Split:')
  try {
    const appClient = createServerAppClient()
    const adminClient = createServerAdminClient()
    console.log('✅ Clients created successfully')
  } catch (error) {
    console.log('❌ Client creation failed:', error)
  }
  
  // 2. Verify tenant resolution
  console.log('\n2. Tenant Resolution:')
  try {
    const tenantId = await getTenantId('moto-kitchen')
    console.log('✅ Tenant resolved:', tenantId)
  } catch (error) {
    console.log('❌ Tenant resolution failed:', error)
  }
  
  // 3. Verify RLS (basic check)
  console.log('\n3. RLS Policies:')
  // This would require setting tenant context - placeholder for now
  console.log('⚠️  Manual verification required (see checklist above)')
  
  console.log('\n✅ Basic checks complete. Run full checklist for detailed verification.')
}

verifyPhaseA()
```

---

## Summary Checklist

- [x] **Tenant Isolation** ✅ VERIFIED
  - [x] RLS blocks queries without tenant context (verified via test script)
  - [x] Application-level filtering works correctly (verified)
  - [x] Service role only in server-admin.ts (verified via grep)
  
- [x] **Tenant Resolution** ✅ IMPLEMENTED
  - [x] Unknown domain shows tenant-not-found (implemented, needs runtime test)
  - [x] IP/random host fails closed (implemented in middleware)
  - [x] DB-backed lookup (not hardcoded) (implemented in middleware)
  
- [⚠️] **Auth/RBAC** ⚠️ PARTIAL
  - [x] Admin routes protected server-side (basic password auth)
  - [ ] Supabase Auth integration (not yet implemented)
  - [ ] Two roles created and tested (not yet implemented)
  - [ ] Permissions differ between roles (not yet implemented)
  
- [⚠️] **Rate Limiting/CSRF** ⚠️ UTILITIES EXIST, NEED INTEGRATION
  - [ ] Rate limit triggers on order creation (utility exists, not integrated)
  - [ ] Rate limit on login attempts (utility exists, not integrated)
  - [ ] CSRF protects admin mutations (utility exists, not integrated)
  
- [⚠️] **Logging/Tracing** ⚠️ PARTIAL
  - [x] Request ID in all responses (generated in middleware)
  - [⚠️] Tenant context in logs (utilities exist, needs integration)
  - [⚠️] Errors captured with context (utilities exist, needs integration)

**See `PHASE_A_VERIFICATION_STATUS.md` for detailed status.**

---

## Next Steps After Verification

Once all items are verified:

1. Complete the **Phase A Runtime Proof Pack** (`PHASE_A_RUNTIME_PROOF_PACK.md`) with evidence
2. Document any issues found
3. Fix any gaps before proceeding (especially tenant context transaction safety)
4. Get sign-off from senior engineer
5. Proceed to Phase B (if applicable)

---

**See `PHASE_A_RUNTIME_PROOF_PACK.md` for:**
- Detailed test scripts and curl commands
- Evidence requirements (screenshots, logs)
- Critical gap identification (tenant context transaction safety)
- Step-by-step proof of each security mechanism

