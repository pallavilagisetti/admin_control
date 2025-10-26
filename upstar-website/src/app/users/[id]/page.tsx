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

export default function UserProfilePage() {
  const params = useParams()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

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

  const handleSuspendAccount = async () => {
    if (!user) return
    
    const confirmed = window.confirm(`Are you sure you want to suspend ${user.name}'s account?`)
    if (confirmed) {
      try {
        // Here you would make an API call to suspend the account
        console.log(`Account suspended for: ${user.name}`)
        alert(`${user.name}'s account has been suspended successfully.`)
        router.push('/users')
      } catch (error) {
        console.error('Error suspending account:', error)
        alert('Failed to suspend account. Please try again.')
      }
    }
  }

  const handleActivateAccount = async () => {
    if (!user) return
    
    const confirmed = window.confirm(`Are you sure you want to activate ${user.name}'s account?`)
    if (confirmed) {
      try {
        // Here you would make an API call to activate the account
        console.log(`Account activated for: ${user.name}`)
        alert(`${user.name}'s account has been activated successfully.`)
        router.push('/users')
      } catch (error) {
        console.error('Error activating account:', error)
        alert('Failed to activate account. Please try again.')
      }
    }
  }

  const handleDeactivateAccount = async () => {
    if (!user) return
    
    const confirmed = window.confirm(`Are you sure you want to deactivate ${user.name}'s account?`)
    if (confirmed) {
      try {
        // Here you would make an API call to deactivate the account
        console.log(`Account deactivated for: ${user.name}`)
        alert(`${user.name}'s account has been deactivated successfully.`)
        router.push('/users')
      } catch (error) {
        console.error('Error deactivating account:', error)
        alert('Failed to deactivate account. Please try again.')
      }
    }
  }

  const handleSendMessage = () => {
    if (!user) return
    window.location.href = `mailto:${user.email}?subject=Message from SkillGraph AI Admin`
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
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">User Profile</h1>
          <p className="text-[var(--text-secondary)] mt-1">Detailed information about {user.name}</p>
        </div>
        <Link href="/users" className="btn-secondary">
          ← Back to Users
        </Link>
      </div>

      {/* User Info Card */}
      <div className="card p-6">
        <div className="flex items-start gap-6">
          <div className="w-20 h-20 bg-[var(--accent)] rounded-full flex items-center justify-center text-white font-bold text-2xl">
            {(user.name || user.email).split(' ').map(n => n[0]).join('').toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-4 mb-4">
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">{user.name}</h2>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
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
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-[var(--text-secondary)]">Email</label>
                <p className="text-[var(--text-primary)]">{user.email}</p>
              </div>
              <div>
                <label className="text-sm text-[var(--text-secondary)]">User ID</label>
                <p className="text-[var(--text-primary)] font-mono text-sm">{user.id}</p>
              </div>
              <div>
                <label className="text-sm text-[var(--text-secondary)]">Created</label>
                <p className="text-[var(--text-primary)]">{new Date(user.createdAt).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="text-sm text-[var(--text-secondary)]">Last Updated</label>
                <p className="text-[var(--text-primary)]">{new Date(user.updatedAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="metric-card p-6">
          <div className="text-sm text-[var(--text-secondary)]">Account Status</div>
          <div className="mt-2 text-3xl font-bold">{user.active ? 'Active' : 'Inactive'}</div>
          <div className="mt-1 text-xs text-[var(--text-secondary)]">Current status</div>
        </div>
        <div className="metric-card p-6">
          <div className="text-sm text-[var(--text-secondary)]">Roles</div>
          <div className="mt-2 text-3xl font-bold">{user.roles.length}</div>
          <div className="mt-1 text-xs text-[var(--text-secondary)]">Assigned roles</div>
        </div>
        <div className="metric-card p-6">
          <div className="text-sm text-[var(--text-secondary)]">Account Age</div>
          <div className="mt-2 text-3xl font-bold">{Math.floor((Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24))} days</div>
          <div className="mt-1 text-xs text-[var(--text-secondary)]">Since registration</div>
        </div>
      </div>

      {/* Actions */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Actions</h3>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={handleSendMessage}
            className="btn-primary"
          >
            Send Message
          </button>
          <Link 
            href={`/users/${user.id}/login`}
            className="btn-secondary"
          >
            Login as User
          </Link>
          
          {/* Account management buttons */}
          {!user.active && (
            <button 
              onClick={() => alert('User activated')}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Activate User
            </button>
          )}
          
          {user.active && (
            <button 
              onClick={() => alert('User deactivated')}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              Deactivate User
            </button>
          )}
          
          <button 
            onClick={() => alert('User data export functionality would be implemented here')}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            Export User Data
          </button>
        </div>
      </div>
    </div>
  )
}