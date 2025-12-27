# 🎯 Moto Kitchen Quotes System - Complete Testing Framework

**Created**: 2025-12-27  
**Status**: READY FOR EXECUTION  
**Framework**: Comprehensive Testing Plan for Single-Tenant Quotes System

---

## 📋 What You Have

### 1. **Automated Test Suite** (`__tests__/quotes.test.ts`)
- 60+ individual test cases
- Covers security, validation, rate limiting, operations
- Can be run with Jest or manually
- Tests both happy path and error cases

### 2. **Manual Testing Guide** (`QUOTES_TESTING_GUIDE.md`)
- Step-by-step instructions for all tests
- 5 quick priority tests (30-45 minutes)
- Full comprehensive checklist (2+ hours)
- Debugging tips and troubleshooting

### 3. **Quick Test Runner** (`run-quotes-tests.sh`)
- Bash script for rapid testing
- Tests local and production environments
- Automated performance measurement
- Clear pass/fail indicators

### 4. **Test Results Tracker** (`QUOTES_TEST_RESULTS.md`)
- Template for documenting results
- Checkboxes for each test
- Space for screenshots and notes
- Sign-off section for approval

---

## 🚀 How to Execute Tests

### Option 1: Quick Validation (45 minutes) ⚡

Run only the 5 priority tests to validate basic functionality:

```bash
# 1. Manual happy path test
1. Go to http://localhost:3000/contact
2. Fill form and submit
3. Check redirect to thank-you page
4. Verify email in admin inbox

# 2. Admin dashboard test
1. Login to /admin/login
2. Go to /admin/quotes
3. Verify quote appears
4. Change status and verify it saves

# 3. Mobile test
1. Open form on iPhone (DevTools or real device)
2. Fill and submit
3. Verify success page displays correctly

# 4. Validation test
1. Submit with missing email - expect error
2. Submit with invalid email - expect error
3. Submit with no date (flexible unchecked) - expect error

# 5. Rate limit test
1. Submit 4 quotes rapidly from same IP
2. Verify 4th returns 429 (too many requests)
```

### Option 2: Automated Testing (15 minutes) 🤖

```bash
# Make test script executable (already done)
chmod +x run-quotes-tests.sh

# Run all automated tests
./run-quotes-tests.sh local
# or for production
./run-quotes-tests.sh production

# Expected output:
# ✅ Security tests: ~3 tests
# ✅ Validation tests: ~6 tests  
# ✅ Rate limiting: ~2 tests
# ✅ Honeypot: ~1 test
# ✅ Performance: ~2 tests
# 
# Total: ~14 automated tests
# Results: X Passed, Y Failed
```

### Option 3: Full Jest Testing (30 minutes) 🧪

```bash
# Install dependencies (if not already done)
npm install --save-dev jest ts-jest @types/jest

# Run test suite
npm test -- __tests__/quotes.test.ts

# Run with coverage
npm test -- __tests__/quotes.test.ts --coverage

# Watch mode (re-run on file changes)
npm test -- __tests__/quotes.test.ts --watch
```

### Option 4: Manual Comprehensive Testing (2-3 hours) 📋

Use `QUOTES_TESTING_GUIDE.md` as your step-by-step guide:

```
1. Security Tests (30 min) - Access control, auth, RLS
2. Validation Tests (30 min) - All fields and edge cases
3. Abuse Prevention (15 min) - Rate limiting, honeypot, spam
4. Operations (30 min) - Email, admin panel, status updates
5. UX (20 min) - Mobile, errors, success page
6. Data Quality (10 min) - Special chars, long input
7. Performance (10 min) - Speed measurements
```

---

## 📊 Test Coverage Summary

```
SECURITY (4 tests)
├─ Public submission allowed ...................... ✓
├─ Admin access protected ......................... ✓
├─ API authentication enforced ................... ✓
└─ Database RLS policies active .................. ✓

VALIDATION (10 tests)
├─ Required fields enforced ....................... ✓
├─ Email format validation ........................ ✓
├─ Phone format validation ........................ ✓
├─ Date logic (past dates, flexible) ............. ✓
├─ Conditional budget requirement ............... ✓
├─ Guest count constraints ........................ ✓
└─ Field length limits ............................ ✓

ABUSE PREVENTION (4 tests)
├─ Rate limiting (3 per minute) .................. ✓
├─ Honeypot spam detection ....................... ✓
├─ Content spam detection ........................ ✓
└─ SQL injection prevention ....................... ✓

OPERATIONS (8 tests)
├─ Quote saved to database ...................... ✓
├─ Quote retrieval by ID ......................... ✓
├─ Admin email notification ..................... ✓
├─ Email formatting and content ................. ✓
├─ Quote appears in admin panel ................. ✓
├─ Status updates work ........................... ✓
├─ Notes can be added ............................ ✓
└─ Search and filter work ........................ ✓

UX (7 tests)
├─ Mobile form layout ........................... ✓
├─ Error message display ......................... ✓
├─ Loading states ............................... ✓
├─ Network error handling ........................ ✓
├─ Success page display ......................... ✓
├─ Keyboard behavior ............................ ✓
└─ Touch target sizing .......................... ✓

PERFORMANCE (3 tests)
├─ Form submission < 3 seconds .................. ✓
├─ Admin list load < 1 second ................... ✓
└─ Email delivery < 30 seconds .................. ✓

TOTAL: ~40 Tests Covered
```

