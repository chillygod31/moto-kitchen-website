import { NextRequest, NextResponse } from "next/server";
import { createServerAuthClient } from "@/lib/supabase/server-auth";
import { getAdminUser } from "@/lib/auth/server-admin";

/**
 * GET /api/invoice-history
 * List all invoice history for current tenant
 */
export async function GET(request: NextRequest) {
  try {
    // Check admin auth
    const adminUser = await getAdminUser(request);
    if (!adminUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const docType = searchParams.get('type'); // 'invoice', 'quote', or 'embassyInvoice'

    const supabase = await createServerAuthClient();

    let query = supabase
      .from('invoice_history')
      .select('*')
      .eq('tenant_id', adminUser.membership.tenant_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (docType) {
      query = query.eq('document_type', docType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch invoice history:', error);
      return NextResponse.json(
        { error: "Failed to fetch invoice history" },
        { status: 500 }
      );
    }

    return NextResponse.json({ invoices: data || [] });
  } catch (error: any) {
    console.error('Invoice history GET error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/invoice-history
 * Save new invoice to history
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin auth
    const adminUser = await getAdminUser(request);
    if (!adminUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { document_type, document_number, client_name, form_data } = body;

    // Validate required fields
    if (!document_type || !document_number || !client_name || !form_data) {
      return NextResponse.json(
        { error: "Missing required fields: document_type, document_number, client_name, form_data" },
        { status: 400 }
      );
    }

    // Validate document_type
    if (!['invoice', 'quote', 'embassyInvoice'].includes(document_type)) {
      return NextResponse.json(
        { error: "Invalid document_type. Must be 'invoice', 'quote', or 'embassyInvoice'" },
        { status: 400 }
      );
    }

    const supabase = await createServerAuthClient();

    const { data, error } = await supabase
      .from('invoice_history')
      .insert({
        tenant_id: adminUser.membership.tenant_id,
        document_type,
        document_number,
        client_name,
        form_data
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to save invoice history:', error);
      return NextResponse.json(
        { error: "Failed to save invoice" },
        { status: 500 }
      );
    }

    return NextResponse.json({ invoice: data }, { status: 201 });
  } catch (error: any) {
    console.error('Invoice history POST error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
