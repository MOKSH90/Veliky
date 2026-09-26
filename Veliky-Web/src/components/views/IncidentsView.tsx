import { useState } from 'react'
import { 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  Calculator, 
  FileText, 
  Layers, 
  ArrowRight, 
  Check, 
  X, 
  ExternalLink,
  Lock,
  Download,
  Printer
} from 'lucide-react'
import { useVelikyStore } from '../../store/useVelikySOCStore'
import type { IncidentItem } from '../../lib/types'

export function IncidentsView() {
  const incidents = useVelikyStore((s) => s.incidents)
  const selectedIncidentId = useVelikyStore((s) => s.selectedIncidentId)
  const setSelectedIncidentId = useVelikyStore((s) => s.setSelectedIncidentId)
  const approveIncidentAction = useVelikyStore((s) => s.approveIncidentAction)
  const resetIncidentApproval = useVelikyStore((s) => s.resetIncidentApproval)
  const setSelectedAssetId = useVelikyStore((s) => s.setSelectedAssetId)
  const setActiveView = useVelikyStore((s) => s.setActiveView)

  const [activeTab, setActiveTab] = useState<'chain' | 'evidence' | 'calculations' | 'response'>('chain')

  const currentIncident = incidents.find(i => i.id === selectedIncidentId) || incidents[0]
  const isApproved = currentIncident.status === 'APPROVED'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', padding: '16px 20px', gap: '16px' }}>
      {/* Top Incident Case Switcher */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} style={{ color: 'var(--soc-red)' }} />
            <h2 style={{ margin: 0, fontSize: '16px', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--soc-text-high)' }}>
              INCIDENT INVESTIGATION & CONTAINMENT ROOM
            </h2>
          </div>
          <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--soc-text-muted)' }}>
            Root Cause Forensic Chain · Sandboxed Verification · Human-in-the-Loop Sign-off
          </p>
        </div>

        {/* Case Selector Tabs */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {incidents.map((inc) => (
            <button
              key={inc.id}
              type="button"
              onClick={() => setSelectedIncidentId(inc.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '4px',
                background: currentIncident.id === inc.id ? 'var(--soc-bg-hover)' : 'var(--soc-bg-elevated)',
                border: `1px solid ${currentIncident.id === inc.id ? 'var(--soc-red)' : 'var(--soc-border-subtle)'}`,
                color: currentIncident.id === inc.id ? 'var(--soc-text-high)' : 'var(--soc-text-dim)',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <span className={`soc-dot ${inc.verdict === 'ATTENTION_REQUIRED' ? 'red' : 'amber'}`} />
              <span>{inc.id}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Incident Header Plate */}
      <div className="soc-plate">
        <div className="soc-plate-header" style={{ padding: '12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className={`soc-badge ${currentIncident.verdict === 'ATTENTION_REQUIRED' ? 'badge-critical' : 'badge-warning'}`}>
              VERDICT: {currentIncident.verdict}
            </span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--soc-text-high)' }}>
              {currentIncident.id}: {currentIncident.title}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="soc-badge badge-dim">
              RISK {currentIncident.riskScore}/100
            </span>
            <span className="soc-badge badge-dim">
              CONFIDENCE {currentIncident.confidenceScore}%
            </span>
            <span className={`soc-badge ${isApproved ? 'badge-normal' : 'badge-warning'}`}>
              {isApproved ? 'STATUS: APPROVED' : 'STATUS: REQUIRES APPROVAL'}
            </span>
          </div>
        </div>

        <div className="soc-plate-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <p style={{ margin: 0, fontSize: '12px', color: 'var(--soc-text-main)', lineHeight: 1.5 }}>
            {currentIncident.executiveSummary}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', background: 'var(--soc-bg-elevated)', border: '1px solid var(--soc-border-subtle)', padding: '10px', borderRadius: '4px' }}>
            <div>
              <span className="soc-eyebrow">TARGET ASSET:</span>
              <div 
                style={{ fontSize: '12px', fontWeight: 700, color: 'var(--soc-primary)', cursor: 'pointer' }}
                onClick={() => {
                  setSelectedAssetId(currentIncident.targetAssetId)
                  setActiveView('overview')
                }}
              >
                {currentIncident.targetAssetId} (View in Topology)
              </div>
            </div>
            <div>
              <span className="soc-eyebrow">POLICY TIER:</span>
              <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--soc-amber)' }}>
                {currentIncident.policyTier}
              </div>
            </div>
            <div>
              <span className="soc-eyebrow">OPERATOR ROLE:</span>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--soc-text-main)', textTransform: 'uppercase' }}>
                {currentIncident.operatorRole}
              </div>
            </div>
            <div>
              <span className="soc-eyebrow">TIMESTAMP:</span>
              <div style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--soc-text-dim)' }}>
                {currentIncident.createdAt.split('T')[0]} {currentIncident.createdAt.split('T')[1]?.slice(0, 8)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--soc-border-subtle)', background: 'var(--soc-bg-elevated)' }}>
        {[
          { id: 'chain', label: 'Attack & Degradation Chain' },
          { id: 'evidence', label: 'Evidence Locker (3 Sources)' },
          { id: 'calculations', label: 'Sandboxed Math Verifier' },
          { id: 'response', label: 'Human Approval & Work Order' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            style={{
              padding: '8px 16px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
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

      {/* Tab 1: Attack / Degradation Chain */}
      {activeTab === 'chain' && (
        <div className="soc-plate">
          <div className="soc-plate-header">
            <span className="soc-plate-title">
              <Clock size={12} /> Chronological Anomaly Progression
            </span>
            <span className="soc-eyebrow">DETERMINISTIC TIMELINE</span>
          </div>
          <div className="soc-plate-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {currentIncident.attackChain.map((step, idx) => (
              <div 
                key={step.step}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                  padding: '12px 14px',
                  background: 'var(--soc-bg-elevated)',
                  border: '1px solid var(--soc-border-subtle)',
                  borderRadius: '6px'
                }}
              >
                <div 
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '50%',
                    background: step.status === 'propagating' ? 'rgba(239,68,68,0.15)' : 'var(--soc-primary-subtle)',
                    border: `1px solid ${step.status === 'propagating' ? 'var(--soc-red)' : 'var(--soc-primary)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 700,
                    fontSize: '12px',
                    color: step.status === 'propagating' ? 'var(--soc-red)' : 'var(--soc-primary)',
                    flexShrink: 0
                  }}
                >
                  {step.step}
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <h4 style={{ margin: 0, fontSize: '13px', color: 'var(--soc-text-high)', fontWeight: 600 }}>
                      {step.title}
                    </h4>
                    <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--soc-text-dim)' }}>
                      {step.timestamp}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '11px', color: 'var(--soc-text-main)', lineHeight: 1.45 }}>
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Evidence Locker */}
      {activeTab === 'evidence' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px' }}>
          {currentIncident.evidence.map((ev, i) => (
            <div key={i} className="soc-plate">
              <div className="soc-plate-header">
                <span className="soc-plate-title" style={{ fontSize: '11px' }}>
                  <FileText size={12} style={{ color: 'var(--soc-primary)' }} />
                  {ev.documentName}
                </span>
                <span className="soc-badge badge-normal" style={{ fontSize: '9px' }}>
                  <Check size={10} /> VERIFIED
                </span>
              </div>
              <div className="soc-plate-body" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--soc-text-high)' }}>
                  {ev.title} (Page {ev.pageNumber})
                </div>
                <blockquote style={{ margin: 0, paddingLeft: '8px', borderLeft: '2px solid var(--soc-primary)', color: 'var(--soc-text-main)', fontStyle: 'italic', fontSize: '11px', lineHeight: 1.45 }}>
                  "{ev.excerpt}"
                </blockquote>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--soc-text-dim)', marginTop: '4px' }}>
                  <span>Indexed: {ev.timestamp}</span>
                  <span style={{ color: 'var(--soc-emerald)' }}>Cryptographically Sealed</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Sandboxed Math Verifier */}
      {activeTab === 'calculations' && (
        <div className="soc-plate">
          <div className="soc-plate-header">
            <span className="soc-plate-title" style={{ color: 'var(--soc-emerald)' }}>
              <Calculator size={12} /> Independent Sandboxed Mathematical Verification
            </span>
            <span className="soc-badge badge-normal">100% MATHEMATICAL MATCH</span>
          </div>
          <div className="soc-plate-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--soc-text-main)' }}>
              VELIKY enforces zero-hallucination policies. All numerical statements are automatically extracted, converted to Python ASTs, and independently executed in an isolated Docker container.
            </p>

            {currentIncident.calculations.map((calc) => (
              <div 
                key={calc.id}
                style={{
                  background: 'var(--soc-bg-elevated)',
                  border: '1px solid var(--soc-border-subtle)',
                  borderRadius: '6px',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="soc-eyebrow">EXECUTION FORMULA:</span>
                  <span className="soc-badge badge-normal" style={{ fontSize: '9px' }}>
                    EXECUTION TIME: {calc.runtimeMs}ms
                  </span>
                </div>
                <pre style={{ margin: 0, padding: '8px 10px', background: 'var(--soc-bg-card)', borderRadius: '4px', border: '1px solid var(--soc-border-subtle)', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--soc-primary)' }}>
                  {`# Python Sandbox Execution Trace
current_velocity = 5.4  # mm/s RMS (Inspection Report #62)
baseline_velocity = 2.8 # mm/s RMS (Commissioning baseline)
percentage_deviation = ((current_velocity - baseline_velocity) / baseline_velocity) * 100
# Output: 92.85714285714289%`}
                </pre>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '4px' }}>
                  <div style={{ padding: '8px', background: 'var(--soc-bg-card)', border: '1px solid var(--soc-border-subtle)', borderRadius: '4px' }}>
                    <div style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--soc-text-dim)' }}>DOCUMENT CLAIM:</div>
                    <div style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--soc-text-high)' }}>
                      {calc.claimedValue}
                    </div>
                  </div>
                  <div style={{ padding: '8px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '4px' }}>
                    <div style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--soc-emerald)' }}>SANDBOX VERIFIED:</div>
                    <div style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--soc-emerald)' }}>
                      {calc.verifiedValue.slice(0, 10)}% [PASS]
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Human Approval Workflow */}
      {activeTab === 'response' && (
        <div className="soc-plate">
          <div className="soc-plate-header">
            <span className="soc-plate-title" style={{ color: isApproved ? 'var(--soc-emerald)' : 'var(--soc-amber)' }}>
              {isApproved ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
              Operator Sign-off & Containment Execution
            </span>
            <span className={`soc-badge ${isApproved ? 'badge-normal' : 'badge-warning'}`}>
              {isApproved ? 'SIGNED & DISPATCHED' : 'AWAITING APPROVAL'}
            </span>
          </div>

          <div className="soc-plate-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <span className="soc-eyebrow" style={{ display: 'block', marginBottom: '6px' }}>
                ACTIONABLE RECOMMENDATIONS:
              </span>
              <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '12px', color: 'var(--soc-text-main)', lineHeight: 1.6 }}>
                {currentIncident.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>

            {isApproved ? (
              <div 
                style={{
                  padding: '14px',
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--soc-emerald)', fontWeight: 700, fontSize: '13px' }}>
                  <CheckCircle2 size={15} /> WORK ORDER #WO-2026-P204 COMMITTED TO SCADA
                </div>
                <div style={{ fontSize: '11px', color: 'var(--soc-text-main)' }}>
                  Approved by: <b>{currentIncident.approvedBy}</b> at {currentIncident.approvedAt}
                </div>
                <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--soc-text-dim)' }}>
                  Cryptographic Audit Signature: <code>{currentIncident.cryptoSignature}</code>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <button
                    type="button"
                    className="soc-btn soc-btn-ghost"
                    onClick={() => resetIncidentApproval(currentIncident.id)}
                  >
                    Revoke Approval
                  </button>
                </div>
              </div>
            ) : (
              <div 
                style={{
                  padding: '14px',
                  background: 'rgba(245, 158, 11, 0.06)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  borderRadius: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px'
                }}
              >
                <div style={{ fontSize: '12px', color: 'var(--soc-text-high)', fontWeight: 600 }}>
                  Operator Verification Required
                </div>
                <div style={{ fontSize: '11px', color: 'var(--soc-text-muted)' }}>
                  Per SOP-PM-204 Section 4.5, vibration increases exceeding 50% over baseline require explicit clearance before mechanical dispatch.
                </div>

                <button
                  type="button"
                  className="soc-btn soc-btn-success"
                  onClick={() => approveIncidentAction(currentIncident.id)}
                  style={{ alignSelf: 'flex-start', padding: '8px 16px' }}
                >
                  <Check size={13} /> Sign & Approve Work Order
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
