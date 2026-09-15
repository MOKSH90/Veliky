import React, { useState } from 'react'
import {
  Clock,
  ShieldCheck,
  CheckCircle2,
  FileCode2,
  Terminal,
  Layers,
  ArrowRight,
  Database,
  Code2,
  Lock,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { useEdithAppStore } from '../../store/useEdithAppStore'

export const EdithExecutionTimeline: React.FC = () => {
  const {
    timelineSteps,
    executions,
    selectedExecutionId,
    setSelectedExecutionId,
    orchestratorStatus,
  } = useEdithAppStore()

  const [expandedStep, setExpandedStep] = useState<number | null>(7)

  const selectedExec =
    executions.find((e) => e.execution_id === selectedExecutionId) || executions[0]

  return (
    <div className="edith-timeline-view">
      {/* Header Banner */}
      <div className="edith-timeline-header">
        <div className="edith-timeline-header-left">
          <h1 className="edith-timeline-title">
            Execution Timeline & Orchestrator Stream
          </h1>
          <p className="edith-timeline-sub">
            Chapter 7.3 (Figure 11) & Chapter 6.2 (Figure 8 Execution Object) · Deterministic Verification
          </p>
        </div>
        <div className="edith-timeline-header-badges">
          <span className="edith-badge-tag emerald">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Audit Ledger Active
          </span>
          <span className="edith-badge-tag mono">
            Status: {orchestratorStatus}
          </span>
        </div>
      </div>

      {/* Orchestrator Stage Pipeline Progress Bar */}
      <div className="edith-pipeline-progress-bar-card">
        <div className="edith-pipeline-stages-wrap">
          {[
            { step: '1. Intent', active: true, done: true },
            { step: '2. Context', active: true, done: true },
            { step: '3. DAG Plan', active: true, done: true },
            { step: '4. Policy Gate', active: true, done: true },
            { step: '5. Sandbox Tool', active: true, done: true },
            { step: '6. AST Analysis', active: true, done: true },
            { step: '7. Verifier', active: true, done: orchestratorStatus === 'IDLE' },
            { step: '8. Ledger Commit', active: orchestratorStatus === 'IDLE', done: false },
          ].map((stage, idx) => (
            <div
              key={idx}
              className={`edith-pipeline-stage-item ${stage.done ? 'done' : ''} ${
                stage.active && !stage.done ? 'active' : ''
              }`}
            >
              <div className="stage-dot" />
              <span className="stage-label">{stage.step}</span>
              {idx < 7 && <div className="stage-line" />}
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid: Left Orchestrator Sequence Stream (Fig 11), Right Execution Object Inspector (Fig 8) */}
      <div className="edith-timeline-grid">
        {/* Left Column: 8-Step Orchestrator Timeline Stream */}
        <div className="edith-timeline-stream">
          <div className="edith-stream-title-row">
            <Clock className="w-4 h-4 text-cyan-400" />
            <h2 className="edith-stream-title">Figure 11: Orchestrator Sequence Stream</h2>
          </div>

          <div className="edith-timeline-entries">
            {timelineSteps.map((step) => {
              const isExpanded = expandedStep === step.stepNumber
              return (
                <div
                  key={step.stepNumber}
                  className={`edith-timeline-entry ${step.status} ${
                    isExpanded ? 'expanded' : ''
                  }`}
                  onClick={() => setExpandedStep(isExpanded ? null : step.stepNumber)}
                >
                  <div className="edith-timeline-time-col">
                    <span className="edith-timeline-time">{step.timestamp}</span>
                    <div className="edith-timeline-marker">
                      <div className="edith-timeline-step-badge">{step.stepNumber}</div>
                      <div className="edith-timeline-stem" />
                    </div>
                  </div>

                  <div className="edith-timeline-content-card">
                    <div className="edith-timeline-card-header">
                      <div className="edith-timeline-card-titles">
                        <h3 className="edith-timeline-step-label">{step.label}</h3>
                        <p className="edith-timeline-step-sub">{step.subtext}</p>
                      </div>
                      <div className="edith-timeline-card-tags">
                        <span className="edith-layer-tag">{step.layer}</span>
                        <span className={`edith-status-pill ${step.status}`}>
                          {step.status.toUpperCase()}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-slate-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="edith-timeline-detail-drawer">
                        <div className="edith-drawer-desc">{step.details}</div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Column: Execution Object Inspector (Figure 8 & Section 6.2) */}
        <div className="edith-timeline-right-col">
          {/* Execution Records Selector Tabs */}
          <div className="edith-exec-records-nav">
            <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
              Execution Object (Fig 8):
            </span>
            <div className="edith-exec-tab-list">
              {executions.map((exec) => (
                <button
                  key={exec.execution_id}
                  className={`edith-exec-tab ${
                    selectedExec.execution_id === exec.execution_id ? 'active' : ''
                  }`}
                  onClick={() => setSelectedExecutionId(exec.execution_id)}
                >
                  <span className="font-mono">{exec.execution_id}</span>
                  <span className="text-xs text-slate-400">({exec.tool})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Execution Card */}
          <div className="edith-panel-card">
            <div className="edith-panel-header">
              <div className="edith-panel-title-wrap">
                <FileCode2 className="w-4 h-4 text-indigo-400" />
                <h3 className="edith-panel-title">
                  Execution Object: <span className="font-mono text-cyan-300">{selectedExec.execution_id}</span>
                </h3>
              </div>
              <span className="edith-status-pill success">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline mr-1" />
                VERIFIED (0 errors)
              </span>
            </div>

            {/* Core Execution Metrics Grid */}
            <div className="edith-exec-metrics-grid">
              <div className="edith-exec-metric-item">
                <span className="metric-label">Goal ID</span>
                <span className="metric-val font-mono">{selectedExec.goal_id}</span>
              </div>
              <div className="edith-exec-metric-item">
                <span className="metric-label">Task ID</span>
                <span className="metric-val font-mono">{selectedExec.task_id}</span>
              </div>
              <div className="edith-exec-metric-item">
                <span className="metric-label">Tool Called</span>
                <span className="metric-val font-mono text-cyan-300">{selectedExec.tool}()</span>
              </div>
              <div className="edith-exec-metric-item">
                <span className="metric-label">Risk Classification</span>
                <span className="metric-val font-bold text-emerald-400">{selectedExec.risk_tier} RISK</span>
              </div>
              <div className="edith-exec-metric-item">
                <span className="metric-label">Duration</span>
                <span className="metric-val font-mono">{selectedExec.duration_ms} ms</span>
              </div>
              <div className="edith-exec-metric-item">
                <span className="metric-label">Started At</span>
                <span className="metric-val text-xs text-slate-300">{selectedExec.started_at}</span>
              </div>
            </div>

            {/* Verification Proof Box (Section 6.3) */}
            <div className="edith-exec-proof-card">
              <div className="edith-proof-header">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="font-bold text-emerald-300">Deterministic Verification Assertion</span>
              </div>
              <pre className="edith-proof-code font-mono">
                {selectedExec.verification_assertion}
              </pre>
              <div className="edith-proof-result-row">
                <span className="text-slate-400 text-xs">Cryptographic Proof:</span>
                <span className="font-mono text-xs text-emerald-400">{selectedExec.verification_proof}</span>
              </div>
            </div>

            {/* Parameters JSON View */}
            <div className="edith-exec-params-card">
              <div className="edith-params-header">
                <Code2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Tool Parameters (Bound Schema)</span>
              </div>
              <pre className="edith-json-pre">
                {JSON.stringify(selectedExec.parameters, null, 2)}
              </pre>
            </div>

            {/* Sandboxed Stdout Preview Terminal */}
            <div className="edith-exec-stdout-card">
              <div className="edith-stdout-header">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <span>Sandboxed Execution Stdout Preview</span>
              </div>
              <pre className="edith-stdout-content">
                {selectedExec.stdout_preview}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
