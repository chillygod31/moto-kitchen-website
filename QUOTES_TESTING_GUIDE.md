# 🎯 Moto Kitchen Quotes System - Manual Testing Guide

## Quick Start: 5 Priority Tests to Run First

### Test 1: Happy Path (15 minutes) ✅
```
Goal: Verify basic functionality works end-to-end

STEPS:
1. Open http://localhost:3000/contact
2. Fill form:
   - Name: Test User
   - Email: testuser@example.com
   - Phone: +31 6 12345678
   - Event Type: Wedding
   - Event Date: [Pick date 7+ days from now]
   - Guests: 150
   - Location: Amsterdam
   - Service Type: Full Catering Service
   - Budget: €1,000–2,500
3. Submit form
4. VERIFY: Redirects to thank-you page ✓
5. VERIFY: Shows success message with checkmark ✓

EXPECTED RESULTS:
✅ Form submits without errors
✅ Thank you page shows reference number
✅ No 500 errors in console
```

### Test 2: Admin Email Arrival (10 minutes) 📧
```
Goal: Verify admin gets notified via email

STEPS:
1. Submit quote from Test 1
2. Go to info@motokitchen.nl inbox (or your admin email)
3. Wait max 30 seconds
4. Look for email with subject containing:
   - "New Quote Request"
   - Customer name
   - Guest count
   - Event date
5. VERIFY: Email arrived ✓
6. VERIFY: Email is readable (not in spam) ✓
7. VERIFY: Contains all event details ✓
8. VERIFY: Has links/buttons to reply ✓

EXPECTED RESULTS:
✅ Email in inbox within 30 sec
✅ Subject line includes event type, guests, date
✅ All customer details visible
✅ Not in spam folder
✅ Readable on mobile
```

### Test 3: Admin Dashboard (10 minutes) 📊
```
Goal: Verify admin can see quote

STEPS:
1. Open http://localhost:3000/admin/login
2. Login with admin credentials
3. Go to http://localhost:3000/admin/quotes
4. VERIFY: Quote from Test 1 appears at top ✓
5. VERIFY: Status shows "New" in blue ✓
6. Click on quote row
7. VERIFY: Modal opens with full details ✓
8. VERIFY: Shows customer name, email, phone ✓
9. VERIFY: Shows event date, guest count, location ✓
10. Close modal (click X or outside)

EXPECTED RESULTS:
✅ Quote appears immediately in list
✅ Can see customer details clearly
✅ Can click to view full details
✅ Modal/detail view works smoothly
```

### Test 4: Status Update (5 minutes) 🔄
```
Goal: Verify admin can track quote status

STEPS:
1. In admin quotes page, find your test quote
2. Click on quote to open details modal
3. Change status from "New" to "Contacted"
4. VERIFY: Status updates immediately ✓
5. Close modal
6. VERIFY: Status in list shows "Contacted" ✓
7. Add internal note: "Sent quote via email"
8. VERIFY: Note saves ✓

EXPECTED RESULTS:
✅ Status dropdown works
✅ Status updates on form
✅ Can add notes
✅ Changes persist when closing/reopening
```

### Test 5: Validation (5 minutes) ⚠️
```
Goal: Verify form rejects invalid input

STEPS:
1. Open http://localhost:3000/contact (fresh page)
2. Try to submit with EMPTY email:
   VERIFY: Shows error message ✓
   VERIFY: Form doesn't submit ✓
3. Enter email as "notanemail" (no @)
   VERIFY: Shows error when unfocused ✓
4. Leave "Event Date" empty with "flexible" UNCHECKED:
   VERIFY: Shows error on submit ✓
5. Select "Date is flexible" checkbox:
   VERIFY: Date field becomes optional ✓
   VERIFY: Can submit without date ✓

EXPECTED RESULTS:
✅ Required field errors appear clearly
✅ Form prevents invalid submission
✅ Error messages are specific
✅ Validation works on all fields
```

