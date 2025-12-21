# Multi-Tenant Ordering System - Database Setup

This directory contains all SQL scripts needed to set up and maintain the ordering system database schema.

## 📁 Files Overview

### Core Setup Scripts

**`COMPLETE_SCHEMA_FRESH.sql`**
- Main schema file - creates all tables, indexes, triggers
- Creates Moto Kitchen tenant
- Links to Enterprise subscription
- **Run this first** when setting up a new database

**`insert-menu-data-fixed.sql`**
- Inserts all 49 menu items across 6 categories
- Links everything to Moto Kitchen tenant
- Run after `COMPLETE_SCHEMA_FRESH.sql`

**`create-time-slots.sql`**
- Creates time slots for the next 7 days
- 3 slots per day (12:00, 17:00, 19:00)
- Optional: Adjust times/max_orders as needed

**`create-delivery-zones.sql`**
- Sets up delivery zones based on Dutch postcodes
- Optional: Adjust postcodes/fees as needed

### Utility Scripts

**`DROP_OLD_TABLES.sql`**
- Removes old ordering system tables
- Use only if you need to reset the database
- ⚠️ **WARNING**: This deletes all existing order data!

**`verify-setup.sql`**
- Comprehensive verification script
- Checks all tables, relationships, and data integrity
- Run after setup to confirm everything is correct

### Documentation

**`SETUP_INSTRUCTIONS.md`**
- Step-by-step setup guide
- Troubleshooting tips

## 🚀 Quick Start

### Fresh Setup (New Database)

1. Run `COMPLETE_SCHEMA_FRESH.sql`
2. Run `insert-menu-data-fixed.sql`
3. Run `create-time-slots.sql` (optional)
4. Run `create-delivery-zones.sql` (optional)
5. Run `verify-setup.sql` to verify

### Reset Existing Database

1. Run `DROP_OLD_TABLES.sql`
2. Follow "Fresh Setup" steps above

## 📊 Expected Results

After setup, you should have:
- ✅ Moto Kitchen tenant created
- ✅ 6 menu categories
- ✅ ~49 menu items (all with categories)
- ✅ 7 delivery zones (if delivery zones script was run)
- ✅ 21 time slots (if time slots script was run)
- ✅ All tables properly linked with foreign keys

## 🔧 Maintenance

### Adding Menu Items
- Update `insert-menu-data-fixed.sql` with new items
- Or add directly via Supabase Table Editor

### Updating Delivery Zones
- Edit `create-delivery-zones.sql`
- Or update directly in Supabase

### Regenerating Time Slots
- Re-run `create-time-slots.sql` to regenerate slots

## 📝 Notes

- All scripts are idempotent (safe to run multiple times)
- Scripts use `ON CONFLICT DO NOTHING` to prevent duplicates
- Tenant slug is hardcoded as `'moto-kitchen'`
- Update tenant email/name in `COMPLETE_SCHEMA_FRESH.sql` if needed

