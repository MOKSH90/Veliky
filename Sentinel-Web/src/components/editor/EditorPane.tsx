import { useState } from 'react'
import { 
  FileText, 
  Columns2, 
  Eye, 
  PanelRightClose, 
  PanelRight, 
  ShieldAlert, 
  Lock, 
  Users, 
  Save, 
  Copy,
  Check
} from 'lucide-react'
import { CodeMirrorEditor } from './CodeMirrorEditor'
import { MarkdownPreview } from './MarkdownPreview'
import { NoteInspector } from './NoteInspector'
import { useEdithStore } from '../../store/useEdithStore'
import { checkClearance, getClearanceColor } from '../../lib/authPersonas'

type ViewMode = 'split' | 'editor' | 'preview'

export function EditorPane() {
  const selectedFile = useEdithStore((s) => s.selectedFile)
  const editorDirty = useEdithStore((s) => s.editorDirty)
  const saveCurrentFile = useEdithStore((s) => s.saveCurrentFile)
  const setEditorContent = useEdithStore((s) => s.setEditorContent)
  const editorContent = useEdithStore((s) => s.editorContent)
  const user = useEdithStore((s) => s.authUser)
  const switchSovereignPersona = useEdithStore((s) => s.switchSovereignPersona)

  const [mode, setMode] = useState<ViewMode>('split')
  const [inspectorOpen, setInspectorOpen] = useState(true)
  const [copiedLink, setCopiedLink] = useState(false)

  if (!selectedFile) {
    return (
      <div className="empty-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', gap: '10px' }}>
        <FileText size={32} />
        <strong style={{ fontSize: '15px', color: '#fff' }}>No Note Selected</strong>
        <span style={{ fontSize: '12px' }}>Select an equipment, SOP, or investigation note from the explorer, or press Ctrl+O.</span>
      </div>
    )
  }

  const hasAccess = checkClearance(user?.clearance, selectedFile.clearance)
  const fileName = selectedFile.name.replace(/\.md$/, '')
  const clearanceColor = getClearanceColor(selectedFile.clearance)

  const copyWikilink = () => {
    navigator.clipboard.writeText(`[[${fileName}]]`)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const handleInsertTemplate = (templateText: string) => {
    setEditorContent(templateText)
    saveCurrentFile()
  }

  // Clearance Violation Screen
  if (!hasAccess) {
    return (
      <div style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '30px',
        textAlign: 'center',
        background: 'rgba(239, 68, 68, 0.03)'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '20px'
        }}>
          <Lock size={30} color="#ef4444" />
        </div>

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: '6px',
          background: 'rgba(239, 68, 68, 0.15)',
          color: '#f87171',
          fontSize: '11px',
          fontWeight: 700,
          letterSpacing: '0.06em',
          marginBottom: '12px'
        }}>
          <ShieldAlert size={14} /> SECURITY CLEARANCE VIOLATION · ACCESS REDACTED
        </div>

        <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#fff', margin: '0 0 10px' }}>
          {fileName}.md
        </h2>

        <p style={{ maxWidth: '520px', fontSize: '13px', color: 'rgba(255, 255, 255, 0.65)', lineHeight: 1.6, marginBottom: '24px' }}>
          Under SENTINEL Sovereign Policy 26117 §5.5 & §15 (Permission-Aware Retrieval & RBAC), viewing this industrial document requires 
          <b style={{ color: clearanceColor, margin: '0 4px' }}>{selectedFile.clearance}</b> clearance. 
          Your active clearance level is <b style={{ color: '#fff' }}>{user?.clearance || 'INTERNAL'}</b>.
        </p>

        <div style={{
          display: 'flex',
          gap: '16px',
          padding: '16px',
          borderRadius: '8px',
          background: 'rgba(0, 0, 0, 0.4)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          marginBottom: '24px',
          textAlign: 'left'
        }}>
          <div>
            <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.4)', display: 'block' }}>REQUIRED CLEARANCE</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: clearanceColor }}>{selectedFile.clearance}</span>
          </div>
          <div style={{ width: '1px', background: 'rgba(255, 255, 255, 0.1)' }} />
          <div>
            <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.4)', display: 'block' }}>CURRENT CLEARANCE</span>
            <span style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>{user?.clearance || 'INTERNAL'} (Level {user?.clearanceLevel || 2})</span>
          </div>
        </div>

        {/* Elevate or Switch Persona */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={() => switchSovereignPersona('user-rajesh-sharma')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 18px',
              borderRadius: '8px',
              background: 'rgba(99, 102, 241, 0.2)',
              border: '1px solid rgba(99, 102, 241, 0.4)',
              color: '#818cf8',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Users size={14} />
            <span>Switch to Admin (Dr. Sharma)</span>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="editor-pane" style={{ minWidth: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <div className="editor-toolbar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px', borderBottom: '1px solid var(--surface-border)', background: 'var(--surface-bg)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <span className="editor-filename" style={{ fontWeight: 700, fontSize: '14px', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileText size={15} className="text-cyan-400" />
            {fileName}
            {editorDirty && <span className="dirty-dot" style={{ color: '#f59e0b' }}> •</span>}
          </span>

          {selectedFile.clearance && (
            <span style={{
              fontSize: '10px',
              fontWeight: 700,
              padding: '2px 6px',
              borderRadius: '4px',
              background: `${clearanceColor}20`,
              color: clearanceColor,
              border: `1px solid ${clearanceColor}40`
            }}>
              {selectedFile.clearance}
            </span>
          )}

          <button
            type="button"
            onClick={copyWikilink}
            style={{
              background: 'transparent',
              border: 'none',
              color: copiedLink ? '#10b981' : 'rgba(255, 255, 255, 0.4)',
              fontSize: '11px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              marginLeft: '4px'
            }}
            title="Copy [[wikilink]]"
          >
            {copiedLink ? <Check size={12} /> : <Copy size={12} />}
            <span>{copiedLink ? 'Copied' : `[[${fileName}]]`}</span>
          </button>
        </div>

        <div className="editor-mode-buttons" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            className={`editor-mode-btn ${mode === 'editor' ? 'active' : ''}`}
            onClick={() => setMode('editor')}
            title="Editor only"
          >
            <FileText size={14} />
          </button>
          <button
            className={`editor-mode-btn ${mode === 'split' ? 'active' : ''}`}
            onClick={() => setMode('split')}
            title="Split view (Live Preview)"
          >
            <Columns2 size={14} />
          </button>
          <button
            className={`editor-mode-btn ${mode === 'preview' ? 'active' : ''}`}
            onClick={() => setMode('preview')}
            title="Preview only"
          >
            <Eye size={14} />
          </button>

          {editorDirty && (
            <button
              className="editor-save-btn"
              onClick={saveCurrentFile}
              title="Save changes (Ctrl+S)"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                background: 'rgba(99, 102, 241, 0.3)',
                border: '1px solid rgba(99, 102, 241, 0.6)',
                color: '#fff',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <Save size={12} /> Save
            </button>
          )}

          <button
            type="button"
            onClick={() => setInspectorOpen(!inspectorOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 8px',
              borderRadius: '6px',
              background: inspectorOpen ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${inspectorOpen ? 'rgba(99, 102, 241, 0.4)' : 'rgba(255, 255, 255, 0.08)'}`,
              color: inspectorOpen ? '#818cf8' : 'rgba(255, 255, 255, 0.6)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              marginLeft: '6px'
            }}
            title="Toggle Obsidian Backlinks & Metadata Inspector"
          >
            {inspectorOpen ? <PanelRightClose size={13} /> : <PanelRight size={13} />}
            <span>Inspector</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Area (Editor + Inspector) */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0, overflow: 'hidden' }}>
        {/* Editor / Preview content */}
        <div className="editor-content-area" style={{ flex: 1, minWidth: 0, height: '100%', overflow: 'hidden' }}>
          {mode === 'editor' && (
            <div className="editor-panel-full" style={{ height: '100%' }}>
              <CodeMirrorEditor />
            </div>
          )}
          {mode === 'preview' && (
            <div className="preview-panel-full" style={{ height: '100%', overflowY: 'auto' }}>
              <MarkdownPreview />
            </div>
          )}
          {mode === 'split' && (
            <div className="editor-split-container" style={{ display: 'flex', height: '100%', width: '100%' }}>
              <div className="editor-split-left" style={{ flex: 1, height: '100%', minWidth: 0 }}>
                <CodeMirrorEditor />
              </div>
              <div className="editor-split-divider" style={{ width: '1px', background: 'rgba(255, 255, 255, 0.08)' }} />
              <div className="editor-split-right" style={{ flex: 1, height: '100%', minWidth: 0, overflowY: 'auto', padding: '16px' }}>
                <MarkdownPreview />
              </div>
            </div>
          )}
        </div>

        {/* Note Inspector Sidebar */}
        {inspectorOpen && (
          <NoteInspector onInsertTemplate={handleInsertTemplate} />
        )}
      </div>
    </div>
  )
}
