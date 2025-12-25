# Phase A Runtime Proof Pack

**Purpose:** Provide runtime evidence that Phase A security and isolation mechanisms work correctly.

**Deliverable:** Screenshots, logs, recordings, and code snippets for each test below.

---

## ⚠️ CRITICAL GAP: Tenant Context Transaction Safety

**Before starting verification, confirm:**

The RLS policies expect `app.tenant_id` to be set via `SET LOCAL` in PostgreSQL. However, Supabase JS client doesn't directly support this.

**Required confirmation:**
- [ ] How is `app.tenant_id` set per request/transaction?
- [ ] Is it scoped to the request/transaction (won't bleed to other requests)?
- [ ] Is it automatically cleared after the transaction?
- [ ] Can you show the code that sets it?

**If not implemented:** RLS policies won't work correctly, and tenant isolation relies solely on application-level filtering (less secure).

---

## 1. RLS Isolation Proof (Must Have Screenshots/Logs)

**✅ TEST COMPLETED - See test results below**

### Test Results Summary

**Test Script:** `scripts/test-tenant-isolation.ts`
**Test Date:** 2025-12-25
**Status:** ✅ All tests passed

**Results:**
- ✅ Test 1: RLS correctly blocked access without tenant context (returned 0 items)
- ✅ Test 2: Application-level filtering works correctly for tenant_a
- ✅ Test 3: Application-level filtering works correctly for tenant_b  
- ✅ Test 4: Tenant isolation verified (tenant_a filter excludes tenant_b data)
- ✅ Test 5: Moto-kitchen filtering works correctly

**Evidence:**
- Test script output confirms RLS is blocking queries without tenant context
- Application-level filtering (`.eq('tenant_id', ...)`) is working correctly
- All tenants only see their own data when filters are applied
- No cross-tenant data leakage detected

**Known Gap:**
- RLS is enabled but `app.tenant_id` context is not yet set per request
- Currently relying on application-level filtering (which is working correctly)
- RLS will provide additional protection once tenant context is implemented

**Run Test:**
```bash
npm run test:tenant-isolation
```

### Setup: Create Test Tenants and Data

```sql
-- Create tenant_a
INSERT INTO tenants (name, slug, owner_email, status) 
VALUES ('Test Tenant A', 'tenant_a', 'tenanta@test.com', 'active')
RETURNING id;
-- Note: <tenant_a_id>

-- Create tenant_b  
INSERT INTO tenants (name, slug, owner_email, status) 
VALUES ('Test Tenant B', 'tenant_b', 'tenantb@test.com', 'active')
RETURNING id;
-- Note: <tenant_b_id>

-- Create category for tenant_a
INSERT INTO menu_categories (tenant_id, name, is_active)
VALUES ('<tenant_a_id>', 'Tenant A Category', true)
RETURNING id;
-- Note: <category_a_id>

-- Create menu item for tenant_a
INSERT INTO menu_items (tenant_id, category_id, name, price, is_available)
VALUES ('<tenant_a_id>', '<category_a_id>', 'Tenant A Item', 10.00, true)
RETURNING id;
-- Note: <item_a_id>

-- Create order for tenant_a
INSERT INTO orders (tenant_id, order_number, customer_name, customer_phone, fulfillment_type, subtotal, total, status)
VALUES ('<tenant_a_id>', 'ORD-A-001', 'Customer A', '123456789', 'pickup', 10.00, 10.00, 'new')
RETURNING id;
-- Note: <order_a_id>

-- Repeat for tenant_b (use tenant_b_id, category_b_id, item_b_id, order_b_id)
```

### Test 1.1: Cross-Tenant Read Block (Anon Client)

**Test Steps:**
1. Use `createServerAppClient()` (anon key)
2. Set tenant context to `tenant_a_id` (however your implementation does it)
3. Try to read menu items from `tenant_b`
4. **Expected:** Should return empty array or permission error

**Evidence Required:**
- [ ] Code snippet showing the test query
- [ ] Screenshot/log showing query with tenant_a context returns empty for tenant_b data
- [ ] Screenshot/log showing same query returns data for tenant_a

**Test Query Example:**
```typescript
// This is pseudocode - adjust to your actual tenant context implementation
const supabase = createServerAppClient()
// Set tenant context somehow...
await setTenantContext(tenant_a_id, supabase)

// Try to read tenant_b items (should fail/return empty)
const { data, error } = await supabase
  .from('menu_items')
  .select('*')
  .eq('tenant_id', tenant_b_id) // Trying to access tenant_b data

// Should return empty or error
console.log('Cross-tenant read result:', data) // Should be []
```

### Test 1.2: Cross-Tenant Write Block (Anon Client)

**Test Steps:**
1. Set tenant context to `tenant_a_id`
2. Try to UPDATE a menu item belonging to `tenant_b`
3. **Expected:** Should fail with RLS policy error

**Evidence Required:**
- [ ] Code snippet showing update attempt
- [ ] Screenshot/log showing update fails with RLS error
- [ ] Error message clearly indicates policy violation

### Test 1.3: Direct API Call Cross-Tenant Access

**Test Steps:**
1. Make API call to `/api/menu` with headers for tenant_a
2. Try to manipulate request to access tenant_b data
3. **Expected:** Should be blocked (returns empty or error)

**Evidence Required:**
- [ ] curl/Postman request showing tenant_a headers
- [ ] Response showing no tenant_b data
- [ ] Attempt to access tenant_b directly fails

**curl Example:**
```bash
# As tenant_a
curl -H "x-tenant-id: <tenant_a_id>" http://localhost:3000/api/menu

# Try to access tenant_b (should fail)
curl -H "x-tenant-id: <tenant_b_id>" http://localhost:3000/api/menu
# Compare responses - tenant_a should not see tenant_b data
```

---

## 2. Tenant Resolution Fail-Closed Proof

### Test 2.1: Valid Subdomain Resolves

**Test Steps:**
1. Access `http://orders.motokitchen.nl/order` (or configured subdomain)
2. **Expected:** Should resolve to moto-kitchen tenant and show menu

**Evidence Required:**
- [ ] Screenshot showing page loads correctly
- [ ] Log showing tenant resolved correctly
- [ ] Network tab showing `x-tenant-id` and `x-tenant-slug` headers

### Test 2.2: Unknown Domain Shows Tenant-Not-Found

**Test Steps:**
1. Access with unknown domain: `http://orders.somefakebrand.nl/order`
2. **Expected:** Should show `/tenant-not-found` page (no data leaked)

**Evidence Required:**
- [ ] Screenshot of tenant-not-found page
- [ ] Network log showing redirect/rewrite to `/tenant-not-found`
- [ ] No tenant data returned in response

**How to Test:**
```bash
# Modify /etc/hosts or use curl
curl -H "Host: orders.somefakebrand.nl" http://localhost:3000/order
# OR in browser: Add to hosts file: 127.0.0.1 orders.somefakebrand.nl
```

### Test 2.3: Direct IP Access Fails Closed

**Test Steps:**
1. Access `http://127.0.0.1:3000/order` (or server IP)
2. **Expected:** Should show tenant-not-found or block access

**Evidence Required:**
- [ ] Screenshot showing tenant-not-found
- [ ] Log showing IP access rejected
- [ ] No tenant data accessible

**Test:**
```bash
curl -H "Host: 127.0.0.1" http://localhost:3000/order
```

### Test 2.4: Random Host Header Fails

**Test Steps:**
1. Send request with random host header
2. **Expected:** Tenant-not-found or rejection

**Evidence Required:**
- [ ] curl request with random host
- [ ] Response showing tenant-not-found
- [ ] Log entry showing invalid host

**Test:**
```bash
curl -H "Host: random-host.example.com" http://localhost:3000/order
```

### Test 2.5: Missing Tenant Header Fails

**Test Steps:**
1. Make API call without `x-tenant-id` or `x-tenant-slug` headers
2. **Expected:** Request rejected or tenant-not-found

**Evidence Required:**
- [ ] Request without tenant headers
- [ ] Response showing error or tenant-not-found
- [ ] Log showing tenant resolution failure

---

## 3. Admin Protection Proof

### Test 3.1: Admin Routes Require Auth (401)

**Test Steps:**
1. Access `/admin` without authentication
2. **Expected:** Redirect to `/admin/login` or 401 Unauthorized

**Evidence Required:**
- [ ] Screenshot of login page or 401 response
- [ ] Network tab showing redirect
- [ ] Log showing auth failure

**Test:**
```bash
curl http://localhost:3000/admin
# Should redirect or return 401
```

### Test 3.2: Admin API Routes Require Auth (401)

**Test Steps:**
1. Access `/api/admin/menu/items` without auth
2. **Expected:** 401 Unauthorized

**Evidence Required:**
- [ ] curl/Postman request without auth
- [ ] Response showing 401 status
- [ ] Error message indicating unauthorized

**Test:**
```bash
curl http://localhost:3000/api/admin/menu/items
# Expected: 401 Unauthorized
```

### Test 3.3: Auth Without Role → 403

**Test Steps:**
1. Authenticate a user who is NOT in `tenant_members` table
2. Try to access admin routes
3. **Expected:** 403 Forbidden (not just 401)

**Evidence Required:**
- [ ] User authenticated but not in tenant_members
- [ ] Response showing 403
- [ ] Log showing permission denied

### Test 3.4: Staff Role vs Owner Role Permissions Differ

**Setup:**
```sql
-- Create two users in auth.users (via Supabase dashboard or API)
-- User 1: owner role
INSERT INTO tenant_members (tenant_id, user_id, role)
VALUES ('<moto_kitchen_id>', '<user1_id>', 'owner');

-- User 2: staff role
INSERT INTO tenant_members (tenant_id, user_id, role)
VALUES ('<moto_kitchen_id>', '<user2_id>', 'staff');
```

**Test Steps:**
1. As Owner: Try to delete a menu item → Should succeed (or have permission)
2. As Staff: Try to delete a menu item → Should fail (403)

**Evidence Required:**
- [ ] Owner can perform admin actions
- [ ] Staff is blocked from restricted actions
- [ ] Logs showing different permission checks

**Test:**
```bash
# As owner
curl -X DELETE http://localhost:3000/api/admin/menu/items/<item_id> \
  -H "Authorization: Bearer <owner_token>"
# Should succeed

# As staff
curl -X DELETE http://localhost:3000/api/admin/menu/items/<item_id> \
  -H "Authorization: Bearer <staff_token>"
# Should fail with 403
```

---

## 4. Rate Limit Proof

### Test 4.1: Order Creation Rate Limit

**Test Steps:**
1. Send 15 requests rapidly to `/api/orders` POST endpoint (limit is 10/min)
2. **Expected:** 
   - First 10 succeed (or fail validation, but not rate limit)
   - Request 11+ returns 429 Too Many Requests
   - Response includes `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After` headers

**Evidence Required:**
- [ ] Screenshot of 429 response
- [ ] Response headers showing rate limit info
- [ ] Log showing rate limit triggered

**Test Script:**
```bash
# Send 15 requests
for i in {1..15}; do
  echo "Request $i:"
  curl -X POST http://localhost:3000/api/orders \
    -H "Content-Type: application/json" \
    -d '{"customerName":"Test","customerPhone":"123","fulfillmentType":"pickup","scheduledFor":"2024-12-25T12:00:00Z","cartItems":[{"id":"test-id","name":"Test","price":10,"quantity":1}],"subtotal":10,"total":10}' \
    -v 2>&1 | grep -E "HTTP|X-RateLimit|Retry-After"
  sleep 0.1
done
```

### Test 4.2: Login Rate Limit

**Test Steps:**
1. Attempt login 10+ times rapidly (if login endpoint has rate limiting)
2. **Expected:** After threshold, returns 429

**Evidence Required:**
- [ ] Screenshot of rate limit on login
- [ ] Log entry showing rate limit triggered

### Test 4.3: Rate Limit Logging

**Test Steps:**
1. Trigger rate limit
2. Check logs for rate limit event
3. **Expected:** Log includes `request_id` and `tenant_id`/`tenant_slug`

**Evidence Required:**
- [ ] Log snippet showing rate limit with context
- [ ] Request ID present in log

---

## 5. CSRF Proof (Admin Mutations Only)

### Test 5.1: CSRF Token Missing → 403

**Test Steps:**
1. Make POST/PATCH/DELETE request to admin endpoint WITHOUT `X-CSRF-Token` header
2. **Expected:** 403 Forbidden

**Evidence Required:**
- [ ] Request without CSRF token
- [ ] Response showing 403
- [ ] Error message indicating CSRF token missing

**Test:**
```bash
curl -X POST http://localhost:3000/api/admin/menu/items \
  -H "Content-Type: application/json" \
  -H "Cookie: admin_session=..." \
  -d '{"name":"Test Item","price":10}'
  # No X-CSRF-Token header
  # Expected: 403 Forbidden
```

### Test 5.2: Invalid CSRF Token → 403

**Test Steps:**
1. Make request with INVALID `X-CSRF-Token` header
2. **Expected:** 403 Forbidden

**Evidence Required:**
- [ ] Request with invalid token
- [ ] Response showing 403
- [ ] Error indicating token mismatch

**Test:**
```bash
curl -X POST http://localhost:3000/api/admin/menu/items \
  -H "Content-Type: application/json" \
  -H "Cookie: admin_session=..." \
  -H "X-CSRF-Token: invalid-token-12345" \
  -d '{"name":"Test Item","price":10}'
  # Expected: 403 Forbidden
```

### Test 5.3: Valid CSRF Token → 200

**Test Steps:**
1. Get valid CSRF token (from cookie after page load)
2. Make request with valid token
3. **Expected:** 200 OK (request succeeds)

**Evidence Required:**
- [ ] Request with valid CSRF token
- [ ] Response showing 200
- [ ] Mutation actually executed

**Test:**
```bash
# First, get CSRF token from cookie (browser dev tools)
# Then:
curl -X POST http://localhost:3000/api/admin/menu/items \
  -H "Content-Type: application/json" \
  -H "Cookie: admin_session=...; csrf-token=valid-token-from-cookie" \
  -H "X-CSRF-Token: valid-token-from-cookie" \
  -d '{"name":"Test Item","price":10}'
  # Expected: 200 OK or 201 Created
```

---

## 6. Request ID Propagation Proof

### Test 6.1: Request ID in Response Headers

**Test Steps:**
1. Make any API request
2. Check response headers
3. **Expected:** `x-request-id` header present (UUID format)

**Evidence Required:**
- [ ] Screenshot of response headers showing `x-request-id`
- [ ] Multiple requests show different UUIDs

**Test:**
```bash
curl -I http://localhost:3000/api/menu
# Check for: x-request-id: <uuid>
```

### Test 6.2: Request ID in Logs

**Test Steps:**
1. Make API request and note the `x-request-id` from headers
2. Check server logs for that request
3. **Expected:** Log entry includes the same `request_id`

**Evidence Required:**
- [ ] Request ID from header
- [ ] Matching log entry with same request ID
- [ ] Log shows structured format with request ID

**Example Log Format:**
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "info",
  "message": "API request",
  "context": {
    "requestId": "abc-123-def-456",  // Should match x-request-id header
    "tenantId": "uuid-here",
    "method": "GET",
    "path": "/api/menu"
  }
}
```

### Test 6.3: Request ID in Error Logs

**Test Steps:**
1. Trigger an error (e.g., invalid request)
2. Check error logs
3. **Expected:** Error log includes `request_id`

**Evidence Required:**
- [ ] Error log snippet showing request ID
- [ ] Request ID matches the request that caused error

---

## 7. Service-Role Usage Audit

### Test 7.1: Service Role Key Only in server-admin.ts

**Test Steps:**
1. Search codebase for `SUPABASE_SERVICE_ROLE_KEY`
2. **Expected:** Only found in `lib/supabase/server-admin.ts` and `.env.local`

**Evidence Required:**
- [ ] Grep output showing all occurrences
- [ ] Confirmation none are in client-side code
- [ ] Confirmation none are in customer-facing routes

**Test:**
```bash
# Search for service role key references
grep -r "SUPABASE_SERVICE_ROLE_KEY" --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx"

