import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getTenantId } from '@/lib/tenant'

/**
 * GET /api/orders/stats
 * Get order statistics for social proof and urgency indicators
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const tenantId = await getTenantId('moto-kitchen')

    // Get order count for today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const { count: ordersToday } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('created_at', today.toISOString())
      .lt('created_at', tomorrow.toISOString())

    // Get popular items (simplified - just return order count for now)
    // For full implementation, would need RPC function or client-side aggregation
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('menu_item_id, name_snapshot')
      .limit(100) // Sample recent items

    // Count frequency of each item (client-side aggregation)
    const itemCounts: Record<string, number> = {}
    orderItems?.forEach((item) => {
      const key = item.menu_item_id || item.name_snapshot
      itemCounts[key] = (itemCounts[key] || 0) + 1
    })

    const popularItems = Object.entries(itemCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([id, count]) => ({ menu_item_id: id, count }))

    return NextResponse.json({
      ordersToday: ordersToday || 0,
      popularItems: popularItems || [],
    })
  } catch (error: any) {
    console.error('Error in GET /api/orders/stats:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}

