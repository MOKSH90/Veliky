import { create } from 'zustand'
import type { ActiveView, AgentState, AppStage, AuthUser, ExecutionLogItem, FileNode, PlanStep, Workspace, WorkspaceGraphEdge, WorkspaceGraphNode } from '../lib/types'
import { activity, fileTree, memories, workspaces } from '../mock/data'
import { buildGraphFromTree, buildWorkspaceFromFileList } from '../lib/workspace'
import { buildWikilinkGraph, flattenTree } from '../lib/wikilinkParser'
import { processDeepSeekAgentPrompt } from '../services/deepseekAgentService'


const initialPlan: PlanStep[] = [
  { id: 'p1', label: 'Inspect repository', status: 'pending' },
  { id: 'p2', label: 'Build workspace context', status: 'pending' },
  { id: 'p3', label: 'Diagnose request', status: 'pending' },
  { id: 'p4', label: 'Generate controlled change', status: 'pending' },
  { id: 'p5', label: 'Apply approved action', status: 'pending' },
  { id: 'p6', label: 'Run validation', status: 'pending' },
  { id: 'p7', label: 'Verify result', status: 'pending' },
]

const fallbackGraph = buildGraphFromTree(fileTree)

interface EdithStore {
  stage: AppStage
  authUser: AuthUser | null
  activeView: ActiveView
  agentState: AgentState
  currentWorkspace: Workspace | null
  currentGoal: string
  currentAction: string
  plan: PlanStep[]
  selectedFile: FileNode | null
  selectedActivityId: string | null
  files: FileNode[]
  memory: typeof memories
  activity: typeof activity
  graphNodes: WorkspaceGraphNode[]
  graphEdges: WorkspaceGraphEdge[]
  activeFiles: string[]
  executionLog: ExecutionLogItem[]
  commandHistory: string[]
  profileOpen: boolean
  historyOpen: boolean
  projectSwitcherOpen: boolean
  isIndexingWorkspace: boolean

  // ── DeepSeek Agent Engine Configuration ──
  activeModel: string
  activeAgent: string
  thinkingMode: boolean
  setActiveModel: (model: string) => void
  setActiveAgent: (agent: string) => void
  setThinkingMode: (thinking: boolean) => void

  // ── Editor state ──
  editorContent: string
  editorDirty: boolean
  editorSaveTimer: ReturnType<typeof setTimeout> | null

  // ── WikiLink graph data ──
  wikilinkNodes: { id: string; label: string; group: string; linkCount: number }[]
  wikilinkEdges: { source: string; target: string }[]

  graphSettings: {
    filters: { search: string; orphans: boolean }
    groups: Array<{ query: string; color: string }>
    display: { arrows: boolean; textFade: number; nodeSize: number; linkThickness: number; animate: boolean }
    forces: { centerForce: number; repelForce: number; linkForce: number; linkDistance: number }
  }
  setGraphSettings: (update: (prev: EdithStore['graphSettings']) => EdithStore['graphSettings']) => void
  setStage: (stage: AppStage) => void
  setAuthUser: (user: AuthUser) => void
  signOut: () => void
  setActiveView: (view: ActiveView) => void
  selectWorkspace: (workspace: Workspace) => void
  loadLocalWorkspace: (files: FileList) => Promise<void>
  setCurrentWorkspaceById: (id: string) => void
  setSelectedFile: (file: FileNode | null) => void
  setSelectedActivityId: (id: string | null) => void
  setProfileOpen: (open: boolean) => void
  setHistoryOpen: (open: boolean) => void
  setProjectSwitcherOpen: (open: boolean) => void
  forgetMemory: (id: string) => void
  editMemory: (id: string, title: string) => void
  submitGoal: (goal: string) => void
  approve: () => void
  reject: () => void
  resetAgent: () => void

  // ── Editor actions ──
  openFileByPath: (path: string) => void
  setEditorContent: (content: string) => void
  saveCurrentFile: () => void

  // ── File mutation actions ──
  createVaultFile: (parentPath: string, name: string) => void
  createVaultFolder: (parentPath: string, name: string) => void
  renameVaultFile: (oldPath: string, newName: string) => void
  deleteVaultFile: (path: string) => void
  reindexWikilinks: () => void
}

let timers: number[] = []
const clearTimers = () => { timers.forEach(window.clearTimeout); timers = [] }
const stamp = () => new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit', second:'2-digit' })

const updatePlan = (plan: PlanStep[], activeIndex: number, doneThrough = activeIndex - 1) =>
  plan.map((p, i) => ({ ...p, status: i <= doneThrough ? 'done' as const : i === activeIndex ? 'active' as const : 'pending' as const }))

