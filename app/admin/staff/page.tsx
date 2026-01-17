'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface StaffMember {
  id: string
  email: string
  role: string
  created_at: string
  tenant_id: string
}

export default function AdminStaffPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [csrfToken, setCsrfToken] = useState('')

  // Invite form state
  const [showInviteForm, setShowInviteForm] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [invitePassword, setInvitePassword] = useState('')
  const [inviteRole, setInviteRole] = useState('admin')
  const [inviting, setInviting] = useState(false)

  useEffect(() => {
    checkAuthAndFetch()
  }, [])

  const checkAuthAndFetch = async () => {
    try {
      const response = await fetch('/api/admin/session')
      if (!response.ok) {
        router.push('/admin/login')
        return
      }

      // Fetch CSRF token
      const csrfResponse = await fetch('/api/csrf')
      if (csrfResponse.ok) {
        const { csrfToken } = await csrfResponse.json()
        setCsrfToken(csrfToken)
      }

      fetchStaff()
    } catch (error) {
      console.error('Auth check failed:', error)
      router.push('/admin/login')
    }
  }

  const fetchStaff = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/staff')
      if (response.ok) {
        const data = await response.json()
        setStaff(data)
      } else {
        setError('Failed to load staff members')
      }
    } catch (error) {
      console.error('Error fetching staff:', error)
      setError('Failed to load staff members')
    } finally {
      setLoading(false)
    }
  }

  const handleInviteStaff = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!inviteEmail || !invitePassword) {
      setError('Email and password are required')
      return
    }

    try {
      setInviting(true)
      setError('')
      setSuccess('')

      const response = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({
          email: inviteEmail,
          password: invitePassword,
          role: inviteRole,
        }),
      })

      if (response.ok) {
        setSuccess('Staff member invited successfully')
        setInviteEmail('')
        setInvitePassword('')
        setInviteRole('admin')
        setShowInviteForm(false)
        fetchStaff()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to invite staff member')
      }
    } catch (error) {
      console.error('Error inviting staff:', error)
      setError('Failed to invite staff member')
    } finally {
      setInviting(false)
    }
  }

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      setError('')
      setSuccess('')

      const response = await fetch(`/api/admin/staff/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrfToken,
        },
        body: JSON.stringify({ role: newRole }),
      })

      if (response.ok) {
        setSuccess('Role updated successfully')
        fetchStaff()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to update role')
      }
    } catch (error) {
      console.error('Error updating role:', error)
      setError('Failed to update role')
    }
  }

  const handleRemoveStaff = async (userId: string, email: string) => {
    if (!confirm(`Are you sure you want to remove ${email}?`)) {
      return
    }

    try {
      setError('')
      setSuccess('')

      const response = await fetch(`/api/admin/staff/${userId}`, {
        method: 'DELETE',
        headers: {
          'x-csrf-token': csrfToken,
        },
      })

      if (response.ok) {
        setSuccess('Staff member removed successfully')
        fetchStaff()
      } else {
        const data = await response.json()
        setError(data.error || 'Failed to remove staff member')
      }
    } catch (error) {
      console.error('Error removing staff:', error)
      setError('Failed to remove staff member')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading staff members...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2" style={{ fontFamily: 'var(--font-inter), sans-serif', fontWeight: 600, color: 'var(--brand-secondary, #3A2A24)' }}>Staff Management</h1>
        <p style={{ fontFamily: 'var(--font-inter), sans-serif', fontWeight: 400, color: 'var(--brand-muted, #4B4B4B)' }}>Manage admin and staff access</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded">
          {success}
        </div>
      )}

      <div className="mb-6">
        <button
          onClick={() => setShowInviteForm(!showInviteForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {showInviteForm ? 'Cancel' : 'Invite Staff Member'}
        </button>
      </div>

      {showInviteForm && (
        <div className="mb-8 p-6 bg-gray-50 border border-gray-200 rounded">
          <h2 className="text-xl font-semibold mb-4">Invite New Staff Member</h2>
          <form onSubmit={handleInviteStaff} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                placeholder="staff@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                value={invitePassword}
                onChange={(e) => setInvitePassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
                placeholder="Create a strong password"
                required
                minLength={8}
              />
              <p className="text-sm text-gray-500 mt-1">Minimum 8 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded"
              >
                <option value="admin">Admin (Full access)</option>
                <option value="editor">Editor (Can manage orders & menu)</option>
                <option value="viewer">Viewer (Read-only access)</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={inviting}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
              >
                {inviting ? 'Inviting...' : 'Send Invite'}
              </button>
              <button
                type="button"
                onClick={() => setShowInviteForm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Added
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {staff.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                  No staff members found
                </td>
              </tr>
            ) : (
              staff.map((member) => (
                <tr key={member.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{member.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={member.role}
                      onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                      className="text-sm border border-gray-300 rounded px-2 py-1"
                    >
                      <option value="admin">Admin</option>
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(member.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    <button
                      onClick={() => handleRemoveStaff(member.id, member.email)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 className="font-semibold text-blue-900 mb-2">Role Permissions</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li><strong>Admin:</strong> Full access to all features, can manage staff</li>
          <li><strong>Editor:</strong> Can manage orders, menu, quotes, and settings</li>
          <li><strong>Viewer:</strong> Read-only access to view orders and reports</li>
        </ul>
      </div>
    </div>
  )
}
