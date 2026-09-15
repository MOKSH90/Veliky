import React, { useState, useRef, useEffect } from 'react'
import {
  Send,
  Sparkles,
  Bot,
  User,
  Trash2,
  GitFork,
  FileCode2,
  ShieldCheck,
  CheckCircle2,
  Terminal,
  Clock,
  ArrowRight,
} from 'lucide-react'
import { useEdithAppStore, type ChatMessage } from '../../store/useEdithAppStore'

export const EdithAgentChat: React.FC = () => {
  const {
    chatMessages,
    sendChatMessage,
    clearChat,
    orchestratorStatus,
  } = useEdithAppStore()

  const [inputVal, setInputVal] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputVal.trim()) return
    sendChatMessage(inputVal.trim())
    setInputVal('')
  }

  const promptSuggestions = [
    'Hello EDITH, what is your operational status?',
    'Clean my project folder',
    'I have five subjects and three projects this semester. Help me manage everything.',
    'Find why my project isn\'t starting.',
    'I need to understand multimodal agent systems and hybrid memory.',
  ]

  return (
    <div className="edith-chat-container">
      {/* Chat Header */}
      <div className="edith-chat-header">
        <div className="edith-chat-header-left">
          <div className="edith-chat-avatar">
            <Bot className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="edith-chat-agent-title">EDITH Copilot Agent</h2>
              <span className="edith-chat-badge">6 Cognitive Layers</span>
            </div>
            <p className="edith-chat-sub">
              Natural Language Goal Decomposer · Kahn DAG Planner · Deterministic Verifier
            </p>
          </div>
        </div>

        <button
          className="edith-chat-clear-btn"
          onClick={clearChat}
          title="Clear conversational buffer"
        >
          <Trash2 className="w-4 h-4" />
          <span>Reset Context</span>
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="edith-chat-messages-area">
        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={`edith-chat-bubble-row ${msg.sender === 'user' ? 'user' : 'edith'}`}
          >
            <div className="edith-chat-bubble-avatar">
              {msg.sender === 'user' ? (
                <User className="w-4 h-4 text-slate-300" />
              ) : (
                <Bot className="w-4 h-4 text-cyan-400" />
              )}
            </div>

            <div className="edith-chat-bubble-content">
              <div className="edith-chat-bubble-meta">
                <span className="font-semibold text-xs text-slate-300">
                  {msg.sender === 'user' ? 'Lucifer' : 'EDITH Personal AI OS'}
                </span>
                <span className="text-xs text-slate-500">{msg.timestamp}</span>
              </div>

              <div className="edith-chat-bubble-text">{msg.text}</div>

              {/* Structured Intent Box if present */}
              {msg.intentJson && (
                <div className="edith-chat-intent-box">
                  <div className="edith-chat-intent-title">
                    <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Section 5.3: Structured Intent Extracted</span>
                  </div>
                  <pre className="edith-json-pre">
                    {JSON.stringify(msg.intentJson, null, 2)}
                  </pre>
                </div>
              )}

              {/* DAG Tasks Breakdown if present */}
              {msg.dagSummary && (
                <div className="edith-chat-dag-box">
                  <div className="edith-chat-dag-title">
                    <GitFork className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Formulated DAG Execution Plan</span>
                  </div>
                  <div className="edith-chat-dag-items">
                    {msg.dagSummary.tasks.map((task, tIdx) => (
                      <div key={tIdx} className="edith-chat-dag-item">
                        <div className="flex items-center gap-2">
                          <span className="task-idx-badge">{tIdx + 1}</span>
                          <span className="edith-chat-dag-label">{task.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {task.tool && (
                            <span className="font-mono text-xs text-cyan-300">
                              {task.tool}
                            </span>
                          )}
                          <span className={`edith-status-pill ${task.status}`}>
                            {task.status.toUpperCase()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tool Execution Card if present */}
              {msg.toolExecution && (
                <div className="edith-chat-tool-card">
                  <div className="edith-chat-tool-header">
                    <div className="flex items-center gap-2">
                      <FileCode2 className="w-3.5 h-3.5 text-indigo-400" />
                      <span className="font-mono font-bold text-cyan-300">
                        {msg.toolExecution.tool}
                      </span>
                    </div>
                    <span className="edith-chat-verif-badge">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      POST_CONDITION: PASS
                    </span>
                  </div>

                  <div className="edith-chat-tool-output">
                    <pre className="font-mono text-xs text-slate-300">
                      {msg.toolExecution.stdout}
                    </pre>
                  </div>

                  <div className="edith-chat-assertion-line">
                    <span className="text-slate-400">Assertion: </span>
                    <span className="font-mono text-emerald-300">
                      {msg.toolExecution.assertion}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {orchestratorStatus === 'EXECUTING' && (
          <div className="edith-chat-typing-indicator">
            <div className="edith-chat-bubble-avatar">
              <Bot className="w-4 h-4 text-cyan-400 animate-pulse" />
            </div>
            <div className="edith-typing-dots">
              <span className="dot" />
              <span className="dot" />
              <span className="dot" />
              <span className="text-xs text-slate-400 font-mono ml-2">
                Orchestrator decomposing goal into Kahn DAG...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompt Chips */}
      <div className="edith-chat-input-area">
        <div className="edith-chat-prompt-chips">
          {promptSuggestions.map((prompt, pIdx) => (
            <button
              key={pIdx}
              type="button"
              className="edith-chat-prompt-chip"
              onClick={() => {
                sendChatMessage(prompt)
              }}
            >
              <span>{prompt}</span>
            </button>
          ))}
        </div>

        {/* Input Bar Form */}
        <form onSubmit={handleSend} className="edith-chat-form">
          <input
            type="text"
            className="edith-chat-input"
            placeholder="Type a request (e.g., 'Clean my project folder', 'Debug why server won\'t start')..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
          />
          <button type="submit" className="edith-chat-send-btn">
            <Send className="w-4 h-4" />
            <span>Send Goal</span>
          </button>
        </form>
      </div>
    </div>
  )
}
