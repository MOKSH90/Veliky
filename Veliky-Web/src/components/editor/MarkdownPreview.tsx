import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useEdithStore } from '../../store/useEdithStore'
import { resolveWikilink, flattenTree } from '../../lib/wikilinkParser'

// Replace [[wikilinks]] with clickable markdown links before rendering
function preprocessWikilinks(content: string): string {
  return content.replace(
    /\[\[([^\[\]|#]+?)(?:#([^\[\]|]*))?(?:\|([^\[\]]*))?\]\]/g,
    (_match, target, _anchor, alias) => {
      const display = alias ?? target
      return `[${display}](wikilink://${encodeURIComponent(target)})`
    }
  )
}

export function MarkdownPreview() {
  const content = useEdithStore((s) => s.editorContent)
  const files = useEdithStore((s) => s.files)
  const openFileByPath = useEdithStore((s) => s.openFileByPath)

  const processed = preprocessWikilinks(content)

  return (
    <div className="markdown-preview">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a({ href, children }) {
            if (href?.startsWith('wikilink://')) {
              const target = decodeURIComponent(href.replace('wikilink://', ''))
              const flat = flattenTree(files)
              const resolved = resolveWikilink(target, flat)
              return (
                <a
                  onClick={(e) => {
                    e.preventDefault()
                    if (resolved) openFileByPath(resolved.path)
                  }}
                  className="wikilink-anchor"
                  style={{ cursor: 'pointer', color: 'var(--accent, #9d7cff)', textDecoration: 'underline' }}
                >
                  {children}
                </a>
              )
            }
            return (
              <a href={href} target="_blank" rel="noreferrer">
                {children}
              </a>
            )
          },
        }}
      >
        {processed}
      </ReactMarkdown>
    </div>
  )
}
