import { NextRequest, NextResponse } from "next/server";
import { createServerAuthClient } from "@/lib/supabase/server-auth";
import { getAdminUser } from "@/lib/auth/server-admin";

/**
 * GET /api/invoice-history/[id]
 * Get single invoice by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check admin auth
    const adminUser = await getAdminUser(request);
    if (!adminUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = await createServerAuthClient();

    const { data, error } = await supabase
      .from('invoice_history')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', adminUser.membership.tenant_id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: "Invoice not found" },
          { status: 404 }
        );
      }
      console.error('Failed to fetch invoice:', error);
      return NextResponse.json(
        { error: "Failed to fetch invoice" },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Invoice history GET by ID error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/invoice-history/[id]
 * Delete invoice from history
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check admin auth
    const adminUser = await getAdminUser(request);
    if (!adminUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const supabase = await createServerAuthClient();

    // First check if invoice exists and belongs to this tenant
    const { data: existing, error: fetchError } = await supabase
      .from('invoice_history')
      .select('id')
      .eq('id', id)
      .eq('tenant_id', adminUser.membership.tenant_id)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from('invoice_history')
      .delete()
      .eq('id', id)
      .eq('tenant_id', adminUser.membership.tenant_id);

    if (error) {
      console.error('Failed to delete invoice:', error);
      return NextResponse.json(
        { error: "Failed to delete invoice" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Invoice history DELETE error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
