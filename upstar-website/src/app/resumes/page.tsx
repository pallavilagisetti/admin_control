"use client"
import { useEffect, useMemo, useState } from 'react'
import { apiClient } from '@/lib/api-client'

type Resume = {
  id: string
  userId: string
  status: 'parsed' | 'not_parsed'
  parsed?: {
    skills: string[]
    education: string
    experience: string
  }
}

export default function ResumesPage() {
  const [tab, setTab] = useState<'Resumes' | 'Manual Profiles'>('Resumes')
  const [resumes, setResumes] = useState<Resume[]>([])
  const [previewId, setPreviewId] = useState<string | null>(null)
  const totalResumes = resumes.length
  const processed = resumes.filter(r => r.status === 'parsed').length

  useEffect(() => {
    apiClient.getResumes().then(response => {
      if (response.data) {
        setResumes(response.data.resumes || [])
      }
    }).catch(error => {
      console.error('Failed to fetch resumes:', error)
    })
  }, [])

  const parsed = useMemo(() => resumes.filter(r => r.status === 'parsed'), [resumes])

  return (
    <div className="grid gap-6">
      {/* KPI tiles */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="metric-card p-6">
          <div className="text-sm text-[var(--text-secondary)]">Total Resumes</div>
          <div className="mt-2 text-3xl font-bold">{totalResumes.toLocaleString()}</div>
        </div>
        <div className="metric-card p-6">
          <div className="text-sm text-[var(--text-secondary)]">Processed Today</div>
          <div className="mt-2 text-3xl font-bold">{Math.round(processed/3).toLocaleString()}</div>
          <div className="mt-1 text-xs text-green-400">98.7% success rate</div>
        </div>
        <div className="metric-card p-6">
          <div className="text-sm text-[var(--text-secondary)]">Avg Match Score</div>
          <div className="mt-2 text-3xl font-bold">89.2%</div>
        </div>
        <div className="metric-card p-6">
          <div className="text-sm text-[var(--text-secondary)]">Processing Time</div>
          <div className="mt-2 text-3xl font-bold">2.3s</div>
          <div className="mt-1 text-xs text-[var(--text-secondary)]">Average processing</div>
        </div>
      </div>
      <div className="card p-2">
        <div className="flex gap-2">
          {(['Resumes', 'Manual Profiles'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-3 py-2 rounded-md text-sm ${tab === t ? 'bg-brand-500 text-white' : 'bg-white/5 border border-white/10 text-white/80'}`}>{t}</button>
          ))}
        </div>
      </div>

      {tab === 'Resumes' ? (
        <div className="card overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-white/5">
              <tr>
                <th className="text-left px-4 py-3">Resume ID</th>
                <th className="text-left px-4 py-3">User</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {resumes.map(r => (
                <tr key={r.id} className="border-t border-white/5">
                  <td className="px-4 py-3">{r.id}</td>
                  <td className="px-4 py-3">{r.userId}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${r.status === 'parsed' ? 'bg-green-500/20 text-green-300' : 'bg-yellow-500/20 text-yellow-300'}`}>{r.status}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button disabled={r.status !== 'parsed'} onClick={() => setPreviewId(r.id)} className="px-3 py-1.5 rounded-md bg-brand-500 enabled:hover:bg-brand-400 disabled:opacity-50 text-white text-xs">
                      Preview Parsed
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card p-6 text-white/80">Manual profiles list placeholder.</div>
      )}

      {previewId && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4" onClick={() => setPreviewId(null)}>
          <div className="card p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold">Parsed Resume</h3>
            <div className="mt-3 text-sm text-white/80">
              {parsed.find(p => p.id === previewId)?.parsed ? (
                <div className="grid gap-2">
                  <div>
                    <div className="text-white">Skills</div>
                    <div>{parsed.find(p => p.id === previewId)!.parsed!.skills.join(', ')}</div>
                  </div>
                  <div>
                    <div className="text-white">Education</div>
                    <div>{parsed.find(p => p.id === previewId)!.parsed!.education}</div>
                  </div>
                  <div>
                    <div className="text-white">Experience</div>
                    <div>{parsed.find(p => p.id === previewId)!.parsed!.experience}</div>
                  </div>
                </div>
              ) : (
                <div>No parsed data.</div>
              )}
            </div>
            <div className="mt-4 text-right">
              <button onClick={() => setPreviewId(null)} className="px-3 py-2 rounded-md bg-white/10 border border-white/10">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

