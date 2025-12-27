/**
 * Test Sandbox Setup Script
 * 
 * Creates test infrastructure for Phase A runtime tests:
 * - Creates tenant_a and tenant_b tenants
 * - Creates test users in Supabase Auth (owner_a, staff_a, owner_b, random_user)
 * - Creates tenant_members entries linking users to tenants with correct roles
 * - Seeds each tenant with menu categories, menu items, and orders
 * 
 * Usage: tsx scripts/setup-test-sandbox.ts
 * 
 * Output: Prints tenant IDs, user IDs, and user email/password for use in test scripts
 */

import dotenv from 'dotenv'
import { resolve } from 'path'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
const envPath = resolve(process.cwd(), '.env.local')
dotenv.config({ path: envPath })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

// Use service role client for admin operations
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

interface TestUser {
  email: string
  password: string
  name: string
  userId?: string
}

interface TestTenant {
  name: string
  slug: string
  ownerEmail: string
  tenantId?: string
}

const testUsers: Record<string, TestUser> = {
  owner_a: {
    email: 'owner_a@test.motokitchen.nl',
    password: 'TestPassword123!',
    name: 'Owner A'
  },
  staff_a: {
    email: 'staff_a@test.motokitchen.nl',
    password: 'TestPassword123!',
    name: 'Staff A'
  },
  owner_b: {
    email: 'owner_b@test.motokitchen.nl',
    password: 'TestPassword123!',
    name: 'Owner B'
  },
  random_user: {
    email: 'random_user@test.motokitchen.nl',
    password: 'TestPassword123!',
    name: 'Random User'
  }
}

const testTenants: Record<string, TestTenant> = {
  tenant_a: {
    name: 'Test Tenant A',
    slug: 'tenant-a',
    ownerEmail: testUsers.owner_a.email
  },
  tenant_b: {
    name: 'Test Tenant B',
    slug: 'tenant-b',
    ownerEmail: testUsers.owner_b.email
  }
}

/**
 * Create a user in Supabase Auth
 */
async function createUser(email: string, password: string): Promise<string> {
  // First, check if user already exists
  const { data: existingUsers } = await supabase.auth.admin.listUsers()
  const existingUser = existingUsers?.users.find(u => u.email === email)
  
  if (existingUser) {
    console.log(`   User ${email} already exists, using existing user (${existingUser.id})`)
    return existingUser.id
  }

  // User doesn't exist, create them
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true // Auto-confirm email for testing
  })

  if (error) {
    // Double-check if user was created by another process
    const { data: checkUsers } = await supabase.auth.admin.listUsers()
    const checkUser = checkUsers?.users.find(u => u.email === email)
    if (checkUser) {
      console.log(`   User ${email} found after error, using existing user (${checkUser.id})`)
      return checkUser.id
    }
    throw error
  }

  if (!data.user) {
    throw new Error(`Failed to create user ${email}: no user data returned`)
  }

  return data.user.id
}

/**
 * Create a tenant
 */
async function createTenant(tenant: TestTenant): Promise<string> {
  // Check if tenant already exists
  const { data: existing, error: selectError } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', tenant.slug)
    .maybeSingle()

  if (selectError && selectError.code !== 'PGRST116') { // PGRST116 = no rows returned
    throw selectError
  }

  if (existing) {
    console.log(`   Tenant ${tenant.slug} already exists, using existing ID (${existing.id})`)
    return existing.id
  }

  const { data, error } = await supabase
    .from('tenants')
    .insert({
      name: tenant.name,
      slug: tenant.slug,
      owner_email: tenant.ownerEmail,
      status: 'active',
      onboarding_completed: true,
      onboarding_step: 'completed'
    })
    .select('id')
    .single()

  if (error) {
    // If tenant was created by another process, try to fetch it
    const { data: checkTenant } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', tenant.slug)
      .maybeSingle()
    
    if (checkTenant) {
      console.log(`   Tenant ${tenant.slug} found after error, using existing ID (${checkTenant.id})`)
      return checkTenant.id
    }
    throw error
  }

  if (!data) {
    throw new Error(`Failed to create tenant ${tenant.slug}`)
  }

  return data.id
}

/**
 * Create tenant member entry
 */
async function createTenantMember(tenantId: string, userId: string, role: 'owner' | 'admin' | 'staff'): Promise<void> {
  // Check if member already exists
  const { data: existing } = await supabase
    .from('tenant_members')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)
    .single()

  if (existing) {
    console.log(`   Tenant member already exists for user ${userId} in tenant ${tenantId}`)
    return
  }

  const { error } = await supabase
    .from('tenant_members')
    .insert({
      tenant_id: tenantId,
      user_id: userId,
      role
    })

  if (error) {
    throw error
  }
}

/**
 * Seed tenant with test data
 */
