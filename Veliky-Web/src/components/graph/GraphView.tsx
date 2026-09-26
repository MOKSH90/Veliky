import { useMemo, useEffect, useState, useRef } from 'react'
import { Network, Files, Play, Pause, RotateCcw, Download, Layers, ShieldCheck, Sparkles } from 'lucide-react'
import { useEdithStore } from '../../store/useEdithStore'
import { GraphCanvas, type CanvasGraphNode, type CanvasGraphEdge } from './GraphCanvas'
import { GraphSettings } from './GraphSettings'
import { checkClearance } from '../../lib/authPersonas'

const TIMELINE_MILESTONES = [
  { date: '2026-01-15T09:00:00Z', label: 'Jan 15: Commissioning Baseline (2.8 mm/s)' },
  { date: '2026-02-01T10:00:00Z', label: 'Feb 01: ISO 10816-3 SOP Ingested' },
  { date: '2026-06-12T16:00:00Z', label: 'Jun 12: Mechanical Seal Overhaul #184' },
  { date: '2026-08-28T14:30:00Z', label: 'Aug 28: Inspection Report #62 Alert (5.4 mm/s)' },
  { date: '2026-08-29T08:15:00Z', label: 'Aug 29: Work Order Ticket #4471 Logged' },
  { date: '2026-09-03T18:22:00Z', label: 'Sep 03: Proactive Sensor Watcher Trip' },
  { date: '2026-09-11T13:46:20Z', label: 'Sep 11: Root Cause Investigation INV-2026-001' },
  { date: '2026-09-14T12:00:00Z', label: 'Sep 14: Sovereign Audit Ledger Verified' },
]

