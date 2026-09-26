import { useState, useEffect } from 'react'
import { 
  ShieldAlert, 
  ShieldCheck, 
  Cpu, 
  Radio, 
  AlertTriangle, 
  Lock, 
  PanelRightClose, 
  PanelRightOpen, 
  ChevronDown,
  Activity,
  Layers,
  Sparkles,
  Play,
  UserCheck,
  Search,
  Sun,
  Moon
} from 'lucide-react'
import { useVelikyStore } from '../../store/useVelikySOCStore'
import { SOVEREIGN_PERSONAS } from '../../lib/authPersonas'
import type { DefconLevel } from '../../lib/types'

export function GlobalTopBar() {
  const activeView = useVelikyStore((s) => s.activeView)
  const setActiveView = useVelikyStore((s) => s.setActiveView)
  const defconLevel = useVelikyStore((s) => s.defconLevel)
  const setDefconLevel = useVelikyStore((s) => s.setDefconLevel)
  const airGapState = useVelikyStore((s) => s.airGapState)
  const setAirGapState = useVelikyStore((s) => s.setAirGapState)
  const intelPanelOpen = useVelikyStore((s) => s.intelPanelOpen)
  const setIntelPanelOpen = useVelikyStore((s) => s.setIntelPanelOpen)
  const assets = useVelikyStore((s) => s.assets)
  const incidents = useVelikyStore((s) => s.incidents)
  const authUser = useVelikyStore((s) => s.authUser)
  const switchSovereignPersona = useVelikyStore((s) => s.switchSovereignPersona)
  const activeModel = useVelikyStore((s) => s.activeModel)
  const isAnalyzing = useVelikyStore((s) => s.isAnalyzing)
  const runAutonomousTask = useVelikyStore((s) => s.runAutonomousTask)
  const quarantineAsset = useVelikyStore((s) => s.quarantineAsset)
  const selectedAssetId = useVelikyStore((s) => s.selectedAssetId)
  const systemResources = useVelikyStore((s) => s.systemResources)
  const theme = useVelikyStore((s) => s.theme)
  const toggleTheme = useVelikyStore((s) => s.toggleTheme)

  const [currentTime, setCurrentTime] = useState<string>('')
  const [globalQuery, setGlobalQuery] = useState('')
  const [defconDropdownOpen, setDefconDropdownOpen] = useState(false)
  const [personaDropdownOpen, setPersonaDropdownOpen] = useState(false)
  const [confirmQuarantineOpen, setConfirmQuarantineOpen] = useState(false)

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (!globalQuery.trim() || isAnalyzing) return
    setActiveView('agent')
    runAutonomousTask(globalQuery.trim())
    setGlobalQuery('')
  }

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(now.toTimeString().split(' ')[0] + ' IST')
    }
    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  const activeIncidentsCount = incidents.filter(i => i.status !== 'RESOLVED').length
  const criticalIncidentsCount = incidents.filter(i => i.verdict === 'ATTENTION_REQUIRED' || i.verdict === 'CRITICAL_ALERT').length

  const defconColors: Record<DefconLevel, { text: string; bg: string; border: string }> = {
    'DEFCON 1 · SEVERE': { text: '#ef4444', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.35)' },
    'DEFCON 2 · ELEVATED': { text: '#f59e0b', bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.35)' },
    'DEFCON 3 · GUARDED': { text: '#3b82f6', bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.35)' },
    'DEFCON 4 · LOW': { text: '#10b981', bg: 'rgba(16, 185, 129, 0.12)', border: 'rgba(16, 185, 129, 0.35)' },
  }

  const currentDefconStyle = defconColors[defconLevel] || defconColors['DEFCON 2 · ELEVATED']

  const handleTriggerKillerDemo = () => {
    setActiveView('agent')
    runAutonomousTask(
      'Analyze centrifugal pump P-204 abnormal vibration and determine whether attention is required. Use maintenance history, inspection report, drawing, and applicable SOP. Calculate deviation using Python and produce evidence-backed report.'
    )
  }

  return (
    <header className="veliky-topbar">
      {/* LEFT: Branding, Hackathon Badge & Posture */}
      <div className="topbar-left">
        <button 
          type="button" 
          className="veliky-brand" 
          onClick={() => setActiveView('overview')}
          title="Return to Command Center"
        >
          <div className="brand-emblem">
            <ShieldAlert size={15} />
          </div>
          <div className="brand-title">
            <span className="brand-name">VELIKY</span>
            <span className="brand-sub">SOVEREIGN AI WORKBENCH</span>
          </div>
        </button>

        {/* Official SIH 2026 Problem Statement #26117 Badge */}
        <div className="topbar-sih-tag" title="Smart India Hackathon 2026 Problem Statement #26117: Sovereign On-Premise Industrial AI Workbench">
          <span className="sih-dot" />
          <span className="sih-text-full">SIH 2026 · PS #26117</span>
          <span className="sih-text-short">PS #26117</span>
        </div>

        {/* DEFCON Selector Pill */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => setDefconDropdownOpen(!defconDropdownOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '3px 8px',
              borderRadius: '4px',
              background: currentDefconStyle.bg,
              border: `1px solid ${currentDefconStyle.border}`,
              color: currentDefconStyle.text,
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: '0.04em',
              whiteSpace: 'nowrap'
            }}
          >
            <span className={`soc-dot pulse ${defconLevel.includes('DEFCON 1') ? 'red' : defconLevel.includes('DEFCON 2') ? 'amber' : 'emerald'}`} />
            <span>{defconLevel.split(' · ')[0]}</span>
            <span className="defcon-sub">· {defconLevel.split(' · ')[1]}</span>
            <ChevronDown size={11} style={{ opacity: 0.7 }} />
          </button>

          {defconDropdownOpen && (
            <div 
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '4px',
                background: 'var(--soc-bg-card)',
                border: '1px solid var(--soc-border-medium)',
                borderRadius: '6px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                zIndex: 100,
                minWidth: '170px',
                padding: '4px'
              }}
            >
              {(['DEFCON 1 · SEVERE', 'DEFCON 2 · ELEVATED', 'DEFCON 3 · GUARDED', 'DEFCON 4 · LOW'] as DefconLevel[]).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => {
                    setDefconLevel(lvl)
                    setDefconDropdownOpen(false)
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '6px 8px',
                    fontSize: '11px',
                    fontFamily: 'var(--font-mono)',
                    color: defconLevel === lvl ? 'var(--soc-text-high)' : 'var(--soc-text-muted)',
                    background: defconLevel === lvl ? 'rgba(255,255,255,0.06)' : 'transparent',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {lvl}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Air-Gap Guarantee Seal & Interactive Cut Button (Section 13 & 27) */}
        <button
          type="button"
          onClick={() => {
            const next = airGapState === 'ENFORCED' ? 'OFFLINE_VERIFIED' : 'ENFORCED'
            setAirGapState(next)
          }}
          className="airgap-toggle-btn"
          title="Click to simulate physical network disconnect (Section 13/27 Demo Moment: 0.00 KB/s outbound egress)"
        >
          <Lock size={11} />
          <span className="airgap-text-full">AIR-GAP: {airGapState}</span>
          <span className="airgap-text-short">AIR-GAP</span>
        </button>
      </div>

      {/* CENTER: Global Sovereign Query & Inquiry Bar */}
      <div className="topbar-center">
        <form onSubmit={handleGlobalSearch} className="topbar-query-container">
          <div className="topbar-query-input-wrap">
            <Search size={14} className="topbar-query-icon" />
            <input
              type="text"
              value={globalQuery}
              onChange={(e) => setGlobalQuery(e.target.value)}
              placeholder="Ask VELIKY or search P-204..."
              className="topbar-query-input"
            />
          </div>
          <button
            type="submit"
            disabled={!globalQuery.trim() || isAnalyzing}
            className="topbar-query-submit"
            title="Execute Sovereign Inquiry"
          >
            <Play size={10} fill="currentColor" />
            <span>Query</span>
          </button>
        </form>
      </div>

      {/* RIGHT: Active Incident Alert & Operator RBAC */}
      <div className="topbar-right">
        {/* Active Incidents */}
        <button
          type="button"
          onClick={() => setActiveView('incidents')}
          className={`soc-badge ${criticalIncidentsCount > 0 ? 'badge-critical' : 'badge-warning'}`}
          style={{ cursor: 'pointer', flexShrink: 0 }}
          title="Click to open Incident Response Console"
        >
          <AlertTriangle size={11} />
          <span className="incident-text-full">{activeIncidentsCount} INCIDENTS ({criticalIncidentsCount} CRITICAL)</span>
          <span className="incident-text-short">{activeIncidentsCount} INCIDENTS</span>
        </button>

        {/* Operator Profile Dropdown Switcher */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button 
            type="button"
            onClick={() => setPersonaDropdownOpen(!personaDropdownOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'var(--soc-bg-elevated)',
              padding: '3px 8px',
              borderRadius: '4px',
              border: '1px solid var(--soc-border-subtle)',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
            title="Switch Sovereign Operator Persona (RBAC)"
          >
            <UserCheck size={12} style={{ color: 'var(--soc-primary)' }} />
            <span style={{ color: 'var(--soc-text-high)', fontWeight: 600 }}>
              {authUser?.name ? (authUser.name.includes('Dr.') ? `Dr. ${authUser.name.split(' ').slice(-1)[0]}` : authUser.name.split(' ')[0]) : 'Dr. Sharma'}
            </span>
            <span style={{ color: 'var(--soc-text-dim)', fontSize: '9px', textTransform: 'uppercase' }}>
              [{authUser?.role || 'Admin'}]
            </span>
            <ChevronDown size={10} style={{ opacity: 0.6 }} />
          </button>

          {personaDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '4px',
                background: 'var(--soc-bg-card)',
                border: '1px solid var(--soc-border-medium)',
                borderRadius: '6px',
                boxShadow: 'var(--soc-shadow-lg)',
                zIndex: 100,
                minWidth: '240px',
                padding: '4px'
              }}
            >
              <div style={{ padding: '6px 8px', borderBottom: '1px solid var(--soc-border-subtle)', fontSize: '10px', color: 'var(--soc-text-dim)', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                Sovereign Personas (RBAC)
              </div>
              {SOVEREIGN_PERSONAS.map((persona) => (
                <button
                  key={persona.id}
                  type="button"
                  onClick={() => {
                    if (persona.id) switchSovereignPersona(persona.id)
                    setPersonaDropdownOpen(false)
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px',
                    fontSize: '11px',
                    fontFamily: 'var(--font-sans)',
                    color: authUser?.name === persona.name ? 'var(--soc-primary)' : 'var(--soc-text-main)',
                    background: authUser?.name === persona.name ? 'var(--soc-primary-subtle)' : 'transparent',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    border: 'none'
                  }}
                >
                  <span style={{ fontWeight: 600 }}>{persona.name}</span>
                  <span style={{ fontSize: '10px', color: 'var(--soc-text-muted)' }}>{persona.title}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme Switcher (Light / Dark Theme) */}
        <button
          type="button"
          onClick={toggleTheme}
          className="soc-btn soc-btn-ghost"
          style={{ padding: '4px', minWidth: '28px' }}
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Theme`}
        >
          {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
        </button>

        {/* Toggle Right Intelligence Panel */}
        <button
          type="button"
          onClick={() => setIntelPanelOpen(!intelPanelOpen)}
          className="soc-btn soc-btn-ghost"
          style={{ padding: '4px', minWidth: '28px' }}
          title={intelPanelOpen ? 'Collapse Intelligence Panel' : 'Expand Intelligence Panel'}
        >
          {intelPanelOpen ? <PanelRightClose size={15} /> : <PanelRightOpen size={15} />}
        </button>
      </div>

      {/* Emergency Quarantine Modal */}
      {confirmQuarantineOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.75)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div 
            style={{
              width: '420px',
              background: 'var(--soc-bg-card)',
              border: '1px solid var(--soc-red)',
              borderRadius: '8px',
              boxShadow: '0 0 30px var(--soc-red-glow)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--soc-red)' }}>
              <AlertTriangle size={20} />
              <h3 style={{ margin: 0, fontSize: '14px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>
                Confirm Hardware Interlock Isolation
              </h3>
            </div>
            
            <p style={{ margin: 0, color: 'var(--soc-text-main)', fontSize: '12px', lineHeight: 1.5 }}>
              Are you sure you want to trigger physical process quarantine on asset <b>{selectedAssetId || 'P-204'}</b>?
              This will actuate safety valve <b>V-19</b> and trip the SIL-3 emergency interlock.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button
                type="button"
                className="soc-btn soc-btn-ghost"
                onClick={() => setConfirmQuarantineOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="soc-btn soc-btn-danger"
                onClick={() => {
                  if (selectedAssetId) quarantineAsset(selectedAssetId)
                  setConfirmQuarantineOpen(false)
                }}
              >
                Execute Trip Interlock
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
