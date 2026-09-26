import React from 'react'
import { useEdithAppStore } from '../../store/useEdithAppStore'
import { EdithTopBar } from './EdithTopBar'
import { EdithSidebar } from './EdithSidebar'
import { EdithDashboard } from './EdithDashboard'
import { EdithGoalWorkspace } from './EdithGoalWorkspace'
import { EdithExecutionTimeline } from './EdithExecutionTimeline'
import { EdithHybridMemory } from './EdithHybridMemory'
import { EdithKnowledgeRag } from './EdithKnowledgeRag'
import { EdithPolicyEngine } from './EdithPolicyEngine'
import { EdithScenarios } from './EdithScenarios'
import { EdithBenchmark } from './EdithBenchmark'
import { EdithArchitecture } from './EdithArchitecture'
import { EdithAgentChat } from './EdithAgentChat'
import { EdithApprovalModal } from './EdithApprovalModal'

export const EdithAppShell: React.FC = () => {
  const { activeView } = useEdithAppStore()

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <EdithDashboard />
      case 'goals':
        return <EdithGoalWorkspace />
      case 'timeline':
        return <EdithExecutionTimeline />
      case 'memory':
        return <EdithHybridMemory />
      case 'rag':
        return <EdithKnowledgeRag />
      case 'policy':
        return <EdithPolicyEngine />
      case 'scenarios':
        return <EdithScenarios />
      case 'benchmark':
        return <EdithBenchmark />
      case 'architecture':
        return <EdithArchitecture />
      case 'chat':
        return <EdithAgentChat />
      default:
        return <EdithDashboard />
    }
  }

  return (
    <div className="edith-app-shell">
      {/* Top Bar Header */}
      <EdithTopBar />

      {/* Main Container: Sidebar + Viewport */}
      <div className="edith-main-body">
        <EdithSidebar />
        <main className="edith-viewport-container">
          {renderActiveView()}
        </main>
      </div>

      {/* Global Human-in-the-Loop Policy Approval Modal */}
      <EdithApprovalModal />
    </div>
  )
}
export default EdithAppShell
