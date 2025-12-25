# Setup Admin User - Step by Step Guide

## Overview
Link a Supabase Auth user to the Moto Kitchen tenant so they can access the admin dashboard.

---

## Step 1: Create User in Supabase Auth

1. Go to **Supabase Dashboard** → Your Project
2. Click **Authentication** in the left sidebar
3. Click **Users** tab
4. Click **"Add user"** button (top right)
5. Select **"Create new user"**
6. Fill in:
   - **Email**: `admin@motokitchen.nl` (or your email)
   - **Password**: [Choose a secure password]
   - **Auto Confirm User**: ✅ **Check this box** (important!)
7. Click **"Create user"**
8. **IMPORTANT**: Copy the **User ID** (UUID) - you'll need it in Step 3
   - It looks like: `12345678-1234-1234-1234-123456789abc`

---

## Step 2: Get Your Tenant ID

1. In Supabase Dashboard, go to **SQL Editor**
2. Click **"New query"**
3. Paste and run this query:

```sql
SELECT id, name, slug 
FROM tenants 
WHERE slug = 'moto-kitchen';
```

4. **Copy the `id` (UUID)** from the result
   - It looks like: `abcdef12-3456-7890-abcd-ef1234567890`

---

## Step 3: Create tenant_members Entry

1. Still in **SQL Editor**, create a new query
2. Paste this SQL (replace the placeholders):

```sql
INSERT INTO tenant_members (tenant_id, user_id, role, created_at)
VALUES (
  (SELECT id FROM tenants WHERE slug = 'moto-kitchen'),  -- Auto-gets tenant ID
  'YOUR_USER_ID_HERE',  -- Replace with UUID from Step 1
  'owner',  -- Role: 'owner' (can also be 'admin' or 'staff')
  NOW()
)
ON CONFLICT (tenant_id, user_id) DO NOTHING;
```

3. **Replace `'YOUR_USER_ID_HERE'`** with the User ID UUID from Step 1
   - Make sure to keep the quotes: `'12345678-1234-1234-1234-123456789abc'`
4. Click **"Run"** (or press Cmd/Ctrl + Enter)
5. You should see: **"Success. No rows returned"** or **"INSERT 0 1"**

---

## Step 4: Verify It Works

1. Run this verification query:

```sql
SELECT 
  tm.role,
  t.name as tenant_name,
  t.slug as tenant_slug,
  au.email as user_email
FROM tenant_members tm
JOIN tenants t ON t.id = tm.tenant_id
LEFT JOIN auth.users au ON au.id = tm.user_id::uuid
WHERE t.slug = 'moto-kitchen';
```

2. You should see your user email with role 'owner'

---

## Step 5: Test Admin Login

1. Go to your website: `http://localhost:3000/admin/login` (or your production URL)
2. Enter:
   - **Email**: The email you used in Step 1
   - **Password**: The password you set in Step 1
3. Click **"Login"**
4. You should be redirected to `/admin/quotes`

---

## Troubleshooting

### "User is not authorized as admin" error
- ✅ Make sure the `tenant_members` entry was created successfully
- ✅ Verify the User ID matches exactly (check for typos)
- ✅ Make sure the tenant ID is correct

### "Invalid email or password" error
- ✅ Check the email/password are correct
- ✅ Make sure "Auto Confirm User" was checked when creating the user
- ✅ Try resetting the password in Supabase Dashboard

### Can't find tenant_members table
- Run the RLS migration first: `supabase/migrations/switch-to-jwt-rls.sql`
- Or create the table manually (check schema files)

### User ID not found
- Double-check you copied the full UUID from Authentication → Users
- Make sure there are no extra spaces or characters

---

## Quick Reference

**File with SQL queries**: `supabase/setup-admin-user.sql`

**Related files**:
- `PHASE_A_NEXT_STEPS.md` - Complete Phase A guide
- `supabase/migrations/switch-to-jwt-rls.sql` - RLS migration (run this first)

