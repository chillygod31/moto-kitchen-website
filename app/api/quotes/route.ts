import { NextRequest, NextResponse } from "next/server";
import { createServerAuthClient } from "@/lib/supabase/server-auth";
import { verifyCsrfToken } from '@/lib/csrf'
import { logger, getTenantContextFromHeaders } from '@/lib/logging'
import { captureException } from '@/lib/error-tracking'

// Everything the list shows, and nothing it does not. quote_file holds a whole
// PDF as base64 (up to ~6.7 MB a row), so selecting * shipped every attachment
// just to draw a list — enough to push the request past the database's
// statement timeout. The file is fetched from /api/quotes/[id] on download.
const QUOTE_LIST_COLUMNS =
  'id, name, email, phone, event_type, event_date, guest_count, location, service_type, dietary_requirements, message, how_found, budget_range, status, notes, quote_file_name, created_at, updated_at';

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
      .select(QUOTE_LIST_COLUMNS)
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

    // Which quotes carry an attachment, without pulling the files: IS NOT NULL is
    // answered from the row itself and never reads the base64 content.
    const { data: withFiles } = await supabase
      .from('quote_requests')
      .select('id')
      .not('quote_file', 'is', null);
    const hasFile = new Set((withFiles || []).map((row) => row.id));

    const quotes = (data || []).map((quote) => ({
      ...quote,
      // quote_file_name is written alongside the file, so it stands in if the
      // lookup above fails.
      has_quote_file: hasFile.has(quote.id) || !!quote.quote_file_name,
    }));

    logger.info('Quotes fetched successfully', { ...context, count: quotes.length })
    return NextResponse.json({ quotes });
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

