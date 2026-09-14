import type { ReactNode } from 'react'
import { TopBar } from './TopBar'
import { Sidebar } from './Sidebar'
import { ProjectBar } from './ProjectBar'
import { ProfilePanel } from '../profile/ProfilePanel'
import { HistoryPanel } from '../history/HistoryPanel'

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell" style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <TopBar />
      <div className="body-shell" style={{ flex: '1 1 0%', minHeight: 0, height: '100%', overflow: 'hidden' }}>
        <Sidebar />
        <div className="workspace-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0, overflow: 'hidden' }}>
          <main className="main-workspace">
            {children}
          </main>
          <ProjectBar />
        </div>
      </div>
      <HistoryPanel />
      <ProfilePanel />
    </div>
  )
}
