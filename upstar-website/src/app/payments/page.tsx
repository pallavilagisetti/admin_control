"use client"
import { useMemo, useState, useEffect } from 'react'

type Transaction = { id: string; user: string; amount: number; status: 'Completed'|'Failed'|'Pending'; type: 'subscription'|'upgrade'; method: string; date: string }

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState<'subscriptions'|'transactions'|'analytics'>('subscriptions')
  const [showDetails, setShowDetails] = useState<null | { u: string; e: string; plan: string; status: string; amt: string; next: string }>(null)
  const [loadingSubs, setLoadingSubs] = useState(false)

  const transactions: Transaction[] = useMemo(() => ([
    { id: 'txn_1', user: 'Alice Johnson', amount: 19.99, status: 'Completed', type: 'subscription', method: 'Visa ****1234', date: '2024-03-15' },
    { id: 'txn_2', user: 'Bob Smith', amount: 99.99, status: 'Completed', type: 'subscription', method: 'Master ****5678', date: '2024-03-20' },
    { id: 'txn_3', user: 'Eve Brown', amount: 29.99, status: 'Failed', type: 'upgrade', method: 'Visa ****9012', date: '2024-03-22' },
    { id: 'txn_4', user: 'Frank Miller', amount: 19.99, status: 'Pending', type: 'subscription', method: 'PayPal', date: '2024-03-25' },
  ]), [])

  const exportCsv = () => {
    const header = ['Transaction ID','User','Amount','Status','Type','Method','Date']
    const rows = transactions.map(t => [t.id, t.user, t.amount.toFixed(2), t.status, t.type, t.method, t.date])
    const csv = [header, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'transactions.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  type SubRow = { u: string; e: string; plan: string; status: 'Active'|'Cancelled'; amt: string; next: string }
  const [subs, setSubs] = useState<SubRow[]>([
    {u:'Alice Johnson',e:'alice@example.com',plan:'Pro',status:'Active',amt:'$19.99',next:'2024-04-15'},
    {u:'Bob Smith',e:'bob@example.com',plan:'Enterprise',status:'Active',amt:'$99.99',next:'2024-04-20'},
    {u:'Carol Davis',e:'carol@example.com',plan:'Pro',status:'Cancelled',amt:'$19.99',next:'-'}
  ])

  const handleRefreshSubs = () => {
    setLoadingSubs(true)
    // simulate refresh
    setTimeout(() => {
      setSubs(prev => [...prev])
      setLoadingSubs(false)
    }, 700)
  }

  const handleNewSub = () => {
    const now = new Date()
    setSubs(prev => [
      { u: 'New User', e: 'new@example.com', plan: 'Pro', status: 'Active', amt: '$19.99', next: now.toISOString().slice(0,10) },
      ...prev,
    ])
  }

  return (
    <div className="grid gap-6">
      <section className="card p-6">
        <h1 className="text-3xl font-bold">Payments & Subscriptions</h1>
        <p className="text-[var(--text-secondary)] mt-1">Manage billing, subscriptions, and financial analytics</p>
      </section>

      {/* KPI tiles */}
      <section className="grid md:grid-cols-4 gap-4">
        <div className="metric-card p-6 bg-green-600/15 border-green-600/30">
          <div className="text-sm text-[var(--text-secondary)]">Monthly Revenue</div>
          <div className="mt-2 text-3xl font-bold">$89,420</div>
          <div className="mt-1 text-xs text-green-400">+23.1% from last month</div>
        </div>
        <div className="metric-card p-6">
          <div className="text-sm text-[var(--text-secondary)]">Active Subscriptions</div>
          <div className="mt-2 text-3xl font-bold">3,847</div>
          <div className="mt-1 text-xs text-green-400">+12.5% from last month</div>
        </div>
        <div className="metric-card p-6">
          <div className="text-sm text-[var(--text-secondary)]">Conversion Rate</div>
          <div className="mt-2 text-3xl font-bold">29.8%</div>
          <div className="mt-1 text-xs text-green-400">+3.2% from last month</div>
        </div>
        <div className="metric-card p-6">
          <div className="text-sm text-[var(--text-secondary)]">Churn Rate</div>
          <div className="mt-2 text-3xl font-bold">4.2%</div>
          <div className="mt-1 text-xs text-red-400">-0.8% from last month</div>
        </div>
      </section>

      {/* Tabs */}
      <div className="card p-2">
        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => setActiveTab('subscriptions')} className={`px-3 py-2 rounded-md text-sm border ${activeTab==='subscriptions' ? 'bg-white/10 border-white/10' : 'bg-white/5 border-white/10 text-white/80'}`}>Subscriptions</button>
          <button onClick={() => setActiveTab('transactions')} className={`px-3 py-2 rounded-md text-sm border ${activeTab==='transactions' ? 'bg-white/10 border-white/10' : 'bg-white/5 border-white/10 text-white/80'}`}>Transactions</button>
          <button onClick={() => setActiveTab('analytics')} className={`px-3 py-2 rounded-md text-sm border ${activeTab==='analytics' ? 'bg-white/10 border-white/10' : 'bg-white/5 border-white/10 text-white/80'}`}>Revenue Analytics</button>
        </div>
      </div>

      {activeTab === 'subscriptions' && (
        <div className="card overflow-hidden">
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <input placeholder="Search by user name or email..." className="input-field w-64" />
              <select className="input-field">
                <option>All Status</option>
                <option>Active</option>
                <option>Cancelled</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleNewSub} className="px-3 py-2 rounded-md text-sm bg-white/10 border border-white/10">New</button>
              <button onClick={handleRefreshSubs} className="px-3 py-2 rounded-md text-sm bg-white/10 border border-white/10 flex items-center gap-2">
                {loadingSubs && <span className="animate-spin h-3 w-3 rounded-full border-2 border-b-transparent"></span>}
                <span>Refresh</span>
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-white/5">
                <tr>
                  <th className="text-left px-4 py-3">User</th>
                  <th className="text-left px-4 py-3">Plan</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Amount</th>
                  <th className="text-left px-4 py-3">Next Billing</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subs.map((r, i) => (
                  <tr key={i} className="border-t border-white/5">
                    <td className="px-4 py-3">
                      <div className="font-medium">{r.u}</div>
                      <div className="text-xs text-white/60">{r.e}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-full text-xs bg-purple-500/20 text-purple-300 border border-purple-400/30">{r.plan}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${r.status === 'Active' ? 'bg-green-500/20 text-green-300' : 'bg-gray-500/20 text-gray-300'}`}>{r.status}</span>
                    </td>
                    <td className="px-4 py-3">{r.amt}</td>
                    <td className="px-4 py-3">{r.next}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-2 justify-end text-white/80">
                        <button onClick={() => setShowDetails(r)} className="btn-secondary text-xs">View</button>
                        <button onClick={handleRefreshSubs} className="btn-secondary text-xs">Refresh</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {showDetails && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-lg w-full max-w-md p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Subscription Details</h3>
                  <button onClick={() => setShowDetails(null)} className="text-white/60 hover:text-white">✕</button>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between"><span className="text-[var(--text-secondary)]">User</span><span>{showDetails.u}</span></div>
                  <div className="flex items-center justify-between"><span className="text-[var(--text-secondary)]">Email</span><span>{showDetails.e}</span></div>
                  <div className="flex items-center justify-between"><span className="text-[var(--text-secondary)]">Plan</span><span>{showDetails.plan}</span></div>
                  <div className="flex items-center justify-between"><span className="text-[var(--text-secondary)]">Status</span><span>{showDetails.status}</span></div>
                  <div className="flex items-center justify-between"><span className="text-[var(--text-secondary)]">Amount</span><span>{showDetails.amt}</span></div>
                  <div className="flex items-center justify-between"><span className="text-[var(--text-secondary)]">Next Billing</span><span>{showDetails.next}</span></div>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button onClick={() => setShowDetails(null)} className="btn-secondary">Close</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'transactions' && (
        <div className="card overflow-hidden">
          <div className="p-4 flex items-center justify-between">
            <div className="text-sm text-[var(--text-secondary)]">Transaction History</div>
            <button onClick={exportCsv} className="px-3 py-2 rounded-md text-sm bg-white/10 border border-white/10 flex items-center gap-2">
              <span>Export</span>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-white/5">
                <tr>
                  <th className="text-left px-4 py-3">Transaction ID</th>
                  <th className="text-left px-4 py-3">User</th>
                  <th className="text-left px-4 py-3">Amount</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-4 py-3">Type</th>
                  <th className="text-left px-4 py-3">Method</th>
                  <th className="text-left px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(t => (
                  <tr key={t.id} className="border-t border-white/5">
                    <td className="px-4 py-3">{t.id}</td>
                    <td className="px-4 py-3">{t.user}</td>
                    <td className="px-4 py-3">${t.amount.toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${t.status==='Completed' ? 'bg-green-500/20 text-green-300' : t.status==='Pending' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-red-500/20 text-red-300'}`}>{t.status}</span>
                    </td>
                    <td className="px-4 py-3">{t.type}</td>
                    <td className="px-4 py-3">{t.method}</td>
                    <td className="px-4 py-3">{t.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <section className="card p-6">
            <h2 className="text-xl font-semibold mb-2">Revenue by Plan</h2>
            <div className="space-y-4">
              {[
                { label: 'Enterprise', users: 452, amount: '$45,230', pct: 80 },
                { label: 'Pro', users: 1794, amount: '$35,890', pct: 60 },
                { label: 'Free (Ads)', users: 8901, amount: '$8,300', pct: 20 },
              ].map(row => (
                <div key={row.label}>
                  <div className="flex items-center justify-between text-sm">
                    <div className="text-[var(--text-secondary)]">{row.label} <span className="ml-2">{row.users} users</span></div>
                    <div className="font-medium">{row.amount}</div>
                  </div>
                  <div className="h-2 rounded bg-white/10 mt-2">
                    <div className="h-full bg-[var(--accent)]" style={{ width: `${row.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="card p-6">
            <h2 className="text-xl font-semibold mb-2">Payment Methods</h2>
            <div className="space-y-4">
              {[
                { label: 'Credit Card', pct: 65 },
                { label: 'PayPal', pct: 25 },
                { label: 'Bank Transfer', pct: 8 },
                { label: 'Other', pct: 2 },
              ].map(row => (
                <div key={row.label}>
                  <div className="flex items-center justify-between text-sm">
                    <div className="text-[var(--text-secondary)]">{row.label}</div>
                    <div className="font-medium">{row.pct}%</div>
                  </div>
                  <div className="h-2 rounded bg-white/10 mt-2">
                    <div className="h-full bg-cyan-400" style={{ width: `${row.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  )
}