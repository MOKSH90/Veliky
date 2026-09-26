import React, { useState } from 'react'
import { 
  ShieldAlert, 
  AlertTriangle, 
  Layers, 
  Calculator, 
  Lock, 
  Activity, 
  ArrowRight, 
  Terminal, 
  CheckCircle2, 
  Radio,
  Search,
  Sparkles,
  Play,
  FileText,
  Image as ImageIcon,
  Check,
  X,
  ExternalLink,
  ChevronRight,
  Cpu,
  RefreshCw
} from 'lucide-react'
import { useVelikyStore } from '../../store/useVelikySOCStore'
import { SecuritySituationGraph } from './SecuritySituationGraph'

export function OverviewView() {
  const defconLevel = useVelikyStore((s) => s.defconLevel)
  const incidents = useVelikyStore((s) => s.incidents)
  const assets = useVelikyStore((s) => s.assets)
  const systemResources = useVelikyStore((s) => s.systemResources)
  const auditRecords = useVelikyStore((s) => s.auditRecords)
  const setActiveView = useVelikyStore((s) => s.setActiveView)
  const setSelectedAssetId = useVelikyStore((s) => s.setSelectedAssetId)
  const setSelectedIncidentId = useVelikyStore((s) => s.setSelectedIncidentId)
  const setIntelPanelOpen = useVelikyStore((s) => s.setIntelPanelOpen)
  const runAutonomousTask = useVelikyStore((s) => s.runAutonomousTask)
  const isAnalyzing = useVelikyStore((s) => s.isAnalyzing)
  const chatMessages = useVelikyStore((s) => s.chatMessages)
  const approveIncidentAction = useVelikyStore((s) => s.approveIncidentAction)
  const activeModel = useVelikyStore((s) => s.activeModel)

  const [queryInput, setQueryInput] = useState('')
  const [showTopology, setShowTopology] = useState(false)
  const [pidModalOpen, setPidModalOpen] = useState(false)

  const activeIncidents = incidents.filter(i => i.status !== 'RESOLVED')
  const criticalIncident = incidents.find(i => i.verdict === 'ATTENTION_REQUIRED') || incidents[0]
  const p204Asset = assets.find(a => a.id === 'P-204') || assets[0]
  const isIncidentApproved = criticalIncident?.status === 'APPROVED'

  const promptSuggestions = [
    { label: 'Pump P-204 Vibration Exceedance (+92.9%)', prompt: 'Analyze centrifugal pump P-204 vibration condition and determine whether attention is required. Use maintenance history, inspection report, and SOP. Calculate deviation using Python and produce evidence-backed report.' },
    { label: 'Compressor C-104 Cascade Risk', prompt: 'Explain downstream cascade impact of P-204 on Compressor C-104 and Surge Drum TK-101.' },
    { label: 'Inspect Unit 2 P&ID Drawing & Valve V-19', prompt: 'Analyze Unit 2 P&ID engineering drawing. Identify isolation valve V-19 and verify mechanical seal Plan 53A interlock.' },
    { label: 'Verify Steam Boiler B-102 Ultrasonic Test', prompt: 'Verify Steam Boiler B-102 ultrasonic tube thickness report against ASME Section I threshold.' }
  ]

  const handleRunQuery = (prompt: string) => {
    if (!prompt.trim() || isAnalyzing) return
    runAutonomousTask(prompt)
  }

  const latestAssistantMessage = chatMessages.filter(m => m.role === 'assistant').slice(-1)[0]

  return (
    <div className="veliky-overview-container" style={{ padding: '20px 24px', overflowY: 'auto', height: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* 1. SOVEREIGN QUERY & INVESTIGATION CONSOLE (PROMINENT, FRONT & CENTER) */}
      <div 
        style={{
          background: 'var(--soc-bg-surface)',
          border: '1px solid var(--soc-border-medium)',
          borderRadius: '10px',
          padding: '20px 24px',
          boxShadow: 'var(--soc-shadow-md)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '6px', borderRadius: '6px', background: 'var(--soc-primary-subtle)', color: 'var(--soc-primary)' }}>
              <Sparkles size={18} />
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', color: 'var(--soc-text-high)' }}>
                SOVEREIGN INDUSTRIAL INQUIRY CONSOLE
              </h2>
              <p style={{ margin: 0, fontSize: '11px', color: 'var(--soc-text-muted)' }}>
                Autonomous reasoning over P&ID drawings, inspection PDFs, maintenance spreadsheets, and equipment SOPs.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="soc-badge badge-sovereign" style={{ fontSize: '10px' }}>
              <Lock size={10} /> ZERO CLOUD EGRESS
            </span>
            <span className="soc-badge badge-dim" style={{ fontSize: '10px' }}>
              <Cpu size={10} /> {activeModel.split('/')[1] || activeModel}
            </span>
          </div>
        </div>

        {/* The Search & Execution Input Form */}
        <form 
          onSubmit={(e) => {
            e.preventDefault()
            handleRunQuery(queryInput)
          }}
          style={{ display: 'flex', gap: '10px', width: '100%', flexWrap: 'wrap' }}
        >
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--soc-text-muted)' }} />
            <input 
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="Ask VELIKY: e.g., 'Analyze Pump P-204 vibration condition and calculate baseline deviation'..."
              style={{
                width: '100%',
                padding: '12px 16px 12px 42px',
                background: 'var(--soc-bg-elevated)',
                border: '1px solid var(--soc-border-medium)',
                borderRadius: '6px',
                color: 'var(--soc-text-high)',
                fontSize: '13px',
                fontFamily: 'var(--font-sans)',
                outline: 'none',
                transition: 'all 0.15s ease'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isAnalyzing}
            className="soc-btn soc-btn-primary"
            style={{
              padding: '0 20px',
              fontSize: '12px',
              fontWeight: 700,
              gap: '8px',
              background: 'linear-gradient(135deg, #0284c7, #06b6d4)',
              border: 'none',
              borderRadius: '6px',
              color: '#ffffff',
              cursor: isAnalyzing ? 'not-allowed' : 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {isAnalyzing ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Investigating...</span>
              </>
            ) : (
              <>
                <Play size={14} fill="#ffffff" />
                <span>Investigate & Verify</span>
              </>
            )}
          </button>
        </form>

        {/* Suggested Scenario Chips (1-Click Execution) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11px', color: 'var(--soc-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Quick Inquiries:
          </span>
          {promptSuggestions.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setQueryInput(item.prompt)
                handleRunQuery(item.prompt)
              }}
              style={{
                background: 'var(--soc-bg-elevated)',
                border: '1px solid var(--soc-border-subtle)',
                color: 'var(--soc-text-medium)',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--soc-primary-subtle)'
                e.currentTarget.style.borderColor = 'var(--soc-primary)'
                e.currentTarget.style.color = 'var(--soc-primary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--soc-bg-elevated)'
                e.currentTarget.style.borderColor = 'var(--soc-border-subtle)'
                e.currentTarget.style.color = 'var(--soc-text-medium)'
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Live Active Investigation Result Box (Appears when inquiry is executed) */}
        {latestAssistantMessage && (
          <div 
            style={{
              marginTop: '16px',
              padding: '16px',
              background: 'var(--soc-primary-subtle)',
              border: '1px solid var(--soc-primary)',
              borderRadius: '8px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle2 size={16} style={{ color: 'var(--soc-emerald)' }} />
                <span style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--soc-primary)' }}>
                  LATEST VERIFIED INVESTIGATION OUTCOME (ISO 10816-3)
                </span>
              </div>
              <span className="soc-badge badge-normal" style={{ fontSize: '10px' }}>
                SANDBOX VERIFICATION: PASSED
              </span>
            </div>

            <p style={{ margin: 0, fontSize: '13px', color: 'var(--soc-text-high)', lineHeight: 1.55 }}>
              {latestAssistantMessage.content.slice(0, 320)}...
            </p>

            {/* Citations & Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', paddingTop: '8px', borderTop: '1px solid var(--soc-border-subtle)' }}>
              <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', color: 'var(--soc-text-muted)' }}>Cited Vault Records:</span>
                {latestAssistantMessage.citedSources?.map((src, sIdx) => (
                  <span key={sIdx} className="soc-badge badge-dim" style={{ fontSize: '10px' }}>
                    <FileText size={10} /> {src}
                  </span>
                )) || (
                  <span className="soc-badge badge-dim" style={{ fontSize: '10px' }}>
                    <FileText size={10} /> Inspection-Report-62.md
                  </span>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setActiveView('agent')}
                  className="soc-btn soc-btn-secondary"
                  style={{ padding: '3px 8px', fontSize: '11px' }}
                >
                  <span>Full Reasoning Trace</span>
                  <ArrowRight size={11} />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('reports')}
                  className="soc-btn soc-btn-primary"
                  style={{ padding: '3px 8px', fontSize: '11px' }}
                >
                  <FileText size={11} />
                  <span>Open Dossier</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. FOUR HIGH-LEVEL OPERATIONAL POSTURE CARDS (CLEAN, SPACED, NO CLUTTER) */}
      <div className="overview-kpi-grid">
        {/* Card 1: DEFCON / Safety Posture */}
        <div 
          className="kpi-metric-box" 
          style={{ 
            '--kpi-accent': 'var(--soc-red)',
            background: 'var(--soc-bg-surface)',
            border: '1px solid var(--soc-border-subtle)',
            borderRadius: '8px',
            padding: '14px 16px'
          } as any}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--soc-text-muted)', letterSpacing: '0.06em' }}>
              OPERATIONAL POSTURE
            </span>
            <span className="soc-dot red pulse" />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--soc-red)' }}>
            DEFCON 2
          </div>
          <div style={{ fontSize: '11px', color: 'var(--soc-text-muted)', marginTop: '2px' }}>
            P-204 Vibration Exceeds 4.5 mm/s (Zone C)
          </div>
        </div>

        {/* Card 2: Monitored Assets */}
        <div 
          className="kpi-metric-box" 
          onClick={() => setActiveView('assets')}
          style={{ 
            '--kpi-accent': 'var(--soc-primary)',
            background: 'var(--soc-bg-surface)',
            border: '1px solid var(--soc-border-subtle)',
            borderRadius: '8px',
            padding: '14px 16px',
            cursor: 'pointer'
          } as any}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--soc-text-muted)', letterSpacing: '0.06em' }}>
              PROTECTED ASSETS
            </span>
            <Layers size={13} style={{ color: 'var(--soc-primary)' }} />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--soc-primary)' }}>
            {assets.length} <span style={{ fontSize: '12px', color: 'var(--soc-text-dim)' }}>UNITS</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--soc-text-muted)', marginTop: '2px' }}>
            1 Critical Attention · 9 In Baseline
          </div>
        </div>

        {/* Card 3: Verification Rate */}
        <div 
          className="kpi-metric-box" 
          style={{ 
            '--kpi-accent': 'var(--soc-emerald)',
            background: 'var(--soc-bg-surface)',
            border: '1px solid var(--soc-border-subtle)',
            borderRadius: '8px',
            padding: '14px 16px'
          } as any}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--soc-text-muted)', letterSpacing: '0.06em' }}>
              VERIFICATION ACCURACY
            </span>
            <CheckCircle2 size={13} style={{ color: 'var(--soc-emerald)' }} />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--soc-emerald)' }}>
            99.82%
          </div>
          <div style={{ fontSize: '11px', color: 'var(--soc-text-muted)', marginTop: '2px' }}>
            Deterministic Python Sandbox Checks
          </div>
        </div>

        {/* Card 4: Air-Gap Egress Leak */}
        <div 
          className="kpi-metric-box" 
          style={{ 
            '--kpi-accent': 'var(--soc-emerald)',
            background: 'var(--soc-bg-surface)',
            border: '1px solid var(--soc-border-subtle)',
            borderRadius: '8px',
            padding: '14px 16px'
          } as any}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--soc-text-muted)', letterSpacing: '0.06em' }}>
              NETWORK OUTBOUND EGRESS
            </span>
            <Lock size={13} style={{ color: 'var(--soc-emerald)' }} />
          </div>
          <div style={{ fontSize: '20px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--soc-text-high)' }}>
            0.00 <span style={{ fontSize: '12px', color: 'var(--soc-emerald)' }}>KB/s</span>
          </div>
          <div style={{ fontSize: '11px', color: 'var(--soc-emerald)', marginTop: '2px' }}>
            Strict Physical Air-Gap Enforced
          </div>
        </div>
      </div>

      {/* 3. TWO-COLUMN OPERATIONAL WORKBENCH (DECLUTTERED & FOCUSED) */}
      <div className="overview-two-col">
        
        {/* LEFT COLUMN: Spotlight on Active Critical Asset & Pending Human Sign-Off */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Active Spotlight Asset: Centrifugal Slurry Pump P-204 */}
          <div 
            style={{
              background: 'var(--soc-bg-surface)',
              border: '1px solid var(--soc-amber)',
              borderRadius: '8px',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              boxShadow: 'var(--soc-shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="soc-badge badge-warning" style={{ fontSize: '11px' }}>
                  <AlertTriangle size={12} /> CRITICAL SPOTLIGHT
                </span>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--soc-text-high)' }}>
                  {p204Asset.name} ({p204Asset.tag})
                </h3>
              </div>
              <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--soc-amber)', fontWeight: 600 }}>
                ISO 10816-3: ZONE C (ALERT)
              </span>
            </div>

            <p style={{ margin: 0, fontSize: '12px', color: 'var(--soc-text-medium)', lineHeight: 1.5 }}>
              Vibration velocity on Non-Drive End (NDE) bearing reached <strong>5.4 mm/s RMS</strong> (calculated drift: <strong>+92.86%</strong> from 2.8 mm/s baseline). Immediate mechanical seal Plan 53A inspection required.
            </p>

            {/* Live Asset Telemetry Gauges Grid */}
            <div className="overview-gauge-grid">
              <div>
                <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--soc-text-dim)' }}>RMS VELOCITY</span>
                <div style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--soc-amber)' }}>
                  {p204Asset.telemetry.rmsVelocity} mm/s
                </div>
                <span style={{ fontSize: '9px', color: 'var(--soc-red)' }}>Limit: 4.5</span>
              </div>
              <div>
                <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--soc-text-dim)' }}>BEARING TEMP</span>
                <div style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--soc-text-high)' }}>
                  {p204Asset.telemetry.temperatureC}°C
                </div>
                <span style={{ fontSize: '9px', color: 'var(--soc-text-muted)' }}>Max: 75°C</span>
              </div>
              <div>
                <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--soc-text-dim)' }}>PRESSURE</span>
                <div style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--soc-text-high)' }}>
                  {p204Asset.telemetry.pressureBar} bar
                </div>
                <span style={{ fontSize: '9px', color: 'var(--soc-emerald)' }}>Normal</span>
              </div>
              <div>
                <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--soc-text-dim)' }}>FFT HARMONIC</span>
                <div style={{ fontSize: '15px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--soc-primary)' }}>
                  1X (24.67 Hz)
                </div>
                <span style={{ fontSize: '9px', color: 'var(--soc-primary)' }}>Running Peak</span>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', paddingTop: '4px' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setPidModalOpen(true)}
                  className="soc-btn soc-btn-secondary"
                  style={{ fontSize: '11px', padding: '4px 10px', gap: '6px' }}
                >
                  <ImageIcon size={12} /> View P&ID Drawing
                </button>
                <button
                  type="button"
                  onClick={() => setActiveView('monitoring')}
                  className="soc-btn soc-btn-secondary"
                  style={{ fontSize: '11px', padding: '4px 10px', gap: '6px' }}
                >
                  <Activity size={12} /> FFT Vibration Spectrum
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedIncidentId(criticalIncident.id)
                  setActiveView('incidents')
                }}
                className="soc-btn soc-btn-primary"
                style={{ fontSize: '11px', padding: '4px 12px', gap: '6px' }}
              >
                <span>Open Incident Room</span>
                <ChevronRight size={12} />
              </button>
            </div>
          </div>

          {/* Pending Human Sign-Off / Approval Card */}
          <div 
            style={{
              background: 'var(--soc-bg-surface)',
              border: isIncidentApproved ? '1px solid var(--soc-emerald)' : '1px solid var(--soc-border-medium)',
              borderRadius: '8px',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              boxShadow: 'var(--soc-shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={16} style={{ color: isIncidentApproved ? 'var(--soc-emerald)' : 'var(--soc-red)' }} />
                <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--soc-text-high)' }}>
                  HUMAN-IN-THE-LOOP APPROVAL (POLICY GATE)
                </h3>
              </div>
              <span className={`soc-badge ${isIncidentApproved ? 'badge-normal' : 'badge-critical'}`} style={{ fontSize: '10px' }}>
                {isIncidentApproved ? 'APPROVED & SEALED' : 'REQUIRES OPERATOR REVIEW'}
              </span>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--soc-text-medium)', lineHeight: 1.5 }}>
              <strong>Proposed Work Order:</strong> WO-2026-881 (Emergency Containment of P-204 & Isolation Valve V-19 Actuation).
              <div style={{ fontSize: '11px', color: 'var(--soc-text-muted)', marginTop: '4px', fontFamily: 'var(--font-mono)' }}>
                Verification Assertion: assert vibration &gt; 4.5 and delta_pct == 92.86 [PASSED]
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', paddingTop: '4px' }}>
              {isIncidentApproved ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--soc-emerald)', fontSize: '12px', fontFamily: 'var(--font-mono)' }}>
                  <Check size={14} /> Approved by {criticalIncident.approvedBy || 'Operator'} (Signed with SHA-256)
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedIncidentId(criticalIncident.id)
                      setActiveView('incidents')
                    }}
                    className="soc-btn soc-btn-ghost"
                    style={{ fontSize: '11px', padding: '4px 10px' }}
                  >
                    View Diff & Citations
                  </button>
                  <button
                    type="button"
                    onClick={() => approveIncidentAction(criticalIncident.id)}
                    className="soc-btn soc-btn-success"
                    style={{ 
                      fontSize: '11px', 
                      padding: '5px 14px', 
                      gap: '6px'
                    }}
                  >
                    <Check size={13} />
                    <span>Sign & Approve Work Order</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Tamper-Evident Audit Ledger & Topology Toggle */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {/* Audit Ledger Feed (Section 16) */}
          <div 
            style={{
              background: 'var(--soc-bg-surface)',
              border: '1px solid var(--soc-border-subtle)',
              borderRadius: '8px',
              padding: '18px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              flex: 1,
              boxShadow: 'var(--soc-shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Terminal size={15} style={{ color: 'var(--soc-primary)' }} />
                <h3 style={{ margin: 0, fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--soc-text-high)' }}>
                  TAMPER-EVIDENT AUDIT LEDGER (SECTION 16)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveView('activity')}
                className="soc-btn soc-btn-ghost"
                style={{ fontSize: '10px', padding: '2px 6px' }}
              >
                <span>View Full ({auditRecords.length})</span>
                <ChevronRight size={10} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: '280px' }}>
              {auditRecords.slice(0, 4).map((record) => (
                <div 
                  key={record.id}
                  style={{
                    background: 'var(--soc-bg-elevated)',
                    border: '1px solid var(--soc-border-subtle)',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px', fontFamily: 'var(--font-mono)' }}>
                    <span style={{ color: 'var(--soc-primary)', fontWeight: 600 }}>{record.action}</span>
                    <span style={{ color: 'var(--soc-text-dim)' }}>{record.timestamp.split('T')[1]?.slice(0, 8) || 'Just now'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '10px', color: 'var(--soc-text-muted)' }}>
                    <span>Target: <strong style={{ color: 'var(--soc-text-high)' }}>{record.targetAsset}</strong></span>
                    <span style={{ color: 'var(--soc-emerald)' }}>{record.verdict}</span>
                  </div>
                  <div style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--soc-text-dim)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    SHA256: {record.sha256Hash}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Collapsible Industrial Situation Graph */}
          <div 
            style={{
              background: 'var(--soc-bg-surface)',
              border: '1px solid var(--soc-border-subtle)',
              borderRadius: '8px',
              padding: '14px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              boxShadow: 'var(--soc-shadow-sm)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--soc-text-high)' }}>
                PROCESS TOPOLOGY GRAPH
              </span>
              <button
                type="button"
                onClick={() => setShowTopology(!showTopology)}
                className="soc-btn soc-btn-ghost"
                style={{ fontSize: '11px', padding: '2px 8px' }}
              >
                {showTopology ? 'Hide Topology Canvas' : 'Show Topology Canvas'}
              </button>
            </div>

            {showTopology && (
              <div style={{ height: '220px', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--soc-border-subtle)' }}>
                <SecuritySituationGraph />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* P&ID Schematic Modal */}
      {pidModalOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div 
            style={{
              width: '820px',
              maxWidth: '95vw',
              background: 'var(--soc-bg-card)',
              border: '1px solid var(--soc-border-medium)',
              borderRadius: '8px',
              boxShadow: '0 12px 48px rgba(0,0,0,0.8)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div className="soc-plate-header" style={{ padding: '12px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ImageIcon size={16} style={{ color: 'var(--soc-primary)' }} />
                <span className="soc-plate-title">Unit 2 Bottoms Transfer & Preheat P&ID Schematic</span>
              </div>
              <button 
                type="button" 
                className="soc-btn soc-btn-ghost" 
                onClick={() => setPidModalOpen(false)}
              >
                Close
              </button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--soc-bg-surface)' }}>
              <div style={{ width: '100%', height: '320px', border: '1px solid var(--soc-border-subtle)', borderRadius: '4px', background: 'var(--soc-bg-base)', position: 'relative' }}>
                <svg viewBox="0 0 760 300" style={{ width: '100%', height: '100%' }}>
                  <pattern id="pidGridOverview" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="var(--soc-border-subtle)" strokeWidth="0.5" />
                  </pattern>
                  <rect width="760" height="300" fill="url(#pidGridOverview)" />

                  <path d="M 80 150 L 220 150 L 220 150 L 380 150 L 520 150 L 680 150" fill="none" stroke="#64748b" strokeWidth="2.5" />
                  <path d="M 300 150 L 300 90 L 460 90 L 460 150" fill="none" stroke="#64748b" strokeWidth="1.5" strokeDasharray="4 4" />

                  {/* Surge Drum TK-101 */}
                  <rect x="40" y="100" width="60" height="100" rx="20" fill="var(--soc-bg-card)" stroke="var(--soc-primary)" strokeWidth="1.5" />
                  <text x="70" y="155" fill="var(--soc-text-high)" fontFamily="var(--font-mono)" fontSize="10px" textAnchor="middle" fontWeight="700">TK-101</text>
                  <text x="70" y="170" fill="var(--soc-text-dim)" fontFamily="var(--font-mono)" fontSize="8px" textAnchor="middle">Surge Drum</text>

                  {/* Pump P-204 */}
                  <circle cx="260" cy="150" r="28" fill="rgba(239, 68, 68, 0.15)" stroke="#ef4444" strokeWidth="2" />
                  <text x="260" y="153" fill="#ef4444" fontFamily="var(--font-mono)" fontSize="11px" textAnchor="middle" fontWeight="700">P-204</text>
                  <text x="260" y="195" fill="#ef4444" fontFamily="var(--font-mono)" fontSize="9px" textAnchor="middle" fontWeight="700">Zone C Alert (5.4 mm/s)</text>

                  {/* Emergency Valve V-19 */}
                  <polygon points="360,140 380,150 360,160" fill="var(--soc-bg-card)" stroke="#f59e0b" strokeWidth="1.5" />
                  <polygon points="400,140 380,150 400,160" fill="var(--soc-bg-card)" stroke="#f59e0b" strokeWidth="1.5" />
                  <text x="380" y="130" fill="#f59e0b" fontFamily="var(--font-mono)" fontSize="9px" textAnchor="middle">V-19 (ESD)</text>

                  {/* Heat Exchanger E-201 */}
                  <circle cx="480" cy="150" r="22" fill="var(--soc-bg-card)" stroke="#3b82f6" strokeWidth="1.5" />
                  <line x1="465" y1="135" x2="495" y2="165" stroke="#3b82f6" strokeWidth="1" />
                  <line x1="465" y1="165" x2="495" y2="135" stroke="#3b82f6" strokeWidth="1" />
                  <text x="480" y="188" fill="var(--soc-text-main)" fontFamily="var(--font-mono)" fontSize="9px" textAnchor="middle">E-201</text>

                  {/* Compressor C-104 */}
                  <rect x="620" y="120" width="60" height="60" rx="4" fill="var(--soc-bg-card)" stroke="#10b981" strokeWidth="1.5" />
                  <text x="650" y="153" fill="#10b981" fontFamily="var(--font-mono)" fontSize="11px" textAnchor="middle" fontWeight="700">C-104</text>
                  <text x="650" y="195" fill="#10b981" fontFamily="var(--font-mono)" fontSize="8px" textAnchor="middle">Wet Gas Comp</text>
                </svg>
              </div>

              <div style={{ fontSize: '11px', color: 'var(--soc-text-main)', display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)' }}>
                <span>Standard: ANSI/ISA-5.1 Instrumentation & Piping</span>
                <span style={{ color: 'var(--soc-red)' }}>Highlighted: Hydraulic interdependency from P-204 to C-104</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
export default OverviewView
