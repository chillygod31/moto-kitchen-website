-- ============================================================================
-- P0 Payment Safety Migration 4: Cleanup Expired Orders Function
-- ============================================================================

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
    FOR UPDATE SKIP LOCKED
  ),
  updated AS (
    UPDATE orders
    SET 
      payment_status = 'expired',
      updated_at = NOW()
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
  
  -- Log job run
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
  
  RETURN QUERY SELECT v_expired_count, v_slot_adjustments;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

