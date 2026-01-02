# Post-Migration Test Checklist
**Migration:** 2026-01-01-schema-standardization.sql  
**Date:** 2026-01-01  
**Tester:** _____________

---

## ✅ Pre-Migration Verification

- [ ] Confirmed all code is pushed to GitHub
- [ ] Vercel deployment succeeded
- [ ] Rollback script created and reviewed
- [ ] Database backup taken (if available in Supabase)

---

## 🧪 Test Suite (Run After Migration)

### **1. Business Settings (CRITICAL)**

**What's being tested:** The API can read `business_email/business_phone` from the `tenants` table.

#### Test 1.1: Load Settings Page
- [ ] Navigate to `/admin/settings`
- [ ] Page loads without errors
- [ ] **Expected:** All fields are populated:
  - Business Name: "Moto Kitchen NL"
  - Business Email: "contact@motokitchen.nl"
  - Business Phone: "+31653301243"
  - Pickup Address: "Galjootstraat 6-B..."

**If fails:** 
- Check browser console for errors
- Check Network tab → `/api/admin/business-settings` response
- Run rollback script

---

#### Test 1.2: Save Settings
- [ ] Change Business Phone to "+31653301244" (add a 4 at the end)
- [ ] Click "Save Settings"
- [ ] **Expected:** Green success message "Settings saved successfully!"
- [ ] Hard refresh page (Cmd+Shift+R / Ctrl+Shift+R)
- [ ] **Expected:** Phone number still shows "+31653301244"
- [ ] Change back to "+31653301243" and save again

**If fails:**
- Check browser console for 403/401 errors
- Verify you're logged in as owner (not staff)
- Run rollback script

---

### **2. Quote System (Verify Not Broken)**

**What's being tested:** Quote request submission and confirmation emails still work.

#### Test 2.1: Submit Quote Request
- [ ] Go to `/contact` (main website)
- [ ] Fill out the quote request form:
  - Name: "Test Customer"
  - Email: "chilechhaa@gmail.com"
  - Phone: "+31612345678"
  - Event Date: Tomorrow
  - Guest Count: 50
  - Service Type: Catering
- [ ] Submit form
- [ ] **Expected:** Success message displayed

