import { RotateCcw, TerminalSquare, ArrowRight, Bot, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { CommandInput } from './CommandInput'
import { MarkdownOutputCanvas } from './MarkdownOutputCanvas'
import { useEdithStore } from '../../store/useEdithStore'

const quickGoals = [
  'Analyze the workspace codebase and explain main functions.',
  'Write a Python script for quicksort with clear comments.',
  'Explain async/await syntax in TypeScript with an example.',
]

export function AgentWorkspace() {
  const state = useEdithStore((s) => s.agentState)
  const goal = useEdithStore((s) => s.currentGoal)
  const reset = useEdithStore((s) => s.resetAgent)
  const logs = useEdithStore((s) => s.executionLog)
  const submit = useEdithStore((s) => s.submitGoal)
  const activeAgent = useEdithStore((s) => s.activeAgent)
  const activeModel = useEdithStore((s) => s.activeModel)
  const idle = state === 'idle'

  return (
    <div
      className="agent-view-clean"
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        background: 'var(--surface-bg, #0d0d11)',
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
          padding: '12px 24px',
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          zIndex: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
            <Bot size={18} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#f8fafc' }}>
              SENTINEL Agent ({activeAgent.toUpperCase()})
            </h2>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>
              Model: {activeModel} | Status: <strong style={{ color: state === 'executing' ? '#38bdf8' : '#34d399' }}>{state.toUpperCase()}</strong>
            </span>
          </div>
        </div>

        {!idle && (
          <button
            type="button"
            onClick={reset}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 500,
              background: 'rgba(255, 255, 255, 0.06)',
              color: '#cbd5e1',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              cursor: 'pointer',
            }}
          >
            <RotateCcw size={14} />
            <span>New Chat</span>
          </button>
        )}
      </div>

      {/* Main Conversation Canvas */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          maxWidth: '960px',
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
                justifyContent: 'center',
                minHeight: '60vh',
                textAlign: 'center',
                gap: '24px',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    padding: '16px',
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(168,85,247,0.2))',
                    border: '1px solid rgba(99,102,241,0.3)',
                    boxShadow: '0 0 30px rgba(99,102,241,0.15)',
                  }}
                >
                  <Sparkles size={32} style={{ color: '#a78bfa' }} />
                </div>
                <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#f8fafc', margin: 0 }}>
                  What do you want SENTINEL to accomplish?
                </h1>
                <p style={{ fontSize: '13px', color: '#94a3b8', maxWidth: '480px', margin: 0 }}>
                  Ask any question, request code generation, or analyze your project workspace files.
                </p>
              </div>

              <div style={{ width: '100%', maxWidth: '680px' }}>
                <CommandInput />
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  width: '100%',
                  maxWidth: '680px',
                }}
              >
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b', textAlign: 'left', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Suggested Prompts
                </span>
                {quickGoals.map((q, i) => (
                  <motion.button
                    key={q}
                    type="button"
                    onClick={() => submit(q)}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                      color: '#e2e8f0',
                      fontSize: '13px',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{q}</span>
                    <ArrowRight size={14} style={{ color: '#64748b' }} />
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="chat-messages"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}
            >
              {/* Render simple text model delivery */}
              {logs.filter(log => log.label.includes('User Prompt') || log.label.includes('SENTINEL') || log.label.includes('Explanation') || log.label.includes('Assistant')).map((log) => {
                const isUserPrompt = log.label.includes('User Prompt')

                if (isUserPrompt) {
                  return (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        alignSelf: 'flex-end',
                        maxWidth: '85%',
                        background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.6), rgba(30, 64, 175, 0.4))',
                        border: '1px solid rgba(59, 130, 246, 0.35)',
                        borderRadius: '16px 16px 4px 16px',
                        padding: '16px 20px',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          You
                        </span>
                        {log.time && <time style={{ fontSize: '11px', color: '#94a3b8' }}>{log.time}</time>}
                      </div>
                      <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.6', color: '#f8fafc', whiteSpace: 'pre-wrap' }}>
                        {log.detail}
                      </p>
                    </motion.div>
                  )
                }

                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ width: '100%' }}
                  >
                    <MarkdownOutputCanvas label="SENTINEL AI" detail={log.detail} time={log.time} file={log.file} />
                  </motion.div>
                )
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Command Input Bar for ongoing chat */}
      {!idle && (
        <div
          style={{
            padding: '14px 24px',
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(12px)',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            maxWidth: '960px',
            width: '100%',
            margin: '0 auto',
          }}
        >
          <CommandInput compact />
        </div>
      )}
    </div>
  )
}
