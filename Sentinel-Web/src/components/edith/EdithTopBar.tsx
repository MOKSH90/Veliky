import React, { useState, useEffect } from 'react'
import {
  Cpu,
  ShieldCheck,
  Clock,
  Play,
  AlertTriangle,
  Layers,
  GraduationCap,
  Activity,
  CheckCircle2,
} from 'lucide-react'
import { useEdithAppStore } from '../../store/useEdithAppStore'

export const EdithTopBar: React.FC = () => {
  const {
    activeView,
    setActiveView,
    goals,
    selectedGoalId,
    orchestratorStatus,
    approvals,
    openApprovalModal,
    runFastVerticalSliceDemo,
    isScenarioRunning,
  } = useEdithAppStore()

  const [istTime, setIstTime] = useState('')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      const timeStr = now.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
      setIstTime(`${timeStr} IST`)
    }
    updateTime()
    const timer = setInterval(updateTime, 1000)
    return () => clearInterval(timer)
  }, [])

  const currentGoal = goals.find((g) => g.id === selectedGoalId) || goals[0]
  const pendingApprovals = approvals.filter((a) => a.status === 'WAITING_APPROVAL')

  return (
    <header className="edith-topbar">
      {/* Brand & University Info */}
      <div className="edith-topbar-brand">
        <button
          className="edith-brand-btn"
          onClick={() => setActiveView('dashboard')}
          title="Return to Executive Dashboard"
        >
          <div className="edith-brand-icon">
            <Cpu className="w-5 h-5 text-indigo-400" />
          </div>
          <div className="edith-brand-text">
            <span className="edith-brand-title">E.D.I.T.H.</span>
            <span className="edith-brand-sub">Personal AI OS</span>
          </div>
        </button>

        <div className="edith-header-divider" />

        <div className="edith-academic-tag" title="Kurukshetra University, P.I.E.T. Department of CSE">
          <GraduationCap className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>K.U. / P.I.E.T. CSE Final Year Project</span>
        </div>
      </div>

      {/* Center: Active Goal Pill & Orchestrator Telemetry */}
      <div className="edith-topbar-center">
        {currentGoal && (
          <button
            className="edith-goal-pill"
            onClick={() => setActiveView('goals')}
            title={`Active Goal: ${currentGoal.title} (${currentGoal.progress}% completed)`}
          >
            <span
              className="edith-goal-pill-dot"
              style={{ backgroundColor: currentGoal.color }}
            />
            <span className="edith-goal-pill-name">{currentGoal.title}</span>
            <span className="edith-goal-pill-pct">{currentGoal.progress}%</span>
            <div className="edith-goal-mini-bar">
              <div
                className="edith-goal-mini-fill"
                style={{
                  width: `${currentGoal.progress}%`,
                  backgroundColor: currentGoal.color,
                }}
              />
            </div>
          </button>
        )}

        {/* Live Orchestrator Posture */}
        <div
          className={`edith-orchestrator-status ${
            orchestratorStatus === 'EXECUTING'
              ? 'executing'
              : orchestratorStatus === 'VERIFYING'
              ? 'verifying'
              : orchestratorStatus === 'WAITING_APPROVAL'
              ? 'waiting'
              : 'idle'
          }`}
          title="Section 5.8: Orchestrator Pipeline State"
        >
          <span
            className={`edith-pulse-dot ${
              orchestratorStatus === 'EXECUTING'
                ? 'cyan'
                : orchestratorStatus === 'VERIFYING'
                ? 'emerald'
                : orchestratorStatus === 'WAITING_APPROVAL'
                ? 'amber'
                : 'emerald'
            }`}
          />
          <span className="edith-orchestrator-label">
            ORCHESTRATOR: {orchestratorStatus}
          </span>
        </div>

        {/* Deterministic Verifier Badge */}
        <div className="edith-pill-badge verified" title="Section 6.3: Deterministic Post-Condition Verifier">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Verifier Active (94.6%)</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="edith-topbar-right">
        {/* Pending Approvals Button */}
        {pendingApprovals.length > 0 && (
          <button
            className="edith-approval-alert-btn"
            onClick={() => openApprovalModal(pendingApprovals[0])}
            title={`${pendingApprovals.length} human-in-the-loop approval(s) waiting`}
          >
            <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />
            <span>Policy Gate</span>
            <span className="edith-approval-badge">{pendingApprovals.length}</span>
          </button>
        )}

        {/* Quick Demo Trigger for Chapter 8.4 Vertical Slice */}
        <button
          className="edith-demo-trigger-btn"
          onClick={() => runFastVerticalSliceDemo()}
          disabled={isScenarioRunning}
          title="Execute the complete Chapter 8.4 Document Organization vertical slice"
        >
          <Play className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
          <span>{isScenarioRunning ? 'Running Slice...' : 'Run Demo Slice (8.4)'}</span>
        </button>

        {/* Real-time IST Clock */}
        <div className="edith-clock-pill">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{istTime || '12:41:00 IST'}</span>
        </div>
      </div>
    </header>
  )
}