async function seedTenant(tenantId: string, tenantSlug: string): Promise<void> {
  // Create a menu category
  const { data: category, error: categoryError } = await supabase
    .from('menu_categories')
    .insert({
      tenant_id: tenantId,
      name: `${tenantSlug} Category`,
      is_active: true,
      sort_order: 1
    })
    .select('id')
    .single()

  if (categoryError && !categoryError.message.includes('duplicate')) {
    throw categoryError
  }

  const categoryId = category?.id

  // Create menu items
  if (categoryId) {
    const menuItems = [
      {
        tenant_id: tenantId,
        category_id: categoryId,
        name: `${tenantSlug} Item 1`,
        description: 'Test menu item 1',
        price: 10.00,
        is_available: true,
        sort_order: 1
      },
      {
        tenant_id: tenantId,
        category_id: categoryId,
        name: `${tenantSlug} Item 2`,
        description: 'Test menu item 2',
        price: 15.00,
        is_available: true,
        sort_order: 2
      }
    ]

    const { error: itemsError } = await supabase
      .from('menu_items')
      .upsert(menuItems, { onConflict: 'id' })

    if (itemsError && !itemsError.message.includes('duplicate')) {
      console.warn(`   Warning: Could not create menu items for ${tenantSlug}:`, itemsError.message)
    }
  }

  // Create a test order
  const orderNumber = `ORD-${tenantSlug.toUpperCase()}-001`
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      tenant_id: tenantId,
      order_number: orderNumber,
      customer_name: 'Test Customer',
      customer_phone: '1234567890',
      fulfillment_type: 'pickup',
      subtotal: 25.00,
      total: 25.00,
      status: 'new',
      payment_status: 'unpaid'
    })
    .select('id')
    .single()

  if (orderError && !orderError.message.includes('duplicate')) {
    console.warn(`   Warning: Could not create order for ${tenantSlug}:`, orderError.message)
  }
}

/**
 * Main setup function
 */
async function setupTestSandbox() {
  console.log('🧪 Setting up test sandbox...\n')
  console.log(`Supabase URL: ${SUPABASE_URL}\n`)

  try {
    // Step 1: Create test users
    console.log('Step 1: Creating test users...')
    for (const [key, user] of Object.entries(testUsers)) {
      try {
        const userId = await createUser(user.email, user.password)
        user.userId = userId
        console.log(`   ✅ Created user ${key}: ${user.email} (${userId})`)
      } catch (error: any) {
        console.error(`   ❌ Failed to create user ${key}:`, error.message)
        throw error
      }
    }
    console.log('')

    // Step 2: Create test tenants
    console.log('Step 2: Creating test tenants...')
    for (const [key, tenant] of Object.entries(testTenants)) {
      try {
        const tenantId = await createTenant(tenant)
        tenant.tenantId = tenantId
        console.log(`   ✅ Created tenant ${key}: ${tenant.slug} (${tenantId})`)
      } catch (error: any) {
        console.error(`   ❌ Failed to create tenant ${key}:`, error.message)
        throw error
      }
    }
    console.log('')

    // Step 3: Create tenant members
    console.log('Step 3: Creating tenant members...')
    
    // Owner A -> Tenant A (owner role)
    if (testUsers.owner_a.userId && testTenants.tenant_a.tenantId) {
      await createTenantMember(testTenants.tenant_a.tenantId, testUsers.owner_a.userId, 'owner')
      console.log(`   ✅ Added owner_a as owner of tenant_a`)
    }

    // Staff A -> Tenant A (staff role)
    if (testUsers.staff_a.userId && testTenants.tenant_a.tenantId) {
      await createTenantMember(testTenants.tenant_a.tenantId, testUsers.staff_a.userId, 'staff')
      console.log(`   ✅ Added staff_a as staff of tenant_a`)
    }

    // Owner B -> Tenant B (owner role)
    if (testUsers.owner_b.userId && testTenants.tenant_b.tenantId) {
      await createTenantMember(testTenants.tenant_b.tenantId, testUsers.owner_b.userId, 'owner')
      console.log(`   ✅ Added owner_b as owner of tenant_b`)
    }

    // Random user has no tenant membership (for access denial tests)
    console.log(`   ℹ️  random_user has no tenant membership (for access denial tests)`)
    console.log('')

    // Step 4: Seed tenants with test data
    console.log('Step 4: Seeding tenants with test data...')
    if (testTenants.tenant_a.tenantId) {
      await seedTenant(testTenants.tenant_a.tenantId, 'tenant-a')
      console.log(`   ✅ Seeded tenant_a`)
    }
    if (testTenants.tenant_b.tenantId) {
      await seedTenant(testTenants.tenant_b.tenantId, 'tenant-b')
      console.log(`   ✅ Seeded tenant_b`)
    }
    console.log('')

    // Step 5: Print summary
    console.log('='.repeat(60))
    console.log('Test Sandbox Setup Complete!')
    console.log('='.repeat(60))
    console.log('\nTenant IDs:')
    console.log(`  tenant_a: ${testTenants.tenant_a.tenantId}`)
    console.log(`  tenant_b: ${testTenants.tenant_b.tenantId}`)
    console.log('\nUser IDs:')
    for (const [key, user] of Object.entries(testUsers)) {
      console.log(`  ${key}: ${user.userId} (${user.email})`)
    }
    console.log('\nTest User Credentials:')
    for (const [key, user] of Object.entries(testUsers)) {
      console.log(`  ${key}:`)
      console.log(`    Email: ${user.email}`)
      console.log(`    Password: ${user.password}`)
    }
    console.log('\n' + '='.repeat(60))
    console.log('✅ Setup complete! You can now run test scripts.')
    console.log('='.repeat(60))

  } catch (error: any) {
    console.error('\n❌ Setup failed:', error.message)
    console.error(error)
    process.exit(1)
  }
}

// Run setup
setupTestSandbox().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})

