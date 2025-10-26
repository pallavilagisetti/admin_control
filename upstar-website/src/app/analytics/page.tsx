"use client"
import { useMemo, useState } from 'react'

type Gap = { name: string; score: number; tag: 'Very High' | 'High' | 'Medium' }
type TabType = 'Skill Analysis' | 'Market Trends' | 'Job Performance' | 'Geographic'

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('Skill Analysis')

  const gaps: Gap[] = useMemo(() => (
    [
      { name: 'React', score: 85, tag: 'High' },
      { name: 'Python', score: 78, tag: 'Very High' },
      { name: 'AWS', score: 72, tag: 'High' },
      { name: 'Docker', score: 68, tag: 'Medium' },
      { name: 'TypeScript', score: 65, tag: 'High' },
      { name: 'Kubernetes', score: 58, tag: 'Medium' },
    ]
  ), [])

  const emerging = [
    { name: 'AI/ML', growth: '+245%', requests: 1847 },
    { name: 'Blockchain', growth: '+198%', requests: 892 },
    { name: 'DevOps', growth: '+156%', requests: 2341 },
    { name: 'Cloud Security', growth: '+134%', requests: 1456 },
    { name: 'Data Science', growth: '+89%', requests: 2987 },
  ]

  const jobPerformanceData = {
    clickThroughRate: { value: '12.8%', change: '+2.3%', positive: true },
    applicationRate: { value: '8.4%', change: '+1.2%', positive: true },
    interviewSuccess: { value: '34.7%', change: '-0.8%', positive: false },
    jobMatchAccuracy: { value: '89.2%', change: '+5.1%', positive: true }
  }

  const aiMetrics = {
    resumeProcessingTime: '2.3s',
    skillExtractionAccuracy: '94.2%',
    jobMatchConfidence: '87.8%',
    apiResponseTime: '156ms'
  }

  const geographicData = [
    { region: 'North America', users: 5847, percentage: 45.5 },
    { region: 'Europe', users: 3234, percentage: 25.2 },
    { region: 'Asia Pacific', users: 2876, percentage: 22.4 },
    { region: 'Latin America', users: 567, percentage: 4.4 },
    { region: 'Others', users: 323, percentage: 2.5 }
  ]

  const marketTrends = [
    { skill: 'Artificial Intelligence', demand: 95, growth: '+34%', salary: '$125k' },
    { skill: 'Cloud Computing', demand: 88, growth: '+28%', salary: '$110k' },
    { skill: 'Cybersecurity', demand: 82, growth: '+22%', salary: '$118k' },
    { skill: 'Data Science', demand: 79, growth: '+19%', salary: '$108k' },
    { skill: 'DevOps', demand: 75, growth: '+15%', salary: '$105k' }
  ]

  const renderSkillAnalysis = () => (
    <div className="grid lg:grid-cols-3 gap-6">
      <section className="card p-6 lg:col-span-2">
        <h2 className="text-xl font-semibold">Skill Gap Heatmap</h2>
        <p className="text-[var(--text-secondary)] text-sm">Most in-demand skills with highest gap scores</p>
        <div className="mt-4 space-y-4">
          {gaps.map(g => (
            <div key={g.name}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className="font-medium">{g.name}</div>
                  <span className={`text-2xs px-2 py-0.5 rounded-full border ${g.tag === 'Very High' ? 'border-red-400 text-red-300' : g.tag === 'High' ? 'border-yellow-400 text-yellow-300' : 'border-blue-400 text-blue-300'}`}>{g.tag}</span>
                </div>
                <div className="text-xs text-[var(--text-secondary)]">{g.score}%</div>
              </div>
              <div className="h-2 rounded bg-white/10 overflow-hidden">
                <div className="h-full bg-[var(--accent)]" style={{ width: `${g.score}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-xl font-semibold">Emerging Skills</h2>
        <p className="text-[var(--text-secondary)] text-sm">Fastest growing skills by user interest</p>
        <div className="mt-4 space-y-3">
          {emerging.map(e => (
            <div key={e.name} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-md px-4 py-3">
              <div>
                <div className="font-medium">{e.name}</div>
                <div className="text-xs text-[var(--text-secondary)]">{e.requests.toLocaleString()} requests</div>
              </div>
              <div className="text-xs text-green-400">{e.growth}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )

  const renderMarketTrends = () => (
    <div className="grid lg:grid-cols-2 gap-6">
      <section className="card p-6">
        <h2 className="text-xl font-semibold">📈 Market Demand Trends</h2>
        <p className="text-[var(--text-secondary)] text-sm">Skills with highest market demand and growth</p>
        <div className="mt-4 space-y-4">
          {marketTrends.map(trend => (
            <div key={trend.skill} className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium">{trend.skill}</div>
                <div className="text-sm text-green-400">{trend.growth}</div>
              </div>
              <div className="flex items-center justify-between text-sm text-[var(--text-secondary)]">
                <div>Demand Score: {trend.demand}%</div>
                <div>Avg Salary: {trend.salary}</div>
              </div>
              <div className="mt-2 h-2 rounded bg-white/10 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500" style={{ width: `${trend.demand}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="card p-6">
        <h2 className="text-xl font-semibold">🔥 Trending Technologies</h2>
        <p className="text-[var(--text-secondary)] text-sm">Fastest growing technologies in the market</p>
        <div className="mt-4 space-y-3">
          {emerging.map(e => (
            <div key={e.name} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-md px-4 py-3">
              <div>
                <div className="font-medium">{e.name}</div>
                <div className="text-xs text-[var(--text-secondary)]">{e.requests.toLocaleString()} job postings</div>
              </div>
              <div className="text-xs text-green-400 font-semibold">{e.growth}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )

  const renderJobPerformance = () => (
    <div className="grid lg:grid-cols-2 gap-6">
      <section className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
            <span className="text-purple-400">🎯</span>
          </div>
          <div>
            <h2 className="text-xl font-semibold">Job Recommendation Performance</h2>
            <p className="text-[var(--text-secondary)] text-sm">Key metrics for job matching algorithm</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="text-sm text-[var(--text-secondary)]">Click-through Rate</div>
            <div className="text-2xl font-bold">{jobPerformanceData.clickThroughRate.value}</div>
            <div className={`text-xs ${jobPerformanceData.clickThroughRate.positive ? 'text-green-400' : 'text-red-400'}`}>
              {jobPerformanceData.clickThroughRate.change}
            </div>
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="text-sm text-[var(--text-secondary)]">Application Rate</div>
            <div className="text-2xl font-bold">{jobPerformanceData.applicationRate.value}</div>
            <div className={`text-xs ${jobPerformanceData.applicationRate.positive ? 'text-green-400' : 'text-red-400'}`}>
              {jobPerformanceData.applicationRate.change}
            </div>
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="text-sm text-[var(--text-secondary)]">Interview Success</div>
            <div className="text-2xl font-bold">{jobPerformanceData.interviewSuccess.value}</div>
            <div className={`text-xs ${jobPerformanceData.interviewSuccess.positive ? 'text-green-400' : 'text-red-400'}`}>
              {jobPerformanceData.interviewSuccess.change}
            </div>
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="text-sm text-[var(--text-secondary)]">Job Match Accuracy</div>
            <div className="text-2xl font-bold">{jobPerformanceData.jobMatchAccuracy.value}</div>
            <div className={`text-xs ${jobPerformanceData.jobMatchAccuracy.positive ? 'text-green-400' : 'text-red-400'}`}>
              {jobPerformanceData.jobMatchAccuracy.change}
            </div>
          </div>
        </div>
      </section>

      <section className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <span className="text-yellow-400">⚡</span>
          </div>
          <div>
            <h2 className="text-xl font-semibold">AI Processing Metrics</h2>
            <p className="text-[var(--text-secondary)] text-sm">Algorithm performance and processing stats</p>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-[var(--text-secondary)]">Resume Processing Time</div>
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
            </div>
            <div className="text-2xl font-bold">{aiMetrics.resumeProcessingTime}</div>
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-[var(--text-secondary)]">Skill Extraction Accuracy</div>
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
            </div>
            <div className="text-2xl font-bold">{aiMetrics.skillExtractionAccuracy}</div>
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-[var(--text-secondary)]">Job Match Confidence</div>
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
            </div>
            <div className="text-2xl font-bold">{aiMetrics.jobMatchConfidence}</div>
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-[var(--text-secondary)]">API Response Time</div>
              <div className="w-2 h-2 rounded-full bg-green-400"></div>
            </div>
            <div className="text-2xl font-bold">{aiMetrics.apiResponseTime}</div>
          </div>
        </div>
      </section>
    </div>
  )

  const renderGeographic = () => (
    <div className="grid lg:grid-cols-1 gap-6">
      <section className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
            <span className="text-blue-400">🌍</span>
          </div>
          <div>
            <h2 className="text-xl font-semibold">Geographic Distribution</h2>
            <p className="text-[var(--text-secondary)] text-sm">User distribution across different regions</p>
          </div>
        </div>
        
        <div className="space-y-4">
          {geographicData.map(region => (
            <div key={region.region} className="bg-white/5 border border-white/10 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium">{region.region}</div>
                <div className="text-right">
                  <div className="font-semibold">{region.users.toLocaleString()} users</div>
                  <div className="text-sm text-[var(--text-secondary)]">{region.percentage}%</div>
                </div>
              </div>
              <div className="h-3 rounded bg-white/10 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-purple-500" 
                  style={{ width: `${region.percentage}%` }} 
                />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )

  const renderActiveTabContent = () => {
    switch (activeTab) {
      case 'Skill Analysis':
        return renderSkillAnalysis()
      case 'Market Trends':
        return renderMarketTrends()
      case 'Job Performance':
        return renderJobPerformance()
      case 'Geographic':
        return renderGeographic()
      default:
        return renderSkillAnalysis()
    }
  }

  return (
    <div className="space-y-6">
      <section className="card p-6">
        <h1 className="text-3xl font-bold">Advanced Analytics</h1>
        <p className="text-[var(--text-secondary)] mt-1">Deep insights into skills, trends, and platform performance</p>
      </section>

      <div className="card p-2">
        <div className="grid grid-cols-4 gap-2">
          {(['Skill Analysis', 'Market Trends', 'Job Performance', 'Geographic'] as const).map(t => (
            <button 
              key={t} 
              onClick={() => setActiveTab(t)} 
              className={`px-3 py-2 rounded-md text-sm transition-all duration-200 ${
                activeTab === t 
                  ? 'bg-white/10 border border-white/20 text-white font-medium' 
                  : 'bg-white/5 border border-white/10 text-white/80 hover:bg-white/8 hover:text-white/90'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {renderActiveTabContent()}
    </div>
  )
}



