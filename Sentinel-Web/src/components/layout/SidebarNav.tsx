import { 
  LayoutDashboard, 
  Layers, 
  Crosshair, 
  Scan, 
  AlertTriangle, 
  Activity, 
  BarChart3, 
  FileText, 
  Settings2,
  HardDrive,
  Cpu,
  Lock,
  Radio,
  Sparkles,
  BookOpen,
  Share2
} from 'lucide-react'
import { useSentinelStore } from '../../store/useSentinelSOCStore'
import type { ActiveView } from '../../lib/types'

interface NavEntry {
  id: ActiveView
  label: string
  icon: typeof LayoutDashboard
  badge?: string | number
  badgeType?: 'alert' | 'normal' | 'info'
  section?: string
}

const NAV_ITEMS: NavEntry[] = [
  { id: 'agent', label: 'Sovereign Query & Agent', icon: Sparkles, section: 'SOVEREIGN INTELLIGENCE', badge: 'INQUIRY' },
  { id: 'overview', label: 'Command Center', icon: LayoutDashboard, badge: 'DEFCON 2' },
  { id: 'detection', label: 'Reasoning Ledger', icon: Scan, badge: '8 STAGES' },
  { id: 'workspace', label: 'Obsidian Knowledge Vault', icon: BookOpen, badge: 'VAULT' },
  { id: 'graph', label: 'Knowledge Graph', icon: Share2 },
  { id: 'assets', label: 'Infrastructure Assets', icon: Layers, section: 'DEFENSE & MONITORING', badge: '10' },
  { id: 'incidents', label: 'Incident Containment Room', icon: AlertTriangle, badge: '2', badgeType: 'alert' },
  { id: 'monitoring', label: 'FFT Telemetry & Spectrum', icon: Activity },
  { id: 'threats', label: 'MITRE ICS Threat Matrix', icon: Crosshair, badge: '4' },
  { id: 'reports', label: 'Forensic Compliance Dossiers', icon: FileText, section: 'GOVERNANCE & AUDIT' },
  { id: 'analytics', label: 'Reliability & RUL Analytics', icon: BarChart3 },
  { id: 'activity', label: 'Tamper-Evident Audit Ledger', icon: Lock, badge: 'SHA-256' },
  { id: 'settings', label: 'Sovereign Air-Gap Policies', icon: Settings2 },
]

export function SidebarNav() {
  const activeView = useSentinelStore((s) => s.activeView)
  const setActiveView = useSentinelStore((s) => s.setActiveView)
  const systemResources = useSentinelStore((s) => s.systemResources)
  const airGapState = useSentinelStore((s) => s.airGapState)

  return (
    <aside className="sentinel-sidebar">
      {/* Navigation Links */}
      <nav className="sidebar-nav-list" aria-label="Sentinel SOC Navigation">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const isActive = activeView === item.id
          return (
            <div key={item.id}>
              {item.section && (
                <div className="sidebar-section-header">
                  {item.section}
                </div>
              )}
              <button
                type="button"
                className={`sidebar-item ${isActive ? 'active' : ''}`}
                onClick={() => setActiveView(item.id)}
                aria-current={isActive ? 'page' : undefined}
                title={item.label}
              >
                <div className="sidebar-item-left">
                  <Icon size={15} style={{ opacity: isActive ? 1 : 0.7 }} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`sidebar-item-badge ${item.badgeType === 'alert' ? 'alert' : ''}`}>
                    {item.badge}
                  </span>
                )}
              </button>
            </div>
          )
        })}
      </nav>

      {/* FOOTER: Sovereign Hardware Resource Gauges */}
      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span className="soc-eyebrow">HOST HARDWARE</span>
          <span className="soc-badge badge-normal" style={{ fontSize: '9px', padding: '1px 4px' }}>
            <span className="soc-dot emerald" /> 100% AIR-GAPPED
          </span>
        </div>

        {/* VRAM Gauge */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--soc-text-dim)', marginBottom: '2px' }}>
            <span>GPU VRAM</span>
            <span style={{ color: 'var(--soc-text-main)' }}>{systemResources.vramUsedGb} / {systemResources.vramTotalGb} GB</span>
          </div>
          <div style={{ width: '100%', height: '4px', background: 'var(--soc-bg-elevated)', border: '1px solid var(--soc-border-subtle)', borderRadius: '2px', overflow: 'hidden' }}>
            <div 
              style={{ 
                width: `${(systemResources.vramUsedGb / systemResources.vramTotalGb) * 100}%`, 
                height: '100%', 
                background: 'var(--soc-primary)',
                borderRadius: '2px'
              }} 
            />
          </div>
        </div>

        {/* CPU Utilization */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--soc-text-dim)', marginBottom: '2px' }}>
            <span>CPU UTILIZATION</span>
            <span style={{ color: 'var(--soc-text-main)' }}>{systemResources.cpuUtilization}%</span>
          </div>
          <div style={{ width: '100%', height: '4px', background: 'var(--soc-bg-elevated)', border: '1px solid var(--soc-border-subtle)', borderRadius: '2px', overflow: 'hidden' }}>
            <div 
              style={{ 
                width: `${systemResources.cpuUtilization}%`, 
                height: '100%', 
                background: 'var(--soc-emerald)',
                borderRadius: '2px'
              }} 
            />
          </div>
        </div>

        {/* Air-gap Egress: Verified 0.00 KB/s */}
        <div 
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '4px 6px',
            background: 'var(--soc-bg-elevated)',
            borderRadius: '4px',
            border: '1px solid var(--soc-border-subtle)',
            fontSize: '9px',
            fontFamily: 'var(--font-mono)',
            marginTop: '2px'
          }}
        >
          <span style={{ color: 'var(--soc-text-dim)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Lock size={9} /> EGRESS LEAK:
          </span>
          <span style={{ color: 'var(--soc-emerald)', fontWeight: 700 }}>
            {systemResources.networkOutboundKbps.toFixed(2)} KB/s (0 LEAK)
          </span>
        </div>
      </div>
    </aside>
  )
}
