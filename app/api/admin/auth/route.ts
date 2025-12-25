import { NextRequest, NextResponse } from "next/server";
import { createServerAuthClientForApi } from "@/lib/supabase/server-auth-api";
import { verifyCsrfToken } from '@/lib/csrf'
import { createServerAdminClient } from '@/lib/supabase/server-admin'

/**
 * POST /api/admin/auth
 * Admin authentication endpoint using Supabase Auth
 * Signs in user and creates JWT session stored in cookies
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Create Supabase client for auth with cookie handling
    const { supabase, response: authResponse } = createServerAuthClientForApi(request);

    // Sign in with email and password
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      console.error('Admin auth error:', authError);
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify user is a member of at least one tenant
    const supabaseAdmin = createServerAdminClient();
    const { data: memberships, error: membershipError } = await supabaseAdmin
      .from('tenant_members')
      .select('tenant_id, role, tenants(slug, name)')
      .eq('user_id', authData.user.id);

    if (membershipError || !memberships || memberships.length === 0) {
      // User is not a member of any tenant - sign them out
      await supabase.auth.signOut();
      return NextResponse.json(
        { error: "User is not authorized as admin" },
        { status: 403 }
      );
    }

    // Get the primary tenant (for MVP, use first membership)
    // In future, could allow user to select tenant or use tenantSlug from request
    const primaryMembership = memberships[0];
    const tenantSlug = (primaryMembership.tenants as any)?.slug || 'moto-kitchen';

    // Create JSON response with auth cookies
    const jsonResponse = NextResponse.json({ 
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
      tenantSlug,
      role: primaryMembership.role,
    });

    // Copy cookies from authResponse to jsonResponse
    authResponse.cookies.getAll().forEach(cookie => {
      jsonResponse.cookies.set(cookie.name, cookie.value, cookie)
    })

    return jsonResponse;
  } catch (error: any) {
    console.error('Admin auth error:', error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/auth
 * Admin logout endpoint
 * Signs out user and clears Supabase Auth session
 */
export async function DELETE(request: NextRequest) {
  // Verify CSRF token for logout
  const isValidCsrf = await verifyCsrfToken(request)
  if (!isValidCsrf) {
    return NextResponse.json(
      { message: 'CSRF token missing or invalid' },
      { status: 403 }
    )
  }

  try {
    const { supabase, response: authResponse } = createServerAuthClientForApi(request);
    await supabase.auth.signOut();
    
    const jsonResponse = NextResponse.json({ success: true });
    
    // Copy cookies from authResponse (which will have cleared auth cookies)
    authResponse.cookies.getAll().forEach(cookie => {
      jsonResponse.cookies.set(cookie.name, cookie.value, cookie)
    })
    
    return jsonResponse;
  } catch (error: any) {
    console.error('Admin logout error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

