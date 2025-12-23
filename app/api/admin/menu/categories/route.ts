import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getAdminTenantId } from '@/lib/admin-auth'

/**
 * GET /api/admin/menu/categories
 * Get all menu categories for the tenant (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const tenantId = await getAdminTenantId(request)

    const { data: categories, error } = await supabase
      .from('menu_categories')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching categories:', error)
      return NextResponse.json(
        { message: 'Failed to fetch categories', error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(categories || [])
  } catch (error: any) {
    console.error('Error in GET /api/admin/menu/categories:', error)
    
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
  try {
    const supabase = createServerClient()
    const tenantId = await getAdminTenantId(request)

    const body = await request.json()
    const { name, description, is_active, sort_order } = body

    if (!name) {
      return NextResponse.json(
        { message: 'Category name is required' },
        { status: 400 }
      )
    }

    const { data: category, error } = await supabase
      .from('menu_categories')
      .insert({
        tenant_id: tenantId,
        name,
        description: description || null,
        is_active: is_active !== false, // Default to true
        sort_order: sort_order || 0,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating category:', error)
      return NextResponse.json(
        { message: 'Failed to create category', error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(category, { status: 201 })
  } catch (error: any) {
    console.error('Error in POST /api/admin/menu/categories:', error)
    
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

