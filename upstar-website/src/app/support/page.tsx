"use client"
import { useMemo, useState } from 'react'
import { ReadOnlyButton } from '@/components/ReadOnlyIndicator'
import { useAuth } from '@/contexts/AuthContext'

type Ticket = { id: string; subject: string; requesterEmail: string; status: 'open' | 'pending' | 'resolved'; createdAt: number }

export default function SupportPage() {
  const { canWrite } = useAuth()
  const [tickets, setTickets] = useState<Ticket[]>([
    { id: '1', subject: 'Login Issues', requesterEmail: 'user@example.com', status: 'open', createdAt: Date.now() },
    { id: '2', subject: 'Feature Request', requesterEmail: 'admin@example.com', status: 'pending', createdAt: Date.now() }
  ])
  const [subject, setSubject] = useState('')
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'All' | 'open' | 'pending' | 'resolved'>('All')

  const filtered = useMemo(() => status === 'All' ? tickets : tickets.filter(t => t.status === status), [tickets, status])

  const create = () => {
    const newTicket = { id: Date.now().toString(), subject, requesterEmail: email, status: 'open' as const, createdAt: Date.now() }
    setTickets([newTicket, ...tickets])
    setSubject('')
    setEmail('')
  }

  const setTicketStatus = (id: string, next: 'open' | 'pending' | 'resolved') => {
    setTickets(prev => prev.map(t => t.id === id ? { ...t, status: next } : t))
  }

  const remove = (id: string) => {
    setTickets(prev => prev.filter(t => t.id !== id))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Support Desk</h1>
          <p className="text-[var(--text-secondary)] mt-1">Manage support tickets</p>
        </div>
        <select value={status} onChange={e => setStatus(e.target.value as any)} className="input-field">
          <option>All</option>
          <option value="open">Open</option>
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      <div className="card p-6 grid md:grid-cols-3 gap-3">
        <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject" className="input-field" />
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Requester Email" className="input-field" />
        <ReadOnlyButton onClick={create} permission="notifications:write" className="btn-secondary">Create Ticket</ReadOnlyButton>
      </div>

      <div className="card overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-[var(--border)]">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-medium">Subject</th>
              <th className="text-left px-6 py-4 text-sm font-medium">Requester</th>
              <th className="text-left px-6 py-4 text-sm font-medium">Status</th>
              <th className="text-right px-6 py-4 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {filtered.map(t => (
              <tr key={t.id}>
                <td className="px-6 py-4">{t.subject}</td>
                <td className="px-6 py-4">{t.requesterEmail}</td>
                <td className="px-6 py-4">{t.status}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex gap-2 justify-end">
                    <ReadOnlyButton onClick={() => setTicketStatus(t.id, 'open')} permission="notifications:write" className="btn-secondary text-xs">Open</ReadOnlyButton>
                    <ReadOnlyButton onClick={() => setTicketStatus(t.id, 'pending')} permission="notifications:write" className="btn-secondary text-xs">Pending</ReadOnlyButton>
                    <ReadOnlyButton onClick={() => setTicketStatus(t.id, 'resolved')} permission="notifications:write" className="btn-secondary text-xs">Resolve</ReadOnlyButton>
                    <ReadOnlyButton onClick={() => remove(t.id)} permission="notifications:write" className="px-3 py-1.5 rounded-md bg-red-500 hover:bg-red-600 text-white text-xs">Delete</ReadOnlyButton>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}



