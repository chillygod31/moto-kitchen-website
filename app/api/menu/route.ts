import { NextRequest, NextResponse } from 'next/server'
import { createServerAdminClient } from '@/lib/supabase/server-admin'
import { getTenantId } from '@/lib/tenant'
import { logger, getTenantContextFromHeaders } from '@/lib/logging'
import { captureException } from '@/lib/error-tracking'

/**
 * GET /api/menu
 * Get all menu items for the tenant (default: moto-kitchen)
 * 
 * NOTE: Uses service role client temporarily because RLS blocks public SELECT.
 * Tenant isolation is enforced via .eq('tenant_id', tenantId) filtering.
 * TODO: Future - use proper tenant-scoped access when implemented.
 */
export async function GET(request: NextRequest) {
  const context = getTenantContextFromHeaders(request.headers)
  logger.api.request('GET', '/api/menu', context)
  
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
      logger.warn('Error fetching categories', { ...context, tenantId, error: categoriesError.message })
    }

    // Get menu items (only published and available items for public menu)
    const { data: menuItems, error: itemsError } = await supabase
      .from('menu_items')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_available', true)
      .eq('is_published', true)
      .order('sort_order', { ascending: true })

    if (itemsError) {
      logger.api.error('GET', '/api/menu', itemsError as Error, { ...context, tenantId })
      captureException(itemsError as Error, { ...context, tenantId })
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

    logger.info('Menu fetched successfully', { ...context, tenantId, categoriesCount: menuByCategory.length, itemsCount: menuItems?.length || 0 })
    return NextResponse.json({
      categories: menuByCategory,
      allItems: menuItems || [],
    })
  } catch (error: any) {
    logger.api.error('GET', '/api/menu', error, context)
    captureException(error, context)
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}

