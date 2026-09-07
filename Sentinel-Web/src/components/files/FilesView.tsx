import { useEffect, useMemo, useState } from 'react'
import { ChevronRight, ChevronDown, FileCode2, Folder, FolderOpen, FileText, Search, Plus, FolderPlus, Trash2, Edit3 } from 'lucide-react'
import { motion } from 'framer-motion'
import type { FileNode } from '../../lib/types'
import { useEdithStore } from '../../store/useEdithStore'
import { EditorPane } from '../editor/EditorPane'

// ── Tree filtering ───────────────────────────────────────────────────────────

function filterTree(nodes: FileNode[], query: string): FileNode[] {
  if (!query) return nodes
  const q = query.toLowerCase()
  return nodes.flatMap((node) => {
    if (node.type === 'file') return node.name.toLowerCase().includes(q) || node.path.toLowerCase().includes(q) ? [node] : []
    const children = filterTree(node.children || [], query)
    return children.length || node.name.toLowerCase().includes(q) ? [{ ...node, children }] : []
  })
}

function countFiles(nodes: FileNode[]): number { return nodes.reduce((sum, n) => sum + (n.type === 'file' ? 1 : countFiles(n.children || [])), 0) }

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
  const isFolder = node.type === 'folder'
  const expanded = forceOpen || open
  const isActive = selectedFile?.path === node.path

  const handleClick = () => {
    if (isFolder) setOpen(!expanded)
    else openFileByPath(node.path)
  }

  return (
    <div className="workspace-tree-node">
      <button
        className={`tree-row ${isActive ? 'selected' : ''}`}
        style={{ paddingLeft: 12 + depth * 17 }}
        onClick={handleClick}
        onContextMenu={(e) => onContextMenu(e, node)}
        data-path={node.path}
        data-is-dir={String(isFolder)}
      >
        {isFolder ? (expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />) : <span className="tree-spacer" />}
        {isFolder ? (expanded ? <FolderOpen size={14} /> : <Folder size={14} />) : node.language === 'markdown' ? <FileText size={14} /> : <FileCode2 size={14} />}
        <span>{node.name.replace(/\.md$/, '')}</span>
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
  const workspace = useEdithStore((s) => s.currentWorkspace)
  const createVaultFile = useEdithStore((s) => s.createVaultFile)
  const createVaultFolder = useEdithStore((s) => s.createVaultFolder)
  const renameVaultFile = useEdithStore((s) => s.renameVaultFile)
  const deleteVaultFile = useEdithStore((s) => s.deleteVaultFile)
  const openFileByPath = useEdithStore((s) => s.openFileByPath)
  const reindexWikilinks = useEdithStore((s) => s.reindexWikilinks)

  const [query, setQuery] = useState('')
  const filtered = useMemo(() => filterTree(files, query), [files, query])

  // ── Context menu state ──
  const [contextMenu, setContextMenu] = useState<ContextMenu | null>(null)
  const [renaming, setRenaming] = useState<FileNode | null>(null)
  const [newName, setNewName] = useState('')
  const [creatingIn, setCreatingIn] = useState<string | null>(null)
  const [createName, setCreateName] = useState('')
  const [createType, setCreateType] = useState<'file' | 'folder'>('file')

  // Auto-select first file
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
    if (!creatingIn || !createName.trim()) return
    if (createType === 'file') createVaultFile(creatingIn, createName.trim())
    else createVaultFolder(creatingIn, createName.trim())
    setCreatingIn(null)
  }

  return (
    <div className="standard-view files-view workspace-view" style={{ padding: 0, height: '100%', flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div className="files-grid upgraded workspace-grid" style={{ flex: 1, height: '100%', gap: 0, gridTemplateColumns: '260px minmax(0, 1fr)', gridTemplateRows: 'minmax(0, 1fr)' }}>
        <section className="file-tree workspace-explorer" onClick={contextMenu ? closeMenu : undefined} style={{ background: 'var(--surface-bg, #1e1e1e)', borderRight: '1px solid var(--surface-border)', padding: '10px 0', height: '100%' }}>
          <div className="tree-context" style={{ padding: '0 10px', marginBottom: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <span style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-muted)' }}><FileText size={12} style={{marginRight: '4px', verticalAlign: '-2px'}}/>FILES</span>
            <div className="compact-search" style={{ width: '100%' }}><Search size={14} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search..." style={{ width: '100%', minWidth: 0 }} /></div>
          </div>
          <div className="workspace-tree-scroll" style={{ padding: '0 10px' }}>
            {filtered.length ? filtered.map((n) => (
              <TreeNode node={n} key={n.path} forceOpen={!!query} onContextMenu={handleContextMenu} />
            )) : <div className="tree-empty">No files match "{query}"</div>}
          </div>
        </section>
        <section className="file-preview workspace-editor" style={{ background: 'var(--surface-bg, #1e1e1e)', padding: 0, borderRadius: 0, border: 'none', minWidth: 0, height: '100%' }}>
          {selectedFile ? (
            <motion.div key={selectedFile.path} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="preview-inner" style={{ display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
              <EditorPane />
            </motion.div>
          ) : (
            <div className="empty-panel">
              <FileText size={25} />
              <strong>Workspace indexed</strong>
              <span>Select a file from the explorer to edit it.</span>
            </div>
          )}
        </section>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div className="vault-context-menu" style={{ left: contextMenu.x, top: contextMenu.y }}>
          <button onClick={() => handleStartCreate('file')}><Plus size={12} /> New note</button>
          <button onClick={() => handleStartCreate('folder')}><FolderPlus size={12} /> New folder</button>
          <div className="ctx-divider" />
          <button onClick={handleStartRename}><Edit3 size={12} /> Rename</button>
          <button className="ctx-danger" onClick={handleDelete}><Trash2 size={12} /> Delete</button>
        </div>
      )}

      {/* Create dialog */}
      {creatingIn !== null && (
        <div className="vault-dialog-overlay">
          <div className="vault-dialog">
            <p className="vault-dialog-title">New {createType}</p>
            <input
              autoFocus
              placeholder={`${createType === 'file' ? 'Note' : 'Folder'} name...`}
              className="vault-dialog-input"
              value={createName}
              onChange={(e) => setCreateName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setCreatingIn(null) }}
            />
            <div className="vault-dialog-actions">
              <button onClick={() => setCreatingIn(null)}>Cancel</button>
              <button className="primary" disabled={!createName.trim()} onClick={handleCreate}>Create</button>
            </div>
          </div>
        </div>
      )}

      {/* Rename dialog */}
      {renaming && (
        <div className="vault-dialog-overlay">
          <div className="vault-dialog">
            <p className="vault-dialog-title">Rename</p>
            <input
              autoFocus
              className="vault-dialog-input"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setRenaming(null) }}
            />
            <div className="vault-dialog-actions">
              <button onClick={() => setRenaming(null)}>Cancel</button>
              <button className="primary" onClick={handleRename}>Rename</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
