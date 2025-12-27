import { NextRequest, NextResponse } from "next/server";
import { createServerAuthClient } from "@/lib/supabase/server-auth";
import { verifyCsrfToken } from '@/lib/csrf'
import { logger, getTenantContextFromHeaders } from '@/lib/logging'
import { captureException } from '@/lib/error-tracking'

export async function GET(request: NextRequest) {
  const context = getTenantContextFromHeaders(request.headers)
  logger.api.request('GET', '/api/quotes', context)
  
  try {
    // Use JWT-based client so RLS policies apply
    const supabase = await createServerAuthClient();
    const { searchParams } = new URL(request.url);
    
    const status = searchParams.get('status');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');

    let query = supabase
      .from('quote_requests')
      .select('*')
      .order('created_at', { ascending: false });

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,location.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      logger.api.error('GET', '/api/quotes', error as Error, context)
      captureException(error as Error, context)
      return NextResponse.json(
        { error: "Failed to fetch quotes" },
        { status: 500 }
      );
    }

    logger.info('Quotes fetched successfully', { ...context, count: data?.length || 0 })
    return NextResponse.json({ quotes: data || [] });
  } catch (error: any) {
    logger.api.error('GET', '/api/quotes', error, context)
    captureException(error, context)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const context = getTenantContextFromHeaders(request.headers)
  logger.api.request('PATCH', '/api/quotes', context)
  
  // Verify CSRF token
  const isValidCsrf = await verifyCsrfToken(request)
  if (!isValidCsrf) {
    logger.warn('CSRF token missing or invalid', { ...context, path: '/api/quotes' })
    return NextResponse.json(
      { message: 'CSRF token missing or invalid' },
      { status: 403 }
    )
  }

  try {
    // Use JWT-based client so RLS policies apply
    const supabase = await createServerAuthClient();
    const body = await request.json();
    
    const { id, status, notes } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Quote ID is required" },
        { status: 400 }
      );
    }

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
      logger.api.error('PATCH', '/api/quotes', error as Error, { ...context, quoteId: id })
      captureException(error as Error, { ...context, quoteId: id })
      return NextResponse.json(
        { error: "Failed to update quote" },
        { status: 500 }
      );
    }

    logger.info('Quote updated successfully', { ...context, quoteId: id })
    return NextResponse.json({ quote: data });
  } catch (error: any) {
    logger.api.error('PATCH', '/api/quotes', error, context)
    captureException(error, context)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

