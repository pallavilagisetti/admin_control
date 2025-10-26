"use client"
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function UserProfile() {
  const { user, logout, getUserRole } = useAuth()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  if (!user) return null

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--border)]/50 transition-colors"
      >
        <div className="w-8 h-8 bg-[var(--accent)] rounded-full flex items-center justify-center text-white text-sm font-medium">
          {user.email?.charAt(0).toUpperCase() || 'A'}
        </div>
        <div className="text-left">
          <div className="text-sm font-medium text-[var(--text-primary)]">
            {user.name}
          </div>
          <div className="text-xs text-[var(--text-secondary)]">
            {user.email}
          </div>
          <div className="text-xs text-[var(--accent)] font-medium">
            {getUserRole()}
          </div>
        </div>
        <svg className="w-4 h-4 text-[var(--text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {showDropdown && (
        <div className="absolute right-0 top-12 z-50 w-64 bg-[var(--card)] border border-[var(--border)] rounded-md shadow-lg">
          <div className="p-4">
            <div className="mb-4">
              <h3 className="text-sm font-medium text-[var(--text-primary)] mb-2">User Information</h3>
              <div className="space-y-2 text-xs text-[var(--text-secondary)]">
                <div>
                  <span className="font-medium">Email:</span> {user.email}
                </div>
                <div>
                  <span className="font-medium">Name:</span> {user.name}
                </div>
                <div>
                  <span className="font-medium">Role:</span> {getUserRole()}
                </div>
                <div>
                  <span className="font-medium">User ID:</span> {user.id}
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
