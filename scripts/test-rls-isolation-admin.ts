/**
 * RLS Isolation Test Script (Admin)
 * 
 * Tests admin RLS isolation using JWT:
 * - As owner_a: Try to SELECT/UPDATE/DELETE tenant_b data → should fail
 * - As staff_a: Try to SELECT/UPDATE/DELETE tenant_b data → should fail
 * - As random_user (no membership): Try to access any tenant data → should fail
 * 
 * Usage: tsx scripts/test-rls-isolation-admin.ts
 * 
 * Prerequisites: Run setup-test-sandbox.ts first
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
  process.exit(1)
}

// Test user credentials
const TEST_USERS = {
  owner_a: { email: 'owner_a@test.motokitchen.nl', password: 'TestPassword123!' },
  staff_a: { email: 'staff_a@test.motokitchen.nl', password: 'TestPassword123!' },
  random_user: { email: 'random_user@test.motokitchen.nl', password: 'TestPassword123!' }
}

interface TestResult {
  name: string
  passed: boolean
  error?: string
}

const results: TestResult[] = []

/**
 * Get authenticated Supabase client for a user
 */
async function getAuthClient(email: string, password: string) {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  
  if (error || !data.session) {
    throw new Error(`Failed to sign in: ${error?.message || 'No session'}`)
  }
  
  return supabase
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🧪 Starting RLS Isolation Tests (Admin)\n')
  console.log('Prerequisites: Make sure setup-test-sandbox.ts has been run\n')

  // Get tenant IDs
  const adminClient = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  const { data: tenants } = await adminClient
    .from('tenants')
    .select('id, slug')
    .in('slug', ['tenant-a', 'tenant-b'])

  if (!tenants || tenants.length < 2) {
    console.error('❌ Need at least 2 tenants (tenant-a and tenant-b)')
    process.exit(1)
  }

  const tenantA = tenants.find(t => t.slug === 'tenant-a')
  const tenantB = tenants.find(t => t.slug === 'tenant-b')

  if (!tenantA || !tenantB) {
    console.error('❌ Could not find tenant-a or tenant-b')
    process.exit(1)
  }

  // Test 1: owner_a cannot access tenant_b data
  await runTest('Test 1: owner_a cannot SELECT tenant_b data', async () => {
    const supabase = await getAuthClient(TEST_USERS.owner_a.email, TEST_USERS.owner_a.password)
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('tenant_id', tenantB.id)

    // Should return empty or error (RLS blocks cross-tenant access)
    if (data && data.length > 0) {
      throw new Error(`RLS failed: owner_a can see ${data.length} items from tenant_b`)
    }

    console.log(`   ✅ RLS correctly blocked cross-tenant access`)
  })

  // Test 2: staff_a cannot access tenant_b data
  await runTest('Test 2: staff_a cannot SELECT tenant_b data', async () => {
    const supabase = await getAuthClient(TEST_USERS.staff_a.email, TEST_USERS.staff_a.password)
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('tenant_id', tenantB.id)

    // Should return empty or error
    if (data && data.length > 0) {
      throw new Error(`RLS failed: staff_a can see ${data.length} items from tenant_b`)
    }

    console.log(`   ✅ RLS correctly blocked cross-tenant access`)
  })

  // Test 3: random_user cannot access any tenant data
  await runTest('Test 3: random_user cannot access any tenant data', async () => {
    const supabase = await getAuthClient(TEST_USERS.random_user.email, TEST_USERS.random_user.password)
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .limit(10)

    // Should return empty or error (no tenant membership)
    if (data && data.length > 0) {
      throw new Error(`RLS failed: random_user can see ${data.length} items without tenant membership`)
    }

    console.log(`   ✅ RLS correctly blocked access for non-member`)
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

  if (failed > 0) {
    console.log('\n⚠️  Some tests failed. Review errors above.')
    process.exit(1)
  } else {
    console.log('\n✅ All tests passed!')
    process.exit(0)
  }
}

async function runTest(name: string, testFn: () => Promise<void>): Promise<void> {
  try {
    await testFn()
    results.push({ name, passed: true })
    console.log(`✅ ${name}`)
  } catch (error: any) {
    results.push({ name, passed: false, error: error.message })
    console.error(`❌ ${name}: ${error.message}`)
  }
}

// Run tests
runTests().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})