---

## Full Manual Testing Checklist (1-2 hours)

### Security Tests (30 minutes) 🔐

#### 1.1 Unauthenticated Access
- [ ] **TEST**: Open incognito/private window, go to `/admin/quotes`
  - Expected: Redirects to `/admin/login`
- [ ] **TEST**: Copy admin API route, call without auth: `curl http://localhost:3000/api/quotes`
  - Expected: Returns 401 or 403 error
- [ ] **TEST**: As logged-out user, go to `/contact` and fill + submit quote
  - Expected: Quote accepted, creates in database ✓

#### 1.2 Admin Authentication
- [ ] **TEST**: Login with CORRECT credentials
  - Expected: Access to `/admin/quotes` granted
- [ ] **TEST**: Try invalid username/password
  - Expected: Shows login error
- [ ] **TEST**: Logout from admin
  - Expected: Cannot access `/admin/quotes` anymore, redirects to login

#### 1.3 Database Security
- [ ] **TEST**: Check if RLS (Row Level Security) is active in Supabase
  - Go to Supabase dashboard → Quotes table
  - Look for RLS policies
  - Expected: Policies restrict public read access

### Validation Tests (30 minutes) ✅

#### 2.1 Required Fields
Test each required field individually. For each field:
1. Fill all other fields correctly
2. Leave ONE field empty
3. Try to submit
4. Expected: Form shows error for that field

- [ ] **Empty Name**: Error appears, field highlighted red
- [ ] **Empty Email**: Error appears, field highlighted red
- [ ] **Invalid Email** (e.g., "test" or "test@"): Error on blur
- [ ] **Empty Phone**: Error appears
- [ ] **Empty Event Type**: Error appears, submit disabled
- [ ] **Empty Location**: Error appears
- [ ] **Empty Guest Count**: Error appears
- [ ] **Empty Service Type**: Error appears
- [ ] **Zero Guests** (type "0"): Error "must be at least 1"
- [ ] **Negative Guests** (type "-5"): Error or auto-corrects to 0

#### 2.2 Conditional Budget Requirement
- [ ] **Full Catering + No Budget**: Error "Budget required"
- [ ] **Drop-Off + No Budget**: Error "Budget required"
- [ ] **Pick-Up Only + No Budget**: ✅ Submits OK (budget not required)
- [ ] **Not Sure Service + No Budget**: ✅ Submits OK (budget not required)

#### 2.3 Date Logic
- [ ] **Date is Flexible**: Checkbox unchecked → date field required
- [ ] **Date is Flexible**: Checkbox checked → date field optional ✓
- [ ] **Past Date** (2020-01-01): Error "Event date cannot be in the past"
- [ ] **Today's Date**: Error (need advance notice, e.g., 3 days)
- [ ] **Date in 10 days**: ✅ Submits OK
- [ ] **Date in 6 months**: ✅ Submits OK

#### 2.4 Format Validation
- [ ] **Phone with letters** (e.g., "abc12345"): Error on submit
- [ ] **Email with spaces**: Error
- [ ] **Very long email** (100+ chars): Error or truncates
- [ ] **Guest count as text** (e.g., "fifty"): Cannot type in number field

### Abuse Prevention Tests (15 minutes) 🛡️

#### 3.1 Rate Limiting
```bash
# Quick test: Submit same quote 4 times rapidly

for i in {1..4}; do
  curl -X POST http://localhost:3000/api/contact \
    -H "Content-Type: application/json" \
    -d '{
      "name": "Rate Test '$i'",
      "email": "rate'$i'@test.com",
      "phone": "+31612345678",
      "countryCode": "+31",
      "eventType": "wedding",
      "guestCount": "50",
      "location": "Amsterdam",
      "serviceType": "full-catering",
      "budget": "1000-2500"
    }'
  echo "Request $i sent"
  sleep 0.5
done
```

