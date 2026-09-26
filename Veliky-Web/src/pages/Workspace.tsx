import { lazy, Suspense, useEffect, useRef } from 'react'
import { AppShell } from '../components/layout/AppShell'
import { OverviewView } from '../components/views/OverviewView'
import { AgentWorkspace } from '../components/agent/AgentWorkspace'
import { AssetsView } from '../components/views/AssetsView'
import { ThreatIntelligenceView } from '../components/views/ThreatIntelligenceView'
import { DetectionView } from '../components/views/DetectionView'
import { IncidentsView } from '../components/views/IncidentsView'
import { MonitoringView } from '../components/views/MonitoringView'
import { AnalyticsView } from '../components/views/AnalyticsView'
import { ReportsView } from '../components/views/ReportsView'
import { SettingsView } from '../components/views/SettingsView'
import { FilesView } from '../components/files/FilesView'
import { MemoryView } from '../components/memory/MemoryView'
import { ActivityView } from '../components/activity/ActivityView'
import { useVelikyStore } from '../store/useVelikySOCStore'
import type { ActiveView } from '../lib/types'

const GraphView = lazy(() =>
  import('../components/graph/GraphView').then((mod) => ({ default: mod.GraphView }))
)

const VALID_VIEWS: ActiveView[] = [
  'overview',
  'agent',
  'assets',
  'threats',
  'detection',
  'incidents',
  'monitoring',
  'analytics',
  'reports',
  'settings',
  'workspace',
  'graph',
  'memory',
  'activity',
]

export function WorkspacePage() {
  const view = useVelikyStore((s) => s.activeView)
  const setView = useVelikyStore((s) => s.setActiveView)
  const initialRoute = useRef(true)

  useEffect(() => {
    const syncFromUrl = () => {
      const requestedView = new URLSearchParams(window.location.search).get('view')
      if (requestedView && VALID_VIEWS.includes(requestedView as ActiveView)) {
        setView(requestedView as ActiveView)
      }
    }
    syncFromUrl()
    window.addEventListener('popstate', syncFromUrl)
    return () => window.removeEventListener('popstate', syncFromUrl)
  }, [setView])

  useEffect(() => {
    if (initialRoute.current) {
      initialRoute.current = false
      return
    }
    const url = new URL(window.location.href)
    if (url.searchParams.get('view') === view) return
    url.searchParams.set('view', view)
    window.history.pushState({}, '', url)
  }, [view])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && useVelikyStore.getState().activeView !== 'agent') {
        setView('agent')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setView])

  const renderActiveView = () => {
    switch (view) {
      case 'overview':
        return <OverviewView />
      case 'agent':
        return <AgentWorkspace />
      case 'assets':
        return <AssetsView />
      case 'threats':
        return <ThreatIntelligenceView />
      case 'detection':
        return <DetectionView />
      case 'incidents':
        return <IncidentsView />
      case 'monitoring':
        return <MonitoringView />
      case 'analytics':
        return <AnalyticsView />
      case 'reports':
        return <ReportsView />
      case 'settings':
        return <SettingsView />
      case 'workspace':
        return <FilesView />
      case 'graph':
        return <GraphView />
      case 'memory':
        return <MemoryView />
      case 'activity':
        return <ActivityView />
      default:
        return <OverviewView />
    }
  }

  return (
    <AppShell>
      <Suspense fallback={<div className="view-loader">Loading sovereign workbench view…</div>}>
        {renderActiveView()}
      </Suspense>
    </AppShell>
  )
}
export default WorkspacePage
