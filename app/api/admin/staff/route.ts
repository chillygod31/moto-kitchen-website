import { NextRequest, NextResponse } from 'next/server'
import { createServerAdminClient } from '@/lib/supabase/server-admin'
import { createServerAuthClient } from '@/lib/supabase/server-auth'
import { getTenantId } from '@/lib/tenant'
import { verifyCsrfToken } from '@/lib/csrf'

/**
 * GET /api/admin/staff
 * List all staff members for the current tenant
 */
export async function GET(_request: NextRequest) {
  try {
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

    // Get all staff members for this tenant
    const { data: members, error } = await supabaseAdmin
      .from('tenant_members')
      .select('user_id, role, created_at, tenant_id')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching staff:', error)
      return NextResponse.json(
        { error: 'Failed to fetch staff members' },
        { status: 500 }
      )
    }

    // Fetch user details from Auth API
    const staff = await Promise.all(
      members.map(async (member: any) => {
        try {
          const { data: userData } = await supabaseAdmin.auth.admin.getUserById(member.user_id)
          return {
            id: member.user_id,
            email: userData.user?.email || 'Unknown',
            role: member.role,
            created_at: member.created_at,
            tenant_id: member.tenant_id,
          }
        } catch (err) {
          console.error('Error fetching user:', err)
          return {
            id: member.user_id,
            email: 'Unknown',
            role: member.role,
            created_at: member.created_at,
            tenant_id: member.tenant_id,
          }
        }
      })
    )

    return NextResponse.json(staff)
  } catch (error) {
    console.error('Error in GET /api/admin/staff:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/staff
 * Invite a new staff member (create user + add to tenant)
 */
export async function POST(request: NextRequest) {
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
        { error: 'Only admins can invite staff members' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { email, password, role } = body

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      )
    }

    if (!['admin', 'editor', 'viewer'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      )
    }

    // Create the user in Supabase Auth
    const { data: newUser, error: createUserError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
    })

    if (createUserError) {
      console.error('Error creating user:', createUserError)
      return NextResponse.json(
        { error: createUserError.message || 'Failed to create user' },
        { status: 400 }
      )
    }

    if (!newUser.user) {
      return NextResponse.json(
        { error: 'User creation failed' },
        { status: 500 }
      )
    }

    // Add user to tenant_members
    const { error: memberError } = await supabaseAdmin
      .from('tenant_members')
      .insert({
        tenant_id: tenantId,
        user_id: newUser.user.id,
        role,
      })

    if (memberError) {
      console.error('Error adding user to tenant:', memberError)
      // Clean up - delete the user we just created
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)

      return NextResponse.json(
        { error: 'Failed to add user to tenant' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.user.id,
        email: newUser.user.email,
        role,
      },
    })
  } catch (error) {
    console.error('Error in POST /api/admin/staff:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
