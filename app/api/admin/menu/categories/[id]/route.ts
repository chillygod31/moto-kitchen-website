import { NextRequest, NextResponse } from 'next/server'
import { createServerAuthClient } from '@/lib/supabase/server-auth'
import { getAdminTenantId } from '@/lib/auth/server-admin'
import { logger, getTenantContextFromHeaders } from '@/lib/logging'
import { captureException } from '@/lib/error-tracking'

type RouteParams = { params: Promise<{ id: string }> }

/**
 * PATCH /api/admin/menu/categories/[id]
 * Update a menu category
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const context = getTenantContextFromHeaders(request.headers)
  logger.api.request('PATCH', `/api/admin/menu/categories/${id}`, context)

  try {
    const supabase = await createServerAuthClient()
    const tenantId = await getAdminTenantId(request)
    const body = await request.json()

    const { name, description, is_active, sort_order } = body

    const updates: Record<string, unknown> = {}
    if (name !== undefined) updates.name = name
    if (description !== undefined) updates.description = description
    if (is_active !== undefined) updates.is_active = is_active
    if (sort_order !== undefined) updates.sort_order = sort_order

    const { data: category, error } = await supabase
      .from('menu_categories')
      .update(updates)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single()

    if (error) {
      logger.api.error('PATCH', `/api/admin/menu/categories/${id}`, error as Error, { ...context, tenantId })
      captureException(error as Error, { ...context, tenantId })
      return NextResponse.json(
        { message: 'Failed to update category', error: error.message },
        { status: 500 }
      )
    }

    logger.info('Menu category updated successfully', { ...context, tenantId, categoryId: id })
    return NextResponse.json(category)
  } catch (error: any) {
    logger.api.error('PATCH', `/api/admin/menu/categories/${id}`, error, context)
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
 * DELETE /api/admin/menu/categories/[id]
 * Delete a menu category
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const { id } = await params
  const context = getTenantContextFromHeaders(request.headers)
  logger.api.request('DELETE', `/api/admin/menu/categories/${id}`, context)

  try {
    const supabase = await createServerAuthClient()
    const tenantId = await getAdminTenantId(request)

    // First, set category_id to null for all menu items in this category
    await supabase
      .from('menu_items')
      .update({ category_id: null })
      .eq('category_id', id)
      .eq('tenant_id', tenantId)

    // Then delete the category
    const { error } = await supabase
      .from('menu_categories')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId)

    if (error) {
      logger.api.error('DELETE', `/api/admin/menu/categories/${id}`, error as Error, { ...context, tenantId })
      captureException(error as Error, { ...context, tenantId })
      return NextResponse.json(
        { message: 'Failed to delete category', error: error.message },
        { status: 500 }
      )
    }

    logger.info('Menu category deleted successfully', { ...context, tenantId, categoryId: id })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    logger.api.error('DELETE', `/api/admin/menu/categories/${id}`, error, context)
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
