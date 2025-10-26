"use client"
import React, { ReactNode, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'

interface ProtectedRouteProps {
  children: ReactNode
  requiredPermissions?: string[]
  fallbackPath?: string
}

export default function ProtectedRoute({ 
  children, 
  requiredPermissions = [], 
  fallbackPath = '/access-denied' 
}: ProtectedRouteProps) {
  const { user, loading, hasAllPermissions } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (loading) return

    if (!user) {
      router.push('/login')
      return
    }

    // Check if user has required permissions
    if (requiredPermissions.length > 0) {
      const hasRequiredPermissions = hasAllPermissions(requiredPermissions)
      
      if (!hasRequiredPermissions) {
        router.push(fallbackPath as any)
        return
      }
    }
  }, [user, loading, requiredPermissions, hasAllPermissions, router, fallbackPath])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-white">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Check permissions if required
  if (requiredPermissions.length > 0) {
    const hasRequiredPermissions = hasAllPermissions(requiredPermissions)
    
    if (!hasRequiredPermissions) {
      return null
    }
  }

  return <>{children}</>
}
