import { useMemo, useEffect, useRef } from 'react'
import { FolderOpen, Upload, Network, Files } from 'lucide-react'
import { useEdithStore } from '../../store/useEdithStore'
import { GraphCanvas } from './GraphCanvas'
import { GraphSettings } from './GraphSettings'

export function GraphView() {
  const wikilinkNodes = useEdithStore((s) => s.wikilinkNodes)
  const wikilinkEdges = useEdithStore((s) => s.wikilinkEdges)
  const reindexWikilinks = useEdithStore((s) => s.reindexWikilinks)
  const graphSettings = useEdithStore((s) => s.graphSettings)
  const loadLocalWorkspace = useEdithStore((s) => s.loadLocalWorkspace)
  const currentWorkspace = useEdithStore((s) => s.currentWorkspace)
  const isIndexing = useEdithStore((s) => s.isIndexingWorkspace)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Index wikilinks on mount if not already indexed
  useEffect(() => {
    if (wikilinkNodes.length === 0) reindexWikilinks()
  }, [wikilinkNodes.length, reindexWikilinks])

  const handleFolderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await loadLocalWorkspace(e.target.files)
    }
  }

  // Apply search filter and orphan filter
  const filteredNodes = useMemo(() => {
    let nodes = wikilinkNodes
    const q = graphSettings.filters.search.trim().toLowerCase()
    if (q) {
      nodes = nodes.filter(
        (n) => n.label.toLowerCase().includes(q) || n.id.toLowerCase().includes(q)
      )
    }
    if (!graphSettings.filters.orphans) {
      const linked = new Set<string>()
      wikilinkEdges.forEach((e) => {
        linked.add(e.source)
        linked.add(e.target)
      })
      nodes = nodes.filter((n) => linked.has(n.id))
    }
    return nodes
  }, [wikilinkNodes, wikilinkEdges, graphSettings.filters])

  const filteredEdges = useMemo(() => {
    const nodeIds = new Set(filteredNodes.map((n) => n.id))
    return wikilinkEdges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target))
  }, [filteredNodes, wikilinkEdges])

  return (
    <div className="standard-view graph-view" style={{ flex: 1, padding: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Dynamic Graph Top Header Bar */}
      <div
        className="graph-top-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          background: 'var(--surface-bg, rgba(18, 18, 20, 0.85))',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--surface-border, rgba(255, 255, 255, 0.08))',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
            <Network size={16} className="text-cyan-400" />
            <span>{currentWorkspace?.name || 'Knowledge Graph'}</span>
          </div>
          <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: 'var(--text-secondary)' }}>
            <span style={{ padding: '2px 8px', borderRadius: '12px', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Files size={11} /> {filteredNodes.length} Files Mapped
            </span>
            <span style={{ padding: '2px 8px', borderRadius: '12px', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Network size={11} /> {filteredEdges.length} Connections
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            style={{ display: 'none' }}
            {...({ webkitdirectory: '', directory: '' } as React.InputHTMLAttributes<HTMLInputElement>)}
            onChange={handleFolderUpload}
          />
          <button
            type="button"
            className="action-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={isIndexing}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 500,
              background: 'var(--primary-gradient, linear-[#4f46e5,#6366f1])',
              color: '#ffffff',
              border: 'none',
              cursor: isIndexing ? 'not-allowed' : 'pointer',
              opacity: isIndexing ? 0.7 : 1,
              transition: 'all 0.2s ease',
            }}
          >
            {isIndexing ? (
              <span>Reading Folder…</span>
            ) : (
              <>
                <FolderOpen size={14} />
                <span>Upload Project Folder</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="graph-stage" style={{ flex: 1, position: 'relative', borderRadius: 0, margin: 0, border: 'none', background: 'transparent', width: '100%', height: '100%' }}>
        <GraphSettings />
        {filteredNodes.length === 0 ? (
          <div className="empty-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
            <FolderOpen size={48} className="text-gray-400" />
            <strong style={{ fontSize: '16px' }}>No Workspace Files Mapped</strong>
            <span style={{ color: 'var(--text-secondary)', fontSize: '13px', maxWidth: '400px', textAlign: 'center' }}>
              Select or drag any project folder (e.g. <code>legit-app</code>, machinery, or refinery source code) to automatically build its dynamic node graph.
            </span>
            <button
              type="button"
              className="action-btn"
              onClick={() => fileInputRef.current?.click()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                background: '#4f46e5',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <Upload size={16} />
              <span>Select Project Folder</span>
            </button>
          </div>
        ) : (
          <GraphCanvas nodes={filteredNodes} edges={filteredEdges} />
        )}
      </div>
    </div>
  )
}
