import { NextRequest, NextResponse } from "next/server";
import { createAdminSession } from "@/lib/admin-auth";

/**
 * POST /api/admin/auth
 * Admin authentication endpoint
 * Creates server-side session with tenant context
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { password, tenantSlug } = body;

    const correctPassword = process.env.ADMIN_PASSWORD || "admin123";

    if (password !== correctPassword) {
      return NextResponse.json(
        { error: "Incorrect password" },
        { status: 401 }
      );
    }

    // Create admin session with tenant context
    // Default to 'moto-kitchen' for MVP, but allow override for future multi-tenant
    const slug = tenantSlug || 'moto-kitchen';
    const session = await createAdminSession(slug);

    return NextResponse.json({ 
      success: true,
      tenantSlug: session.tenantSlug
    });
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
 * Clears server-side session
 */
export async function DELETE(request: NextRequest) {
  try {
    const { clearAdminSession } = await import("@/lib/admin-auth");
    await clearAdminSession();
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Admin logout error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

