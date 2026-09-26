import React, { useState, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Copy, Check, Terminal, Bot, FileCode2, BrainCircuit, ChevronDown, ShieldCheck, CheckCircle2 } from 'lucide-react'
import { useVelikyStore } from '../../store/useVelikySOCStore'
import { flattenTree } from '../../lib/wikilinkParser'

function CodeBlock({ className, children }: { className?: string; children: React.ReactNode }) {
  const [copied, setCopied] = useState(false)
  const match = /language-(\w+)/.exec(className || '')
  const language = match ? match[1] : 'code'

  const rawText = Array.isArray(children)
    ? children.map(c => (typeof c === 'string' ? c : String(c ?? ''))).join('')
    : typeof children === 'string'
    ? children
    : String(children ?? '')

  const codeString = rawText.replace(/\n$/, '')

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Single-line inline snippet
  if (!className && !codeString.includes('\n')) {
    return (
      <code 
        style={{
          background: 'var(--soc-bg-elevated)',
          color: 'var(--soc-primary)',
          fontSize: '11px',
          padding: '2px 6px',
          borderRadius: '4px',
          fontFamily: 'var(--font-mono)',
          border: '1px solid var(--soc-border-subtle)',
          display: 'inline-block',
          margin: '2px 0'
        }}
      >
        {codeString}
      </code>
    )
  }

  return (
    <div 
      style={{
        margin: '16px 0',
        borderRadius: '8px',
        border: '1px solid var(--soc-border-subtle)',
        background: 'var(--soc-bg-card)',
        overflow: 'hidden',
        boxShadow: 'var(--soc-shadow-sm)'
      }}
    >
      <div 
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 14px',
          background: 'var(--soc-bg-elevated)',
          borderBottom: '1px solid var(--soc-border-subtle)',
          position: 'sticky',
          top: 0,
          zIndex: 5
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--soc-primary)', fontWeight: 700 }}>
          <Terminal size={13} style={{ color: 'var(--soc-primary)' }} />
          <span style={{ textTransform: 'uppercase' }}>{language}</span>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '11px',
            fontFamily: 'var(--font-mono)',
            padding: '3px 8px',
            borderRadius: '4px',
            background: 'var(--soc-bg-surface)',
            border: '1px solid var(--soc-border-subtle)',
            color: 'var(--soc-text-medium)',
            cursor: 'pointer',
            transition: 'all 0.15s ease'
          }}
        >
          {copied ? (
            <>
              <Check size={12} style={{ color: 'var(--soc-emerald)' }} />
              <span style={{ color: 'var(--soc-emerald)', fontWeight: 600 }}>Copied</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <div 
        style={{
          padding: '12px 14px',
          overflow: 'auto',
          maxHeight: '420px',
          fontSize: '12px',
          fontFamily: 'var(--font-mono)',
          lineHeight: '1.6',
          background: 'var(--soc-bg-card)'
        }}
      >
        <pre style={{ margin: 0, padding: 0, border: 0, background: 'transparent', whiteSpace: 'pre', color: 'var(--soc-text-high)' }}>
          <code>{codeString}</code>
        </pre>
      </div>
    </div>
  )
}

interface MarkdownOutputCanvasProps {
  label: string
  detail: string
  time?: string
  file?: string
  reasoning?: string
  verification?: string
  createdFiles?: Array<{ path: string; content: string }>
  citedSources?: string[]
}

