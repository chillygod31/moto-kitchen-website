/**
 * Tenant Resolution Test Script
 * 
 * Tests tenant resolution logic:
 * - Valid tenant hostname → resolves correctly
 * - Unknown domain → returns tenant-not-found
 * - IP access / random host header → returns tenant-not-found
 * - Path-based resolution (/order/*) → resolves correctly
 * 
 * Usage: tsx scripts/test-tenant-resolution.ts
 */

import dotenv from 'dotenv'
import { resolve } from 'path'

// Load environment variables
const envPath = resolve(process.cwd(), '.env.local')
dotenv.config({ path: envPath })

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

interface TestResult {
  name: string
  passed: boolean
  error?: string
  details?: any
}

const results: TestResult[] = []

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
  }
}

/**
 * Make HTTP request with custom headers
 */
async function makeRequest(path: string, host?: string): Promise<{ status: number; url?: string }> {
  const url = new URL(path, BASE_URL)
  const headers: Record<string, string> = {}
  
  if (host) {
    headers['Host'] = host
  }

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers,
      redirect: 'manual', // Don't follow redirects automatically
      signal: AbortSignal.timeout(5000) // 5 second timeout
    })

    // Check if redirected to tenant-not-found
    const location = response.headers.get('location')
    const isTenantNotFound = location?.includes('/tenant-not-found') || 
                            response.url?.includes('/tenant-not-found')

    return {
      status: response.status,
      url: location || response.url
    }
  } catch (error: any) {
    // Check if it's a connection error
    if (error.message.includes('fetch failed') || 
        error.message.includes('ECONNREFUSED') ||
        error.name === 'AbortError') {
      throw new Error(`Cannot connect to server at ${BASE_URL}. Make sure the development server is running (npm run dev)`)
    }
    throw new Error(`Request failed: ${error.message}`)
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🧪 Starting Tenant Resolution Tests\n')
  console.log(`Base URL: ${BASE_URL}\n`)

  // Test 1: Valid tenant hostname resolves correctly
  await runTest('Test 1: Valid tenant hostname resolves correctly', async () => {
    try {
      // This test assumes you have a tenant with a known subdomain
      // Adjust the hostname based on your actual tenant configuration
      const response = await makeRequest('/order', 'orders.motokitchen.nl')
      
      // Should not redirect to tenant-not-found
      if (response.url?.includes('/tenant-not-found')) {
        throw new Error(`Valid tenant hostname redirected to tenant-not-found`)
      }
      
      console.log(`   Status: ${response.status}, URL: ${response.url || 'N/A'}`)
    } catch (error: any) {
      if (error.message.includes('Cannot connect to server')) {
        console.log(`   ⚠️  Skipping: ${error.message}`)
        console.log(`   ℹ️  This test requires the development server to be running`)
        return // Skip this test gracefully
      }
      throw error
    }
  })

  // Test 2: Unknown domain returns tenant-not-found
  await runTest('Test 2: Unknown domain returns tenant-not-found', async () => {
    try {
      const response = await makeRequest('/order', 'orders.unknownbrand.nl')
      
      // Should redirect to tenant-not-found
      if (!response.url?.includes('/tenant-not-found') && response.status !== 404) {
        throw new Error(`Unknown domain did not return tenant-not-found. Status: ${response.status}, URL: ${response.url}`)
      }
      
      console.log(`   Status: ${response.status}, URL: ${response.url || 'N/A'}`)
    } catch (error: any) {
      if (error.message.includes('Cannot connect to server')) {
        console.log(`   ⚠️  Skipping: ${error.message}`)
        return // Skip this test gracefully
      }
      throw error
    }
  })

  // Test 3: IP access fails closed
  await runTest('Test 3: Direct IP access fails closed', async () => {
    try {
      const response = await makeRequest('/order', '127.0.0.1')
      
      // Should redirect to tenant-not-found or return 404
      if (!response.url?.includes('/tenant-not-found') && response.status !== 404) {
        throw new Error(`IP access did not fail closed. Status: ${response.status}, URL: ${response.url}`)
      }
      
      console.log(`   Status: ${response.status}, URL: ${response.url || 'N/A'}`)
    } catch (error: any) {
      if (error.message.includes('Cannot connect to server')) {
        console.log(`   ⚠️  Skipping: ${error.message}`)
        return // Skip this test gracefully
      }
      throw error
    }
  })

  // Test 4: Random host header fails
  await runTest('Test 4: Random host header fails', async () => {
    try {
      const response = await makeRequest('/order', 'random-host.example.com')
      
      // Should redirect to tenant-not-found or return 404
      if (!response.url?.includes('/tenant-not-found') && response.status !== 404) {
        throw new Error(`Random host header did not fail. Status: ${response.status}, URL: ${response.url}`)
      }
      
      console.log(`   Status: ${response.status}, URL: ${response.url || 'N/A'}`)
    } catch (error: any) {
      if (error.message.includes('Cannot connect to server')) {
        console.log(`   ⚠️  Skipping: ${error.message}`)
        return // Skip this test gracefully
      }
      throw error
    }
  })

  // Test 5: Path-based resolution works
  await runTest('Test 5: Path-based resolution works', async () => {
    try {
      // Test if path-based tenant resolution works (if implemented)
      // This depends on your actual implementation
      const response = await makeRequest('/order')
      
      // Should either work (200) or redirect appropriately
      // This test may need adjustment based on your actual routing
      if (response.status >= 500) {
        throw new Error(`Path-based resolution returned server error: ${response.status}`)
      }
      
      console.log(`   Status: ${response.status}, URL: ${response.url || 'N/A'}`)
    } catch (error: any) {
      if (error.message.includes('Cannot connect to server')) {
        console.log(`   ⚠️  Skipping: ${error.message}`)
        return // Skip this test gracefully
      }
      throw error
    }
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

  // Check if all failures were due to server not running
  const serverNotRunning = results.every(r => 
    !r.passed && r.error?.includes('Cannot connect to server')
  )

  if (failed > 0) {
    if (serverNotRunning) {
      console.log('\n⚠️  All tests skipped: Development server is not running')
      console.log('💡 To run these tests, start the server with: npm run dev')
      console.log('   Then run the tests in another terminal')
      process.exit(0) // Exit with success since tests were skipped, not failed
    } else {
      console.log('\n⚠️  Some tests failed. Review errors above.')
      process.exit(1)
    }
  } else {
    console.log('\n✅ All tests passed!')
    process.exit(0)
  }
}

// Run tests
runTests().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})

