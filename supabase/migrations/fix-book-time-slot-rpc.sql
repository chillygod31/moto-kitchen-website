-- Fix ambiguous column reference in book_time_slot RPC
DROP FUNCTION IF EXISTS book_time_slot(UUID, UUID);

CREATE OR REPLACE FUNCTION book_time_slot(p_slot_id UUID, p_tenant_id UUID)
RETURNS TABLE(slot_id UUID, new_current_orders INT, slot_max_orders INT) AS $$
BEGIN
  RETURN QUERY
  UPDATE time_slots
  SET current_orders = current_orders + 1
  WHERE time_slots.id = p_slot_id
    AND time_slots.tenant_id = p_tenant_id
    AND time_slots.is_active = true
    AND (time_slots.current_orders < time_slots.max_orders)
  RETURNING time_slots.id, time_slots.current_orders, time_slots.max_orders;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
