/**
 * Apply Slot Capacity CHECK Constraint Migration
 *
 * This script applies the database-level CHECK constraint to prevent overbooking.
 * Run this script to add the constraint to your Supabase database.
 *
 * Usage: npx tsx scripts/apply-slot-capacity-constraint.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigration() {
  console.log('🚀 Applying slot capacity CHECK constraint migration...\n')

  try {
    // Read the migration file
    const migrationPath = join(process.cwd(), 'supabase/migrations/2026-01-09-add-slot-capacity-constraint.sql')
    const sql = readFileSync(migrationPath, 'utf-8')

    console.log('📄 Migration SQL:')
    console.log('─'.repeat(80))
    console.log(sql)
    console.log('─'.repeat(80))
    console.log('')

    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })

    if (error) {
      // Try direct execution if RPC doesn't exist
      console.log('⚠️  RPC method not available, trying direct execution...')

      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({ sql_query: sql })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${await response.text()}`)
      }

      console.log('✅ Migration applied successfully via direct execution!')
    } else {
      console.log('✅ Migration applied successfully!')
      if (data) console.log('📊 Result:', data)
    }

    // Verify the constraint exists
    const { data: constraints, error: checkError } = await supabase
      .from('pg_constraint')
      .select('conname')
      .eq('conname', 'check_slot_capacity')
      .single()

    if (checkError) {
      console.log('⚠️  Could not verify constraint (may still be applied):', checkError.message)
    } else if (constraints) {
      console.log('✅ Verified: CHECK constraint "check_slot_capacity" exists')
    }

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

// Run migration
applyMigration()
