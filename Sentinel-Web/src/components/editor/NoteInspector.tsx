import { useState, useMemo } from 'react'
import { 
  Link, 
  Unlink, 
  ExternalLink, 
  ShieldAlert, 
  FileText, 
  Copy, 
  Check, 
  Hash, 
  Clock, 
  User, 
  FilePlus2,
  Cpu,
  ChevronRight
} from 'lucide-react'
import { useEdithStore } from '../../store/useEdithStore'
import { 
  flattenTree, 
  basename, 
  getLinkedMentions, 
  getUnlinkedMentions, 
  getOutgoingLinks,
  parseFrontmatter
} from '../../lib/wikilinkParser'
import { getClearanceColor, getRoleBadgeStyle } from '../../lib/authPersonas'

interface Props {
  onInsertTemplate: (templateText: string) => void
}

const NOTE_TEMPLATES = [
  {
    id: 'equipment',
    name: 'Equipment Master Record',
    description: 'ISO 10816 specification & process connectivity',
    template: `---
equipment_id: "TAG-XXX"
name: "Equipment Name"
category: "Rotating Equipment"
unit: "Unit 2 Bottoms Transfer"
clearance_level: "INTERNAL"
trust_level: "source-document"
criticality: "High"
connected_equipment:
  - "[[Pump-P204]]"
sops:
  - "[[SOP-Pump-Maintenance]]"
last_inspected: "${new Date().toISOString().split('T')[0]}"
timestamp: "${new Date().toISOString()}"
---

# Equipment Master Record: TAG-XXX

## Technical Specifications
- **Design Standard**: ISO 10816-3 Category 2
- **Rated Speed**: 1480 RPM
- **Baseline Vibration**: 2.8 mm/s RMS

## Process Connectivity
- Linked to [[Pump-P204]] and [[SOP-Pump-Maintenance]].
`
  },
  {
    id: 'inspection',
    name: 'Condition Inspection Report',
    description: 'Vibration spectral analysis & ISO Zone classification',
    template: `---
report_id: "IR-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}"
title: "Vibration Condition Monitoring & Inspection"
equipment_id: "P-204"
inspection_date: "${new Date().toISOString().split('T')[0]}"
inspector: "Vibration Analyst"
clearance_level: "CONFIDENTIAL"
trust_level: "source-document"
status: "Attention Required"
timestamp: "${new Date().toISOString()}"
---

# Condition Monitoring Inspection Report

## 1. Executive Summary
Inspection of [[Pump-P204]] indicates elevated vibration in ISO Zone C.

## 2. Measurement Data
- **Current Reading**: 5.4 mm/s RMS
- **Baseline Reading**: 2.8 mm/s RMS
- **Harmonics**: 1X peak and 2X shaft misalignment observed.
`
  },
  {
    id: 'investigation',
    name: 'Root Cause Investigation (AI Verified)',
    description: 'Evidence-backed verified investigation report',
    template: `---
investigation_id: "INV-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}"
target_entity: "P-204"
domain: "industrial"
verdict: "ATTENTION_REQUIRED"
confidence_score: 0.94
policy_tier: "REQUIRES_APPROVAL"
clearance_level: "CONFIDENTIAL"
trust_level: "verified-by-tool"
timestamp: "${new Date().toISOString()}"
---

# Verified Industrial Investigation

## 1. Key Evidence & Source Citations
- **Source**: [[Inspection-Report-62]]
- **Threshold Rule**: [[SOP-Pump-Maintenance]]

## 2. Sandboxed Calculations (Independently Verified)
- Percentage Drift: \`((5.4 - 2.8) / 2.8) * 100 = 92.86%\` [VERIFIED MATCH]

## 3. Recommended Actions
1. Schedule laser alignment work order.
`
  },
  {
    id: 'tacit_knowledge',
    name: 'Tacit Knowledge Capture (Diff 7.0)',
    description: 'Plant tribal knowledge and actual engineering solution',
    template: `---
capture_id: "TACIT-${Math.floor(1000 + Math.random() * 9000)}"
title: "Tacit Knowledge: Coupling Realignment Nuance"
equipment_target: "P-204"
solved_by: "Employee-Rakesh"
verified_by: "Manager-Sharma"
clearance_level: "INTERNAL"
trust_level: "human-asserted"
timestamp: "${new Date().toISOString()}"
---

# Tacit Knowledge: Real-World Solution Note

## Problem Observed
Coupling spacer on [[Pump-P204]] showed recurring 2X vibration peak after thermal expansion.

## Actual Field Solution
Do not align strictly to cold baseline dial indicator specs. Account for 0.08 mm thermal rise on the pump casing relative to the cold electric motor. Realigned with thermal offset eliminated the 2X vibration harmonic entirely.
`
  }
]

