# Supabase Setup Instructions

## Overview
This guide will help you set up Supabase database storage for quote requests from the contact form.

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Fill in:
   - Project name: `moto-kitchen-website` (or your preferred name)
   - Database password: Choose a strong password (save it!)
   - Region: Choose closest to your users (e.g., `West Europe` for Netherlands)
5. Click "Create new project"
6. Wait 2-3 minutes for project to initialize

## Step 2: Get Your Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** → This is your `NEXT_PUBLIC_SUPABASE_URL`
   - **service_role** key (under "Project API keys") → This is your `SUPABASE_SERVICE_ROLE_KEY`
   - ⚠️ **Important:** Use the `service_role` key, NOT the `anon` key (for security)

## Step 3: Create the Database Table

1. In Supabase dashboard, go to **SQL Editor**
2. Click "New query"
3. Copy and paste the entire contents of `supabase/schema.sql`
4. Click "Run" (or press Cmd/Ctrl + Enter)
5. You should see "Success. No rows returned"
6. Verify the table was created:
   - Go to **Table Editor** in the left sidebar
   - You should see `quote_requests` table

## Step 4: Set Environment Variables

### Local Development

Create or update `.env.local` in your project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
RESEND_API_KEY=your-resend-key-here
ADMIN_PASSWORD=your-secure-admin-password-here
```

### Vercel Deployment

1. Go to your Vercel project dashboard
2. Go to **Settings** → **Environment Variables**
3. Add each variable:
   - `NEXT_PUBLIC_SUPABASE_URL` → Your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` → Your service role key
   - `RESEND_API_KEY` → Your Resend API key (if not already set)
   - `ADMIN_PASSWORD` → A secure password for admin access
4. Click "Save"
5. Redeploy your application

## Step 5: Test the Setup

1. Start your development server: `npm run dev`
2. Go to your contact form and submit a test quote request
3. Check:
   - Email should arrive in your inbox
   - Go to Supabase **Table Editor** → `quote_requests` table
   - You should see your test submission
4. Test admin access:
   - Go to `/admin/login`
   - Enter your admin password
   - You should see the quotes management page

## Accessing Your Data

### Option 1: Supabase Dashboard (Recommended)
- Go to **Table Editor** → `quote_requests`
- View, edit, filter, and export data directly
- No code needed!

### Option 2: Admin Page
- Visit `/admin/quotes` (after logging in)
- View all quotes in a table
- Update status, add notes
- Export to CSV

### Option 3: SQL Queries
- Use **SQL Editor** in Supabase dashboard
- Example: `SELECT * FROM quote_requests WHERE status = 'new' ORDER BY created_at DESC;`

## Exporting Emails for Marketing

### Via Supabase Dashboard:
1. Go to **Table Editor** → `quote_requests`
2. Click the filter icon
3. Apply any filters you want
4. Click the "Export" button (top right)
5. Choose CSV format
6. Open in Excel/Google Sheets
7. Copy the `email` column for your email marketing tool

### Via Admin Page:
1. Go to `/admin/quotes`
2. Apply any filters
3. Click "Export CSV"
4. File will download automatically

## Security Notes

- **Never commit** `.env.local` to git (it's already in `.gitignore`)
- **Never share** your `SUPABASE_SERVICE_ROLE_KEY` publicly
- The `service_role` key bypasses Row Level Security - keep it secret!
- Use a strong `ADMIN_PASSWORD` for the admin page

## Troubleshooting

### "Missing Supabase environment variables" error
- Check that all environment variables are set in `.env.local` (local) or Vercel (production)
- Restart your dev server after adding variables

### "relation 'quote_requests' does not exist" error
- Make sure you ran the SQL schema in Supabase SQL Editor
- Check that the table exists in Table Editor

### Can't access admin page
- Make sure `ADMIN_PASSWORD` is set
- Check browser console for errors
- Try clearing sessionStorage and logging in again

### No data appearing in admin page
- Check that quotes are being saved (check Supabase Table Editor)
- Check browser console for API errors
- Verify your Supabase credentials are correct

## Next Steps

- Set up email marketing campaigns using exported email lists
- Track conversion rates by updating quote statuses
- Add more fields to the schema if needed
- Consider adding email notifications for new quotes

