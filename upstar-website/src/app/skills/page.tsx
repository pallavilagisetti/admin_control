"use client"
import { useEffect, useState } from 'react'

type SkillCount = { skill: string; count: number }
type ActiveTab = 'popular' | 'gaps' | 'distribution'

export default function SkillsDashboardPage() {
  const [topSkills, setTopSkills] = useState<SkillCount[]>([])
  const [topMissing, setTopMissing] = useState<SkillCount[]>([])
  const [errors, setErrors] = useState<{ resumeId: string; userId: string }[]>([])
  const [activeTab, setActiveTab] = useState<ActiveTab>('popular')

  useEffect(() => {
    // Mock data for skills
    setTopSkills([
      { skill: 'JavaScript', count: 1234 },
      { skill: 'Python', count: 987 },
      { skill: 'React', count: 876 },
      { skill: 'Node.js', count: 765 },
      { skill: 'TypeScript', count: 654 }
    ])
    setTopMissing([
      { skill: 'Machine Learning', count: 234 },
      { skill: 'DevOps', count: 198 },
      { skill: 'Cloud Computing', count: 187 },
      { skill: 'Data Science', count: 176 },
      { skill: 'Cybersecurity', count: 165 }
    ])
    setErrors([])
  }, [])

  const skillsTracked = topSkills.length + topMissing.length
  const activeUsers = 9742 // placeholder to mirror screenshot
  const marketDemand = 87.3
  const avgGrowth = 16.8

  // Mock data for experience levels and skill development trends
  const experienceLevels = [
    { level: 'Expert (8-10 years)', count: 1247, percentage: 12.8 },
    { level: 'Senior (5-7 years)', count: 2891, percentage: 29.7 },
    { level: 'Mid-level (3-4 years)', count: 3456, percentage: 35.5 },
    { level: 'Junior (1-2 years)', count: 1678, percentage: 17.2 },
    { level: 'Entry level (<1 year)', count: 470, percentage: 4.8 }
  ]

  const skillDevelopmentTrends = [
    { category: 'Technical Skills', learners: 7834, growth: '+24%' },
    { category: 'Soft Skills', learners: 5672, growth: '+18%' },
    { category: 'Leadership', learners: 2341, growth: '+31%' },
    { category: 'Data Analysis', learners: 4567, growth: '+27%' }
  ]

  return (
    <div className="grid gap-6">
      <section className="card p-6">
        <h1 className="text-3xl font-bold">Skill Graph Analytics</h1>
        <p className="text-[var(--text-secondary)] mt-1">Comprehensive skill analysis and market demand insights</p>
      </section>

      {/* KPI tiles */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="metric-card p-6">
          <div className="text-sm text-[var(--text-secondary)]">Skills Tracked</div>
          <div className="mt-2 text-3xl font-bold">{(2847).toLocaleString()}</div>
          <div className="mt-1 text-xs text-green-400">+89 new this month</div>
        </div>
        <div className="metric-card p-6">
          <div className="text-sm text-[var(--text-secondary)]">Active Users</div>
          <div className="mt-2 text-3xl font-bold">{activeUsers.toLocaleString()}</div>
          <div className="mt-1 text-xs text-[var(--text-secondary)]">With skill assessments</div>
        </div>
        <div className="metric-card p-6">
          <div className="text-sm text-[var(--text-secondary)]">Market Demand</div>
          <div className="mt-2 text-3xl font-bold">{marketDemand}%</div>
          <div className="mt-1 text-xs text-green-400">High demand skills</div>
        </div>
        <div className="metric-card p-6">
          <div className="text-sm text-[var(--text-secondary)]">Avg Skill Growth</div>
          <div className="mt-2 text-3xl font-bold">{avgGrowth}%</div>
          <div className="mt-1 text-xs text-[var(--text-secondary)]">Month over month</div>
        </div>
      </div>

      <div className="card p-2">
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab('popular')}
            className={`px-3 py-2 rounded-md text-sm border border-white/10 transition-colors ${
              activeTab === 'popular' 
                ? 'bg-white/10 text-white' 
                : 'bg-white/5 text-white/80 hover:bg-white/8'
            }`}
          >
            Popular Skills
          </button>
          <button 
            onClick={() => setActiveTab('gaps')}
            className={`px-3 py-2 rounded-md text-sm border border-white/10 transition-colors ${
              activeTab === 'gaps' 
                ? 'bg-white/10 text-white' 
                : 'bg-white/5 text-white/80 hover:bg-white/8'
            }`}
          >
            Skill Gaps
          </button>
          <button 
            onClick={() => setActiveTab('distribution')}
            className={`px-3 py-2 rounded-md text-sm border border-white/10 transition-colors ${
              activeTab === 'distribution' 
                ? 'bg-white/10 text-white' 
                : 'bg-white/5 text-white/80 hover:bg-white/8'
            }`}
          >
            User Distribution
          </button>
        </div>
      </div>

      {/* Popular Skills View */}
      {activeTab === 'popular' && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card p-6">
            <h2 className="font-semibold">Top Extracted Skills</h2>
            <div className="mt-4 space-y-2">
              {topSkills.length === 0 && <div className="text-white/60 text-sm">No data.</div>}
              {topSkills.map((s) => (
                <div key={s.skill} className="flex items-center gap-3">
                  <div className="w-32 text-sm text-white/80 capitalize">{s.skill}</div>
                  <div className="flex-1 h-2 rounded bg-white/10 overflow-hidden">
                    <div className="h-full bg-brand-500" style={{ width: `${Math.min(100, s.count * 10)}%` }} />
                  </div>
                  <div className="w-10 text-right text-sm text-white/70">{s.count}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-semibold">Trending Skills</h2>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/80">React</span>
                <span className="text-xs text-green-400">+15%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/80">TypeScript</span>
                <span className="text-xs text-green-400">+12%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/80">Python</span>
                <span className="text-xs text-green-400">+18%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/80">AWS</span>
                <span className="text-xs text-green-400">+22%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/80">Docker</span>
                <span className="text-xs text-green-400">+8%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Skill Gaps View */}
      {activeTab === 'gaps' && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card p-6">
            <h2 className="font-semibold">Top Missing Skills</h2>
            <div className="mt-4 space-y-2">
              {topMissing.length === 0 && <div className="text-white/60 text-sm">No data.</div>}
              {topMissing.map((s) => (
                <div key={s.skill} className="flex items-center gap-3">
                  <div className="w-32 text-sm text-white/80 capitalize">{s.skill}</div>
                  <div className="flex-1 h-2 rounded bg-white/10 overflow-hidden">
                    <div className="h-full bg-accent" style={{ width: `${Math.min(100, s.count * 10)}%` }} />
                  </div>
                  <div className="w-10 text-right text-sm text-white/70">{s.count}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-semibold">High Demand Skills</h2>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/80">Machine Learning</span>
                <span className="text-xs text-red-400">Gap: 45%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/80">Cloud Architecture</span>
                <span className="text-xs text-red-400">Gap: 38%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/80">DevOps</span>
                <span className="text-xs text-red-400">Gap: 42%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/80">Cybersecurity</span>
                <span className="text-xs text-red-400">Gap: 51%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/80">Data Science</span>
                <span className="text-xs text-red-400">Gap: 33%</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* User Distribution View */}
      {activeTab === 'distribution' && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card p-6">
            <h2 className="font-semibold">Experience Level Distribution</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">User breakdown by experience levels</p>
            <div className="mt-4 space-y-3">
              {experienceLevels.map((level, index) => (
                <div key={level.level} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/80">{level.level}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{level.count.toLocaleString()}</span>
                      <span className="text-xs text-white/60">({level.percentage}%)</span>
                    </div>
                  </div>
                  <div className="w-full h-2 rounded bg-white/10 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500" 
                      style={{ width: `${level.percentage * 2.8}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="font-semibold">Skill Development Trends</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Learning patterns and skill acquisition rates</p>
            <div className="mt-4 space-y-4">
              {skillDevelopmentTrends.map((trend) => (
                <div key={trend.category} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white/90">{trend.category}</span>
                    <span className="text-xs font-medium text-green-400">{trend.growth}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/60">{trend.learners.toLocaleString()} active learners</span>
                  </div>
                  <div className="w-full h-1.5 rounded bg-white/10 overflow-hidden">
                    <div 
                      className="h-full bg-green-500" 
                      style={{ width: `${Math.min(100, trend.learners / 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="card p-6">
        <h2 className="font-semibold">Parsing Error Logs</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-white/5">
              <tr>
                <th className="text-left px-4 py-3">Resume</th>
                <th className="text-left px-4 py-3">User</th>
              </tr>
            </thead>
            <tbody>
              {errors.length === 0 && (
                <tr>
                  <td className="px-4 py-3 text-white/60" colSpan={2}>No errors.</td>
                </tr>
              )}
              {errors.map(e => (
                <tr key={e.resumeId} className="border-t border-white/5">
                  <td className="px-4 py-3">{e.resumeId}</td>
                  <td className="px-4 py-3">{e.userId}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

