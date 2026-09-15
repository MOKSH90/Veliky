import React, { useState } from 'react'
import {
  Search,
  FileText,
  Sliders,
  Sparkles,
  Database,
  Tag,
  Hash,
  ArrowUpRight,
  Clock,
  Layers,
  CheckCircle2,
} from 'lucide-react'
import { useEdithAppStore } from '../../store/useEdithAppStore'

export const EdithKnowledgeRag: React.FC = () => {
  const {
    ragChunks,
    ragTopK,
    setRagTopK,
    ragSearchQuery,
    setRagSearchQuery,
  } = useEdithAppStore()

  const [localQuery, setLocalQuery] = useState(ragSearchQuery)

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setRagSearchQuery(localQuery)
  }

  const filteredChunks = ragChunks
    .filter((chunk) => {
      if (!ragSearchQuery) return true
      const q = ragSearchQuery.toLowerCase()
      return (
        chunk.text.toLowerCase().includes(q) ||
        chunk.documentName.toLowerCase().includes(q) ||
        chunk.tags.some((t) => t.toLowerCase().includes(q))
      )
    })
    .slice(0, ragTopK)

  const sampleQueries = [
    'orchestrator architecture',
    'Kahn DAG dependency planning',
    '3-tier policy engine risk',
    'DAA knapsack syllabus',
  ]

  return (
    <div className="edith-rag-view">
      {/* Header */}
      <div className="edith-rag-header">
        <div className="edith-rag-header-left">
          <h1 className="edith-rag-title">
            Knowledge System (Document RAG)
          </h1>
          <p className="edith-rag-sub">
            Chapter 5.5 · Recursive Chunking · 1536-Dimensional Dense Embeddings · Cosine Vector Retrieval
          </p>
        </div>
        <div className="edith-rag-header-stats">
          <div className="edith-rag-stat-pill">
            <Database className="w-3.5 h-3.5 text-indigo-400" />
            <span>162 Chunks Indexed</span>
          </div>
          <div className="edith-rag-stat-pill">
            <Layers className="w-3.5 h-3.5 text-purple-400" />
            <span>Dim: 1536-d</span>
          </div>
          <div className="edith-rag-stat-pill">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>Latency: &lt; 14ms</span>
          </div>
        </div>
      </div>

      {/* Ingested Documents Ribbon */}
      <div className="edith-docs-catalog-card">
        <div className="edith-catalog-header">
          <FileText className="w-4 h-4 text-cyan-400" />
          <h2 className="edith-catalog-title">Ingested Document Catalog</h2>
        </div>
        <div className="edith-docs-grid">
          <div className="edith-doc-item">
            <div className="edith-doc-icon-wrap indigo">
              <FileText className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="edith-doc-info">
              <div className="edith-doc-name">EDITH_Project_Report.docx</div>
              <div className="edith-doc-meta">
                <span>128 Chunks</span>
                <span className="dot">·</span>
                <span>33 Pages</span>
                <span className="dot">·</span>
                <span className="text-emerald-400">pgvector Indexed</span>
              </div>
            </div>
          </div>

          <div className="edith-doc-item">
            <div className="edith-doc-icon-wrap cyan">
              <FileText className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="edith-doc-info">
              <div className="edith-doc-name">Kurukshetra_Univ_DAA_Syllabus.pdf</div>
              <div className="edith-doc-meta">
                <span>34 Chunks</span>
                <span className="dot">·</span>
                <span>4 Units</span>
                <span className="dot">·</span>
                <span className="text-emerald-400">pgvector Indexed</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Semantic Search Controls */}
      <div className="edith-rag-controls-card">
        <form onSubmit={handleSearchSubmit} className="edith-rag-search-form">
          <div className="edith-rag-search-input-wrap">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              className="edith-rag-search-input"
              placeholder="Search documents with cosine semantic similarity..."
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
            />
          </div>
          <button type="submit" className="edith-btn-primary">
            <span>Vector Query</span>
            <Sparkles className="w-4 h-4" />
          </button>
        </form>

        {/* Top-K Slider & Sample Chips */}
        <div className="edith-rag-controls-row">
          <div className="edith-topk-slider-wrap">
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-xs text-slate-300 font-mono">Top-K Chunks: {ragTopK}</span>
            <input
              type="range"
              min={1}
              max={10}
              value={ragTopK}
              onChange={(e) => setRagTopK(Number(e.target.value))}
              className="edith-slider"
            />
          </div>

          <div className="edith-rag-sample-chips">
            <span className="text-xs text-slate-400">Sample Queries:</span>
            {sampleQueries.map((sample, i) => (
              <button
                key={i}
                type="button"
                className="edith-sample-chip"
                onClick={() => {
                  setLocalQuery(sample)
                  setRagSearchQuery(sample)
                }}
              >
                {sample}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Retrieved Chunks Display */}
      <div className="edith-chunks-section">
        <div className="edith-chunks-section-header">
          <h3 className="edith-chunks-heading">
            Retrieved Chunks ({filteredChunks.length} matches)
          </h3>
          <span className="text-xs text-slate-400">
            Ranked by Cosine Distance score
          </span>
        </div>

        <div className="edith-chunks-list">
          {filteredChunks.map((chunk) => {
            const pct = Math.round(chunk.similarityScore * 100)
            return (
              <div key={chunk.id} className="edith-chunk-card">
                <div className="edith-chunk-card-header">
                  <div className="edith-chunk-source-wrap">
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="font-medium text-slate-200">{chunk.documentName}</span>
                    <span className="edith-chunk-badge">
                      Chunk #{chunk.chunkIndex} / {chunk.totalChunks}
                    </span>
                  </div>

                  {/* Similarity Score Meter */}
                  <div className="edith-similarity-meter">
                    <span className="edith-similarity-label">Similarity:</span>
                    <span className="edith-similarity-score font-mono">{pct}%</span>
                    <div className="edith-similarity-bar">
                      <div
                        className="edith-similarity-fill"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>

                <p className="edith-chunk-text">{chunk.text}</p>

                <div className="edith-chunk-footer">
                  <div className="edith-chunk-tags">
                    {chunk.tags.map((tag, tIdx) => (
                      <span key={tIdx} className="edith-tag-pill">
                        <Tag className="w-2.5 h-2.5 mr-1 text-slate-400" />
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="edith-chunk-meta">
                    <span className="font-mono text-xs text-slate-500">
                      Vector ID: {chunk.vectorId}
                    </span>
                    <span className="dot">·</span>
                    <span className="font-mono text-xs text-slate-500">
                      {chunk.tokens} tokens
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
