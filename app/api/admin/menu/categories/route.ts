import { NextRequest, NextResponse } from 'next/server'
import { createServerAuthClient } from '@/lib/supabase/server-auth'
import { getAdminTenantId } from '@/lib/auth/server-admin'
import { createMenuCategorySchema } from '@/lib/validations/menu'
import { verifyCsrfToken } from '@/lib/csrf'
import { logger, getTenantContextFromHeaders } from '@/lib/logging'
import { captureException } from '@/lib/error-tracking'

/**
 * GET /api/admin/menu/categories
 * Get all menu categories for the tenant (admin only)
 */
export async function GET(request: NextRequest) {
  const context = getTenantContextFromHeaders(request.headers)
  logger.api.request('GET', '/api/admin/menu/categories', context)
  
  try {
    // Use JWT-based client so RLS policies apply
    const supabase = await createServerAuthClient()
    const tenantId = await getAdminTenantId(request)

    const { data: categories, error } = await supabase
      .from('menu_categories')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('sort_order', { ascending: true })

    if (error) {
      logger.api.error('GET', '/api/admin/menu/categories', error as Error, { ...context, tenantId })
      captureException(error as Error, { ...context, tenantId })
      return NextResponse.json(
        { message: 'Failed to fetch categories', error: error.message },
        { status: 500 }
      )
    }

    logger.info('Menu categories fetched successfully', { ...context, tenantId, count: categories?.length || 0 })
    return NextResponse.json(categories || [])
  } catch (error: any) {
    logger.api.error('GET', '/api/admin/menu/categories', error, context)
    captureException(error, context)
    
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { message: 'Unauthorized', error: error.message },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/menu/categories
 * Create a new menu category (admin only)
 */
export async function POST(request: NextRequest) {
  const context = getTenantContextFromHeaders(request.headers)
  logger.api.request('POST', '/api/admin/menu/categories', context)
  
  // Verify CSRF token
  const isValidCsrf = await verifyCsrfToken(request)
  if (!isValidCsrf) {
    logger.warn('CSRF token missing or invalid', { ...context, path: '/api/admin/menu/categories' })
    return NextResponse.json(
      { message: 'CSRF token missing or invalid' },
      { status: 403 }
    )
  }

  try {
    // Use JWT-based client so RLS policies apply
    const supabase = await createServerAuthClient()
    const tenantId = await getAdminTenantId(request)

    const body = await request.json()
    
    // Validate request body
    const validationResult = createMenuCategorySchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          message: 'Validation failed', 
          errors: validationResult.error.issues.map(e => ({
            path: e.path.join('.'),
            message: e.message
          }))
        },
        { status: 400 }
      )
    }
    
    const { name, is_active, sort_order } = validationResult.data

    const { data: category, error } = await supabase
      .from('menu_categories')
      .insert({
        tenant_id: tenantId,
        name,
        is_active: is_active !== false, // Default to true
        sort_order: sort_order || 0,
      })
      .select()
      .single()

    if (error) {
      logger.api.error('POST', '/api/admin/menu/categories', error as Error, { ...context, tenantId })
      captureException(error as Error, { ...context, tenantId })
      return NextResponse.json(
        { message: 'Failed to create category', error: error.message },
        { status: 500 }
      )
    }

    logger.info('Menu category created successfully', { ...context, tenantId, categoryId: category?.id })
    return NextResponse.json(category, { status: 201 })
  } catch (error: any) {
    logger.api.error('POST', '/api/admin/menu/categories', error, context)
    captureException(error, context)
    
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json(
        { message: 'Unauthorized', error: error.message },
        { status: 401 }
      )
    }
    
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}

