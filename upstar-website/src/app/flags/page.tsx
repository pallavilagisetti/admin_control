"use client"
import { useEffect, useState } from 'react'

type Flag = { key: string; enabled: boolean; description?: string }

export default function FlagsPage() {
  const [flags, setFlags] = useState<Flag[]>([])

  useEffect(() => { fetch('/api/flags').then(r => r.json()).then(d => setFlags(d.flags)) }, [])

  const toggle = async (f: Flag) => {
    const r = await fetch('/api/flags', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: f.key, enabled: !f.enabled }) })
    const d = await r.json(); setFlags(prev => prev.map(x => x.key === d.flag.key ? d.flag : x))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Feature Flags</h1>
        <p className="text-[var(--text-secondary)] mt-1">Enable or disable features</p>
      </div>

      <div className="card overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-[var(--border)]">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-medium">Key</th>
              <th className="text-left px-6 py-4 text-sm font-medium">Description</th>
              <th className="text-right px-6 py-4 text-sm font-medium">Enabled</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {flags.map(f => (
              <tr key={f.key}>
                <td className="px-6 py-4">{f.key}</td>
                <td className="px-6 py-4">{f.description || '—'}</td>
                <td className="px-6 py-4 text-right">
                  <button onClick={() => toggle(f)} className={`px-3 py-1.5 rounded-md text-xs ${f.enabled ? 'bg-green-500' : 'bg-white/10 border border-white/10'} text-white`}>{f.enabled ? 'On' : 'Off'}</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}