**If fails:**
- Check form validation errors
- Not related to migration (quote form doesn't use tenant contact)

---

#### Test 2.2: Verify Quote Confirmation Email
- [ ] Check email inbox (chilechhaa@gmail.com)
- [ ] **Expected:** 2 emails received:
  1. **Customer confirmation** - "Thank you for your quote request"
  2. **Admin notification** - "New quote request from Test Customer"
- [ ] Open admin notification email
- [ ] **Expected:** Email includes:
  - Business name in subject/header
  - Reply-to address: contact@motokitchen.nl

**If fails:**
- Check Resend dashboard for delivery status
- Check `quote_requests` table in Supabase
- This MIGHT be affected if quote emails use business_email

---

### **3. Orders System (Most Important)**

**What's being tested:** Order placement, payment, confirmation emails.

#### Test 3.1: Place Test Order (Stripe Test Mode)
- [ ] Go to `/order`
- [ ] Add items to cart
- [ ] Proceed to checkout
- [ ] Fill out customer details:
  - Name: "Test Customer"
  - Email: "chilechhaa@gmail.com"
  - Phone: "+31612345678"
- [ ] Select pickup time slot (tomorrow)
- [ ] Click "Pay & Place Order"
- [ ] Use Stripe test card: `4242 4242 4242 4242`
- [ ] Complete payment

**Expected:**
- [ ] Redirects to `/order/order-success`
- [ ] Success page shows full order details
- [ ] Order number displayed
- [ ] 3-step timeline shown
- [ ] Contact information shows business phone/email

**If fails:**
- Check Stripe dashboard for payment
- Check `orders` table in Supabase
- Check browser console for errors
- If order created but success page is blank, it's not migration-related

---

#### Test 3.2: Verify Order Confirmation Emails
- [ ] Check email inbox (chilechhaa@gmail.com)
- [ ] **Expected:** 2 emails received:
  1. **Customer confirmation** - "Order #XXXX confirmed"
  2. **Admin alert** - "New order #XXXX • Pickup • [datetime]"

**Customer Email Must Include:**
- [ ] Order number
- [ ] Pickup time
- [ ] Total amount
- [ ] Order items with quantities
- [ ] **Pickup address** (from business settings)
- [ ] **Contact info**: Business phone/email in footer

**Admin Email Must Include:**
- [ ] Order number
- [ ] Customer name and phone
- [ ] Order items table
- [ ] Total amount
- [ ] Pickup time

**If fails:**
- Check `email_queue` table in Supabase (should have 2 pending/sent entries)
- Check `orders.email_status` column
- Run email processor manually: `curl -X POST http://localhost:3000/api/cron/process-email-queue -H "Authorization: Bearer [CRON_SECRET]"`
- **THIS IS CRITICAL** - if emails don't include contact info, migration affected email templates

---

#### Test 3.3: Verify Order in Admin Dashboard
- [ ] Go to `/admin/orders`
- [ ] **Expected:** New order appears in list
- [ ] Click on order to open details panel
- [ ] **Expected:** All order details shown:
  - Order number
  - Customer name, email, phone
  - Items list
  - Total
  - Payment status: "Paid"
  - Email status: "Sent" or "Pending"

**If fails:**
- Not related to migration (orders table unchanged)

---

### **4. Time Slots (Verify Still Working)**

**What's being tested:** Time slots are still generated and bookable (migration only added comments).

#### Test 4.1: View Available Time Slots
- [ ] Go to `/order/checkout` (add item to cart first)
- [ ] **Expected:** Time slots dropdown shows slots for next 4 days
- [ ] **Expected:** Each slot shows time (e.g. "11:00 - 11:30")

**If fails:**
- Not related to migration (only comments added, no functional change)

---

#### Test 4.2: Admin Time Slots Management
- [ ] Go to `/admin/time-slots`
- [ ] **Expected:** Page loads without errors
- [ ] **Expected:** Shows upcoming slots
- [ ] Try editing a slot's capacity
- [ ] Click "Save"
- [ ] **Expected:** Success message

**If fails:**
- Not related to migration

---

### **5. Database Verification (SQL)**

**What's being tested:** Data integrity after migration.

#### Run in Supabase SQL Editor:

```sql
-- 1. Verify business_email is NOT NULL
SELECT 
  name, 
  business_email, 
  business_phone,
  owner_email,
  owner_phone
FROM tenants
WHERE name ILIKE '%moto%';
```

**Expected:**
- [ ] `business_email` = "contact@motokitchen.nl"
- [ ] `business_phone` = "+31653301243"
- [ ] `owner_email` still exists (not dropped)
- [ ] `owner_phone` still exists (not dropped)

---

```sql
-- 2. Verify schema_migrations_log was created
SELECT * FROM schema_migrations_log
ORDER BY applied_at DESC
LIMIT 5;
```

**Expected:**
- [ ] Table exists
- [ ] One row for "2026-01-01-schema-standardization.sql"
- [ ] Applied timestamp is recent

---

```sql
-- 3. Verify time_slots comments were added
SELECT 
  col_description('time_slots'::regclass, attnum) AS column_comment,
  attname AS column_name
FROM pg_attribute
WHERE attrelid = 'time_slots'::regclass 
  AND attnum > 0
  AND col_description('time_slots'::regclass, attnum) IS NOT NULL;
```

**Expected:**
- [ ] Returns 7 rows (comments for slot_time, is_active, max_orders, etc.)

---

### **6. Rollback Test (Optional but Recommended)**

**Only do this if you want to test the rollback script works.**

⚠️ **Warning:** This will undo the migration. Only test this on a dev/staging environment.

- [ ] Run rollback script: `supabase/rollback/2026-01-01-schema-standardization-rollback.sql`
- [ ] Run the verification queries above
- [ ] **Expected:** 
  - `business_email` is nullable again
  - Comments removed
  - `schema_migrations_log` entry deleted
  - Original data still intact
- [ ] Re-run the migration to restore changes

---

## 🎯 Success Criteria

**Migration is successful if:**
- ✅ All 6 test sections pass
- ✅ Business settings page loads and saves correctly
- ✅ Quote emails include correct business contact info
- ✅ Order confirmation emails include correct business contact info
- ✅ No errors in browser console or Supabase logs

**If ANY test fails:**
1. ❌ Run rollback script immediately
2. 📝 Document which test failed
3. 🔍 Investigate root cause before re-running migration

---

## 📊 Test Results Summary

| Test Section | Status | Notes |
|--------------|--------|-------|
| 1. Business Settings | ⬜ Pass / ⬜ Fail | |
| 2. Quote System | ⬜ Pass / ⬜ Fail | |
| 3. Orders System | ⬜ Pass / ⬜ Fail | |
| 4. Time Slots | ⬜ Pass / ⬜ Fail | |
| 5. Database Verification | ⬜ Pass / ⬜ Fail | |
| 6. Rollback Test | ⬜ Pass / ⬜ Fail / ⬜ Skipped | |

**Overall Result:** ⬜ PASS / ⬜ FAIL

**Tester Signature:** _______________  
**Date/Time Completed:** _______________

---

## 🚨 Emergency Contacts

**If critical issues found:**
- Run rollback script: `supabase/rollback/2026-01-01-schema-standardization-rollback.sql`
- Check Supabase logs: Dashboard → Logs
- Check Vercel logs: Dashboard → Deployments → [latest] → Logs
- Revert code: `git revert a4d5685` (latest commit)

**Support:**
- Supabase Dashboard: [Your project URL]
- Vercel Dashboard: [Your project URL]
- GitHub Repo: https://github.com/chillygod31/moto-kitchen-website

