import { useEffect, useState, useRef } from 'react'
import { Search, FileText, Plus, ShieldAlert, ArrowRight, CornerDownLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEdithStore } from '../../store/useEdithStore'
import { flattenTree, basename } from '../../lib/wikilinkParser'
import { getClearanceColor } from '../../lib/authPersonas'

export function QuickSwitcherModal() {
  const open = useEdithStore((s) => s.quickSwitcherOpen)
  const setOpen = useEdithStore((s) => s.setQuickSwitcherOpen)
  const files = useEdithStore((s) => s.files)
  const openFileByPath = useEdithStore((s) => s.openFileByPath)
  const createVaultFile = useEdithStore((s) => s.createVaultFile)
  const setActiveView = useEdithStore((s) => s.setActiveView)

  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const flatFiles = flattenTree(files).filter((f) => f.type === 'file')
  const filtered = query.trim()
    ? flatFiles.filter((f) => 
        f.name.toLowerCase().includes(query.toLowerCase()) || 
        f.path.toLowerCase().includes(query.toLowerCase())
      )
    : flatFiles

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'o' || e.key === 'k')) {
        e.preventDefault()
        setOpen(!open)
      } else if (e.key === 'Escape' && open) {
        setOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, setOpen])

  useEffect(() => {
    if (open) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  if (!open) return null

  const handleSelect = (path: string) => {
    openFileByPath(path)
    setActiveView('workspace')
    setOpen(false)
  }

  const handleCreate = () => {
    if (!query.trim()) return
    createVaultFile('', query.trim())
    setActiveView('workspace')
    setOpen(false)
  }

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filtered.length))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % Math.max(1, filtered.length))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filtered[selectedIndex]) {
        handleSelect(filtered[selectedIndex].path)
      } else if (query.trim()) {
        handleCreate()
      }
    }
  }

  return (
    <AnimatePresence>
      <div 
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingTop: '12vh',
          zIndex: 9999
        }}
        onClick={() => setOpen(false)}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: -10 }}
          transition={{ duration: 0.15 }}
          style={{
            width: '100%',
            maxWidth: '560px',
            background: 'rgba(20, 20, 24, 0.98)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            borderRadius: '12px',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05)',
            overflow: 'hidden'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search bar */}
          <div style={{ display: 'flex', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', gap: '10px' }}>
            <Search size={18} className="text-cyan-400" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search Knowledge Vault notes (or type new note title)…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleInputKeyDown}
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '14px',
                outline: 'none'
              }}
            />
            <span style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.4)', padding: '2px 6px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '4px' }}>
              ESC to close
            </span>
          </div>

          {/* Results List */}
          <div style={{ maxHeight: '360px', overflowY: 'auto', padding: '8px' }}>
            {filtered.length > 0 ? (
              filtered.map((f, idx) => {
                const isSelected = idx === selectedIndex
                const clearanceColor = getClearanceColor(f.clearance)
                const title = basename(f.name, '.md')

                return (
                  <div
                    key={f.path}
                    onClick={() => handleSelect(f.path)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      background: isSelected ? 'rgba(99, 102, 241, 0.18)' : 'transparent',
                      border: `1px solid ${isSelected ? 'rgba(99, 102, 241, 0.4)' : 'transparent'}`,
                      cursor: 'pointer',
                      transition: 'background 0.1s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <FileText size={15} color={isSelected ? '#818cf8' : 'rgba(255,255,255,0.4)'} />
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: isSelected ? '#fff' : 'rgba(255,255,255,0.9)' }}>
                          {title}
                        </div>
                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                          {f.path}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {f.clearance && (
                        <span style={{
                          fontSize: '9px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: `${clearanceColor}20`,
                          color: clearanceColor,
                          border: `1px solid ${clearanceColor}40`
                        }}>
                          {f.clearance}
                        </span>
                      )}
                      {isSelected && <CornerDownLeft size={13} color="#818cf8" />}
                    </div>
                  </div>
                )
              })
            ) : query.trim() ? (
              <div
                onClick={handleCreate}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  background: 'rgba(99, 102, 241, 0.12)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  cursor: 'pointer'
                }}
              >
                <Plus size={16} color="#818cf8" />
                <div style={{ fontSize: '13px', color: '#fff' }}>
                  Create new note: <b>{query.trim()}.md</b>
                </div>
              </div>
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', color: 'rgba(255, 255, 255, 0.4)', fontSize: '12px' }}>
                No notes found in Knowledge Vault
              </div>
            )}
          </div>

          {/* Footer Hints */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.06)',
            background: 'rgba(0, 0, 0, 0.2)',
            fontSize: '11px',
            color: 'rgba(255, 255, 255, 0.4)'
          }}>
            <span>↑↓ to navigate · ↵ to open</span>
            <span>Obsidian-compatible [[wikilink]] vault</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
