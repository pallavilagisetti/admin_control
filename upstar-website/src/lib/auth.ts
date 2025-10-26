// JWT-based Authentication System
// This file handles JWT token management and user authentication

export interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'editor' | 'viewer'
  permissions: string[]
}

export interface AuthTokens {
  accessToken: string
  refreshToken: string
}

// Mock user database - replace with your actual user data
export const USERS_DATABASE: Record<string, { password: string; user: User }> = {
  'pallavigisetti12003@gmail.com': {
    password: 'admin123', // Change this to your desired password
    user: {
      id: '1',
      email: 'pallavigisetti12003@gmail.com',
      name: 'Pallavi Gisetti',
      role: 'admin',
      permissions: [
        'users:read', 'users:write', 'users:delete',
        'resumes:read', 'resumes:write', 'resumes:delete',
        'skills:read', 'skills:write', 'skills:delete',
        'jobs:read', 'jobs:write', 'jobs:delete',
        'analytics:read', 'payments:read', 'payments:write',
        'ai-settings:read', 'ai-settings:write',
        'cms:read', 'cms:write',
        'notifications:read', 'notifications:write',
        'system-health:read'
      ]
    }
  },
  'lagisettipallavi607@gmail.com': {
    password: 'editor123', // Change this to your desired password
    user: {
      id: '2',
      email: 'lagisettipallavi607@gmail.com',
      name: 'Pallavi Lagisetti',
      role: 'editor',
      permissions: [
        'resumes:read', 'resumes:write', 'resumes:delete',
        'skills:read', 'skills:write', 'skills:delete',
        'jobs:read', 'jobs:write', 'jobs:delete',
        'analytics:read', 'system-health:read'
      ]
    }
  },
  'pallusweety67@gmail.com': {
    password: 'viewer123', // Change this to your desired password
    user: {
      id: '3',
      email: 'pallusweety67@gmail.com',
      name: 'Pallavi Sweety',
      role: 'viewer',
      permissions: [
        // Read-only access to all sections
        'users:read', 'resumes:read', 'skills:read', 'jobs:read',
        'analytics:read', 'payments:read', 'ai-settings:read',
        'cms:read', 'notifications:read', 'system-health:read'
      ]
    }
  }
}

// JWT Token Management
export class JWTManager {
  private static readonly ACCESS_TOKEN_KEY = 'admin_access_token'
  private static readonly REFRESH_TOKEN_KEY = 'admin_refresh_token'
  private static readonly USER_KEY = 'admin_user'

  // Generate a proper JWT token
  static generateToken(payload: any): string {
    // Simple JWT-like token for frontend (browser compatible)
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
    const data = btoa(JSON.stringify(payload))
    const signature = btoa('mock-signature')
    return `${header}.${data}.${signature}`
  }

  // Verify and decode token
  static verifyToken(token: string): any {
    try {
      const parts = token.split('.')
      if (parts.length !== 3) return null
      
      const payload = JSON.parse(atob(parts[1]))
      
      // Check if token is expired
      if (payload.exp && Date.now() > payload.exp) {
        return null
      }
      
      return payload
    } catch {
      return null
    }
  }

  // Store tokens in localStorage
  static setTokens(tokens: AuthTokens): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.accessToken)
      localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refreshToken)
    }
  }

  // Get access token
  static getAccessToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.ACCESS_TOKEN_KEY)
    }
    return null
  }

  // Get refresh token
  static getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(this.REFRESH_TOKEN_KEY)
    }
    return null
  }

  // Clear all tokens
  static clearTokens(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.ACCESS_TOKEN_KEY)
      localStorage.removeItem(this.REFRESH_TOKEN_KEY)
      localStorage.removeItem(this.USER_KEY)
    }
  }

  // Store user data
  static setUser(user: User): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.USER_KEY, JSON.stringify(user))
    }
  }

  // Get user data
  static getUser(): User | null {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem(this.USER_KEY)
      return userData ? JSON.parse(userData) : null
    }
    return null
  }

  // Check if user is authenticated
  static isAuthenticated(): boolean {
    const token = this.getAccessToken()
    if (!token) return false
    
    const payload = this.verifyToken(token)
    return payload !== null
  }

  // Get current user
  static getCurrentUser(): User | null {
    if (!this.isAuthenticated()) return null
    return this.getUser()
  }
}

// Authentication service
export class AuthService {
  // Login with email and password
  static async login(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    const userData = USERS_DATABASE[email]
    
    if (!userData || userData.password !== password) {
      return { success: false, error: 'Invalid email or password' }
    }

    // Generate tokens
    const accessToken = JWTManager.generateToken({
      userId: userData.user.id,
      email: userData.user.email,
      role: userData.user.role,
      exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
    })

    const refreshToken = JWTManager.generateToken({
      userId: userData.user.id,
      type: 'refresh',
      exp: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
    })

    // Store tokens and user data
    JWTManager.setTokens({ accessToken, refreshToken })
    JWTManager.setUser(userData.user)

    return { success: true, user: userData.user }
  }

  // Logout
  static async logout(): Promise<void> {
    JWTManager.clearTokens()
  }

  // Check if user has permission
  static hasPermission(permission: string): boolean {
    const user = JWTManager.getCurrentUser()
    if (!user) return false
    return user.permissions.includes(permission)
  }

  // Check if user has any of the required permissions
  static hasAnyPermission(permissions: string[]): boolean {
    const user = JWTManager.getCurrentUser()
    if (!user) return false
    return permissions.some(permission => user.permissions.includes(permission))
  }

  // Check if user has all required permissions
  static hasAllPermissions(permissions: string[]): boolean {
    const user = JWTManager.getCurrentUser()
    if (!user) return false
    return permissions.every(permission => user.permissions.includes(permission))
  }

  // Get user role
  static getUserRole(): string | null {
    const user = JWTManager.getCurrentUser()
    return user?.role || null
  }

  // Check if user can perform write operations
  static canWrite(permission: string): boolean {
    const user = JWTManager.getCurrentUser()
    if (!user) return false
    
    // Check for write permissions
    const writePermission = permission.replace(':read', ':write')
    return user.permissions.includes(writePermission)
  }

  // Check if user can perform delete operations
  static canDelete(permission: string): boolean {
    const user = JWTManager.getCurrentUser()
    if (!user) return false
    
    // Check for delete permissions
    const deletePermission = permission.replace(':read', ':delete')
    return user.permissions.includes(deletePermission)
  }

  // Check if user is read-only
  static isReadOnly(): boolean {
    const user = JWTManager.getCurrentUser()
    if (!user) return true
    
    // Check if user has any write permissions
    const hasWritePermissions = user.permissions.some(permission => 
      permission.includes(':write') || permission.includes(':delete')
    )
    
    return !hasWritePermissions
  }
}
