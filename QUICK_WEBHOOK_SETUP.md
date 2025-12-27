# Quick Webhook Setup for Local Testing

## The Problem
Orders show in Stripe but not in your database because webhooks aren't reaching your local server.

## Quick Fix: Use Stripe CLI (5 minutes)

### Step 1: Install Stripe CLI

**macOS:**
```bash
brew install stripe/stripe-cli/stripe
```

**Or download from:** https://stripe.com/docs/stripe-cli

### Step 2: Login to Stripe
```bash
stripe login
```
This will open your browser to authorize the CLI.

### Step 3: Forward Webhooks to Your Local Server

In a **new terminal window** (keep your dev server running), run:

```bash
cd "/Users/chilech/Desktop/moto kitchen /moto-kitchen-website"
stripe listen --forward-to localhost:3000/api/payments/webhook
```

You'll see output like:
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx (^C to quit)
```

### Step 4: Update Your .env.local

Copy the `whsec_...` secret from Step 3 and update `.env.local`:

```env
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### Step 5: Restart Your Dev Server

Stop your dev server (Ctrl+C) and restart it:
```bash
npm run dev
```

### Step 6: Test It

1. Place a test order through checkout
2. Watch the Stripe CLI terminal - you should see webhook events
3. Check your admin dashboard - order should appear!

## Verify It's Working

After placing an order, check:

1. **Stripe CLI terminal** - Should show webhook events received
2. **Supabase Database** - Run this query:
   ```sql
   SELECT * FROM orders ORDER BY created_at DESC LIMIT 1;
   ```
3. **Admin Dashboard** - Order should appear in `/admin/orders`

## Troubleshooting

**If webhooks still don't work:**

1. Make sure your dev server is running on `localhost:3000`
2. Make sure the Stripe CLI is forwarding to the correct URL
3. Check server logs for webhook errors
4. Verify `STRIPE_WEBHOOK_SECRET` matches what Stripe CLI shows

## For Production

When you deploy to production, you'll need to:
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/payments/webhook`
3. Select events: `checkout.session.completed`
4. Copy the webhook signing secret
5. Add it to Vercel environment variables as `STRIPE_WEBHOOK_SECRET`

