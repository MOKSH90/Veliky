import React, { useState } from 'react'
import {
  Database,
  Layers,
  Search,
  Plus,
  Clock,
  Sparkles,
  Server,
  FileText,
  Activity,
  CheckCircle2,
  X,
} from 'lucide-react'
import { useEdithAppStore } from '../../store/useEdithAppStore'

export const EdithHybridMemory: React.FC = () => {
  const {
    memories,
    memoryFilter,
    setMemoryFilter,
    addMemoryItem,
  } = useEdithAppStore()

  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [newTier, setNewTier] = useState<'working' | 'long_term'>('long_term')

  const filteredMemories = memories.filter((mem) => {
    const matchesTier = memoryFilter === 'all' || mem.tier === memoryFilter
    const matchesSearch =
      searchQuery === '' ||
      mem.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      mem.content.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesTier && matchesSearch
  })

  const tierCounts = {
    all: memories.length,
    short_term: memories.filter((m) => m.tier === 'short_term').length,
    working: memories.filter((m) => m.tier === 'working').length,
    long_term: memories.filter((m) => m.tier === 'long_term').length,
    semantic_rag: memories.filter((m) => m.tier === 'semantic_rag').length,
  }

  const handleCreateMemory = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim() || !newContent.trim()) return

    addMemoryItem({
      tier: newTier,
      title: newTitle.trim(),
      content: newContent.trim(),
      metadata: {
        category: newTier === 'long_term' ? 'User Custom Fact' : 'Working Register',
        created: 'Just now',
        source: 'Manual Operator Injection',
        accessCount: 1,
      },
    })

    setNewTitle('')
    setNewContent('')
    setShowAddModal(false)
  }

  return (
    <div className="edith-memory-view">
      {/* Header */}
      <div className="edith-memory-header">
        <div className="edith-memory-header-left">
          <h1 className="edith-memory-title">
            Hybrid 4-Tier Memory Architecture
          </h1>
          <p className="edith-memory-sub">
            Chapter 5.4 (Figure 4) · Short-Term Buffer · Working Memory Registers · PostgreSQL Durable · Semantic Vector RAG
          </p>
        </div>
        <button
          className="edith-btn-add-memory"
          onClick={() => setShowAddModal(true)}
        >
          <Plus className="w-4 h-4" />
          <span>Inject Memory Fact</span>
        </button>
      </div>

      {/* 4-Tier Visual Architecture Cards (Chapter 5.4 Figure 4) */}
      <div className="edith-memory-tiers-summary">
        {/* Tier 1 */}
        <div
          className={`edith-tier-summary-card ${
            memoryFilter === 'short_term' ? 'selected' : ''
          }`}
          onClick={() => setMemoryFilter(memoryFilter === 'short_term' ? 'all' : 'short_term')}
        >
          <div className="edith-tier-badge cyan">Tier 1: Short-Term Buffer</div>
          <div className="edith-tier-count">{tierCounts.short_term}</div>
          <h3 className="edith-tier-title">Turn Context Window</h3>
          <p className="edith-tier-desc">
            Immediate conversation state buffer; volatile, low-latency, reset per major session transition.
          </p>
        </div>

        {/* Tier 2 */}
        <div
          className={`edith-tier-summary-card ${
            memoryFilter === 'working' ? 'selected' : ''
          }`}
          onClick={() => setMemoryFilter(memoryFilter === 'working' ? 'all' : 'working')}
        >
          <div className="edith-tier-badge indigo">Tier 2: Working Memory</div>
          <div className="edith-tier-count">{tierCounts.working}</div>
          <h3 className="edith-tier-title">Task State Registers</h3>
          <p className="edith-tier-desc">
            Subtask execution scratchpad; tracks Kahn algorithm order and tool intermediate outputs without bloating LLM context.
          </p>
        </div>

        {/* Tier 3 */}
        <div
          className={`edith-tier-summary-card ${
            memoryFilter === 'long_term' ? 'selected' : ''
          }`}
          onClick={() => setMemoryFilter(memoryFilter === 'long_term' ? 'all' : 'long_term')}
        >
          <div className="edith-tier-badge emerald">Tier 3: Long-Term DB</div>
          <div className="edith-tier-count">{tierCounts.long_term}</div>
          <h3 className="edith-tier-title">PostgreSQL Durable</h3>
          <p className="edith-tier-desc">
            User persona, academic profile, preferred coding styles, and permanent facts verified across sessions.
          </p>
        </div>

        {/* Tier 4 */}
        <div
          className={`edith-tier-summary-card ${
            memoryFilter === 'semantic_rag' ? 'selected' : ''
          }`}
          onClick={() => setMemoryFilter(memoryFilter === 'semantic_rag' ? 'all' : 'semantic_rag')}
        >
          <div className="edith-tier-badge purple">Tier 4: Semantic RAG</div>
          <div className="edith-tier-count">{tierCounts.semantic_rag}</div>
          <h3 className="edith-tier-title">Vector Index (pgvector)</h3>
          <p className="edith-tier-desc">
            Dense embeddings with cosine similarity for cross-document syllabus, report, and paper recall.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="edith-memory-toolbar">
        <div className="edith-memory-filters">
          {[
            { key: 'all', label: `All Tiers (${tierCounts.all})` },
            { key: 'short_term', label: `Short-Term (${tierCounts.short_term})` },
            { key: 'working', label: `Working (${tierCounts.working})` },
            { key: 'long_term', label: `Long-Term (${tierCounts.long_term})` },
            { key: 'semantic_rag', label: `Semantic RAG (${tierCounts.semantic_rag})` },
          ].map((tab) => (
            <button
              key={tab.key}
              className={`edith-filter-chip ${memoryFilter === tab.key ? 'active' : ''}`}
              onClick={() => setMemoryFilter(tab.key as any)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="edith-memory-search-box">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            className="edith-memory-search-input"
            placeholder="Search across all 4 memory stores..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Memory Items Grid */}
      <div className="edith-memory-cards-grid">
        {filteredMemories.map((mem) => (
          <div key={mem.id} className="edith-memory-card">
            <div className="edith-memory-card-header">
              <span
                className={`edith-tier-pill ${
                  mem.tier === 'short_term'
                    ? 'cyan'
                    : mem.tier === 'working'
                    ? 'indigo'
                    : mem.tier === 'long_term'
                    ? 'emerald'
                    : 'purple'
                }`}
              >
                {mem.tier.toUpperCase().replace('_', ' ')}
              </span>
              <span className="edith-memory-id font-mono text-slate-500">{mem.id}</span>
            </div>

            <h3 className="edith-memory-card-title">{mem.title}</h3>
            <p className="edith-memory-card-content">{mem.content}</p>

            <div className="edith-memory-card-footer">
              <div className="edith-memory-meta-left">
                {mem.metadata.source && (
                  <span className="text-xs text-slate-400">
                    Source: {mem.metadata.source}
                  </span>
                )}
                {mem.metadata.category && (
                  <span className="text-xs text-indigo-300">
                    Category: {mem.metadata.category}
                  </span>
                )}
              </div>
              <div className="edith-memory-meta-right">
                <Clock className="w-3 h-3 text-slate-500" />
                <span className="text-xs text-slate-400">{mem.metadata.created}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Memory Modal */}
      {showAddModal && (
        <div className="edith-modal-overlay">
          <div className="edith-modal-box">
            <div className="edith-modal-header">
              <div className="edith-modal-title-wrap">
                <Database className="w-4 h-4 text-indigo-400" />
                <h3 className="edith-modal-title">Inject Fact into Hybrid Memory</h3>
              </div>
              <button
                className="edith-modal-close"
                onClick={() => setShowAddModal(false)}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMemory} className="edith-modal-form">
              <div className="edith-form-group">
                <label className="edith-form-label">Target Memory Tier</label>
                <div className="edith-tier-select-row">
                  <label className="edith-radio-label">
                    <input
                      type="radio"
                      name="tier"
                      value="long_term"
                      checked={newTier === 'long_term'}
                      onChange={() => setNewTier('long_term')}
                    />
                    <span>Long-Term Memory (PostgreSQL Durable)</span>
                  </label>
                  <label className="edith-radio-label">
                    <input
                      type="radio"
                      name="tier"
                      value="working"
                      checked={newTier === 'working'}
                      onChange={() => setNewTier('working')}
                    />
                    <span>Working Memory (Active Task Register)</span>
                  </label>
                </div>
              </div>

              <div className="edith-form-group">
                <label className="edith-form-label">Title / Key</label>
                <input
                  type="text"
                  className="edith-form-input"
                  placeholder="e.g. User preference: Fast-fail test execution"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </div>

              <div className="edith-form-group">
                <label className="edith-form-label">Content / Fact</label>
                <textarea
                  className="edith-form-textarea"
                  rows={4}
                  placeholder="Enter the factual statement to commit into memory..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  required
                />
              </div>

              <div className="edith-modal-actions">
                <button
                  type="button"
                  className="edith-btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="edith-btn-primary">
                  <Plus className="w-4 h-4" />
                  <span>Commit to Memory Store</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
