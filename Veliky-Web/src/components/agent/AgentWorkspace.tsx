import { useRef, useEffect } from 'react'
import { RotateCcw, ArrowRight, Bot, Sparkles, User, BrainCircuit, Loader2, Shield } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { CommandInput } from './CommandInput'
import { MarkdownOutputCanvas } from './MarkdownOutputCanvas'
import { useVelikyStore } from '../../store/useVelikySOCStore'

interface QuickScenario {
  id: string
  tag: string
  tagColor: string
  category: 'inquiry' | 'industrial' | 'safety' | 'code'
  title: string
  prompt: string
  targetAsset: string
  scope: string
}

interface QuickQueryPill {
  id: string
  label: string
  prompt: string
  color: string
}

const QUICK_QUERY_PILLS: QuickQueryPill[] = [
  {
    id: 'hello',
    label: '👋 Hello Veliky',
    prompt: 'Hello Veliky, provide an operational briefing, active persona directives, and available refinery diagnostics.',
    color: '#3b82f6',
  },
  {
    id: 'status',
    label: '⚡ Cluster Health & Diagnostics',
    prompt: 'Run a complete system diagnostic check on cluster nodes, memory usage, air-gap status, and connected telemetry streams.',
    color: '#10b981',
  },
  {
    id: 'iso',
    label: '📊 ISO 10816-3 Thresholds',
    prompt: 'Explain ISO 10816-3 Category 2 vibration severity zones, RMS velocity limits, and alert thresholds.',
    color: '#8b5cf6',
  },
  {
    id: 'rbac',
    label: '🛡️ RBAC & Airgap Security',
    prompt: 'What is my current RBAC clearance level, and how does Veliky enforce air-gapped cryptographic integrity?',
    color: '#06b6d4',
  },
  {
    id: 'pump',
    label: '🔍 Slurry Pump P-204 (+92%)',
    prompt: 'Analyze centrifugal pump P-204 vibration condition and determine whether attention is required. Use maintenance history, inspection report, and SOP. Calculate deviation using Python and produce evidence-backed report.',
    color: '#ef4444',
  },
  {
    id: 'cascade',
    label: '🔀 Downstream C-104 Risk',
    prompt: 'Explain downstream cascade impact of P-204 vibration exceedance on Wet Gas Compressor C-104 and Surge Drum TK-101. Provide mitigation runbook.',
    color: '#f59e0b',
  },
  {
    id: 'loto',
    label: '🛑 Emergency LOTO SOP',
    prompt: 'Provide step-by-step Standard Operating Procedure for emergency isolation and Lockout/Tagout (LOTO) of Pump P-204.',
    color: '#ec4899',
  },
  {
    id: 'fft',
    label: '🐍 Python FFT Vibration Script',
    prompt: 'Generate a production Python script to compute FFT spectral vibration analysis on time-series accelerometer data from Pump P-204.',
    color: '#14b8a6',
  },
  {
    id: 'audit',
    label: '🔐 Audit CAS SHA-256 Ledger',
    prompt: 'Perform cryptographic audit of the local CAS SHA-256 ledger records and verify tamper-evident chain of custody for recent incident actions.',
    color: '#6366f1',
  },
]

