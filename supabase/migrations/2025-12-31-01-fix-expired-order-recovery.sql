-- ============================================================================
-- P0 Payment Safety Fix: Expired Order Recovery
-- ============================================================================
-- Fixes the gap between order expiry (20 min) and Stripe expiry (30 min)
-- Adds slot reservation tracking to prevent double-counting

-- ============================================================================
-- 1. Add reservation tracking to orders
-- ============================================================================
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS reservation_released BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS slot_released_at TIMESTAMP WITH TIME ZONE;

-- Add new payment status for recovery scenarios
ALTER TABLE orders 
  DROP CONSTRAINT IF EXISTS orders_payment_status_check;

ALTER TABLE orders
  ADD CONSTRAINT orders_payment_status_check 
  CHECK (payment_status IN ('pending', 'unpaid', 'paid', 'refunded', 'expired', 'paid_pending_resolution'));

-- ============================================================================
-- 2. Update create_pending_order_with_slot to use Stripe expiry time
-- ============================================================================
CREATE OR REPLACE FUNCTION create_pending_order_with_slot(
  p_tenant_id UUID,
  p_session_id TEXT,
  p_slot_id UUID,
  p_order_data JSONB,
  p_stripe_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE(order_id UUID, order_number TEXT, slot_booked BOOLEAN) AS $$
DECLARE
  v_order_id UUID;
  v_order_number TEXT;
  v_slot_booked BOOLEAN := false;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- 1. Generate order number
  SELECT COALESCE(MAX(CAST(o.order_number AS INTEGER)), 0) + 1
  INTO v_order_number
  FROM orders o
  WHERE o.tenant_id = p_tenant_id;
  
  v_order_number := v_order_number::TEXT;
  
  -- 2. Calculate expiry time
  -- Use Stripe session expiry if provided, otherwise default to 30 minutes
  v_expires_at := COALESCE(p_stripe_expires_at, NOW() + INTERVAL '30 minutes');
  
  -- 3. Book slot atomically if provided
  IF p_slot_id IS NOT NULL THEN
    UPDATE time_slots
    SET current_orders = current_orders + 1
    WHERE id = p_slot_id
      AND tenant_id = p_tenant_id
      AND is_active = true
      AND (max_orders IS NULL OR current_orders < max_orders);
    
    GET DIAGNOSTICS v_slot_booked = ROW_COUNT;
    
    IF NOT v_slot_booked THEN
      RAISE EXCEPTION 'Slot % is full or inactive', p_slot_id;
    END IF;
  END IF;
  
  -- 4. Create pending order with reservation tracking
  INSERT INTO orders (
    tenant_id,
    order_number,
    stripe_session_id,
    time_slot_id,
    payment_status,
    expires_at,
    reservation_released,
    customer_name,
    customer_email,
    customer_phone,
    fulfillment_type,
    scheduled_for,
    delivery_address,
    postcode,
    city,
    subtotal,
    delivery_fee,
    service_fee,
    admin_fee,
    total,
    notes,
    status
  ) VALUES (
    p_tenant_id,
    v_order_number,
    p_session_id,
    p_slot_id,
    'pending',
    v_expires_at,
    false,  -- Reservation not released yet
    p_order_data->>'customer_name',
    NULLIF(p_order_data->>'customer_email', ''),
    p_order_data->>'customer_phone',
    p_order_data->>'fulfillment_type',
    NULLIF(p_order_data->>'scheduled_for', '')::timestamptz,
    NULLIF(p_order_data->>'delivery_address', ''),
    NULLIF(p_order_data->>'postcode', ''),
    NULLIF(p_order_data->>'city', ''),
    (p_order_data->>'subtotal')::decimal,
    COALESCE((p_order_data->>'delivery_fee')::decimal, 0),
    COALESCE((p_order_data->>'service_fee')::decimal, 0),
    COALESCE((p_order_data->>'admin_fee')::decimal, 0),
    (p_order_data->>'total')::decimal,
    NULLIF(p_order_data->>'notes', ''),
    'new'
  )
  RETURNING id INTO v_order_id;
  
  -- 5. Create order items
  IF p_order_data ? 'cart_items' THEN
    INSERT INTO order_items (
      tenant_id,
      order_id,
      menu_item_id,
      name_snapshot,
      unit_price,
      quantity,
      line_total
    )
    SELECT 
      p_tenant_id,
      v_order_id,
      (item->>'menu_item_id')::uuid,
      item->>'name',
      (item->>'price')::decimal,
      (item->>'quantity')::integer,
      (item->>'price')::decimal * (item->>'quantity')::integer
    FROM jsonb_array_elements(p_order_data->'cart_items') AS item;
  END IF;
  
  RETURN QUERY SELECT v_order_id, v_order_number, v_slot_booked;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 3. Update cleanup function to mark reservation as released
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

-- ============================================================================
-- 4. Update webhook processor to handle expired orders safely
-- ============================================================================
CREATE OR REPLACE FUNCTION process_webhook_atomically(
  p_event_id TEXT,
  p_session_id TEXT,
  p_payment_intent TEXT,
  p_tenant_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_order_id UUID;
  v_order_number TEXT;
  v_expires_at TIMESTAMPTZ;
  v_slot_id UUID;
  v_slot_available BOOLEAN;
  v_is_expired BOOLEAN := false;
  v_order_payment_status TEXT;
  v_reservation_released BOOLEAN;
BEGIN
  -- 1. Insert webhook event (deduplication via unique constraint)
  BEGIN
    INSERT INTO webhook_events (
      stripe_event_id, 
      event_type, 
      payload, 
      processed,
      created_at
    ) VALUES (
      p_event_id,
      'checkout.session.completed',
      jsonb_build_object(
        'session_id', p_session_id,
        'payment_intent', p_payment_intent,
        'tenant_id', p_tenant_id
      ),
      false,
      NOW()
    );
  EXCEPTION WHEN unique_violation THEN
    -- SAFETY: Event ID exists, but verify it was actually processed successfully
    DECLARE
      v_webhook_processed BOOLEAN;
    BEGIN
      SELECT processed INTO v_webhook_processed
      FROM webhook_events WHERE stripe_event_id = p_event_id;
      
      SELECT o.id, o.order_number, o.payment_status
      INTO v_order_id, v_order_number, v_order_payment_status
      FROM orders o
      WHERE o.stripe_session_id = p_session_id AND o.tenant_id = p_tenant_id;
      
      -- SAFE: Webhook marked processed AND order is paid
      IF v_webhook_processed = true AND v_order_payment_status IN ('paid', 'paid_pending_resolution') THEN
        RETURN jsonb_build_object(
          'status', 'already_processed',
          'order_id', v_order_id,
          'order_number', v_order_number
        );
      END IF;
      
      -- DANGER: Event exists but processing incomplete
      INSERT INTO webhook_alerts (
        tenant_id, alert_type, severity, session_id, order_id, error_message, metadata
      ) VALUES (
        p_tenant_id, 'webhook_failure', 'critical', p_session_id, v_order_id,
        'Duplicate event_id but order not paid - previous webhook may have failed',
        jsonb_build_object(
          'event_id', p_event_id,
          'webhook_processed', v_webhook_processed,
          'order_status', v_order_payment_status,
          'payment_intent', p_payment_intent
        )
      );
      
      RAISE EXCEPTION 'Duplicate event_id % but order % not paid (status: %). Previous webhook failed - retrying.',
        p_event_id, v_order_number, v_order_payment_status;
    END;
  END;
  
  -- 2. Find order by session_id (pending OR expired)
  SELECT id, order_number, expires_at, time_slot_id, payment_status, reservation_released
  INTO v_order_id, v_order_number, v_expires_at, v_slot_id, v_order_payment_status, v_reservation_released
  FROM orders
  WHERE stripe_session_id = p_session_id
    AND tenant_id = p_tenant_id
    AND payment_status IN ('pending', 'expired');  -- ✅ Accept both
  
  IF v_order_id IS NULL THEN
    RAISE EXCEPTION 'No order found for session %', p_session_id;
  END IF;
  
  -- 3. Check if order expired (either marked expired or past expiry time)
  IF v_order_payment_status = 'expired' OR v_expires_at < NOW() THEN
    v_is_expired := true;
    
    -- Check if slot still has capacity (if slot was assigned)
    IF v_slot_id IS NOT NULL THEN
      SELECT (current_orders < max_orders OR max_orders IS NULL) AND is_active
      INTO v_slot_available
      FROM time_slots
      WHERE id = v_slot_id;
      
      IF NOT v_slot_available THEN
        -- Slot is full or inactive - cannot accept payment normally
        -- Mark as paid_pending_resolution for manual handling
        UPDATE orders
        SET 
          payment_status = 'paid_pending_resolution',
          stripe_payment_intent_id = p_payment_intent,
          expires_at = NULL,
          email_status = 'pending'
        WHERE id = v_order_id;
        
        INSERT INTO webhook_alerts (
          tenant_id, alert_type, severity, session_id, order_id, error_message, metadata
        ) VALUES (
          p_tenant_id, 'expired_order_paid', 'critical', p_session_id, v_order_id,
          'Customer paid after order expired and slot is now full - requires manual resolution',
          jsonb_build_object(
            'requires_manual_action', true,
            'order_number', v_order_number,
            'slot_id', v_slot_id,
            'payment_intent', p_payment_intent,
            'action_options', ARRAY['reschedule_to_next_slot', 'refund_with_notification']
          )
        );
        
        -- Still queue emails but mark as pending resolution
        INSERT INTO email_queue (order_id, recipient, email_type, status)
        SELECT v_order_id, o.customer_email, 'customer_confirmation', 'pending'
        FROM orders o
        WHERE o.id = v_order_id AND o.customer_email IS NOT NULL AND o.customer_email != '';
        
        INSERT INTO email_queue (order_id, recipient, email_type, status)
        SELECT v_order_id, t.business_email, 'admin_alert', 'pending'
        FROM orders o JOIN tenants t ON t.id = o.tenant_id
        WHERE o.id = v_order_id AND t.business_email IS NOT NULL AND t.business_email != '';
        
        UPDATE webhook_events SET processed = true WHERE stripe_event_id = p_event_id;
        
        RETURN jsonb_build_object(
          'status', 'paid_pending_resolution',
          'order_id', v_order_id,
          'order_number', v_order_number,
          'was_expired', true,
          'requires_manual_action', true
        );
      ELSE
        -- Slot available - can auto-recover
        -- Only re-book if reservation was released
        IF v_reservation_released = true THEN
          UPDATE time_slots
          SET current_orders = current_orders + 1
          WHERE id = v_slot_id;
        END IF;
        
        INSERT INTO webhook_alerts (
          tenant_id, alert_type, severity, session_id, order_id, error_message, metadata
        ) VALUES (
          p_tenant_id, 'expired_order_paid', 'medium', p_session_id, v_order_id,
          'Customer paid after order expired but slot was re-booked successfully',
          jsonb_build_object(
            'auto_recovered', true,
            'order_number', v_order_number,
            'slot_id', v_slot_id,
            'reservation_was_released', v_reservation_released
          )
        );
      END IF;
    END IF;
  END IF;
  
  -- 4. Update order to paid (if not already set to paid_pending_resolution)
  UPDATE orders
  SET 
    payment_status = CASE 
      WHEN payment_status = 'paid_pending_resolution' THEN 'paid_pending_resolution'
      ELSE 'paid'
    END,
    stripe_payment_intent_id = p_payment_intent,
    expires_at = NULL,
    email_status = 'pending'
  WHERE id = v_order_id;
  
  -- 5. Update or create payment record
  INSERT INTO payments (
    order_id, provider, provider_reference, stripe_session_id,
    stripe_payment_intent_id, amount, status
  )
  SELECT v_order_id, 'stripe', p_session_id, p_session_id,
    p_payment_intent, o.total, 'completed'
  FROM orders o WHERE o.id = v_order_id
  ON CONFLICT (order_id) DO UPDATE
  SET stripe_payment_intent_id = p_payment_intent, status = 'completed';
  
  -- 6. Queue confirmation emails (if not already done above)
  INSERT INTO email_queue (order_id, recipient, email_type, status)
  SELECT v_order_id, o.customer_email, 'customer_confirmation', 'pending'
  FROM orders o
  WHERE o.id = v_order_id AND o.customer_email IS NOT NULL AND o.customer_email != ''
  ON CONFLICT DO NOTHING;
  
  INSERT INTO email_queue (order_id, recipient, email_type, status)
  SELECT v_order_id, t.business_email, 'admin_alert', 'pending'
  FROM orders o JOIN tenants t ON t.id = o.tenant_id
  WHERE o.id = v_order_id AND t.business_email IS NOT NULL AND t.business_email != ''
  ON CONFLICT DO NOTHING;
  
  -- 7. Mark webhook as processed
  UPDATE webhook_events SET processed = true WHERE stripe_event_id = p_event_id;
  
  RETURN jsonb_build_object(
    'status', CASE 
      WHEN (SELECT payment_status FROM orders WHERE id = v_order_id) = 'paid_pending_resolution' 
      THEN 'paid_pending_resolution'
      ELSE 'success'
    END,
    'order_id', v_order_id,
    'order_number', v_order_number,
    'was_expired', v_is_expired,
    'auto_recovered', v_is_expired AND v_slot_available
  );
  
EXCEPTION WHEN OTHERS THEN
  BEGIN
    INSERT INTO webhook_alerts (
      tenant_id, alert_type, severity, session_id, error_message, metadata
    ) VALUES (
      p_tenant_id, 'webhook_failure', 'critical', p_session_id, SQLERRM,
      jsonb_build_object(
        'event_id', p_event_id,
        'payment_intent', p_payment_intent,
        'error_detail', SQLSTATE
      )
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  
  RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

