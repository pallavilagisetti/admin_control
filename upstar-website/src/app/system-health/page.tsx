"use client"
import { useEffect, useState } from 'react'

interface HealthMetric {
  label: string
  value: number
  status: 'excellent' | 'good' | 'warning' | 'critical'
  trend: 'up' | 'down' | 'stable'
  lastUpdated: string
}

interface SystemStatus {
  overall: 'healthy' | 'warning' | 'critical'
  uptime: string
  lastIncident: string | null
  activeAlerts: number
}

export default function SystemHealthPage() {
  const [metrics, setMetrics] = useState<HealthMetric[]>([])
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate fetching real-time data
    const fetchHealthData = () => {
      const mockMetrics: HealthMetric[] = [
        {
          label: 'AI Processing',
          value: Math.floor(Math.random() * 10) + 90,
          status: 'excellent',
          trend: 'up',
          lastUpdated: new Date().toISOString()
        },
        {
          label: 'Database Performance',
          value: Math.floor(Math.random() * 15) + 85,
          status: 'good',
          trend: 'stable',
          lastUpdated: new Date().toISOString()
        },
        {
          label: 'API Response Time',
          value: Math.floor(Math.random() * 20) + 80,
          status: 'good',
          trend: 'up',
          lastUpdated: new Date().toISOString()
        },
        {
          label: 'User Satisfaction',
          value: Math.floor(Math.random() * 10) + 90,
          status: 'excellent',
          trend: 'up',
          lastUpdated: new Date().toISOString()
        },
        {
          label: 'Server Load',
          value: Math.floor(Math.random() * 30) + 60,
          status: 'warning',
          trend: 'down',
          lastUpdated: new Date().toISOString()
        },
        {
          label: 'Memory Usage',
          value: Math.floor(Math.random() * 25) + 70,
          status: 'good',
          trend: 'stable',
          lastUpdated: new Date().toISOString()
        }
      ]

      const mockSystemStatus: SystemStatus = {
        overall: 'healthy',
        uptime: '99.9%',
        lastIncident: '2024-01-15T10:30:00Z',
        activeAlerts: 2
      }

      setMetrics(mockMetrics)
      setSystemStatus(mockSystemStatus)
      setLoading(false)
    }

    fetchHealthData()
    const interval = setInterval(fetchHealthData, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'excellent': return 'text-green-400'
      case 'good': return 'text-blue-400'
      case 'warning': return 'text-yellow-400'
      case 'critical': return 'text-red-400'
      default: return 'text-gray-400'
    }
  }

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'excellent': return 'bg-green-500'
      case 'good': return 'bg-blue-500'
      case 'warning': return 'bg-yellow-500'
      case 'critical': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return '↗'
      case 'down': return '↘'
      case 'stable': return '→'
      default: return '→'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]"></div>
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      {/* Header */}
      <section className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">System Health</h1>
            <p className="text-[var(--text-secondary)] mt-1">Real-time performance monitoring and system status</p>
          </div>
          <div className="flex items-center gap-4">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              systemStatus?.overall === 'healthy' ? 'bg-green-100 text-green-800' :
              systemStatus?.overall === 'warning' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
              {systemStatus?.overall === 'healthy' ? '✓ All Systems Operational' :
               systemStatus?.overall === 'warning' ? '⚠ Warning' : '✗ Critical Issues'}
            </div>
            <div className="text-sm text-[var(--text-secondary)]">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </div>
      </section>

      {/* System Overview */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="metric-card p-6">
          <div className="text-sm text-[var(--text-secondary)]">System Uptime</div>
          <div className="mt-2 text-3xl font-bold text-green-400">{systemStatus?.uptime}</div>
          <div className="mt-1 text-xs text-[var(--text-secondary)]">Last 30 days</div>
        </div>
        <div className="metric-card p-6">
          <div className="text-sm text-[var(--text-secondary)]">Active Alerts</div>
          <div className="mt-2 text-3xl font-bold text-yellow-400">{systemStatus?.activeAlerts}</div>
          <div className="mt-1 text-xs text-[var(--text-secondary)]">Requires attention</div>
        </div>
        <div className="metric-card p-6">
          <div className="text-sm text-[var(--text-secondary)]">Last Incident</div>
          <div className="mt-2 text-lg font-bold text-[var(--text-primary)]">
            {systemStatus?.lastIncident ? 
              new Date(systemStatus.lastIncident).toLocaleDateString() : 
              'None'
            }
          </div>
          <div className="mt-1 text-xs text-[var(--text-secondary)]">System recovery</div>
        </div>
        <div className="metric-card p-6">
          <div className="text-sm text-[var(--text-secondary)]">Response Time</div>
          <div className="mt-2 text-3xl font-bold text-blue-400">127ms</div>
          <div className="mt-1 text-xs text-green-400">-5ms vs last hour</div>
        </div>
      </div>

      {/* Performance Metrics */}
      <section className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Performance Metrics</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {metrics.map((metric, index) => (
            <div key={index} className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-[var(--text-primary)]">{metric.label}</div>
                <div className={`text-xs px-2 py-1 rounded-full ${getStatusColor(metric.status)}`}>
                  {metric.status}
                </div>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <div className="text-2xl font-bold text-[var(--text-primary)]">{metric.value}%</div>
                <div className={`text-sm ${getStatusColor(metric.status)}`}>
                  {getTrendIcon(metric.trend)}
                </div>
              </div>
              <div className="h-2 rounded bg-white/10 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${getStatusBg(metric.status)}`}
                  style={{ width: `${metric.value}%` }}
                />
              </div>
              <div className="text-xs text-[var(--text-secondary)] mt-2">
                Updated: {new Date(metric.lastUpdated).toLocaleTimeString()}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Activity */}
      <section className="card p-6">
        <h2 className="text-xl font-semibold mb-4">System Activity</h2>
        <div className="space-y-3">
          {[
            { action: 'Database backup completed', time: '2 minutes ago', status: 'success' },
            { action: 'AI model updated', time: '15 minutes ago', status: 'success' },
            { action: 'High memory usage detected', time: '1 hour ago', status: 'warning' },
            { action: 'API rate limit reached', time: '2 hours ago', status: 'warning' },
            { action: 'System maintenance completed', time: '3 hours ago', status: 'success' }
          ].map((activity, index) => (
            <div key={index} className="flex items-center justify-between bg-white/5 rounded-md px-4 py-3">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  activity.status === 'success' ? 'bg-green-400' :
                  activity.status === 'warning' ? 'bg-yellow-400' : 'bg-red-400'
                }`} />
                <div>
                  <div className="font-medium text-[var(--text-primary)]">{activity.action}</div>
                  <div className="text-xs text-[var(--text-secondary)]">{activity.time}</div>
                </div>
              </div>
              <div className={`text-xs px-2 py-1 rounded-full ${
                activity.status === 'success' ? 'bg-green-100 text-green-800' :
                activity.status === 'warning' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
              }`}>
                {activity.status}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}



