import { NextRequest, NextResponse } from 'next/server'
import { getAdminTenantId } from '@/lib/auth/server-admin'
import { logger } from '@/lib/logging'

/**
 * POST /api/admin/emails/process
 * Manually trigger email queue processing
 *
 * Protected: Requires admin authentication
 */
export async function POST(request: NextRequest) {
  try {
    await getAdminTenantId() // Verify admin auth

    // Call the cron endpoint with CRON_SECRET
    const cronSecret = process.env.CRON_SECRET
    if (!cronSecret) {
      throw new Error('CRON_SECRET not configured')
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const response = await fetch(`${siteUrl}/api/cron/process-email-queue`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cronSecret}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || 'Failed to process email queue')
    }

    const result = await response.json()

    logger.info('Email queue manually triggered by admin', {
      success_count: result.success_count,
      fail_count: result.fail_count
    })

    return NextResponse.json(result)

  } catch (error: any) {
    logger.error('Failed to trigger email processing', error as Error)
    return NextResponse.json(
      { error: 'Failed to trigger processing', message: error.message },
      { status: 500 }
    )
  }
}
