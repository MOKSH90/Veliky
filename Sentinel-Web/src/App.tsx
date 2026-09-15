import { useEffect } from 'react'
import { AuthPage } from './pages/Auth'
import { WorkspaceSetupPage } from './pages/WorkspaceSetup'
import { WorkspacePage } from './pages/Workspace'
import { useSentinelStore } from './store/useSentinelSOCStore'
import { ErrorBoundary } from './workbench/ErrorBoundary'

export default function App() {
  const stage = useSentinelStore((s) => s.stage)
  const setCurrentWorkspaceById = useSentinelStore((s) => s.setCurrentWorkspaceById)

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('workspace')
    if (id) setCurrentWorkspaceById(id)
  }, [setCurrentWorkspaceById])

  return (
    <ErrorBoundary>
      {stage === 'auth' ? (
        <AuthPage />
      ) : stage === 'picker' || stage === 'initializing' ? (
        <WorkspaceSetupPage />
      ) : (
        <WorkspacePage />
      )}
    </ErrorBoundary>
  )
}
