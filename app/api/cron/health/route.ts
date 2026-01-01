import { NextRequest, NextResponse } from 'next/server';
import { createServerAdminClient } from '@/lib/supabase/server-admin';

/**
 * GET /api/cron/health
 * Monitor cron job health
 * 
 * Checks:
 * - Database connectivity
 * - Cleanup job ran within 10 minutes
 * - Email processor ran within 5 minutes
 * 
 * Returns 503 if any check fails
 */
export async function GET(request: NextRequest) {
  const supabase = createServerAdminClient();
  
  try {
    const checks: any = {
      cleanup_job: { status: 'unknown', last_run: null },
      email_processor: { status: 'unknown', last_run: null },
      database: { status: 'unknown' }
    };
    
    // Check database connectivity
    const { error: dbError } = await supabase.from('cron_job_runs').select('id').limit(1);
    checks.database.status = dbError ? 'unhealthy' : 'healthy';
    
    // Check cleanup job (should run every 5 minutes)
    const { data: cleanupRun } = await supabase
      .from('cron_job_runs')
      .select('*')
      .eq('job_name', 'cleanup_expired_pending_orders')
      .order('run_at', { ascending: false })
      .limit(1)
      .single();
    
    if (cleanupRun) {
      const minutesSinceLastRun = 
        (Date.now() - new Date(cleanupRun.run_at).getTime()) / 60000;
      checks.cleanup_job.last_run = cleanupRun.run_at;
      checks.cleanup_job.status = minutesSinceLastRun > 10 ? 'unhealthy' : 'healthy';
      checks.cleanup_job.minutes_since_last_run = Math.round(minutesSinceLastRun);
      checks.cleanup_job.last_status = cleanupRun.status;
    }
    
    // Check email processor (should run every minute)
    const { data: emailRun } = await supabase
      .from('cron_job_runs')
      .select('*')
      .eq('job_name', 'process_email_queue')
      .order('run_at', { ascending: false })
      .limit(1)
      .single();
    
    if (emailRun) {
      const minutesSinceLastRun = 
        (Date.now() - new Date(emailRun.run_at).getTime()) / 60000;
      checks.email_processor.last_run = emailRun.run_at;
      checks.email_processor.status = minutesSinceLastRun > 5 ? 'unhealthy' : 'healthy';
      checks.email_processor.minutes_since_last_run = Math.round(minutesSinceLastRun);
      checks.email_processor.last_status = emailRun.status;
    }
    
    // Overall health
    const allHealthy = Object.values(checks).every((check: any) => 
      check.status === 'healthy'
    );
    
    const statusCode = allHealthy ? 200 : 503;
    
    return NextResponse.json({
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      checks
    }, { status: statusCode });
    
  } catch (error: any) {
    return NextResponse.json({
      status: 'error',
      message: error.message
    }, { status: 500 });
  }
}

