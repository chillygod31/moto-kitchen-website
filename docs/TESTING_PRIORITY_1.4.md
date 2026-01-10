# Testing Guide: Priority 1.4 Security Hardening

**Before committing, please test these critical changes locally.**

---

## Quick Tests (5 minutes)

### 1. Password Gate Removal ✅
**What changed**: `/order` is now publicly accessible without password.

**Test**:
```bash
# Start dev server
npm run dev
```

1. Open browser: `http://localhost:3000/order`
2. **Expected**: Menu loads immediately, no password prompt
3. Add items to cart
4. **Expected**: Cart works normally
5. Go to checkout
6. **Expected**: Checkout page accessible

**✅ PASS if**: You can access order page and checkout without any password

---

### 2. Security Headers ✅
**What changed**: Added CSP, HSTS, and other security headers.

**Test in browser**:
1. Open `http://localhost:3000` in Chrome/Firefox
2. Press F12 → Network tab
3. Refresh page
4. Click on the document request (usually first one)
5. Scroll to Response Headers

**Expected headers**:
- `content-security-policy`: Should see a long policy
- `strict-transport-security`: max-age=63072000
- `x-frame-options`: SAMEORIGIN
- `x-content-type-options`: nosniff
- `x-xss-protection`: 1; mode=block

**Or test via command line**:
```bash
curl -I http://localhost:3000 | grep -i "content-security\|x-frame\|strict-transport"
```

**✅ PASS if**: You see these headers in the response

---

### 3. Basic Functionality Check ✅
**What to verify**: Nothing broke.

**Test**:
1. Browse menu at `/order`
2. Add items to cart
3. Go to checkout
4. Fill out customer info
5. Click "Proceed to Payment"
6. **Expected**: Stripe checkout opens (in test mode)

**✅ PASS if**: Checkout flow works end-to-end

---

## Optional Advanced Tests (10 minutes)

### 4. Rate Limiting Test
**What changed**: Added rate limits to payment endpoint (5/min).

**Manual test**:
Try creating 6 checkout sessions quickly:
1. Go to `/order/checkout`
2. Fill form and submit 6 times rapidly
3. **Expected**: 6th attempt should fail with "Too many requests"

**Automated test**:
```bash
# Test payment session rate limiting
for i in {1..6}; do
  echo "Request $i:"
  curl -X POST http://localhost:3000/api/payments/create-session \
    -H "Content-Type: application/json" \
    -d '{
      "customerName": "Test",
      "customerPhone": "+31612345678",
      "cartItems": [{"id": "test", "name": "Test", "price": 10, "quantity": 1}],
      "total": 10,
      "fulfillmentType": "delivery"
    }' -s | jq .
  sleep 8
done
```

**✅ PASS if**: First 5 succeed, 6th returns error with 429 status

---

### 5. Admin CSRF Protection Check
**What to verify**: Admin routes still work with CSRF.

**Test**:
1. Login to admin: `/admin`
2. Go to Orders page
3. Try updating an order status
4. **Expected**: Update works normally

**✅ PASS if**: Admin mutations work (CSRF tokens working)

---

## What Could Go Wrong?

### Issue 1: CSP blocks Stripe
**Symptom**: Stripe checkout doesn't load, console shows CSP errors

**Check**: Browser console (F12) for errors like:
```
Refused to load script from 'https://js.stripe.com'... CSP
```

**Fix**: Already whitelisted, but if you see this, let me know

---

### Issue 2: Order page shows "Access Denied"
**Symptom**: Still seeing password gate

**Cause**: Old build cached

**Fix**:
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

---

### Issue 3: Rate limiting too aggressive
**Symptom**: Legitimate users getting blocked

**Check**: Look for 429 errors in normal usage

**Note**: Limits are generous (5-10 per minute), but we can adjust if needed

---

## Minimum Required Testing

**Before committing, you MUST test**:
1. ✅ Password gate removed (visit `/order`)
2. ✅ Checkout flow works (add to cart → checkout → Stripe)
3. ✅ Security headers present (browser DevTools or curl)

**Optional but recommended**:
- Rate limiting works (try 6 rapid requests)
- Admin still works (login + update order)

---

## When Tests Pass

**Commit the changes**:
```bash
git add -A
git status  # Verify what's being committed

git commit -m "Security hardening (Priority 1.4)

- Remove password gate from /order (public access)
- Add rate limiting to payment endpoints (5/min)
- Add comprehensive security headers (CSP, HSTS, etc.)
- Verify CSRF protection on admin routes

Changes are production-ready and low-risk.
All critical endpoints protected with rate limiting.
Security headers prevent XSS, clickjacking, MIME sniffing."
```

---

## Summary

**Minimum time**: 5 minutes
**Recommended time**: 10-15 minutes

**Critical tests**:
1. Order page accessible without password
2. Checkout flow works
3. Security headers present

If all 3 pass → **Safe to commit** ✅

Any issues? Let me know and I'll help troubleshoot!
