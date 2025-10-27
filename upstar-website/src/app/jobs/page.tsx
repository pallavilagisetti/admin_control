"use client"
import { useEffect, useMemo, useState } from 'react'
import { ReadOnlyButton } from '@/components/ReadOnlyIndicator'
import { useAuth } from '@/contexts/AuthContext'
import { useJobs, useJobAnalytics } from '@/lib/api-hooks'

type Job = {
  id: string
  title: string
  organization: string
  location: string
  employmentType: string[]
  remote: boolean
  datePosted: string
  description: string
  salary: {
    min: number
    max: number
    currency: string
  }
  skills: string[]
  applicationUrl: string
}

type NewJob = Omit<Job, 'id' | 'datePosted'>

export default function JobsPage() {
  const { canWrite } = useAuth()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newJob, setNewJob] = useState<NewJob>({
    title: '',
    organization: '',
    location: '',
    employmentType: ['Full-time'],
    remote: false,
    description: '',
    salary: { min: 0, max: 0, currency: 'USD' },
    skills: [],
    applicationUrl: ''
  })
  const [actionJob, setActionJob] = useState<Job | null>(null)
  const [showAction, setShowAction] = useState<string | null>(null)

  // Fetch jobs from API
  const { data: jobsData, loading: jobsLoading, error: jobsError, refetch } = useJobs({
    page,
    limit: 20,
    search: search || undefined
  })

  // Fetch job analytics
  const { data: analyticsData, loading: analyticsLoading } = useJobAnalytics()

  const jobs = jobsData?.jobs || []
  const totalJobs = jobsData?.pagination?.total || 0
  const activeJobs = analyticsData?.activeJobs || 0
  const totalApplications = analyticsData?.totalApplications || 0
  const avgSalary = analyticsData?.avgSalary || '$0'
  const remotePercentage = analyticsData?.remotePercentage || 0

  const addJob = () => {
    if (!newJob.title || !newJob.organization || !newJob.location) {
      alert('Please fill in all required fields')
      return
    }

    // TODO: Implement API call to create job
    console.log('Creating job:', newJob)
    
    setNewJob({
      title: '',
      organization: '',
      location: '',
      employmentType: ['Full-time'],
      remote: false,
      description: '',
      salary: { min: 0, max: 0, currency: 'USD' },
      skills: [],
      applicationUrl: ''
    })
    setShowAddModal(false)
    refetch()
  }

  const updateJobStatus = (jobId: string, newStatus: string) => {
    // TODO: Implement API call to update job status
    console.log('Updating job status:', jobId, newStatus)
    refetch()
  }

  const deleteJob = (jobId: string) => {
    // TODO: Implement API call to delete job
    console.log('Deleting job:', jobId)
    refetch()
  }

  if (jobsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading jobs...</p>
        </div>
      </div>
    )
  }

  if (jobsError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-xl mb-4">❌ Error loading jobs</div>
          <p className="text-gray-600 mb-4">{jobsError}</p>
          <button 
            onClick={() => refetch()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

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
            <div className="text-sm text-[var(--text-secondary)]">Total Jobs</div>
          </div>
          <div className="text-3xl font-bold">{totalJobs.toLocaleString()}</div>
          <div className="mt-1 text-xs text-green-400">+{Math.floor(totalJobs * 0.05)} this week</div>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
              <span className="text-green-400">⏰</span>
            </div>
            <div className="text-sm text-[var(--text-secondary)]">Active Jobs</div>
          </div>
          <div className="text-3xl font-bold">{activeJobs.toLocaleString()}</div>
          <div className="mt-1 text-xs text-green-400">+{Math.floor(activeJobs * 0.02)} today</div>
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
          <div className="text-3xl font-bold">{remotePercentage}%</div>
          <div className="mt-1 text-xs text-[var(--text-secondary)]">{Math.floor(totalJobs * remotePercentage / 100)} remote positions</div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Job Listings</h2>
          <p className="text-[var(--text-secondary)] text-sm">All active and managed job postings</p>
        </div>
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search jobs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-blue-500 focus:outline-none text-sm"
          />
          <ReadOnlyButton 
            onClick={() => setShowAddModal(true)}
            permission="jobs:write"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            <span>+</span> Add Job
          </ReadOnlyButton>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-white/5 border-b border-white/10">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-medium text-[var(--text-primary)]">Job Title</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[var(--text-primary)]">Organization</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[var(--text-primary)]">Location</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[var(--text-primary)]">Salary</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[var(--text-primary)]">Type</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[var(--text-primary)]">Remote</th>
                <th className="text-left px-6 py-4 text-sm font-medium text-[var(--text-primary)]">Apply</th>
                <th className="text-right px-6 py-4 text-sm font-medium text-[var(--text-primary)]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {jobs.map(job => (
                <tr key={job.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <div className="font-medium">{job.title}</div>
                      <div className="text-xs text-[var(--text-secondary)]">Posted {new Date(job.datePosted).toLocaleDateString()}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{job.organization}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <span className="text-sm">📍</span>
                      {job.location || 'Not specified'}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium">
                    {job.salary?.min && job.salary?.max ? 
                      `${job.salary.currency} ${job.salary.min.toLocaleString()} - ${job.salary.max.toLocaleString()}` : 
                      'Not specified'
                    }
                  </td>
                  <td className="px-6 py-4">{job.employmentType?.join(', ') || 'Not specified'}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      job.remote ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 
                      'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    }`}>
                      {job.remote ? 'Remote' : 'On-site'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">🔗</span>
                      {job.applicationUrl ? (
                        <a 
                          href={job.applicationUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-sm"
                        >
                          Apply
                        </a>
                      ) : (
                        <span className="text-gray-400 text-sm">No link</span>
                      )}
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
                        <ReadOnlyButton onClick={() => { updateJobStatus(job.id, 'active'); setShowAction(null) }} permission="jobs:write" className="w-full text-left px-3 py-2 hover:bg-white/5 text-sm">Activate</ReadOnlyButton>
                        <ReadOnlyButton onClick={() => { updateJobStatus(job.id, 'paused'); setShowAction(null) }} permission="jobs:write" className="w-full text-left px-3 py-2 hover:bg-white/5 text-sm">Pause</ReadOnlyButton>
                        <ReadOnlyButton onClick={() => { updateJobStatus(job.id, 'closed'); setShowAction(null) }} permission="jobs:write" className="w-full text-left px-3 py-2 hover:bg-white/5 text-sm">Close</ReadOnlyButton>
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
        
        {/* Pagination */}
        {jobsData?.pagination && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
            <div className="text-sm text-[var(--text-secondary)]">
              Showing {((page - 1) * 20) + 1} to {Math.min(page * 20, totalJobs)} of {totalJobs} jobs
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="px-3 py-1 border border-white/10 rounded-md hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm">
                Page {page} of {Math.ceil(totalJobs / 20)}
              </span>
              <button
                onClick={() => setPage(Math.min(Math.ceil(totalJobs / 20), page + 1))}
                disabled={page >= Math.ceil(totalJobs / 20)}
                className="px-3 py-1 border border-white/10 rounded-md hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Next
              </button>
            </div>
          </div>
        )}
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
                <div className="text-[var(--text-secondary)]">Organization</div>
                <div className="font-medium">{actionJob.organization}</div>
              </div>
              <div>
                <div className="text-[var(--text-secondary)]">Location</div>
                <div className="font-medium">{actionJob.location || 'Not specified'}</div>
              </div>
              <div>
                <div className="text-[var(--text-secondary)]">Employment Type</div>
                <div className="font-medium">{actionJob.employmentType?.join(', ') || 'Not specified'}</div>
              </div>
              <div>
                <div className="text-[var(--text-secondary)]">Salary</div>
                <div className="font-medium">
                  {actionJob.salary?.min && actionJob.salary?.max ? 
                    `${actionJob.salary.currency} ${actionJob.salary.min.toLocaleString()} - ${actionJob.salary.max.toLocaleString()}` : 
                    'Not specified'
                  }
                </div>
              </div>
              <div>
                <div className="text-[var(--text-secondary)]">Remote</div>
                <div className="font-medium">{actionJob.remote ? 'Yes' : 'No'}</div>
              </div>
              <div>
                <div className="text-[var(--text-secondary)]">Posted Date</div>
                <div className="font-medium">{new Date(actionJob.datePosted).toLocaleDateString()}</div>
              </div>
              <div>
                <div className="text-[var(--text-secondary)]">Application URL</div>
                <div className="font-medium">
                  {actionJob.applicationUrl ? (
                    <a 
                      href={actionJob.applicationUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300"
                    >
                      Apply Here
                    </a>
                  ) : (
                    'Not available'
                  )}
                </div>
              </div>
            </div>
            {actionJob.skills && actionJob.skills.length > 0 && (
              <div className="mt-4">
                <div className="text-[var(--text-secondary)] text-sm mb-2">Skills</div>
                <div className="flex flex-wrap gap-2">
                  {actionJob.skills.map((skill, index) => (
                    <span key={index} className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded-md text-xs">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {actionJob.description && (
              <div className="mt-4">
                <div className="text-[var(--text-secondary)] text-sm mb-2">Description</div>
                <div className="text-sm max-h-32 overflow-y-auto">
                  {actionJob.description}
                </div>
              </div>
            )}
            <div className="mt-6 flex flex-wrap gap-2 justify-end">
              <ReadOnlyButton onClick={() => { updateJobStatus(actionJob.id, 'active'); setActionJob(null) }} permission="jobs:write" className="px-3 py-2 rounded-md bg-green-600 hover:bg-green-700 text-white text-sm">Activate</ReadOnlyButton>
              <ReadOnlyButton onClick={() => { updateJobStatus(actionJob.id, 'paused'); setActionJob(null) }} permission="jobs:write" className="px-3 py-2 rounded-md bg-yellow-600 hover:bg-yellow-700 text-white text-sm">Pause</ReadOnlyButton>
              <ReadOnlyButton onClick={() => { updateJobStatus(actionJob.id, 'closed'); setActionJob(null) }} permission="jobs:write" className="px-3 py-2 rounded-md bg-gray-600 hover:bg-gray-700 text-white text-sm">Close</ReadOnlyButton>
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
                  value={newJob.organization}
                  onChange={(e) => setNewJob(prev => ({ ...prev, organization: e.target.value }))}
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
                <label className="block text-sm font-medium mb-1">Salary Range</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={newJob.salary.min || ''}
                    onChange={(e) => setNewJob(prev => ({ 
                      ...prev, 
                      salary: { ...prev.salary, min: parseInt(e.target.value) || 0 }
                    }))}
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={newJob.salary.max || ''}
                    onChange={(e) => setNewJob(prev => ({ 
                      ...prev, 
                      salary: { ...prev.salary, max: parseInt(e.target.value) || 0 }
                    }))}
                    className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Employment Type</label>
                <select
                  value={newJob.employmentType[0] || 'Full-time'}
                  onChange={(e) => setNewJob(prev => ({ ...prev, employmentType: [e.target.value] }))}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Remote Work</label>
                <select
                  value={newJob.remote ? 'true' : 'false'}
                  onChange={(e) => setNewJob(prev => ({ ...prev, remote: e.target.value === 'true' }))}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-blue-500 focus:outline-none"
                >
                  <option value="false">On-site</option>
                  <option value="true">Remote</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Application URL</label>
                <input
                  type="url"
                  value={newJob.applicationUrl}
                  onChange={(e) => setNewJob(prev => ({ ...prev, applicationUrl: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-blue-500 focus:outline-none"
                  placeholder="https://company.com/apply"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={newJob.description}
                  onChange={(e) => setNewJob(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg focus:border-blue-500 focus:outline-none h-24 resize-none"
                  placeholder="Job description..."
                />
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



