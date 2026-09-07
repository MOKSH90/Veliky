import CodeMirror from '@uiw/react-codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { oneDark } from '@codemirror/theme-one-dark'
import { EditorView } from '@codemirror/view'
import { useEdithStore } from '../../store/useEdithStore'
import { resolveWikilink, flattenTree } from '../../lib/wikilinkParser'

export function CodeMirrorEditor() {
  const content = useEdithStore((s) => s.editorContent)
  const setContent = useEdithStore((s) => s.setEditorContent)
  const files = useEdithStore((s) => s.files)
  const openFileByPath = useEdithStore((s) => s.openFileByPath)

  // Click handler for [[wikilinks]] in the editor
  const wikilinkClickHandler = EditorView.domEventHandlers({
    click(event, view) {
      const pos = view.posAtCoords({ x: event.clientX, y: event.clientY })
      if (pos === null) return false

      const doc = view.state.doc.toString()
      const wikilinkRe = /\[\[([^\[\]]+?)\]\]/g
      let match: RegExpExecArray | null
      wikilinkRe.lastIndex = 0
      while ((match = wikilinkRe.exec(doc)) !== null) {
        const start = match.index
        const end = start + match[0].length
        if (pos >= start && pos <= end) {
          const target = match[1].split(/[|#]/)[0].trim()
          const flat = flattenTree(files)
          const resolved = resolveWikilink(target, flat)
          if (resolved) {
            openFileByPath(resolved.path)
            return true
          }
        }
      }
      return false
    },
  })

  return (
    <CodeMirror
      value={content}
      height="100%"
      extensions={[
        markdown(),
        oneDark,
        EditorView.lineWrapping,
        wikilinkClickHandler,
      ]}
      onChange={setContent}
      basicSetup={{
        lineNumbers: false,
        foldGutter: false,
        highlightActiveLine: true,
        searchKeymap: true,
      }}
      style={{ height: '100%', width: '100%', minWidth: 0, overflowX: 'hidden', fontSize: '15px' }}
    />
  )
}
