import { NextRequest, NextResponse } from 'next/server'
import { createServerAdminClient } from '@/lib/supabase/server-admin'
import { getTenantId } from '@/lib/tenant'

/**
 * GET /api/menu
 * Get all menu items for the tenant (default: moto-kitchen)
 * 
 * NOTE: Uses service role client temporarily because RLS blocks public SELECT.
 * Tenant isolation is enforced via .eq('tenant_id', tenantId) filtering.
 * TODO: Future - use proper tenant-scoped access when implemented.
 */
export async function GET(request: NextRequest) {
  try {
    // Temporary: Use service role because RLS blocks anon SELECT
    // Tenant isolation enforced via app-level filtering (.eq('tenant_id', ...))
    const supabase = createServerAdminClient()
    
    // For customer-facing menu, use auto-detection
    // Admin endpoints should use getAdminTenantId
    const tenantId = await getTenantId()

    // Get menu categories
    const { data: categories, error: categoriesError } = await supabase
      .from('menu_categories')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError)
    }

    // Get menu items
    const { data: menuItems, error: itemsError } = await supabase
      .from('menu_items')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_available', true)
      .order('sort_order', { ascending: true })

    if (itemsError) {
      console.error('Error fetching menu items:', itemsError)
      return NextResponse.json(
        { message: 'Failed to fetch menu items', error: itemsError.message },
        { status: 500 }
      )
    }

    // Group items by category
    const menuByCategory = (categories || []).map((category) => ({
      ...category,
      items: (menuItems || []).filter(
        (item) => item.category_id === category.id
      ),
    }))

    // Items without category
    const uncategorizedItems = (menuItems || []).filter(
      (item) => !item.category_id
    )

    if (uncategorizedItems.length > 0) {
      menuByCategory.push({
        id: 'uncategorized',
        name: 'Other',
        items: uncategorizedItems,
      })
    }

    return NextResponse.json({
      categories: menuByCategory,
      allItems: menuItems || [],
    })
  } catch (error: any) {
    console.error('Error in GET /api/menu:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}

