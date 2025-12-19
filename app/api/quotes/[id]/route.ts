import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerClient();
    const { data, error } = await supabase
      .from('quote_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error("Error fetching quote:", error);
      return NextResponse.json(
        { error: "Quote not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ quote: data });
  } catch (error) {
    console.error("Get quote error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerClient();
    const body = await request.json();
    
    const { status, notes } = body;

    const updateData: any = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const { data, error } = await supabase
      .from('quote_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error("Error updating quote:", error);
      return NextResponse.json(
        { error: "Failed to update quote" },
        { status: 500 }
      );
    }

    return NextResponse.json({ quote: data });
  } catch (error) {
    console.error("Update quote error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

