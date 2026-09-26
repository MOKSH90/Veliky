import React, { useState } from 'react'
import {
  Target,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Clock,
  AlertTriangle,
  FileCode2,
  Calendar,
  Check,
  X,
  ExternalLink,
  ChevronRight,
  Info,
} from 'lucide-react'
import { useEdithAppStore } from '../../store/useEdithAppStore'

export const EdithDashboard: React.FC = () => {
  const {
    goals,
    priorityTasks,
    approvals,
    setSelectedGoalId,
    setActiveView,
    submitGoal,
    approveAction,
    rejectAction,
    openApprovalModal,
    systemStats,
  } = useEdithAppStore()

  const [inputPrompt, setInputPrompt] = useState('')

  const handleGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputPrompt.trim()) return
    submitGoal(inputPrompt.trim())
    setInputPrompt('')
  }

  const promptSuggestions = [
    'Clean my project folder',
    'I have five subjects and three projects this semester. Help me manage everything.',
    'Find why my project isn\'t starting.',
    'I need to understand multimodal agent systems and hybrid memory.',
  ]

  const pendingApprovals = approvals.filter((a) => a.status === 'WAITING_APPROVAL')

  return (
    <div className="edith-dashboard-view">
      {/* Top Banner / Academic Greeting */}
      <div className="edith-dashboard-header">
        <div className="edith-dashboard-header-left">
          <h1 className="edith-dashboard-greeting">
            Welcome back, <span className="text-cyan-400">Lucifer</span>
          </h1>
          <p className="edith-dashboard-subtext">
            B.Tech CSE Semester 7/8 · Kurukshetra University (P.I.E.T.) · All 6 Cognitive Layers Active
          </p>
        </div>
        <div className="edith-dashboard-header-right">
          <div className="edith-live-status-card">
            <span className="edith-live-dot" />
            <div>
              <div className="edith-live-title">Deterministic OS Core</div>
              <div className="edith-live-sub">Kahn DAG Planner · Zero Hallucination Mode</div>
            </div>
          </div>
        </div>
      </div>

      {/* Natural Language Goal Launcher (Section 5.3 & 7.1) */}
      <div className="edith-goal-launcher-card">
        <form onSubmit={handleGoalSubmit} className="edith-goal-launcher-form">
          <div className="edith-launcher-icon">
            <Sparkles className="w-5 h-5 text-cyan-400" />
          </div>
          <input
            type="text"
            className="edith-goal-launcher-input"
            placeholder="Declare a high-level goal (e.g. 'Organize research papers', 'Schedule study blocks', 'Debug repository')..."
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
          />
          <button type="submit" className="edith-goal-launcher-submit">
            <span>Decompose & Plan DAG</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="edith-launcher-chips">
          <span className="edith-launcher-chips-label">Quick Scenarios:</span>
          {promptSuggestions.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              className="edith-launcher-chip"
              onClick={() => setInputPrompt(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* 4 Hero Metric Summary Cards */}
      <div className="edith-dashboard-stats-grid">
        <div className="edith-stat-card">
          <div className="edith-stat-icon-wrap indigo">
            <Target className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="edith-stat-body">
            <div className="edith-stat-value">{goals.length}</div>
            <div className="edith-stat-label">Active System Goals</div>
            <div className="edith-stat-meta text-indigo-300">
              1 Completed · 3 In Progress
            </div>
          </div>
        </div>

        <div className="edith-stat-card">
          <div className="edith-stat-icon-wrap emerald">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="edith-stat-body">
            <div className="edith-stat-value">{systemStats.tasksVerified}</div>
            <div className="edith-stat-label">Verified Subtasks</div>
            <div className="edith-stat-meta text-emerald-300">
              Deterministic post-conditions
            </div>
          </div>
        </div>

        <div className="edith-stat-card">
          <div className="edith-stat-icon-wrap amber">
            <ShieldCheck className="w-5 h-5 text-amber-400" />
          </div>
          <div className="edith-stat-body">
            <div className="edith-stat-value">100%</div>
            <div className="edith-stat-label">Policy Safety Intercept</div>
            <div className="edith-stat-meta text-amber-300">
              {pendingApprovals.length} Pending Operator Review
            </div>
          </div>
        </div>

        <div className="edith-stat-card">
          <div className="edith-stat-icon-wrap cyan">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="edith-stat-body">
            <div className="edith-stat-value">88.4%</div>
            <div className="edith-stat-label">Completion vs 41.2% Base</div>
            <div className="edith-stat-meta text-cyan-300">
              +47.2% empirical gain (Ch. 10)
            </div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Dashboard Layout (Fig 9) */}
      <div className="edith-dashboard-main-columns">
        {/* Left Column: Active Goals List */}
        <div className="edith-dashboard-left-col">
          <div className="edith-panel-card">
            <div className="edith-panel-header">
              <div className="edith-panel-title-wrap">
                <Target className="w-4 h-4 text-indigo-400" />
                <h2 className="edith-panel-title">Active Goals (Chapter 7.1)</h2>
              </div>
              <span className="edith-badge-counter">{goals.length} Registered</span>
            </div>

            <div className="edith-goals-list">
              {goals.map((goal) => (
                <div
                  key={goal.id}
                  className="edith-goal-item-card"
                  onClick={() => {
                    setSelectedGoalId(goal.id)
                    setActiveView('goals')
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="edith-goal-item-top">
                    <div className="edith-goal-item-title-wrap">
                      <span
                        className="edith-goal-color-bar"
                        style={{ backgroundColor: goal.color }}
                      />
                      <h3 className="edith-goal-item-title">{goal.title}</h3>
                      <span className="edith-category-tag">{goal.category}</span>
                    </div>
                    <span
                      className={`edith-status-pill ${
                        goal.status === 'completed' ? 'completed' : 'in_progress'
                      }`}
                    >
                      {goal.status === 'completed' ? 'VERIFIED DONE' : `${goal.progress}%`}
                    </span>
                  </div>

                  <p className="edith-goal-item-desc">{goal.objective}</p>

                  <div className="edith-goal-progress-wrap">
                    <div className="edith-goal-progress-bar">
                      <div
                        className="edith-goal-progress-fill"
                        style={{
                          width: `${goal.progress}%`,
                          backgroundColor: goal.color,
                        }}
                      />
                    </div>
                  </div>

                  <div className="edith-goal-item-footer">
                    <div className="edith-goal-meta-left">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{goal.deadline}</span>
                    </div>
                    <div className="edith-goal-meta-right">
                      <span>
                        {goal.tasksDone} of {goal.tasksTotal} subtasks
                      </span>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 ml-1" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Priority Tasks & Pending Approvals */}
        <div className="edith-dashboard-right-col">
          {/* Pending Policy Approval Card (Figure 9 & Section 5.11) */}
          {pendingApprovals.length > 0 && (
            <div className="edith-panel-card approval-alert-border">
              <div className="edith-panel-header">
                <div className="edith-panel-title-wrap">
                  <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />
                  <h2 className="edith-panel-title text-amber-300">
                    Pending Human Approval (Policy Engine Gate)
                  </h2>
                </div>
                <span className="edith-status-pill waiting">REQUIRES SIGN-OFF</span>
              </div>

              {pendingApprovals.map((appr) => (
                <div key={appr.id} className="edith-approval-content-box">
                  <div className="edith-approval-meta-row">
                    <span className="edith-approval-tool-badge">
                      <FileCode2 className="w-3.5 h-3.5" />
                      {appr.tool}()
                    </span>
                    <span className="edith-approval-risk-badge medium">MEDIUM RISK</span>
                    <span className="edith-approval-time">{appr.timestamp}</span>
                  </div>

                  <div className="edith-approval-resource-row">
                    <span className="text-slate-400">Target:</span>
                    <span className="font-mono text-cyan-300">{appr.targetResource}</span>
                  </div>

                  <p className="edith-approval-action-text">{appr.proposedAction}</p>

                  {/* Diff Snippet Preview */}
                  {appr.diffPreview && (
                    <div className="edith-approval-diff-box">
                      <div className="edith-diff-header">Unified Diff Preview</div>
                      <pre className="edith-diff-content">{appr.diffPreview}</pre>
                    </div>
                  )}

                  <div className="edith-approval-actions-row">
                    <button
                      className="edith-btn-approve"
                      onClick={() => approveAction(appr.id)}
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve & Dispatch</span>
                    </button>
                    <button
                      className="edith-btn-reject"
                      onClick={() => rejectAction(appr.id)}
                    >
                      <X className="w-4 h-4" />
                      <span>Reject Call</span>
                    </button>
                    <button
                      className="edith-btn-detail"
                      onClick={() => openApprovalModal(appr)}
                    >
                      <span>Full Rationale</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Today's Priority Tasks (Section 7.1) */}
          <div className="edith-panel-card">
            <div className="edith-panel-header">
              <div className="edith-panel-title-wrap">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <h2 className="edith-panel-title">Today's Priority Tasks</h2>
              </div>
              <span className="edith-badge-counter">{priorityTasks.length} Prioritized</span>
            </div>

            <div className="edith-priority-tasks-list">
              {priorityTasks.map((task) => (
                <div key={task.id} className="edith-priority-task-card">
                  <div className="edith-priority-task-top">
                    <div className="edith-priority-task-header">
                      <span className="edith-priority-goal-tag">{task.goalTitle}</span>
                      <span
                        className={`edith-priority-tag ${
                          task.priority === 'CRITICAL'
                            ? 'critical'
                            : task.priority === 'HIGH'
                            ? 'high'
                            : 'normal'
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>
                    <h3 className="edith-priority-task-title">{task.title}</h3>
                  </div>

                  {/* Decision Explanation Box (Chapter 7.4) */}
                  <div className="edith-decision-explanation-box">
                    <div className="edith-decision-header">
                      <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>Decision Rationale (Chapter 7.4)</span>
                    </div>
                    <p className="edith-decision-text">{task.decisionExplanation}</p>
                  </div>

                  <div className="edith-priority-task-footer">
                    <div className="edith-task-meta-left">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{task.deadlineNotice}</span>
                      <span className="edith-dot-separator">·</span>
                      <span>Effort: {task.effort}</span>
                    </div>
                    <button
                      className="edith-task-action-btn"
                      onClick={() => {
                        setSelectedGoalId(task.goalId)
                        setActiveView('goals')
                      }}
                    >
                      <span>Inspect DAG</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
