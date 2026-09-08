import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Copy, Check, Terminal, Bot, FileCode2 } from 'lucide-react'

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
      <code className="bg-slate-800/90 text-cyan-300 text-xs px-2 py-0.5 rounded font-mono border border-slate-700/60 shadow-sm inline-block my-0.5">
        {codeString}
      </code>
    )
  }

  return (
    <div className="my-5 rounded-xl border border-cyan-500/40 bg-[#090d14] overflow-hidden shadow-2xl">
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#0f172a] border-b border-slate-800/90 sticky top-0 z-10">
        <div className="flex items-center space-x-2 text-xs font-mono text-cyan-400 font-bold tracking-wider">
          <Terminal size={14} className="text-cyan-400" />
          <span className="uppercase">{language}</span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center space-x-1.5 text-xs text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-md transition-all shadow-sm active:scale-95 border border-slate-700"
        >
          {copied ? (
            <>
              <Check size={13} className="text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={13} />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>
      <div className="p-4 overflow-auto max-h-[420px] text-sm font-mono text-slate-100 leading-relaxed bg-[#05080e] scrollbar-thin scrollbar-thumb-slate-700">
        <pre className="m-0 bg-transparent p-0 border-0 font-mono text-slate-100 selection:bg-cyan-500/40 whitespace-pre block">
          <code className="text-slate-100 font-mono">{codeString}</code>
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
}

export function MarkdownOutputCanvas({ label, detail, time, file }: MarkdownOutputCanvasProps) {
  return (
    <div className="w-full bg-[#0b0f19] border border-cyan-500/40 rounded-2xl p-6 shadow-2xl space-y-4 text-slate-100 my-4 backdrop-blur-xl">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-xl border border-cyan-500/30 shadow-inner">
            <Bot size={20} />
          </div>
          <div>
            <h2 className="text-base font-bold text-cyan-300 tracking-wide">{label}</h2>
            <p className="text-xs text-slate-400">Sovereign AI Engine Output</p>
          </div>
        </div>
        {time && <time className="text-xs text-slate-400 font-mono bg-slate-800/70 px-3 py-1 rounded-full border border-slate-700/50">{time}</time>}
      </div>

      {/* Markdown Content Canvas with smooth vertical scrolling */}
      <div className="markdown-readme-canvas text-sm text-slate-200 leading-relaxed font-sans space-y-4 pt-1 max-h-[550px] overflow-y-auto pr-3 custom-scrollbar">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            pre: ({ children }) => <>{children}</>,
            code({ className, children }) {
              return <CodeBlock className={className}>{children}</CodeBlock>
            },
            h1: ({ children }) => <h1 className="text-xl font-bold text-cyan-300 border-b border-slate-800 pb-2 mt-5 mb-3">{children}</h1>,
            h2: ({ children }) => <h2 className="text-lg font-semibold text-cyan-200 mt-4 mb-2">{children}</h2>,
            h3: ({ children }) => <h3 className="text-base font-semibold text-slate-100 mt-3 mb-2">{children}</h3>,
            p: ({ children }) => <p className="leading-relaxed text-slate-200 mb-3 text-sm">{children}</p>,
            ul: ({ children }) => <ul className="list-disc list-inside space-y-2 my-3 text-slate-200 pl-2 text-sm">{children}</ul>,
            ol: ({ children }) => <ol className="list-decimal list-inside space-y-2 my-3 text-slate-200 pl-2 text-sm">{children}</ol>,
            li: ({ children }) => <li className="text-slate-200 leading-normal">{children}</li>,
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-cyan-500/60 pl-4 py-2 text-slate-300 bg-cyan-950/40 rounded-r-xl italic my-4 shadow-sm">
                {children}
              </blockquote>
            ),
            table: ({ children }) => (
              <div className="overflow-x-auto my-4 rounded-xl border border-slate-800 shadow-md max-h-[300px] overflow-y-auto">
                <table className="min-w-full divide-y divide-slate-800 text-sm text-left">{children}</table>
              </div>
            ),
            thead: ({ children }) => <thead className="bg-slate-800/90 text-cyan-300 font-semibold sticky top-0">{children}</thead>,
            tbody: ({ children }) => <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">{children}</tbody>,
            tr: ({ children }) => <tr className="hover:bg-slate-800/40 transition-colors">{children}</tr>,
            th: ({ children }) => <th className="px-4 py-2.5 font-semibold text-cyan-300">{children}</th>,
            td: ({ children }) => <td className="px-4 py-2.5 text-slate-200">{children}</td>,
          }}
        >
          {detail}
        </ReactMarkdown>
      </div>

      {file && (
        <div className="pt-2 border-t border-slate-800/80">
          <code className="bg-slate-800/90 text-cyan-300 text-xs px-3 py-1.5 rounded-lg inline-flex items-center space-x-1.5 border border-slate-700/60">
            <FileCode2 size={13} />
            <span>{file}</span>
          </code>
        </div>
      )}
    </div>
  )
}
