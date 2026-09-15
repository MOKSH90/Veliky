import { useEffect, useRef, useState, useMemo } from 'react'
import * as d3 from 'd3-force'
import { select as d3Select } from 'd3-selection'
import { zoom as d3Zoom } from 'd3-zoom'
import { drag as d3Drag } from 'd3-drag'
import { scaleOrdinal as d3ScaleOrdinal } from 'd3-scale'
import 'd3-transition'
import { useEdithStore } from '../../store/useEdithStore'
import type { TrustLevel, ClearanceLevel } from '../../lib/types'
import { getClearanceColor } from '../../lib/authPersonas'

export interface CanvasGraphNode extends d3.SimulationNodeDatum {
  id: string
  label: string
  group: string
  category: string
  linkCount: number
  trustLevel: TrustLevel
  clearance: ClearanceLevel
  timestamp: string
  equipmentId?: string
}

export interface CanvasGraphEdge extends d3.SimulationLinkDatum<CanvasGraphNode> {
  source: string | CanvasGraphNode
  target: string | CanvasGraphNode
  trustLevel?: TrustLevel
  timestamp?: string
}

interface Tooltip {
  x: number
  y: number
  node: CanvasGraphNode
}

interface Props {
  nodes: CanvasGraphNode[]
  edges: CanvasGraphEdge[]
}

const TABLEAU_10 = ['#4e79a7', '#f28e2c', '#e15759', '#76b7b2', '#59a14f', '#edc949', '#af7aa1', '#ff9da7', '#9c755f', '#bab0ab']

export function getTrustColor(trust: TrustLevel | undefined): string {
  switch (trust) {
    case 'verified-by-tool':
      return '#10b981' // Green
    case 'ai-inferred':
      return '#06b6d4' // Cyan
    case 'human-asserted':
      return '#f59e0b' // Amber
    case 'source-document':
    default:
      return '#3b82f6' // Blue
  }
}

