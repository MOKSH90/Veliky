import { useMemo } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { markdown } from '@codemirror/lang-markdown'
import { oneDark } from '@codemirror/theme-one-dark'
import { EditorView } from '@codemirror/view'
import { autocompletion, type CompletionContext } from '@codemirror/autocomplete'
import { useEdithStore } from '../../store/useEdithStore'
import { resolveWikilink, flattenTree, basename } from '../../lib/wikilinkParser'

export function CodeMirrorEditor() {
  const content = useEdithStore((s) => s.editorContent)
  const setContent = useEdithStore((s) => s.setEditorContent)
  const files = useEdithStore((s) => s.files)
  const openFileByPath = useEdithStore((s) => s.openFileByPath)

  // Click handler for [[wikilinks]] in CodeMirror
  const wikilinkClickHandler = useMemo(() => {
    return EditorView.domEventHandlers({
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
  }, [files, openFileByPath])

  // Autocompletion provider for [[wikilinks]]
  const wikilinkAutocomplete = useMemo(() => {
    return autocompletion({
      override: [
        (context: CompletionContext) => {
          const word = context.matchBefore(/\[\[([^\]]*)$/)
          if (!word) return null

          const query = word.text.slice(2).toLowerCase()
          const flat = flattenTree(files).filter((f) => f.type === 'file')

          return {
            from: word.from + 2,
            options: flat
              .map((f) => {
                const title = basename(f.name, '.md')
                return {
                  label: title,
                  detail: f.path,
                  type: 'text',
                  apply: `${title}]]`,
                  boost: f.clearance === 'INTERNAL' ? 2 : 1
                }
              })
              .filter((opt) => opt.label.toLowerCase().includes(query)),
          }
        },
      ],
    })
  }, [files])

  return (
    <CodeMirror
      value={content}
      height="100%"
      extensions={[
        markdown(),
        oneDark,
        EditorView.lineWrapping,
        wikilinkClickHandler,
        wikilinkAutocomplete,
      ]}
      onChange={setContent}
      basicSetup={{
        lineNumbers: true,
        foldGutter: true,
        highlightActiveLine: true,
        searchKeymap: true,
        bracketMatching: true,
        closeBrackets: true,
        autocompletion: true,
      }}
      style={{ height: '100%', width: '100%', minWidth: 0, overflowX: 'hidden', fontSize: '14px' }}
    />
  )
}