export function GraphView() {
  const wikilinkNodes = useEdithStore((s) => s.wikilinkNodes)
  const wikilinkEdges = useEdithStore((s) => s.wikilinkEdges)
  const reindexWikilinks = useEdithStore((s) => s.reindexWikilinks)
  const graphSettings = useEdithStore((s) => s.graphSettings)
  const setGraphSettings = useEdithStore((s) => s.setGraphSettings)
  const user = useEdithStore((s) => s.authUser)

  const [isPlaying, setIsPlaying] = useState(false)
  const [milestoneIndex, setMilestoneIndex] = useState(TIMELINE_MILESTONES.length - 1)
  const playTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Re-index on mount if empty
  useEffect(() => {
    if (wikilinkNodes.length === 0) reindexWikilinks()
  }, [wikilinkNodes.length, reindexWikilinks])

  // Handle timeline scrubbing playback
  useEffect(() => {
    if (isPlaying) {
      playTimerRef.current = setInterval(() => {
        setMilestoneIndex((prev) => {
          const next = prev + 1
          if (next >= TIMELINE_MILESTONES.length) {
            setIsPlaying(false)
            return prev
          }
          setGraphSettings((s) => ({ ...s, timelineScrubDate: TIMELINE_MILESTONES[next].date }))
          return next
        })
      }, 1800)
    } else if (playTimerRef.current) {
      clearInterval(playTimerRef.current)
    }
    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current)
    }
  }, [isPlaying, setGraphSettings])

  const handleMilestoneChange = (idx: number) => {
    setMilestoneIndex(idx)
    setGraphSettings((s) => ({ ...s, timelineScrubDate: TIMELINE_MILESTONES[idx].date }))
  }

  // Filter nodes based on: domain preset, search, orphans, and RBAC clearance
  const filteredNodes = useMemo(() => {
    let nodes = wikilinkNodes as CanvasGraphNode[]

    // 1. RBAC Clearance filtering (Sec 5.5 / 15: Permission-Aware RAG)
    nodes = nodes.filter((n) => checkClearance(user?.clearance, n.clearance))

    // 2. Domain Presets (Sec 6.2 Org Hierarchy & Equipment Subgraphs)
    if (graphSettings.domainPreset === 'equipment') {
      nodes = nodes.filter((n) => n.group === 'Equipment' || n.group === 'SOPs')
    } else if (graphSettings.domainPreset === 'org') {
      nodes = nodes.filter((n) => n.group === 'People' || n.group === 'Tickets')
    } else if (graphSettings.domainPreset === 'investigations') {
      nodes = nodes.filter((n) => n.group === 'Investigations' || n.group === 'Reports' || n.group === 'Agent-Generated')
    }

    // 3. Search query filter
    const q = graphSettings.filters.search.trim().toLowerCase()
    if (q) {
      nodes = nodes.filter((n) => n.label.toLowerCase().includes(q) || n.id.toLowerCase().includes(q))
    }

    // 4. Orphan toggle
    if (!graphSettings.filters.orphans) {
      const linked = new Set<string>()
      wikilinkEdges.forEach((e) => {
        linked.add(e.source)
        linked.add(e.target)
      })
      nodes = nodes.filter((n) => linked.has(n.id))
    }

    return nodes
  }, [wikilinkNodes, wikilinkEdges, graphSettings.filters, graphSettings.domainPreset, user])

  const filteredEdges = useMemo(() => {
    const nodeIds = new Set(filteredNodes.map((n) => n.id))
    return wikilinkEdges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target)) as CanvasGraphEdge[]
  }, [filteredNodes, wikilinkEdges])

  const handleExportJson = () => {
    const data = {
      nodes: filteredNodes,
      edges: filteredEdges,
      exportedAt: new Date().toISOString(),
      clearanceEnforced: user?.clearance
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `veliky-vault-graph-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="standard-view graph-view" style={{ flex: 1, padding: 0, display: 'flex', flexDirection: 'column', height: '100%', position: 'relative' }}>
      
      {/* Top Header Bar */}
      <div
        className="graph-top-header"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          background: 'rgba(18, 18, 22, 0.95)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: '#fff' }}>
            <Network size={16} className="text-cyan-400" />
            <span>Obsidian Knowledge Graph</span>
          </div>

          {/* Subgraph Domain Presets (Sec 6.2) */}
          <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.04)', padding: '2px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
            {(['all', 'equipment', 'org', 'investigations'] as const).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setGraphSettings((s) => ({ ...s, domainPreset: preset }))}
                style={{
                  padding: '3px 9px',
                  borderRadius: '4px',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  background: graphSettings.domainPreset === preset ? '#6366f1' : 'transparent',
                  color: graphSettings.domainPreset === preset ? '#fff' : 'rgba(255,255,255,0.6)'
                }}
              >
                {preset === 'all' ? 'All Vault' : preset === 'equipment' ? 'Equipment' : preset === 'org' ? 'Org Hierarchy' : 'Incidents'}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '8px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>
            <span style={{ padding: '2px 8px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Files size={11} /> {filteredNodes.length} Notes
            </span>
            <span style={{ padding: '2px 8px', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Network size={11} /> {filteredEdges.length} Links
            </span>
          </div>
        </div>

        {/* Top Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={handleExportJson}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 10px',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'rgba(255,255,255,0.8)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
            title="Export Graph as JSON"
          >
            <Download size={12} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <GraphCanvas nodes={filteredNodes} edges={filteredEdges} />
        <GraphSettings />
      </div>

      {/* SECTION 6.4: TIME-SCRUBBABLE GRAPH TIMELINE BAR */}
      <div
        style={{
          padding: '10px 16px',
          background: 'rgba(15, 15, 18, 0.95)',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          zIndex: 10
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              background: isPlaying ? '#ef4444' : '#6366f1',
              border: 'none',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)'
            }}
            title={isPlaying ? 'Pause Timeline Replay' : 'Play Timeline Evolution (Sec 6.4)'}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          </button>
          <button
            type="button"
            onClick={() => handleMilestoneChange(0)}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            title="Reset Timeline to Jan 2026"
          >
            <RotateCcw size={12} />
          </button>
        </div>

        {/* Timeline Slider */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px' }}>
            <span style={{ fontWeight: 700, color: '#818cf8', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={12} />
              {TIMELINE_MILESTONES[milestoneIndex].label}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px' }}>
              Step {milestoneIndex + 1} of {TIMELINE_MILESTONES.length} · Scrub to replay incident growth
            </span>
          </div>

          <input
            type="range"
            min={0}
            max={TIMELINE_MILESTONES.length - 1}
            step={1}
            value={milestoneIndex}
            onChange={(e) => handleMilestoneChange(parseInt(e.target.value, 10))}
            style={{ width: '100%', cursor: 'pointer' }}
          />
        </div>
      </div>
    </div>
  )
}
