import { NextRequest, NextResponse } from 'next/server';
import { createServerAdminClient } from '@/lib/supabase/server-admin';
import { logger } from '@/lib/logging';

/**
 * POST /api/cron/cleanup-pending-orders
 * Cleanup expired pending orders and release their slot reservations
 * 
 * Protected by CRON_SECRET
 */
export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const supabase = createServerAdminClient();
  
  try {
    const { data, error } = await supabase.rpc('cleanup_expired_pending_orders');
    
    if (error) {
      throw error;
    }
    
    logger.info('Expired pending orders cleaned up', {
      expiredCount: data[0].expired_count,
      slotAdjustments: data[0].slot_adjustments
    });
    
    return NextResponse.json({
      success: true,
      expired_count: data[0].expired_count,
      slot_adjustments: data[0].slot_adjustments
    });
    
  } catch (error: any) {
    logger.error('Failed to cleanup expired orders', error as Error);
    return NextResponse.json(
      { error: 'Cleanup failed', message: error.message },
      { status: 500 }
    );
  }
}

