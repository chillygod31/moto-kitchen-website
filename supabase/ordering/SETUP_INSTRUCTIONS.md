# Clean Database Setup Instructions

Since the existing tables have the wrong structure, follow these steps:

## ⚠️ IMPORTANT: This will DELETE all existing ordering data
Only proceed if you don't have important orders/data to preserve.

## Step-by-Step Setup

### 1. Drop Old Tables
Run: `DROP_OLD_TABLES.sql`
- This removes the old structure (menu_items, orders, etc.)
- **Keeps** `quote_requests` table (from main website)

### 2. Create Fresh Schema
Run: `COMPLETE_SCHEMA_FRESH.sql`
- Creates all tables with correct multi-tenant structure
- Creates Moto Kitchen tenant
- Links to Enterprise subscription

### 3. Add Menu Data
Run: `insert-menu-data-fixed.sql`
- Inserts all 48 menu items with categories
- Links everything to Moto Kitchen tenant

### 4. Create Time Slots (Optional)
Run: `create-time-slots.sql`
- Creates time slots for next 7 days
- Adjust times/max_orders as needed

### 5. Create Delivery Zones (Optional)
Run: `create-delivery-zones.sql`
- Sets up delivery zones based on Dutch postcodes
- Adjust postcodes/fees as needed

## Verification

After running all scripts, verify with:

```sql
-- Check tenant exists
SELECT * FROM tenants WHERE slug = 'moto-kitchen';

-- Check menu items
SELECT COUNT(*) FROM menu_items WHERE tenant_id = (SELECT id FROM tenants WHERE slug = 'moto-kitchen');

-- Check categories
SELECT name, COUNT(*) FROM menu_categories mc
JOIN menu_items mi ON mi.category_id = mc.id
WHERE mc.tenant_id = (SELECT id FROM tenants WHERE slug = 'moto-kitchen')
GROUP BY mc.name;
```

## Troubleshooting

If you get errors:
1. Make sure you ran scripts in order (1, 2, 3, 4, 5)
2. Check that `tenants` table exists and has Moto Kitchen tenant
3. Verify no foreign key constraint errors
4. Check error messages for specific table/column issues

