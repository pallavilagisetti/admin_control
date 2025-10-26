"use client"
import { useAuth } from '@/contexts/AuthContext'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function AccessDeniedPage() {
  const { user, logout, getUserRole } = useAuth()
  const router = useRouter()

  const handleGoBack = () => {
    router.back()
  }

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="max-w-md w-full space-y-8 p-8 text-center">
        <div>
          <div className="mx-auto h-16 w-16 bg-red-600 rounded-full flex items-center justify-center">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-white">
            Access Denied
          </h2>
          <p className="mt-2 text-gray-400">
            You don't have permission to access this page
          </p>
        </div>

        <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
          <h3 className="text-lg font-semibold text-white mb-4">Current User Information</h3>
          {user && (
            <div className="text-left space-y-2">
              <p className="text-sm text-gray-300">
                <span className="font-medium">Email:</span> {user.email}
              </p>
              <p className="text-sm text-gray-300">
                <span className="font-medium">Name:</span> {user.name}
              </p>
              <p className="text-sm text-gray-300">
                <span className="font-medium">Role:</span> {getUserRole()}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="text-sm text-gray-400">
            <p>Your current role ({getUserRole()}) doesn't have the required permissions to access this page.</p>
            <p className="mt-2">Please contact an administrator if you believe this is an error.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleGoBack}
              className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Go Back
            </button>
            <Link
              href="/"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors text-center"
            >
              Go to Dashboard
            </Link>
            <button
              onClick={handleLogout}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>

        <div className="text-xs text-gray-500">
          <p>If you continue to see this error, please contact your system administrator.</p>
        </div>
      </div>
    </div>
  )
}

