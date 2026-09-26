import { useEffect, useMemo, useState } from 'react'
import { 
  ChevronRight, 
  ChevronDown, 
  FileCode2, 
  Folder, 
  FolderOpen, 
  FileText, 
  Search, 
  Plus, 
  FolderPlus, 
  Trash2, 
  Edit3, 
  Lock, 
  ShieldAlert,
  SearchCode
} from 'lucide-react'
import { motion } from 'framer-motion'
import type { FileNode } from '../../lib/types'
import { useEdithStore } from '../../store/useEdithStore'
import { EditorPane } from '../editor/EditorPane'
import { checkClearance, getClearanceColor } from '../../lib/authPersonas'

// ── Tree filtering ───────────────────────────────────────────────────────────

function filterTree(nodes: FileNode[], query: string): FileNode[] {
  if (!query) return nodes
  const q = query.toLowerCase()
  return nodes.flatMap((node) => {
    if (node.type === 'file') {
      return node.name.toLowerCase().includes(q) || node.path.toLowerCase().includes(q) ? [node] : []
    }
    const children = filterTree(node.children || [], query)
    return children.length || node.name.toLowerCase().includes(q) ? [{ ...node, children }] : []
  })
}

function countFiles(nodes: FileNode[]): number {
  return nodes.reduce((sum, n) => sum + (n.type === 'file' ? 1 : countFiles(n.children || [])), 0)
}

// ── Context menu ─────────────────────────────────────────────────────────────

interface ContextMenu {
  x: number
  y: number
  node: FileNode
}

// ── Tree node ────────────────────────────────────────────────────────────────

function TreeNode({ node, depth = 0, forceOpen = false, onContextMenu }: {
  node: FileNode
  depth?: number
  forceOpen?: boolean
  onContextMenu: (e: React.MouseEvent, node: FileNode) => void
}) {
  const [open, setOpen] = useState(true)
  const selectedFile = useEdithStore((s) => s.selectedFile)
  const openFileByPath = useEdithStore((s) => s.openFileByPath)
  const user = useEdithStore((s) => s.authUser)
  const isFolder = node.type === 'folder'
  const expanded = forceOpen || open
  const isActive = selectedFile?.path === node.path

  const hasAccess = isFolder ? true : checkClearance(user?.clearance, node.clearance)
  const clearanceColor = getClearanceColor(node.clearance)

  const handleClick = () => {
    if (isFolder) setOpen(!expanded)
    else openFileByPath(node.path)
  }

  return (
    <div className="workspace-tree-node">
      <button
        className={`tree-row ${isActive ? 'selected' : ''}`}
        style={{ 
          paddingLeft: 10 + depth * 14,
          opacity: hasAccess ? 1 : 0.65,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          width: '100%'
        }}
        onClick={handleClick}
        onContextMenu={(e) => onContextMenu(e, node)}
        data-path={node.path}
        data-is-dir={String(isFolder)}
        title={!hasAccess ? `Access Restricted: Requires ${node.clearance} clearance` : undefined}
      >
        {isFolder ? (
          expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />
        ) : (
          <span className="tree-spacer" style={{ width: '8px' }} />
        )}

        {isFolder ? (
          expanded ? <FolderOpen size={14} className="text-amber-400" /> : <Folder size={14} className="text-amber-400" />
        ) : !hasAccess ? (
          <Lock size={13} color="#ef4444" />
        ) : node.language === 'markdown' ? (
          <FileText size={13} className="text-cyan-400" />
        ) : (
          <FileCode2 size={13} />
        )}

        <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {node.name.replace(/\.md$/, '')}
        </span>

        {!isFolder && node.clearance && node.clearance !== 'INTERNAL' && (
          <span
            style={{
              fontSize: '8px',
              fontWeight: 700,
              padding: '1px 4px',
              borderRadius: '3px',
              background: `${clearanceColor}20`,
              color: clearanceColor,
              border: `1px solid ${clearanceColor}40`,
              marginRight: '4px'
            }}
          >
            {node.clearance === 'RESTRICTED' ? 'RESTR' : 'CONF'}
          </span>
        )}
      </button>

      {isFolder && expanded && node.children?.map((c) => (
        <TreeNode node={c} depth={depth + 1} key={c.path} forceOpen={forceOpen} onContextMenu={onContextMenu} />
      ))}
    </div>
  )
}

// ── Main view ────────────────────────────────────────────────────────────────

