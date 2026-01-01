# Supabase Cron Jobs Configuration

This document contains the SQL commands to set up cron jobs in Supabase for the P0 Payment Safety system.

## Prerequisites

1. Enable the `pg_cron` extension in Supabase:
   - Go to Supabase Dashboard → Database → Extensions
   - Enable `pg_cron`

2. Store the `CRON_SECRET` in Supabase Vault:
   - Go to Supabase Dashboard → Project Settings → Vault
   - Add a new secret: `app.cron_secret` with a secure random value
   - This should match the `CRON_SECRET` in your `.env.local` file

## Cron Jobs

Run these SQL commands in the Supabase SQL Editor:

### 1. Cleanup Expired Pending Orders (Every 5 minutes)

```sql
-- Remove existing job if it exists
SELECT cron.unschedule('cleanup-expired-pending-orders');

-- Create new job
SELECT cron.schedule(
  'cleanup-expired-pending-orders',
  '*/5 * * * *', -- Every 5 minutes
  $$
  SELECT net.http_post(
    url := 'https://motokitchen.nl/api/cron/cleanup-pending-orders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.cron_secret')
    ),
    body := '{}'::jsonb
  ) as request_id;
  $$
);
```

**For local development**, use:
```sql
SELECT cron.schedule(
  'cleanup-expired-pending-orders',
  '*/5 * * * *',
  $$
  SELECT net.http_post(
    url := 'http://localhost:3000/api/cron/cleanup-pending-orders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.cron_secret')
    ),
    body := '{}'::jsonb
  ) as request_id;
  $$
);
```

### 2. Process Email Queue (Every minute)

```sql
-- Remove existing job if it exists
SELECT cron.unschedule('process-email-queue');

-- Create new job
SELECT cron.schedule(
  'process-email-queue',
  '* * * * *', -- Every minute
  $$
  SELECT net.http_post(
    url := 'https://motokitchen.nl/api/cron/process-email-queue',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.cron_secret')
    ),
    body := '{}'::jsonb
  ) as request_id;
  $$
);
```

**For local development**, use:
```sql
SELECT cron.schedule(
  'process-email-queue',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'http://localhost:3000/api/cron/process-email-queue',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.cron_secret')
    ),
    body := '{}'::jsonb
  ) as request_id;
  $$
);
```

## Verify Cron Jobs

Check that jobs are scheduled:

```sql
SELECT * FROM cron.job;
```

## Monitor Cron Job Execution

Check recent cron job runs:

```sql
SELECT * FROM cron_job_runs 
ORDER BY run_at DESC 
LIMIT 20;
```

Check for failed runs:

```sql
SELECT * FROM cron_job_runs 
WHERE status = 'failed' 
ORDER BY run_at DESC;
```

## Health Check

Use the health check endpoint to verify cron jobs are running:

```bash
curl https://motokitchen.nl/api/cron/health
```

Expected response (healthy):
```json
{
  "status": "healthy",
  "timestamp": "2025-12-30T...",
  "checks": {
    "cleanup_job": {
      "status": "healthy",
      "last_run": "2025-12-30T...",
      "minutes_since_last_run": 2,
      "last_status": "success"
    },
    "email_processor": {
      "status": "healthy",
      "last_run": "2025-12-30T...",
      "minutes_since_last_run": 1,
      "last_status": "success"
    },
    "database": {
      "status": "healthy"
    }
  }
}
```

## Troubleshooting

### Jobs not running

1. Check `pg_cron` is enabled:
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_cron';
   ```

2. Check for errors in cron.job_run_details:
   ```sql
   SELECT * FROM cron.job_run_details 
   ORDER BY start_time DESC 
   LIMIT 10;
   ```

3. Verify the URL is correct (production vs local)

4. Verify `app.cron_secret` is set:
   ```sql
   SELECT current_setting('app.cron_secret');
   ```

### Jobs failing with 401 Unauthorized

- Ensure `CRON_SECRET` in `.env.local` matches `app.cron_secret` in Supabase Vault
- Restart your dev server after updating `.env.local`

### Jobs not processing any records

- Check `email_queue` table for pending emails:
  ```sql
  SELECT * FROM email_queue WHERE status = 'pending';
  ```

- Check `orders` table for expired pending orders:
  ```sql
  SELECT * FROM orders 
  WHERE payment_status = 'pending' 
  AND expires_at < NOW();
  ```

## Unschedule Jobs

To remove a cron job:

```sql
SELECT cron.unschedule('cleanup-expired-pending-orders');
SELECT cron.unschedule('process-email-queue');
```

