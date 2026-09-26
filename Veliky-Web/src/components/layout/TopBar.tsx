import { ChevronRight, Activity as ActivityIcon, History, Bot, Cpu, BrainCircuit, Search, ShieldAlert, Users } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEdithStore } from '../../store/useEdithStore'
import { SOVEREIGN_PERSONAS, getClearanceColor, getRoleBadgeStyle } from '../../lib/authPersonas'

const AGENT_PERSONAS = [
  { id: 'general', label: 'General Sovereign AI' },
  { id: 'code', label: 'Code Engineer' },
  { id: 'investigator', label: 'Lead Investigator' },
  { id: 'sre', label: 'Plant SRE Ops' },
  { id: 'researcher', label: 'Vault Researcher' },
]

const MODELS = [
  { id: 'Qwen/Qwen2.5-7B-Instruct', label: 'Qwen 2.5 7B (On-Prem)' },
  { id: 'Qwen/Qwen2.5-0.5B-Instruct', label: 'Qwen 0.5B (Edge)' },
  { id: 'Qwen/Qwen2.5-1.5B-Instruct', label: 'Qwen 1.5B (Fast)' },
  { id: 'google/gemma-3-1b-it', label: 'Gemma 1B (Local)' },
]

export function TopBar() {
  const workspace = useEdithStore((s) => s.currentWorkspace)
  const agentState = useEdithStore((s) => s.agentState)
  const activeView = useEdithStore((s) => s.activeView)
  const setActiveView = useEdithStore((s) => s.setActiveView)
  const setProfileOpen = useEdithStore((s) => s.setProfileOpen)
  const profileOpen = useEdithStore((s) => s.profileOpen)
  const historyOpen = useEdithStore((s) => s.historyOpen)
  const setHistoryOpen = useEdithStore((s) => s.setHistoryOpen)
  const historyCount = useEdithStore((s) => s.commandHistory.length)
  const user = useEdithStore((s) => s.authUser)
  const switchSovereignPersona = useEdithStore((s) => s.switchSovereignPersona)
  const setQuickSwitcherOpen = useEdithStore((s) => s.setQuickSwitcherOpen)
  const ready = agentState === 'idle' || agentState === 'success'

  const activeAgent = useEdithStore((s) => s.activeAgent)
  const setActiveAgent = useEdithStore((s) => s.setActiveAgent)
  const activeModel = useEdithStore((s) => s.activeModel)
  const setActiveModel = useEdithStore((s) => s.setActiveModel)
  const thinkingMode = useEdithStore((s) => s.thinkingMode)
  const setThinkingMode = useEdithStore((s) => s.setThinkingMode)

  const clearanceColor = getClearanceColor(user?.clearance)
  const roleStyle = user ? getRoleBadgeStyle(user.role) : { bg: 'rgba(255,255,255,0.1)', color: '#fff', border: 'transparent' }

  return (
    <header className="topbar upgraded" style={{ borderBottom: '1px solid var(--surface-border, rgba(255,255,255,0.08))', padding: '0 16px', height: '48px', display: 'flex', alignItems: 'center' }}>
      <button
        type="button"
        className="edith-logo"
        onClick={() => setActiveView('workspace')}
        aria-label="Open VELIKY workspace"
        aria-current={activeView === 'workspace' ? 'page' : undefined}
      >
        <span>VELIKY</span>
        <i />
      </button>

      <div className="top-project" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span>{workspace?.name || 'Knowledge Vault'}</span>
        <ChevronRight size={12} />
        <b>{activeView === 'agent' ? 'Sovereign Agent' : activeView.charAt(0).toUpperCase() + activeView.slice(1)}</b>
      </div>

      {/* Quick Switcher Trigger (Obsidian Ctrl+O) */}
      <button
        type="button"
        onClick={() => setQuickSwitcherOpen(true)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '6px',
          padding: '4px 10px',
          fontSize: '11px',
          color: 'var(--text-secondary, #94a3b8)',
          marginLeft: '12px',
          cursor: 'pointer'
        }}
        title="Quick Switcher (Ctrl+O)"
      >
        <Search size={12} />
        <span>Find note…</span>
        <kbd style={{ fontSize: '9px', padding: '1px 4px', borderRadius: '3px', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' }}>Ctrl+O</kbd>
      </button>

      {/* Model & Agent Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto', marginRight: '14px' }}>
        {/* Agent Persona Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Bot size={13} className="text-cyan-400" />
          <select
            value={activeAgent}
            onChange={(e) => setActiveAgent(e.target.value)}
            style={{ background: 'transparent', color: 'var(--text-primary)', border: 'none', fontSize: '11px', fontWeight: 500, outline: 'none', cursor: 'pointer' }}
          >
            {AGENT_PERSONAS.map((a) => (
              <option key={a.id} value={a.id} style={{ background: '#18181b', color: '#fff' }}>
                {a.label}
              </option>
            ))}
          </select>
        </div>

        {/* Model Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.04)', padding: '3px 8px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Cpu size={13} className="text-indigo-400" />
          <select
            value={activeModel}
            onChange={(e) => setActiveModel(e.target.value)}
            style={{ background: 'transparent', color: 'var(--text-primary)', border: 'none', fontSize: '11px', fontWeight: 500, outline: 'none', cursor: 'pointer' }}
          >
            {MODELS.map((m) => (
              <option key={m.id} value={m.id} style={{ background: '#18181b', color: '#fff' }}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {/* Thinking Toggle */}
        <button
          type="button"
          onClick={() => setThinkingMode(!thinkingMode)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            background: thinkingMode ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255,255,255,0.04)',
            color: thinkingMode ? '#818cf8' : 'var(--text-secondary)',
            border: `1px solid ${thinkingMode ? 'rgba(99, 102, 241, 0.4)' : 'rgba(255,255,255,0.08)'}`,
            padding: '3px 9px',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          title="Toggle Chain-of-Thought Reasoning Display"
        >
          <BrainCircuit size={13} />
          <span>CoT {thinkingMode ? 'ON' : 'OFF'}</span>
        </button>
      </div>

      {/* Sovereign User & RBAC Pills */}
      <div className="top-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {/* Air-gap Indicator */}
        <motion.span className={`system-state ${ready ? 'ready' : 'busy'} state-${agentState}`} layout>
          <ActivityIcon size={12} />
          <i />
          {ready ? (agentState === 'success' ? 'VERIFIED' : 'AIR-GAPPED') : agentState.replace('_', ' ').toUpperCase()}
        </motion.span>

        {/* Quick Persona Switcher in TopBar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(255,255,255,0.03)', padding: '2px 6px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Users size={12} className="text-amber-400" />
          <select
            value={user?.id || ''}
            onChange={(e) => switchSovereignPersona(e.target.value)}
            style={{
              background: 'transparent',
              color: '#fff',
              border: 'none',
              fontSize: '11px',
              fontWeight: 600,
              outline: 'none',
              cursor: 'pointer'
            }}
            title="Switch Active Sovereign Persona"
          >
            {SOVEREIGN_PERSONAS.map((p) => (
              <option key={p.id} value={p.id} style={{ background: '#18181b', color: '#fff' }}>
                {p.name} ({p.role.toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        {/* Clearance Level Pill */}
        {user && (
          <span
            style={{
              fontSize: '10px',
              fontWeight: 700,
              letterSpacing: '0.04em',
              padding: '3px 8px',
              borderRadius: '6px',
              background: `${clearanceColor}18`,
              color: clearanceColor,
              border: `1px solid ${clearanceColor}40`,
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
            title={`Clearance Level ${user.clearanceLevel}: ${user.clearance}`}
          >
            <ShieldAlert size={11} />
            {user.clearance}
          </span>
        )}

        {/* History button */}
        <button
          type="button"
          className={historyOpen ? 'history-trigger active' : 'history-trigger'}
          onClick={() => setHistoryOpen(!historyOpen)}
          aria-label="Open context history"
          aria-expanded={historyOpen}
        >
          <History size={14} />
          {historyCount > 0 && <b>{historyCount}</b>}
        </button>

        {/* Profile Trigger */}
        <button 
          className="profile-trigger" 
          onClick={() => setProfileOpen(!profileOpen)} 
          title="Sovereign Profile & Permissions"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.08)',
            padding: '3px 8px',
            borderRadius: '6px'
          }}
        >
          <span 
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '4px',
              background: `${user?.avatarColor || '#3b82f6'}30`,
              color: user?.avatarColor || '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '10px',
              fontWeight: 700
            }}
          >
            {user?.name?.slice(0, 2).toUpperCase() || 'OP'}
          </span>
          <span style={{ fontSize: '11px', fontWeight: 600 }}>{user?.employeeId || 'EMP-001'}</span>
        </button>
      </div>
    </header>
  )
}
