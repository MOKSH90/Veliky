import { useState } from 'react'
import { 
  Layers, 
  Search, 
  Filter, 
  ExternalLink, 
  AlertTriangle, 
  CheckCircle2, 
  Cpu, 
  Activity, 
  Gauge, 
  Thermometer, 
  Radio, 
  FileText, 
  Sliders, 
  Lock,
  ArrowRight,
  Zap,
  Image as ImageIcon
} from 'lucide-react'
import { useSentinelStore } from '../../store/useSentinelSOCStore'
import type { IndustrialAsset } from '../../lib/types'

export function AssetsView() {
  const assets = useSentinelStore((s) => s.assets)
  const selectedAssetId = useSentinelStore((s) => s.selectedAssetId)
  const setSelectedAssetId = useSentinelStore((s) => s.setSelectedAssetId)
  const setIntelPanelOpen = useSentinelStore((s) => s.setIntelPanelOpen)
  const setActiveView = useSentinelStore((s) => s.setActiveView)

  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [drawingModalOpen, setDrawingModalOpen] = useState(false)

  const categories = ['ALL', 'Rotating Equipment', 'Pressure Vessel', 'Exchanger', 'Safety System', 'ICS Controller', 'AI Inference Cluster']

  const filteredAssets = assets.filter(a => {
    if (categoryFilter !== 'ALL' && a.category !== categoryFilter) return false
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return a.id.toLowerCase().includes(q) || a.name.toLowerCase().includes(q) || a.unit.toLowerCase().includes(q)
    }
    return true
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', padding: '16px 20px', gap: '16px' }}>
      {/* Top Header & Metrics */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={18} style={{ color: 'var(--soc-primary)' }} />
            <h2 style={{ margin: 0, fontSize: '16px', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--soc-text-high)' }}>
              INFRASTRUCTURE ASSET REGISTRY
            </h2>
          </div>
          <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--soc-text-muted)' }}>
            Physical Process Infrastructure & Sovereign Compute Cluster Inventory (ISO 10816-3 Benchmark)
          </p>
        </div>

        {/* Action button to view P&ID */}
        <button 
          type="button" 
          className="soc-btn soc-btn-primary"
          onClick={() => setDrawingModalOpen(true)}
          style={{ gap: '6px' }}
        >
          <ImageIcon size={13} /> View Unit 2 P&ID Drawing
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--soc-bg-surface)',
          border: '1px solid var(--soc-border-subtle)',
          borderRadius: '6px',
          padding: '8px 12px',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
          <Search size={14} style={{ color: 'var(--soc-text-dim)' }} />
          <input
            type="text"
            placeholder="Search assets by tag, equipment name, or process unit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="soc-input"
            style={{ width: '320px' }}
          />
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', overflowX: 'auto' }}>
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              style={{
                background: categoryFilter === cat ? 'var(--soc-primary-subtle)' : 'transparent',
                border: `1px solid ${categoryFilter === cat ? 'var(--soc-primary)' : 'transparent'}`,
                color: categoryFilter === cat ? 'var(--soc-primary)' : 'var(--soc-text-dim)',
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '10px',
                fontFamily: 'var(--font-mono)',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Assets Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '14px' }}>
        {filteredAssets.map((asset) => {
          const isSelected = selectedAssetId === asset.id
          const isAlert = asset.status === 'ATTENTION_REQUIRED'

          return (
            <div 
              key={asset.id} 
              className="soc-plate"
              style={{
                borderColor: isSelected 
                  ? 'var(--soc-primary)' 
                  : isAlert 
                  ? 'rgba(239, 68, 68, 0.4)' 
                  : 'var(--soc-border-subtle)',
                background: isSelected ? 'var(--soc-bg-card)' : 'var(--soc-bg-surface)',
                boxShadow: isAlert ? '0 0 15px rgba(239, 68, 68, 0.1)' : undefined
              }}
            >
              {/* Card Header */}
              <div className="soc-plate-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="soc-dot red" style={{ display: isAlert ? 'inline-block' : 'none' }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', fontWeight: 700, color: 'var(--soc-text-high)' }}>
                    {asset.id}
                  </span>
                  <span style={{ color: 'var(--soc-text-dim)', fontSize: '11px' }}>·</span>
                  <span style={{ fontSize: '11px', color: 'var(--soc-text-muted)' }}>{asset.category}</span>
                </div>
                <span className={`soc-badge ${isAlert ? 'badge-critical' : asset.status === 'ARMED' ? 'badge-warning' : 'badge-normal'}`}>
                  {asset.status}
                </span>
              </div>

              {/* Card Body */}
              <div className="soc-plate-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div>
                  <h4 style={{ margin: '0 0 2px 0', fontSize: '13px', color: 'var(--soc-text-high)', fontWeight: 600 }}>
                    {asset.name}
                  </h4>
                  <span style={{ fontSize: '10px', color: 'var(--soc-text-dim)', fontFamily: 'var(--font-mono)' }}>
                    {asset.unit}
                  </span>
                </div>

                {/* Live Telemetry Bar */}
                {asset.telemetry.rmsVelocity !== undefined && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: 'var(--soc-bg-elevated)', border: '1px solid var(--soc-border-subtle)', padding: '8px 10px', borderRadius: '4px' }}>
                    <div>
                      <div style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--soc-text-muted)' }}>RMS VELOCITY</div>
                      <div style={{ fontSize: '16px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: isAlert ? 'var(--soc-red)' : 'var(--soc-text-high)' }}>
                        {asset.telemetry.rmsVelocity} mm/s
                      </div>
                      <div style={{ fontSize: '9px', color: 'var(--soc-text-dim)' }}>
                        ISO Zone: <b>{asset.isoZone?.replace('_', ' ') || 'Zone B'}</b>
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '9px', fontFamily: 'var(--font-mono)', color: 'var(--soc-text-muted)' }}>BEARING TEMP</div>
                      <div style={{ fontSize: '16px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: asset.telemetry.temperatureC && asset.telemetry.temperatureC > 65 ? 'var(--soc-amber)' : 'var(--soc-text-high)' }}>
                        {asset.telemetry.temperatureC}°C
                      </div>
                      <div style={{ fontSize: '9px', color: 'var(--soc-text-dim)' }}>Threshold: 70°C</div>
                    </div>
                  </div>
                )}

                {/* Specs and details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '11px', color: 'var(--soc-text-main)' }}>
                  {asset.driver && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--soc-text-muted)' }}>Driver:</span>
                      <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }}>{asset.driver.split(',')[0]}</span>
                    </div>
                  )}
                  {asset.bearings && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--soc-text-muted)' }}>Bearings:</span>
                      <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }}>{asset.bearings}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--soc-text-muted)' }}>Clearance:</span>
                    <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', color: 'var(--soc-primary)' }}>
                      {asset.clearanceLevel}
                    </span>
                  </div>
                </div>

                {/* Connected Downstream Units */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px' }}>
                  <span style={{ color: 'var(--soc-text-muted)', fontFamily: 'var(--font-mono)' }}>Downstream:</span>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {asset.connectedAssetIds.map((cid) => (
                      <span key={cid} className="soc-badge badge-dim" style={{ padding: '1px 5px', fontSize: '9px' }}>
                        {cid}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Action footer */}
                <div style={{ display: 'flex', gap: '6px', marginTop: '4px', borderTop: '1px solid var(--soc-border-subtle)', paddingTop: '8px' }}>
                  <button
                    type="button"
                    className="soc-btn soc-btn-primary"
                    style={{ flex: 1, fontSize: '10px', padding: '5px' }}
                    onClick={() => {
                      setSelectedAssetId(asset.id)
                      setIntelPanelOpen(true)
                    }}
                  >
                    Contextual Intel
                  </button>
                  <button
                    type="button"
                    className="soc-btn soc-btn-ghost"
                    style={{ fontSize: '10px', padding: '5px' }}
                    onClick={() => {
                      setSelectedAssetId(asset.id)
                      setActiveView('monitoring')
                    }}
                    title="Open Live Sensor Stream"
                  >
                    Telemetry
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* P&ID Drawing Modal */}
      {drawingModalOpen && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px'
          }}
        >
          <div 
            style={{
              width: '800px',
              maxWidth: '95vw',
              background: 'var(--soc-bg-card)',
              border: '1px solid var(--soc-border-medium)',
              borderRadius: '8px',
              boxShadow: '0 12px 48px rgba(0,0,0,0.8)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div className="soc-plate-header" style={{ padding: '12px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ImageIcon size={16} style={{ color: 'var(--soc-primary)' }} />
                <span className="soc-plate-title">Unit 2 Bottoms Transfer & Preheat P&ID Schematic</span>
              </div>
              <button 
                type="button" 
                className="soc-btn soc-btn-ghost" 
                onClick={() => setDrawingModalOpen(false)}
              >
                Close
              </button>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px', background: '#05070a' }}>
              {/* Synthetic P&ID Vector Diagram */}
              <div style={{ width: '100%', height: '320px', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', background: '#080b11', position: 'relative' }}>
                <svg viewBox="0 0 760 300" style={{ width: '100%', height: '100%' }}>
                  {/* Grid Lines */}
                  <pattern id="pidGrid" width="20" height="20" patternUnits="userSpaceOnUse">
                    <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
                  </pattern>
                  <rect width="760" height="300" fill="url(#pidGrid)" />

                  {/* Piping Lines */}
                  <path d="M 80 150 L 220 150 L 220 150 L 380 150 L 520 150 L 680 150" fill="none" stroke="#64748b" strokeWidth="2.5" />
                  <path d="M 300 150 L 300 90 L 460 90 L 460 150" fill="none" stroke="#64748b" strokeWidth="1.5" strokeDasharray="4 4" />

                  {/* Surge Drum TK-101 */}
                  <rect x="40" y="100" width="60" height="100" rx="20" fill="#141822" stroke="#06b6d4" strokeWidth="1.5" />
                  <text x="70" y="155" fill="#f8fafc" fontFamily="var(--font-mono)" fontSize="10px" textAnchor="middle" fontWeight="700">TK-101</text>
                  <text x="70" y="170" fill="#64748b" fontFamily="var(--font-mono)" fontSize="8px" textAnchor="middle">Surge Drum</text>

                  {/* Pump P-204 */}
                  <circle cx="260" cy="150" r="28" fill="#1f1515" stroke="#ef4444" strokeWidth="2" />
                  <text x="260" y="153" fill="#ef4444" fontFamily="var(--font-mono)" fontSize="11px" textAnchor="middle" fontWeight="700">P-204</text>
                  <text x="260" y="195" fill="#ef4444" fontFamily="var(--font-mono)" fontSize="9px" textAnchor="middle" fontWeight="700">Zone C Alert (5.4 mm/s)</text>

                  {/* Emergency Valve V-19 */}
                  <polygon points="360,140 380,150 360,160" fill="#141822" stroke="#f59e0b" strokeWidth="1.5" />
                  <polygon points="400,140 380,150 400,160" fill="#141822" stroke="#f59e0b" strokeWidth="1.5" />
                  <text x="380" y="130" fill="#f59e0b" fontFamily="var(--font-mono)" fontSize="9px" textAnchor="middle">V-19 (ESD)</text>

                  {/* Heat Exchanger E-201 */}
                  <circle cx="480" cy="150" r="22" fill="#141822" stroke="#3b82f6" strokeWidth="1.5" />
                  <line x1="465" y1="135" x2="495" y2="165" stroke="#3b82f6" strokeWidth="1" />
                  <line x1="465" y1="165" x2="495" y2="135" stroke="#3b82f6" strokeWidth="1" />
                  <text x="480" y="188" fill="#cbd5e1" fontFamily="var(--font-mono)" fontSize="9px" textAnchor="middle">E-201</text>

                  {/* Compressor C-104 */}
                  <rect x="620" y="120" width="60" height="60" rx="4" fill="#141822" stroke="#10b981" strokeWidth="1.5" />
                  <text x="650" y="153" fill="#10b981" fontFamily="var(--font-mono)" fontSize="11px" textAnchor="middle" fontWeight="700">C-104</text>
                  <text x="650" y="195" fill="#10b981" fontFamily="var(--font-mono)" fontSize="8px" textAnchor="middle">Wet Gas Comp</text>
                </svg>
              </div>

              <div style={{ fontSize: '11px', color: 'var(--soc-text-main)', display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)' }}>
                <span>Standard: ANSI/ISA-5.1 Instrumentation & Piping</span>
                <span style={{ color: 'var(--soc-red)' }}>Highlighted: Hydraulic interdependency from P-204 to C-104</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
