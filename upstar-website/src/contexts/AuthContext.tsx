"use client"
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { AuthService, JWTManager, User } from '@/lib/auth'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  hasPermission: (permission: string) => boolean
  hasAnyPermission: (permissions: string[]) => boolean
  hasAllPermissions: (permissions: string[]) => boolean
  getUserRole: () => string | null
  canWrite: (permission: string) => boolean
  canDelete: (permission: string) => boolean
  isReadOnly: () => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in with JWT
    const currentUser = JWTManager.getCurrentUser()
    setUser(currentUser)
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    setLoading(true)
    try {
      const result = await AuthService.login(email, password)
      if (result.success && result.user) {
        setUser(result.user)
        return { success: true }
      } else {
        return { success: false, error: result.error || 'Login failed' }
      }
    } catch (error) {
      return { success: false, error: 'An error occurred during login' }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    await AuthService.logout()
    setUser(null)
  }

  const hasPermission = (permission: string): boolean => {
    return AuthService.hasPermission(permission)
  }

  const hasAnyPermission = (permissions: string[]): boolean => {
    return AuthService.hasAnyPermission(permissions)
  }

  const hasAllPermissions = (permissions: string[]): boolean => {
    return AuthService.hasAllPermissions(permissions)
  }

  const getUserRole = (): string | null => {
    return AuthService.getUserRole()
  }

  const canWrite = (permission: string): boolean => {
    return AuthService.canWrite(permission)
  }

  const canDelete = (permission: string): boolean => {
    return AuthService.canDelete(permission)
  }

  const isReadOnly = (): boolean => {
    return AuthService.isReadOnly()
  }

  const value = {
    user,
    loading,
    login,
    logout,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getUserRole,
    canWrite,
    canDelete,
    isReadOnly
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