- [ ] **Request 1-3**: All return 200 ✓
- [ ] **Request 4**: Returns 429 (Too Many Requests)
- [ ] **Wait 60+ seconds**: Can submit again ✓

#### 3.2 Honeypot Field
The contact form has a hidden honeypot field `website`:
- [ ] **Browser DevTools**: Inspect form, confirm `website` field is `display: none`
- [ ] **User cannot see/fill**: Honeypot is hidden from real users ✓
- [ ] **Bots that fill it**: Quote appears accepted but NOT created in admin

#### 3.3 Spam Keywords
- [ ] **Message with multiple URLs** (2+): 
  - Try submitting with: "Check out https://site1.com and https://site2.com"
  - Expected: Either rejected or flagged as spam
- [ ] **Spam keywords**:
  - Try: "CLICK HERE to BUY CHEAP MEDS!!!"
  - Expected: Either rejected or flagged (not visible in admin)

### Operations Tests (30 minutes) 📧

#### 4.1 Quote Appears in Admin Immediately
- [ ] **Setup**: Have admin panel open in one window
- [ ] **In another window**: Submit a quote on `/contact`
- [ ] **Admin window**: Refresh `/admin/quotes`
- [ ] **VERIFY**: New quote appears at TOP of list ✓
- [ ] **VERIFY**: Status shows "New" (blue badge)
- [ ] **VERIFY**: Timestamp shows "Just now"

#### 4.2 Admin Email is Useful
- [ ] **Check email subject**: Contains readable summary
  - Example: `New Quote Request • Wedding • 100 pax • Amsterdam • 15 Jun 2025 • €1,000–2,500 — John Doe`
- [ ] **Check email body**:
  - [ ] All event details present
  - [ ] Customer name, email, phone visible
  - [ ] Has "Reply" button
  - [ ] Has link to view in admin panel
  - [ ] Mobile-friendly formatting
  - [ ] Not in spam folder

#### 4.3 Status Workflow
- [ ] **New Quote**: Status = "New" (blue)
- [ ] **Change to "Contacted"**: Updates immediately
- [ ] **Change to "Quoted"**: Updates immediately
- [ ] **Change to "Converted"**: Updates with green badge
- [ ] **Add Note**: Can type in notes field
- [ ] **Save Note**: Appears in detail view
- [ ] **Refresh page**: Note persists ✓

#### 4.4 Admin Search & Filter
- [ ] **Filter by Status**:
  - Select "Contacted"
  - Only show quotes with "Contacted" status ✓
- [ ] **Search by Name**:
  - Enter "John"
  - Show quotes containing "John" ✓
- [ ] **Search by Email**:
  - Enter "test@example.com"
  - Show matching quote ✓
- [ ] **Search by Location**:
  - Enter "Amsterdam"
  - Show quotes from Amsterdam ✓
- [ ] **Clear Filters**: Shows all quotes again ✓

#### 4.5 Export Functionality
- [ ] **Click "Export CSV"**:
  - File downloads ✓
  - Filename: `quote-requests-YYYY-MM-DD.csv`
  - Open in Excel/Google Sheets ✓
  - Contains all visible quotes with columns ✓

### UX Tests (20 minutes) 📱

#### 5.1 Mobile Form (iPhone/Android)
Use browser DevTools or real device to test:

```
Device to test: iPhone (375px width)
Simulate: iPhone SE, iPhone 13, or similar
```

- [ ] **Form Layout**:
  - [ ] All fields visible without horizontal scroll
  - [ ] Labels are readable
  - [ ] No text cutoff
  - [ ] Buttons are tappable (min 44px height)

- [ ] **Keyboard Behavior**:
  - [ ] Email field shows email keyboard (@.com)
  - [ ] Phone field shows numeric keyboard
  - [ ] Guest count shows number pad
  - [ ] Auto-focus works smoothly
  - [ ] Form doesn't jump around when keyboard opens

