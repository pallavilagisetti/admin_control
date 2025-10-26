"use client"
import { useEffect, useMemo, useState } from 'react'
import { ReadOnlyButton } from '@/components/ReadOnlyIndicator'
import { useAuth } from '@/contexts/AuthContext'

type Job = {
  id: string
  title: string
  company: string
  location: string
  salary: string
  type: 'Full-time' | 'Part-time' | 'Contract'
  status: 'Active' | 'Paused' | 'Closed'
  applications: number
  postedDate: string
}

type NewJob = Omit<Job, 'id' | 'applications' | 'postedDate'>

export default function JobsPage() {
  const { canWrite } = useAuth()
  const [jobs, setJobs] = useState<Job[]>([
    {
      id: '1',
      title: 'Senior React Developer',
      company: 'TechCorp Inc.',
      location: 'Remote',
      salary: '$120k - $160k',
      type: 'Full-time',
      status: 'Active',
      applications: 45,
      postedDate: '2024-03-20'
    },
    {
      id: '2',
      title: 'Data Scientist',
      company: 'DataFlow Labs',
      location: 'New York, NY',
      salary: '$130k - $180k',
      type: 'Full-time',
      status: 'Active',
      applications: 32,
      postedDate: '2024-03-18'
    },
    {
      id: '3',
      title: 'Product Manager',
      company: 'StartupXYZ',
      location: 'San Francisco, CA',
      salary: '$140k - $200k',
      type: 'Full-time',
      status: 'Paused',
      applications: 67,
      postedDate: '2024-03-15'
    }
  ])
  const [showAddModal, setShowAddModal] = useState(false)
  const [newJob, setNewJob] = useState<NewJob>({
    title: '',
    company: '',
    location: '',
    salary: '',
    type: 'Full-time',
    status: 'Active'
  })
  const [activeCount, setActiveCount] = useState(1247)
  const [applications, setApplications] = useState(8942)
  const [avgSalary, setAvgSalary] = useState('$142k')
  const [remotePct, setRemotePct] = useState(68)
  const [actionJob, setActionJob] = useState<Job | null>(null)
  const [showAction, setShowAction] = useState<string | null>(null)

  const addJob = () => {
    if (!newJob.title || !newJob.company || !newJob.location || !newJob.salary) {
      alert('Please fill in all required fields')
      return
    }

    const job: Job = {
      ...newJob,
      id: Date.now().toString(),
      applications: 0,
      postedDate: new Date().toISOString().split('T')[0]
    }

    setJobs(prev => [job, ...prev])
    setNewJob({
      title: '',
      company: '',
      location: '',
      salary: '',
      type: 'Full-time',
      status: 'Active'
    })
    setShowAddModal(false)
  }

  const updateJobStatus = (jobId: string, newStatus: Job['status']) => {
    setJobs(prev => prev.map(job => 
      job.id === jobId ? { ...job, status: newStatus } : job
    ))
  }

  const deleteJob = (jobId: string) => {
    setJobs(prev => prev.filter(job => job.id !== jobId))
  }

  const pauseJob = (jobId: string) => updateJobStatus(jobId, 'Paused')
  const activateJob = (jobId: string) => updateJobStatus(jobId, 'Active')
  const closeJob = (jobId: string) => updateJobStatus(jobId, 'Closed')

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="card p-6">
        <h1 className="text-3xl font-bold">Jobs Management</h1>
        <p className="text-[var(--text-secondary)] mt-1">Manage job postings and track applications</p>
      </section>

      {/* KPI tiles */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
              <span className="text-blue-400">📋</span>
            </div>
            <div className="text-sm text-[var(--text-secondary)]">Active Jobs</div>
          </div>
          <div className="text-3xl font-bold">{activeCount.toLocaleString()}</div>
          <div className="mt-1 text-xs text-green-400">+67 this week</div>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
              <span className="text-green-400">⏰</span>
            </div>
            <div className="text-sm text-[var(--text-secondary)]">Applications</div>
          </div>
          <div className="text-3xl font-bold">{applications.toLocaleString()}</div>
          <div className="mt-1 text-xs text-green-400">+234 today</div>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <span className="text-yellow-400">💰</span>
            </div>
            <div className="text-sm text-[var(--text-secondary)]">Avg Salary</div>
          </div>
          <div className="text-3xl font-bold">{avgSalary}</div>
          <div className="mt-1 text-xs text-green-400">+8.2% vs last quarter</div>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
              <span className="text-purple-400">📍</span>
            </div>
            <div className="text-sm text-[var(--text-secondary)]">Remote Jobs</div>
          </div>
          <div className="text-3xl font-bold">{remotePct}%</div>
          <div className="mt-1 text-xs text-[var(--text-secondary)]">847 remote positions</div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Job Listings</h2>
          <p className="text-[var(--text-secondary)] text-sm">All active and managed job postings</p>
        </div>
        <ReadOnlyButton 
          onClick={() => setShowAddModal(true)}
          permission="jobs:write"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <span>+</span> Add Job
        </ReadOnlyButton>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-[var(--text-primary)]">Job Title</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[var(--text-primary)]">Company</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[var(--text-primary)]">Location</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[var(--text-primary)]">Salary</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[var(--text-primary)]">Type</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[var(--text-primary)]">Status</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[var(--text-primary)]">Applications</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-[var(--text-primary)]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {jobs.map(job => (
                <tr key={job.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium">{job.title}</div>
                      <div className="text-xs text-[var(--text-secondary)]">Posted {job.postedDate}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{job.company}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <span className="text-sm">📍</span>
                      {job.location}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium">{job.salary}</td>
                  <td className="px-6 py-4">{job.type}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      job.status === 'Active' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 
                      job.status === 'Paused' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 
                      'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/20 text-blue-400 text-sm font-medium">
                      {job.applications}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right relative">
                    <button 
                      onClick={() => setShowAction(showAction === job.id ? null : job.id)}
                      className="px-2 py-1.5 border border-white/10 rounded-md hover:bg-white/10 text-sm"
                    >
                      Actions ▾
                    </button>
                    {showAction === job.id && (
                      <div className="absolute right-6 mt-2 w-52 bg-[var(--card-bg)] border border-white/10 rounded-md shadow-lg z-20">
                        <button onClick={() => { setActionJob(job); setShowAction(null) }} className="w-full text-left px-3 py-2 hover:bg-white/5 text-sm">View details</button>
                        {job.status !== 'Active' && (
                          <ReadOnlyButton onClick={() => { activateJob(job.id); setShowAction(null) }} permission="jobs:write" className="w-full text-left px-3 py-2 hover:bg-white/5 text-sm">Activate</ReadOnlyButton>
                        )}
                        {job.status === 'Active' && (
                          <ReadOnlyButton onClick={() => { pauseJob(job.id); setShowAction(null) }} permission="jobs:write" className="w-full text-left px-3 py-2 hover:bg-white/5 text-sm">Pause</ReadOnlyButton>
                        )}
                        {job.status !== 'Closed' && (
                          <ReadOnlyButton onClick={() => { closeJob(job.id); setShowAction(null) }} permission="jobs:write" className="w-full text-left px-3 py-2 hover:bg-white/5 text-sm">Close</ReadOnlyButton>
                        )}
                        <div className="h-px bg-white/10" />
                        <ReadOnlyButton onClick={() => { deleteJob(job.id); setShowAction(null) }} permission="jobs:write" className="w-full text-left px-3 py-2 hover:bg-white/5 text-sm text-red-300">Delete</ReadOnlyButton>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Job Details Modal */}
      {actionJob && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setActionJob(null)}>
          <div className="bg-[var(--card-bg)] border border-white/10 rounded-lg p-6 w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Job Details</h3>
              <button onClick={() => setActionJob(null)} className="text-[var(--text-secondary)] hover:text-white">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-[var(--text-secondary)]">Title</div>
                <div className="font-medium">{actionJob.title}</div>
              </div>
              <div>
                <div className="text-[var(--text-secondary)]">Company</div>
                <div className="font-medium">{actionJob.company}</div>
              </div>
              <div>
                <div className="text-[var(--text-secondary)]">Location</div>
                <div className="font-medium">{actionJob.location}</div>
              </div>
              <div>
                <div className="text-[var(--text-secondary)]">Type</div>
                <div className="font-medium">{actionJob.type}</div>
              </div>
              <div>
                <div className="text-[var(--text-secondary)]">Salary</div>
                <div className="font-medium">{actionJob.salary}</div>
              </div>
              <div>
                <div className="text-[var(--text-secondary)]">Status</div>
                <div className="font-medium">{actionJob.status}</div>
              </div>
              <div>
                <div className="text-[var(--text-secondary)]">Applications</div>
                <div className="font-medium">{actionJob.applications}</div>
              </div>
              <div>
                <div className="text-[var(--text-secondary)]">Posted</div>
                <div className="font-medium">{actionJob.postedDate}</div>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-2 justify-end">
              {actionJob.status !== 'Active' && (
                <ReadOnlyButton onClick={() => { activateJob(actionJob.id); setActionJob(null) }} permission="jobs:write" className="px-3 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white text-sm">Activate</ReadOnlyButton>
              )}
              {actionJob.status === 'Active' && (
                <ReadOnlyButton onClick={() => { pauseJob(actionJob.id); setActionJob(null) }} permission="jobs:write" className="px-3 py-2 rounded-md bg-yellow-600 hover:bg-yellow-700 text-white text-sm">Pause</ReadOnlyButton>
              )}
              {actionJob.status !== 'Closed' && (
                <ReadOnlyButton onClick={() => { closeJob(actionJob.id); setActionJob(null) }} permission="jobs:write" className="px-3 py-2 rounded-md bg-gray-600 hover:bg-gray-700 text-white text-sm">Close</ReadOnlyButton>
              )}
              <ReadOnlyButton onClick={() => { deleteJob(actionJob.id); setActionJob(null) }} permission="jobs:write" className="px-3 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm">Delete</ReadOnlyButton>
              <button onClick={() => setActionJob(null)} className="px-3 py-2 rounded-md border border-white/10 text-sm">Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Job Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[var(--card-bg)] border border-white/10 rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add New Job</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-[var(--text-secondary)] hover:text-white"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Job Title *</label>
                <input
                  type="text"
                  value={newJob.title}
                  onChange={(e) => setNewJob(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="e.g. Senior React Developer"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Company *</label>
                <input
                  type="text"
                  value={newJob.company}
                  onChange={(e) => setNewJob(prev => ({ ...prev, company: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="e.g. TechCorp Inc."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Location *</label>
                <input
                  type="text"
                  value={newJob.location}
                  onChange={(e) => setNewJob(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="e.g. Remote or New York, NY"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Salary Range *</label>
                <input
                  type="text"
                  value={newJob.salary}
                  onChange={(e) => setNewJob(prev => ({ ...prev, salary: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="e.g. $120k - $160k"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Job Type</label>
                <select
                  value={newJob.type}
                  onChange={(e) => setNewJob(prev => ({ ...prev, type: e.target.value as Job['type'] }))}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select
                  value={newJob.status}
                  onChange={(e) => setNewJob(prev => ({ ...prev, status: e.target.value as Job['status'] }))}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="Active">Active</option>
                  <option value="Paused">Paused</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2 border border-white/10 rounded-lg hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <ReadOnlyButton
                onClick={addJob}
                permission="jobs:write"
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Add Job
              </ReadOnlyButton>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}



