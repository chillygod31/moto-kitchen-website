/**
 * Test setup and utilities
 * 
 * Provides test setup, Supabase test client, and helper functions
 * for testing the application.
 */

import { createClient } from '@supabase/supabase-js'

/**
 * Create a test Supabase client
 * Uses test database credentials from environment variables
 */
export function createTestClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase test credentials')
  }
  
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * Clean up test data
 * 
 * @param supabase - Supabase client
 * @param table - Table name
 * @param ids - Array of IDs to delete
 */
export async function cleanupTestData(
  supabase: ReturnType<typeof createTestClient>,
  table: string,
  ids: string[]
) {
  if (ids.length === 0) return
  
  await supabase
    .from(table)
    .delete()
    .in('id', ids)
}

/**
 * Create a test tenant
 * 
 * @param supabase - Supabase client
 * @param slug - Tenant slug (default: 'test-tenant')
 */
export async function createTestTenant(
  supabase: ReturnType<typeof createTestClient>,
  slug: string = 'test-tenant'
) {
  const { data, error } = await supabase
    .from('tenants')
    .insert({
      name: 'Test Tenant',
      slug,
      owner_email: 'test@example.com',
      status: 'active',
    })
    .select()
    .single()
  
  if (error) {
    throw new Error(`Failed to create test tenant: ${error.message}`)
  }
  
  return data
}

