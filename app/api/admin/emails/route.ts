import { NextRequest, NextResponse } from 'next/server'
import { createServerAuthClient } from '@/lib/supabase/server-auth'
import { getAdminTenantId } from '@/lib/auth/server-admin'
import { logger } from '@/lib/logging'

/**
 * GET /api/admin/emails
 * Fetch email queue and cron job runs for monitoring dashboard
 *
 * Protected: Requires admin authentication
 */
export async function GET(request: NextRequest) {
  try {
    const tenantId = await getAdminTenantId()
    const supabase = await createServerAuthClient()

    // Fetch email queue with order details
    const { data: emails, error: emailsError } = await supabase
      .from('email_queue')
      .select(`
        *,
        orders!inner (
          order_number,
          customer_name,
          tenant_id
        )
      `)
      .eq('orders.tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(100)

    if (emailsError) {
      throw emailsError
    }

    // Fetch recent cron job runs
    const { data: cronRuns, error: cronError } = await supabase
      .from('cron_job_runs')
      .select('*')
      .eq('job_name', 'process_email_queue')
      .order('run_at', { ascending: false })
      .limit(20)

    if (cronError) {
      throw cronError
    }

    return NextResponse.json({
      emails: emails || [],
      cronRuns: cronRuns || []
    })

  } catch (error: any) {
    logger.error('Failed to fetch email monitoring data', error as Error)
    return NextResponse.json(
      { error: 'Failed to fetch email data', message: error.message },
      { status: 500 }
    )
  }
}
