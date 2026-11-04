-- ============================================================================
-- Disk IO remediation: pause ordering/payment cron jobs, purge log tables
-- Date: 2026-11-04
-- ============================================================================
--
-- WHY:
--   Supabase reported the Disk IO Budget depleting on this project. Cause is
--   not query cost or customer traffic: it is two pg_cron jobs firing around
--   the clock (every 1 min and every 5 min) that write log rows on every tick
--   whether or not there is work to do, into tables nothing ever prunes.
--
--   Approx 1,728 cron ticks/day, each producing writes to cron.job_run_details,
--   net._http_response and cron_job_runs, plus the WAL and autovacuum work that
--   follows. That constant trickle is what drains a burst IO budget.
--
-- SCOPE OF THIS MIGRATION — READ BEFORE RUNNING:
--   Ordering and payments are not in use. The live features are Quotes,
--   Generate Invoice and Calendar, which are backed by quote_requests,
--   invoice_history and the Google Calendar API respectively. None of them
--   reads or writes anything this migration touches.
--
--   NO CUSTOMER DATA IS DELETED. This migration does not touch, and must never
--   be extended to touch:
--       quote_requests      <- catering leads / customers who applied
--       invoice_history     <- generated invoices
--       orders, order_items <- left intact, merely no longer swept
--       customers, tenants, events, and every other business table
--
--   The only rows removed are machine-generated job logs:
--       cron.job_run_details  pg_cron's own execution log
--       cron_job_runs         this app's job telemetry
--       net._http_response    pg_net's stored HTTP response bodies
--
-- REVERSIBLE: re-scheduling SQL for every paused job is in
--   docs/SUPABASE_CRON_SETUP.md and is restated at the bottom of this file.
-- ============================================================================


-- ----------------------------------------------------------------------------
-- 1. Report current state before changing anything
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
BEGIN
  RAISE NOTICE '--- pg_cron jobs before this migration ---';
  FOR r IN SELECT jobid, jobname, schedule, active FROM cron.job ORDER BY jobid LOOP
    RAISE NOTICE 'jobid=% name=% schedule=% active=%', r.jobid, r.jobname, r.schedule, r.active;
  END LOOP;
END $$;


-- ----------------------------------------------------------------------------
-- 2. Pause the ordering/payment cron jobs
--
--    Unscheduled by name, guarded so a missing job is not an error. Anything
--    not on this list is deliberately left alone and reported in section 5.
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  target TEXT;
  paused TEXT[] := ARRAY[
    'process-email-queue',               -- every minute; email_queue is orders-only
    'cleanup-expired-orders',            -- every 5 min; the name ACTUALLY deployed
    'cleanup-expired-pending-orders',    -- the name in docs/SUPABASE_CRON_SETUP.md
    'generate-slots',                    -- time_slots is ordering-only
    'generate-time-slots'                -- alternate name seen in some setups
  ];
BEGIN
  FOREACH target IN ARRAY paused LOOP
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = target) THEN
      PERFORM cron.unschedule(target);
      RAISE NOTICE 'Paused cron job: %', target;
    ELSE
      RAISE NOTICE 'Cron job not present, nothing to pause: %', target;
    END IF;
  END LOOP;
END $$;


-- ----------------------------------------------------------------------------
-- 3. Purge accumulated job logs
--
--    TRUNCATE rather than DELETE on purpose: a row-by-row delete of several
--    hundred thousand rows would itself burn the Disk IO budget we are trying
--    to recover, and would leave bloat behind for autovacuum to chew through.
--    TRUNCATE reclaims the space immediately at near-zero IO cost.
--
--    Every table here is machine-generated telemetry. No customer data.
-- ----------------------------------------------------------------------------

-- 3a. This app's own job log.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'cron_job_runs'
  ) THEN
    TRUNCATE TABLE cron_job_runs;
    RAISE NOTICE 'Truncated cron_job_runs';
  END IF;
END $$;

-- 3b. pg_cron's execution history. Supabase does not auto-prune this and it is
--     usually the single largest contributor. Guarded: on some projects the
--     table is owned by a role that forbids TRUNCATE, in which case fall back
--     to a bounded DELETE.
DO $$
BEGIN
  BEGIN
    TRUNCATE TABLE cron.job_run_details;
    RAISE NOTICE 'Truncated cron.job_run_details';
  EXCEPTION WHEN insufficient_privilege OR wrong_object_type THEN
    DELETE FROM cron.job_run_details WHERE end_time < NOW() - INTERVAL '1 day';
    RAISE NOTICE 'TRUNCATE denied; deleted cron.job_run_details rows older than 1 day';
  END;
END $$;

-- 3c. pg_net's stored HTTP responses. pg_net has its own TTL worker but the
--     table still carries the backlog from every cron tick to date.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'net' AND table_name = '_http_response'
  ) THEN
    BEGIN
      TRUNCATE TABLE net._http_response;
      RAISE NOTICE 'Truncated net._http_response';
    EXCEPTION WHEN insufficient_privilege OR wrong_object_type THEN
      RAISE NOTICE 'Could not truncate net._http_response; pg_net will expire it on its own TTL';
    END;
  END IF;
END $$;


-- ----------------------------------------------------------------------------
-- 4. Retention safety net
--
--    Guards against this recurring if ordering is ever switched back on.
--    Runs weekly rather than daily: with the jobs above paused there is almost
--    nothing to collect, and a weekly tick costs ~52 writes/year instead of the
--    525,600 we just removed.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION prune_job_logs(p_keep_days INTEGER DEFAULT 14)
RETURNS TABLE(table_name TEXT, rows_removed BIGINT) AS $$
DECLARE
  v_cutoff TIMESTAMPTZ := NOW() - (p_keep_days || ' days')::INTERVAL;
  v_count  BIGINT;
