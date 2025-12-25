/**
 * Phase A Verification Script
 * 
 * Quick verification checks for Phase A implementation
 * Run with: npx tsx scripts/verify-phase-a.ts
 * 
 * Note: This script checks code structure and utilities exist.
 * For full verification (including DB/Runtime checks), see PHASE_A_VERIFICATION.md
 */

import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

// Load environment variables from .env.local if it exists
const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath })
}

async function verifyPhaseA() {
  console.log('🔍 Phase A Verification\n')
  console.log('='.repeat(50))
  
  let passed = 0
  let failed = 0
  let warnings = 0

  // 1. Verify Supabase Client Split (Code Structure)
  console.log('\n1. Supabase Client Split')
  console.log('-'.repeat(50))
  try {
    // Check if files exist and export the right functions
    const serverAppPath = path.join(process.cwd(), 'lib/supabase/server-app.ts')
    const serverAdminPath = path.join(process.cwd(), 'lib/supabase/server-admin.ts')
    
    if (fs.existsSync(serverAppPath) && fs.existsSync(serverAdminPath)) {
      const serverAppContent = fs.readFileSync(serverAppPath, 'utf-8')
      const serverAdminContent = fs.readFileSync(serverAdminPath, 'utf-8')
      
      if (serverAppContent.includes('createServerAppClient') && 
          serverAppContent.includes('NEXT_PUBLIC_SUPABASE_ANON_KEY')) {
        console.log('✅ server-app.ts exists with anon key client')
      } else {
        throw new Error('server-app.ts missing createServerAppClient or anon key')
      }
      
      if (serverAdminContent.includes('createServerAdminClient') && 
          serverAdminContent.includes('SUPABASE_SERVICE_ROLE_KEY')) {
        console.log('✅ server-admin.ts exists with service role client')
      } else {
        throw new Error('server-admin.ts missing createServerAdminClient or service role key')
      }
      
      // Try to actually create clients if env vars are available
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        const { createServerAppClient } = await import('../lib/supabase/server-app')
        createServerAppClient()
        console.log('✅ Anon client can be instantiated (env vars present)')
      } else {
        console.log('⚠️  Env vars not loaded - skipping client instantiation test')
        console.log('   (This is OK - clients will work at runtime with proper env vars)')
      }
      
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const { createServerAdminClient } = await import('../lib/supabase/server-admin')
        createServerAdminClient()
        console.log('✅ Admin client can be instantiated (env vars present)')
      } else {
        console.log('⚠️  Service role key not loaded - skipping admin client test')
        console.log('   (This is OK - clients will work at runtime with proper env vars)')
      }
      
      passed++
    } else {
      throw new Error('Client files do not exist')
    }
  } catch (error: any) {
    console.log('❌ Client split verification failed:', error.message)
    failed++
  }

  // 2. Verify Tenant Resolution (Code Structure)
  console.log('\n2. Tenant Resolution')
  console.log('-'.repeat(50))
  try {
    // Check if tenant.ts exists and has the right functions
    const tenantPath = path.join(process.cwd(), 'lib/tenant.ts')
    if (fs.existsSync(tenantPath)) {
      const tenantContent = fs.readFileSync(tenantPath, 'utf-8')
      
      if (tenantContent.includes('getTenantId') && 
          tenantContent.includes('getTenantSlug') &&
          tenantContent.includes('x-tenant-id')) {
        console.log('✅ Tenant resolution functions exist')
        console.log('✅ Middleware header support detected')
      } else {
        throw new Error('Tenant resolution functions missing')
      }
      
      // Try to resolve tenant if env vars are available
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const { getTenantId } = await import('../lib/tenant')
          const tenantId = await getTenantId('moto-kitchen')
          if (tenantId) {
            console.log('✅ Tenant resolution works (resolved:', tenantId.substring(0, 8) + '...)')
          }
        } catch (error: any) {
          console.log('⚠️  Tenant resolution test skipped (DB not accessible or tenant missing)')
          console.log('   Error:', error.message.substring(0, 100))
        }
      } else {
        console.log('⚠️  Env vars not loaded - skipping tenant resolution test')
        console.log('   (This is OK - will work at runtime with proper env vars)')
      }
      
      passed++
    } else {
      throw new Error('lib/tenant.ts does not exist')
    }
  } catch (error: any) {
    console.log('❌ Tenant resolution verification failed:', error.message)
    failed++
  }

  // 3. Verify Validation Schemas
  console.log('\n3. Zod Validation Schemas')
  console.log('-'.repeat(50))
  try {
    const { createOrderSchema } = await import('../lib/validations/orders')
    const { createMenuItemSchema } = await import('../lib/validations/menu')
    const { updateOrderStatusSchema } = await import('../lib/validations/admin')
    console.log('✅ Validation schemas exist')
    passed++
  } catch (error: any) {
    console.log('❌ Validation schemas missing:', error.message)
    failed++
  }

  // 4. Verify Auth Helpers
  console.log('\n4. Auth Helpers')
  console.log('-'.repeat(50))
  try {
    const { getServerUser } = await import('../lib/auth/server')
    const { getClientUser } = await import('../lib/auth/client')
    const { hasRole } = await import('../lib/auth/rbac')
    const { hasPermission } = await import('../lib/auth/permissions')
    console.log('✅ Auth helpers exist')
    passed++
  } catch (error: any) {
    console.log('❌ Auth helpers missing:', error.message)
    failed++
  }

  // 5. Verify Logging
  console.log('\n5. Logging Infrastructure')
  console.log('-'.repeat(50))
  try {
    const { logger } = await import('../lib/logging')
    logger.info('Test log message', { test: true })
    console.log('✅ Logging utility works')
    passed++
  } catch (error: any) {
    console.log('❌ Logging utility missing:', error.message)
    failed++
  }

  // 6. Verify Rate Limiting
  console.log('\n6. Rate Limiting')
  console.log('-'.repeat(50))
  try {
    const { checkRateLimit, rateLimitConfigs } = await import('../lib/rate-limit')
    console.log('✅ Rate limiting utility exists')
    console.log('   Configs:', Object.keys(rateLimitConfigs))
    passed++
  } catch (error: any) {
    console.log('❌ Rate limiting missing:', error.message)
    failed++
  }

  // 7. Verify CSRF Protection
  console.log('\n7. CSRF Protection')
  console.log('-'.repeat(50))
  try {
    const { getCsrfToken, verifyCsrfToken } = await import('../lib/csrf')
    console.log('✅ CSRF protection utility exists')
    passed++
  } catch (error: any) {
    console.log('❌ CSRF protection missing:', error.message)
    failed++
  }

  // 8. Verify Error Tracking
  console.log('\n8. Error Tracking')
  console.log('-'.repeat(50))
  try {
    const { captureException, captureMessage } = await import('../lib/error-tracking')
    console.log('✅ Error tracking utility exists')
    passed++
  } catch (error: any) {
    console.log('❌ Error tracking missing:', error.message)
    failed++
  }

  // 9. Verify UI Components
  console.log('\n9. UX Components')
  console.log('-'.repeat(50))
  try {
    // Check if files exist
    const fs = await import('fs')
    const path = await import('path')
    
    const components = [
      'components/ui/LoadingSpinner.tsx',
      'components/ui/Skeleton.tsx',
      'components/ErrorBoundary.tsx',
      'components/ErrorMessage.tsx',
      'app/error.tsx',
    ]
    
    let allExist = true
    for (const comp of components) {
      const filePath = path.join(process.cwd(), comp)
      if (!fs.existsSync(filePath)) {
        console.log(`❌ Missing: ${comp}`)
        allExist = false
      }
    }
    
    if (allExist) {
      console.log('✅ All UX components exist')
      passed++
    } else {
      failed++
    }
  } catch (error: any) {
    console.log('⚠️  Could not verify components:', error.message)
    warnings++
  }

  // Manual Verification Reminders
  console.log('\n10. Manual Verification Required')
  console.log('-'.repeat(50))
  console.log('⚠️  The following items require manual testing:')
  console.log('   - RLS policies (cross-tenant access blocked)')
  console.log('   - Tenant resolution (unknown domains → tenant-not-found)')
  console.log('   - Rate limiting (429 responses on limit exceed)')
  console.log('   - CSRF protection (403 on missing/invalid token)')
  console.log('   - Request ID in headers and logs')
  console.log('   - Admin route protection (401 without auth)')
  console.log('   See PHASE_A_VERIFICATION.md for detailed steps')

  // Summary
  console.log('\n' + '='.repeat(50))
  console.log('SUMMARY')
  console.log('='.repeat(50))
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`⚠️  Warnings: ${warnings}`)
  
  console.log('\n📝 NOTE: This script verifies code structure and utilities exist.')
  console.log('   For runtime verification (DB, RLS, rate limits, etc.), see:')
  console.log('   PHASE_A_VERIFICATION.md')
  
  if (failed === 0) {
    console.log('\n✅ All code structure checks passed!')
    console.log('⚠️  Next: Complete manual verification checklist in PHASE_A_VERIFICATION.md')
    process.exit(0)
  } else {
    console.log('\n❌ Some checks failed. Please review and fix issues.')
    console.log('   Failed checks indicate missing code/files that need to be fixed.')
    process.exit(1)
  }
}

verifyPhaseA().catch((error) => {
  console.error('Verification script error:', error)
  process.exit(1)
})

