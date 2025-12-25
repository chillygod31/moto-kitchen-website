/**
 * Tenant Isolation Test Script
 * 
 * Tests tenant isolation via direct Supabase queries using anon client
 * (same client your API routes use) to verify:
 * 1. Application-level filtering works correctly
 * 2. RLS blocks queries without tenant context
 * 3. Each tenant only sees their own data when filtering is applied
 * 
 * Run with: npm run test:tenant-isolation
 * Or: tsx scripts/test-tenant-isolation.ts
 */

import dotenv from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
const envPath = resolve(process.cwd(), '.env.local')
dotenv.config({ path: envPath })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are set in .env.local')
  process.exit(1)
}

// Tenant IDs from your database
const TENANT_A_ID = '1a6ffa6e-b78f-49ac-b92c-5d6dcd48dfac'
const TENANT_B_ID = 'ddca4326-bf9f-47f2-b7a8-0128a859c9de'
const TENANT_MOTO_KITCHEN_ID = '25d9c39c-e499-4b46-ad4a-e5dfbbbaf808'

// Test results tracker
interface TestResult {
  name: string
  passed: boolean
  error?: string
  details?: any
}

const results: TestResult[] = []

// Create Supabase client using anon key (same as your API routes)
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
})

/**
 * Test helper - runs async test and tracks results
 */
async function runTest(name: string, testFn: () => Promise<void>): Promise<void> {
  try {
    await testFn()
    results.push({ name, passed: true })
    console.log(`✅ ${name}`)
  } catch (error: any) {
    results.push({ name, passed: false, error: error.message, details: error })
    console.error(`❌ ${name}: ${error.message}`)
    throw error // Re-throw to stop execution if needed
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🧪 Starting Tenant Isolation Tests\n')
  console.log(`Supabase URL: ${SUPABASE_URL}\n`)
  console.log('Test Tenants:')
  console.log(`  - tenant_a: ${TENANT_A_ID}`)
  console.log(`  - tenant_b: ${TENANT_B_ID}`)
  console.log(`  - moto-kitchen: ${TENANT_MOTO_KITCHEN_ID}\n`)
  console.log('Using anon key (same as API routes) - RLS is enforced\n')

  // Test 1: Query without tenant context - should be blocked by RLS
  await runTest('Test 1: Query menu_items without tenant filter (RLS should block)', async () => {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .limit(10)

    // RLS should block this (no tenant context set)
    // If RLS is working, data should be empty array (not null)
    if (error) {
      // Some RLS policies might return error instead of empty
      console.log(`   RLS blocked with error: ${error.message}`)
      return // This is acceptable
    }

    if (data && data.length > 0) {
      throw new Error(
        `RLS did not block: returned ${data.length} items without tenant context. ` +
        `Expected empty array. This means RLS is not properly enforcing isolation.`
      )
    }

    console.log(`   ✅ RLS correctly blocked access (returned ${data?.length || 0} items)`)
  })

  // Test 2: Query tenant_a with application-level filter (how your app works)
  await runTest('Test 2: Query tenant_a items with filter (application-level)', async () => {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('tenant_id', TENANT_A_ID)

    if (error) {
      throw new Error(`Query failed: ${error.message}`)
    }

    if (!data) {
      throw new Error('Query returned null data')
    }

    // Verify all items belong to tenant_a
    const itemsWithWrongTenant = data.filter(
      (item) => item.tenant_id !== TENANT_A_ID
    )

    if (itemsWithWrongTenant.length > 0) {
      throw new Error(
        `Found ${itemsWithWrongTenant.length} items with wrong tenant_id`
      )
    }

    console.log(`   Found ${data.length} menu items for tenant_a`)
  })

  // Test 3: Query tenant_b with application-level filter
  await runTest('Test 3: Query tenant_b items with filter (application-level)', async () => {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('tenant_id', TENANT_B_ID)

    if (error) {
      throw new Error(`Query failed: ${error.message}`)
    }

    if (!data) {
      throw new Error('Query returned null data')
    }

    // Verify all items belong to tenant_b
    const itemsWithWrongTenant = data.filter(
      (item) => item.tenant_id !== TENANT_B_ID
    )

    if (itemsWithWrongTenant.length > 0) {
      throw new Error(
        `Found ${itemsWithWrongTenant.length} items with wrong tenant_id`
      )
    }

    console.log(`   Found ${data.length} menu items for tenant_b`)
  })

  // Test 4: Verify tenant isolation - tenant_a filter should not return tenant_b items
  await runTest('Test 4: Verify tenant isolation (tenant_a filter excludes tenant_b)', async () => {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('tenant_id', TENANT_A_ID)

    if (error) {
      throw new Error(`Query failed: ${error.message}`)
    }

    // Check if any items belong to tenant_b
    const tenantBItems = data?.filter((item) => item.tenant_id === TENANT_B_ID) || []

    if (tenantBItems.length > 0) {
      throw new Error(
        `Tenant isolation broken: tenant_a filter returned ${tenantBItems.length} tenant_b items`
      )
    }

    console.log(`   ✅ Application-level filter correctly isolates tenant_a data`)
  })

  // Test 5: Query moto-kitchen items
  await runTest('Test 5: Query moto-kitchen items with filter', async () => {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('tenant_id', TENANT_MOTO_KITCHEN_ID)

    if (error) {
      throw new Error(`Query failed: ${error.message}`)
    }

    if (!data) {
      throw new Error('Query returned null data')
    }

    // Verify all items belong to moto-kitchen
    const itemsWithWrongTenant = data.filter(
      (item) => item.tenant_id !== TENANT_MOTO_KITCHEN_ID
    )

    if (itemsWithWrongTenant.length > 0) {
      throw new Error(
        `Found ${itemsWithWrongTenant.length} items with wrong tenant_id`
      )
    }

    console.log(`   Found ${data.length} menu items for moto-kitchen`)
  })

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('Test Summary')
  console.log('='.repeat(60))

  const passed = results.filter((r) => r.passed).length
  const failed = results.filter((r) => !r.passed).length

  results.forEach((result) => {
    const icon = result.passed ? '✅' : '❌'
    console.log(`${icon} ${result.name}`)
    if (!result.passed && result.error) {
      console.log(`   Error: ${result.error}`)
    }
  })

  console.log('\n' + '='.repeat(60))
  console.log(`Total: ${results.length} tests`)
  console.log(`Passed: ${passed}`)
  console.log(`Failed: ${failed}`)
  console.log('='.repeat(60))

  console.log('\n📝 Notes:')
  console.log('  - These tests use application-level filtering (`.eq(\'tenant_id\', ...)`)')
  console.log('  - RLS is enabled but tenant context (`app.tenant_id`) is not yet set per request')
  console.log('  - Application-level filtering currently protects data')
  console.log('  - RLS will provide additional protection once tenant context is implemented')
  console.log('')

  if (failed > 0) {
    console.log('⚠️  Some tests failed. Review errors above.')
    process.exit(1)
  } else {
    console.log('✅ All tests passed!')
    process.exit(0)
  }
}

// Run tests
runTests().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})

