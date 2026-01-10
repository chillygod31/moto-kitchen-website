-- Check if order_items table exists and has data
SELECT COUNT(*) as total_items FROM order_items;

-- Show recent order items (if any)
SELECT 
  oi.id,
  oi.order_id,
  oi.name_snapshot,
  oi.quantity,
  oi.unit_price,
  oi.line_total,
  oi.created_at
FROM order_items oi
ORDER BY oi.created_at DESC
LIMIT 10;