---

## ✅ Pre-Launch Checklist

### Must-Pass Items (Blocking)
- [ ] Anonymous users CAN submit quotes
- [ ] Anonymous users CANNOT view quote list
- [ ] Admin login required to access `/admin/quotes`
- [ ] All required fields validated
- [ ] Rate limiting active (3 per minute)
- [ ] Admin email delivered within 30 seconds
- [ ] Quote appears in admin panel immediately
- [ ] Status changes persist
- [ ] Mobile form works perfectly
- [ ] No console errors on form page

### Should-Have Items
- [ ] Honeypot spam detection working
- [ ] CSV export functional
- [ ] Search and filters working
- [ ] Performance within targets
- [ ] Email not marked as spam
- [ ] Error messages are helpful

### Nice-to-Have Items
- [ ] Audit trail of status changes
- [ ] Email preview in browser
- [ ] Advanced spam detection (URLs, keywords)
- [ ] Customer auto-reply email

---

## 🔧 Test Execution Timeline

### Day 1: Quick Validation (1 hour)
```
09:00 - Start 5 quick tests
09:15 - Verify happy path
09:30 - Check email delivery
09:45 - Test admin dashboard
10:00 - Mobile test
10:15 - Validation test
10:45 - Done! 
```

### Day 2: Full Testing (3 hours)
```
14:00 - Run automated tests (./run-quotes-tests.sh)
14:15 - Security tests
14:45 - Validation tests
15:15 - Abuse prevention tests
15:45 - Operations tests
16:15 - UX tests
16:45 - Performance tests
17:00 - Document results
```

### Day 3: Sign-Off (30 minutes)
```
10:00 - Review all results
10:15 - Check for blockers
10:30 - Get approval
10:45 - Ready to deploy
```

---

## 🐛 Common Issues & How to Fix

### Issue: Quote not appearing in admin panel
**Possible Causes**:
1. Quote not being saved to database
   - Check Supabase dashboard: `quote_requests` table
   - Verify API returned `quoteId` on submission
2. Admin not authenticated properly
   - Verify login credentials
   - Check browser console for auth errors
3. RLS policies blocking read

**Fix**:
```bash
# Check Supabase directly
1. Go to supabase.com dashboard
2. Select Moto Kitchen project
3. Go to SQL Editor
4. Run: SELECT * FROM quote_requests ORDER BY created_at DESC LIMIT 5;
5. Should see your test quote
```

---

### Issue: Email not arriving
**Possible Causes**:
1. Resend API key not set
2. Email going to spam
3. Wrong recipient email configured

**Fix**:
```bash
# Check environment variables
1. Verify RESEND_API_KEY is set in .env.local
2. Check Resend.com dashboard for delivery status
3. Verify admin email in code: info@motokitchen.nl
4. Check spam folder in email account
5. Test Resend directly: npm run test-email
```

---

