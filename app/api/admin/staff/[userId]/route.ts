import { NextRequest, NextResponse } from 'next/server'
import { createServerAdminClient } from '@/lib/supabase/server-admin'
import { createServerAuthClient } from '@/lib/supabase/server-auth'
import { getTenantId } from '@/lib/tenant'
import { verifyCsrfToken } from '@/lib/csrf'

/**
 * PATCH /api/admin/staff/[userId]
 * Update a staff member's role
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Verify CSRF token
    const isValidCsrf = await verifyCsrfToken(request)
    if (!isValidCsrf) {
      return NextResponse.json(
        { error: 'CSRF token missing or invalid' },
        { status: 403 }
      )
    }

    // Verify admin authentication
    const supabase = await createServerAuthClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const tenantId = await getTenantId()
    const supabaseAdmin = createServerAdminClient()

    // Verify the current user is an admin of this tenant
    const { data: membership } = await supabaseAdmin
      .from('tenant_members')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .single()

    if (!membership || membership.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can update staff roles' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { role } = body
    const { userId } = params

    if (!['admin', 'editor', 'viewer'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    // Prevent users from demoting themselves if they're the only admin
    if (userId === user.id && role !== 'admin') {
      const { data: admins } = await supabaseAdmin
        .from('tenant_members')
        .select('user_id')
        .eq('tenant_id', tenantId)
        .eq('role', 'admin')

      if (admins && admins.length === 1) {
        return NextResponse.json(
          { error: 'Cannot change your own role - you are the only admin' },
          { status: 400 }
        )
      }
    }

    // Update the role
    const { error: updateError } = await supabaseAdmin
      .from('tenant_members')
      .update({ role })
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)

    if (updateError) {
      console.error('Error updating role:', updateError)
      return NextResponse.json(
        { error: 'Failed to update role' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in PATCH /api/admin/staff/[userId]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/staff/[userId]
 * Remove a staff member from the tenant
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Verify CSRF token
    const isValidCsrf = await verifyCsrfToken(request)
    if (!isValidCsrf) {
      return NextResponse.json(
        { error: 'CSRF token missing or invalid' },
        { status: 403 }
      )
    }

    // Verify admin authentication
    const supabase = await createServerAuthClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const tenantId = await getTenantId()
    const supabaseAdmin = createServerAdminClient()

    // Verify the current user is an admin of this tenant
    const { data: membership } = await supabaseAdmin
      .from('tenant_members')
      .select('role')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .single()

    if (!membership || membership.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can remove staff members' },
        { status: 403 }
      )
    }

    const { userId } = params

    // Prevent users from removing themselves if they're the only admin
    if (userId === user.id) {
      const { data: admins } = await supabaseAdmin
        .from('tenant_members')
        .select('user_id')
        .eq('tenant_id', tenantId)
        .eq('role', 'admin')

      if (admins && admins.length === 1) {
        return NextResponse.json(
          { error: 'Cannot remove yourself - you are the only admin' },
          { status: 400 }
        )
      }
    }

    // Remove from tenant_members
    const { error: deleteError } = await supabaseAdmin
      .from('tenant_members')
      .delete()
      .eq('tenant_id', tenantId)
      .eq('user_id', userId)

    if (deleteError) {
      console.error('Error removing staff member:', deleteError)
      return NextResponse.json(
        { error: 'Failed to remove staff member' },
        { status: 500 }
      )
    }

    // Note: We don't delete the user from auth.users
    // They might be a member of other tenants
    // If they're not a member of any tenant, they just can't access any admin dashboard

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/admin/staff/[userId]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
