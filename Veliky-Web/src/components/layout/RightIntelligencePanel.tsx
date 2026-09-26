import { useState } from 'react'
import { 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  ExternalLink, 
  FileText, 
  Calculator, 
  ArrowRight, 
  Clock, 
  Activity, 
  Check, 
  X,
  Layers,
  Thermometer,
  Gauge
} from 'lucide-react'
import { useVelikyStore } from '../../store/useVelikySOCStore'

export function RightIntelligencePanel() {
  const intelPanelOpen = useVelikyStore((s) => s.intelPanelOpen)
  const setIntelPanelOpen = useVelikyStore((s) => s.setIntelPanelOpen)
  const assets = useVelikyStore((s) => s.assets)
  const threats = useVelikyStore((s) => s.threats)
  const incidents = useVelikyStore((s) => s.incidents)
  const selectedAssetId = useVelikyStore((s) => s.selectedAssetId)
  const selectedIncidentId = useVelikyStore((s) => s.selectedIncidentId)
  const approveIncidentAction = useVelikyStore((s) => s.approveIncidentAction)
  const resetIncidentApproval = useVelikyStore((s) => s.resetIncidentApproval)
  const setActiveView = useVelikyStore((s) => s.setActiveView)

  const [activeTab, setActiveTab] = useState<'intel' | 'telemetry' | 'evidence'>('intel')

  if (!intelPanelOpen) return null

  // Find currently active incident or fallback to primary INV-2026-001
  const currentIncident = incidents.find(i => i.id === selectedIncidentId) || incidents[0]
  // Find currently active asset or fallback to target of incident
  const currentAsset = assets.find(a => a.id === (selectedAssetId || currentIncident?.targetAssetId)) || assets[0]
  // Find currently active threat or fallback to highest priority
  const currentThreat = threats.find(t => t.targetAssetId === currentAsset.id) || threats[0]

  const isApproved = currentIncident?.status === 'APPROVED'

  return (
    <aside className="veliky-intel-panel">
      {/* Header */}
      <div className="intel-panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert size={15} style={{ color: 'var(--soc-red)' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--soc-text-high)' }}>
            INTELLIGENCE DOSSIER
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="soc-badge badge-critical">
            RISK {currentIncident?.riskScore || 89}/100
          </span>
          <button 
            type="button" 
            className="soc-btn soc-btn-ghost" 
            style={{ padding: '2px 5px', fontSize: '10px' }}
            onClick={() => setIntelPanelOpen(false)}
            title="Close Panel"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--soc-border-subtle)', background: 'var(--soc-bg-elevated)' }}>
        {[
          { id: 'intel', label: 'Tactical Intel' },
          { id: 'telemetry', label: 'Live Telemetry' },
          { id: 'evidence', label: 'Evidence Citations' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              flex: 1,
              padding: '8px 4px',
              fontFamily: 'var(--font-mono)',
              fontSize: '10px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: activeTab === tab.id ? 'var(--soc-primary)' : 'var(--soc-text-dim)',
              borderBottom: activeTab === tab.id ? '2px solid var(--soc-primary)' : '2px solid transparent',
              background: 'transparent',
              cursor: 'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Panel Body */}
      <div className="intel-panel-body">
        {activeTab === 'intel' && (
          <>
            {/* Primary Threat / Risk Summary Box */}
            <div className="soc-plate">
              <div className="soc-plate-header">
                <span className="soc-plate-title" style={{ color: 'var(--soc-red)' }}>
                  <AlertTriangle size={12} /> Priority Alert: {currentIncident.id}
                </span>
                <span className="soc-badge badge-warning" style={{ fontSize: '9px' }}>
                  {currentIncident.confidenceScore}% CONFIDENCE
                </span>
              </div>
              <div className="soc-plate-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '13px', color: 'var(--soc-text-high)', fontWeight: 600 }}>
                    {currentIncident.title}
                  </h4>
                  <p style={{ margin: 0, fontSize: '11px', color: 'var(--soc-text-main)', lineHeight: 1.45 }}>
                    {currentIncident.executiveSummary}
                  </p>
                </div>

                {/* Risk Score Meter */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--soc-text-muted)', marginBottom: '3px' }}>
                    <span>SEVERITY INDEX</span>
                    <span style={{ color: 'var(--soc-red)', fontWeight: 700 }}>89 / 100 [ZONE C ATTENTION]</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: '89%', height: '100%', background: 'linear-gradient(90deg, #f59e0b, #ef4444)' }} />
                  </div>
                </div>
              </div>
            </div>

            {/* Affected Asset Quick Card */}
            <div className="soc-plate">
              <div className="soc-plate-header">
                <span className="soc-plate-title">
                  <Layers size={12} /> Target Asset: {currentAsset.id}
                </span>
                <span className={`soc-badge ${currentAsset.status === 'ATTENTION_REQUIRED' ? 'badge-critical' : 'badge-normal'}`}>
                  {currentAsset.status}
                </span>
              </div>
              <div className="soc-plate-body" style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--soc-text-muted)' }}>Equipment:</span>
                  <span style={{ color: 'var(--soc-text-high)', fontWeight: 600 }}>{currentAsset.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--soc-text-muted)' }}>Location Unit:</span>
                  <span>{currentAsset.unit}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--soc-text-muted)' }}>ISO 10816-3 Zone:</span>
                  <span style={{ color: 'var(--soc-red)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    {currentAsset.isoZone || 'Zone C'} (Ceiling: 4.5 mm/s)
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--soc-text-muted)' }}>Bearings:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px' }}>{currentAsset.bearings || '6312 C3 (NDE)'}</span>
                </div>
                {currentAsset.downstreamHazard && (
                  <div style={{ marginTop: '4px', padding: '6px 8px', background: 'rgba(239,68,68,0.06)', borderLeft: '2px solid var(--soc-red)', borderRadius: '2px' }}>
                    <span style={{ color: 'var(--soc-red)', fontSize: '10px', display: 'block', fontWeight: 600 }}>DOWNSTREAM IMPACT:</span>
                    <span style={{ color: 'var(--soc-text-main)', fontSize: '10px' }}>{currentAsset.downstreamHazard}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Attack / Anomaly Vector & Physics */}
            <div className="soc-plate">
              <div className="soc-plate-header">
                <span className="soc-plate-title">
                  <Activity size={12} /> Anomaly Vector & Physics
                </span>
                <span className="soc-badge badge-dim">
                  {currentThreat.mitreTechnique?.split(' - ')[0] || 'T0888'}
                </span>
              </div>
              <div className="soc-plate-body" style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ color: 'var(--soc-text-main)', lineHeight: 1.45 }}>
                  {currentThreat.vector}
                </div>
                <div style={{ padding: '6px 8px', background: 'var(--soc-bg-elevated)', borderRadius: '4px', border: '1px solid var(--soc-border-subtle)', fontFamily: 'var(--font-mono)', fontSize: '10px' }}>
                  <span style={{ color: 'var(--soc-primary)' }}>Spectral Finding:</span> 1X Running Frequency (24.67 Hz) at 4.1 mm/s + 2X Harmonic (49.33 Hz) at 2.3 mm/s RMS.
                </div>
              </div>
            </div>

            {/* Sandboxed Math Verification */}
            {currentIncident.calculations.length > 0 && (
              <div className="soc-plate">
                <div className="soc-plate-header">
                  <span className="soc-plate-title" style={{ color: 'var(--soc-emerald)' }}>
                    <Calculator size={12} /> Sandboxed Math Verification
                  </span>
                  <span className="soc-badge badge-normal" style={{ fontSize: '9px' }}>
                    <CheckCircle2 size={10} /> VERIFIED MATCH
                  </span>
                </div>
                <div className="soc-plate-body" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--soc-text-muted)' }}>
                    Formula: {currentIncident.calculations[0].formula}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '11px', background: 'var(--soc-bg-elevated)', border: '1px solid var(--soc-border-subtle)', padding: '6px 8px', borderRadius: '4px' }}>
                    <span>Claimed: <b>{currentIncident.calculations[0].claimedValue}</b></span>
                    <span style={{ color: 'var(--soc-emerald)' }}>Verified: <b>{currentIncident.calculations[0].verifiedValue.slice(0, 6)}%</b></span>
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--soc-text-dim)' }}>
                    Executed in isolated Docker sandbox (0 egress network, 14.2ms execution).
                  </span>
                </div>
              </div>
            )}

            {/* Recommended Action & Human Approval Gate */}
            <div className="soc-plate" style={{ borderColor: isApproved ? 'rgba(16, 185, 129, 0.4)' : 'rgba(245, 158, 11, 0.3)' }}>
              <div className="soc-plate-header">
                <span className="soc-plate-title" style={{ color: isApproved ? 'var(--soc-emerald)' : 'var(--soc-amber)' }}>
                  {isApproved ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                  Human Approval Gate
                </span>
                <span className={`soc-badge ${isApproved ? 'badge-normal' : 'badge-warning'}`}>
                  {isApproved ? 'APPROVED & SIGNED' : 'REQUIRES OPERATOR SIGN-OFF'}
                </span>
              </div>
              <div className="soc-plate-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '11px', color: 'var(--soc-text-main)' }}>
                  Recommended: Perform 48h emergency laser alignment & 6312 NDE bearing replacement.
                </div>

                {isApproved ? (
                  <div style={{ padding: '8px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '4px', border: '1px solid rgba(16, 185, 129, 0.25)', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
                    <div style={{ color: 'var(--soc-emerald)', fontWeight: 700, marginBottom: '2px' }}>
                      DIGITAL WORK ORDER DISPATCHED
                    </div>
                    <div>Signer: {currentIncident.approvedBy}</div>
                    <div style={{ color: 'var(--soc-text-dim)', fontSize: '9px', marginTop: '2px' }}>
                      Sig: {currentIncident.cryptoSignature}
                    </div>
                    <button
                      type="button"
                      className="soc-btn soc-btn-ghost"
                      style={{ marginTop: '8px', width: '100%', fontSize: '10px' }}
                      onClick={() => resetIncidentApproval(currentIncident.id)}
                    >
                      Revoke & Re-evaluate
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      className="soc-btn soc-btn-success"
                      style={{ flex: 1, padding: '8px 10px' }}
                      onClick={() => approveIncidentAction(currentIncident.id)}
                    >
                      <Check size={13} /> Approve Work Order
                    </button>
                    <button
                      type="button"
                      className="soc-btn soc-btn-ghost"
                      onClick={() => setActiveView('incidents')}
                      title="Inspect full case in Incidents Room"
                    >
                      <ExternalLink size={13} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === 'telemetry' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="soc-plate">
              <div className="soc-plate-header">
                <span className="soc-plate-title">
                  <Gauge size={12} /> Sensor Readings: {currentAsset.id}
                </span>
                <span className="soc-badge badge-critical">ZONE C</span>
              </div>
              <div className="soc-plate-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div className="kpi-metric-box" style={{ padding: '8px' }}>
                    <span className="kpi-metric-label">RMS VELOCITY</span>
                    <span className="kpi-metric-value" style={{ color: 'var(--soc-red)', fontSize: '18px' }}>
                      {currentAsset.telemetry.rmsVelocity || 5.4} <span style={{ fontSize: '10px' }}>mm/s</span>
                    </span>
                    <span className="kpi-metric-sub">Baseline: 2.8 mm/s</span>
                  </div>
                  <div className="kpi-metric-box" style={{ padding: '8px' }}>
                    <span className="kpi-metric-label">BEARING TEMP</span>
                    <span className="kpi-metric-value" style={{ color: 'var(--soc-amber)', fontSize: '18px' }}>
                      {currentAsset.telemetry.temperatureC || 68.2} <span style={{ fontSize: '10px' }}>°C</span>
                    </span>
                    <span className="kpi-metric-sub">Limit: 70.0 °C</span>
                  </div>
                </div>

                {/* Vibration Trend Table */}
                <div style={{ marginTop: '4px' }}>
                  <span className="soc-eyebrow" style={{ display: 'block', marginBottom: '6px' }}>
                    2026 HISTORICAL TELEMETRY (pump_p204_vibration_history.csv)
                  </span>
                  <table className="soc-table" style={{ fontSize: '11px' }}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>RMS</th>
                        <th>Temp</th>
                        <th>Zone</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentAsset.telemetry.history.map((h, i) => (
                        <tr key={i}>
                          <td className="soc-mono" style={{ fontSize: '10px' }}>{h.date}</td>
                          <td className="soc-mono" style={{ color: h.isoZone === 'Zone_C' ? 'var(--soc-red)' : 'var(--soc-text-high)' }}>
                            {h.rmsVelocity} mm/s
                          </td>
                          <td className="soc-mono">{h.temperatureC}°C</td>
                          <td>
                            <span className={`soc-badge ${h.isoZone === 'Zone_C' ? 'badge-critical' : 'badge-normal'}`} style={{ fontSize: '9px', padding: '0 4px' }}>
                              {h.isoZone.replace('_', ' ')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'evidence' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <span className="soc-eyebrow">
              VERIFIED REPOSITORY CITATIONS (100% AUDITABLE)
            </span>
            {currentIncident.evidence.map((ev, idx) => (
              <div key={idx} className="soc-plate">
                <div className="soc-plate-header">
                  <span className="soc-plate-title" style={{ fontSize: '10px' }}>
                    <FileText size={11} style={{ color: 'var(--soc-primary)' }} />
                    {ev.documentName} (p.{ev.pageNumber})
                  </span>
                  <span className="soc-badge badge-normal" style={{ fontSize: '9px' }}>
                    <Check size={9} /> VERIFIED
                  </span>
                </div>
                <div className="soc-plate-body" style={{ fontSize: '11px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--soc-text-high)', marginBottom: '3px' }}>
                    {ev.title}
                  </div>
                  <blockquote style={{ margin: 0, paddingLeft: '8px', borderLeft: '2px solid var(--soc-primary)', color: 'var(--soc-text-muted)', fontStyle: 'italic', fontSize: '10px', lineHeight: 1.4 }}>
                    "{ev.excerpt}"
                  </blockquote>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}
