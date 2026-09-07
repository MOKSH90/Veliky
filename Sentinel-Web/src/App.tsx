import { useEffect } from 'react'
import { AuthPage } from './pages/Auth'
import { WorkspaceSetupPage } from './pages/WorkspaceSetup'
import { WorkspacePage } from './pages/Workspace'
import { useEdithStore } from './store/useEdithStore'

export default function App() {
  const stage = useEdithStore((s) => s.stage)
  const setCurrentWorkspaceById = useEdithStore((s) => s.setCurrentWorkspaceById)

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('workspace')
    if (id) setCurrentWorkspaceById(id)
  }, [setCurrentWorkspaceById])

  if (stage === 'auth') return <AuthPage />
  if (stage === 'picker' || stage === 'initializing') return <WorkspaceSetupPage />
  return <WorkspacePage />
}
