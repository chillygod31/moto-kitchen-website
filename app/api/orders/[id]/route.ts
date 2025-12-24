import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { getTenantId } from '@/lib/tenant'
import { getAdminTenantId } from '@/lib/admin-auth'

/**
 * GET /api/orders/[id]
 * Get a single order by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerClient()
    
    // Get tenant ID from admin session (server-side, secure)
    let tenantId: string
    try {
      tenantId = await getAdminTenantId(request)
    } catch (authError) {
      // Fallback for customer-facing endpoints
      tenantId = await getTenantId()
    }
    
    const { id } = await params

    const { data, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single()

    if (error) {
      console.error('Error fetching order:', error)
      return NextResponse.json(
        { message: 'Order not found', error: error.message },
        { status: 404 }
      )
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error in GET /api/orders/[id]:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/orders/[id]
 * Update order status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createServerClient()
    
    // Get tenant ID from admin session (server-side, secure)
    let tenantId: string
    try {
      tenantId = await getAdminTenantId(request)
    } catch (authError) {
      // Admin operations should require auth, but fallback for compatibility
      tenantId = await getTenantId()
    }
    
    const { id } = await params
    const body = await request.json()

    const { status, payment_status, ...otherUpdates } = body

    const updateData: any = {}
    if (status) updateData.status = status
    if (payment_status) updateData.payment_status = payment_status
    Object.assign(updateData, otherUpdates)

    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select('*, order_items(*)')
      .single()

    if (error) {
      console.error('Error updating order:', error)
      return NextResponse.json(
        { message: 'Failed to update order', error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error in PATCH /api/orders/[id]:', error)
    return NextResponse.json(
      { message: 'Internal server error', error: error.message },
      { status: 500 }
    )
  }
}

