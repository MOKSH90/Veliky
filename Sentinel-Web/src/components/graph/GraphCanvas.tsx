import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3-force'
import { useEdithStore } from '../../store/useEdithStore'

interface GraphNode extends d3.SimulationNodeDatum {
  id: string
  label: string
  group: string
  linkCount: number
}

interface GraphEdge extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode
  target: string | GraphNode
}

interface Tooltip {
  x: number
  y: number
  node: GraphNode
}

interface Props {
  nodes: GraphNode[]
  edges: GraphEdge[]
}

export function GraphCanvas({ nodes, edges }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const openFileByPath = useEdithStore((s) => s.openFileByPath)
  const setActiveView = useEdithStore((s) => s.setActiveView)
  const graphSettings = useEdithStore((s) => s.graphSettings)
  const [tooltip, setTooltip] = useState<Tooltip | null>(null)

  useEffect(() => {
    if (!containerRef.current || !svgRef.current) return

    const groups = [...new Set(nodes.map((n) => n.group))]
    const color = d3Scale(groups)

    let simulation: d3.Simulation<GraphNode, GraphEdge> | null = null

    const init = (width: number, height: number) => {
      // Use EDITH CSS custom properties
      const css = getComputedStyle(document.documentElement)
      const colorText = css.getPropertyValue('--text-secondary').trim() || '#b9bbc2'
      const colorBorder = css.getPropertyValue('--surface-border').trim() || '#333'
      const colorBase = css.getPropertyValue('--glass-surface').trim() || '#0d0d0d'

      let currentScale = 1
      let hoveredNodeId: string | null = null
      let connectedNodeIds: Set<string> = new Set()

      const updateVisuals = () => {
        if (hoveredNodeId) {
          node.style('opacity', (n) => (connectedNodeIds.has(n.id) ? 1 : 0.2))
          node.select('circle').attr('fill', (n) => n.id === hoveredNodeId ? '#a882ff' : (connectedNodeIds.has(n.id) ? '#cccccc' : '#999999'))
          node.select('text').style('opacity', (n) => n.id === hoveredNodeId ? 1 : (connectedNodeIds.has(n.id) && currentScale >= 1.4 ? 1 : 0))
          link
            .style('opacity', (e) => {
              const src = typeof e.source === 'object' ? (e.source as GraphNode).id : e.source
              const tgt = typeof e.target === 'object' ? (e.target as GraphNode).id : e.target
              return src === hoveredNodeId || tgt === hoveredNodeId ? 1 : 0.05
            })
            .attr('stroke', (e) => {
              const src = typeof e.source === 'object' ? (e.source as GraphNode).id : e.source
              const tgt = typeof e.target === 'object' ? (e.target as GraphNode).id : e.target
              return src === hoveredNodeId || tgt === hoveredNodeId ? '#a882ff' : '#333333'
            })
        } else {
          node.style('opacity', 1)
          node.select('circle').attr('fill', '#999999')
          node.select('text').style('opacity', currentScale >= 1.4 ? 1 : 0)
          link.style('opacity', 0.6).attr('stroke', '#333333')
        }
      }

      const svg = d3Select(svgRef.current!)
      svg.selectAll('*').remove()

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

      const simNodes: GraphNode[] = nodes.map((n) => ({ ...n }))
      const simEdges: GraphEdge[] = edges.map((e) => ({ ...e }))

      simulation = d3.forceSimulation<GraphNode>(simNodes)
        .velocityDecay(0.8)
        .force('link', d3.forceLink<GraphNode, GraphEdge>(simEdges).id((d) => d.id).distance(graphSettings.forces.linkDistance).strength(graphSettings.forces.linkForce * 0.5))
        .force('charge', d3.forceManyBody().strength(-graphSettings.forces.repelForce * 10).distanceMax(400))
        .force('center', d3.forceCenter(width / 2, height / 2).strength(1))
        .force('x', d3.forceX(width / 2).strength(graphSettings.forces.centerForce * 0.5))
        .force('y', d3.forceY(height / 2).strength(graphSettings.forces.centerForce * 0.5))
        .force('collision', d3.forceCollide(20))

      // Edges
      const link = g
        .append('g')
        .selectAll('line')
        .data(simEdges)
        .join('line')
        .attr('stroke', '#333333')
        .attr('stroke-width', graphSettings.display.linkThickness)
        .attr('stroke-opacity', 0.6)

      // Node radius
      const maxLinks = Math.max(1, ...nodes.map((n) => n.linkCount))
      const baseScale = graphSettings.display.nodeSize
      const radius = (d: GraphNode) => (3 + (d.linkCount / maxLinks) * 2) * baseScale

      // Nodes
      const node = g
        .append('g')
        .selectAll<SVGGElement, GraphNode>('g')
        .data(simNodes)
        .join('g')
        .style('cursor', 'pointer')
        .call(
          d3Drag<SVGGElement, GraphNode>()
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

      node
        .append('circle')
        .attr('r', radius)
        .attr('fill', '#999999')
        .attr('stroke', 'none')

      node
        .append('text')
        .text((d) => d.label)
        .attr('y', (d) => radius(d) + 5)
        .attr('text-anchor', 'middle')
        .attr('font-size', '4.5px')
        .attr('font-family', 'Inter, system-ui, sans-serif')
        .attr('fill', '#cccccc')
        .style('pointer-events', 'none')
        .style('opacity', 0)

      // Click to open file
      node.on('click', (_event, d) => {
        openFileByPath(d.id)
        setActiveView('workspace')
      })

      // Hover highlight (Obsidian style)
      node
        .on('mouseover', (event, d) => {
          hoveredNodeId = d.id
          connectedNodeIds = new Set<string>([d.id])
          simEdges.forEach((e) => {
            const src = typeof e.source === 'object' ? (e.source as GraphNode).id : e.source
            const tgt = typeof e.target === 'object' ? (e.target as GraphNode).id : e.target
            if (src === d.id) connectedNodeIds.add(tgt)
            if (tgt === d.id) connectedNodeIds.add(src)
          })
          updateVisuals()
          
          const rect = containerRef.current!.getBoundingClientRect()
          setTooltip({ x: event.clientX - rect.left, y: event.clientY - rect.top, node: d })
        })
        .on('mousemove', (event) => {
          const rect = containerRef.current!.getBoundingClientRect()
          setTooltip((t) => t ? { ...t, x: event.clientX - rect.left, y: event.clientY - rect.top } : t)
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
          .attr('x1', (d) => (d.source as GraphNode).x ?? 0)
          .attr('y1', (d) => (d.source as GraphNode).y ?? 0)
          .attr('x2', (d) => (d.target as GraphNode).x ?? 0)
          .attr('y2', (d) => (d.target as GraphNode).y ?? 0)

        node.attr('transform', (d) => `translate(${d.x ?? 0},${d.y ?? 0})`)
      })
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
  }, [nodes, edges, openFileByPath, setActiveView, graphSettings])

  return (
    <div ref={containerRef} className="graph-canvas-container">
      <svg ref={svgRef} className="graph-svg" />
      {tooltip && (
        <div
          className="graph-tooltip"
          style={{ left: tooltip.x + 14, top: tooltip.y - 10 }}
        >
          <p className="graph-tooltip-label">{tooltip.node.label}</p>
          <p className="graph-tooltip-meta">
            {tooltip.node.linkCount} link{tooltip.node.linkCount !== 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  )
}

// ─── D3 helpers (tree-shaken from d3 to avoid importing the full d3 bundle) ───
// We import only d3-force at the top. For selection/zoom/drag/scale we use
// lightweight wrappers via the d3 "micro-libraries" that are transitive deps.
import { select as d3Select } from 'd3-selection'
import { zoom as d3Zoom } from 'd3-zoom'
import { drag as d3Drag } from 'd3-drag'
import { scaleOrdinal as d3ScaleOrdinal } from 'd3-scale'
import 'd3-transition' // side-effect import, needed by d3-zoom

const TABLEAU_10 = ['#4e79a7','#f28e2c','#e15759','#76b7b2','#59a14f','#edc949','#af7aa1','#ff9da7','#9c755f','#bab0ab']

function d3Scale(groups: string[]) {
  return d3ScaleOrdinal(TABLEAU_10).domain(groups)
}
