import { createServerAdminClient } from '@/lib/supabase/server-admin'
import { getTenantId } from '@/lib/tenant'
import MenuClient from './MenuClient'
import { MenuItem, MenuCategory } from '@/types'

// Force dynamic rendering - don't statically generate this page
export const dynamic = 'force-dynamic'
export const revalidate = 0

interface MenuData {
  categories: (MenuCategory & { items: MenuItem[] })[]
  allItems: MenuItem[]
}

async function getBusinessSettings() {
  try {
    // Temporary: Use service role because RLS blocks anon SELECT
    // Tenant isolation enforced via app-level filtering (.eq('tenant_id', ...))
    const supabase = createServerAdminClient()
    const tenantId = await getTenantId()

    const { data: settings } = await supabase
      .from('tenant_business_settings')
      .select('*')
      .eq('tenant_id', tenantId)
      .single()

    return settings || null
  } catch (error) {
    console.error('Error fetching business settings:', error)
    return null
  }
}

async function getMenuData(): Promise<{ data: MenuData | null; error: string | null }> {
  try {
    // Validate environment variables first
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const errorMsg = 'Missing Supabase environment variables. Please check your configuration.'
      console.error('[MenuPage]', errorMsg)
      return {
        data: null,
        error: errorMsg
      }
    }

    // Temporary: Use service role because RLS blocks anon SELECT
    // Tenant isolation enforced via app-level filtering (.eq('tenant_id', ...))
    const supabase = createServerAdminClient()
    
    // Get tenant ID
    let tenantId: string
    try {
      tenantId = await getTenantId('moto-kitchen')
      console.log('[MenuPage] Tenant ID retrieved:', tenantId ? 'Success' : 'Failed')
    } catch (tenantError: any) {
      const errorMsg = `Failed to get tenant: ${tenantError.message}`
      console.error('[MenuPage]', errorMsg, tenantError)
      return {
        data: null,
        error: errorMsg
      }
    }

    // Get menu categories
    const { data: categories, error: categoriesError } = await supabase
      .from('menu_categories')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (categoriesError) {
      console.error('[MenuPage] Error fetching categories:', categoriesError)
      // Don't return early - continue to try fetching items
    }

    // Get menu items
    const { data: menuItems, error: itemsError } = await supabase
      .from('menu_items')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('is_available', true)
      .order('sort_order', { ascending: true })

    if (itemsError) {
      console.error('[MenuPage] Error fetching menu items:', itemsError)
      return {
        data: null,
        error: `Failed to fetch menu items: ${itemsError.message}`
      }
    }

    // Log what we got for debugging
    console.log('[MenuPage] Data fetched - Categories:', categories?.length || 0, 'Items:', menuItems?.length || 0)

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
        sort_order: 999,
        is_active: true,
        items: uncategorizedItems,
      })
    }

    return {
      data: {
        categories: menuByCategory,
        allItems: menuItems || [],
      },
      error: null
    }
  } catch (error: any) {
    const errorMsg = error.message || 'Internal server error'
    console.error('[MenuPage] Unexpected error in getMenuData:', error)
    console.error('[MenuPage] Error stack:', error.stack)
    return {
      data: null,
      error: errorMsg
    }
  }
}

export default async function MenuPage() {
  try {
    const { data: menuData, error } = await getMenuData()
    const businessSettings = await getBusinessSettings()

    // Log the result for debugging
    if (error) {
      console.error('[MenuPage] Error fetching menu data:', error)
    } else {
      console.log('[MenuPage] Menu data fetched successfully - Categories:', menuData?.categories.length || 0)
    }

    // Always render the client component, even with empty data or errors
    // The client component will handle the error display
    return (
      <MenuClient 
        initialMenuData={menuData || { categories: [], allItems: [] }}
        error={error}
        businessSettings={businessSettings}
      />
    )
  } catch (error: any) {
    // Catch any unexpected errors during rendering
    console.error('[MenuPage] Fatal error in MenuPage:', error)
    return (
      <MenuClient 
        initialMenuData={{ categories: [], allItems: [] }}
        error={error.message || 'Failed to load menu page'}
        businessSettings={null}
      />
    )
  }
}