const INDUSTRIAL_SCENARIOS: QuickScenario[] = [
  {
    id: 'sec26',
    tag: 'SIH Killer Demo (Sec. 26)',
    tagColor: '#10b981',
    category: 'industrial',
    title: 'Slurry Pump P-204 Vibration Exceedance (+92.86%)',
    prompt: 'Analyze centrifugal pump P-204 vibration condition and determine whether attention is required. Use maintenance history, inspection report, and SOP. Calculate deviation using Python and produce evidence-backed report.',
    targetAsset: 'P-204',
    scope: 'ISO 10816-3 Category 2 · Inspection #62 · MR #184'
  },
  {
    id: 'pid',
    tag: 'P&ID Schematic Interlock',
    tagColor: '#06b6d4',
    category: 'industrial',
    title: 'Unit 2 P&ID Drawing & Valve V-19 Interlock Check',
    prompt: 'Analyze Unit 2 P&ID engineering schematic. Identify isolation valve V-19 and verify mechanical seal Plan 53A interlock status for pump P-204.',
    targetAsset: 'P-204 / V-19',
    scope: 'P&ID Unit 2 Schematic · Seal Plan 53A Spec'
  },
  {
    id: 'cascade',
    tag: 'MITRE ICS T0888 Analysis',
    tagColor: '#f59e0b',
    category: 'industrial',
    title: 'Downstream Surge Risk on Wet Gas Compressor C-104',
    prompt: 'Explain downstream cascade impact of P-204 vibration exceedance on Wet Gas Compressor C-104 and Surge Drum TK-101. Provide mitigation runbook.',
    targetAsset: 'C-104',
    scope: 'Process Flow Topology · Downstream Pressure Hazards'
  },
  {
    id: 'contradiction',
    tag: 'Forensic Evidence Audit',
    tagColor: '#ef4444',
    category: 'industrial',
    title: 'Cross-Document Contradiction: Report #62 vs MR #184',
    prompt: 'Cross-reference Inspection Report #62 with Maintenance Report #184. Identify contradictions regarding bearing replacement and verify Mobil Polyrex EM grease replenishment timestamp.',
    targetAsset: 'P-204 (NDE 6312)',
    scope: 'Inspection-Report-62 · Maintenance-Report-184'
  },
  {
    id: 'loto_scen',
    tag: 'Safety Runbook Protocol',
    tagColor: '#ec4899',
    category: 'safety',
    title: 'Emergency Isolation & LOTO Procedure for P-204',
    prompt: 'Provide step-by-step Standard Operating Procedure for emergency isolation and Lockout/Tagout (LOTO) of Slurry Pump P-204 per plant safety standard.',
    targetAsset: 'P-204 (LOTO)',
    scope: 'SOP-Emergency-Isolation Rev 3.4 · Substation 4-B'
  },
  {
    id: 'fft_scen',
    tag: 'Deterministic DSP Pipeline',
    tagColor: '#14b8a6',
    category: 'code',
    title: 'Automated Python FFT Vibration Spectral Analyzer',
    prompt: 'Generate a production Python script to compute FFT spectral vibration analysis on time-series accelerometer data from Pump P-204.',
    targetAsset: 'P-204 (DSP)',
    scope: 'NumPy / SciPy · 1X/2X Harmonics · ISO Category 2'
  },
  {
    id: 'cluster_scen',
    tag: 'Air-Gapped Sovereign Health',
    tagColor: '#3b82f6',
    category: 'inquiry',
    title: 'Cluster Health, Nodes & Telemetry Stream Diagnostics',
    prompt: 'Run a complete system diagnostic check on cluster nodes, memory usage, air-gap status, and connected telemetry streams.',
    targetAsset: 'Cluster Node',
    scope: 'Gateway 8766 · Model 8000 · Web 3000 · CAS Ledger'
  },
  {
    id: 'cas_scen',
    tag: 'Zero-Trust Cryptographic Audit',
    tagColor: '#6366f1',
    category: 'safety',
    title: 'CAS SHA-256 Tamper-Evident Ledger Integrity Audit',
    prompt: 'Perform cryptographic audit of the local CAS SHA-256 ledger records and verify tamper-evident chain of custody for recent incident actions.',
    targetAsset: 'CAS Ledger',
    scope: 'SHA-256 Merkle Verification · ECDSA Operator Seals'
  }
]

