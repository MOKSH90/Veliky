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
      {/* LEFT: Clean Brand & Status */}
      <div className="topbar-left" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button 
          type="button" 
          className="veliky-brand" 
          onClick={() => setActiveView('agent')}
          title="Return to Query Console"
          style={{ cursor: 'pointer', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', padding: 0 }}
        >
          <div className="brand-emblem" style={{ background: '#6366f1', color: '#fff', padding: '5px', borderRadius: '6px', display: 'flex' }}>
            <Cpu size={16} />
          </div>
          <div className="brand-title" style={{ textAlign: 'left' }}>
            <span className="brand-name" style={{ fontWeight: 700, fontSize: '13px', color: '#f8fafc', letterSpacing: '0.04em' }}>VELIKY</span>
            <span className="brand-sub" style={{ display: 'block', fontSize: '9px', color: '#94a3b8', letterSpacing: '0.02em' }}>LOCAL AI ENGINE</span>
          </div>
        </button>

        <span style={{ height: '16px', width: '1px', background: 'rgba(255,255,255,0.1)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '12px', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
          <span style={{ fontWeight: 600 }}>Local Server Online</span>
        </div>
      </div>

      {/* CENTER: Clean global search bar */}
      <div className="topbar-center" style={{ flex: 1, maxWidth: '480px', margin: '0 24px' }}>
        <form onSubmit={handleGlobalSearch} className="topbar-query-container" style={{ width: '100%' }}>
          <div className="topbar-query-input-wrap">
            <Search size={14} className="topbar-query-icon" />
            <input
              type="text"
              value={globalQuery}
              onChange={(e) => setGlobalQuery(e.target.value)}
              placeholder="Ask a question or search notes..."
              className="topbar-query-input"
            />
          </div>
        </form>
      </div>

      {/* RIGHT: Model indicator, theme toggle */}
      <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.04)', padding: '4px 10px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)', fontSize: '11px' }}>
          <Cpu size={12} style={{ color: '#818cf8' }} />
          <span style={{ color: '#cbd5e1', fontWeight: 500 }}>Qwen 2.5 1.5B</span>
        </div>

        {/* Theme Switcher */}
        <button
          type="button"
          onClick={toggleTheme}
          className="soc-btn soc-btn-ghost"
          style={{ padding: '5px', borderRadius: '6px', cursor: 'pointer', background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', color: '#94a3b8' }}
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Theme`}
        >
          {theme === 'light' ? <Moon size={13} /> : <Sun size={13} />}
        </button>
      </div>
    </header>
  )
}
