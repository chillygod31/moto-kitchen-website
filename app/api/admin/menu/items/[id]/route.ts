import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getAdminTenantId } from '@/lib/admin-auth'

/**
 * GET /api/admin/menu/items/[id]
 * Get a single menu item (admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerClient()
    const tenantId = await getAdminTenantId(request)
    const { id } = await params

    const { data: menuItem, error } = await supabase
      .from('menu_items')
      .select('*, menu_categories(name)')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()

    if (error || !menuItem) {
      return NextResponse.json(
        { message: 'Menu item not found', error: error?.message },
        { status: 404 }
      )
    }

    return NextResponse.json(menuItem)
  } catch (error: any) {
    console.error('Error in GET /api/admin/menu/items/[id]:', error)
    
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
  try {
    const supabase = createServerClient()
    const tenantId = await getAdminTenantId(request)
    const { id } = await params
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
      console.error('Error updating menu item:', error)
      return NextResponse.json(
        { message: 'Failed to update menu item', error: error.message },
        { status: 500 }
      )
    }

    if (!menuItem) {
      return NextResponse.json(
        { message: 'Menu item not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(menuItem)
  } catch (error: any) {
    console.error('Error in PATCH /api/admin/menu/items/[id]:', error)
    
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
  try {
    const supabase = createServerClient()
    const tenantId = await getAdminTenantId(request)
    const { id } = await params

    // Soft delete by setting is_available to false
    const { data: menuItem, error } = await supabase
      .from('menu_items')
      .update({ is_available: false })
      .eq('id', id)
      .eq('tenant_id', tenantId) // Ensure tenant isolation
      .select()
      .single()

    if (error) {
      console.error('Error deleting menu item:', error)
      return NextResponse.json(
        { message: 'Failed to delete menu item', error: error.message },
        { status: 500 }
      )
    }

    if (!menuItem) {
      return NextResponse.json(
        { message: 'Menu item not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, menuItem })
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/menu/items/[id]:', error)
    
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

