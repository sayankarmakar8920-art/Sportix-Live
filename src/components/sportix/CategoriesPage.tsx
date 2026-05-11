'use client'

import { useState, useEffect, useCallback } from 'react'
import { 
  FolderOpen, Plus, Pencil, Trash2, Search, ChevronDown, 
  LayoutGrid, List, MoreHorizontal, X, RefreshCw, Check 
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

/* ═══════════════════════════════════════════════════════════════
   DESIGN SYSTEM — matches AdminPanel.tsx C object exactly
   ═══════════════════════════════════════════════════════════════ */

const C = {
  bg: '#141414',
  sidebar: '#181818',
  card: '#1a1a1a',
  cardHover: '#222222',
  border: 'rgba(255,255,255,0.08)',
  borderHover: 'rgba(255,255,255,0.12)',
  accent: '#E50914',
  accentDim: 'rgba(229,9,20,0.15)',
  accentGlow: 'rgba(229,9,20,0.30)',
  success: '#46d369',
  warning: '#f5c518',
  info: '#0071eb',
  purple: '#9b59b6',
  text: '#ffffff',
  textSec: '#b3b3b3',
  textTer: '#808080',
  textDim: '#555555',
}

function Card({ children, className = '', style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div 
      className={`rounded-2xl p-4 sm:p-5 transition-all duration-300 ${className}`} 
      style={{ background: C.card, border: `1px solid ${C.border}`, ...style }}
    >
      {children}
    </div>
  )
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editCategory, setEditCategory] = useState<any>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState('name-asc')
  const [searchQuery, setSearchQuery] = useState('')
  const [form, setForm] = useState({ name: '', description: '' })
  const [creating, setCreating] = useState(false)

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories')
      if (res.ok) {
        const data = await res.json()
        setCategories(Array.isArray(data) ? data : [])
      }
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetchCategories()
    const interval = setInterval(fetchCategories, 5000)
    const channel = supabase
      .channel('categories_updates')
      .on('postgres_changes' as any, { event: '*', table: 'Category' }, () => fetchCategories())
      .subscribe()
    return () => { 
      clearInterval(interval)
      supabase.removeChannel(channel) 
    }
  }, [fetchCategories])

  const handleCreate = async () => {
    if (!form.name.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        setForm({ name: '', description: '' })
        setShowCreate(false)
        // fetchCategories() // Real-time will catch it
      }
    } catch { /* ignore */ }
    finally { setCreating(false) }
  }

  const handleEdit = async () => {
    if (!editCategory || !form.name.trim()) return
    setCreating(true)
    try {
      const res = await fetch('/api/categories', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editCategory.id, name: form.name, description: form.description }),
      })
      if (res.ok) {
        setEditCategory(null)
        setForm({ name: '', description: '' })
        setShowCreate(false)
        // fetchCategories() // Real-time will catch it
      }
    } catch { /* ignore */ }
    finally { setCreating(false) }
  }

  const handleDelete = async (id: string) => {
    try {
      await fetch('/api/categories', { 
        method: 'DELETE', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ id }) 
      })
      setDeleteConfirm(null)
      // fetchCategories() // Real-time will catch it
    } catch { /* ignore */ }
  }

  const filtered = categories
    .filter(c => c.name?.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'name-asc') return (a.name || '').localeCompare(b.name || '')
      if (sortBy === 'name-desc') return (b.name || '').localeCompare(a.name || '')
      if (sortBy === 'newest') return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      return 0
    })

  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.03)',
    borderColor: C.border,
    borderRadius: 12,
  }

  return (
    <div className="space-y-4 fade-in-up">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${C.purple}15` }}>
            <FolderOpen className="h-5 w-5" style={{ color: C.purple }} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Categories</h2>
            <p className="text-[11px]" style={{ color: C.textTer }}>Organize your sports library into collections.</p>
          </div>
        </div>
        <button
          onClick={() => { setShowCreate(true); setEditCategory(null); setForm({ name: '', description: '' }) }}
          className="flex items-center gap-1.5 rounded-xl px-4 py-2 text-[12px] font-semibold text-white transition-all hover:opacity-90"
          style={{ background: C.accent }}
        >
          <Plus className="h-3.5 w-3.5" /> New Category
        </button>
      </div>

      {/* ── Action Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
        {[
          { title: 'CREATE NEW CATEGORY', desc: 'Add a new category to organize your content.', color: C.accent, icon: Plus, action: () => { setShowCreate(true); setEditCategory(null); setForm({ name: '', description: '' }) } },
          { title: 'EDIT CATEGORY', desc: 'Rename or update existing category details.', color: C.purple, icon: Pencil, action: () => { if (categories[0]) { setEditCategory(categories[0]); setForm({ name: categories[0].name || '', description: categories[0].description || '' }); setShowCreate(true) } } },
          { title: 'DELETE CATEGORY', desc: 'Delete a category and uncategorize its videos.', color: C.warning, icon: Trash2, action: () => { if (categories[0]) setDeleteConfirm(categories[0].id) } },
        ].map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.title}>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl flex-shrink-0" style={{ background: `${card.color}15` }}>
                  <Icon className="h-5 w-5" style={{ color: card.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-[11px] font-bold uppercase tracking-wider mb-1" style={{ color: card.color }}>{card.title}</h4>
                  <p className="text-[10px] leading-relaxed mb-3" style={{ color: C.textTer }}>{card.desc}</p>
                  <button
                    onClick={card.action}
                    className="rounded-lg border px-3 py-1.5 text-[10px] font-medium transition-colors hover:bg-white/[0.05]"
                    style={{ borderColor: C.border, color: C.textSec }}
                  >
                    {card.title.split(' ')[0]} {card.title.split(' ')[1]}
                  </button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* ── Search, Sort, View Toggle ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="flex-1 max-w-sm">
          <div className="flex items-center gap-2 rounded-xl border px-3 py-2" style={{ borderColor: C.border, background: 'rgba(255,255,255,0.02)' }}>
            <Search className="h-4 w-4" style={{ color: C.textDim }} />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search categories..." className="flex-1 bg-transparent text-sm text-white placeholder:text-white/20 focus:outline-none" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-xl border pl-3 pr-8 py-2 text-[11px] font-medium bg-transparent text-white focus:outline-none appearance-none cursor-pointer"
              style={{ borderColor: C.border, background: C.card }}
            >
              <option value="name-asc" style={{ background: C.card }}>Name A-Z</option>
              <option value="name-desc" style={{ background: C.card }}>Name Z-A</option>
              <option value="newest" style={{ background: C.card }}>Newest First</option>
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3 w-3 pointer-events-none" style={{ color: C.textDim }} />
          </div>
          <div className="flex items-center rounded-xl border overflow-hidden" style={{ borderColor: C.border }}>
            <button onClick={() => setViewMode('grid')} className="p-2 transition-colors" style={{ background: viewMode === 'grid' ? C.accent : 'transparent' }}>
              <LayoutGrid className="h-3.5 w-3.5 text-white" />
            </button>
            <button onClick={() => setViewMode('list')} className="p-2 transition-colors" style={{ background: viewMode === 'list' ? C.accent : 'transparent' }}>
              <List className="h-3.5 w-3.5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Category Grid / List ── */}
      {filtered.length === 0 && !loading ? (
        <Card className="!py-16">
          <div className="flex flex-col items-center text-center">
            <div className="h-16 w-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: `${C.purple}10` }}>
              <FolderOpen className="h-8 w-8" style={{ color: C.purple }} />
            </div>
            <h3 className="text-[15px] font-bold text-white mb-1">No categories yet?</h3>
            <p className="text-[12px] mb-4 max-w-xs" style={{ color: C.textTer }}>Create your first category to start organizing your videos.</p>
            <button
              onClick={() => { setShowCreate(true); setEditCategory(null); setForm({ name: '', description: '' }) }}
              className="flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-[12px] font-semibold text-white transition-all hover:opacity-90"
              style={{ background: C.accent }}
            >
              <Plus className="h-4 w-4" /> Create Your First Category
            </button>
          </div>
        </Card>
      ) : (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {filtered.map((cat) => (
              <Card key={cat.id} className="!p-0 overflow-hidden">
                <div className="h-28 relative" style={{ background: `linear-gradient(135deg, ${C.purple}15, ${C.accent}10)` }}>
                  <div className="absolute top-3 right-3">
                    <button className="rounded-lg p-1.5 transition-colors hover:bg-white/[0.05]">
                      <MoreHorizontal className="h-4 w-4" style={{ color: C.textTer }} />
                    </button>
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <FolderOpen className="h-10 w-10" style={{ color: `${C.purple}40` }} />
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <h4 className="text-[13px] font-bold text-white">{cat.name || 'Unnamed'}</h4>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px]" style={{ color: C.textTer }}>{cat.videoCount || 0} videos</span>
                    <span className="text-[10px]" style={{ color: C.textDim }}>•</span>
                    <span className="text-[10px]" style={{ color: C.textTer }}>Created {cat.createdAt ? new Date(cat.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'recently'}</span>
                  </div>
                  {cat.description && <p className="text-[10px] leading-relaxed" style={{ color: C.textDim }}>{cat.description}</p>}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => { setEditCategory(cat); setForm({ name: cat.name || '', description: cat.description || '' }); setShowCreate(true) }}
                      className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-medium transition-colors hover:bg-white/[0.05]"
                      style={{ color: C.purple }}
                    >
                      <Pencil className="h-3 w-3" /> Edit
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(cat.id)}
                      className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[10px] font-medium transition-colors hover:bg-white/[0.05]"
                      style={{ color: C.accent }}
                    >
                      <Trash2 className="h-3 w-3" /> Delete
                    </button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="!p-0 overflow-hidden">
            <div className="overflow-x-auto">
            <table className="w-full min-w-[500px]">
              <thead>
                <tr className="border-b" style={{ borderColor: C.border, background: 'rgba(255,255,255,0.02)' }}>
                  {['Name', 'Videos', 'Created', 'Actions'].map((h) => (
                    <th key={h} className="px-5 py-3 text-left text-[10px] font-semibold uppercase tracking-wider whitespace-nowrap" style={{ color: C.textDim }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((cat) => (
                  <tr key={cat.id} className="border-b transition-colors hover:bg-white/[0.02]" style={{ borderColor: C.border }}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <FolderOpen className="h-4 w-4" style={{ color: C.purple }} />
                        <span className="text-[12px] font-medium text-white">{cat.name || 'Unnamed'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[11px]" style={{ color: C.textSec }}>{cat.videoCount || 0}</td>
                    <td className="px-5 py-3 text-[11px]" style={{ color: C.textTer }}>{cat.createdAt ? new Date(cat.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setEditCategory(cat); setForm({ name: cat.name || '', description: cat.description || '' }); setShowCreate(true) }} className="rounded-lg p-1.5 transition-colors hover:bg-white/[0.05]" style={{ color: C.purple }}><Pencil className="h-3.5 w-3.5" /></button>
                        <button onClick={() => setDeleteConfirm(cat.id)} className="rounded-lg p-1.5 transition-colors hover:bg-white/[0.05]" style={{ color: C.accent }}><Trash2 className="h-3.5 w-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </Card>
        )
      )}

      {/* ── Create / Edit Modal ── */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <Card className="w-full max-w-md !p-6 space-y-4" style={{ animation: 'fade-in-up 0.2s ease-out' }}>
            <div className="flex items-center justify-between">
              <h3 className="text-[15px] font-bold text-white">{editCategory ? 'Edit Category' : 'Create Category'}</h3>
              <button onClick={() => { setShowCreate(false); setEditCategory(null) }} className="rounded-lg p-1.5 transition-colors hover:bg-white/[0.05]">
                <X className="h-4 w-4" style={{ color: C.textTer }} />
              </button>
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1.5" style={{ color: C.textSec }}>Category Name <span style={{ color: C.accent }}>*</span></label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full border px-3.5 py-2.5 text-sm text-white bg-transparent focus:outline-none focus:border-white/20 transition-colors"
                style={inputStyle}
                placeholder="Enter category name..."
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium mb-1.5" style={{ color: C.textSec }}>Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                className="w-full border px-3.5 py-2.5 text-sm text-white bg-transparent focus:outline-none focus:border-white/20 transition-colors resize-none"
                style={{ ...inputStyle, minHeight: 70 }}
                placeholder="Describe this category..."
                rows={3}
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => { setShowCreate(false); setEditCategory(null) }} className="flex-1 rounded-xl border px-4 py-2.5 text-[12px] font-medium transition-colors hover:bg-white/[0.05]" style={{ borderColor: C.border, color: C.textSec }}>
                Cancel
              </button>
              <button onClick={editCategory ? handleEdit : handleCreate} disabled={creating || !form.name.trim()} className="flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[12px] font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50" style={{ background: C.accent }}>
                {creating ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                {creating ? 'Saving...' : editCategory ? 'Update' : 'Create'}
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* ── Delete Confirmation Modal ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
          <Card className="w-full max-w-sm !p-6 space-y-4 text-center">
            <div className="mx-auto h-12 w-12 rounded-full flex items-center justify-center" style={{ background: `${C.accent}15` }}>
              <Trash2 className="h-6 w-6" style={{ color: C.accent }} />
            </div>
            <h3 className="text-[15px] font-bold text-white">Delete Category?</h3>
            <p className="text-[12px]" style={{ color: C.textTer }}>This action cannot be undone. All videos in this category will be uncategorized.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 rounded-xl border px-4 py-2.5 text-[12px] font-medium transition-colors hover:bg-white/[0.05]" style={{ borderColor: C.border, color: C.textSec }}>
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 rounded-xl px-4 py-2.5 text-[12px] font-semibold text-white transition-all hover:opacity-90" style={{ background: C.accent }}>
                Delete
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
