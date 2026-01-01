-- ============================================================================
-- P0 Payment Safety Migration 2: RPC Functions for Slot Management
-- ============================================================================

-- ============================================================================
-- 1. Function: Release time slot (for rollback)
-- ============================================================================
CREATE OR REPLACE FUNCTION release_time_slot(
  p_slot_id UUID,
  p_tenant_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_updated BOOLEAN;
BEGIN
  UPDATE time_slots
  SET current_orders = GREATEST(0, current_orders - 1)
  WHERE id = p_slot_id
    AND tenant_id = p_tenant_id
    AND current_orders > 0;
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 2. Function: Create pending order with slot booking (atomic)
-- ============================================================================
CREATE OR REPLACE FUNCTION create_pending_order_with_slot(
  p_tenant_id UUID,
  p_session_id TEXT,
  p_slot_id UUID,
  p_order_data JSONB
)
RETURNS TABLE(order_id UUID, order_number TEXT, slot_booked BOOLEAN) AS $$
DECLARE
  v_order_id UUID;
  v_order_number TEXT;
  v_slot_booked BOOLEAN := false;
BEGIN
  -- 1. Generate order number
  SELECT COALESCE(MAX(CAST(o.order_number AS INTEGER)), 0) + 1
  INTO v_order_number
  FROM orders o
  WHERE o.tenant_id = p_tenant_id;
  
  v_order_number := v_order_number::TEXT;
  
  -- 2. Book slot atomically if provided
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
  
  -- 3. Create pending order
  INSERT INTO orders (
    tenant_id,
    order_number,
    stripe_session_id,
    time_slot_id,
    payment_status,
    expires_at,
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
    NOW() + INTERVAL '20 minutes',
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
  
  -- 4. Create order items
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

