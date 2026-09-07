import { useState } from 'react'
import { FileText, Columns2, Eye } from 'lucide-react'
import { CodeMirrorEditor } from './CodeMirrorEditor'
import { MarkdownPreview } from './MarkdownPreview'
import { useEdithStore } from '../../store/useEdithStore'

type ViewMode = 'split' | 'editor' | 'preview'

export function EditorPane() {
  const selectedFile = useEdithStore((s) => s.selectedFile)
  const editorDirty = useEdithStore((s) => s.editorDirty)
  const saveCurrentFile = useEdithStore((s) => s.saveCurrentFile)
  const [mode, setMode] = useState<ViewMode>('editor')

  if (!selectedFile) {
    return (
      <div className="empty-panel">
        <FileText size={25} />
        <strong>No file selected</strong>
        <span>Select a file from the explorer to start editing.</span>
      </div>
    )
  }

  const fileName = selectedFile.name.replace(/\.md$/, '')

  return (
    <div className="editor-pane" style={{ minWidth: 0 }}>
      {/* Toolbar */}
      <div className="editor-toolbar">
        <span className="editor-filename">
          {fileName}
          {editorDirty && <span className="dirty-dot"> •</span>}
        </span>
        <div className="editor-mode-buttons">
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
            title="Split view"
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
              title="Save (Ctrl+S)"
            >
              Save
            </button>
          )}
        </div>
      </div>

      {/* Editor / Preview area */}
      <div className="editor-content-area" style={{ minWidth: 0 }}>
        {mode === 'editor' && (
          <div className="editor-panel-full">
            <CodeMirrorEditor />
          </div>
        )}
        {mode === 'preview' && (
          <div className="preview-panel-full">
            <MarkdownPreview />
          </div>
        )}
        {mode === 'split' && (
          <div className="editor-split-container">
            <div className="editor-split-left">
              <CodeMirrorEditor />
            </div>
            <div className="editor-split-divider" />
            <div className="editor-split-right">
              <MarkdownPreview />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