BEGIN
  -- App job telemetry
  DELETE FROM cron_job_runs WHERE run_at < v_cutoff;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  table_name := 'cron_job_runs'; rows_removed := v_count; RETURN NEXT;

  -- pg_cron execution history
  BEGIN
    DELETE FROM cron.job_run_details WHERE end_time < v_cutoff;
    GET DIAGNOSTICS v_count = ROW_COUNT;
  EXCEPTION WHEN insufficient_privilege THEN
    v_count := 0;
  END;
  table_name := 'cron.job_run_details'; rows_removed := v_count; RETURN NEXT;

  -- NOTE: deliberately does not touch quote_requests, invoice_history, orders,
  -- order_items, customers or any other business table.
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION prune_job_logs IS
  'Deletes machine-generated job log rows older than p_keep_days. Never touches customer or business data.';

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'prune-job-logs') THEN
    PERFORM cron.unschedule('prune-job-logs');
  END IF;
  PERFORM cron.schedule(
    'prune-job-logs',
    '17 4 * * 0',                        -- Sundays 04:17 UTC
    $cron$ SELECT prune_job_logs(14); $cron$
  );
  RAISE NOTICE 'Scheduled weekly prune-job-logs';
END $$;


-- ----------------------------------------------------------------------------
-- 4b. Stop cleanup_expired_pending_orders logging idle runs
--
--     Same leak as the email queue route: the function logged a row on every
--     invocation even when it expired zero orders. Redefined here rather than
--     editing the already-applied 2025-12-31 migration. Behaviour is otherwise
--     byte-for-byte the current definition; only the INSERT is now guarded.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION cleanup_expired_pending_orders()
RETURNS TABLE(expired_count INTEGER, slot_adjustments INTEGER) AS $$
DECLARE
  v_expired_count INTEGER;
  v_slot_adjustments INTEGER;
  v_job_start TIMESTAMPTZ := NOW();
BEGIN
  -- Find and update expired pending orders
  WITH expired_orders AS (
    SELECT id, time_slot_id
    FROM orders
    WHERE payment_status = 'pending'
      AND expires_at < NOW()
      AND reservation_released = false  -- Only process if not already released
    FOR UPDATE SKIP LOCKED
  ),
  updated AS (
    UPDATE orders
    SET
      payment_status = 'expired',
      reservation_released = true,
      slot_released_at = NOW()
    WHERE id IN (SELECT id FROM expired_orders)
    RETURNING id, time_slot_id
  ),
  slot_updates AS (
    UPDATE time_slots
    SET current_orders = GREATEST(0, current_orders - 1)
    WHERE id IN (SELECT time_slot_id FROM updated WHERE time_slot_id IS NOT NULL)
    RETURNING id
  )
  SELECT
    (SELECT COUNT(*) FROM updated)::INTEGER,
    (SELECT COUNT(*) FROM slot_updates)::INTEGER
  INTO v_expired_count, v_slot_adjustments;

  -- Log job run, but only when something actually changed
  IF v_expired_count > 0 OR v_slot_adjustments > 0 THEN
    INSERT INTO cron_job_runs (
      job_name,
      run_at,
      duration_ms,
      status,
      records_processed,
      metadata
    ) VALUES (
      'cleanup_expired_pending_orders',
      v_job_start,
      EXTRACT(EPOCH FROM (NOW() - v_job_start)) * 1000,
      'success',
      v_expired_count,
      jsonb_build_object(
        'expired_orders', v_expired_count,
        'slot_adjustments', v_slot_adjustments
      )
    );
  END IF;

  RETURN QUERY SELECT v_expired_count, v_slot_adjustments;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ----------------------------------------------------------------------------
-- 5. Report resulting state
-- ----------------------------------------------------------------------------
DO $$
DECLARE
  r RECORD;
BEGIN
  RAISE NOTICE '--- pg_cron jobs after this migration ---';
  FOR r IN SELECT jobid, jobname, schedule, active FROM cron.job ORDER BY jobid LOOP
    RAISE NOTICE 'jobid=% name=% schedule=% active=%', r.jobid, r.jobname, r.schedule, r.active;
  END LOOP;
  RAISE NOTICE 'Review the list above. Anything still active that relates to '
               'orders or payments can be paused with: SELECT cron.unschedule(''<name>'');';
END $$;


-- ============================================================================
-- TO REVERSE (if ordering is switched back on)
-- ============================================================================
-- SELECT cron.schedule(
--   'process-email-queue', '*/5 * * * *',     -- note: 5 min, not 1 min
--   $$ SELECT net.http_post(
--        url := 'https://motokitchen.nl/api/cron/process-email-queue',
--        headers := jsonb_build_object(
--          'Content-Type', 'application/json',
--          'Authorization', 'Bearer ' || current_setting('app.cron_secret')),
--        body := '{}'::jsonb) $$);
--
-- SELECT cron.schedule(
--   'cleanup-expired-pending-orders', '*/15 * * * *',
--   $$ SELECT net.http_post(
--        url := 'https://motokitchen.nl/api/cron/cleanup-pending-orders',
--        headers := jsonb_build_object(
--          'Content-Type', 'application/json',
--          'Authorization', 'Bearer ' || current_setting('app.cron_secret')),
--        body := '{}'::jsonb) $$);
-- ============================================================================
