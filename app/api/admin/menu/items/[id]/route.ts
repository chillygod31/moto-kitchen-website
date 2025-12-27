import { NextRequest, NextResponse } from 'next/server'
import { createServerAuthClient } from '@/lib/supabase/server-auth'
import { getAdminTenantId } from '@/lib/auth/server-admin'
import { verifyCsrfToken } from '@/lib/csrf'
import { logger, getTenantContextFromHeaders } from '@/lib/logging'
import { captureException } from '@/lib/error-tracking'

/**
 * GET /api/admin/menu/items/[id]
 * Get a single menu item (admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = getTenantContextFromHeaders(request.headers)
  const { id } = await params
  logger.api.request('GET', `/api/admin/menu/items/${id}`, context)
  
  try {
    // Use JWT-based client so RLS policies apply
    const supabase = await createServerAuthClient()
    const tenantId = await getAdminTenantId(request)

    const { data: menuItem, error } = await supabase
      .from('menu_items')
      .select('*, menu_categories(name)')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()

    if (error || !menuItem) {
      logger.api.error('GET', `/api/admin/menu/items/${id}`, error as Error, { ...context, tenantId, menuItemId: id })
      if (error) captureException(error as Error, { ...context, tenantId, menuItemId: id })
      return NextResponse.json(
        { message: 'Menu item not found', error: error?.message },
        { status: 404 }
      )
    }

    logger.info('Menu item fetched successfully', { ...context, tenantId, menuItemId: id })
    return NextResponse.json(menuItem)
  } catch (error: any) {
    logger.api.error('GET', `/api/admin/menu/items/${id}`, error, context)
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
 * PATCH /api/admin/menu/items/[id]
 * Update a menu item (admin only)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = getTenantContextFromHeaders(request.headers)
  const { id } = await params
  logger.api.request('PATCH', `/api/admin/menu/items/${id}`, context)
  
  // Verify CSRF token
  const isValidCsrf = await verifyCsrfToken(request)
  if (!isValidCsrf) {
    logger.warn('CSRF token missing or invalid', { ...context, path: `/api/admin/menu/items/${id}` })
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

    // Validate category belongs to tenant if provided
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

    // Build update object
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (price !== undefined) updateData.price = price
    if (category_id !== undefined) updateData.category_id = category_id
    if (image_url !== undefined) updateData.image_url = image_url
    if (dietary_tags !== undefined) updateData.dietary_tags = dietary_tags
    if (is_available !== undefined) updateData.is_available = is_available
    if (sort_order !== undefined) updateData.sort_order = sort_order

    // Update menu item
    const { data: menuItem, error } = await supabase
      .from('menu_items')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', tenantId) // Ensure tenant isolation
      .select('*, menu_categories(name)')
      .single()

    if (error) {
      logger.api.error('PATCH', `/api/admin/menu/items/${id}`, error as Error, { ...context, tenantId, menuItemId: id })
      captureException(error as Error, { ...context, tenantId, menuItemId: id })
      return NextResponse.json(
        { message: 'Failed to update menu item', error: error.message },
        { status: 500 }
      )
    }

    if (!menuItem) {
      logger.warn('Menu item not found after update', { ...context, tenantId, menuItemId: id })
      return NextResponse.json(
        { message: 'Menu item not found' },
        { status: 404 }
      )
    }

    logger.info('Menu item updated successfully', { ...context, tenantId, menuItemId: id })
    return NextResponse.json(menuItem)
  } catch (error: any) {
    logger.api.error('PATCH', `/api/admin/menu/items/${id}`, error, context)
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
 * DELETE /api/admin/menu/items/[id]
 * Delete a menu item (admin only)
 * Actually soft-deletes by setting is_available to false
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = getTenantContextFromHeaders(request.headers)
  const { id } = await params
  logger.api.request('DELETE', `/api/admin/menu/items/${id}`, context)
  
  // Verify CSRF token
  const isValidCsrf = await verifyCsrfToken(request)
  if (!isValidCsrf) {
    logger.warn('CSRF token missing or invalid', { ...context, path: `/api/admin/menu/items/${id}` })
    return NextResponse.json(
      { message: 'CSRF token missing or invalid' },
      { status: 403 }
    )
  }

  try {
    // Use JWT-based client so RLS policies apply
    const supabase = await createServerAuthClient()
    const tenantId = await getAdminTenantId(request)

    // Soft delete by setting is_available to false
    const { data: menuItem, error } = await supabase
      .from('menu_items')
      .update({ is_available: false })
      .eq('id', id)
      .eq('tenant_id', tenantId) // Ensure tenant isolation
      .select()
      .single()

    if (error) {
      logger.api.error('DELETE', `/api/admin/menu/items/${id}`, error as Error, { ...context, tenantId, menuItemId: id })
      captureException(error as Error, { ...context, tenantId, menuItemId: id })
      return NextResponse.json(
        { message: 'Failed to delete menu item', error: error.message },
        { status: 500 }
      )
    }

    if (!menuItem) {
      logger.warn('Menu item not found for deletion', { ...context, tenantId, menuItemId: id })
      return NextResponse.json(
        { message: 'Menu item not found' },
        { status: 404 }
      )
    }

    logger.info('Menu item deleted successfully', { ...context, tenantId, menuItemId: id })
    return NextResponse.json({ success: true, menuItem })
  } catch (error: any) {
    logger.api.error('DELETE', `/api/admin/menu/items/${id}`, error, context)
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