export function AgentWorkspace() {
  const state = useVelikyStore((s) => s.agentState)
  const clearChat = useVelikyStore((s) => s.clearChatMessages)
  const submit = useVelikyStore((s) => s.submitGoal)
  const activeAgent = useVelikyStore((s) => s.activeAgent)
  const activeModel = useVelikyStore((s) => s.activeModel)
  const chatMessages = useVelikyStore((s) => s.chatMessages)
  const isAnalyzing = useVelikyStore((s) => s.isAnalyzing)
  const reasoningLedger = useVelikyStore((s) => s.reasoningLedger)
  const authUser = useVelikyStore((s) => s.authUser)
  const activeStep = reasoningLedger.find((s) => s.status === 'active')

  const chatScrollContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (chatMessages.length > 0 && chatScrollContainerRef.current) {
      chatScrollContainerRef.current.scrollTo({
        top: chatScrollContainerRef.current.scrollHeight,
        behavior: 'smooth'
      })
    } else if (chatScrollContainerRef.current) {
      chatScrollContainerRef.current.scrollTop = 0
    }
  }, [chatMessages.length, isAnalyzing])

  const idle = chatMessages.length === 0

  return (
    <div
      className="agent-view-clean"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        background: 'var(--soc-bg-base)',
        color: '#e2e8f0',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Top Chat Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 28px',
          background: 'var(--soc-bg-surface)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--soc-border-subtle)',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ padding: '6px', borderRadius: '6px', background: 'var(--soc-primary-subtle)', color: 'var(--soc-primary)' }}>
            <Bot size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 700, fontFamily: 'var(--font-mono)', letterSpacing: '0.04em', color: 'var(--soc-text-high)' }}>
                SOVEREIGN INQUIRY & AGENT CONSOLE
              </h2>
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: 'var(--soc-emerald)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                }}
              >
                SIH PS #26117
              </span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--soc-text-muted)' }}>
              Engine: <strong style={{ color: 'var(--soc-text-high)' }}>{activeModel.split('/')[1] || activeModel}</strong> | Clearance: <strong style={{ color: 'var(--soc-primary)' }}>{authUser?.clearance || 'CONFIDENTIAL'}</strong> | Egress: <strong style={{ color: 'var(--soc-emerald)' }}>0.00 KB/s (Air-Gapped)</strong>
            </span>
          </div>
        </div>

        {!idle && (
          <button
            type="button"
            onClick={clearChat}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '5px 12px',
              borderRadius: '5px',
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 600,
              background: 'var(--soc-bg-elevated)',
              color: 'var(--soc-text-medium)',
              border: '1px solid var(--soc-border-subtle)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <RotateCcw size={13} />
            <span>New Inquiry</span>
          </button>
        )}
      </div>

      {/* Main Conversation Canvas */}
      <div
        ref={chatScrollContainerRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '24px 28px 40px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          maxWidth: '1040px',
          width: '100%',
          margin: '0 auto',
        }}
      >
        <AnimatePresence mode="wait">
          {idle ? (
            <motion.div
              key="idle-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-start',
                textAlign: 'center',
                gap: '20px',
                paddingTop: '8px',
                paddingBottom: '24px',
                width: '100%',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <div
                  style={{
                    padding: '12px',
                    borderRadius: '12px',
                    background: 'var(--soc-primary-subtle)',
                    border: '1px solid var(--soc-primary)',
                    boxShadow: '0 0 24px var(--soc-primary-glow)',
                  }}
                >
                  <Sparkles size={28} style={{ color: 'var(--soc-primary)' }} />
                </div>
                <h1 style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--soc-text-high)', margin: '4px 0 0 0', letterSpacing: '0.02em' }}>
                  Sovereign Industrial Investigation Engine
                </h1>
                <p style={{ fontSize: '13px', color: 'var(--soc-text-muted)', maxWidth: '660px', margin: 0, lineHeight: 1.6 }}>
                  Autonomous multimodal reasoning over P&ID engineering schematics, inspection PDFs, maintenance spreadsheets, and ISO 10816-3 standards with 0-cloud egress.
                </p>
              </div>

              {/* Investigation Scope Badges */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                <span className="soc-badge badge-dim" style={{ fontSize: '10px' }}>
                  Target: <strong>Centrifugal Slurry Pump P-204</strong>
                </span>
                <span className="soc-badge badge-dim" style={{ fontSize: '10px' }}>
                  Standard: <strong>ISO 10816-3 Category 2</strong>
                </span>
                <span className="soc-badge badge-sovereign" style={{ fontSize: '10px' }}>
                  Execution: <strong>Deterministic Python Sandbox (SymPy)</strong>
                </span>
                <span className="soc-badge badge-normal" style={{ fontSize: '10px' }}>
                  Clearance: <strong>{authUser?.role?.toUpperCase() || 'OPERATOR'}</strong>
                </span>
              </div>

              {/* Quick Query Pills / Dummy Queries */}
              <div style={{ width: '100%', maxWidth: '920px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 2px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--soc-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    ⚡ Instant Quick Inquiries & Dummy Queries
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--soc-text-dim)' }}>1-Click instant test</span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', justifyContent: 'center' }}>
                  {QUICK_QUERY_PILLS.map((pill) => (
                    <button
                      key={pill.id}
                      type="button"
                      onClick={() => submit(pill.prompt)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        fontFamily: 'var(--font-mono)',
                        fontWeight: 600,
                        background: 'var(--soc-bg-surface)',
                        color: 'var(--soc-text-high)',
                        border: `1px solid ${pill.color}40`,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = pill.color
                        e.currentTarget.style.boxShadow = `0 0 12px ${pill.color}30`
                        e.currentTarget.style.transform = 'translateY(-1px)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = `${pill.color}40`
                        e.currentTarget.style.boxShadow = 'none'
                        e.currentTarget.style.transform = 'none'
                      }}
                    >
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: pill.color }} />
                      <span>{pill.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* The Command Input Bar */}
              <div style={{ width: '100%', maxWidth: '920px' }}>
                <CommandInput />
              </div>

              {/* 4 Dedicated SIH #26117 Scenario Inquiry Cards */}
              <div style={{ width: '100%', maxWidth: '920px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--soc-text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    1-Click Verified Demonstration Scenarios (SIH #26117)
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--soc-text-dim)' }}>Click to dispatch autonomous investigation</span>
                </div>

                <div className="inquiry-scenario-grid">
                  {INDUSTRIAL_SCENARIOS.map((scenario) => (
                    <div
                      key={scenario.id}
                      className="inquiry-scenario-card"
                      onClick={() => submit(scenario.prompt)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span 
                          className="inquiry-card-tag" 
                          style={{ color: scenario.tagColor }}
                        >
                          ● {scenario.tag}
                        </span>
                        <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--soc-text-dim)' }}>
                          [{scenario.targetAsset}]
                        </span>
                      </div>
                      <h4 className="inquiry-card-title">{scenario.title}</h4>
                      <p className="inquiry-card-desc">{scenario.prompt.slice(0, 110)}...</p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', borderTop: '1px solid var(--soc-border-subtle)', paddingTop: '6px' }}>
                        <span style={{ fontSize: '10px', color: 'var(--soc-text-dim)', fontFamily: 'var(--font-mono)' }}>
                          {scenario.scope}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--soc-primary)', display: 'flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                          <span>Run</span>
                          <ArrowRight size={11} />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="chat-messages"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}
            >
              {chatMessages.map((msg) => {
                const isUser = msg.role === 'user'

                if (isUser) {
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        alignSelf: 'flex-end',
                        maxWidth: '85%',
                        background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.85), rgba(37, 99, 235, 0.75))',
                        border: '1px solid rgba(59, 130, 246, 0.45)',
                        borderRadius: '16px 16px 4px 16px',
                        padding: '16px 20px',
                        boxShadow: 'var(--soc-shadow-md)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '6px',
                          gap: '12px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <User size={13} style={{ color: '#93c5fd' }} />
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: '#bfdbfe',
                              textTransform: 'uppercase',
                              letterSpacing: '0.05em',
                            }}
                          >
                            {authUser?.name || 'Operator'} ({authUser?.role.toUpperCase()})
                          </span>
                        </div>
                        {msg.timestamp && (
                          <time style={{ fontSize: '11px', color: '#93c5fd' }}>{msg.timestamp}</time>
                        )}
                      </div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: '14px',
                          lineHeight: '1.6',
                          color: '#ffffff',
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {msg.content}
                      </p>
                    </motion.div>
                  )
                }

                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ width: '100%' }}
                  >
                    <MarkdownOutputCanvas
                      label={`VELIKY AI (${activeAgent.toUpperCase()})`}
                      detail={msg.content}
                      time={msg.timestamp}
                      reasoning={msg.reasoning}
                      verification={msg.verificationStatus}
                      createdFiles={msg.createdFiles}
                      citedSources={msg.citedSources}
                    />
                  </motion.div>
                )
              })}

              {/* Active Thinking State Indicator */}
              {isAnalyzing && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    padding: '16px 20px',
                    borderRadius: '12px',
                    background: 'var(--soc-bg-surface)',
                    border: '1px solid var(--soc-primary)',
                    boxShadow: 'var(--soc-shadow-md)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        padding: '8px',
                        borderRadius: '8px',
                        background: 'var(--soc-primary-subtle)',
                        color: 'var(--soc-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Loader2 size={16} className="animate-spin" />
                    </div>
                    <div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '12px',
                          fontWeight: 700,
                          color: 'var(--soc-text-high)',
                        }}
                      >
                        <BrainCircuit size={14} style={{ color: 'var(--soc-primary)' }} />
                        <span>REASONING & SYNTHESIZING PROOF...</span>
                      </div>
                      <p style={{ margin: 0, fontSize: '12px', color: 'var(--soc-text-muted)' }}>
                        {activeStep ? activeStep.label : 'Executing cognitive loop across Knowledge Vault...'}
                      </p>
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: '10px',
                      fontFamily: 'monospace',
                      fontWeight: 600,
                      color: 'var(--soc-primary)',
                      background: 'var(--soc-primary-subtle)',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px solid var(--soc-primary)',
                    }}
                  >
                    Sovereign 8-Stage Cognitive Loop
                  </span>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Command Input Bar for ongoing conversation */}
      {!idle && (
        <div
          style={{
            padding: '10px 24px 14px',
            background: 'var(--soc-bg-surface)',
            borderTop: '1px solid var(--soc-border-subtle)',
            maxWidth: '1040px',
            width: '100%',
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          {/* Quick Queries Suggestion Strip */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '2px', scrollbarWidth: 'none' }}>
            <span style={{ fontSize: '10px', color: 'var(--soc-text-dim)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', fontWeight: 600, textTransform: 'uppercase' }}>
              💡 Quick Queries:
            </span>
            {QUICK_QUERY_PILLS.map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => submit(pill.prompt)}
                style={{
                  whiteSpace: 'nowrap',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 500,
                  background: 'var(--soc-bg-elevated)',
                  color: 'var(--soc-text-medium)',
                  border: `1px solid ${pill.color}30`,
                  cursor: 'pointer',
                  transition: 'all 0.12s ease',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = pill.color
                  e.currentTarget.style.color = '#fff'
                  e.currentTarget.style.background = `${pill.color}15`
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = `${pill.color}30`
                  e.currentTarget.style.color = 'var(--soc-text-medium)'
                  e.currentTarget.style.background = 'var(--soc-bg-elevated)'
                }}
              >
                {pill.label}
              </button>
            ))}
          </div>
          <CommandInput compact />
        </div>
      )}
    </div>
  )
}
