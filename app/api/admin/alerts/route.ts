import { NextRequest, NextResponse } from 'next/server';
import { createServerAdminClient } from '@/lib/supabase/server-admin';

/**
 * GET /api/admin/alerts
 * Fetch webhook alerts for admin dashboard
 * 
 * Query params:
 * - acknowledged: filter by acknowledgement status (default: false)
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const acknowledgedFilter = searchParams.get('acknowledged');
  
  const supabase = createServerAdminClient();
  
  try {
    let query = supabase
      .from('webhook_alerts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (acknowledgedFilter !== null) {
      query = query.eq('acknowledged', acknowledgedFilter === 'true');
    }
    
    const { data: alerts, error } = await query;
    
    if (error) {
      throw error;
    }
    
    return NextResponse.json({ alerts: alerts || [] });
    
  } catch (error: any) {
    return NextResponse.json(
      { error: 'Failed to fetch alerts', message: error.message },
      { status: 500 }
    );
  }
}

