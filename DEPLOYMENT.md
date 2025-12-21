# Deployment Guide

## Environment Variables Setup in Vercel

You need to configure these environment variables in your Vercel project settings:

### Required Environment Variables

1. **NEXT_PUBLIC_SUPABASE_URL**
   - Your Supabase project URL
   - Found in: Supabase Dashboard → Settings → API → Project URL

2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
   - Your Supabase anonymous/public key
   - Found in: Supabase Dashboard → Settings → API → Project API keys → `anon` `public`

3. **SUPABASE_SERVICE_ROLE_KEY**
   - Your Supabase service role key (keep this secret!)
   - Found in: Supabase Dashboard → Settings → API → Project API keys → `service_role` `secret`
   - ⚠️ **Important**: This key bypasses Row-Level Security. Never expose it in client-side code.

### How to Add Environment Variables in Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable:
   - **Name**: The variable name (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
   - **Value**: The actual value from Supabase
   - **Environment**: Select all (Production, Preview, Development)
4. Click **Save**
5. **Redeploy** your application for changes to take effect

## Database Setup for Production

The database schema needs to be set up in your **production Supabase instance**.

### Step 1: Run Schema Scripts

In your Supabase SQL Editor, run these scripts **in order**:

1. `supabase/ordering/COMPLETE_SCHEMA_FRESH.sql` - Creates all tables
2. `supabase/ordering/insert-menu-data-fixed.sql` - Adds menu items
3. `supabase/ordering/create-time-slots.sql` - Creates time slots (optional)
4. `supabase/ordering/create-delivery-zones.sql` - Creates delivery zones (optional)

### Step 2: Verify Setup

Run `supabase/ordering/verify-setup.sql` to confirm everything is set up correctly.

Expected results:
- ✅ Moto Kitchen tenant exists
- ✅ 6 menu categories
- ✅ ~49 menu items
- ✅ All items have categories

## Common Issues

### "No menu items available" on Production

**Possible causes:**
1. ❌ Environment variables not set in Vercel
   - **Fix**: Add all 3 environment variables in Vercel settings

2. ❌ Database schema not run in production Supabase
   - **Fix**: Run `COMPLETE_SCHEMA_FRESH.sql` in production Supabase SQL Editor

3. ❌ Tenant doesn't exist
   - **Fix**: The schema script should create it, but verify with `verify-setup.sql`

4. ❌ Menu data not inserted
   - **Fix**: Run `insert-menu-data-fixed.sql` in production Supabase

### "Tenant not found: moto-kitchen"

The tenant table exists but the `moto-kitchen` tenant hasn't been created.

**Fix**: Run this in Supabase SQL Editor:

```sql
INSERT INTO tenants (name, slug, owner_email, owner_name, status, onboarding_completed) 
VALUES ('Moto Kitchen', 'moto-kitchen', 'your-email@example.com', 'Your Name', 'active', true)
ON CONFLICT (slug) DO NOTHING;
```

## Verifying Deployment

After deployment, check:

1. ✅ Visit `/order` - should show menu items
2. ✅ Visit `/admin/orders` - should show orders dashboard (login required)
3. ✅ Check browser console for any errors
4. ✅ Check Vercel function logs for API errors

## Local vs Production

**Local development** uses `.env.local` file (not committed to git).

**Production** uses environment variables set in Vercel dashboard.

Make sure both environments have the same Supabase credentials if you want to use the same database, or set up separate Supabase projects for dev/staging/production.