### Issue: Rate limit not working
**Possible Causes**:
1. Tests from different IPs (won't trigger)
2. Rate limit time window reset
3. Configuration not loaded

**Fix**:
```bash
# Test rate limit properly
1. All 4 requests from SAME IP/device
2. Within same 60-second window
3. Check rate-limit.ts configuration
4. Verify limit is 3 per minute (not higher)
```

---

### Issue: Mobile form broken
**Possible Causes**:
1. Text too small (< 16px triggers iOS zoom)
2. Button targets too small (< 44px)
3. Form too wide for viewport
4. Keyboard overlapping form

**Fix**:
```css
/* Ensure all inputs are >= 16px to prevent zoom */
input, textarea, select {
  font-size: 16px;
}

/* Ensure buttons are tappable */
button, input, select {
  min-height: 44px;
  min-width: 44px;
}

/* Make form responsive */
@media (max-width: 640px) {
  input { width: 100% !important; }
}
```

---

## 📞 Support & Questions

### Getting Help
1. **Run tests first**: Often identifies the issue
2. **Check logs**: Browser console, server logs
3. **Refer to guide**: `QUOTES_TESTING_GUIDE.md` has debugging tips
4. **Review code**: Check `/api/contact/route.ts` for submission logic

### Common Questions

**Q: Can I test on production?**  
A: Yes, use `./run-quotes-tests.sh production`  
   Note: Real emails will be sent, quota will be used

**Q: How long do tests take?**  
A: Quick tests: 45 min | Automated: 15 min | Full manual: 2-3 hours

**Q: Do I need a test database?**  
A: No, tests use your real Supabase. Cleanup test quotes manually if needed.

**Q: What if I find a bug?**  
A: Document it in `QUOTES_TEST_RESULTS.md` with steps to reproduce

---

## 📈 Success Metrics

### Launch is Ready When:
- ✅ Security tests: 100% pass
- ✅ Validation tests: 100% pass  
- ✅ No critical bugs
- ✅ Mobile works perfectly
- ✅ Email delivery working
- ✅ Admin panel functional
- ✅ Performance acceptable

### Performance Targets:
- Form submission: < 3 seconds
- Admin panel load: < 1 second
- Email delivery: < 30 seconds
- All pages: No console errors

---

## 🎯 Quick Reference

### Test Files Location
```
__tests__/quotes.test.ts ..................... Automated test suite
QUOTES_TESTING_GUIDE.md ..................... Step-by-step manual guide
run-quotes-tests.sh ......................... Quick test runner script
QUOTES_TEST_RESULTS.md ..................... Results tracker template
QUOTES_TESTING_FRAMEWORK.md ................ This file
```

### Key URLs to Test
```
http://localhost:3000/contact .............. Quote submission form
http://localhost:3000/contact/thank-you ... Success page
http://localhost:3000/admin/quotes ........ Admin quotes dashboard
http://localhost:3000/admin/login ......... Admin login
```

### Key API Endpoints
```
POST /api/contact .......................... Submit quote
GET /api/quotes ........................... List quotes (admin only)
GET /api/quotes/[id] ...................... Get quote details
PATCH /api/quotes/[id] .................... Update status/notes
```

### Important Files to Know
```
app/contact/page.tsx ...................... Quote form component
app/admin/quotes/page.tsx ................. Admin dashboard
app/api/contact/route.ts .................. Quote submission handler
app/api/quotes/route.ts ................... Quote list & update API
supabase/recreate_table.sql ............... Database schema
```

---

## ✨ Testing Tips & Tricks

### Speed Up Testing
```bash
# Test multiple endpoints in parallel
# Run tests in watch mode for quick iteration
npm test -- --watch

# Use browser dev tools to simulate network throttling
# Chrome DevTools → Network tab → Throttling
# Set to "Slow 3G" for performance testing
```

### Organize Test Data
```json
// Sample test quotes to keep handy
{
  "happy_path": { "name": "John Doe", ... },
  "invalid_email": { "email": "notanemail", ... },
  "rate_limit": "Submit 4 times rapidly",
  "special_chars": { "name": "François Müller", ... }
}
```

### Monitor During Testing
```bash
# In one terminal: Watch logs
npm run dev

# In another terminal: Run tests
./run-quotes-tests.sh local

# Monitor in browser:
# DevTools Network → See all API calls
# DevTools Console → Check for errors
# Supabase Dashboard → Watch quotes appear
```

---

## 🚀 Post-Launch

### After Going Live
1. **Monitor errors**: Check Sentry/error tracking
2. **Track metrics**: Form submissions, completion rate
3. **Gather feedback**: Ask customers about form experience
4. **Fix issues**: Address any bugs found by real users
5. **Optimize**: Improve based on usage patterns

### Ongoing Maintenance
- [ ] Clean up test quotes from database monthly
- [ ] Review rate limit effectiveness
- [ ] Monitor email delivery rates
- [ ] Check spam folder periodically
- [ ] Update admin contact as needed

---

## 📝 Document Version History

| Date | Changes | Status |
|------|---------|--------|
| 2025-12-27 | Initial framework created | READY |
| [Date] | Testing started | PENDING |
| [Date] | All tests passed | PENDING |
| [Date] | Deployed to production | PENDING |

---

## 🎉 Ready to Test!

You now have everything you need to thoroughly test the Moto Kitchen Quotes System:

```
✅ Automated test suite (60+ tests)
✅ Manual testing guide (step-by-step)
✅ Quick test runner script
✅ Results tracker template
✅ Comprehensive documentation
✅ Debugging tips and FAQ
```

**Next Step**: Choose your testing approach and go through the checklist!

**Questions?** Refer to `QUOTES_TESTING_GUIDE.md` for detailed help.

**Ready?** Start with the 5 quick tests or run `./run-quotes-tests.sh local`

🚀 **Let's make sure Moto Kitchen's quote system is bulletproof!** 🚀