export function GraphCanvas({ nodes, edges }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const openFileByPath = useEdithStore((s) => s.openFileByPath)
  const setActiveView = useEdithStore((s) => s.setActiveView)
  const graphSettings = useEdithStore((s) => s.graphSettings)
  const [tooltip, setTooltip] = useState<Tooltip | null>(null)

  const groups = useMemo(() => [...new Set(nodes.map((n) => n.group))], [nodes])
  const groupScale = useMemo(() => d3ScaleOrdinal(TABLEAU_10).domain(groups), [groups])

  useEffect(() => {
    if (!containerRef.current || !svgRef.current) return

    let simulation: d3.Simulation<CanvasGraphNode, CanvasGraphEdge> | null = null

    const init = (width: number, height: number) => {
      let currentScale = 1
      let hoveredNodeId: string | null = null
      let connectedNodeIds: Set<string> = new Set()

      const scrubLimit = new Date(graphSettings.timelineScrubDate).getTime()

      const getNodeColor = (d: CanvasGraphNode) => {
        if (graphSettings.display.colorMode === 'provenance') {
          return getTrustColor(d.trustLevel)
        }
        if (graphSettings.display.colorMode === 'clearance') {
          return getClearanceColor(d.clearance)
        }
        return groupScale(d.group)
      }

      const updateVisuals = () => {
        if (hoveredNodeId) {
          node.style('opacity', (n) => (connectedNodeIds.has(n.id) ? 1 : 0.15))
          node.select('circle')
            .attr('fill', (n) => (n.id === hoveredNodeId ? '#ffffff' : connectedNodeIds.has(n.id) ? getNodeColor(n) : '#555555'))
            .attr('stroke', (n) => (n.id === hoveredNodeId ? '#818cf8' : 'none'))
            .attr('stroke-width', (n) => (n.id === hoveredNodeId ? 3 : 0))

          node.select('text').style('opacity', (n) => (connectedNodeIds.has(n.id) ? 1 : 0))

          link
            .style('opacity', (e) => {
              const src = typeof e.source === 'object' ? (e.source as CanvasGraphNode).id : e.source
              const tgt = typeof e.target === 'object' ? (e.target as CanvasGraphNode).id : e.target
              return src === hoveredNodeId || tgt === hoveredNodeId ? 1 : 0.05
            })
            .attr('stroke', (e) => {
              const src = typeof e.source === 'object' ? (e.source as CanvasGraphNode).id : e.source
              const tgt = typeof e.target === 'object' ? (e.target as CanvasGraphNode).id : e.target
              return src === hoveredNodeId || tgt === hoveredNodeId ? '#818cf8' : '#333333'
            })
            .attr('stroke-width', (e) => {
              const src = typeof e.source === 'object' ? (e.source as CanvasGraphNode).id : e.source
              const tgt = typeof e.target === 'object' ? (e.target as CanvasGraphNode).id : e.target
              return (src === hoveredNodeId || tgt === hoveredNodeId) ? graphSettings.display.linkThickness * 1.8 : graphSettings.display.linkThickness
            })
        } else {
          // Normal state with time scrub check
          node.style('opacity', (n) => {
            const nodeTime = new Date(n.timestamp).getTime()
            return nodeTime <= scrubLimit ? 1 : 0.15
          })
          node.select('circle')
            .attr('fill', (d) => getNodeColor(d))
            .attr('stroke', (n) => {
              const nodeTime = new Date(n.timestamp).getTime()
              // Highlight active milestone
              return Math.abs(nodeTime - scrubLimit) < 86400000 * 2 ? '#ffffff' : 'none'
            })
            .attr('stroke-width', (n) => {
              const nodeTime = new Date(n.timestamp).getTime()
              return Math.abs(nodeTime - scrubLimit) < 86400000 * 2 ? 2 : 0
            })

          node.select('text').style('opacity', (n) => {
            const nodeTime = new Date(n.timestamp).getTime()
            if (nodeTime > scrubLimit) return 0
            return currentScale >= graphSettings.display.textFade ? 1 : 0
          })

          link
            .style('opacity', (e) => {
              const edgeTime = e.timestamp ? new Date(e.timestamp).getTime() : 0
              return edgeTime <= scrubLimit ? 0.6 : 0.05
            })
            .attr('stroke', (e) => {
              if (graphSettings.display.colorMode === 'provenance' && e.trustLevel) {
                return getTrustColor(e.trustLevel)
              }
              return '#44444c'
            })
            .attr('stroke-width', graphSettings.display.linkThickness)
        }
      }

      const svg = d3Select(svgRef.current!)
      svg.selectAll('*').remove()

      // Defs for directional arrows
      const defs = svg.append('defs')
      defs.append('marker')
        .attr('id', 'arrow')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 18)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', '#666')

      const g = svg.append('g')

      svg.call(
        d3Zoom<SVGSVGElement, unknown>()
          .scaleExtent([0.1, 4])
          .on('zoom', (event) => {
            g.attr('transform', event.transform)
            currentScale = event.transform.k
            updateVisuals()
          })
      )

      const simNodes: CanvasGraphNode[] = nodes.map((n) => ({ ...n }))
      const simEdges: CanvasGraphEdge[] = edges.map((e) => ({ ...e }))

      simulation = d3.forceSimulation<CanvasGraphNode>(simNodes)
        .velocityDecay(0.7)
        .force(
          'link',
          d3.forceLink<CanvasGraphNode, CanvasGraphEdge>(simEdges)
            .id((d) => d.id)
            .distance(graphSettings.forces.linkDistance)
            .strength(graphSettings.forces.linkForce * 0.7)
        )
        .force('charge', d3.forceManyBody().strength(-graphSettings.forces.repelForce * 12).distanceMax(500))
        .force('center', d3.forceCenter(width / 2, height / 2).strength(graphSettings.forces.centerForce * 1.5))
        .force('collision', d3.forceCollide(24))

      // Edges
      const link = g
        .append('g')
        .selectAll('line')
        .data(simEdges)
        .join('line')
        .attr('stroke', '#44444c')
        .attr('stroke-width', graphSettings.display.linkThickness)
        .attr('stroke-opacity', 0.6)
        .attr('marker-end', graphSettings.display.arrows ? 'url(#arrow)' : null)

      // Node sizing based on in/out wikilink connections
      const maxLinks = Math.max(1, ...nodes.map((n) => n.linkCount))
      const radius = (d: CanvasGraphNode) => (4 + (d.linkCount / maxLinks) * 6) * graphSettings.display.nodeSize

      // Nodes container
      const node = g
        .append('g')
        .selectAll<SVGGElement, CanvasGraphNode>('g')
        .data(simNodes)
        .join('g')
        .style('cursor', 'pointer')
        .call(
          d3Drag<SVGGElement, CanvasGraphNode>()
            .on('start', (event, d) => {
              if (!event.active) simulation!.alphaTarget(0.3).restart()
              d.fx = d.x
              d.fy = d.y
            })
            .on('drag', (event, d) => {
              d.fx = event.x
              d.fy = event.y
            })
            .on('end', (event, d) => {
              if (!event.active) simulation!.alphaTarget(0)
              d.fx = null
              d.fy = null
            })
        )

      // Node circles
      node
        .append('circle')
        .attr('r', radius)
        .attr('fill', (d) => getNodeColor(d))

      // Node text labels
      node
        .append('text')
        .text((d) => d.label)
        .attr('y', (d) => radius(d) + 8)
        .attr('text-anchor', 'middle')
        .attr('font-size', '5.5px')
        .attr('font-family', 'Inter, system-ui, sans-serif')
        .attr('font-weight', '600')
        .attr('fill', '#e2e8f0')
        .style('pointer-events', 'none')

      // Click to open note in workspace editor
      node.on('click', (_event, d) => {
        openFileByPath(d.id)
        setActiveView('workspace')
      })

      // Obsidian Hover highlight
      node
        .on('mouseover', (event, d) => {
          hoveredNodeId = d.id
          connectedNodeIds = new Set<string>([d.id])
          simEdges.forEach((e) => {
            const src = typeof e.source === 'object' ? (e.source as CanvasGraphNode).id : e.source
            const tgt = typeof e.target === 'object' ? (e.target as CanvasGraphNode).id : e.target
            if (src === d.id) connectedNodeIds.add(tgt)
            if (tgt === d.id) connectedNodeIds.add(src)
          })
          updateVisuals()

          const rect = containerRef.current!.getBoundingClientRect()
          setTooltip({ x: event.clientX - rect.left, y: event.clientY - rect.top, node: d })
        })
        .on('mousemove', (event) => {
          const rect = containerRef.current!.getBoundingClientRect()
          setTooltip((t) => (t ? { ...t, x: event.clientX - rect.left, y: event.clientY - rect.top } : t))
        })
        .on('mouseout', () => {
          hoveredNodeId = null
          connectedNodeIds.clear()
          updateVisuals()
          setTooltip(null)
        })

      // Simulation tick
      simulation.on('tick', () => {
        link
          .attr('x1', (d) => (d.source as CanvasGraphNode).x ?? 0)
          .attr('y1', (d) => (d.source as CanvasGraphNode).y ?? 0)
          .attr('x2', (d) => (d.target as CanvasGraphNode).x ?? 0)
          .attr('y2', (d) => (d.target as CanvasGraphNode).y ?? 0)

        node.attr('transform', (d) => `translate(${d.x ?? 0},${d.y ?? 0})`)
      })

      updateVisuals()
    }

    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      if (width > 0 && height > 0) {
        simulation?.stop()
        init(width, height)
      }
    })
    ro.observe(containerRef.current)

    const { width, height } = containerRef.current.getBoundingClientRect()
    if (width > 0 && height > 0) {
      init(width, height)
    }

    return () => {
      ro.disconnect()
      simulation?.stop()
      setTooltip(null)
    }
  }, [nodes, edges, openFileByPath, setActiveView, graphSettings, groupScale])

  return (
    <div ref={containerRef} className="graph-canvas-container" style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      <svg ref={svgRef} className="graph-svg" style={{ width: '100%', height: '100%', display: 'block' }} />
      {tooltip && (
        <div
          className="graph-tooltip"
          style={{
            position: 'absolute',
            left: tooltip.x + 16,
            top: tooltip.y - 12,
            background: 'rgba(18, 18, 22, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '8px',
            padding: '8px 12px',
            pointerEvents: 'none',
            zIndex: 100,
            boxShadow: '0 8px 24px rgba(0,0,0,0.6)'
          }}
        >
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>
            {tooltip.node.label}
          </div>
          <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px' }}>
            {tooltip.node.category} · {tooltip.node.linkCount} connections
          </div>
          <div style={{ display: 'flex', gap: '6px', fontSize: '9px', fontWeight: 700 }}>
            <span style={{ color: getTrustColor(tooltip.node.trustLevel) }}>
              {(tooltip.node.trustLevel || 'source-document').toUpperCase()}
            </span>
            <span>·</span>
            <span style={{ color: getClearanceColor(tooltip.node.clearance) }}>
              {tooltip.node.clearance}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
