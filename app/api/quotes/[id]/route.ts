import { NextRequest, NextResponse } from "next/server";
import { createServerAuthClient } from "@/lib/supabase/server-auth";
import { verifyCsrfToken } from '@/lib/csrf'
import { logger, getTenantContextFromHeaders } from '@/lib/logging'
import { captureException } from '@/lib/error-tracking'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const context = getTenantContextFromHeaders(request.headers)
  const { id } = await params
  logger.api.request('GET', `/api/quotes/${id}`, context)
  
  try {
    // Use JWT-based client so RLS policies apply
    const supabase = await createServerAuthClient();
    const { data, error } = await supabase
      .from('quote_requests')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      logger.api.error('GET', `/api/quotes/${id}`, error as Error, { ...context, quoteId: id })
      captureException(error as Error, { ...context, quoteId: id })
      return NextResponse.json(
        { error: "Quote not found" },
        { status: 404 }
      );
    }

    logger.info('Quote fetched successfully', { ...context, quoteId: id })
    return NextResponse.json({ quote: data });
  } catch (error: any) {
    logger.api.error('GET', `/api/quotes/${id}`, error, context)
    captureException(error, context)
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
  const context = getTenantContextFromHeaders(request.headers)
  const { id } = await params
  logger.api.request('PATCH', `/api/quotes/${id}`, context)
  
  // Verify CSRF token
  const isValidCsrf = await verifyCsrfToken(request)
  if (!isValidCsrf) {
    logger.warn('CSRF token missing or invalid', { ...context, path: `/api/quotes/${id}` })
    return NextResponse.json(
      { message: 'CSRF token missing or invalid' },
      { status: 403 }
    )
  }

  try {
    // Use JWT-based client so RLS policies apply
    const supabase = await createServerAuthClient();
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
      logger.api.error('PATCH', `/api/quotes/${id}`, error as Error, { ...context, quoteId: id })
      captureException(error as Error, { ...context, quoteId: id })
      return NextResponse.json(
        { error: "Failed to update quote" },
        { status: 500 }
      );
    }

    logger.info('Quote updated successfully', { ...context, quoteId: id })
    return NextResponse.json({ quote: data });
  } catch (error: any) {
    logger.api.error('PATCH', `/api/quotes/${id}`, error, context)
    captureException(error, context)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