- [ ] **Country Code Selector**:
  - [ ] Dropdown opens on tap
  - [ ] Scrollable list (not cut off)
  - [ ] Can select different country
  - [ ] Selection shown in dropdown

- [ ] **Landscape Mode**:
  - [ ] Rotate phone to landscape
  - [ ] Form still readable
  - [ ] Inputs still accessible

- [ ] **Success Page**:
  - [ ] Message visible
  - [ ] Reference number clear
  - [ ] Links clickable
  - [ ] No horizontal scroll

#### 5.2 Error Messages
- [ ] **Error appears below field**:
  - Red text, icon visible
  - Example: "⚠ Please enter a valid email"
- [ ] **Field gets red border** or highlight
- [ ] **Error clears when field is corrected** ✓
- [ ] **Multiple errors shown** if multiple fields invalid
- [ ] **Error text is specific**, not generic:
  - Good: "Please enter a valid email address"
  - Bad: "Error" or "Invalid"

#### 5.3 Loading States
- [ ] **Submit button shows "Sending..."** while processing
- [ ] **Button is disabled** (cannot click again)
- [ ] **After response**: Shows "Send Inquiry" again

#### 5.4 Network Error Handling
```bash
# Test network error: Disable WiFi right after submit
1. Fill form with valid data
2. Click Submit
3. Immediately disconnect internet
```

- [ ] **Shows friendly error message**: "Connection lost..."
- [ ] **Form data is NOT cleared** (still visible)
- [ ] **"Retry" button** appears
- [ ] **Reconnect internet and click retry**: Works ✓

#### 5.5 Success Page
After submitting quote:
- [ ] **Redirects to thank-you page** ✓
- [ ] **Shows checkmark icon** (✓ or ✅)
- [ ] **"Thank You!" heading** visible
- [ ] **Shows response time**: "24 hours"
- [ ] **Reference number visible** (save for records)
- [ ] **Buttons visible**: "Back to Menu", "View Gallery"
- [ ] **On mobile**: No horizontal scroll, readable text

### Data Quality Tests (10 minutes) 🧪

#### 6.1 Special Characters
- [ ] **Name with accents**: "François Müller"
  - Quote submits ✓
  - Displays correctly in admin ✓
- [ ] **Email with plus addressing**: "test+quotes@example.com"
  - Quote submits ✓
  - Auto-reply received at correct email ✓
- [ ] **Message with quotes**: "They said 'Let's do it!'"
  - Quote submits ✓
  - Displays correctly in admin ✓

#### 6.2 Long Input
- [ ] **Very long name** (100+ chars):
  - Submits OK or shows max length error
- [ ] **Very long message** (5000+ chars):
  - Submits OK
  - Displays in admin without breaking
  - Email preview shows truncated
- [ ] **Many dietary requirements checked**:
  - All options saved ✓
  - All show in admin ✓
  - All in email ✓

#### 6.3 Edge Case Dates
- [ ] **Tomorrow**: Event in 1 day
  - Does form allow it? (Depends on lead time policy)
- [ ] **Exactly 7 days from now**: Should be OK
- [ ] **Leap year date** (Feb 29): Accepts if valid year
- [ ] **End of month**: Can select last day of February/April

### Performance Tests (10 minutes) ⚡

#### 7.1 Form Submission Speed
```
Measure: Time from click "Submit" to seeing thank-you page
Target: < 3 seconds (including email send)
```

- [ ] **Locally (localhost)**: < 2 seconds
- [ ] **Production (vercel.app)**: < 3 seconds
- [ ] **Slow 3G**: < 5 seconds (or show loading state)

#### 7.2 Admin Panel Speed
```
Measure: Time to load /admin/quotes list
Target: < 1 second
```

- [ ] **Quotes list loads in < 1 sec**
- [ ] **Search executes in < 500ms**
- [ ] **Status filter updates instantly** (< 200ms)
- [ ] **Opening quote modal**: < 300ms