# Should only show:
# - lib/supabase/server-admin.ts
# - .env.local (or similar env files)
# - NOT in lib/supabase/server-app.ts
# - NOT in any app/order/* pages
# - NOT in any customer-facing API routes
```

### Test 7.2: Customer Routes Use server-app.ts

**Test Steps:**
1. Check customer-facing routes for Supabase client usage
2. **Expected:** All use `createServerAppClient()` (anon key)

**Evidence Required:**
- [ ] Grep output showing customer routes use `createServerAppClient`
- [ ] Confirmation no `createServerAdminClient` in customer routes

**Test:**
```bash
# Check customer-facing routes
grep -r "createServerAdminClient" app/api/menu app/api/orders app/api/time-slots app/api/delivery-zones app/order

# Should return empty (no matches)

# Check admin routes use admin client
grep -r "createServerAdminClient" app/api/admin

# Should show matches (admin routes should use admin client)
```

### Test 7.3: No Service Role in Client Bundle

**Test Steps:**
1. Build the application
2. Check build output for service role key
3. **Expected:** No service role key in client bundle

**Evidence Required:**
- [ ] Build output search for service role key
- [ ] Confirmation key not exposed in browser

**Test:**
```bash
npm run build
grep -r "SUPABASE_SERVICE_ROLE_KEY" .next/static
# Should return empty (no service role key in build output)
```

---

## 8. Tenant Context Transaction Safety (CRITICAL)

### Test 8.1: Tenant Context Set Per Request

**Test Steps:**
1. Show code that sets `app.tenant_id` at start of request
2. **Expected:** Context set before any DB queries

**Evidence Required:**
- [ ] Code snippet showing tenant context setting
- [ ] Documentation of when/how it's set

### Test 8.2: Context Scoped to Transaction/Request

**Test Steps:**
1. Make two concurrent requests with different tenants
2. **Expected:** Each request only sees its own tenant's data (no bleed)

**Evidence Required:**
- [ ] Two concurrent requests with different tenant contexts
- [ ] Logs showing each request has correct tenant
- [ ] No cross-contamination between requests

### Test 8.3: Context Automatically Cleared

**Test Steps:**
1. Make request that sets tenant context
2. After request completes, check if context persists
3. **Expected:** Context cleared after request/transaction

**Evidence Required:**
- [ ] Documentation/code showing cleanup
- [ ] Test showing context doesn't persist

### Test 8.4: Connection Pooling Safety

**Test Steps:**
1. Confirm how tenant context works with connection pooling
2. **Expected:** Context is request-scoped, not connection-scoped

**Evidence Required:**
- [ ] Explanation of connection pooling approach
- [ ] Code showing context isolation

**Current Status:** ⚠️ **NOT IMPLEMENTED** - See `lib/db/tenant-context.ts` (placeholder only)

**Required Implementation:**
- Use Supabase RPC function to set `app.tenant_id` per request
- OR use transaction-scoped context
- OR confirm application-level filtering is sufficient for MVP (less secure)

---

## Evidence Checklist Summary

For sign-off, provide evidence for:

- [ ] **RLS Isolation:** Screenshots/logs of cross-tenant access blocked
- [ ] **Tenant Resolution:** Screenshots of tenant-not-found for invalid hosts
- [ ] **Admin Protection:** Network tab showing 401/403 responses
- [ ] **Rate Limiting:** 429 response with rate limit headers
- [ ] **CSRF Protection:** 403 response without CSRF token
- [ ] **Request ID:** Headers + matching log entries
- [ ] **Service Role Audit:** Grep output showing key only in admin client
- [ ] **Tenant Context:** Code/documentation showing per-request scoping

---

## Next Steps After Verification

1. ✅ Document any gaps found
2. ✅ Fix critical issues (especially tenant context transaction safety)
3. ✅ Get sign-off from senior engineer
4. ✅ Proceed to Phase B (if applicable)