export const useSentinelStore = create<EdithStore>((set, get) => ({
  stage: 'workspace', authUser: { name: 'Moksh', email: 'moksh@sentinel.ai', provider: 'demo' }, activeView: 'agent', agentState: 'idle', currentWorkspace: workspaces[0],
  currentGoal: '', currentAction: '', plan: initialPlan, selectedFile: null, selectedActivityId: null,
  files: fileTree, memory: memories, activity, graphNodes: fallbackGraph.nodes, graphEdges: fallbackGraph.edges,
  activeFiles: [], executionLog: [], commandHistory: [], profileOpen: false, historyOpen: false, projectSwitcherOpen: false, isIndexingWorkspace: false,
  activeModel: 'Qwen/Qwen2.5-0.5B-Instruct', activeAgent: 'general', thinkingMode: true,
  setActiveModel: (activeModel) => set({ activeModel }),
  setActiveAgent: (activeAgent) => set({ activeAgent }),
  setThinkingMode: (thinkingMode) => set({ thinkingMode }),
  editorContent: '', editorDirty: false, editorSaveTimer: null,
  wikilinkNodes: [], wikilinkEdges: [],
  graphSettings: {
    filters: { search: '', orphans: true },
    groups: [],
    display: { arrows: true, textFade: 0.5, nodeSize: 4, linkThickness: 1.5, animate: true },
    forces: { centerForce: 0.1, repelForce: 100, linkForce: 0.5, linkDistance: 30 }
  },
  setGraphSettings: (update) => set((s) => ({ graphSettings: update(s.graphSettings) })),
  setStage: (stage) => set({ stage }),
  setAuthUser: (authUser) => set({ authUser }),
  signOut: () => set({ stage: 'auth', authUser: null }),
  setActiveView: (activeView) => set({ activeView }),
  selectWorkspace: (currentWorkspace) => set({ currentWorkspace }),
  loadLocalWorkspace: async (fileList: FileList) => {
    if (!fileList || fileList.length === 0) return
    set({ isIndexingWorkspace: true })
    try {
      const res = await buildWorkspaceFromFileList(fileList)
      const newWs = {
        id: `local-${Date.now()}`,
        name: res.name,
        path: res.path,
        branch: res.gitDetected ? 'main' : 'local',
        tech: res.tech,
        filesCount: res.fileCount,
        summary: `Uploaded directory '${res.name}' with ${res.fileCount} files`,
        progress: 100,
        source: 'local' as const,
      }
      set({
        currentWorkspace: newWs,
        files: res.files,
        graphNodes: res.graphNodes,
        graphEdges: res.graphEdges,
        isIndexingWorkspace: false,
        stage: 'workspace',
      })
      get().reindexWikilinks()
    } catch (err) {
      console.error('Failed to load workspace:', err)
      set({ isIndexingWorkspace: false })
    }
  },
  setCurrentWorkspaceById: () => {},
  setSelectedFile: (file) => set({ selectedFile: file }),
  setSelectedActivityId: (id) => set({ selectedActivityId: id }),
  setProfileOpen: (profileOpen) => set({ profileOpen }),
  setHistoryOpen: (historyOpen) => set({ historyOpen }),
  setProjectSwitcherOpen: (projectSwitcherOpen) => set({ projectSwitcherOpen }),
  forgetMemory: (id) => set((s) => ({ memory: s.memory.filter((m) => m.id !== id) })),
  editMemory: (id, title) => set((s) => ({ memory: s.memory.map((m) => m.id === id ? { ...m, title } : m) })),

  resetAgent: () => {
    clearTimers()
    set({
      agentState: 'idle', currentGoal: '', currentAction: '',
      plan: initialPlan.map((p) => ({...p, status:'pending' as const})),
      activeView: 'agent', activeFiles: [], executionLog: [],
    })
  },

  submitGoal: async (goal) => {
    clearTimers()
    const cleanGoal = goal.trim()
    if (!cleanGoal) return

    const log = (label:string, detail:string, status:ExecutionLogItem['status']='running', file?:string): ExecutionLogItem => ({ id:`log-${Date.now()}-${Math.random()}`, time:stamp(), label, detail, status, file })

    const { activeModel, activeAgent, thinkingMode, files } = get()
    const modelShortName = activeModel.split('/')[1] || activeModel

    set({
      currentGoal: cleanGoal,
      agentState: 'executing',
      activeView: 'agent',
      currentAction: `DeepSeek Sovereign Agent (${activeAgent.toUpperCase()}) processing…`,
      plan: [
        { id: 'p1', label: 'Receive user prompt', status: 'done' },
        { id: 'p2', label: `Dispatched to DeepSeek Agent (${modelShortName})`, status: 'active' },
        { id: 'p3', label: 'CoT Reasoning & Tool Execution', status: 'pending' },
        { id: 'p4', label: 'Verify workspace state', status: 'pending' }
      ],
      activeFiles: [],
      commandHistory: [cleanGoal, ...get().commandHistory.filter((x) => x !== cleanGoal)].slice(0,12),
      executionLog: [
        log('User Prompt', cleanGoal, 'done'),
        log(`DeepSeek Agent (${activeAgent.toUpperCase()})`, `Model: ${activeModel} | CoT: ${thinkingMode ? 'ON' : 'OFF'}`, 'running')
      ]
    })

    const flatFiles = flattenTree(files)
    const result = await processDeepSeekAgentPrompt({
      prompt: cleanGoal,
      agentPersona: activeAgent,
      model: activeModel,
      thinking: thinkingMode,
      files: flatFiles.map(f => ({ name: f.name, path: f.path, content: f.content }))
    })

    // Auto-create/update files generated by agent file tools
    if (result.createdFiles && result.createdFiles.length > 0) {
      for (const cf of result.createdFiles) {
        get().createVaultFile('', cf.path)
        const flatAfter = flattenTree(get().files)
        const target = flatAfter.find(f => f.path === cf.path)
        if (target) {
          get().openFileByPath(target.path)
          get().setEditorContent(cf.content)
          get().saveCurrentFile()
        }
      }
    }

    if (result.success) {
      set((s) => ({
        agentState: 'success',
        currentAction: `Completed via DeepSeek Agent (${activeAgent.toUpperCase()})`,
        plan: [
          { id: 'p1', label: 'Receive user prompt', status: 'done' },
          { id: 'p2', label: `Dispatched to DeepSeek Agent (${modelShortName})`, status: 'done' },
          { id: 'p3', label: 'CoT Reasoning & Tool Execution', status: 'done' },
          { id: 'p4', label: 'Workspace state verified', status: 'done' }
        ],
        executionLog: [
          ...s.executionLog.map((x) => x.status === 'running' ? { ...x, status: 'done' as const } : x),
          ...(result.reasoning ? [log('Chain-of-Thought (CoT)', result.reasoning, 'done')] : []),
          log(`SENTINEL DeepSeek Agent (${activeAgent.toUpperCase()})`, result.text, 'done')
        ]
      }))
    } else {
      set((s) => ({
        agentState: 'failed',
        currentAction: 'DeepSeek Agent Error',
        plan: [
          { id: 'p1', label: 'Receive user prompt', status: 'done' },
          { id: 'p2', label: `Failed: ${activeAgent}`, status: 'pending' },
          { id: 'p3', label: 'Execution interrupted', status: 'pending' }
        ],
        executionLog: [
          ...s.executionLog.map((x) => x.status === 'running' ? { ...x, status: 'error' as const } : x),
          log('DeepSeek Agent Error', result.error || 'Failed to process prompt', 'done')
        ]
      }))
    }
  },

  approve: () => {
    clearTimers()
    const currentFiles = get().activeFiles
    const log = (label:string, detail:string, status:ExecutionLogItem['status']='running', file?:string): ExecutionLogItem => ({ id:`log-${Date.now()}-${Math.random()}`, time:stamp(), label, detail, status, file })
    set((s) => ({
      agentState: 'executing',
      currentAction: 'Applying the approved change in a controlled transaction',
      plan: updatePlan(s.plan, 5, 4),
      executionLog: [...s.executionLog.map((x) => x.status === 'waiting' ? {...x,status:'done' as const}:x), log('Approved change', 'Modification applied to the isolated workspace state', 'running', currentFiles[currentFiles.length-1])],
    }))
    const phase = (delay: number, fn: () => void) => timers.push(window.setTimeout(fn, delay))
    phase(850, () => set((s) => ({
      currentAction: 'Running validation and health checks',
      plan: updatePlan(s.plan, 6, 5),
      executionLog: [...s.executionLog.map((x) => x.status === 'running' ? {...x,status:'done' as const}:x), log('Validation', 'Running startup, API, and test verification', 'running')],
    })))
    phase(1700, () => set((s) => ({
      agentState: 'verifying',
      currentAction: 'Cross-checking the result against the original goal',
      executionLog: [...s.executionLog, log('Verification', 'Comparing observed behavior with expected outcome', 'running')],
    })))
    phase(2750, () => set((s) => ({
      agentState: 'success',
      currentAction: 'Verified: the requested outcome is stable',
      plan: s.plan.map((p) => ({...p, status:'done' as const})),
      executionLog: [...s.executionLog.map((x): ExecutionLogItem => ({...x, status:x.status === 'running' ? 'done' : x.status})), log('Verified success', 'Execution completed and verification passed', 'done')],
    })))
  },

  reject: () => {
    clearTimers()
    set((s) => ({
      agentState: 'failed',
      currentAction: 'Action rejected. No workspace files were modified.',
      executionLog: s.executionLog.map((x) => x.status === 'waiting' ? {...x,status:'error' as const}:x),
    }))
  },

  // ── Editor actions ──────────────────────────────────────────────────────────

  openFileByPath: (path) => {
    const { files, editorDirty, saveCurrentFile } = get()
    // Save current file first if dirty
    if (editorDirty) saveCurrentFile()

    const flat = flattenTree(files)
    const file = flat.find((f) => f.path === path)
    if (file && file.type === 'file') {
      set({ selectedFile: file, editorContent: file.content || '', editorDirty: false })
    }
  },

  setEditorContent: (content) => {
    const { editorSaveTimer } = get()
    if (editorSaveTimer) clearTimeout(editorSaveTimer)

    // Debounced auto-save after 800ms
    const timer = setTimeout(() => {
      get().saveCurrentFile()
    }, 800)

    set({ editorContent: content, editorDirty: true, editorSaveTimer: timer })
  },

  saveCurrentFile: () => {
    const { selectedFile, editorContent, editorSaveTimer, files } = get()
    if (!selectedFile) return
    if (editorSaveTimer) clearTimeout(editorSaveTimer)

    // Update file content in the tree
    const updateTree = (nodes: FileNode[]): FileNode[] =>
      nodes.map((n) => {
        if (n.path === selectedFile.path) return { ...n, content: editorContent }
        if (n.children) return { ...n, children: updateTree(n.children) }
        return n
      })

    const newFiles = updateTree(files)
    const newSelected = { ...selectedFile, content: editorContent }

    set({ files: newFiles, selectedFile: newSelected, editorDirty: false, editorSaveTimer: null })

    // Re-index wikilinks after save
    setTimeout(() => get().reindexWikilinks(), 0)
  },

  // ── File mutation actions ──────────────────────────────────────────────────

  createVaultFile: (parentPath, name) => {
    const { files } = get()
    const fileName = name.endsWith('.md') ? name : `${name}.md`
    const newPath = parentPath ? `${parentPath}/${fileName}` : fileName
    const newFile: FileNode = { name: fileName, type: 'file', path: newPath, language: 'markdown', content: `# ${name.replace(/\.md$/, '')}\n` }

    const insertInTree = (nodes: FileNode[]): FileNode[] =>
      nodes.map((n) => {
        if (n.path === parentPath && n.type === 'folder') {
          return { ...n, children: [...(n.children || []), newFile] }
        }
        if (n.children) return { ...n, children: insertInTree(n.children) }
        return n
      })

    const newFiles = parentPath ? insertInTree(files) : [...files, newFile]
    set({ files: newFiles })
    setTimeout(() => get().reindexWikilinks(), 0)
  },

  createVaultFolder: (parentPath, name) => {
    const { files } = get()
    const newPath = parentPath ? `${parentPath}/${name}` : name
    const newFolder: FileNode = { name, type: 'folder', path: newPath, children: [] }

    const insertInTree = (nodes: FileNode[]): FileNode[] =>
      nodes.map((n) => {
        if (n.path === parentPath && n.type === 'folder') {
          return { ...n, children: [...(n.children || []), newFolder] }
        }
        if (n.children) return { ...n, children: insertInTree(n.children) }
        return n
      })

    const newFiles = parentPath ? insertInTree(files) : [...files, newFolder]
    set({ files: newFiles })
  },

  renameVaultFile: (oldPath, newName) => {
    const { files, selectedFile } = get()
    const parts = oldPath.split('/')
    parts[parts.length - 1] = newName
    const newPath = parts.join('/')

    const updateTree = (nodes: FileNode[]): FileNode[] =>
      nodes.map((n) => {
        if (n.path === oldPath) {
          return { ...n, name: newName, path: newPath }
        }
        if (n.children) return { ...n, children: updateTree(n.children) }
        return n
      })

    const newFiles = updateTree(files)
    const newSelected = selectedFile?.path === oldPath ? { ...selectedFile, name: newName, path: newPath } : selectedFile
    set({ files: newFiles, selectedFile: newSelected })
    setTimeout(() => get().reindexWikilinks(), 0)
  },

  deleteVaultFile: (path) => {
    const { files, selectedFile } = get()

    const removeFromTree = (nodes: FileNode[]): FileNode[] =>
      nodes.filter((n) => n.path !== path).map((n) => {
        if (n.children) return { ...n, children: removeFromTree(n.children) }
        return n
      })

    const newFiles = removeFromTree(files)
    const newSelected = selectedFile?.path === path ? null : selectedFile
    set({ files: newFiles, selectedFile: newSelected, editorContent: newSelected ? get().editorContent : '', editorDirty: false })
    setTimeout(() => get().reindexWikilinks(), 0)
  },

  reindexWikilinks: () => {
    const { files, graphEdges } = get()
    const { nodes, edges } = buildWikilinkGraph(files, graphEdges)
    set({ wikilinkNodes: nodes, wikilinkEdges: edges })
  },
}))

export const useEdithStore = useSentinelStore
