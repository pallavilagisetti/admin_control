"use client"
import { useAuth } from '@/contexts/AuthContext'

interface ReadOnlyIndicatorProps {
  children: React.ReactNode
  permission?: string
  className?: string
}

export default function ReadOnlyIndicator({ 
  children, 
  permission = '', 
  className = '' 
}: ReadOnlyIndicatorProps) {
  const { isReadOnly, canWrite } = useAuth()
  
  const isDisabled: boolean = !!(isReadOnly() || (!!permission && !canWrite(permission)))

  if (isDisabled) {
    return (
      <div className={`relative ${className}`}>
        {children}
        <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-[1px] rounded-md flex items-center justify-center">
          <div className="bg-yellow-600 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.726-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Read Only
          </div>
        </div>
      </div>
    )
  }
  
  return <>{children}</>
}

// Component for read-only buttons
export function ReadOnlyButton({ 
  children, 
  permission = '', 
  onClick,
  className = '',
  ...props 
}: ReadOnlyIndicatorProps & {
  onClick?: (e: any) => void
  [key: string]: any
}) {
  const { isReadOnly, canWrite } = useAuth()
  
  const isDisabled: boolean = !!(isReadOnly() || (!!permission && !canWrite(permission)))

  return (
    <button
      {...props}
      onClick={isDisabled ? (e: any) => {
        e.preventDefault()
        e.stopPropagation()
        alert('You do not have permission to perform this action. Contact an administrator.')
        return false
      } : (e: any) => onClick?.(e)}
      disabled={!!isDisabled}
      className={`${className} ${isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
      style={isDisabled ? { pointerEvents: 'none' } : {}}
    >
      {children}
      {isDisabled && (
        <span className="ml-2 text-xs text-red-400 font-medium">
          (No Permission)
        </span>
      )}
    </button>
  )
}

// Component for read-only form fields
export function ReadOnlyInput({ 
  children, 
  permission = '', 
  className = '',
  ...props 
}: ReadOnlyIndicatorProps & {
  [key: string]: any
}) {
  const { isReadOnly, canWrite } = useAuth()
  
  const isDisabled: boolean = !!(isReadOnly() || (!!permission && !canWrite(permission)))

  return (
    <div className={`relative ${className}`}>
      {children}
      {isDisabled && (
        <div className="absolute inset-0 bg-gray-900/30 rounded pointer-events-none flex items-center justify-end pr-2">
          <span className="text-xs text-red-400 font-medium">No Permission</span>
        </div>
      )}
    </div>
  )
}

// Component to completely disable all interactions for Viewers
export function ViewerRestricted({ 
  children, 
  permission = '', 
  className = '',
  showWarning = true 
}: ReadOnlyIndicatorProps & {
  showWarning?: boolean
}) {
  const { isReadOnly, canWrite } = useAuth()
  
  const isDisabled: boolean = !!(isReadOnly() || (!!permission && !canWrite(permission)))

  if (isDisabled) {
    return (
      <div className={`relative ${className}`}>
        <div 
          className="pointer-events-none select-none"
          style={{ 
            filter: 'grayscale(0.3)',
            opacity: 0.7
          }}
        >
          {children}
        </div>
        {showWarning && (
          <div className="absolute inset-0 bg-red-900/20 backdrop-blur-[1px] rounded-md flex items-center justify-center">
            <div className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-lg">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.726-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              View Only - No Edit Permission
            </div>
          </div>
        )}
      </div>
    )
  }
  
  return <>{children}</>
}

// Component to disable form submissions for Viewers
export function ReadOnlyForm({ 
  children, 
  permission = '', 
  className = '',
  onSubmit,
  ...props 
}: ReadOnlyIndicatorProps & {
  onSubmit?: (e: any) => void
  [key: string]: any
}) {
  const { isReadOnly, canWrite } = useAuth()
  
  const isDisabled: boolean = !!(isReadOnly() || (!!permission && !canWrite(permission)))

  const handleSubmit = (e: any) => {
    if (isDisabled) {
      e.preventDefault()
      e.stopPropagation()
      alert('You do not have permission to submit this form. Contact an administrator.')
      return false
    }
    return onSubmit?.(e)
  }
  
  return (
    <form 
      {...props}
      onSubmit={handleSubmit}
      className={`${className} ${isDisabled ? 'pointer-events-none' : ''}`}
      style={isDisabled ? { pointerEvents: 'none' } : {}}
    >
      {children}
      {isDisabled && (
        <div className="absolute inset-0 bg-gray-900/50 rounded flex items-center justify-center">
          <span className="text-red-400 text-sm font-medium">Form submission disabled</span>
        </div>
      )}
    </form>
  )
}
