"use client"
import { useState } from 'react'
import ModelStatusSection from './ModelStatusSection'
import BehaviorCustomizationSection from './BehaviorCustomizationSection'

interface AISetting {
  id: string
  name: string
  description: string
  value: number | boolean | string
  type: 'slider' | 'toggle' | 'select' | 'input'
  min?: number
  max?: number
  step?: number
  options?: { value: string; label: string }[]
  category: string
}

export default function AISettingsPage() {
  const [settings, setSettings] = useState<AISetting[]>([
    {
      id: 'confidence_threshold',
      name: 'Confidence Threshold',
      description: 'Minimum confidence score for AI predictions',
      value: 0.85,
      type: 'slider',
      min: 0.1,
      max: 1.0,
      step: 0.05,
      category: 'Prediction'
    },
    {
      id: 'auto_processing',
      name: 'Auto Processing',
      description: 'Automatically process uploaded resumes',
      value: true,
      type: 'toggle',
      category: 'Processing'
    },
    {
      id: 'skill_matching_algorithm',
      name: 'Skill Matching Algorithm',
      description: 'Algorithm used for skill matching',
      value: 'semantic',
      type: 'select',
      options: [
        { value: 'semantic', label: 'Semantic Similarity' },
        { value: 'keyword', label: 'Keyword Matching' },
        { value: 'hybrid', label: 'Hybrid Approach' }
      ],
      category: 'Matching'
    },
    {
      id: 'max_skills_per_resume',
      name: 'Max Skills per Resume',
      description: 'Maximum number of skills to extract per resume',
      value: 50,
      type: 'input',
      category: 'Extraction'
    },
    {
      id: 'enable_sentiment_analysis',
      name: 'Sentiment Analysis',
      description: 'Enable sentiment analysis for job descriptions',
      value: false,
      type: 'toggle',
      category: 'Analysis'
    },
    {
      id: 'processing_timeout',
      name: 'Processing Timeout',
      description: 'Maximum time allowed for processing (seconds)',
      value: 30,
      type: 'slider',
      min: 5,
      max: 120,
      step: 5,
      category: 'Performance'
    },
    {
      id: 'model_version',
      name: 'AI Model Version',
      description: 'Version of the AI model to use',
      value: 'v2.1',
      type: 'select',
      options: [
        { value: 'v2.1', label: 'Version 2.1 (Latest)' },
        { value: 'v2.0', label: 'Version 2.0' },
        { value: 'v1.9', label: 'Version 1.9' }
      ],
      category: 'Model'
    },
    {
      id: 'enable_learning',
      name: 'Continuous Learning',
      description: 'Enable model learning from user feedback',
      value: true,
      type: 'toggle',
      category: 'Learning'
    }
  ])

  const [activeCategory, setActiveCategory] = useState<string>('All')
  const [hasChanges, setHasChanges] = useState(false)

  const categories = ['All', ...Array.from(new Set(settings.map(s => s.category)))]

  const filteredSettings = activeCategory === 'All' 
    ? settings 
    : settings.filter(s => s.category === activeCategory)

  const updateSetting = (id: string, value: any) => {
    setSettings(prev => prev.map(s => s.id === id ? { ...s, value } : s))
    setHasChanges(true)
  }

  const saveSettings = () => {
    // Simulate saving settings
    console.log('Saving settings:', settings)
    setHasChanges(false)
    // Here you would typically make an API call to save the settings
  }

  const resetSettings = () => {
    // Reset to default values
    setSettings(prev => prev.map(s => ({
      ...s,
      value: s.id === 'confidence_threshold' ? 0.85 :
             s.id === 'auto_processing' ? true :
             s.id === 'skill_matching_algorithm' ? 'semantic' :
             s.id === 'max_skills_per_resume' ? 50 :
             s.id === 'enable_sentiment_analysis' ? false :
             s.id === 'processing_timeout' ? 30 :
             s.id === 'model_version' ? 'v2.1' :
             s.id === 'enable_learning' ? true : s.value
    })))
    setHasChanges(false)
  }

  const renderSetting = (setting: AISetting) => {
    switch (setting.type) {
      case 'slider':
        return (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{setting.min}</span>
              <span className="font-medium">{setting.value}</span>
              <span>{setting.max}</span>
            </div>
            <input
              type="range"
              min={setting.min}
              max={setting.max}
              step={setting.step}
              value={Number(setting.value)}
              onChange={(e) => updateSetting(setting.id, parseFloat(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
        )
      case 'toggle':
        return (
          <button
            onClick={() => updateSetting(setting.id, !setting.value)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              setting.value ? 'bg-[var(--accent)]' : 'bg-white/20'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                setting.value ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        )
      case 'select':
        return (
          <select
            value={String(setting.value)}
            onChange={(e) => updateSetting(setting.id, e.target.value)}
            className="input-field"
          >
            {setting.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )
      case 'input':
        return (
          <input
            type="number"
            value={Number(setting.value)}
            onChange={(e) => updateSetting(setting.id, parseInt(e.target.value))}
            className="input-field"
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="grid gap-6">
      {/* Header */}
      <section className="card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">AI Settings & Controls</h1>
            <p className="text-[var(--text-secondary)] mt-1">Configure AI algorithms and processing parameters</p>
          </div>
          <div className="flex items-center gap-3">
            {hasChanges && (
              <div className="text-sm text-yellow-400">Unsaved changes</div>
            )}
            <button
              onClick={resetSettings}
              className="btn-secondary"
            >
              Reset to Defaults
            </button>
            <button
              onClick={saveSettings}
              className={`btn-primary ${hasChanges ? 'opacity-100' : 'opacity-50'}`}
              disabled={!hasChanges}
            >
              Save Settings
            </button>
          </div>
        </div>
      </section>

      {/* Category Filter */}
      <section className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Categories</h2>
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeCategory === category
                  ? 'bg-[var(--accent)] text-white'
                  : 'bg-white/5 text-[var(--text-secondary)] hover:bg-white/10'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      {/* Settings Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {filteredSettings.map(setting => (
          <div key={setting.id} className="card p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">{setting.name}</h3>
                <p className="text-sm text-[var(--text-secondary)] mt-1">{setting.description}</p>
              </div>
              <span className="text-xs px-2 py-1 bg-white/10 rounded-full text-[var(--text-secondary)]">
                {setting.category}
              </span>
            </div>
            <div className="mt-4">
              {renderSetting(setting)}
            </div>
          </div>
        ))}
      </div>

      {/* AI Model Status (editable summary) */}
      <ModelStatusSection />

      {/* AI Behavior Customization (like screenshot) */}
      <BehaviorCustomizationSection />
    </div>
  )
}



