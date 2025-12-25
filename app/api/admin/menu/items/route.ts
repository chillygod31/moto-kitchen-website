import { NextRequest, NextResponse } from 'next/server'
import { createServerAuthClient } from '@/lib/supabase/server-auth'
import { getAdminTenantId } from '@/lib/auth/server-admin'
import { createMenuItemSchema } from '@/lib/validations/menu'
import { verifyCsrfToken } from '@/lib/csrf'

/**
 * GET /api/admin/menu/items
 * Get all menu items for the tenant (admin only)
 */
export async function GET(request: NextRequest) {
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
      console.error('Error fetching menu items:', error)
      return NextResponse.json(
        { message: 'Failed to fetch menu items', error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(menuItems || [])
  } catch (error: any) {
    console.error('Error in GET /api/admin/menu/items:', error)
    
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
  // Verify CSRF token
  const isValidCsrf = await verifyCsrfToken(request)
  if (!isValidCsrf) {
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
      console.error('Error creating menu item:', error)
      return NextResponse.json(
        { message: 'Failed to create menu item', error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(menuItem, { status: 201 })
  } catch (error: any) {
    console.error('Error in POST /api/admin/menu/items:', error)
    
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

