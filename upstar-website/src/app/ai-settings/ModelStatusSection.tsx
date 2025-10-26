"use client"
import { useState } from 'react'

type ModelMetric = { name: string; accuracy: number; latency: number }

export default function ModelStatusSection() {
  const [models, setModels] = useState<ModelMetric[]>([
    { name: 'Skill Extraction', accuracy: 94.2, latency: 1.2 },
    { name: 'Job Matching', accuracy: 89.7, latency: 0.8 },
    { name: 'Resume Analysis', accuracy: 91.5, latency: 2.1 },
    { name: 'Recommendation Engine', accuracy: 87.3, latency: 0.5 },
  ])

  const updateMetric = (index: number, key: keyof ModelMetric, value: number) => {
    setModels(prev => prev.map((m, i) => i === index ? { ...m, [key]: value } : m))
  }

  return (
    <section className="card p-6">
      <h2 className="text-xl font-semibold">AI Model Status</h2>
      <p className="text-[var(--text-secondary)] text-sm mb-4">Monitor the performance and health of AI models</p>
      <div className="space-y-4">
        {models.map((m, idx) => (
          <div key={m.name} className="bg-white/5 rounded-md p-4 flex items-center justify-between">
            <div>
              <div className="font-medium text-[var(--text-primary)]">{m.name}</div>
              <div className="text-xs text-[var(--text-secondary)]">Status: active</div>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-right">
                <div className="text-xs text-[var(--text-secondary)]">Accuracy</div>
                <div className="text-sm font-semibold">{m.accuracy.toFixed(1)}%</div>
                <input type="range" min={50} max={100} step={0.1} value={m.accuracy} onChange={e => updateMetric(idx, 'accuracy', parseFloat(e.target.value))} className="w-40" />
              </div>
              <div className="text-right">
                <div className="text-xs text-[var(--text-secondary)]">Latency</div>
                <div className="text-sm font-semibold">{m.latency}s</div>
                <input type="range" min={0.1} max={5} step={0.1} value={m.latency} onChange={e => updateMetric(idx, 'latency', parseFloat(e.target.value))} className="w-40" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-4 mt-6">
        <div className="bg-white/5 rounded-lg p-4">
          <div className="text-sm text-[var(--text-secondary)]">Resumes in queue</div>
          <div className="mt-2 text-2xl font-bold text-[var(--text-primary)]">23</div>
          <div className="mt-1 text-xs text-[var(--text-secondary)]">Processing Queue</div>
        </div>
        <div className="bg-white/5 rounded-lg p-4">
          <div className="text-sm text-[var(--text-secondary)]">CPU Usage</div>
          <div className="mt-2 text-2xl font-bold text-[var(--text-primary)]">67%</div>
          <div className="mt-1 text-xs text-[var(--text-secondary)]">System Resources</div>
        </div>
        <div className="bg-white/5 rounded-lg p-4">
          <div className="text-sm text-[var(--text-secondary)]">Resumes processed</div>
          <div className="mt-2 text-2xl font-bold text-[var(--text-primary)]">1,234</div>
          <div className="mt-1 text-xs text-[var(--text-secondary)]">Daily Stats</div>
        </div>
      </div>
    </section>
  )
}


