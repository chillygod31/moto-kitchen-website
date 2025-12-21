import { createServerClient } from '@/lib/supabase/server'
import { getTenantId } from '@/lib/tenant'
import MenuClient from './MenuClient'
import { MenuItem, MenuCategory } from '@/types'

interface MenuData {
  categories: (MenuCategory & { items: MenuItem[] })[]
  allItems: MenuItem[]
}

async function getMenuData(): Promise<{ data: MenuData | null; error: string | null }> {
  try {
    const supabase = createServerClient()
    const tenantId = await getTenantId('moto-kitchen')

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
      return {
        data: null,
        error: itemsError.message || 'Failed to fetch menu items'
      }
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
    console.error('Error in getMenuData:', error)
    return {
      data: null,
      error: error.message || 'Internal server error'
    }
  }
}

export default async function MenuPage() {
  const { data: menuData, error } = await getMenuData()

  // If error or no data, still render the client component with empty data
  // The client component will handle the error display
  return (
    <MenuClient 
      initialMenuData={menuData || { categories: [], allItems: [] }}
      error={error}
    />
  )
}
