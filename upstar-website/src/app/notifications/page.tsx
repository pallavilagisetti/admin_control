"use client"
import { useMemo, useState } from 'react'
import { ReadOnlyButton } from '@/components/ReadOnlyIndicator'
import { useAuth } from '@/contexts/AuthContext'

type HistoryItem = { id: string; title: string; tags: string[]; recipients: number; sentAt?: string; openRate?: string; status: 'Sent'|'Scheduled' }
type ReminderItem = { id: string; title: string; description: string; cadence: 'Event-based'|'Weekly'|'Monthly'; enabled: boolean }

export default function NotificationsPage() {
  const { canWrite } = useAuth()
  const [activeTab, setActiveTab] = useState<'compose'|'history'|'reminders'>('compose')
  const [title, setTitle] = useState('')
  const [audience, setAudience] = useState('All Users (12,847)')
  const [content, setContent] = useState('')
  const [alert, setAlert] = useState<null | { type: 'success' | 'error'; message: string }>(null)

  const [history, setHistory] = useState<HistoryItem[]>([
    { id: 'h1', title: 'Welcome to SkillGraph AI Pro!', tags: ['Welcome','Sent'], recipients: 1247, sentAt: '2024-03-20', openRate: '87.3%', status: 'Sent' },
    { id: 'h2', title: 'New Feature: AI Interview Prep', tags: ['Feature','Sent'], recipients: 8942, sentAt: '2024-03-18', openRate: '72.1%', status: 'Sent' },
    { id: 'h3', title: 'Payment Reminder: Subscription Due', tags: ['Payment','Scheduled'], recipients: 234, status: 'Scheduled' },
  ])

  const [reminders, setReminders] = useState<ReminderItem[]>([
    { id: 'r1', title: 'Interview Reminder', description: 'Sent 3 days before scheduled interviews', cadence: 'Event-based', enabled: true },
    { id: 'r2', title: 'Weekly Progress', description: 'Weekly skill development progress reports', cadence: 'Weekly', enabled: true },
    { id: 'r3', title: 'Resume Update', description: 'Remind users to update their resumes', cadence: 'Monthly', enabled: false },
  ])
  const [showAdd, setShowAdd] = useState(false)
  const [newRem, setNewRem] = useState<{ title: string; description: string; cadence: ReminderItem['cadence'] }>({ title: '', description: '', cadence: 'Weekly' })

  const toggleReminder = (id: string) => {
    setReminders(prev => prev.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r))
  }

  const saveReminder = () => {
    if (!newRem.title.trim()) {
      setAlert({ type: 'error', message: 'Please enter a reminder title.' })
      return
    }
    const id = `r${Date.now()}`
    setReminders(prev => [
      { id, title: newRem.title.trim(), description: newRem.description.trim(), cadence: newRem.cadence, enabled: true },
      ...prev,
    ])
    setShowAdd(false)
    setNewRem({ title: '', description: '', cadence: 'Weekly' })
    setAlert({ type: 'success', message: 'Reminder added successfully.' })
  }

  const sendNow = () => {
    if (!title.trim() || !content.trim()) {
      setAlert({ type: 'error', message: 'Please fill message title and content.' })
      return
    }
    const id = `h${Date.now()}`
    const recipients = 12847
    const sentAt = new Date().toISOString().slice(0,10)
    const openRate = `${(70 + Math.floor(Math.random()*20))}.0%`
    setHistory(prev => [
      { id, title: title.trim(), tags: ['Manual','Sent'], recipients, sentAt, openRate, status: 'Sent' },
      ...prev,
    ])
    setTitle('')
    setContent('')
    setAlert({ type: 'success', message: 'Notification sent.' })
  }

  const scheduleLater = () => {
    if (!title.trim() || !content.trim()) {
      setAlert({ type: 'error', message: 'Please fill message title and content.' })
      return
    }
    const id = `h${Date.now()}`
    const recipients = 12847
    setHistory(prev => [
      { id, title: title.trim(), tags: ['Scheduled'], recipients, status: 'Scheduled' },
      ...prev,
    ])
    setTitle('')
    setContent('')
    setAlert({ type: 'success', message: 'Message scheduled.' })
  }

  const exportHistory = () => {
    const header = ['ID','Title','Status','Recipients','SentAt','OpenRate']
    const rows = history.map(h => [h.id, h.title, h.status, String(h.recipients ?? ''), h.sentAt ?? '', h.openRate ?? ''])
    const csv = [header, ...rows].map(r=>r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'notifications-history.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="grid gap-6">
      {alert && (
        <div className={`rounded-md px-4 py-3 ${alert.type==='success' ? 'bg-green-500/15 border border-green-500/30 text-green-300' : 'bg-red-500/15 border border-red-500/30 text-red-300'}`}>
          <div className="flex items-center justify-between">
            <span className="text-sm">{alert.message}</span>
            <button onClick={() => setAlert(null)} className="text-xs opacity-80 hover:opacity-100">Dismiss</button>
          </div>
        </div>
      )}
      {/* KPIs */}
      <section className="grid md:grid-cols-4 gap-4">
        <div className="metric-card p-6">
          <div className="text-sm text-[var(--text-secondary)]">Messages Sent</div>
          <div className="mt-2 text-3xl font-bold">23,847</div>
          <div className="mt-1 text-xs text-green-400">+12.3% this month</div>
        </div>
        <div className="metric-card p-6">
          <div className="text-sm text-[var(--text-secondary)]">Open Rate</div>
          <div className="mt-2 text-3xl font-bold">78.2%</div>
          <div className="mt-1 text-xs text-green-400">+3.1% vs last month</div>
        </div>
        <div className="metric-card p-6">
          <div className="text-sm text-[var(--text-secondary)]">Active Users</div>
          <div className="mt-2 text-3xl font-bold">11,234</div>
          <div className="mt-1 text-xs text-[var(--text-secondary)]">Reachable users</div>
        </div>
        <div className="metric-card p-6">
          <div className="text-sm text-[var(--text-secondary)]">Automated</div>
          <div className="mt-2 text-3xl font-bold">4</div>
          <div className="mt-1 text-xs text-[var(--text-secondary)]">Active reminders</div>
        </div>
      </section>

      {/* Tabs */}
      <div className="card p-2">
        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => setActiveTab('compose')} className={`px-3 py-2 rounded-md text-sm border ${activeTab==='compose' ? 'bg-white/10 border-white/10' : 'bg-white/5 border-white/10 text-white/80'}`}>Compose</button>
          <button onClick={() => setActiveTab('history')} className={`px-3 py-2 rounded-md text-sm border ${activeTab==='history' ? 'bg-white/10 border-white/10' : 'bg-white/5 border-white/10 text-white/80'}`}>Message History</button>
          <button onClick={() => setActiveTab('reminders')} className={`px-3 py-2 rounded-md text-sm border ${activeTab==='reminders' ? 'bg-white/10 border-white/10' : 'bg-white/5 border-white/10 text-white/80'}`}>Automated Reminders</button>
        </div>
      </div>

      {activeTab === 'compose' && (
        <section className="card p-6">
          <h2 className="text-xl font-semibold mb-4">Compose Message</h2>
          <div className="grid lg:grid-cols-[1fr_280px] gap-6">
            <div>
              <div className="text-sm mb-1">Message Title *</div>
              <input value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Enter message title..." className="input-field w-full" />
              <div className="text-sm mt-4 mb-1">Message Content *</div>
              <textarea value={content} onChange={(e)=>setContent(e.target.value)} placeholder="Write your message here..." className="input-field w-full h-40" />
            </div>
            <div>
              <div className="text-sm mb-1">Target Audience</div>
              <select value={audience} onChange={(e)=>setAudience(e.target.value)} className="input-field w-full">
                <option>All Users (12,847)</option>
                <option>Active Users</option>
                <option>Admins Only</option>
                <option>Free Plan</option>
              </select>
            </div>
          </div>
          <div className="mt-6 flex items-center gap-3">
            <ReadOnlyButton onClick={sendNow} permission="notifications:write" className="btn-primary">Send Notification</ReadOnlyButton>
            <ReadOnlyButton onClick={scheduleLater} permission="notifications:write" className="btn-secondary">Schedule</ReadOnlyButton>
          </div>
        </section>
      )}

      {activeTab === 'history' && (
        <section className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Message History</h2>
            <button onClick={exportHistory} className="px-3 py-2 rounded-md text-sm bg-white/10 border border-white/10">Export</button>
          </div>
          <div className="space-y-3">
            {history.map(item => (
              <div key={item.id} className="flex items-center justify-between bg-white/5 rounded-md px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">🔔</div>
                  <div>
                    <div className="font-medium text-[var(--text-primary)]">{item.title}</div>
                    <div className="text-xs text-[var(--text-secondary)]">
                      {item.status === 'Sent' ? `Sent: ${item.sentAt}` : 'Scheduled'}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-[var(--text-secondary)]">{item.recipients} recipients</div>
                  {item.openRate && <div className="text-xs text-green-400">Open rate: {item.openRate}</div>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {activeTab === 'reminders' && (
        <section className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Automated Reminders</h2>
            <ReadOnlyButton onClick={() => setShowAdd(true)} permission="notifications:write" className="px-3 py-2 rounded-md text-sm bg-[var(--accent)] text-white">+ Add Reminder</ReadOnlyButton>
          </div>
          <div className="space-y-3">
            {reminders.map(rem => (
              <div key={rem.id} className="flex items-center justify-between bg-white/5 rounded-md px-4 py-3">
                <div>
                  <div className="font-medium text-[var(--text-primary)]">{rem.title}</div>
                  <div className="text-xs text-[var(--text-secondary)]">{rem.description}</div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs px-2 py-1 rounded-full bg-white/10">{rem.cadence}</span>
                  <button
                    onClick={() => toggleReminder(rem.id)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${rem.enabled ? 'bg-[var(--accent)]' : 'bg-white/20'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${rem.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                  <button className="text-sm text-white/80">Edit</button>
                </div>
              </div>
            ))}
          </div>

          {showAdd && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg w-full max-w-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Add Reminder</h3>
                  <button onClick={() => setShowAdd(false)} className="text-white/60 hover:text-white">✕</button>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="text-sm mb-1">Title</div>
                    <input value={newRem.title} onChange={(e)=>setNewRem(v=>({ ...v, title: e.target.value }))} className="input-field w-full" placeholder="Reminder title" />
                  </div>
                  <div>
                    <div className="text-sm mb-1">Description</div>
                    <textarea value={newRem.description} onChange={(e)=>setNewRem(v=>({ ...v, description: e.target.value }))} className="input-field w-full h-24" placeholder="Short description" />
                  </div>
                  <div>
                    <div className="text-sm mb-1">Cadence</div>
                    <select value={newRem.cadence} onChange={(e)=>setNewRem(v=>({ ...v, cadence: e.target.value as any }))} className="input-field w-full">
                      <option value="Event-based">Event-based</option>
                      <option value="Weekly">Weekly</option>
                      <option value="Monthly">Monthly</option>
                    </select>
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                  <button onClick={() => setShowAdd(false)} className="btn-secondary">Cancel</button>
                  <ReadOnlyButton onClick={saveReminder} permission="notifications:write" className="btn-primary">Save</ReadOnlyButton>
                </div>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  )
}



