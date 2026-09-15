import { useState } from 'react'
import { 
  Crosshair, 
  Flame, 
  AlertTriangle, 
  ShieldAlert, 
  Activity, 
  Radio, 
  Layers, 
  CheckCircle2, 
  ArrowRight, 
  Zap,
  Lock,
  Search,
  ExternalLink
} from 'lucide-react'
import { useSentinelStore } from '../../store/useSentinelSOCStore'
import type { ThreatItem, ThreatSeverity } from '../../lib/types'

const MITRE_ICS_TECHNIQUES = [
  { id: 'T0807', tactic: 'COMMAND & CONTROL', title: 'Protocol Manipulation', activeCount: 1, activeThreat: 'THR-2026-22' },
  { id: 'T0855', tactic: 'IMPAIR CONTROL', title: 'Unauthorized Parameter Modification', activeCount: 1, activeThreat: 'THR-2026-14' },
  { id: 'T0888', tactic: 'IMPACT', title: 'Loss of Safety / Physical Degradation', activeCount: 1, activeThreat: 'THR-2026-09' },
  { id: 'T0815', tactic: 'PROCESS DEGRADATION', title: 'Efficiency Diminution', activeCount: 1, activeThreat: 'THR-2026-31' },
]

export function ThreatIntelligenceView() {
  const threats = useSentinelStore((s) => s.threats)
  const selectedThreatId = useSentinelStore((s) => s.selectedThreatId)
  const setSelectedThreatId = useSentinelStore((s) => s.setSelectedThreatId)
  const setSelectedAssetId = useSentinelStore((s) => s.setSelectedAssetId)
  const setIntelPanelOpen = useSentinelStore((s) => s.setIntelPanelOpen)
  const setActiveView = useSentinelStore((s) => s.setActiveView)

  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredThreats = threats.filter(t => {
    if (selectedSeverity !== 'ALL' && t.severity !== selectedSeverity) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return t.id.toLowerCase().includes(q) || t.title.toLowerCase().includes(q) || t.targetAssetId.toLowerCase().includes(q)
    }
    return true
  })

  const activeThreat = threats.find(t => t.id === selectedThreatId) || threats[0]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', padding: '16px 20px', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Crosshair size={18} style={{ color: 'var(--soc-red)' }} />
            <h2 style={{ margin: 0, fontSize: '16px', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--soc-text-high)' }}>
              THREAT INTELLIGENCE & ICS ATTACK MATRICES
            </h2>
          </div>
          <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--soc-text-muted)' }}>
            Physical Anomaly Correlator · MITRE ATT&CK for Industrial Control Systems (ICS) Mapping
          </p>
        </div>

        <div className="soc-badge badge-critical" style={{ padding: '4px 10px' }}>
          <span className="soc-dot red pulse" />
          <span>4 ACTIVE THREAT SIGNATURES DETECTED</span>
        </div>
      </div>

      {/* MITRE ATT&CK for ICS Matrix Strip */}
      <div className="soc-plate">
        <div className="soc-plate-header">
          <span className="soc-plate-title">
            <ShieldAlert size={12} /> MITRE ATT&CK for ICS Tactical Matrix
          </span>
          <span className="soc-eyebrow">INDUSTRIAL PROTOCOL CORRELATION</span>
        </div>
        <div className="overview-kpi-grid" style={{ padding: '12px' }}>
          {MITRE_ICS_TECHNIQUES.map((tech) => (
            <div
              key={tech.id}
              onClick={() => {
                setSelectedThreatId(tech.activeThreat)
                setIntelPanelOpen(true)
              }}
              style={{
                background: 'var(--soc-bg-elevated)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '5px',
                padding: '10px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              className="soc-hover-glow"
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span className="soc-eyebrow" style={{ color: 'var(--soc-red)' }}>{tech.tactic}</span>
                <span className="soc-badge badge-critical" style={{ fontSize: '8px', padding: '0 4px' }}>{tech.id}</span>
              </div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--soc-text-high)', marginBottom: '4px' }}>
                {tech.title}
              </div>
              <div style={{ fontSize: '10px', color: 'var(--soc-text-dim)', fontFamily: 'var(--font-mono)' }}>
                Active Vector: <b style={{ color: 'var(--soc-amber)' }}>{tech.activeThreat}</b>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Two-Column Intelligence Console */}
      <div className="overview-two-col">
        {/* Left: Filterable Threat Feeds */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Filter Bar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--soc-bg-surface)', padding: '6px 10px', borderRadius: '4px', border: '1px solid var(--soc-border-subtle)' }}>
            <div style={{ display: 'flex', gap: '4px' }}>
              {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((sev) => (
                <button
                  key={sev}
                  type="button"
                  onClick={() => setSelectedSeverity(sev)}
                  style={{
                    background: selectedSeverity === sev ? 'var(--soc-primary-subtle)' : 'transparent',
                    border: `1px solid ${selectedSeverity === sev ? 'var(--soc-primary)' : 'transparent'}`,
                    color: selectedSeverity === sev ? 'var(--soc-primary)' : 'var(--soc-text-dim)',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    fontSize: '9px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {sev}
                </button>
              ))}
            </div>

            <span className="soc-eyebrow">
              {filteredThreats.length} THREAT PATTERNS
            </span>
          </div>

          {/* List of Threat Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredThreats.map((threat) => {
              const isSelected = activeThreat?.id === threat.id
              const isCritical = threat.severity === 'CRITICAL'

              return (
                <div
                  key={threat.id}
                  onClick={() => {
                    setSelectedThreatId(threat.id)
                    setSelectedAssetId(threat.targetAssetId)
                  }}
                  className="soc-plate"
                  style={{
                    cursor: 'pointer',
                    borderColor: isSelected 
                      ? 'var(--soc-primary)' 
                      : isCritical 
                      ? 'rgba(239, 68, 68, 0.35)' 
                      : 'var(--soc-border-subtle)',
                    background: isSelected ? 'var(--soc-bg-card)' : 'var(--soc-bg-surface)',
                    transition: 'border-color 0.12s'
                  }}
                >
                  <div className="soc-plate-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`soc-badge ${isCritical ? 'badge-critical' : threat.severity === 'HIGH' ? 'badge-warning' : 'badge-dim'}`}>
                        {threat.severity}
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, color: 'var(--soc-text-high)' }}>
                        {threat.id}
                      </span>
                    </div>
                    <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--soc-text-dim)' }}>
                      Target: <b style={{ color: 'var(--soc-text-main)' }}>{threat.targetAssetId}</b>
                    </span>
                  </div>

                  <div className="soc-plate-body" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--soc-text-high)' }}>
                      {threat.title}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--soc-text-main)', lineHeight: 1.4 }}>
                      {threat.description}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--soc-text-dim)' }}>
                      <span>Detection: {threat.detectionSource}</span>
                      <span style={{ color: 'var(--soc-primary)' }}>{threat.confidence}% Confidence</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: Focused Threat Deep Dive */}
        {activeThreat && (
          <div className="soc-plate" style={{ height: 'fit-content' }}>
            <div className="soc-plate-header">
              <span className="soc-plate-title" style={{ color: 'var(--soc-red)' }}>
                <Flame size={12} /> Threat Vector Analysis: {activeThreat.id}
              </span>
              <span className="soc-badge badge-critical">{activeThreat.severity}</span>
            </div>

            <div className="soc-plate-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '14px', color: 'var(--soc-text-high)', fontWeight: 700 }}>
                  {activeThreat.title}
                </h3>
                <p style={{ margin: 0, fontSize: '12px', color: 'var(--soc-text-main)', lineHeight: 1.5 }}>
                  {activeThreat.description}
                </p>
              </div>

              {/* Propagation Path */}
              <div style={{ padding: '10px', background: 'var(--soc-bg-elevated)', borderRadius: '4px', border: '1px solid var(--soc-border-subtle)' }}>
                <span className="soc-eyebrow" style={{ display: 'block', marginBottom: '6px' }}>
                  AFFECTED PROPAGATION PATH:
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {activeThreat.affectedPaths.map((node, i) => (
                    <div key={node} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="soc-badge badge-dim" style={{ fontWeight: 700 }}>
                        {node}
                      </span>
                      {i < activeThreat.affectedPaths.length - 1 && (
                        <ArrowRight size={12} style={{ color: 'var(--soc-red)' }} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Vector Details */}
              <div>
                <span className="soc-eyebrow" style={{ display: 'block', marginBottom: '4px' }}>
                  ROOT PHYSICS / EXPLOIT MECHANISM:
                </span>
                <div style={{ fontSize: '11px', color: 'var(--soc-text-main)', background: 'var(--soc-bg-elevated)', border: '1px solid var(--soc-border-subtle)', padding: '8px', borderRadius: '4px' }}>
                  {activeThreat.vector}
                </div>
              </div>

              {/* Action Recommendation */}
              <div>
                <span className="soc-eyebrow" style={{ display: 'block', marginBottom: '4px' }}>
                  SOVEREIGN RECOMMENDED MITIGATION:
                </span>
                <div style={{ fontSize: '11px', color: 'var(--soc-text-high)', borderLeft: '2px solid var(--soc-primary)', paddingLeft: '8px' }}>
                  {activeThreat.recommendedAction}
                </div>
              </div>

              {/* Quick Actions */}
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  className="soc-btn soc-btn-primary"
                  style={{ flex: 1 }}
                  onClick={() => {
                    setSelectedAssetId(activeThreat.targetAssetId)
                    setActiveView('overview')
                  }}
                >
                  Locate in Command Graph
                </button>
                <button
                  type="button"
                  className="soc-btn soc-btn-ghost"
                  onClick={() => {
                    setSelectedAssetId(activeThreat.targetAssetId)
                    setIntelPanelOpen(true)
                  }}
                >
                  Open Dossier
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
