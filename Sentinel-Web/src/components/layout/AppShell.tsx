import { useEffect, type ReactNode } from 'react'
import { GlobalTopBar } from './GlobalTopBar'
import { SidebarNav } from './SidebarNav'
import { RightIntelligencePanel } from './RightIntelligencePanel'
import { ProfilePanel } from '../profile/ProfilePanel'
import { HistoryPanel } from '../history/HistoryPanel'
import { useSentinelStore } from '../../store/useSentinelSOCStore'

export function AppShell({ children }: { children: ReactNode }) {
  const theme = useSentinelStore((s) => s.theme)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    // Prevent and recover from any accidental horizontal scroll drift
    const resetScroll = () => {
      if (window.scrollX !== 0) window.scrollTo(0, window.scrollY)
      if (document.documentElement.scrollLeft !== 0) document.documentElement.scrollLeft = 0
      if (document.body.scrollLeft !== 0) document.body.scrollLeft = 0
    }
    resetScroll()
    window.addEventListener('resize', resetScroll)
    return () => window.removeEventListener('resize', resetScroll)
  }, [])

  return (
    <div className="sentinel-app-shell" data-theme={theme}>
      <GlobalTopBar />
      <div className="sentinel-main-container">
        <SidebarNav />
        <main className="sentinel-workspace">
          {children}
        </main>
        <RightIntelligencePanel />
      </div>
      <HistoryPanel />
      <ProfilePanel />
    </div>
  )
}