export function MarkdownOutputCanvas({
  label,
  detail,
  time,
  file,
  reasoning,
  verification = 'PASSED',
  createdFiles = [],
  citedSources = []
}: MarkdownOutputCanvasProps) {
  const [thinkingOpen, setThinkingOpen] = useState(false)

  // Transform Obsidian wikilinks [[NoteName]] into clickable anchors
  const processedDetail = useMemo(() => {
    return detail.replace(/\[\[([^\]]+)\]\]/g, (_match, noteName) => {
      return `[🔗 [[${noteName}]]](#vault-open-${encodeURIComponent(noteName)})`
    })
  }, [detail])

  const handleOpenWikilink = (targetName: string) => {
    const cleanPath = targetName.endsWith('.md') ? targetName : `${targetName}.md`
    const flat = flattenTree(useVelikyStore.getState().files)
    const matched = flat.find(
      f =>
        f.path === cleanPath ||
        f.name === cleanPath ||
        f.path.toLowerCase().includes(targetName.toLowerCase()) ||
        f.name.toLowerCase().includes(targetName.toLowerCase())
    )
    if (matched) {
      useVelikyStore.getState().openFileByPath(matched.path)
    } else {
      useVelikyStore.getState().openFileByPath(cleanPath)
    }
  }

  return (
    <div 
      style={{
        width: '100%',
        background: 'var(--soc-bg-surface)',
        border: '1px solid var(--soc-border-subtle)',
        borderRadius: '10px',
        padding: '20px',
        boxShadow: 'var(--soc-shadow-sm)',
        color: 'var(--soc-text-high)',
        margin: '12px 0',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px'
      }}
    >
      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--soc-border-subtle)', paddingBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ padding: '6px', background: 'var(--soc-primary-subtle)', color: 'var(--soc-primary)', borderRadius: '6px' }}>
            <Bot size={18} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: 'var(--soc-primary)', letterSpacing: '0.04em' }}>{label}</h3>
              {verification && (
                <span className="soc-badge badge-normal" style={{ fontSize: '9px' }}>
                  <CheckCircle2 size={10} /> 4-TIER VERIFIED
                </span>
              )}
            </div>
            <p style={{ margin: 0, fontSize: '11px', color: 'var(--soc-text-muted)' }}>Sovereign Agent Engine · Multi-Source Auditable Protocol</p>
          </div>
        </div>
        {time && (
          <time style={{ fontSize: '11px', color: 'var(--soc-text-dim)', fontFamily: 'var(--font-mono)', background: 'var(--soc-bg-elevated)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--soc-border-subtle)' }}>
            {time}
          </time>
        )}
      </div>

      {/* Claude Code Thinking Process Accordion */}
      {reasoning && (
        <div style={{ borderRadius: '6px', border: '1px solid var(--soc-border-subtle)', background: 'var(--soc-bg-elevated)', overflow: 'hidden', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
          <button
            type="button"
            onClick={() => setThinkingOpen(!thinkingOpen)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 12px',
              background: 'transparent',
              border: 'none',
              color: 'var(--soc-primary)',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <BrainCircuit size={13} style={{ color: 'var(--soc-primary)' }} />
              <span>Thinking Process & Cognitive Proof</span>
              <span style={{ fontSize: '9px', background: 'var(--soc-primary-subtle)', color: 'var(--soc-primary)', padding: '1px 5px', borderRadius: '3px' }}>
                CoT Trace
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px' }}>
              <span>{thinkingOpen ? 'Hide reasoning' : 'Inspect reasoning steps'}</span>
              <ChevronDown
                size={12}
                style={{ transform: thinkingOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.15s ease' }}
              />
            </div>
          </button>
          {thinkingOpen && (
            <div style={{ padding: '12px', background: 'var(--soc-bg-card)', color: 'var(--soc-text-medium)', lineHeight: 1.5, maxHeight: '280px', overflowY: 'auto', whiteSpace: 'pre-wrap', borderTop: '1px solid var(--soc-border-subtle)' }}>
              {reasoning}
            </div>
          )}
        </div>
      )}

      {/* Markdown Content Canvas */}
      <div style={{ fontSize: '13px', lineHeight: 1.6, color: 'var(--soc-text-high)' }}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            pre: ({ children }) => <>{children}</>,
            code({ className, children }) {
              return <CodeBlock className={className}>{children}</CodeBlock>
            },
            a: ({ href, children }) => {
              if (href?.startsWith('#vault-open-')) {
                const rawTarget = decodeURIComponent(href.replace('#vault-open-', ''))
                return (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      handleOpenWikilink(rawTarget)
                    }}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '1px 5px',
                      margin: '0 2px',
                      borderRadius: '3px',
                      background: 'var(--soc-primary-subtle)',
                      color: 'var(--soc-primary)',
                      border: '1px solid var(--soc-border-subtle)',
                      fontSize: '11px',
                      fontFamily: 'var(--font-mono)',
                      cursor: 'pointer'
                    }}
                    title={`Open [[${rawTarget}]] in Vault Editor`}
                  >
                    {children}
                  </button>
                )
              }
              return (
                <a href={href} target="_blank" rel="noreferrer" style={{ color: 'var(--soc-primary)', textDecoration: 'underline' }}>
                  {children}
                </a>
              )
            },
            h1: ({ children }) => (
              <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--soc-text-high)', borderBottom: '1px solid var(--soc-border-subtle)', paddingBottom: '6px', margin: '16px 0 10px 0' }}>{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--soc-text-high)', margin: '14px 0 8px 0' }}>{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--soc-text-high)', margin: '12px 0 6px 0' }}>{children}</h3>
            ),
            p: ({ children }) => <p style={{ margin: '0 0 10px 0', color: 'var(--soc-text-medium)', lineHeight: 1.6 }}>{children}</p>,
            ul: ({ children }) => (
              <ul style={{ paddingLeft: '18px', margin: '8px 0 12px 0', color: 'var(--soc-text-medium)' }}>{children}</ul>
            ),
            ol: ({ children }) => (
              <ol style={{ paddingLeft: '18px', margin: '8px 0 12px 0', color: 'var(--soc-text-medium)' }}>{children}</ol>
            ),
            li: ({ children }) => <li style={{ marginBottom: '4px' }}>{children}</li>,
            blockquote: ({ children }) => (
              <blockquote style={{ borderLeft: '3px solid var(--soc-primary)', paddingLeft: '12px', margin: '12px 0', background: 'var(--soc-primary-subtle)', borderRadius: '0 4px 4px 0', padding: '8px 12px', color: 'var(--soc-text-high)', fontStyle: 'italic' }}>
                {children}
              </blockquote>
            ),
            table: ({ children }) => (
              <div style={{ overflowX: 'auto', margin: '14px 0', borderRadius: '6px', border: '1px solid var(--soc-border-subtle)', maxHeight: '300px', overflowY: 'auto' }}>
                <table style={{ minWidth: '100%', borderCollapse: 'collapse', fontSize: '12px', textAlign: 'left' }}>{children}</table>
              </div>
            ),
            thead: ({ children }) => (
              <thead style={{ background: 'var(--soc-bg-elevated)', color: 'var(--soc-text-high)', fontWeight: 600, borderBottom: '1px solid var(--soc-border-subtle)' }}>{children}</thead>
            ),
            tbody: ({ children }) => (
              <tbody style={{ background: 'var(--soc-bg-surface)' }}>{children}</tbody>
            ),
            tr: ({ children }) => <tr style={{ borderBottom: '1px solid var(--soc-border-subtle)' }}>{children}</tr>,
            th: ({ children }) => <th style={{ padding: '8px 12px', color: 'var(--soc-text-high)', fontWeight: 600 }}>{children}</th>,
            td: ({ children }) => <td style={{ padding: '8px 12px', color: 'var(--soc-text-medium)' }}>{children}</td>,
          }}
        >
          {processedDetail}
        </ReactMarkdown>
      </div>

      {/* Generated Files Chips */}
      {createdFiles && createdFiles.length > 0 && (
        <div style={{ paddingTop: '10px', borderTop: '1px solid var(--soc-border-subtle)', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--soc-text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
            <FileCode2 size={13} style={{ color: 'var(--soc-emerald)' }} /> Generated Files:
          </span>
          {createdFiles.map((cf, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleOpenWikilink(cf.path)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 8px',
                borderRadius: '4px',
                background: 'rgba(16, 185, 129, 0.1)',
                color: 'var(--soc-emerald)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                fontSize: '11px',
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer'
              }}
              title="Open generated file in Editor"
            >
              <span>{cf.path}</span>
            </button>
          ))}
        </div>
      )}

      {/* Cited Sources & Wikilink Provenance Chips */}
      {citedSources && citedSources.length > 0 && (
        <div style={{ paddingTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', fontSize: '11px', fontFamily: 'var(--font-mono)' }}>
          <ShieldCheck size={13} style={{ color: 'var(--soc-primary)' }} />
          <span style={{ color: 'var(--soc-text-dim)', fontWeight: 600 }}>Evidence Provenance:</span>
          {citedSources.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleOpenWikilink(src.replace(/[\[\]]/g, ''))}
              style={{
                cursor: 'pointer',
                background: 'var(--soc-bg-elevated)',
                padding: '2px 6px',
                borderRadius: '3px',
                border: '1px solid var(--soc-border-subtle)',
                color: 'var(--soc-text-medium)',
                fontSize: '10px'
              }}
            >
              {src}
            </button>
          ))}
        </div>
      )}

      {file && (
        <div style={{ paddingTop: '8px', borderTop: '1px solid var(--soc-border-subtle)' }}>
          <code style={{ background: 'var(--soc-bg-elevated)', color: 'var(--soc-primary)', fontSize: '11px', padding: '3px 8px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '5px', border: '1px solid var(--soc-border-subtle)' }}>
            <FileCode2 size={12} />
            <span>{file}</span>
          </code>
        </div>
      )}
    </div>
  )
}
