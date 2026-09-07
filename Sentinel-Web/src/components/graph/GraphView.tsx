import { useMemo, useEffect } from 'react'
import { useEdithStore } from '../../store/useEdithStore'
import { GraphCanvas } from './GraphCanvas'
import { GraphSettings } from './GraphSettings'

export function GraphView() {
  const wikilinkNodes = useEdithStore((s) => s.wikilinkNodes)
  const wikilinkEdges = useEdithStore((s) => s.wikilinkEdges)
  const reindexWikilinks = useEdithStore((s) => s.reindexWikilinks)
  const graphSettings = useEdithStore((s) => s.graphSettings)

  // Index wikilinks on mount if not already indexed
  useEffect(() => {
    if (wikilinkNodes.length === 0) reindexWikilinks()
  }, [wikilinkNodes.length, reindexWikilinks])

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
    <div className="standard-view graph-view" style={{ flex: 1, padding: 0, display: 'flex', flexDirection: 'column' }}>
      <div className="graph-stage" style={{ flex: 1, position: 'relative', borderRadius: 0, margin: 0, border: 'none', background: 'transparent', width: '100%', height: '100%' }}>
        <GraphSettings />
        {filteredNodes.length === 0 ? (
          <div className="empty-panel" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <strong>No notes found</strong>
            <span>Add markdown files with [[WikiLinks]] to see the graph.</span>
          </div>
        ) : (
          <GraphCanvas nodes={filteredNodes} edges={filteredEdges} />
        )}
      </div>
    </div>
  )
}
