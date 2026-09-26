import { useState } from 'react'
import { 
  Scan, 
  Cpu, 
  Sparkles, 
  CheckCircle2, 
  Calculator, 
  FileText, 
  Lock, 
  Terminal, 
  ArrowRight, 
  Radio, 
  Play, 
  RotateCcw,
  Zap,
  Activity,
  Bot
} from 'lucide-react'
import { useVelikyStore } from '../../store/useVelikySOCStore'
import type { ReasoningLedgerStep, ModelCapability } from '../../lib/types'

const SAMPLE_COMMANDS = [
  'Analyze Pump P-204 vibration condition and determine ISO 10816-3 compliance.',
  'Calculate percentage deviation from baseline on NDE 6312 bearing.',
  'Evaluate downstream liquid carryover risk to Wet Gas Compressor C-104.',
  'Verify documentation contradictions across Inspection Report #62 and Maintenance Report #184.'
]

export function DetectionView() {
  const modelRegistry = useVelikyStore((s) => s.modelRegistry)
  const reasoningLedger = useVelikyStore((s) => s.reasoningLedger)
  const isAnalyzing = useVelikyStore((s) => s.isAnalyzing)
  const runAutonomousTask = useVelikyStore((s) => s.runAutonomousTask)
  const activeModel = useVelikyStore((s) => s.activeModel)
  const setActiveModel = useVelikyStore((s) => s.setActiveModel)
  const activeAgentPersona = useVelikyStore((s) => s.activeAgentPersona)
  const setActiveAgentPersona = useVelikyStore((s) => s.setActiveAgentPersona)

  const [promptInput, setPromptInput] = useState('Analyze Pump P-204 vibration condition and calculate percentage deviation from baseline.')

  const handleRun = () => {
    if (!promptInput.trim() || isAnalyzing) return
    runAutonomousTask(promptInput)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', padding: '16px 20px', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Scan size={18} style={{ color: 'var(--soc-primary)' }} />
            <h2 style={{ margin: 0, fontSize: '16px', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--soc-text-high)' }}>
              AUTONOMOUS AGENT ORCHESTRATION & MULTI-MODEL ROUTER
            </h2>
          </div>
          <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--soc-text-muted)' }}>
            Dynamic Open-Weight Model Selection · 8-Stage Evidence-Backed Reasoning Cycle
          </p>
        </div>

        <div className="soc-badge badge-sovereign">
          <Lock size={11} />
          <span>ON-PREMISE INFERENCE RIG · 0 EXTERNAL CALLS</span>
        </div>
      </div>

      {/* Multi-Model Router Capability Grid */}
      <div className="soc-plate">
        <div className="soc-plate-header">
          <span className="soc-plate-title">
            <Cpu size={12} /> Model Capability Registry & Resource Allocation
          </span>
          <span className="soc-eyebrow">HARDWARE-AWARE DYNAMIC ROUTING</span>
        </div>
        <div className="overview-kpi-grid" style={{ padding: '12px' }}>
          {modelRegistry.map((model) => {
            const isSelected = activeModel === model.name
            return (
              <div
                key={model.id}
                onClick={() => setActiveModel(model.name)}
                style={{
                  background: isSelected ? 'var(--soc-primary-subtle)' : 'var(--soc-bg-elevated)',
                  border: `1px solid ${isSelected ? 'var(--soc-primary)' : 'var(--soc-border-subtle)'}`,
                  borderRadius: '5px',
                  padding: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.12s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span className="soc-badge badge-dim" style={{ fontSize: '8px', padding: '1px 4px' }}>
                    {model.role}
                  </span>
                  <span className="soc-badge badge-normal" style={{ fontSize: '8px', padding: '1px 4px' }}>
                    {model.status}
                  </span>
                </div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--soc-text-high)', marginBottom: '2px' }}>
                  {model.name.split('/')[1] || model.name}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--soc-text-dim)', marginBottom: '6px' }}>
                  {model.activeContext}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--soc-text-muted)' }}>
                  <span>VRAM: {model.vramUsageGb} / {model.maxVramGb} GB</span>
                  <span style={{ color: 'var(--soc-primary)' }}>{model.accuracyScore}% Acc</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Autonomous Dispatch Command Deck */}
      <div className="soc-plate">
        <div className="soc-plate-header">
          <span className="soc-plate-title">
            <Terminal size={12} /> Autonomous Mission Dispatcher
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '10px', color: 'var(--soc-text-dim)', fontFamily: 'var(--font-mono)' }}>Persona:</span>
            <select
              value={activeAgentPersona}
              onChange={(e) => setActiveAgentPersona(e.target.value)}
              className="soc-input"
              style={{ fontSize: '10px', padding: '2px 6px', background: 'transparent' }}
            >
              <option value="investigator">Industrial Reliability Investigator</option>
              <option value="code">Code & Sandbox Engineer</option>
              <option value="sre">SRE Incident Operator</option>
              <option value="general">General Sovereign AI</option>
            </select>
          </div>
        </div>

        <div className="soc-plate-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={promptInput}
              onChange={(e) => setPromptInput(e.target.value)}
              placeholder="Enter industrial inquiry or verification task..."
              className="soc-input"
              style={{ flex: 1, padding: '8px 12px', fontSize: '12px' }}
              onKeyDown={(e) => e.key === 'Enter' && handleRun()}
            />
            <button
              type="button"
              className="soc-btn soc-btn-primary"
              onClick={handleRun}
              disabled={isAnalyzing}
              style={{ padding: '0 16px', gap: '6px' }}
            >
              {isAnalyzing ? (
                <>
                  <span className="soc-dot pulse cyan" />
                  <span>Executing Cycle...</span>
                </>
              ) : (
                <>
                  <Play size={12} />
                  <span>Dispatch Agent</span>
                </>
              )}
            </button>
          </div>

          {/* Preset Sample Prompts */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            <span className="soc-eyebrow">PRESETS:</span>
            {SAMPLE_COMMANDS.map((cmd, i) => (
              <button
                key={i}
                type="button"
                className="soc-badge badge-dim"
                onClick={() => setPromptInput(cmd)}
                style={{ cursor: 'pointer', fontSize: '9px' }}
              >
                {cmd.slice(0, 45)}...
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* The Core Reasoning Ledger (SEE → UNDERSTAND → PLAN → REASON → ACT → VERIFY → EXPLAIN → AUDIT) */}
      <div className="soc-plate" style={{ flex: 1 }}>
        <div className="soc-plate-header">
          <span className="soc-plate-title" style={{ color: 'var(--soc-primary)' }}>
            <Activity size={12} /> Sovereign Reasoning Ledger Trace (8-Stage Execution Cycle)
          </span>
          <span className="soc-badge badge-normal">
            {reasoningLedger.filter(s => s.status === 'completed').length} / 8 STAGES COMPLETE
          </span>
        </div>

        <div className="soc-plate-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {reasoningLedger.map((step, idx) => {
            const isDone = step.status === 'completed'
            const isActive = step.status === 'active'

            return (
              <div
                key={step.stage}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  padding: '10px 12px',
                  borderRadius: '5px',
                  background: isActive 
                    ? 'var(--soc-primary-subtle)' 
                    : isDone 
                    ? 'var(--soc-bg-elevated)' 
                    : 'transparent',
                  border: `1px solid ${isActive ? 'var(--soc-primary)' : 'var(--soc-border-subtle)'}`
                }}
              >
                {/* Stage Badge & Step number */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', width: '90px', flexShrink: 0 }}>
                  <span 
                    className={`soc-badge ${isDone ? 'badge-normal' : isActive ? 'badge-sovereign' : 'badge-dim'}`}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    {isDone ? <CheckCircle2 size={10} /> : isActive ? <span className="soc-dot pulse cyan" /> : idx + 1}
                    <span>{step.stage}</span>
                  </span>
                  <span style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--soc-text-dim)' }}>
                    {step.durationMs}ms
                  </span>
                </div>

                {/* Step Content */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--soc-text-high)' }}>
                      {step.label}
                    </span>
                    {step.evidenceTag && (
                      <span className="soc-badge badge-dim" style={{ fontSize: '9px', padding: '1px 5px' }}>
                        {step.evidenceTag}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--soc-text-main)', lineHeight: 1.45 }}>
                    {step.detail}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
