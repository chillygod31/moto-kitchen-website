'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

const ORDER_PASSWORD = process.env.NEXT_PUBLIC_ORDER_PASSWORD || 'moto2024' // Default password, change in production
const AUTH_KEY = 'order-auth-verified'

export default function OrderPasswordProtection({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    // Check if already authenticated
    const verified = sessionStorage.getItem(AUTH_KEY)
    if (verified === 'true') {
      setIsAuthenticated(true)
    }
    setIsChecking(false)
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password === ORDER_PASSWORD) {
      sessionStorage.setItem(AUTH_KEY, 'true')
      setIsAuthenticated(true)
      // Redirect to the order menu page
      router.push('/order')
    } else {
      setError('Incorrect password. Please try again.')
      setPassword('')
    }
  }

  // Show loading state while checking
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF6EF]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#C9653B] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show password form if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#FAF6EF] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <Link href="/" className="flex items-center justify-center gap-3 mb-6">
              <Image src="/logo1.png" alt="Moto Kitchen" width={64} height={64} className="h-16 w-auto object-contain" />
              <div className="flex flex-col -ml-2">
                <span className="text-[#3A2A24] text-2xl leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>Moto Kitchen</span>
                <span className="text-[#3A2A24]/80 text-xs uppercase tracking-[0.15em] leading-tight" style={{ fontFamily: 'var(--font-cinzel)' }}>East African Catering Service</span>
              </div>
            </Link>
            <h1 className="text-3xl font-bold text-[#3A2A24] mb-2">Ordering System</h1>
            <p className="text-gray-600">Enter the passcode to access the ordering system</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Passcode
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError('')
                }}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-[#C9653B] focus:border-transparent ${
                  error ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter passcode"
                autoFocus
                required
              />
              {error && (
                <p className="mt-2 text-sm text-red-600" role="alert">{error}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full px-6 py-3 bg-[#C9653B] text-white rounded-lg hover:bg-[#B8552B] transition font-semibold text-lg"
            >
              Access Ordering System
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-[#C9653B] hover:underline">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Render children if authenticated
  return <>{children}</>
}

