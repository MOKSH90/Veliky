import React from 'react'
import {
  GitFork,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  FileCode2,
  ArrowRight,
  Sparkles,
  Layers,
  Terminal,
  Activity,
  Maximize2,
  Workflow,
  Check,
} from 'lucide-react'
import { useEdithAppStore } from '../../store/useEdithAppStore'

export const EdithGoalWorkspace: React.FC = () => {
  const {
    goals,
    selectedGoalId,
    setSelectedGoalId,
    dagNodes,
    selectedDagNodeId,
    setSelectedDagNodeId,
    toggleDagTaskStatus,
    criticalPathOnly,
    setCriticalPathOnly,
    setActiveView,
  } = useEdithAppStore()

  const currentGoal = goals.find((g) => g.id === selectedGoalId) || goals[0]
  const allGoalNodes = dagNodes.filter((n) => n.goalId === currentGoal.id)
  const displayNodes = criticalPathOnly
    ? allGoalNodes.filter((n) => n.isCriticalPath)
    : allGoalNodes

  const selectedNode =
    allGoalNodes.find((n) => n.id === selectedDagNodeId) || allGoalNodes[0] || null

  return (
    <div className="edith-goal-workspace-view">
      {/* Goal Tabs Header */}
      <div className="edith-workspace-goal-tabs-bar">
        <div className="edith-workspace-goal-tabs">
          {goals.map((goal) => (
            <button
              key={goal.id}
              className={`edith-workspace-goal-tab ${
                goal.id === currentGoal.id ? 'active' : ''
              }`}
              onClick={() => {
                setSelectedGoalId(goal.id)
                // Select first node of new goal
                const firstNode = dagNodes.find((n) => n.goalId === goal.id)
                if (firstNode) setSelectedDagNodeId(firstNode.id)
              }}
            >
              <span
                className="edith-workspace-tab-dot"
                style={{ backgroundColor: goal.color }}
              />
              <span className="edith-workspace-tab-title">{goal.title}</span>
              <span className="edith-workspace-tab-pct">{goal.progress}%</span>
            </button>
          ))}
        </div>

        <div className="edith-workspace-tabs-actions">
          <button
            className={`edith-toggle-critpath-btn ${criticalPathOnly ? 'active' : ''}`}
            onClick={() => setCriticalPathOnly(!criticalPathOnly)}
            title="Toggle between full DAG and Kahn Critical Path only"
          >
            <Workflow className="w-3.5 h-3.5" />
            <span>{criticalPathOnly ? 'Critical Path (Kahn)' : 'Show Full DAG'}</span>
          </button>
        </div>
      </div>

      {/* Goal Summary Ribbon (Chapter 7.2 Fig 10 Top) */}
      <div className="edith-workspace-summary-card">
        <div className="edith-workspace-summary-left">
          <div className="edith-workspace-title-row">
            <h1 className="edith-workspace-heading">{currentGoal.title}</h1>
            <span className="edith-category-tag">{currentGoal.category}</span>
            <span
              className={`edith-status-pill ${
                currentGoal.status === 'completed' ? 'completed' : 'in_progress'
              }`}
            >
              {currentGoal.status === 'completed' ? 'VERIFIED COMPLETE' : 'IN PROGRESS'}
            </span>
          </div>
          <p className="edith-workspace-objective">{currentGoal.objective}</p>
        </div>

        <div className="edith-workspace-summary-right">
          <div className="edith-workspace-progress-meta">
            <span className="text-slate-400">Completion:</span>
            <span className="edith-workspace-progress-val font-mono">{currentGoal.progress}%</span>
          </div>
          <div className="edith-workspace-progress-track">
            <div
              className="edith-workspace-progress-fill"
              style={{
                width: `${currentGoal.progress}%`,
                backgroundColor: currentGoal.color,
              }}
            />
          </div>
          <div className="edith-workspace-subtasks-count">
            <span>{currentGoal.tasksDone} of {currentGoal.tasksTotal} subtasks verified</span>
            <span>Deadline: {currentGoal.deadline}</span>
          </div>
        </div>
      </div>

      {/* Main DAG Workspace Grid: Left Graph Visualizer, Right Inspector */}
      <div className="edith-workspace-main-grid">
        {/* Center/Left: Interactive DAG Pipeline Canvas (Section 5.9 & Fig 10) */}
        <div className="edith-dag-canvas-container">
          <div className="edith-dag-canvas-header">
            <div className="edith-dag-header-left">
              <GitFork className="w-4 h-4 text-cyan-400" />
              <h2 className="edith-dag-title">
                Interactive Directed Acyclic Graph (DAG) Planner
              </h2>
            </div>
            <div className="edith-dag-header-badges">
              <span className="edith-badge-tag mono">Kahn Topological Sorter: O(V+E)</span>
              <span className="edith-badge-tag emerald">Zero Cycles Detected</span>
            </div>
          </div>

          {/* Graphical Pipeline Stages */}
          <div className="edith-dag-nodes-flow">
            {displayNodes.map((node, index) => {
              const isSelected = selectedNode?.id === node.id
              return (
                <React.Fragment key={node.id}>
                  {/* DAG Node Card */}
                  <div
                    className={`edith-dag-node-card ${isSelected ? 'selected' : ''} ${
                      node.status
                    } ${node.isCriticalPath ? 'critical-path' : ''}`}
                    onClick={() => setSelectedDagNodeId(node.id)}
                  >
                    <div className="edith-dag-node-header">
                      <span className="edith-dag-node-phase">{node.phase}</span>
                      <div className="edith-dag-node-badges">
                        {node.isCriticalPath && (
                          <span className="edith-dag-crit-badge">CRITICAL</span>
                        )}
                        <span
                          className={`edith-risk-badge ${
                            node.riskTier === 'HIGH'
                              ? 'high'
                              : node.riskTier === 'MEDIUM'
                              ? 'medium'
                              : 'low'
                          }`}
                        >
                          {node.riskTier}
                        </span>
                      </div>
                    </div>

                    <h3 className="edith-dag-node-title">{node.label}</h3>

                    {node.tool && (
                      <div className="edith-dag-node-tool">
                        <FileCode2 className="w-3 h-3 text-indigo-400" />
                        <span className="font-mono">{node.tool}</span>
                      </div>
                    )}

                    <div className="edith-dag-node-footer">
                      <div className="edith-dag-status-indicator">
                        {node.status === 'done' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        ) : node.status === 'in_progress' ? (
                          <Clock className="w-4 h-4 text-cyan-400 animate-spin" />
                        ) : (
                          <div className="w-3 h-3 rounded-full border border-slate-600" />
                        )}
                        <span className="edith-dag-status-text">
                          {node.status === 'done'
                            ? 'VERIFIED'
                            : node.status === 'in_progress'
                            ? 'ACTIVE'
                            : 'PENDING'}
                        </span>
                      </div>

                      {/* Clickable quick toggle to simulate done/pending */}
                      <button
                        className="edith-dag-quick-toggle-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleDagTaskStatus(node.id)
                        }}
                        title="Toggle task verification state"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>{node.status === 'done' ? 'Mark Active' : 'Mark Done'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Connecting Dependency Arrow */}
                  {index < displayNodes.length - 1 && (
                    <div className="edith-dag-connector-wrap">
                      <div className="edith-dag-connector-line" />
                      <ArrowRight className="w-4 h-4 text-indigo-400 shrink-0" />
                    </div>
                  )}
                </React.Fragment>
              )
            })}
          </div>

          {/* DAG Dependency Trace Table (Section 5.9 Kahn's Algorithm Table) */}
          <div className="edith-dag-subtasks-table-wrap">
            <div className="edith-subtasks-table-header">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>Subtask Dependency Registry (Section 5.9)</span>
            </div>
            <div className="edith-subtasks-table">
              <div className="edith-subtasks-header-row">
                <span className="col-id">Node ID</span>
                <span className="col-label">Subtask</span>
                <span className="col-deps">Depends On</span>
                <span className="col-tool">Assigned Tool</span>
                <span className="col-effort">Est. Hours</span>
                <span className="col-status">Status</span>
              </div>
              {displayNodes.map((n) => (
                <div
                  key={n.id}
                  className={`edith-subtasks-row ${
                    selectedNode?.id === n.id ? 'active' : ''
                  }`}
                  onClick={() => setSelectedDagNodeId(n.id)}
                >
                  <span className="col-id font-mono text-cyan-400">{n.id}</span>
                  <span className="col-label font-medium">{n.label}</span>
                  <span className="col-deps font-mono text-slate-400">
                    {n.dependsOn.length > 0 ? n.dependsOn.join(', ') : 'ROOT (None)'}
                  </span>
                  <span className="col-tool font-mono text-indigo-300">
                    {n.tool || 'none'}
                  </span>
                  <span className="col-effort">{n.estimatedHours}h</span>
                  <span className="col-status">
                    <span className={`edith-status-pill ${n.status}`}>
                      {n.status.toUpperCase()}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Selected Task Inspector (Chapter 7.2 Fig 10 Right) */}
        <div className="edith-task-inspector-panel">
          {selectedNode ? (
            <div className="edith-inspector-content">
              <div className="edith-inspector-header">
                <div className="edith-inspector-title-wrap">
                  <span className="edith-inspector-node-id font-mono">
                    {selectedNode.id}
                  </span>
                  <h3 className="edith-inspector-title">{selectedNode.label}</h3>
                </div>
                <span className={`edith-status-pill ${selectedNode.status}`}>
                  {selectedNode.status.toUpperCase()}
                </span>
              </div>

              {/* Task Attributes */}
              <div className="edith-inspector-section">
                <h4 className="edith-inspector-section-label">Subtask Attributes</h4>
                <div className="edith-inspector-props-grid">
                  <div className="edith-prop-item">
                    <span className="prop-key">Phase:</span>
                    <span className="prop-val">{selectedNode.phase}</span>
                  </div>
                  <div className="edith-prop-item">
                    <span className="prop-key">Tool:</span>
                    <span className="prop-val font-mono text-cyan-300">
                      {selectedNode.tool || 'N/A'}
                    </span>
                  </div>
                  <div className="edith-prop-item">
                    <span className="prop-key">Risk Tier:</span>
                    <span
                      className={`prop-val font-bold ${
                        selectedNode.riskTier === 'HIGH'
                          ? 'text-red-400'
                          : selectedNode.riskTier === 'MEDIUM'
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {selectedNode.riskTier} RISK
                    </span>
                  </div>
                  <div className="edith-prop-item">
                    <span className="prop-key">Critical Path:</span>
                    <span className="prop-val">
                      {selectedNode.isCriticalPath ? 'YES (Kahn Queue)' : 'NO'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Deterministic Verification Assertion (Section 6.3) */}
              <div className="edith-inspector-section">
                <div className="edith-inspector-section-label-wrap">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <h4 className="edith-inspector-section-label">
                    Post-Condition Assertion Formula (Section 6.3)
                  </h4>
                </div>
                <div className="edith-code-block-wrap">
                  <pre className="edith-assertion-code">
                    {selectedNode.verificationAssertion}
                  </pre>
                </div>
                <p className="edith-assertion-subtext">
                  Evaluated deterministically in sandbox. If assertion fails, the orchestrator
                  triggers automatic re-planning without reporting false success.
                </p>
              </div>

              {/* Working Memory Scratchpad Note (Section 5.4 & Fig 4) */}
              <div className="edith-inspector-section">
                <div className="edith-inspector-section-label-wrap">
                  <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                  <h4 className="edith-inspector-section-label">
                    Working Memory Register Note (Section 5.4)
                  </h4>
                </div>
                <div className="edith-inspector-memory-box">
                  {selectedNode.workingMemoryNote || 'No working memory note recorded.'}
                </div>
              </div>

              {/* Output Summary */}
              {selectedNode.outputSummary && (
                <div className="edith-inspector-section">
                  <h4 className="edith-inspector-section-label">Execution Summary</h4>
                  <div className="edith-inspector-summary-box">
                    {selectedNode.outputSummary}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="edith-inspector-actions">
                <button
                  className="edith-btn-primary"
                  onClick={() => toggleDagTaskStatus(selectedNode.id)}
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {selectedNode.status === 'done'
                      ? 'Reopen Subtask'
                      : 'Verify & Mark Done'}
                  </span>
                </button>
                <button
                  className="edith-btn-secondary"
                  onClick={() => setActiveView('timeline')}
                >
                  <span>View Timeline Trace</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="edith-inspector-empty">
              <GitFork className="w-8 h-8 text-slate-600 mb-2" />
              <span>Select a DAG node to inspect execution properties</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
