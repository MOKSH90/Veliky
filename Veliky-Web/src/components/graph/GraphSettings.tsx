import { useState } from 'react'
import { ChevronRight, ChevronDown, RotateCcw, X, Settings2, Palette, Sliders, Eye, Filter } from 'lucide-react'
import { useEdithStore } from '../../store/useEdithStore'
import { getTrustColor } from './GraphCanvas'

interface SectionProps {
  title: string
  icon?: React.ReactNode
  defaultOpen?: boolean
  children: React.ReactNode
}

function Section({ title, icon, defaultOpen = false, children }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className={`obsidian-setting-section ${open ? 'open' : ''}`} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <button 
        className="obsidian-setting-header" 
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 12px',
          background: 'transparent',
          border: 'none',
          color: '#e2e8f0',
          fontSize: '12px',
          fontWeight: 600,
          cursor: 'pointer'
        }}
      >
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        {icon}
        <span>{title}</span>
      </button>
      {open && <div className="obsidian-setting-content" style={{ padding: '0 12px 12px' }}>{children}</div>}
    </div>
  )
}

export function GraphSettings() {
  const [settingsOpen, setSettingsOpen] = useState(true)
  const settings = useEdithStore((s) => s.graphSettings)
  const setSettings = useEdithStore((s) => s.setGraphSettings)

  const updateFilters = (k: keyof typeof settings.filters, v: any) =>
    setSettings((s) => ({ ...s, filters: { ...s.filters, [k]: v } }))
  const updateDisplay = (k: keyof typeof settings.display, v: any) =>
    setSettings((s) => ({ ...s, display: { ...s.display, [k]: v } }))
  const updateForces = (k: keyof typeof settings.forces, v: any) =>
    setSettings((s) => ({ ...s, forces: { ...s.forces, [k]: v } }))

  if (!settingsOpen) {
    return (
      <button 
        className="obsidian-settings-toggle" 
        onClick={() => setSettingsOpen(true)}
        style={{
          position: 'absolute',
          top: '60px',
          right: '16px',
          zIndex: 20,
          background: 'rgba(18, 18, 22, 0.9)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          padding: '8px',
          color: '#fff',
          cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(0,0,0,0.5)'
        }}
        title="Graph Settings"
      >
        <Settings2 size={16} />
      </button>
    )
  }

  return (
    <div 
      className="obsidian-graph-settings"
      style={{
        position: 'absolute',
        top: '60px',
        right: '16px',
        width: '280px',
        maxHeight: 'calc(100% - 140px)',
        overflowY: 'auto',
        background: 'rgba(18, 18, 22, 0.95)',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        borderRadius: '12px',
        boxShadow: '0 12px 36px rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(16px)',
        zIndex: 20,
        fontSize: '12px'
      }}
    >
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#fff' }}>
          <Settings2 size={14} className="text-cyan-400" />
          <span>Graph Controls</span>
        </div>
        <div style={{ display: 'flex', gap: '4px' }}>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setSettings((s) => ({
              ...s,
              filters: { search: '', orphans: true, category: 'ALL', clearance: 'ALL' },
              display: { arrows: true, textFade: 0.5, nodeSize: 2.2, linkThickness: 1.5, animate: true, colorMode: 'provenance' },
              forces: { centerForce: 0.15, repelForce: 60, linkForce: 0.8, linkDistance: 45 },
              domainPreset: 'all'
            }))}
            style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: '4px' }}
            title="Reset Settings"
          >
            <RotateCcw size={13} />
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setSettingsOpen(false)}
            style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* SECTION 1: COLORING & PROVENANCE (Sec 6.3) */}
      <Section title="Color & Provenance (Sec 6.3)" icon={<Palette size={13} className="text-indigo-400" />} defaultOpen>
        <div style={{ marginBottom: '10px' }}>
          <label style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.5)', marginBottom: '6px' }}>
            NODE COLOR CODING
          </label>
          <select
            value={settings.display.colorMode}
            onChange={(e) => updateDisplay('colorMode', e.target.value)}
            style={{
              width: '100%',
              padding: '6px 8px',
              background: '#121216',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '11px',
              outline: 'none'
            }}
          >
            <option value="provenance">Provenance Trust (Tool / AI / Human)</option>
            <option value="clearance">Security Clearance (Restricted / Conf / Int)</option>
            <option value="group">Vault Folder Category</option>
          </select>
        </div>

        {/* Provenance Legend */}
        {settings.display.colorMode === 'provenance' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '8px', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', fontSize: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: getTrustColor('verified-by-tool') }} />
              <span style={{ color: '#e2e8f0' }}>Verified by Tool (Green)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: getTrustColor('source-document') }} />
              <span style={{ color: '#e2e8f0' }}>Official Source Doc (Blue)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: getTrustColor('human-asserted') }} />
              <span style={{ color: '#e2e8f0' }}>Human Asserted (Amber)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: getTrustColor('ai-inferred') }} />
              <span style={{ color: '#e2e8f0' }}>AI Inferred / Agent (Cyan)</span>
            </div>
          </div>
        )}
      </Section>

      {/* SECTION 2: FILTERS */}
      <Section title="Filters" icon={<Filter size={13} className="text-cyan-400" />} defaultOpen>
        <div style={{ marginBottom: '10px' }}>
          <input
            type="text"
            placeholder="Search nodes in graph…"
            value={settings.filters.search}
            onChange={(e) => updateFilters('search', e.target.value)}
            style={{
              width: '100%',
              padding: '6px 8px',
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '6px',
              color: '#fff',
              fontSize: '11px',
              outline: 'none'
            }}
          />
        </div>

        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', cursor: 'pointer' }}>
          <span style={{ color: 'rgba(255,255,255,0.7)' }}>Show orphan notes</span>
          <input
            type="checkbox"
            checked={settings.filters.orphans}
            onChange={(e) => updateFilters('orphans', e.target.checked)}
          />
        </label>
      </Section>

      {/* SECTION 3: DISPLAY */}
      <Section title="Display" icon={<Eye size={13} className="text-emerald-400" />}>
        <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', cursor: 'pointer' }}>
          <span style={{ color: 'rgba(255,255,255,0.7)' }}>Directional arrows</span>
          <input
            type="checkbox"
            checked={settings.display.arrows}
            onChange={(e) => updateDisplay('arrows', e.target.checked)}
          />
        </label>

        <div style={{ marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginBottom: '2px' }}>
            <span>Node size</span>
            <span>{settings.display.nodeSize}x</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="4"
            step="0.1"
            value={settings.display.nodeSize}
            onChange={(e) => updateDisplay('nodeSize', parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginBottom: '2px' }}>
            <span>Link thickness</span>
            <span>{settings.display.linkThickness}px</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="4"
            step="0.2"
            value={settings.display.linkThickness}
            onChange={(e) => updateDisplay('linkThickness', parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
      </Section>

      {/* SECTION 4: PHYSICS FORCES */}
      <Section title="Physics Forces" icon={<Sliders size={13} className="text-amber-400" />}>
        <div style={{ marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginBottom: '2px' }}>
            <span>Center force</span>
            <span>{settings.forces.centerForce}</span>
          </div>
          <input
            type="range"
            min="0"
            max="0.5"
            step="0.01"
            value={settings.forces.centerForce}
            onChange={(e) => updateForces('centerForce', parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginBottom: '2px' }}>
            <span>Repel force</span>
            <span>{settings.forces.repelForce}</span>
          </div>
          <input
            type="range"
            min="10"
            max="150"
            step="5"
            value={settings.forces.repelForce}
            onChange={(e) => updateForces('repelForce', parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>

        <div style={{ marginBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: 'rgba(255,255,255,0.5)', marginBottom: '2px' }}>
            <span>Link distance</span>
            <span>{settings.forces.linkDistance}px</span>
          </div>
          <input
            type="range"
            min="15"
            max="150"
            step="5"
            value={settings.forces.linkDistance}
            onChange={(e) => updateForces('linkDistance', parseFloat(e.target.value))}
            style={{ width: '100%' }}
          />
        </div>
      </Section>
    </div>
  )
}