export function FilesView() {
  const files = useEdithStore((s) => s.files)
  const selectedFile = useEdithStore((s) => s.selectedFile)
  const createVaultFile = useEdithStore((s) => s.createVaultFile)
  const createVaultFolder = useEdithStore((s) => s.createVaultFolder)
  const renameVaultFile = useEdithStore((s) => s.renameVaultFile)
  const deleteVaultFile = useEdithStore((s) => s.deleteVaultFile)
  const openFileByPath = useEdithStore((s) => s.openFileByPath)
  const reindexWikilinks = useEdithStore((s) => s.reindexWikilinks)
  const setQuickSwitcherOpen = useEdithStore((s) => s.setQuickSwitcherOpen)
  const user = useEdithStore((s) => s.authUser)
  const wikilinkEdges = useEdithStore((s) => s.wikilinkEdges)

  const [query, setQuery] = useState('')
  const filtered = useMemo(() => filterTree(files, query), [files, query])

  // ── Context menu state ──
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null)
  const [renaming, setRenaming] = useState<FileNode | null>(null)
  const [newName, setNewName] = useState('')
  const [creatingIn, setCreatingIn] = useState<string | null>(null)
  const [createName, setCreateName] = useState('')
  const [createType, setCreateType] = useState<'file' | 'folder'>('file')

  // Auto-select first file if none selected
  useEffect(() => {
    if (!selectedFile && files.length) {
      const findFirst = (nodes: FileNode[]): FileNode | null => {
        for (const n of nodes) {
          if (n.type === 'file') return n
          const nested = findFirst(n.children || [])
          if (nested) return nested
        }
        return null
      }
      const first = findFirst(files)
      if (first) openFileByPath(first.path)
    }
  }, [files, selectedFile, openFileByPath])

  // Index wikilinks on mount
  useEffect(() => { reindexWikilinks() }, [reindexWikilinks])

  // ── Context menu handlers ──
  const handleContextMenu = (e: React.MouseEvent, node: FileNode) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, node })
  }

  const closeMenu = () => setContextMenu(null)

  const handleDelete = () => {
    if (!contextMenu) return
    deleteVaultFile(contextMenu.node.path)
    closeMenu()
  }

  const handleStartRename = () => {
    if (!contextMenu) return
    setRenaming(contextMenu.node)
    setNewName(contextMenu.node.name)
    closeMenu()
  }

  const handleRename = () => {
    if (!renaming || !newName.trim()) return
    renameVaultFile(renaming.path, newName.trim())
    setRenaming(null)
  }

  const targetDir = (node: FileNode) =>
    node.type === 'folder' ? node.path : node.path.substring(0, node.path.lastIndexOf('/'))

  const handleStartCreate = (type: 'file' | 'folder') => {
    if (!contextMenu) return
    setCreatingIn(targetDir(contextMenu.node))
    setCreateType(type)
    setCreateName('')
    closeMenu()
  }

  const handleCreate = () => {
    if (!creatingIn && creatingIn !== '') return
    if (!createName.trim()) return
    if (createType === 'file') createVaultFile(creatingIn, createName.trim())
    else createVaultFolder(creatingIn, createName.trim())
    setCreatingIn(null)
  }

  const fileCount = countFiles(files)

  return (
    <div className="standard-view files-view workspace-view" style={{ padding: 0, height: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div className="files-grid upgraded workspace-grid" style={{ flex: 1, height: '100%', gap: 0, gridTemplateColumns: '270px minmax(0, 1fr)', gridTemplateRows: 'minmax(0, 1fr)' }}>
        
        {/* Left Explorer Sidebar */}
        <section 
          className="file-tree workspace-explorer" 
          onClick={contextMenu ? closeMenu : undefined} 
          style={{ 
            background: 'var(--surface-bg, #121214)', 
            borderRight: '1px solid var(--surface-border, rgba(255,255,255,0.08))', 
            padding: '12px 0', 
            height: '100%',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {/* Header & Vault Actions */}
          <div style={{ padding: '0 12px 10px', display: 'flex', flexDirection: 'column', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.04em' }}>
                KNOWLEDGE VAULT
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setCreatingIn('')
                    setCreateType('file')
                    setCreateName('')
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    borderRadius: '4px',
                    padding: '3px 5px',
                    cursor: 'pointer'
                  }}
                  title="New Note in Vault Root"
                >
                  <Plus size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCreatingIn('')
                    setCreateType('folder')
                    setCreateName('')
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    borderRadius: '4px',
                    padding: '3px 5px',
                    cursor: 'pointer'
                  }}
                  title="New Folder"
                >
                  <FolderPlus size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => setQuickSwitcherOpen(true)}
                  style={{
                    background: 'rgba(99, 102, 241, 0.15)',
                    border: '1px solid rgba(99, 102, 241, 0.3)',
                    color: '#818cf8',
                    borderRadius: '4px',
                    padding: '3px 6px',
                    fontSize: '10px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                  title="Quick Switcher (Ctrl+O)"
                >
                  Ctrl+O
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div className="compact-search" style={{ width: '100%', position: 'relative' }}>
              <Search size={13} style={{ position: 'absolute', left: '8px', top: '7px', color: 'rgba(255,255,255,0.4)' }} />
              <input 
                value={query} 
                onChange={(e) => setQuery(e.target.value)} 
                placeholder="Filter vault files…" 
                style={{ 
                  width: '100%', 
                  padding: '5px 8px 5px 26px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '6px',
                  fontSize: '11px',
                  color: '#fff',
                  outline: 'none'
                }} 
              />
            </div>
          </div>

          {/* Tree Scroll Area */}
          <div className="workspace-tree-scroll" style={{ padding: '8px 6px', flex: 1, overflowY: 'auto' }}>
            {filtered.length ? (
              filtered.map((n) => (
                <TreeNode node={n} key={n.path} forceOpen={!!query} onContextMenu={handleContextMenu} />
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '20px 10px', fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                No notes match "{query}"
              </div>
            )}
          </div>

          {/* Bottom Vault Status Pill */}
          <div style={{
            padding: '8px 12px',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '10px',
            color: 'rgba(255,255,255,0.4)'
          }}>
            <span>{fileCount} notes · {wikilinkEdges.length} links</span>
            <span style={{ color: getClearanceColor(user?.clearance), fontWeight: 600 }}>
              {user?.clearance || 'INTERNAL'}
            </span>
          </div>
        </section>

        {/* Right Editor Pane */}
        <section className="file-preview workspace-editor" style={{ background: 'var(--surface-bg, #121214)', padding: 0, borderRadius: 0, border: 'none', minWidth: 0, height: '100%' }}>
          {selectedFile ? (
            <motion.div key={selectedFile.path} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="preview-inner" style={{ display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
              <EditorPane />
            </motion.div>
          ) : (
            <div className="empty-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)', gap: '10px' }}>
              <FileText size={25} />
              <strong>No File Selected</strong>
              <span>Select an equipment master, SOP, or investigation report from the vault.</span>
            </div>
          )}
        </section>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div 
          className="vault-context-menu" 
          style={{ 
            position: 'fixed',
            left: contextMenu.x, 
            top: contextMenu.y,
            zIndex: 1000,
            background: '#1a1a20',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: '8px',
            padding: '4px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.7)',
            minWidth: '150px'
          }}
        >
          <button 
            style={{ width: '100%', textAlign: 'left', padding: '6px 10px', background: 'transparent', border: 'none', color: '#fff', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
            onClick={() => handleStartCreate('file')}
          >
            <Plus size={13} /> New Note
          </button>
          <button 
            style={{ width: '100%', textAlign: 'left', padding: '6px 10px', background: 'transparent', border: 'none', color: '#fff', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
            onClick={() => handleStartCreate('folder')}
          >
            <FolderPlus size={13} /> New Folder
          </button>
          <button 
            style={{ width: '100%', textAlign: 'left', padding: '6px 10px', background: 'transparent', border: 'none', color: '#fff', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
            onClick={handleStartRename}
          >
            <Edit3 size={13} /> Rename
          </button>
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.08)', margin: '4px 0' }} />
          <button 
            style={{ width: '100%', textAlign: 'left', padding: '6px 10px', background: 'transparent', border: 'none', color: '#f87171', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
            onClick={handleDelete}
          >
            <Trash2 size={13} /> Delete Note
          </button>
        </div>
      )}

      {/* Creation Dialog */}
      {creatingIn !== null && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div style={{ background: '#1a1a20', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '18px', width: '320px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 12px', color: '#fff' }}>
              New {createType === 'file' ? 'Note' : 'Folder'}
            </h3>
            <input
              autoFocus
              type="text"
              placeholder={createType === 'file' ? 'NoteName or NoteName.md' : 'Folder Name'}
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate()
                if (e.key === 'Escape') setCreatingIn(null)
              }}
              style={{
                width: '100%',
                padding: '8px 10px',
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '13px',
                outline: 'none',
                marginBottom: '14px'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setCreatingIn(null)}
                style={{ padding: '6px 12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#ccc', fontSize: '12px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                style={{ padding: '6px 14px', background: '#6366f1', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Dialog */}
      {renaming && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div style={{ background: '#1a1a20', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', padding: '18px', width: '320px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 12px', color: '#fff' }}>
              Rename Item
            </h3>
            <input
              autoFocus
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleRename()
                if (e.key === 'Escape') setRenaming(null)
              }}
              style={{
                width: '100%',
                padding: '8px 10px',
                background: 'rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '6px',
                color: '#fff',
                fontSize: '13px',
                outline: 'none',
                marginBottom: '14px'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setRenaming(null)}
                style={{ padding: '6px 12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '6px', color: '#ccc', fontSize: '12px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRename}
                style={{ padding: '6px 14px', background: '#6366f1', border: 'none', borderRadius: '6px', color: '#fff', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
