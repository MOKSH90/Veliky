import React, { useState } from 'react'
import {
  Play,
  RotateCcw,
  CheckCircle2,
  GitFork,
  Clock,
  ShieldCheck,
  Database,
  Terminal,
  FileCode2,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react'
import { useEdithAppStore } from '../../store/useEdithAppStore'

export const EdithScenarios: React.FC = () => {
  const {
    scenarios,
    activeScenarioId,
    runScenario,
    isScenarioRunning,
    scenarioProgress,
    scenarioActiveStepIndex,
  } = useEdithAppStore()

  const [selectedId, setSelectedId] = useState<string>(activeScenarioId || 'sc_academic')

  const scenario = scenarios.find((s) => s.id === selectedId) || scenarios[0]

  return (
    <div className="edith-scenarios-view">
      {/* Header */}
      <div className="edith-scenarios-header">
        <div className="edith-scenarios-header-left">
          <h1 className="edith-scenarios-title">
            Interactive Scenario Runner (Chapter 8)
          </h1>
          <p className="edith-scenarios-sub">
            Complete End-to-End Walkthroughs across Academics (8.1), Software Dev (8.2), Research (8.3), and Document Organization (8.4)
          </p>
        </div>
        <button
          className="edith-btn-run-scenario"
          onClick={() => runScenario(scenario.id)}
          disabled={isScenarioRunning}
        >
          {isScenarioRunning ? (
            <>
              <Clock className="w-4 h-4 animate-spin text-cyan-400" />
              <span>Orchestrating Pipeline ({scenarioProgress}%)...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
              <span>Simulate End-to-End Walkthrough</span>
            </>
          )}
        </button>
      </div>

      {/* Scenario Selector Ribbon */}
      <div className="edith-scenario-tabs-ribbon">
        {scenarios.map((sc) => (
          <button
            key={sc.id}
            className={`edith-scenario-tab ${selectedId === sc.id ? 'active' : ''}`}
            onClick={() => setSelectedId(sc.id)}
          >
            <span className="edith-scenario-chapter">Ch. {sc.chapter}</span>
            <span className="edith-scenario-tab-title">{sc.title}</span>
          </button>
        ))}
      </div>

      {/* Live Pipeline Progress Bar if running */}
      {isScenarioRunning && (
        <div className="edith-scenario-progress-banner">
          <div className="edith-scenario-progress-top">
            <span className="font-mono text-cyan-300">
              Orchestrator Step {scenarioActiveStepIndex + 1} of {scenario.executionTrace.length}
            </span>
            <span className="font-mono font-bold text-cyan-400">{scenarioProgress}%</span>
          </div>
          <div className="edith-scenario-progress-track">
            <div
              className="edith-scenario-progress-fill"
              style={{ width: `${scenarioProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* User Input & Structured Intent Section (Section 5.3) */}
      <div className="edith-scenario-prompt-card">
        <div className="edith-prompt-row">
          <div className="edith-prompt-label">User Natural Language Request:</div>
          <div className="edith-prompt-quote">"{scenario.userPrompt}"</div>
        </div>
      </div>

      {/* 2-Column Grid: Left (Intent + DAG), Right (Trace + Verification + Memory) */}
      <div className="edith-scenario-content-grid">
        {/* Left Column: Intent Extraction & Planned DAG Tasks */}
        <div className="edith-scenario-left-col">
          {/* Section 5.3 Structured Intent Extraction */}
          <div className="edith-panel-card">
            <div className="edith-panel-header">
              <div className="edith-panel-title-wrap">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h3 className="edith-panel-title">
                  Section 5.3: Structured Intent Extraction
                </h3>
              </div>
              <span className="edith-badge-tag mono">LLM Zero-Shot Parser</span>
            </div>
            <pre className="edith-json-pre">
              {JSON.stringify(scenario.intentJson, null, 2)}
            </pre>
          </div>

          {/* Planned DAG Tasks */}
          <div className="edith-panel-card">
            <div className="edith-panel-header">
              <div className="edith-panel-title-wrap">
                <GitFork className="w-4 h-4 text-indigo-400" />
                <h3 className="edith-panel-title">Planned DAG Subtasks</h3>
              </div>
              <span className="edith-badge-counter">
                {scenario.dagTasks.length} Subtasks
              </span>
            </div>

            <div className="edith-scenario-dag-list">
              {scenario.dagTasks.map((task, idx) => (
                <div key={idx} className="edith-scenario-dag-task">
                  <div className="edith-scenario-task-left">
                    <span className="task-idx-badge">{idx + 1}</span>
                    <div>
                      <div className="task-label font-medium">{task.label}</div>
                      <div className="task-tool font-mono text-cyan-400">{task.tool}</div>
                    </div>
                  </div>
                  <div className="edith-scenario-task-right">
                    <span
                      className={`edith-risk-badge ${
                        task.risk === 'HIGH'
                          ? 'high'
                          : task.risk === 'MEDIUM'
                          ? 'medium'
                          : 'low'
                      }`}
                    >
                      {task.risk}
                    </span>
                    <span className={`edith-status-pill ${task.status}`}>
                      {task.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Execution Trace, Verification Proof, Decision Rationale */}
        <div className="edith-scenario-right-col">
          {/* Execution Trace Stream */}
          <div className="edith-panel-card">
            <div className="edith-panel-header">
              <div className="edith-panel-title-wrap">
                <Clock className="w-4 h-4 text-cyan-400" />
                <h3 className="edith-panel-title">Orchestrator Execution Trace</h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">Real-time Stream</span>
            </div>

            <div className="edith-scenario-trace-box">
              {scenario.executionTrace.map((line, lIdx) => {
                const isCurrent = isScenarioRunning && scenarioActiveStepIndex === lIdx
                return (
                  <div
                    key={lIdx}
                    className={`edith-scenario-trace-line ${
                      isCurrent ? 'current' : ''
                    }`}
                  >
                    <span className="trace-dot" />
                    <span>{line}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Deterministic Verification Proof (Section 6.3) */}
          <div className="edith-panel-card verif-proof-card">
            <div className="edith-panel-header">
              <div className="edith-panel-title-wrap">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <h3 className="edith-panel-title text-emerald-300">
                  Section 6.3: Deterministic Verification Proof
                </h3>
              </div>
              <span className="edith-status-pill verified">POST-CONDITION PASS</span>
            </div>
            <div className="edith-proof-box">
              <pre className="font-mono text-xs text-emerald-400">
                {scenario.verificationProof}
              </pre>
            </div>
          </div>

          {/* Decision Explanation (Section 7.4) */}
          <div className="edith-panel-card">
            <div className="edith-panel-header">
              <div className="edith-panel-title-wrap">
                <Info className="w-4 h-4 text-indigo-400" />
                <h3 className="edith-panel-title">
                  Section 7.4: Decision Explanation Rationale
                </h3>
              </div>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">
              {scenario.decisionExplanation}
            </p>
          </div>

          {/* Memory Update Committed */}
          <div className="edith-panel-card">
            <div className="edith-panel-header">
              <div className="edith-panel-title-wrap">
                <Database className="w-4 h-4 text-purple-400" />
                <h3 className="edith-panel-title">
                  Committed to Memory (PostgreSQL / Working)
                </h3>
              </div>
            </div>
            <p className="text-xs text-slate-300 font-mono bg-slate-900/60 p-3 rounded border border-slate-800">
              {scenario.memoryUpdate}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
