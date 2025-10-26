"use client"
import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

export function AuthStatusChecker() {
  const { user, loading } = useAuth()
  const [tokenStatus, setTokenStatus] = useState<'checking' | 'found' | 'missing'>('checking')

  useEffect(() => {
    const token = localStorage.getItem('admin_access_token')
    setTokenStatus(token ? 'found' : 'missing')
  }, [])

  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
          <span className="text-blue-800">Checking authentication status...</span>
        </div>
      </div>
    )
  }

  if (!user || tokenStatus === 'missing') {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <p className="text-yellow-800 font-medium">Authentication Required</p>
            <p className="text-yellow-700 text-sm">You need to be logged in to generate reports.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
      <div className="flex items-center">
        <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <p className="text-green-800 font-medium">Authenticated as {user.name}</p>
          <p className="text-green-700 text-sm">You can generate reports with real data.</p>
        </div>
      </div>
    </div>
  )
}
