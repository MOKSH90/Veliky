import type { FileNode, WorkspaceGraphEdge, WorkspaceGraphNode } from './types'

const TEXT_EXTENSIONS = new Set([
  'ts','tsx','js','jsx','mjs','cjs','py','json','md','txt','yaml','yml','toml','ini','env','html','css','scss','less','sql','java','kt','go','rs','rb','php','cs','cpp','c','h','hpp','sh','ps1','xml','vue','svelte'
])

const MAX_TEXT_BYTES = 220_000
const MAX_FILES_TO_READ = 220

const extensionOf = (name: string) => name.includes('.') ? name.split('.').pop()!.toLowerCase() : ''
const baseName = (path: string) => path.split('/').pop() || path
const dirName = (path: string) => path.includes('/') ? path.split('/').slice(0,-1).join('/') : ''

export function languageFromName(name: string) {
  const ext = extensionOf(name)
  const map: Record<string,string> = {
    ts:'typescript',tsx:'tsx',js:'javascript',jsx:'jsx',mjs:'javascript',cjs:'javascript',py:'python',md:'markdown',json:'json',html:'html',css:'css',scss:'scss',sql:'sql',yml:'yaml',yaml:'yaml',toml:'toml',sh:'shell',ps1:'powershell',java:'java',go:'go',rs:'rust',rb:'ruby',php:'php',cs:'csharp',cpp:'cpp',c:'c',vue:'vue',svelte:'svelte',txt:'text'
  }
  return map[ext] || ext || 'text'
}

function insertNode(root: FileNode[], path: string, content: string | undefined, size: number) {
  const parts = path.split('/').filter(Boolean)
  let level = root
  let current = ''
  for (let i = 0; i < parts.length; i++) {
    const name = parts[i]
    current = current ? `${current}/${name}` : name
    const last = i === parts.length - 1
    let existing = level.find((node) => node.name === name && node.type === (last ? 'file' : 'folder'))
    if (!existing) {
      existing = last
        ? { name, type: 'file', path: current, language: languageFromName(name), content, size }
        : { name, type: 'folder', path: current, children: [] }
      level.push(existing)
    }
    if (!last) level = existing.children || (existing.children = [])
  }
}

export async function buildWorkspaceFromFileList(files: FileList) {
  const list = Array.from(files)
  const first = list[0] as File & { webkitRelativePath?: string }
  const rootName = first?.webkitRelativePath?.split('/')[0] || 'Local Project'
  const tree: FileNode[] = []
  let readCount = 0

  const normalized = list.map((file) => {
    const f = file as File & { webkitRelativePath?: string }
    const rel = f.webkitRelativePath || f.name
    const withoutRoot = rel.startsWith(`${rootName}/`) ? rel.slice(rootName.length + 1) : rel
    return { file, path: withoutRoot }
  }).filter((entry) => entry.path)

  await Promise.all(normalized.map(async ({ file, path }) => {
    const ext = extensionOf(file.name)
    const isText = (TEXT_EXTENSIONS.has(ext) || file.type.startsWith('text/')) && file.size <= MAX_TEXT_BYTES && readCount < MAX_FILES_TO_READ
    let content: string | undefined
    if (isText) {
      readCount += 1
      try { content = await file.text() } catch { content = undefined }
    }
    insertNode(tree, path, content, file.size)
  }))

  const sortTree=(nodes:FileNode[])=>{nodes.sort((a,b)=>a.type===b.type?a.name.localeCompare(b.name):a.type==='folder'?-1:1);nodes.forEach((n)=>n.children&&sortTree(n.children))}
  sortTree(tree)

  const allPaths = normalized.map((x) => x.path)
  const packageText = normalized.find((x) => x.path.endsWith('package.json'))
  const tech = detectTech(allPaths, packageText ? await safeText(packageText.file) : '')
  const graph = buildGraphFromTree(tree)

  return {
    name: rootName,
    path: `~/Projects/${rootName}`,
    files: tree,
    graphNodes: graph.nodes,
    graphEdges: graph.edges,
    tech,
    fileCount: normalized.length,
    gitDetected: allPaths.some((p) => p.startsWith('.git/') || p === '.gitignore'),
  }
}

async function safeText(file: File) {
  try { return file.size < MAX_TEXT_BYTES ? await file.text() : '' } catch { return '' }
}

