import { useState, useMemo } from 'react'
import { 
  Radio, 
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  Cpu, 
  HardDrive, 
  ShieldAlert, 
  Activity, 
  Zap,
  Filter,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Flame,
  Lock
} from 'lucide-react'
import { useSentinelStore } from '../../store/useSentinelSOCStore'
import type { IndustrialAsset, AssetCluster, ThreatSeverity } from '../../lib/types'

interface ClusterBounds {
  id: AssetCluster
  name: string
  sub: string
  x: number
  y: number
  width: number
  height: number
  color: string
}

const CLUSTERS: ClusterBounds[] = [
  {
    id: 'REFINERY_UNIT_2',
    name: 'REFINERY UNIT 2 / BOTTOMS CIRCULATION',
    sub: 'Physical Heavy Industrial Assets · Hydrocracker Preheat Train',
    x: 60,
    y: 70,
    width: 430,
    height: 380,
    color: 'rgba(239, 68, 68, 0.15)'
  },
  {
    id: 'CONTROL_SCADA',
    name: 'SCADA & INDUSTRIAL CONTROLS',
    sub: 'Modbus RTU / DNP3 Subnet 192.168.10.0 · SIL-3 SIS Interlocks',
    x: 520,
    y: 70,
    width: 320,
    height: 180,
    color: 'rgba(59, 130, 246, 0.15)'
  },
  {
    id: 'SOVEREIGN_AI',
    name: 'SOVEREIGN ON-PREMISE AI COMPUTE',
    sub: 'Air-Gapped Multi-Model Router · Isolated Docker Python Sandbox',
    x: 520,
    y: 270,
    width: 320,
    height: 180,
    color: 'rgba(6, 182, 212, 0.15)'
  }
]