export function NoteInspector({ onInsertTemplate }: Props) {
  const selectedFile = useEdithStore((s) => s.selectedFile)
  const files = useEdithStore((s) => s.files)
  const openFileByPath = useEdithStore((s) => s.openFileByPath)
  const setEditorContent = useEdithStore((s) => s.setEditorContent)
  const saveCurrentFile = useEdithStore((s) => s.saveCurrentFile)

  const [activeTab, setActiveTab] = useState<'backlinks' | 'unlinked' | 'outgoing' | 'meta' | 'templates'>('backlinks')
  const [copiedLink, setCopiedLink] = useState(false)

  const flatFiles = useMemo(() => flattenTree(files), [files])

  // Compute Linked Mentions (Backlinks)
  const linkedMentions = useMemo(() => {
    if (!selectedFile) return []
    return getLinkedMentions(selectedFile.path, flatFiles)
  }, [selectedFile, flatFiles])

  // Compute Unlinked Mentions
  const unlinkedMentions = useMemo(() => {
    if (!selectedFile) return []
    return getUnlinkedMentions(selectedFile.path, flatFiles)
  }, [selectedFile, flatFiles])

  // Compute Outgoing Links
  const outgoingLinks = useMemo(() => {
    if (!selectedFile || !selectedFile.content) return []
    return getOutgoingLinks(selectedFile.content, flatFiles)
  }, [selectedFile, flatFiles])

  // Parse Frontmatter
  const parsed = useMemo(() => {
    if (!selectedFile || !selectedFile.content) return { metadata: {}, body: '' }
    return parseFrontmatter(selectedFile.content)
  }, [selectedFile])

  if (!selectedFile) return null

  const noteTitle = basename(selectedFile.name, '.md')

  const copyWikilink = () => {
    navigator.clipboard.writeText(`[[${noteTitle}]]`)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  // Convert unlinked mention to wikilink
  const handleLinkMention = (mentionFile: string, textToReplace: string) => {
    const target = flatFiles.find(f => f.path === mentionFile)
    if (!target || !target.content) return

    const regex = new RegExp(`\\b${textToReplace}\\b`, 'g')
    const newContent = target.content.replace(regex, `[[${noteTitle}]]`)
    
    // If target is active file, update active editor
    if (target.path === selectedFile.path) {
      setEditorContent(newContent)
      saveCurrentFile()
    } else {
      // Switch to target, update and save
      openFileByPath(target.path)
      setTimeout(() => {
        setEditorContent(newContent)
        saveCurrentFile()
      }, 50)
    }
  }

  const clearanceColor = getClearanceColor(selectedFile.clearance)

  return (
    <div style={{
      width: '320px',
      borderLeft: '1px solid rgba(255, 255, 255, 0.08)',
      background: 'rgba(18, 18, 22, 0.95)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      fontSize: '12px'
    }}>
      {/* Top Note Title Bar */}
      <div style={{
        padding: '12px 14px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          <FileText size={14} className="text-cyan-400" />
          <span style={{ fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {noteTitle}
          </span>
        </div>
        <button
          type="button"
          onClick={copyWikilink}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '4px',
            color: copiedLink ? '#10b981' : 'rgba(255, 255, 255, 0.7)',
            fontSize: '10px',
            padding: '3px 6px',
            cursor: 'pointer'
          }}
          title="Copy Wikilink [[Note]]"
        >
          {copiedLink ? <Check size={11} /> : <Copy size={11} />}
          <span>{copiedLink ? 'Copied' : '[[Link]]'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        background: 'rgba(0, 0, 0, 0.2)'
      }}>
        <button
          type="button"
          onClick={() => setActiveTab('backlinks')}
          style={{
            flex: 1,
            padding: '8px 4px',
            border: 'none',
            background: activeTab === 'backlinks' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
            color: activeTab === 'backlinks' ? '#818cf8' : 'rgba(255, 255, 255, 0.5)',
            borderBottom: `2px solid ${activeTab === 'backlinks' ? '#818cf8' : 'transparent'}`,
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Backlinks ({linkedMentions.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('unlinked')}
          style={{
            flex: 1,
            padding: '8px 4px',
            border: 'none',
            background: activeTab === 'unlinked' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
            color: activeTab === 'unlinked' ? '#818cf8' : 'rgba(255, 255, 255, 0.5)',
            borderBottom: `2px solid ${activeTab === 'unlinked' ? '#818cf8' : 'transparent'}`,
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Unlinked ({unlinkedMentions.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('outgoing')}
          style={{
            flex: 1,
            padding: '8px 4px',
            border: 'none',
            background: activeTab === 'outgoing' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
            color: activeTab === 'outgoing' ? '#818cf8' : 'rgba(255, 255, 255, 0.5)',
            borderBottom: `2px solid ${activeTab === 'outgoing' ? '#818cf8' : 'transparent'}`,
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Outgoing ({outgoingLinks.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('meta')}
          style={{
            flex: 1,
            padding: '8px 4px',
            border: 'none',
            background: activeTab === 'meta' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
            color: activeTab === 'meta' ? '#818cf8' : 'rgba(255, 255, 255, 0.5)',
            borderBottom: `2px solid ${activeTab === 'meta' ? '#818cf8' : 'transparent'}`,
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Meta
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('templates')}
          style={{
            flex: 1,
            padding: '8px 4px',
            border: 'none',
            background: activeTab === 'templates' ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
            color: activeTab === 'templates' ? '#818cf8' : 'rgba(255, 255, 255, 0.5)',
            borderBottom: `2px solid ${activeTab === 'templates' ? '#818cf8' : 'transparent'}`,
            fontSize: '11px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Templates
        </button>
      </div>

      {/* Tab Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
        {/* TAB 1: BACKLINKS (LINKED MENTIONS) */}
        {activeTab === 'backlinks' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '4px' }}>
              Notes that link to <b>[[{noteTitle}]]</b>
            </div>
            {linkedMentions.length > 0 ? (
              linkedMentions.map((mention, idx) => (
                <div
                  key={idx}
                  onClick={() => openFileByPath(mention.sourcePath)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    borderRadius: '6px',
                    padding: '8px 10px',
                    cursor: 'pointer',
                    transition: 'background 0.1s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, color: '#818cf8' }}>{mention.sourceTitle}</span>
                    <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.3)' }}>Line {mention.line}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.7)', fontStyle: 'italic', wordBreak: 'break-word' }}>
                    "{mention.snippet}"
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 10px', color: 'rgba(255, 255, 255, 0.3)' }}>
                No incoming backlinks found.
              </div>
            )}
          </div>
        )}

        {/* TAB 2: UNLINKED MENTIONS */}
        {activeTab === 'unlinked' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '4px' }}>
              Notes that mention "{noteTitle}" without a wikilink:
            </div>
            {unlinkedMentions.length > 0 ? (
              unlinkedMentions.map((mention, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    borderRadius: '6px',
                    padding: '8px 10px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, color: '#fff' }}>{mention.sourceTitle}</span>
                    <button
                      type="button"
                      onClick={() => handleLinkMention(mention.sourcePath, mention.matchedText)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: 'rgba(99, 102, 241, 0.2)',
                        border: '1px solid rgba(99, 102, 241, 0.4)',
                        borderRadius: '4px',
                        color: '#818cf8',
                        fontSize: '10px',
                        fontWeight: 600,
                        padding: '2px 6px',
                        cursor: 'pointer'
                      }}
                      title="Convert mention into [[wikilink]]"
                    >
                      <Link size={10} /> + Link
                    </button>
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)', fontStyle: 'italic', wordBreak: 'break-word' }}>
                    "{mention.snippet}"
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 10px', color: 'rgba(255, 255, 255, 0.3)' }}>
                No unlinked mentions found.
              </div>
            )}
          </div>
        )}

        {/* TAB 3: OUTGOING LINKS */}
        {activeTab === 'outgoing' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '4px' }}>
              Notes referenced by <b>{noteTitle}</b>:
            </div>
            {outgoingLinks.length > 0 ? (
              outgoingLinks.map((out, idx) => (
                <div
                  key={idx}
                  onClick={() => out.resolvedPath && openFileByPath(out.resolvedPath)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    cursor: out.exists ? 'pointer' : 'default'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ExternalLink size={12} color={out.exists ? '#818cf8' : 'rgba(255,255,255,0.3)'} />
                    <span style={{ fontWeight: 600, color: out.exists ? '#fff' : 'rgba(255,255,255,0.4)' }}>
                      {out.target}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    padding: '2px 5px',
                    borderRadius: '3px',
                    background: out.exists ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: out.exists ? '#34d399' : '#f87171'
                  }}>
                    {out.exists ? 'RESOLVED' : 'DANGLING'}
                  </span>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '24px 10px', color: 'rgba(255, 255, 255, 0.3)' }}>
                No outgoing wikilinks in this note.
              </div>
            )}
          </div>
        )}

        {/* TAB 4: METADATA & PROVENANCE */}
        {activeTab === 'meta' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {/* Provenance Badge */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '6px', padding: '10px' }}>
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '4px' }}>PROVENANCE TRUST TIER</span>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                color: selectedFile.trustLevel === 'verified-by-tool' ? '#10b981' : selectedFile.trustLevel === 'ai-inferred' ? '#06b6d4' : selectedFile.trustLevel === 'human-asserted' ? '#f59e0b' : '#3b82f6',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <Cpu size={13} />
                {(selectedFile.trustLevel || 'source-document').toUpperCase()}
              </span>
            </div>

            {/* Security Clearance */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '6px', padding: '10px' }}>
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '4px' }}>CLEARANCE REQUIREMENT</span>
              <span style={{
                fontSize: '11px',
                fontWeight: 700,
                color: clearanceColor,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <ShieldAlert size={13} />
                {selectedFile.clearance || 'INTERNAL'}
              </span>
            </div>

            {/* CAS SHA-256 Hash */}
            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '6px', padding: '10px' }}>
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '4px' }}>CONTENT-ADDRESSED CAS SHA-256</span>
              <code style={{ fontSize: '10px', color: '#94a3b8', wordBreak: 'break-all', display: 'block' }}>
                {selectedFile.sha256 || '9f2c8d88e0b19d42ac92c4314777d12f11ae88090510d9ce45bc493540dbef71'}
              </code>
            </div>

            {/* Frontmatter Key-Values */}
            {Object.keys(parsed.metadata).length > 0 && (
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '6px', padding: '10px' }}>
                <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', display: 'block', marginBottom: '6px' }}>FRONTMATTER ATTRIBUTES</span>
                {Object.entries(parsed.metadata).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '3px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '10px' }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>{k}:</span>
                    <span style={{ color: '#fff', fontWeight: 500 }}>{String(v)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: TEMPLATES */}
        {activeTab === 'templates' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', marginBottom: '4px' }}>
              Insert Industrial Note Template:
            </div>
            {NOTE_TEMPLATES.map((tmpl) => (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => onInsertTemplate(tmpl.template)}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  padding: '10px',
                  borderRadius: '6px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'background 0.1s ease'
                }}
              >
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#818cf8', marginBottom: '2px' }}>
                    {tmpl.name}
                  </div>
                  <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.5)' }}>
                    {tmpl.description}
                  </div>
                </div>
                <FilePlus2 size={14} color="#818cf8" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
