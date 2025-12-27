import { NextRequest, NextResponse } from 'next/server'
import { createServerAuthClient } from '@/lib/supabase/server-auth'
import { getAdminTenantId } from '@/lib/auth/server-admin'
import { createMenuItemSchema } from '@/lib/validations/menu'
import { verifyCsrfToken } from '@/lib/csrf'
import { logger, getTenantContextFromHeaders } from '@/lib/logging'
import { captureException } from '@/lib/error-tracking'

/**
 * GET /api/admin/menu/items
 * Get all menu items for the tenant (admin only)
 */
export async function GET(request: NextRequest) {
  const context = getTenantContextFromHeaders(request.headers)
  logger.api.request('GET', '/api/admin/menu/items', context)
  
  try {
    // Use JWT-based client so RLS policies apply
    const supabase = await createServerAuthClient()
    const tenantId = await getAdminTenantId(request)

    // Get menu items
    const { data: menuItems, error } = await supabase
      .from('menu_items')
      .select('*, menu_categories(name)')
      .eq('tenant_id', tenantId)
      .order('sort_order', { ascending: true })

    if (error) {
      logger.api.error('GET', '/api/admin/menu/items', error as Error, { ...context, tenantId })
      captureException(error as Error, { ...context, tenantId })
      return NextResponse.json(
        { message: 'Failed to fetch menu items', error: error.message },
        { status: 500 }
      )
    }

    logger.info('Menu items fetched successfully', { ...context, tenantId, count: menuItems?.length || 0 })
    return NextResponse.json(menuItems || [])
  } catch (error: any) {
    logger.api.error('GET', '/api/admin/menu/items', error, context)
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
 * POST /api/admin/menu/items
 * Create a new menu item (admin only)
 */
export async function POST(request: NextRequest) {
  const context = getTenantContextFromHeaders(request.headers)
  logger.api.request('POST', '/api/admin/menu/items', context)
  
  // Verify CSRF token
  const isValidCsrf = await verifyCsrfToken(request)
  if (!isValidCsrf) {
    logger.warn('CSRF token missing or invalid', { ...context, path: '/api/admin/menu/items' })
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
    const {
      name,
      description,
      price,
      category_id,
      image_url,
      dietary_tags,
      is_available,
      sort_order,
    } = body

    // Validation
    if (!name || !price) {
      return NextResponse.json(
        { message: 'Name and price are required' },
        { status: 400 }
      )
    }

    // Validate category belongs to tenant
    if (category_id) {
      const { data: category, error: categoryError } = await supabase
        .from('menu_categories')
        .select('id')
        .eq('id', category_id)
        .eq('tenant_id', tenantId)
        .single()

      if (categoryError || !category) {
        return NextResponse.json(
          { message: 'Invalid category' },
          { status: 400 }
        )
      }
    }

    // Create menu item
    const { data: menuItem, error } = await supabase
      .from('menu_items')
      .insert({
        tenant_id: tenantId,
        name,
        description: description || null,
        price,
        category_id: category_id || null,
        image_url: image_url || null,
        dietary_tags: dietary_tags || [],
        is_available: is_available !== false, // Default to true
        sort_order: sort_order || 0,
      })
      .select()
      .single()

    if (error) {
      logger.api.error('POST', '/api/admin/menu/items', error as Error, { ...context, tenantId })
      captureException(error as Error, { ...context, tenantId })
      return NextResponse.json(
        { message: 'Failed to create menu item', error: error.message },
        { status: 500 }
      )
    }

    logger.info('Menu item created successfully', { ...context, tenantId, menuItemId: menuItem?.id })
    return NextResponse.json(menuItem, { status: 201 })
  } catch (error: any) {
    logger.api.error('POST', '/api/admin/menu/items', error, context)
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

