import React from 'react'
import {
  LayoutDashboard,
  GitFork,
  Clock,
  Database,
  Search,
  ShieldCheck,
  BarChart3,
  PlayCircle,
  Network,
  MessageSquareCode,
  CheckCircle2,
  Server,
  Lock,
} from 'lucide-react'
import { useEdithAppStore, type EdithView } from '../../store/useEdithAppStore'

interface NavItem {
  id: EdithView
  label: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string | number
  badgeType?: 'normal' | 'info' | 'alert'
  chapter?: string
}

export const EdithSidebar: React.FC = () => {
  const { activeView, setActiveView, approvals, goals, memories } = useEdithAppStore()

  const pendingApprovalsCount = approvals.filter((a) => a.status === 'WAITING_APPROVAL').length

  const coreNav: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      chapter: '7.1',
    },
    {
      id: 'goals',
      label: 'Goal Workspace & DAG',
      icon: GitFork,
      badge: goals.length,
      badgeType: 'normal',
      chapter: '7.2 / 5.9',
    },
    {
      id: 'timeline',
      label: 'Execution Timeline',
      icon: Clock,
      chapter: '7.3 / 6.2',
    },
  ]

  const cognitiveNav: NavItem[] = [
    {
      id: 'memory',
      label: 'Hybrid Memory',
      icon: Database,
      badge: memories.length,
      badgeType: 'info',
      chapter: '5.4',
    },
    {
      id: 'rag',
      label: 'Knowledge System (RAG)',
      icon: Search,
      chapter: '5.5',
    },
    {
      id: 'policy',
      label: 'Policy Engine & Defense',
      icon: ShieldCheck,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
      badgeType: 'alert',
      chapter: '5.11 / 5.12',
    },
  ]

  const evalNav: NavItem[] = [
    {
      id: 'benchmark',
      label: 'Empirical Benchmark',
      icon: BarChart3,
      badge: '+47%',
      badgeType: 'info',
      chapter: '10',
    },
    {
      id: 'scenarios',
      label: 'Interactive Scenarios',
      icon: PlayCircle,
      badge: '4 Demos',
      badgeType: 'normal',
      chapter: '8',
    },
    {
      id: 'architecture',
      label: '6-Layer Architecture',
      icon: Network,
      chapter: '5',
    },
    {
      id: 'chat',
      label: 'Agent Copilot',
      icon: MessageSquareCode,
      chapter: 'Copilot',
    },
  ]

  const renderNavSection = (title: string, items: NavItem[]) => (
    <div className="edith-nav-section">
      <div className="edith-nav-section-title">{title}</div>
      <div className="edith-nav-list">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = activeView === item.id
          return (
            <button
              key={item.id}
              className={`edith-nav-btn ${isActive ? 'active' : ''}`}
              onClick={() => setActiveView(item.id)}
            >
              <div className="edith-nav-btn-left">
                <Icon className={`edith-nav-icon ${isActive ? 'active' : ''}`} />
                <div className="edith-nav-label-wrap">
                  <span className="edith-nav-label">{item.label}</span>
                  {item.chapter && (
                    <span className="edith-nav-chapter">Ch. {item.chapter}</span>
                  )}
                </div>
              </div>
              {item.badge !== undefined && (
                <span className={`edith-nav-badge ${item.badgeType || 'normal'}`}>
                  {item.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )

  return (
    <aside className="edith-sidebar">
      <div className="edith-sidebar-nav-container">
        {renderNavSection('Core Workspace', coreNav)}
        {renderNavSection('Cognitive Subsystems', cognitiveNav)}
        {renderNavSection('Research & Evaluation', evalNav)}
      </div>

      {/* System Posture Telemetry Box */}
      <div className="edith-sidebar-footer">
        <div className="edith-footer-header">
          <div className="edith-footer-title">
            <Server className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <span>Operational Posture</span>
          </div>
          <span className="edith-footer-chip online">HEALTHY</span>
        </div>

        <div className="edith-posture-list">
          <div className="edith-posture-item">
            <span className="edith-posture-label">Database</span>
            <span className="edith-posture-val">PostgreSQL 16 (8 tables)</span>
          </div>
          <div className="edith-posture-item">
            <span className="edith-posture-label">Vector RAG</span>
            <span className="edith-posture-val">pgvector (1536d / cosine)</span>
          </div>
          <div className="edith-posture-item">
            <span className="edith-posture-label">Policy Gate</span>
            <span className="edith-posture-val">3-Tier Deterministic</span>
          </div>
          <div className="edith-posture-item">
            <span className="edith-posture-label">Verifier Pass Rate</span>
            <span className="edith-posture-val highlight">94.6% (1st Try)</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