function detectTech(paths: string[], packageJson: string) {
  const lower = paths.map((p) => p.toLowerCase())
  const tech = new Set<string>()
  const has = (suffix: string) => lower.some((p) => p.endsWith(suffix))
  if (has('.tsx') || has('.jsx')) tech.add('React')
  if (has('.ts') || has('.tsx')) tech.add('TypeScript')
  if (has('.js') || has('.jsx')) tech.add('JavaScript')
  if (has('.py')) tech.add('Python')
  if (packageJson.includes('next')) tech.add('Next.js')
  if (packageJson.includes('vite')) tech.add('Vite')
  if (packageJson.includes('three')) tech.add('Three.js')
  if (lower.some((p) => p.endsWith('requirements.txt') || p.endsWith('pyproject.toml'))) tech.add('Python')
  if (lower.some((p) => p.includes('fastapi'))) tech.add('FastAPI')
  if (lower.some((p) => p.endsWith('dockerfile') || p.includes('docker-compose'))) tech.add('Docker')
  if (!tech.size) tech.add('Local workspace')
  return Array.from(tech).slice(0,6)
}

export function flatten(nodes: FileNode[], out: FileNode[] = []) {
  for (const node of nodes) {
    out.push(node)
    if (node.children) flatten(node.children, out)
  }
  return out
}

function normalizeImport(raw: string) {
  return raw.replace(/^['\"]|['\"]$/g,'').replace(/\\/g,'/').replace(/\.(tsx?|jsx?|py)$/,'')
}

export function buildGraphFromTree(tree: FileNode[]) {
  const flat = flatten(tree)
  const visible = flat.filter((n) => !n.path.split('/').some((part) => ['node_modules','.git','dist','build','.next','venv','.venv','__pycache__'].includes(part))).slice(0,500)
  const nodes: WorkspaceGraphNode[] = visible.map((node) => ({
    id: node.path,
    label: node.name,
    path: node.path,
    kind: node.type,
    language: node.language,
    cluster: node.path.split('/')[0] || 'root',
    weight: node.type === 'folder' ? Math.min(5, (node.children?.length || 1) + 1) : 1,
  }))
  const ids = new Set(nodes.map((n) => n.id))
  const edges: WorkspaceGraphEdge[] = []

  for (const node of visible) {
    if (node.path.includes('/')) {
      const parent = dirName(node.path)
      if (ids.has(parent)) edges.push({ id:`contains:${parent}->${node.path}`, source:parent, target:node.path, relation:'contains' })
    }
  }

  const files = visible.filter((n) => n.type === 'file' && n.content)
  for (const file of files) {
    const imports = extractImports(file.content || '')
    for (const imp of imports.slice(0,10)) {
      const normalized = normalizeImport(imp)
      const candidates = nodes.filter((n) => n.kind === 'file')
      const target = candidates.find((n) => {
        const p = (n.path || '').replace(/\.(tsx?|jsx?|py)$/,'')
        const name = n.label.replace(/\.(tsx?|jsx?|py)$/,'')
        return p.endsWith(normalized.replace(/^\.\//,'')) || normalized.endsWith(name) || p.endsWith(normalized.split('/').pop() || '')
      })
      if (target && target.id !== file.path) {
        const id = `imports:${file.path}->${target.id}`
        if (!edges.some((e) => e.id === id)) edges.push({ id, source:file.path, target:target.id, relation:'imports' })
      }
    }
  }

  edges.forEach(e => {
    const s = nodes.find(n => n.id === e.source)
    const t = nodes.find(n => n.id === e.target)
    if (s) s.weight = (s.weight || 1) + 0.3
    if (t) t.weight = (t.weight || 1) + 0.3
  })

  return { nodes, edges: edges.slice(0,800) }
}

function extractImports(content: string) {
  const found = new Set<string>()
  const patterns = [
    /from\s+['\"]([^'\"]+)['\"]/g,
    /import\s+[^'\"]*?from\s+['\"]([^'\"]+)['\"]/g,
    /require\(\s*['\"]([^'\"]+)['\"]\s*\)/g,
    /^\s*from\s+([\w.]+)\s+import/gm,
    /^\s*import\s+([\w.]+)/gm,
  ]
  for (const pattern of patterns) {
    for (const match of content.matchAll(pattern)) if (match[1]) found.add(match[1].replace(/\./g,'/'))
  }
  return Array.from(found)
}
