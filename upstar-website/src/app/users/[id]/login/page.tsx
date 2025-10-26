"use client"
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

type User = {
  id: string
  name: string | null
  email: string
  active: boolean
  roles: string[]
  createdAt: string
  updatedAt: string
}

export default function LoginAsUserPage() {
  const params = useParams()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [confirming, setConfirming] = useState(false)

  // Initialize with mock data
  useEffect(() => {
    setLoading(true)
    const userId = params.id as string
    const mockUser = {
      id: userId,
      name: 'John Doe',
      email: 'john@example.com',
      active: true,
      roles: ['user'],
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01'
    }
    setUser(mockUser)
    setLoading(false)
  }, [params.id])

  const handleLoginAsUser = async () => {
    if (!user) return
    
    setConfirming(true)
    
    try {
      // Here you would implement the actual login as user functionality
      console.log(`Logging in as user: ${user.name}`)
      
      // Simulate API call with faster response
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // In a real app, you would redirect to the user's dashboard
      alert(`Successfully logged in as ${user.name}. You are now viewing the platform from their perspective.`)
      
      // For demo purposes, redirect back to users list
      router.push('/users')
    } catch (error) {
      console.error('Error logging in as user:', error)
      alert('Failed to login as user. Please try again.')
    } finally {
      setConfirming(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-[var(--text-primary)]">User not found</h3>
        <p className="text-[var(--text-secondary)] mt-1">The user you're looking for doesn't exist.</p>
        <Link href="/users" className="btn-primary mt-4 inline-block">
          Back to Users
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Login as User</h1>
          <p className="text-[var(--text-secondary)] mt-1">Impersonate {user.name} to view their experience</p>
        </div>
        <Link href="/users" className="btn-secondary">
          ← Back to Users
        </Link>
      </div>

      {/* Warning Card */}
      <div className="card p-6 border-yellow-500/30 bg-yellow-500/10">
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 text-yellow-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <div>
            <h3 className="text-lg font-semibold text-yellow-500">Security Warning</h3>
            <p className="text-[var(--text-secondary)] mt-1">
              You are about to impersonate <strong>{user.name}</strong>. This action will log you in as this user and you will see the platform from their perspective. 
              All actions performed will be attributed to this user.
            </p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="card p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-[var(--accent)] rounded-full flex items-center justify-center text-white font-bold text-xl">
            {(user.name || user.email).split(' ').map(n => n[0]).join('').toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">{user.name}</h2>
            <p className="text-[var(--text-secondary)]">{user.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                user.active 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {user.active ? 'Active' : 'Inactive'}
              </span>
              <div className="flex flex-wrap gap-1">
                {user.roles.map((role, index) => (
                  <span key={index} className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    role === 'admin' 
                      ? 'bg-purple-100 text-purple-800' 
                      : role === 'moderator'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {role}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button 
          onClick={handleLoginAsUser}
          disabled={confirming}
          className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {confirming ? 'Logging in...' : `Login as ${user.name}`}
        </button>
        <Link href={`/users/${user.id}`} className="btn-secondary">
          View Profile Instead
        </Link>
        <Link href="/users" className="btn-secondary">
          Cancel
        </Link>
      </div>
    </div>
  )
}
