import type { FileNode, ClearanceLevel, TrustLevel, NoteMetadata } from './types'

// Matches [[Target]], [[Target#section]], [[Target|alias]], [[Target#section|alias]]
const WIKILINK_REGEX = /\[\[([^\[\]|#]+?)(?:#[^\[\]|]*)?(?:\|([^\[\]]*?))?\]\]/g

export interface ParsedWikilink {
  raw: string
  target: string
  anchor?: string
  alias?: string
}

export interface LinkedMention {
  sourcePath: string
  sourceName: string
  sourceTitle: string
  clearance?: ClearanceLevel
  trustLevel?: TrustLevel
  snippet: string
  line: number
}

export interface UnlinkedMention {
  sourcePath: string
  sourceName: string
  sourceTitle: string
  snippet: string
  line: number
  matchedText: string
}

export interface OutgoingLink {
  target: string
  resolvedPath?: string
  exists: boolean
  clearance?: ClearanceLevel
  trustLevel?: TrustLevel
}

/**
 * Extract YAML frontmatter and body from Markdown content.
 */
export function parseFrontmatter(content: string): { metadata: NoteMetadata; body: string } {
  if (!content.startsWith('---')) {
    return { metadata: {}, body: content }
  }

  const endIdx = content.indexOf('\n---', 3)
  if (endIdx === -1) {
    return { metadata: {}, body: content }
  }

  const yamlStr = content.slice(3, endIdx).trim()
  const body = content.slice(endIdx + 4).trim()
  const metadata: NoteMetadata = {}

  for (const line of yamlStr.split('\n')) {
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue
    const key = line.slice(0, colonIdx).trim()
    let val = line.slice(colonIdx + 1).trim()

    // Strip quotes
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }

    if (key === 'clearance_level') {
      metadata.clearance_level = val.toUpperCase() as ClearanceLevel
    } else if (key === 'trust_level') {
      metadata.trust_level = val as TrustLevel
    } else if (key === 'criticality') {
      metadata.criticality = val as NoteMetadata['criticality']
    } else if (key === 'equipment_id') {
      metadata.equipment_id = val
    } else if (key === 'timestamp' || key === 'last_inspected') {
      metadata.timestamp = val
    } else if (key === 'author' || key === 'inspector' || key === 'lead_technician') {
      metadata.author = val
    } else if (key === 'title') {
      metadata.title = val
    } else {
      metadata[key] = val
    }
  }

  return { metadata, body }
}

/**
 * Extract all wikilink targets from markdown content.
 * Returns basenames without .md extension, deduplicated.
 */
export function extractWikilinks(content: string): string[] {
  const targets: string[] = []
  let match: RegExpExecArray | null

  WIKILINK_REGEX.lastIndex = 0
  while ((match = WIKILINK_REGEX.exec(content)) !== null) {
    const target = match[1].trim()
    if (target) targets.push(target)
  }

  return [...new Set(targets)]
}

export function extractDetailedWikilinks(content: string): ParsedWikilink[] {
  const links: ParsedWikilink[] = []
  let match: RegExpExecArray | null

  WIKILINK_REGEX.lastIndex = 0
  while ((match = WIKILINK_REGEX.exec(content)) !== null) {
    links.push({
      raw: match[0],
      target: match[1].trim(),
      alias: match[2]?.trim(),
    })
  }

  return links
}

export function basename(path: string, ext?: string): string {
  const name = path.split('/').pop() ?? path
  if (ext && name.endsWith(ext)) return name.slice(0, -ext.length)
  return name
}

export function dirname(path: string): string {
  const parts = path.split('/')
  parts.pop()
  return parts.join('/')
}

/**
 * Resolve a wikilink target to a FileNode.
 * Uses the VELIKY FileNode type (type: 'file'|'folder').
 * Shortest path wins (fewest parent directories).
 */
export function resolveWikilink(
  target: string,
  flatFiles: FileNode[]
): FileNode | null {
  const targetClean = target.replace(/\[\[|\]\]/g, '').trim()
  const targetLower = targetClean.toLowerCase()
  const hasSlash = targetLower.includes('/')

  const candidates = flatFiles.filter((f) => {
    if (f.type !== 'file') return false

    const ext = f.name.includes('.') ? '.' + f.name.split('.').pop() : ''
    const nameWithoutExt = ext ? basename(f.name, ext).toLowerCase() : f.name.toLowerCase()
    const pathWithoutExt = ext ? f.path.substring(0, f.path.length - ext.length).toLowerCase() : f.path.toLowerCase()

    if (hasSlash) {
      return (
        pathWithoutExt === targetLower ||
        pathWithoutExt.endsWith('/' + targetLower) ||
        f.path.toLowerCase() === targetLower ||
        f.path.toLowerCase().endsWith('/' + targetLower)
      )
    }

    return nameWithoutExt === targetLower || f.name.toLowerCase() === targetLower
  })

  if (candidates.length === 0) return null
  if (candidates.length === 1) return candidates[0]

  return candidates.reduce((best, current) => {
    const bestDepth = best.path.split('/').length
    const currDepth = current.path.split('/').length
    return currDepth < bestDepth ? current : best
  })
}

/**
 * Flatten a FileNode tree into a flat array.
 */
export function flattenTree(nodes: FileNode[], out: FileNode[] = []): FileNode[] {
  for (const node of nodes) {
    out.push(node)
    if (node.children) flattenTree(node.children, out)
  }
  return out
}

/**
 * Get all Linked Mentions (backlinks) pointing to the active note.
 */
export function getLinkedMentions(activePath: string, flatFiles: FileNode[]): LinkedMention[] {
  const activeFile = flatFiles.find((f) => f.path === activePath)
  if (!activeFile) return []

  const activeTitle = basename(activeFile.name, '.md').toLowerCase()
  const activePathNoExt = activeFile.path.replace(/\.md$/, '').toLowerCase()

  const mentions: LinkedMention[] = []

  for (const file of flatFiles) {
    if (file.type !== 'file' || file.path === activePath || !file.content) continue

    const lines = file.content.split('\n')
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      WIKILINK_REGEX.lastIndex = 0
      let match: RegExpExecArray | null

      while ((match = WIKILINK_REGEX.exec(line)) !== null) {
        const target = match[1].trim().toLowerCase()
        if (target === activeTitle || target === activePathNoExt || target.endsWith('/' + activeTitle)) {
          mentions.push({
            sourcePath: file.path,
            sourceName: file.name,
            sourceTitle: basename(file.name, '.md'),
            clearance: file.clearance,
            trustLevel: file.trustLevel,
            snippet: line.trim(),
            line: i + 1,
          })
          break
        }
      }
    }
  }

  return mentions
}

/**
 * Get all Unlinked Mentions where the note's title is mentioned in text without wikilink brackets.
 */
export function getUnlinkedMentions(activePath: string, flatFiles: FileNode[]): UnlinkedMention[] {
  const activeFile = flatFiles.find((f) => f.path === activePath)
  if (!activeFile) return []

  const activeTitle = basename(activeFile.name, '.md')
  if (activeTitle.length < 3) return [] // Ignore short titles

  const regex = new RegExp(`\\b${activeTitle}\\b(?![\\]\\|])`, 'i')
  const unlinked: UnlinkedMention[] = []

  for (const file of flatFiles) {
    if (file.type !== 'file' || file.path === activePath || !file.content) continue

    const lines = file.content.split('\n')
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      // Check if line mentions title outside of [[...]]
      if (regex.test(line) && !line.includes(`[[${activeTitle}`) && !line.includes(`[[${activeFile.path}`)) {
        unlinked.push({
          sourcePath: file.path,
          sourceName: file.name,
          sourceTitle: basename(file.name, '.md'),
          snippet: line.trim(),
          line: i + 1,
          matchedText: activeTitle,
        })
      }
    }
  }

  return unlinked
}

/**
 * Get all Outgoing Links from the active note.
 */
export function getOutgoingLinks(activeContent: string, flatFiles: FileNode[]): OutgoingLink[] {
  const targets = extractWikilinks(activeContent)
  return targets.map((t) => {
    const resolved = resolveWikilink(t, flatFiles)
    return {
      target: t,
      resolvedPath: resolved?.path,
      exists: !!resolved,
      clearance: resolved?.clearance,
      trustLevel: resolved?.trustLevel,
    }
  })
}

/**
 * Build graph nodes and edges from the vault file tree using wikilinks and metadata.
 */
export function buildWikilinkGraph(
  files: FileNode[],
  graphEdges?: { source: string; target: string; relation: string }[]
): {
  nodes: {
    id: string
    label: string
    group: string
    category: string
    linkCount: number
    trustLevel: TrustLevel
    clearance: ClearanceLevel
    timestamp: string
    equipmentId?: string
  }[]
  edges: {
    source: string
    target: string
    trustLevel?: TrustLevel
    timestamp?: string
  }[]
  linkMap: Record<string, string[]>
} {
  const flat = flattenTree(files)
  const allFiles = flat.filter((f) => f.type === 'file')

  const linkMap: Record<string, string[]> = {}
  for (const f of allFiles) {
    if (f.content) {
      linkMap[f.path] = extractWikilinks(f.content)
    }
  }

  const inboundCount: Record<string, number> = {}
  for (const [, targets] of Object.entries(linkMap)) {
    for (const target of targets) {
      const resolved = resolveWikilink(target, allFiles)
      if (resolved) {
        inboundCount[resolved.path] = (inboundCount[resolved.path] ?? 0) + 1
      }
    }
  }

  const edgeSet = new Set<string>()
  const edges: { source: string; target: string; trustLevel?: TrustLevel; timestamp?: string }[] = []

  // Add explicit wikilinks
  for (const [sourcePath, targets] of Object.entries(linkMap)) {
    const sourceFile = allFiles.find((f) => f.path === sourcePath)
    for (const target of targets) {
      const resolved = resolveWikilink(target, allFiles)
      if (resolved) {
        const key = `${sourcePath}->${resolved.path}`
        if (!edgeSet.has(key)) {
          edgeSet.add(key)
          edges.push({
            source: sourcePath,
            target: resolved.path,
            trustLevel: sourceFile?.trustLevel ?? 'source-document',
            timestamp: sourceFile?.timestamp ?? resolved.timestamp ?? '2026-01-15T00:00:00Z',
          })
        }
      }
    }
  }

  // Add automatic code imports or structural relationships
  if (graphEdges) {
    for (const edge of graphEdges) {
      if (edge.relation === 'imports' || edge.relation === 'contains' || edge.relation === 'monitors') {
        const key = `${edge.source}->${edge.target}`
        if (!edgeSet.has(key)) {
          edgeSet.add(key)
          edges.push({ source: edge.source, target: edge.target, trustLevel: 'verified-by-tool' })
          inboundCount[edge.target] = (inboundCount[edge.target] ?? 0) + 1
          if (!linkMap[edge.source]) linkMap[edge.source] = []
          linkMap[edge.source].push(edge.target)
        }
      }
    }
  }

  const nodes = allFiles.map((f) => {
    const isMd = f.name.endsWith('.md')
    const category = dirname(f.path) || 'root'

    // Inherit or parse metadata
    const parsed = f.content ? parseFrontmatter(f.content).metadata : {}
    const trustLevel: TrustLevel =
      f.trustLevel ||
      parsed.trust_level ||
      (f.path.startsWith('Investigations/')
        ? 'verified-by-tool'
        : f.path.startsWith('Agent-Generated/')
        ? 'ai-inferred'
        : f.path.startsWith('People/') || f.path.startsWith('Tickets/')
        ? 'human-asserted'
        : 'source-document')

    const clearance: ClearanceLevel =
      f.clearance ||
      parsed.clearance_level ||
      (f.path.includes('Emergency') || f.path.includes('Director') || f.path.includes('AuditLogs')
        ? 'RESTRICTED'
        : f.path.startsWith('Reports/') || f.path.startsWith('Investigations/') || f.path.startsWith('Tickets/')
        ? 'CONFIDENTIAL'
        : 'INTERNAL')

    const timestamp =
      f.timestamp ||
      parsed.timestamp ||
      (f.path.includes('Inspection-Report-62')
        ? '2026-08-28T14:30:00Z'
        : f.path.includes('Maintenance-Report-184')
        ? '2026-06-12T16:00:00Z'
        : f.path.includes('Ticket-4471')
        ? '2026-08-29T08:15:00Z'
        : f.path.includes('INV-2026-001')
        ? '2026-09-11T13:46:20Z'
        : f.path.includes('2026-09-03')
        ? '2026-09-03T18:22:00Z'
        : '2026-01-15T09:00:00Z')

    return {
      id: f.path,
      label: isMd ? basename(f.name, '.md') : f.name,
      group: category,
      category,
      linkCount: (inboundCount[f.path] ?? 0) + (linkMap[f.path]?.length ?? 0),
      trustLevel,
      clearance,
      timestamp,
      equipmentId: parsed.equipment_id,
    }
  })

  // Filter edges to ensure nodes exist
  const nodeIds = new Set(nodes.map((n) => n.id))
  const finalEdges = edges.filter((e) => nodeIds.has(e.source) && nodeIds.has(e.target))

  return { nodes, edges: finalEdges, linkMap }
}
