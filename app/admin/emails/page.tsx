'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface EmailQueueItem {
  id: string
  order_id: string
  recipient: string
  email_type: string
  status: string
  attempts: number
  created_at: string
  sent_at: string | null
  last_attempt_at: string | null
  error_message: string | null
  order?: {
    order_number: string
    customer_name: string
  }
}

interface CronJobRun {
  id: string
  job_name: string
  run_at: string
  duration_ms: number
  status: string
  records_processed: number | null
  metadata: any
  error_message: string | null
}

export default function EmailMonitoringPage() {
  const router = useRouter()
  const [emails, setEmails] = useState<EmailQueueItem[]>([])
  const [cronRuns, setCronRuns] = useState<CronJobRun[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'sent' | 'failed'>('all')
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/admin/session')
      if (!response.ok) {
        router.push('/admin/login')
        return
      }
      fetchData()
    } catch (error) {
      console.error('Auth check failed:', error)
      router.push('/admin/login')
    }
  }

  const fetchData = async () => {
    try {
      setLoading(true)

      // Fetch email queue
      const emailResponse = await fetch('/api/admin/emails')
      if (emailResponse.ok) {
        const data = await emailResponse.json()
        setEmails(data.emails || [])
        setCronRuns(data.cronRuns || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const triggerEmailProcessing = async () => {
    if (!confirm('Manually trigger email queue processing?')) return

    try {
      setProcessing(true)
      const response = await fetch('/api/admin/emails/process', {
        method: 'POST'
      })

      if (response.ok) {
        alert('Email processing triggered successfully')
        fetchData()
      } else {
        const error = await response.json()
        alert(`Failed: ${error.message}`)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to trigger email processing')
    } finally {
      setProcessing(false)
    }
  }

  const filteredEmails = emails.filter(email => {
    if (filter === 'all') return true
    return email.status === filter
  })

  const stats = {
    total: emails.length,
    pending: emails.filter(e => e.status === 'pending').length,
    sent: emails.filter(e => e.status === 'sent').length,
    failed: emails.filter(e => e.status === 'failed').length
  }

  const recentCronRun = cronRuns[0]

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-inter), sans-serif', fontWeight: 600, color: 'var(--brand-secondary, #3A2A24)' }}>Email Monitoring</h1>
        <p style={{ fontFamily: 'var(--font-inter), sans-serif', fontWeight: 400, color: 'var(--brand-muted, #4B4B4B)' }}>Monitor email delivery status and queue processing</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="text-sm text-gray-600 mb-1">Total Emails</div>
          <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow p-6 border border-yellow-200">
          <div className="text-sm text-yellow-700 mb-1">Pending</div>
          <div className="text-3xl font-bold text-yellow-900">{stats.pending}</div>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-6 border border-green-200">
          <div className="text-sm text-green-700 mb-1">Sent</div>
          <div className="text-3xl font-bold text-green-900">{stats.sent}</div>
        </div>
        <div className="bg-red-50 rounded-lg shadow p-6 border border-red-200">
          <div className="text-sm text-red-700 mb-1">Failed</div>
          <div className="text-3xl font-bold text-red-900">{stats.failed}</div>
        </div>
      </div>

      {/* Cron Job Status */}
      {recentCronRun && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-blue-900 mb-3">Last Cron Run</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-blue-700">Status</div>
              <div className={`font-semibold ${recentCronRun.status === 'success' ? 'text-green-900' : 'text-red-900'}`}>
                {recentCronRun.status}
              </div>
            </div>
            <div>
              <div className="text-blue-700">Run At</div>
              <div className="text-blue-900 font-mono text-xs">
                {new Date(recentCronRun.run_at).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-blue-700">Duration</div>
              <div className="text-blue-900 font-semibold">{recentCronRun.duration_ms}ms</div>
            </div>
            <div>
              <div className="text-blue-700">Processed</div>
              <div className="text-blue-900 font-semibold">{recentCronRun.records_processed || 0} emails</div>
            </div>
          </div>
          {recentCronRun.metadata && (
            <div className="mt-3 text-sm">
              <span className="text-green-700">✓ {recentCronRun.metadata.success_count || 0} sent</span>
              {recentCronRun.metadata.fail_count > 0 && (
                <span className="ml-4 text-red-700">✗ {recentCronRun.metadata.fail_count} failed</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === 'all'
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === 'pending'
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Pending ({stats.pending})
          </button>
          <button
            onClick={() => setFilter('sent')}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === 'sent'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Sent
          </button>
          <button
            onClick={() => setFilter('failed')}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === 'failed'
                ? 'bg-red-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Failed
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={fetchData}
            disabled={loading}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          <button
            onClick={triggerEmailProcessing}
            disabled={processing || stats.pending === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? 'Processing...' : 'Process Queue Now'}
          </button>
        </div>
      </div>

      {/* Email Queue Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Recipient</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Attempts</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : filteredEmails.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  No emails found
                </td>
              </tr>
            ) : (
              filteredEmails.map((email) => (
                <tr key={email.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={`/admin/orders/${email.order_id}`}
                      className="text-blue-600 hover:underline font-mono text-sm"
                    >
                      #{email.order?.order_number || 'N/A'}
                    </Link>
                    {email.order?.customer_name && (
                      <div className="text-xs text-gray-500">{email.order.customer_name}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="max-w-xs truncate">{email.recipient}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {email.email_type.replace('_', ' ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        email.status === 'sent'
                          ? 'bg-green-100 text-green-800'
                          : email.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {email.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {email.attempts}/3
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(email.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {email.error_message && (
                      <button
                        onClick={() => alert(email.error_message)}
                        className="text-red-600 hover:text-red-800"
                      >
                        View Error
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Cron Runs History */}
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Cron Runs</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Run Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Processed</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Success/Failed</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {cronRuns.slice(0, 10).map((run) => (
                <tr key={run.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(run.run_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        run.status === 'success'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {run.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {run.duration_ms}ms
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {run.records_processed || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {run.metadata && (
                      <>
                        <span className="text-green-600">{run.metadata.success_count || 0}</span>
                        {' / '}
                        <span className="text-red-600">{run.metadata.fail_count || 0}</span>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
