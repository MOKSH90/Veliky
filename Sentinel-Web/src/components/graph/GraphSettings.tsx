import { useState } from 'react'
import { ChevronRight, ChevronDown, RotateCcw, X, Plus } from 'lucide-react'
import { useEdithStore } from '../../store/useEdithStore'

interface SectionProps {
  title: string
  children: React.ReactNode
}

function Section({ title, children }: SectionProps) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`obsidian-setting-section ${open ? 'open' : ''}`}>
      <button className="obsidian-setting-header" onClick={() => setOpen(!open)}>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <span>{title}</span>
      </button>
      {open && <div className="obsidian-setting-content">{children}</div>}
    </div>
  )
}

import { Settings2 } from "lucide-react"
import { useEffect } from 'react'

export function GraphSettings() {
  const [settingsOpen, setSettingsOpen] = useState(true)
  const settings = useEdithStore((s) => s.graphSettings)
  const setSettings = useEdithStore((s) => s.setGraphSettings)

  useEffect(() => {
    if (settings.forces && settings.forces.centerForce === 0.02) {
      setSettings(s => ({...s, forces: { centerForce: 0.15, repelForce: 30, linkForce: 1, linkDistance: 40 }}))
    }
  }, [settings.forces, setSettings])

  const updateFilters = (k: keyof typeof settings.filters, v: any) =>
    setSettings((s) => ({ ...s, filters: { ...s.filters, [k]: v } }))
  const updateDisplay = (k: keyof typeof settings.display, v: any) =>
    setSettings((s) => ({ ...s, display: { ...s.display, [k]: v } }))
  const updateForces = (k: keyof typeof settings.forces, v: any) =>
    setSettings((s) => ({ ...s, forces: { ...s.forces, [k]: v } }))

  if (!settingsOpen) return <button className="obsidian-settings-toggle" onClick={() => setSettingsOpen(true)}><Settings2 size={16}/></button>

  return (
    <div className="obsidian-graph-settings">
      <div className="obsidian-settings-top">
        <button className="icon-btn" onClick={() => setSettings((s) => ({
          ...s,
          filters: { search: '', orphans: true },
          display: { arrows: false, textFade: 0.5, nodeSize: 1, linkThickness: 1, animate: true },
          forces: { centerForce: 0.1, repelForce: 50, linkForce: 1, linkDistance: 40 }
        }))}><RotateCcw size={14}/></button>
        <button className="icon-btn" onClick={() => setSettingsOpen(false)}><X size={14}/></button>
      </div>

      <Section title="Filters">
        <div className="setting-row">
          <input 
            type="text" 
            placeholder="Search files..." 
            value={settings.filters.search}
            onChange={(e) => updateFilters('search', e.target.value)}
            className="obsidian-input"
          />
        </div>
        <label className="setting-row toggle-row">
          <span>Show orphans</span>
          <input 
            type="checkbox" 
            checked={settings.filters.orphans}
            onChange={(e) => updateFilters('orphans', e.target.checked)}
          />
        </label>
      </Section>

      <Section title="Groups">
        {(settings.groups || []).map((g, i) => (
          <div key={i} className="setting-row group-row">
            <input type="color" value={g.color} onChange={(e) => {
              const newGroups = [...(settings.groups || [])]
              newGroups[i].color = e.target.value
              setSettings((s) => ({ ...s, groups: newGroups }))
            }} />
            <input type="text" value={g.query} onChange={(e) => {
              const newGroups = [...(settings.groups || [])]
              newGroups[i].query = e.target.value
              setSettings((s) => ({ ...s, groups: newGroups }))
            }} className="obsidian-input" />
            <button className="icon-btn" onClick={() => {
              const newGroups = (settings.groups || []).filter((_, idx) => idx !== i)
              setSettings((s) => ({ ...s, groups: newGroups }))
            }}><X size={12}/></button>
          </div>
        ))}
        <button className="obsidian-add-btn" onClick={() => {
          setSettings((s) => ({ ...s, groups: [...s.groups, { query: '', color: '#ff5555' }] }))
        }}><Plus size={12}/> New group</button>
      </Section>

      <Section title="Display">
        <label className="setting-row toggle-row">
          <span>Arrows</span>
          <input type="checkbox" checked={settings.display.arrows} onChange={(e) => updateDisplay('arrows', e.target.checked)} />
        </label>
        <label className="setting-row slider-row">
          <span>Text fade threshold</span>
          <input type="range" min="0" max="1" step="0.1" value={settings.display.textFade} onChange={(e) => updateDisplay('textFade', parseFloat(e.target.value))} />
        </label>
        <label className="setting-row slider-row">
          <span>Node size</span>
          <input type="range" min="0.1" max="3" step="0.1" value={settings.display.nodeSize} onChange={(e) => updateDisplay('nodeSize', parseFloat(e.target.value))} />
        </label>
        <label className="setting-row slider-row">
          <span>Link thickness</span>
          <input type="range" min="0.1" max="3" step="0.1" value={settings.display.linkThickness} onChange={(e) => updateDisplay('linkThickness', parseFloat(e.target.value))} />
        </label>
        <label className="setting-row toggle-row">
          <span>Animate</span>
          <input type="checkbox" checked={settings.display.animate} onChange={(e) => updateDisplay('animate', e.target.checked)} />
        </label>
      </Section>

      <Section title="Forces">
        <label className="setting-row slider-row">
          <span>Center force</span>
          <input type="range" min="0" max="0.5" step="0.01" value={settings.forces.centerForce} onChange={(e) => updateForces('centerForce', parseFloat(e.target.value))} />
        </label>
        <label className="setting-row slider-row">
          <span>Repel force</span>
          <input type="range" min="0" max="200" step="1" value={settings.forces.repelForce} onChange={(e) => updateForces('repelForce', parseFloat(e.target.value))} />
        </label>
        <label className="setting-row slider-row">
          <span>Link force</span>
          <input type="range" min="0" max="2" step="0.1" value={settings.forces.linkForce} onChange={(e) => updateForces('linkForce', parseFloat(e.target.value))} />
        </label>
        <label className="setting-row slider-row">
          <span>Link distance</span>
          <input type="range" min="10" max="150" step="1" value={settings.forces.linkDistance} onChange={(e) => updateForces('linkDistance', parseFloat(e.target.value))} />
        </label>
      </Section>
    </div>
  )
}