export function SecuritySituationGraph() {
  const assets = useSentinelStore((s) => s.assets)
  const selectedAssetId = useSentinelStore((s) => s.selectedAssetId)
  const setSelectedAssetId = useSentinelStore((s) => s.setSelectedAssetId)
  const setIntelPanelOpen = useSentinelStore((s) => s.setIntelPanelOpen)
  const threats = useSentinelStore((s) => s.threats)
  const severityFilter = useSentinelStore((s) => s.severityFilter)
  const setSeverityFilter = useSentinelStore((s) => s.setSeverityFilter)
  const clusterFilter = useSentinelStore((s) => s.clusterFilter)
  const setClusterFilter = useSentinelStore((s) => s.setClusterFilter)

  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [zoomLevel, setZoomLevel] = useState<number>(1)
  const [showThreatVector, setShowThreatVector] = useState<boolean>(true)

  // Filter assets based on cluster and severity
  const filteredAssets = useMemo(() => {
    return assets.filter(a => {
      if (clusterFilter !== 'ALL' && a.cluster !== clusterFilter) return false
      if (severityFilter === 'CRITICAL' && a.criticality !== 'CRITICAL') return false
      if (severityFilter === 'WARNING' && a.status !== 'ATTENTION_REQUIRED' && a.status !== 'ARMED') return false
      if (severityFilter === 'NORMAL' && a.status !== 'NORMAL') return false
      return true
    })
  }, [assets, clusterFilter, severityFilter])

  // Threat path edges (e.g. P-204 to C-104)
  const threatEdges = useMemo(() => {
    return [
      { from: 'P-204', to: 'C-104', type: 'THREAT_RESONANCE', label: 'Vibration Propagation (+92.9%)' },
      { from: 'P-204', to: 'E-201', type: 'PROCESS_COUPLING', label: 'Hydrocracker Slurry' },
      { from: 'TK-101', to: 'P-204', type: 'FEED_SUCTION', label: 'Suction 1.4 bar' },
      { from: 'V-19', to: 'P-204', type: 'SAFETY_INTERLOCK', label: 'SIL-3 Isolation' },
      { from: 'SCADA-PLC-03', to: 'P-204', type: 'TELEMETRY_BUS', label: 'Modbus 40012' },
      { from: 'SIS-GATEWAY', to: 'V-19', type: 'HARDWARE_TRIP', label: 'ESD Interlock' },
      { from: 'SENTINEL-ROUTER', to: 'SCADA-PLC-03', type: 'AIR_GAP_MONITOR', label: 'Packet Ingest (0 Egress)' },
      { from: 'SENTINEL-ROUTER', to: 'SENTINEL-SANDBOX', type: 'ISOLATED_IPC', label: 'Sandbox Execution' },
    ]
  }, [])

  const selectedAsset = assets.find(a => a.id === selectedAssetId)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      {/* Top Filter & Control Toolbar */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 16px',
          background: 'var(--soc-bg-surface)',
          borderBottom: '1px solid var(--soc-border-subtle)',
          zIndex: 10,
          userSelect: 'none'
        }}
      >
        {/* Cluster Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="soc-eyebrow" style={{ marginRight: '4px' }}>ZONE:</span>
          {[
            { id: 'ALL', label: 'All Infrastructure' },
            { id: 'REFINERY_UNIT_2', label: 'Refinery Unit 2' },
            { id: 'CONTROL_SCADA', label: 'Control SCADA' },
            { id: 'SOVEREIGN_AI', label: 'Sovereign AI' },
          ].map((cf) => (
            <button
              key={cf.id}
              type="button"
              onClick={() => setClusterFilter(cf.id as any)}
              style={{
                background: clusterFilter === cf.id ? 'var(--soc-bg-hover)' : 'transparent',
                border: `1px solid ${clusterFilter === cf.id ? 'var(--soc-primary)' : 'var(--soc-border-subtle)'}`,
                color: clusterFilter === cf.id ? 'var(--soc-primary)' : 'var(--soc-text-dim)',
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {cf.label}
            </button>
          ))}
        </div>

        {/* Severity Filter & Threat Vector Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setShowThreatVector(!showThreatVector)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              padding: '3px 8px',
              borderRadius: '4px',
              background: showThreatVector ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
              border: `1px solid ${showThreatVector ? 'rgba(239, 68, 68, 0.4)' : 'var(--soc-border-subtle)'}`,
              color: showThreatVector ? 'var(--soc-red)' : 'var(--soc-text-dim)',
              fontSize: '10px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Flame size={11} />
            <span>THREAT PROPAGATION PATHS</span>
          </button>

          <div className="topbar-divider" />

          {/* Zoom controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button
              type="button"
              className="soc-btn soc-btn-ghost"
              style={{ padding: '3px 6px', fontSize: '10px' }}
              onClick={() => setZoomLevel(prev => Math.min(prev + 0.15, 1.6))}
              title="Zoom In"
            >
              <ZoomIn size={12} />
            </button>
            <button
              type="button"
              className="soc-btn soc-btn-ghost"
              style={{ padding: '3px 6px', fontSize: '10px' }}
              onClick={() => setZoomLevel(prev => Math.max(prev - 0.15, 0.7))}
              title="Zoom Out"
            >
              <ZoomOut size={12} />
            </button>
            <button
              type="button"
              className="soc-btn soc-btn-ghost"
              style={{ padding: '3px 6px', fontSize: '10px' }}
              onClick={() => setZoomLevel(1)}
              title="Reset View"
            >
              <RotateCcw size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Main SVG Visualization Canvas */}
      <div 
        style={{
          flex: 1,
          width: '100%',
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
          background: 'var(--soc-bg-base)',
          cursor: 'grab'
        }}
      >
        <svg
          viewBox="0 0 900 480"
          style={{
            width: '100%',
            height: '100%',
            transform: `scale(${zoomLevel})`,
            transformOrigin: 'center center',
            transition: 'transform 0.2s ease-out'
          }}
        >
          <defs>
            {/* Pulsing Gradient for active threat line */}
            <linearGradient id="threatGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.3" />
            </linearGradient>

            {/* Glowing marker arrow */}
            <marker id="arrowRed" viewBox="0 0 10 10" refX="18" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#ef4444" />
            </marker>
            <marker id="arrowCyan" viewBox="0 0 10 10" refX="18" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#2563eb" />
            </marker>
            <marker id="arrowSlate" viewBox="0 0 10 10" refX="18" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748b" />
            </marker>
          </defs>

          {/* 1. Infrastructure Cluster Boundary Plates */}
          {CLUSTERS.map((cl) => {
            const isDimmed = clusterFilter !== 'ALL' && clusterFilter !== cl.id
            return (
              <g key={cl.id} opacity={isDimmed ? 0.25 : 1} style={{ transition: 'opacity 0.2s ease' }}>
                <rect
                  x={cl.x}
                  y={cl.y}
                  width={cl.width}
                  height={cl.height}
                  rx="8"
                  fill="var(--soc-bg-card)"
                  stroke="var(--soc-border-subtle)"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <rect
                  x={cl.x}
                  y={cl.y}
                  width={cl.width}
                  height="26"
                  rx="8"
                  fill="var(--soc-bg-elevated)"
                />
                <text
                  x={cl.x + 12}
                  y={cl.y + 16}
                  fill="var(--soc-text-dim)"
                  fontFamily="var(--font-mono)"
                  fontSize="9px"
                  fontWeight="700"
                  letterSpacing="0.1em"
                >
                  {cl.name}
                </text>
                <text
                  x={cl.x + cl.width - 12}
                  y={cl.y + 16}
                  textAnchor="end"
                  fill="var(--soc-text-dim)"
                  fontFamily="var(--font-mono)"
                  fontSize="8px"
                >
                  ZONE {cl.id}
                </text>
              </g>
            )
          })}

          {/* 2. Inter-Asset Connection Paths & Dynamic Threat Waves */}
          {threatEdges.map((edge, i) => {
            const sourceNode = assets.find(a => a.id === edge.from)
            const targetNode = assets.find(a => a.id === edge.to)
            if (!sourceNode || !targetNode) return null

            const isThreat = edge.type === 'THREAT_RESONANCE' && showThreatVector
            const isRelevant = selectedAssetId === edge.from || selectedAssetId === edge.to

            return (
              <g key={i}>
                <line
                  x1={sourceNode.coordinates.x}
                  y1={sourceNode.coordinates.y}
                  x2={targetNode.coordinates.x}
                  y2={targetNode.coordinates.y}
                  stroke={isThreat ? 'url(#threatGrad)' : isRelevant ? 'var(--soc-primary)' : 'var(--soc-border-subtle)'}
                  strokeWidth={isThreat ? 2.5 : isRelevant ? 1.5 : 1}
                  strokeDasharray={isThreat ? '5 5' : undefined}
                  markerEnd={isThreat ? 'url(#arrowRed)' : isRelevant ? 'url(#arrowCyan)' : 'url(#arrowSlate)'}
                />
                {isThreat && (
                  <circle r="3" fill="#ef4444">
                    <animateMotion
                      path={`M ${sourceNode.coordinates.x} ${sourceNode.coordinates.y} L ${targetNode.coordinates.x} ${targetNode.coordinates.y}`}
                      dur="1.8s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}
              </g>
            )
          })}

          {/* 3. Protected Asset Nodes */}
          {filteredAssets.map((asset) => {
            const isSelected = selectedAssetId === asset.id
            const isHovered = hoveredNodeId === asset.id
            const isCritical = asset.status === 'ATTENTION_REQUIRED' || asset.criticality === 'CRITICAL'
            const isZoneC = asset.isoZone === 'Zone_C'

            const nodeFill = isSelected ? 'var(--soc-bg-hover)' : 'var(--soc-bg-surface)'
            const nodeStroke = isZoneC 
              ? 'var(--soc-red)' 
              : isSelected 
              ? 'var(--soc-primary)' 
              : isCritical 
              ? 'var(--soc-amber)' 
              : 'var(--soc-border-subtle)'

            return (
              <g
                key={asset.id}
                transform={`translate(${asset.coordinates.x}, ${asset.coordinates.y})`}
                onClick={() => {
                  setSelectedAssetId(asset.id)
                  setIntelPanelOpen(true)
                }}
                onMouseEnter={() => setHoveredNodeId(asset.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                style={{ cursor: 'pointer' }}
              >
                {/* Active Threat Pulsing Halo on P-204 */}
                {isZoneC && (
                  <circle
                    r="34"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    opacity="0.4"
                  >
                    <animate attributeName="r" values="24;36;24" dur="2.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.6;0.1;0.6" dur="2.5s" repeatCount="indefinite" />
                  </circle>
                )}

                {/* Node Body Card */}
                <rect
                  x="-42"
                  y="-22"
                  width="84"
                  height="44"
                  rx="6"
                  fill={nodeFill}
                  stroke={nodeStroke}
                  strokeWidth={isSelected ? 2 : 1}
                  filter="drop-shadow(0 4px 12px rgba(0,0,0,0.5))"
                />

                {/* Status Dot */}
                <circle
                  cx="-30"
                  cy="-10"
                  r="3.5"
                  fill={isZoneC ? 'var(--soc-red)' : asset.status === 'NORMAL' ? 'var(--soc-emerald)' : 'var(--soc-amber)'}
                />

                {/* Asset Tag ID */}
                <text
                  x="-20"
                  y="-7"
                  fill="var(--soc-text-high)"
                  fontFamily="var(--font-mono)"
                  fontSize="11px"
                  fontWeight="700"
                >
                  {asset.id}
                </text>

                {/* Telemetry Metric / Category Preview */}
                <text
                  x="-42"
                  y="12"
                  dx="8"
                  fill={isZoneC ? 'var(--soc-red)' : 'var(--soc-text-dim)'}
                  fontFamily="var(--font-mono)"
                  fontSize="9px"
                  fontWeight={isZoneC ? '700' : '500'}
                >
                  {asset.telemetry.rmsVelocity 
                    ? `${asset.telemetry.rmsVelocity} mm/s` 
                    : asset.category.split(' ')[0]}
                </text>

                {/* Small indicator pill */}
                {asset.isoZone && (
                  <rect
                    x="20"
                    y="4"
                    width="16"
                    height="10"
                    rx="2"
                    fill={isZoneC ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}
                  />
                )}
                {asset.isoZone && (
                  <text
                    x="28"
                    y="11"
                    textAnchor="middle"
                    fill={isZoneC ? 'var(--soc-red)' : 'var(--soc-emerald)'}
                    fontFamily="var(--font-mono)"
                    fontSize="7px"
                    fontWeight="700"
                  >
                    {asset.isoZone.slice(-1)}
                  </text>
                )}
              </g>
            )
          })}
        </svg>

        {/* Floating Quick Legend / Metadata Card */}
        <div
          style={{
            position: 'absolute',
            bottom: '12px',
            left: '16px',
            background: 'var(--soc-bg-surface)',
            boxShadow: 'var(--soc-shadow-md)',
            backdropFilter: 'blur(8px)',
            border: '1px solid var(--soc-border-subtle)',
            borderRadius: '6px',
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            zIndex: 10
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span className="soc-dot red pulse" />
            <span style={{ color: 'var(--soc-text-main)' }}>ISO Zone C Alert (5.4 mm/s RMS)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span className="soc-dot amber" />
            <span style={{ color: 'var(--soc-text-main)' }}>Hardware Interlock Armed</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <span className="soc-dot emerald" />
            <span style={{ color: 'var(--soc-text-main)' }}>Zone A/B Normal</span>
          </div>
          <div style={{ color: 'var(--soc-border-bright)' }}>|</div>
          <div style={{ color: 'var(--soc-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Lock size={10} /> 100% On-Premise Topology
          </div>
        </div>

        {/* Selected Asset Floating Quick Bar */}
        {selectedAsset && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              right: '16px',
              background: 'var(--soc-bg-surface)',
              boxShadow: 'var(--soc-shadow-md)',
              backdropFilter: 'blur(8px)',
              border: '1px solid var(--soc-border-medium)',
              borderRadius: '6px',
              padding: '8px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              zIndex: 10
            }}
          >
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--soc-text-high)', fontFamily: 'var(--font-mono)' }}>
                {selectedAsset.id} — {selectedAsset.name}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--soc-text-dim)', fontFamily: 'var(--font-mono)' }}>
                {selectedAsset.unit} · {selectedAsset.clearanceLevel.toUpperCase()} CLEARANCE
              </div>
            </div>
            <button
              type="button"
              className="soc-btn soc-btn-primary"
              style={{ fontSize: '10px', padding: '4px 8px' }}
              onClick={() => setIntelPanelOpen(true)}
            >
              Inspect Asset
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
