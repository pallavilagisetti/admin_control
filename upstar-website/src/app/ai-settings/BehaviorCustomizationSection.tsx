"use client"
import { useState } from 'react'

export default function BehaviorCustomizationSection() {
  const [instructions, setInstructions] = useState(
    'Focus on matching skills with high precision and consider both technical and soft skills when analyzing resumes.'
  )
  const [priorities, setPriorities] = useState({
    technical: 80,
    soft: 70,
    industry: 60,
    education: 50,
  })
  const [options, setOptions] = useState({
    realtime: true,
    batch: false,
    quality: true,
    errorCorrection: true,
  })

  return (
    <section className="card p-6">
      <h2 className="text-xl font-semibold mb-4">AI Behavior Customization</h2>
      <div className="grid lg:grid-cols-2 gap-6">
        <div>
          <div className="text-sm font-medium mb-2">Custom AI Instructions</div>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            className="input-field w-full h-28"
          />

          <div className="mt-6 space-y-4">
            {([
              ['Technical Skills', 'technical'],
              ['Soft Skills', 'soft'],
              ['Industry Experience', 'industry'],
              ['Education Level', 'education'],
            ] as const).map(([label, key]) => (
              <div key={key}>
                <div className="flex items-center justify-between mb-1">
                  <div className="text-sm">{label}</div>
                  <div className="text-sm font-medium">{(priorities as any)[key]}%</div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={(priorities as any)[key]}
                  onChange={(e) => setPriorities({ ...priorities, [key]: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="text-sm font-medium mb-2">Processing Options</div>
          <div className="space-y-3">
            {([
              ['Real-time Processing', 'realtime'],
              ['Batch Processing', 'batch'],
              ['Quality Checks', 'quality'],
              ['Error Correction', 'errorCorrection'],
            ] as const).map(([label, key]) => (
              <label key={key} className="flex items-center justify-between bg-white/5 rounded-md px-4 py-3">
                <span className="text-sm">{label}</span>
                <button
                  type="button"
                  onClick={() => setOptions({ ...options, [key]: !(options as any)[key] })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    (options as any)[key] ? 'bg-[var(--accent)]' : 'bg-white/20'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      (options as any)[key] ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </label>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}