#### 7.3 Email Send Time
```
Monitor: Time from quote submission to email arrival
Target: < 30 seconds (usually < 5 sec)
```

- [ ] **Email in inbox**: < 10 seconds ✓
- [ ] **Email not stuck in spam**: Configurable sender

---

## Test Results Template

```markdown
# Quotes System Test Results - [DATE]

## Test Environment
- URL: http://localhost:3000 or https://motokitchen.nl
- Browser: Chrome 120 / Safari 17
- Device: Desktop / iPhone 13 / Android

## Security Tests
- [ ] Anonymous quote submission: PASS / FAIL
- [ ] Admin auth required: PASS / FAIL
- [ ] Rate limiting: PASS / FAIL
- [ ] Honeypot: PASS / FAIL

## Validation Tests
- [ ] Required fields: PASS / FAIL
- [ ] Email validation: PASS / FAIL
- [ ] Date logic: PASS / FAIL
- [ ] Budget conditional: PASS / FAIL

## Operations Tests
- [ ] Quote saved to DB: PASS / FAIL
- [ ] Admin email received: PASS / FAIL (within 30 sec)
- [ ] Quote in admin panel: PASS / FAIL
- [ ] Status updates: PASS / FAIL

## UX Tests
- [ ] Mobile form works: PASS / FAIL
- [ ] Error messages clear: PASS / FAIL
- [ ] Success page loads: PASS / FAIL
- [ ] Network error handling: PASS / FAIL

## Issues Found
1. [Issue description]: [Impact] [Steps to reproduce]
2. ...

## Performance Results
- Form submission: XXXms
- Admin panel load: XXXms
- Email delivery: XXXs

## Sign-off
Tested by: ________________
Date: ________________
Status: READY FOR LAUNCH / NEEDS FIXES
```

---

## Debugging Tips

### Quote Not Appearing in Admin?
1. Check Supabase directly:
   - Go to Supabase dashboard
   - Browse `quote_requests` table
   - Should show new quote
2. Check browser network tab:
   - Look for POST to `/api/contact`
   - Should return 200 with `quoteId`
3. Check console for errors:
   - Open DevTools (F12)
   - Check Console tab for red errors

### Email Not Arriving?
1. Check spam/junk folder
2. Check Resend dashboard (if used):
   - Go to Resend.com
   - Check email logs
   - See if email shows as "sent" or "failed"
3. Check environment variables:
   - Verify `RESEND_API_KEY` is set
   - Verify `NEXT_PUBLIC_SUPABASE_URL` is set
4. Check function logs:
   - Look for errors in API route logs

### Rate Limit Not Working?
1. Check if same IP:
   - Rate limit is per-IP address
   - If testing from different IPs, won't trigger
   - From same computer: should work
2. Check rate limit config:
   - Look at `lib/rate-limit.ts`
   - Verify limit is set to 3/minute
3. Test after 1 minute:
   - Counter should reset
   - Should be able to submit again

---

## Quick Command Reference

```bash
# Run all tests
npm test

# Run specific test file
npm test quotes.test.ts

# Test with coverage
npm test -- --coverage

# Test in watch mode
npm test -- --watch

# Manually test API endpoint
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+31612345678",
    "countryCode": "+31",
    "eventType": "wedding",
    "guestCount": "50",
    "location": "Amsterdam",
    "serviceType": "full-catering",
    "budget": "1000-2500"
  }'

# Check rate limit (should block 4th request)
for i in {1..4}; do
  echo "Request $i:"
  curl -X POST http://localhost:3000/api/contact \
    -H "Content-Type: application/json" \
    -d '{"name":"User'$i'","email":"test'$i'@example.com",...}'
  sleep 0.1
done
```

---

## Post-Test Checklist

After completing all tests:

- [ ] Document all results in test template above
- [ ] Screenshot any failures
- [ ] Create issues for any bugs found
- [ ] Get sign-off from product team
- [ ] Deploy to production when ready ✅

