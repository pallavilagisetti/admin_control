"use client"
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

// Navigation items with their required permissions
const NAVIGATION_ITEMS = [
  {
    path: '/',
    label: 'Dashboard',
    icon: 'dashboard',
    permissions: ['analytics:read'] // All roles can access dashboard
  },
  {
    path: '/users',
    label: 'Users',
    icon: 'users',
    permissions: ['users:read']
  },
  {
    path: '/resumes',
    label: 'Resumes',
    icon: 'resumes',
    permissions: ['resumes:read']
  },
  {
    path: '/skills',
    label: 'Skills',
    icon: 'skills',
    permissions: ['skills:read']
  },
  {
    path: '/jobs',
    label: 'Jobs',
    icon: 'jobs',
    permissions: ['jobs:read']
  },
  {
    path: '/analytics',
    label: 'Analytics',
    icon: 'analytics',
    permissions: ['analytics:read']
  },
  {
    path: '/payments',
    label: 'Payments',
    icon: 'payments',
    permissions: ['payments:read']
  },
  {
    path: '/ai-settings',
    label: 'AI Settings',
    icon: 'ai-settings',
    permissions: ['ai-settings:read']
  },
  {
    path: '/cms',
    label: 'CMS',
    icon: 'cms',
    permissions: ['cms:read']
  },
  {
    path: '/notifications',
    label: 'Notifications',
    icon: 'notifications',
    permissions: ['notifications:read']
  },
  {
    path: '/system-health',
    label: 'System Health',
    icon: 'system-health',
    permissions: ['system-health:read']
  }
]

// Icon components for navigation items
const DashboardIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
  </svg>
)

const UsersIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
  </svg>
)

const ResumesIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

const SkillsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
)

const JobsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h18M3 17h18" />
  </svg>
)

const AnalyticsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3v18M6 8v13M16 13v8M21 6v15" />
  </svg>
)

const PaymentsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m4 0h1M5 7h14a2 2 0 012 2v7a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2z" />
  </svg>
)

const AISettingsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zM3 12h2m14 0h2M12 3v2m0 14v2m-7.07-9.07l1.41 1.41m10.32 0l1.41-1.41M6.34 17.66l1.41-1.41m8.49 0l1.41 1.41" />
  </svg>
)

const CMSIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 20l9-5-9-5-9 5 9 5z" />
  </svg>
)

const NotificationsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
)

const SystemHealthIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 13h4l3 7 4-14 3 7h4" />
  </svg>
)

// Icon mapping
const iconMap = {
  dashboard: DashboardIcon,
  users: UsersIcon,
  resumes: ResumesIcon,
  skills: SkillsIcon,
  jobs: JobsIcon,
  analytics: AnalyticsIcon,
  payments: PaymentsIcon,
  'ai-settings': AISettingsIcon,
  cms: CMSIcon,
  notifications: NotificationsIcon,
  'system-health': SystemHealthIcon
}

export default function RoleBasedNavigation() {
  const pathname = usePathname()
  const { hasAnyPermission } = useAuth()
  
  // Filter navigation items based on user permissions
  const accessibleRoutes = NAVIGATION_ITEMS.filter(item => 
    hasAnyPermission(item.permissions)
  )

  const getIcon = (iconName: string) => {
    const IconComponent = iconMap[iconName as keyof typeof iconMap]
    return IconComponent ? <IconComponent /> : null
  }

  return (
    <nav className="space-y-2">
      {accessibleRoutes.map((item) => {
        const isActive = pathname === item.path
        return (
          <Link
            key={item.path}
            href={item.path as any}
            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
              isActive
                ? 'text-[var(--accent)] bg-[var(--border)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--border)]'
            }`}
          >
            {getIcon(item.icon)}
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
