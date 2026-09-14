import { CircleUserRound, ChevronRight, Activity as ActivityIcon, History, Bot, Cpu, BrainCircuit } from 'lucide-react'
import { motion } from 'framer-motion'
import { useEdithStore } from '../../store/useEdithStore'

const AGENT_PERSONAS = [
  { id: 'general', label: 'General AI' },
  { id: 'code', label: 'Code Engineer' },
  { id: 'investigator', label: 'Investigator' },
  { id: 'sre', label: 'SRE Ops' },
  { id: 'researcher', label: 'Deep Research' },
]

const MODELS = [
  { id: 'Qwen/Qwen2.5-0.5B-Instruct', label: 'Qwen 0.5B' },
  { id: 'Qwen/Qwen2.5-1.5B-Instruct', label: 'Qwen 1.5B' },
  { id: 'Qwen/Qwen2.5-7B-Instruct', label: 'Qwen 7B' },
  { id: 'google/gemma-3-1b-it', label: 'Gemma 1B' },
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
  const ready = agentState === 'idle' || agentState === 'success'

  const activeAgent = useEdithStore((s) => s.activeAgent)
  const setActiveAgent = useEdithStore((s) => s.setActiveAgent)
  const activeModel = useEdithStore((s) => s.activeModel)
  const setActiveModel = useEdithStore((s) => s.setActiveModel)
  const thinkingMode = useEdithStore((s) => s.thinkingMode)
  const setThinkingMode = useEdithStore((s) => s.setThinkingMode)

  return (
    <header className="topbar upgraded" style={{ borderBottom: '1px solid var(--surface-border, rgba(255,255,255,0.08))', padding: '0 16px', height: '48px' }}>
      <button
        type="button"
        className="edith-logo"
        onClick={() => setActiveView('agent')}
        aria-label="Open SENTINEL agent"
        aria-current={activeView === 'agent' ? 'page' : undefined}
      >
        <span>SENTINEL</span>
        <i />
      </button>

      <div className="top-project" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span>{workspace?.name || 'Workspace'}</span>
        <ChevronRight size={12} />
        <b>{activeView === 'agent' ? 'DeepSeek Agent' : activeView.charAt(0).toUpperCase() + activeView.slice(1)}</b>
      </div>

      {/* DeepSeek CLI Parity Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto', marginRight: '16px' }}>
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

      <div className="top-actions">
        <motion.span className={`system-state ${ready ? 'ready' : 'busy'} state-${agentState}`} layout>
          <ActivityIcon size={12} />
          <i />
          {ready ? (agentState === 'success' ? 'VERIFIED' : 'SOVEREIGN') : agentState.replace('_', ' ').toUpperCase()}
        </motion.span>
        <button
          type="button"
          className={historyOpen ? 'history-trigger active' : 'history-trigger'}
          onClick={() => setHistoryOpen(!historyOpen)}
          aria-label="Open context history"
          aria-expanded={historyOpen}
        >
          <History size={15} />
          <span>History</span>
          {historyCount > 0 && <b>{historyCount}</b>}
        </button>
        <button className="profile-trigger" onClick={() => setProfileOpen(!profileOpen)} title="Profile">
          {user?.picture ? <img src={user.picture} alt="" /> : <CircleUserRound size={18} />}
          <span>{user?.name?.split(' ')[0] || 'Profile'}</span>
        </button>
      </div>
    </header>
  )
}
