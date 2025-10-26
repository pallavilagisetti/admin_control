"use client"
import { useEffect, useState } from 'react'
import { ReadOnlyButton } from '@/components/ReadOnlyIndicator'
import { useAuth } from '@/contexts/AuthContext'

type Template = {
  id: string
  name: string
  type: 'SOFA' | 'KYS'
  activeVersion: number
  versions: { version: number; createdAt: number }[]
}

export default function TemplatesPage() {
  const { canWrite } = useAuth()
  const [templates, setTemplates] = useState<Template[]>([])
  const [name, setName] = useState('')
  const [type, setType] = useState<'SOFA' | 'KYS'>('SOFA')
  const [body, setBody] = useState('')

  useEffect(() => { fetch('/api/templates').then(r => r.json()).then(d => setTemplates(d.templates)) }, [])

  const create = async () => {
    const r = await fetch('/api/templates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, type, body }) })
    const d = await r.json()
    setTemplates([d.template, ...templates])
    setName(''); setBody('')
  }

  const addVersion = async (id: string) => {
    const r = await fetch(`/api/templates/${id}/versions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ body }) })
    const d = await r.json()
    setTemplates(prev => prev.map(t => t.id === id ? d.template : t))
    setBody('')
  }

  const rollback = async (id: string, version: number) => {
    const r = await fetch(`/api/templates/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ version }) })
    const d = await r.json()
    setTemplates(prev => prev.map(t => t.id === id ? d.template : t))
  }

  const remove = async (id: string) => {
    await fetch(`/api/templates/${id}`, { method: 'DELETE' })
    setTemplates(prev => prev.filter(t => t.id !== id))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">SOFA / KYS Templates</h1>
        <p className="text-[var(--text-secondary)] mt-1">Manage scoring templates with versioning</p>
      </div>

      <div className="card p-6 grid gap-3">
        <div className="grid md:grid-cols-3 gap-3">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Template name" className="input-field" />
          <select value={type} onChange={e => setType(e.target.value as any)} className="input-field">
            <option value="SOFA">SOFA</option>
            <option value="KYS">KYS</option>
          </select>
          <ReadOnlyButton onClick={create} permission="cms:write" className="btn-secondary">Create Template</ReadOnlyButton>
        </div>
        <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Template body (JSON) or DSL" className="input-field h-24" />
      </div>

      <div className="card overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-[var(--border)]">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-medium">Name</th>
              <th className="text-left px-6 py-4 text-sm font-medium">Type</th>
              <th className="text-left px-6 py-4 text-sm font-medium">Active Version</th>
              <th className="text-right px-6 py-4 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {templates.map(t => (
              <tr key={t.id}>
                <td className="px-6 py-4">{t.name}</td>
                <td className="px-6 py-4">{t.type}</td>
                <td className="px-6 py-4">v{t.activeVersion}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex gap-2 justify-end">
                    <ReadOnlyButton onClick={() => addVersion(t.id)} permission="cms:write" className="px-3 py-1.5 rounded-md bg-brand-500 hover:bg-brand-400 text-white text-xs">Add Version</ReadOnlyButton>
                    <ReadOnlyButton onClick={() => rollback(t.id, Math.max(1, t.activeVersion - 1))} permission="cms:write" className="px-3 py-1.5 rounded-md bg-white/10 border border-white/10 text-white text-xs">Rollback</ReadOnlyButton>
                    <ReadOnlyButton onClick={() => remove(t.id)} permission="cms:write" className="px-3 py-1.5 rounded-md bg-red-500 hover:bg-red-600 text-white text-xs">Delete</ReadOnlyButton>
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



