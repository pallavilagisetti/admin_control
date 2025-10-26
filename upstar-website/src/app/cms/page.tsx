"use client"
import { useState } from 'react'
import ReadOnlyIndicator, { ReadOnlyButton, ReadOnlyInput, ReadOnlyForm } from '@/components/ReadOnlyIndicator'
import { useAuth } from '@/contexts/AuthContext'

type Article = { id: string; title: string; slug: string; content: string; updatedAt: number }

export default function CMSPage() {
  const { canWrite } = useAuth()
  const [articles, setArticles] = useState<Article[]>([
    { id: '1', title: 'Getting Started', slug: 'getting-started', content: 'Welcome to our platform...', updatedAt: Date.now() },
    { id: '2', title: 'FAQ', slug: 'faq', content: 'Frequently asked questions...', updatedAt: Date.now() }
  ])
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [content, setContent] = useState('')

  const create = () => {
    const newArticle = { id: Date.now().toString(), title, slug, content, updatedAt: Date.now() }
    setArticles([newArticle, ...articles])
    setTitle('')
    setSlug('')
    setContent('')
  }

  const update = (id: string) => {
    setArticles(prev => prev.map(a => a.id === id ? { ...a, title, slug, content, updatedAt: Date.now() } : a))
  }

  const remove = (id: string) => {
    setArticles(prev => prev.filter(a => a.id !== id))
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Help Center CMS</h1>
        <p className="text-[var(--text-secondary)] mt-1">Manage support articles</p>
      </div>

      <ReadOnlyIndicator permission="cms:write">
        <div className="card p-6 grid gap-3">
          <div className="grid md:grid-cols-3 gap-3">
            <ReadOnlyInput permission="cms:write">
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title" className="input-field" />
            </ReadOnlyInput>
            <ReadOnlyInput permission="cms:write">
              <input value={slug} onChange={e => setSlug(e.target.value)} placeholder="Slug" className="input-field" />
            </ReadOnlyInput>
            <ReadOnlyButton onClick={create} permission="cms:write" className="btn-secondary">Create</ReadOnlyButton>
          </div>
          <ReadOnlyInput permission="cms:write">
            <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Content" className="input-field h-24" />
          </ReadOnlyInput>
        </div>
      </ReadOnlyIndicator>

      <div className="card overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-[var(--border)]">
            <tr>
              <th className="text-left px-6 py-4 text-sm font-medium">Title</th>
              <th className="text-left px-6 py-4 text-sm font-medium">Slug</th>
              <th className="text-right px-6 py-4 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {articles.map(a => (
              <tr key={a.id}>
                <td className="px-6 py-4">{a.title}</td>
                <td className="px-6 py-4">{a.slug}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex gap-2 justify-end">
                    <ReadOnlyButton onClick={() => update(a.id)} permission="cms:write" className="btn-secondary text-xs">Update</ReadOnlyButton>
                    <ReadOnlyButton onClick={() => remove(a.id)} permission="cms:write" className="px-3 py-1.5 rounded-md bg-red-500 hover:bg-red-600 text-white text-xs">Delete</ReadOnlyButton>
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



