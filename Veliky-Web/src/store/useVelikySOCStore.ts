import { create } from 'zustand'
import type { 
  ActiveView, 
  AgentState, 
  AppStage, 
  AuthUser, 
  DefconLevel, 
  AirGapState, 
  IndustrialAsset, 
  ThreatItem, 
  IncidentItem, 
  ModelCapability, 
  SystemResources, 
  AuditLedgerRecord, 
  ReasoningLedgerStep,
  FileNode,
  Workspace,
  WorkspaceGraphNode,
  WorkspaceGraphEdge,
  PlanStep,
  ExecutionLogItem,
  ChatMessage,
  MemoryItem,
  ActivityItem,
  TrustLevel,
  ClearanceLevel
} from '../lib/types'
import { 
  INDUSTRIAL_ASSETS, 
  THREAT_INTELLIGENCE, 
  INCIDENT_CASES, 
  REASONING_LEDGER_STEPS, 
  MODEL_REGISTRY, 
  AUDIT_LEDGER_RECORDS, 
  INITIAL_SYSTEM_RESOURCES 
} from '../mock/velikyData'
import { workspaces } from '../mock/data'
import { velikyVaultTree, velikyVaultMemories, velikyVaultActivities } from '../mock/velikyVaultData'
import { SOVEREIGN_PERSONAS } from '../lib/authPersonas'
import { buildWikilinkGraph, flattenTree } from '../lib/wikilinkParser'
import { processVelikyAgentPrompt } from '../services/velikyAgentService'

const initialPlan: PlanStep[] = [
  { id: 'p1', label: 'Inspect repository & vault context', status: 'pending' },
  { id: 'p2', label: 'Build sovereign workspace context', status: 'pending' },
  { id: 'p3', label: 'Diagnose industrial request', status: 'pending' },
  { id: 'p4', label: 'Generate controlled calculation & plan', status: 'pending' },
  { id: 'p5', label: 'Apply human-approved action', status: 'pending' },
  { id: 'p6', label: 'Run 4-tier verification engine', status: 'pending' },
  { id: 'p7', label: 'Produce tamper-evident audit record', status: 'pending' },
]

export interface WikilinkNodeItem {
  id: string
  label: string
  group: string
  category: string
  linkCount: number
  trustLevel: TrustLevel
  clearance: ClearanceLevel
  timestamp: string
  equipmentId?: string
}

export interface WikilinkEdgeItem {
  source: string
  target: string
  trustLevel?: TrustLevel
  timestamp?: string
}

export interface GraphSettingsState {
  filters: { 
    search: string
    orphans: boolean
    category: string
    clearance: string
  }
  groups: Array<{ query: string; color: string }>
  display: { 
    arrows: boolean
    textFade: number
    nodeSize: number
    linkThickness: number
    animate: boolean
    colorMode: 'provenance' | 'group' | 'clearance'
  }
  forces: { 
    centerForce: number
    repelForce: number
    linkForce: number
    linkDistance: number
  }
  timelineScrubDate: string
  domainPreset: 'all' | 'equipment' | 'org' | 'investigations'
}

interface VelikySOCStore {
  // Navigation & Core Views
  activeView: ActiveView
  setActiveView: (view: ActiveView) => void
  stage: AppStage
  setStage: (stage: AppStage) => void
  authUser: AuthUser | null
  setAuthUser: (user: AuthUser) => void
  switchSovereignPersona: (personaId: string) => void
  signOut: () => void

  // Operational Posture
  defconLevel: DefconLevel
  setDefconLevel: (level: DefconLevel) => void
  airGapState: AirGapState
  setAirGapState: (state: AirGapState) => void
  systemResources: SystemResources

  // Selections & Filters
  selectedAssetId: string | null
  setSelectedAssetId: (id: string | null) => void
  selectedThreatId: string | null
  setSelectedThreatId: (id: string | null) => void
  selectedIncidentId: string | null
  setSelectedIncidentId: (id: string | null) => void
  severityFilter: 'ALL' | 'CRITICAL' | 'WARNING' | 'NORMAL'
  setSeverityFilter: (filter: 'ALL' | 'CRITICAL' | 'WARNING' | 'NORMAL') => void
  clusterFilter: 'ALL' | 'REFINERY_UNIT_2' | 'CONTROL_SCADA' | 'SOVEREIGN_AI' | 'VAULT_STORE'
  setClusterFilter: (filter: 'ALL' | 'REFINERY_UNIT_2' | 'CONTROL_SCADA' | 'SOVEREIGN_AI' | 'VAULT_STORE') => void
  intelPanelOpen: boolean
  setIntelPanelOpen: (open: boolean) => void
  theme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void
  toggleTheme: () => void

  // Data Collections
  assets: IndustrialAsset[]
  threats: ThreatItem[]
  incidents: IncidentItem[]
  modelRegistry: ModelCapability[]
  reasoningLedger: ReasoningLedgerStep[]
  auditRecords: AuditLedgerRecord[]

  // Real-Time Telemetry & Agent Simulation
  isAnalyzing: boolean
  activeModel: string
  setActiveModel: (model: string) => void
  activeAgentPersona: string
  setActiveAgentPersona: (persona: string) => void
  runAutonomousTask: (taskPrompt: string) => Promise<void>
  approveIncidentAction: (incidentId: string, operatorName?: string) => void
  quarantineAsset: (assetId: string) => void
  resetIncidentApproval: (incidentId: string) => void

  // Workspace & Obsidian Vault State
  currentWorkspace: Workspace | null
  currentGoal: string
  currentAction: string
  plan: PlanStep[]
  selectedFile: FileNode | null
  selectedActivityId: string | null
  files: FileNode[]
  memory: MemoryItem[]
  activity: ActivityItem[]
  graphNodes: WorkspaceGraphNode[]
  graphEdges: WorkspaceGraphEdge[]
  activeFiles: string[]
  executionLog: ExecutionLogItem[]
  chatMessages: ChatMessage[]
  commandHistory: string[]
  profileOpen: boolean
  historyOpen: boolean
  projectSwitcherOpen: boolean
  quickSwitcherOpen: boolean
  setQuickSwitcherOpen: (open: boolean) => void
  isIndexingWorkspace: boolean
  agentState: AgentState
  thinkingMode: boolean
  activeAgent: string

  // Editor State
  editorContent: string
  editorDirty: boolean
  editorSaveTimer: ReturnType<typeof setTimeout> | null
  openFileByPath: (path: string) => void
  setEditorContent: (content: string) => void
  saveCurrentFile: () => void

  // File mutations
  createVaultFile: (parentPath: string, name: string) => void
  createVaultFolder: (parentPath: string, name: string) => void
  renameVaultFile: (oldPath: string, newName: string) => void
  deleteVaultFile: (path: string) => void
  reindexWikilinks: () => void

  // Obsidian Graph Data & Settings
  wikilinkNodes: WikilinkNodeItem[]
  wikilinkEdges: WikilinkEdgeItem[]
  graphSettings: GraphSettingsState
  setGraphSettings: (update: (prev: GraphSettingsState) => GraphSettingsState) => void

  // Misc Actions
  forgetMemory: (id: string) => void
  editMemory: (id: string, title: string) => void
  selectWorkspace: (workspace: Workspace) => void
  loadLocalWorkspace: (files: FileList) => Promise<void>
  setProfileOpen: (open: boolean) => void
  setHistoryOpen: (open: boolean) => void
  setProjectSwitcherOpen: (open: boolean) => void
  setSelectedFile: (file: FileNode | null) => void
  setSelectedActivityId: (id: string | null) => void
  setCurrentWorkspaceById: (id: string) => void
  setThinkingMode: (thinking: boolean) => void
  setActiveAgent: (agent: string) => void
  submitGoal: (goal: string) => void
  approve: () => void
  reject: () => void
  resetAgent: () => void
  clearChatMessages: () => void
}

// Stored session resolution
function getInitialUser(): AuthUser {
  try {
    const saved = localStorage.getItem('veliky_sovereign_user')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed && parsed.employeeId) return parsed
    }
  } catch {
    // fallback
  }
  return SOVEREIGN_PERSONAS[0] // Dr. Rajesh Sharma (Admin)
}

const initialUser = getInitialUser()
const initialGraph = buildWikilinkGraph(velikyVaultTree)
const initialFile = velikyVaultTree[0]?.children?.[0] ?? null

export const useVelikyStore = create<VelikySOCStore>((set, get) => ({
  // Core navigation - default to Command Center overview
  activeView: 'overview',
  setActiveView: (activeView) => set({ activeView }),
  stage: 'workspace',
  setStage: (stage) => set({ stage }),
  authUser: initialUser,
  setAuthUser: (authUser) => {
    try {
      localStorage.setItem('veliky_sovereign_user', JSON.stringify(authUser))
    } catch {}
    set({ authUser, stage: 'workspace' })
  },
  switchSovereignPersona: (personaId: string) => {
    const p = SOVEREIGN_PERSONAS.find((item) => item.id === personaId)
    if (p) {
      get().setAuthUser(p)
    }
  },
  signOut: () => {
    try {
      localStorage.removeItem('veliky_sovereign_user')
    } catch {}
    set({ stage: 'auth', authUser: null })
  },

  defconLevel: 'DEFCON 2 · ELEVATED',
  setDefconLevel: (defconLevel) => set({ defconLevel }),
  airGapState: 'ENFORCED',
  setAirGapState: (airGapState) => set({ airGapState }),
  systemResources: INITIAL_SYSTEM_RESOURCES,

  selectedAssetId: 'P-204',
  setSelectedAssetId: (selectedAssetId) => set({ selectedAssetId }),
  selectedThreatId: 'THR-2026-09',
  setSelectedThreatId: (selectedThreatId) => set({ selectedThreatId }),
  selectedIncidentId: 'INV-2026-001',
  setSelectedIncidentId: (selectedIncidentId) => set({ selectedIncidentId }),
  severityFilter: 'ALL',
  setSeverityFilter: (severityFilter) => set({ severityFilter }),
  clusterFilter: 'ALL',
  setClusterFilter: (clusterFilter) => set({ clusterFilter }),
  intelPanelOpen: false,
  setIntelPanelOpen: (intelPanelOpen) => set({ intelPanelOpen }),
  theme: (typeof window !== 'undefined' && (localStorage.getItem('veliky_theme') as 'light' | 'dark')) || 'light',
  setTheme: (theme) => {
    if (typeof window !== 'undefined') localStorage.setItem('veliky_theme', theme)
    set({ theme })
  },
  toggleTheme: () => {
    const next = get().theme === 'light' ? 'dark' : 'light'
    if (typeof window !== 'undefined') localStorage.setItem('veliky_theme', next)
    set({ theme: next })
  },

  assets: INDUSTRIAL_ASSETS,
  threats: THREAT_INTELLIGENCE,
  incidents: INCIDENT_CASES,
  modelRegistry: MODEL_REGISTRY,
  reasoningLedger: REASONING_LEDGER_STEPS,
  auditRecords: AUDIT_LEDGER_RECORDS,

  isAnalyzing: false,
  activeModel: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B',
  setActiveModel: (activeModel) => set({ activeModel }),
  activeAgentPersona: 'investigator',
  setActiveAgentPersona: (activeAgentPersona) => set({ activeAgentPersona, activeAgent: activeAgentPersona }),

  runAutonomousTask: async (taskPrompt: string) => {
    const t0 = Date.now()
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const { activeModel, activeAgentPersona, reasoningLedger, files, memory, authUser, assets, chatMessages } = get()

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-u`,
      role: 'user',
      content: taskPrompt,
      timestamp: timeStr
    }

    const userLog: ExecutionLogItem = {
      id: userMsg.id,
      time: timeStr,
      label: 'User Prompt',
      detail: taskPrompt,
      status: 'done',
      role: 'user'
    }

    const updatedSteps = reasoningLedger.map((s, idx) => ({
      ...s,
      status: idx === 0 ? ('active' as const) : ('pending' as const)
    }))

    set(state => ({
      isAnalyzing: true,
      agentState: 'executing',
      currentGoal: taskPrompt,
      chatMessages: [...state.chatMessages, userMsg],
      executionLog: [...state.executionLog, userLog],
      commandHistory: [taskPrompt, ...state.commandHistory.filter(h => h !== taskPrompt)].slice(0, 50),
      reasoningLedger: updatedSteps
    }))

    const flatFiles = flattenTree(files)

    // Execute agent prompt asynchronously with full conversation history and vault context
    const agentPromise = processVelikyAgentPrompt({
      prompt: taskPrompt,
      agentPersona: activeAgentPersona,
      model: activeModel,
      thinking: get().thinkingMode,
      files: flatFiles,
      conversationHistory: [...chatMessages, userMsg],
      memories: memory,
      userClearance: authUser?.clearance || 'CONFIDENTIAL',
      activeAssets: assets
    })

    // Progressively step through reasoning ledger to visually show cognitive work
    for (let i = 0; i < updatedSteps.length; i++) {
      await new Promise(r => setTimeout(r, 160))
      set(state => ({
        reasoningLedger: state.reasoningLedger.map((step, idx) => ({
          ...step,
          status: idx <= i ? ('completed' as const) : idx === i + 1 ? ('active' as const) : ('pending' as const)
        }))
      }))
    }

    const result = await agentPromise

    // If agent generated files, persist them to vault tree
    if (result.createdFiles && result.createdFiles.length > 0) {
      for (const created of result.createdFiles) {
        const parts = created.path.split('/')
        const fileName = parts.pop() || created.path
        const parentDir = parts.join('/')
        get().createVaultFile(parentDir, fileName)
        
        // Populate content and save
        const currentFlat = flattenTree(get().files)
        const match = currentFlat.find(f => f.path === created.path || f.name === fileName)
        if (match) {
          set({ selectedFile: match, editorContent: created.content, editorDirty: false })
          get().saveCurrentFile()
        }
      }
    }

    const assistantTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    const assistantMsg: ChatMessage = {
      id: `msg-${Date.now()}-a`,
      role: 'assistant',
      content: result.text,
      reasoning: result.reasoning,
      createdFiles: result.createdFiles,
      executedCommands: result.executedCommands,
      verificationStatus: result.verificationStatus || 'PASSED',
      citedSources: result.citedSources,
      latencyMs: Date.now() - t0,
      model: activeModel,
      timestamp: assistantTimeStr
    }

    const assistantLog: ExecutionLogItem = {
      id: assistantMsg.id,
      time: assistantTimeStr,
      label: `VELIKY AI (${activeAgentPersona.toUpperCase()})`,
      detail: result.text,
      status: 'done',
      role: 'assistant',
      reasoning: result.reasoning,
      verification: result.verificationStatus || 'PASSED',
      createdFiles: result.createdFiles
    }

    const newTxId = `tx-${Math.floor(1000 + Math.random() * 9000)}`
    const newAuditRecord: AuditLedgerRecord = {
      id: newTxId,
      timestamp: new Date().toISOString(),
      investigationId: 'INV-2026-001',
      operatorRole: (get().authUser?.role as any) || 'engineer',
      targetAsset: result.citedSources?.some(s => s.includes('C-104')) ? 'C-104' : 'P-204',
      action: 'AUTONOMOUS_COGNITIVE_REASONING',
      verdict: result.verificationStatus === 'PASSED' ? 'ATTENTION_REQUIRED' : 'VERIFIED',
      sha256Hash: Array.from(crypto.getRandomValues(new Uint8Array(16))).map(b => b.toString(16).padStart(2, '0')).join('') + '...',
      sourcesCount: (result.citedSources?.length || 2),
      sandboxPassed: true
    }

    set(state => ({
      isAnalyzing: false,
      agentState: 'success',
      chatMessages: [...state.chatMessages, assistantMsg],
      executionLog: [...state.executionLog, assistantLog],
      auditRecords: [newAuditRecord, ...state.auditRecords]
    }))
  },

  approveIncidentAction: (incidentId: string, operatorName) => {
    const user = get().authUser
    const op = operatorName || `${user?.name || 'Authorized Operator'} (${user?.role.toUpperCase()})`
    const timestamp = new Date().toISOString()
    const cryptoSignature = 'ECDSA-SHA256-AIRGAP-SEAL-' + Math.random().toString(36).slice(2, 10).toUpperCase()
    
    set(state => ({
      incidents: state.incidents.map(inc => {
        if (inc.id === incidentId) {
          return {
            ...inc,
            status: 'APPROVED',
            approvedBy: op,
            approvedAt: timestamp,
            cryptoSignature
          }
        }
        return inc
      }),
      auditRecords: [
        {
          id: `tx-${Math.floor(1000 + Math.random() * 9000)}`,
          timestamp,
          investigationId: incidentId,
          operatorRole: (user?.role as any) || 'admin',
          targetAsset: 'P-204',
          action: 'SIGN_AND_APPROVE_CONTAINMENT_WORK_ORDER',
          verdict: 'APPROVED_BY_OPERATOR',
          sha256Hash: cryptoSignature,
          sourcesCount: 3,
          sandboxPassed: true
        },
        ...state.auditRecords
      ]
    }))
  },

  resetIncidentApproval: (incidentId: string) => {
    set(state => ({
      incidents: state.incidents.map(inc => {
        if (inc.id === incidentId) {
          return {
            ...inc,
            status: 'WAITING_APPROVAL',
            approvedBy: undefined,
            approvedAt: undefined,
            cryptoSignature: undefined
          }
        }
        return inc
      })
    }))
  },

  quarantineAsset: (assetId: string) => {
    set(state => ({
      assets: state.assets.map(asset => {
        if (asset.id === assetId) {
          return {
            ...asset,
            status: 'ARMED' as const,
            downstreamHazard: 'EMERGENCY QUARANTINE APPLIED · Process isolated by SIS-SIL3 controller'
          }
        }
        return asset
      })
    }))
  },

  // Sovereign Knowledge Vault State
  currentWorkspace: workspaces[0],
  currentGoal: '',
  currentAction: '',
  plan: initialPlan,
  selectedFile: initialFile,
  selectedActivityId: null,
  files: velikyVaultTree,
  memory: velikyVaultMemories,
  activity: velikyVaultActivities,
  graphNodes: initialGraph.nodes.map(n => ({
    id: n.id,
    label: n.label,
    cluster: n.group,
    kind: (n.category.toLowerCase().slice(0, -1) as any) || 'file',
    trustLevel: n.trustLevel,
    clearance: n.clearance,
    timestamp: n.timestamp,
    weight: n.linkCount
  })),
  graphEdges: initialGraph.edges.map((e, idx) => ({
    id: `e-${idx}`,
    source: e.source,
    target: e.target,
    relation: 'references',
    trustLevel: e.trustLevel,
    timestamp: e.timestamp
  })),
  activeFiles: ['Equipment/Pump-P204.md'],
  executionLog: [],
  chatMessages: [],
  commandHistory: [],
  profileOpen: false,
  historyOpen: false,
  projectSwitcherOpen: false,
  quickSwitcherOpen: false,
  setQuickSwitcherOpen: (quickSwitcherOpen) => set({ quickSwitcherOpen }),
  isIndexingWorkspace: false,
  agentState: 'idle',
  thinkingMode: true,
  activeAgent: 'investigator',

  // Editor State
  editorContent: initialFile?.content || '',
  editorDirty: false,
  editorSaveTimer: null,

  openFileByPath: (path: string) => {
    const { files, editorDirty, saveCurrentFile } = get()
    if (editorDirty) saveCurrentFile()

    const flat = flattenTree(files)
    const file = flat.find((f) => f.path === path)
    if (file && file.type === 'file') {
      set({ 
        selectedFile: file, 
        editorContent: file.content || '', 
        editorDirty: false,
        activeFiles: [path, ...get().activeFiles.filter(p => p !== path)].slice(0, 5)
      })
    }
  },

  setEditorContent: (content: string) => {
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

    const updateTree = (nodes: FileNode[]): FileNode[] =>
      nodes.map((n) => {
        if (n.path === selectedFile.path) return { ...n, content: editorContent }
        if (n.children) return { ...n, children: updateTree(n.children) }
        return n
      })

    const newFiles = updateTree(files)
    const newSelected = { ...selectedFile, content: editorContent }

    set({ files: newFiles, selectedFile: newSelected, editorDirty: false, editorSaveTimer: null })
    setTimeout(() => get().reindexWikilinks(), 0)
  },

  createVaultFile: (parentPath: string, name: string) => {
    const { files } = get()
    const fileName = name.endsWith('.md') ? name : `${name}.md`
    const newPath = parentPath ? `${parentPath}/${fileName}` : fileName
    const title = name.replace(/\.md$/, '')
    const user = get().authUser

    const newFile: FileNode = {
      name: fileName,
      type: 'file',
      path: newPath,
      language: 'markdown',
      clearance: user?.clearance || 'INTERNAL',
      trustLevel: 'human-asserted',
      timestamp: new Date().toISOString(),
      content: `---\ntitle: "${title}"\nauthor: "${user?.name || 'Engineer'}"\nclearance_level: "${user?.clearance || 'INTERNAL'}"\ntrust_level: "human-asserted"\ntimestamp: "${new Date().toISOString()}"\n---\n\n# ${title}\n\nDocument initialized in sovereign Knowledge Vault.\n`
    }

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
    get().openFileByPath(newPath)
    setTimeout(() => get().reindexWikilinks(), 0)
  },

  createVaultFolder: (parentPath: string, name: string) => {
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

  renameVaultFile: (oldPath: string, newName: string) => {
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

  deleteVaultFile: (path: string) => {
    const { files, selectedFile } = get()

    const removeFromTree = (nodes: FileNode[]): FileNode[] =>
      nodes.filter((n) => n.path !== path).map((n) => {
        if (n.children) return { ...n, children: removeFromTree(n.children) }
        return n
      })

    const newFiles = removeFromTree(files)
    const newSelected = selectedFile?.path === path ? null : selectedFile
    set({ 
      files: newFiles, 
      selectedFile: newSelected, 
      editorContent: newSelected ? get().editorContent : '', 
      editorDirty: false 
    })
    setTimeout(() => get().reindexWikilinks(), 0)
  },

  reindexWikilinks: () => {
    const { files, graphEdges } = get()
    const { nodes, edges } = buildWikilinkGraph(files, graphEdges)
    set({ 
      wikilinkNodes: nodes, 
      wikilinkEdges: edges,
      graphNodes: nodes.map(n => ({
        id: n.id,
        label: n.label,
        cluster: n.group,
        kind: 'file' as const,
        trustLevel: n.trustLevel,
        clearance: n.clearance,
        timestamp: n.timestamp,
        weight: n.linkCount
      })),
      graphEdges: edges.map((e, idx) => ({
        id: `we-${idx}`,
        source: e.source,
        target: e.target,
        relation: 'references' as const,
        trustLevel: e.trustLevel,
        timestamp: e.timestamp
      }))
    })
  },

  wikilinkNodes: initialGraph.nodes,
  wikilinkEdges: initialGraph.edges,

  graphSettings: {
    filters: { search: '', orphans: true, category: 'ALL', clearance: 'ALL' },
    groups: [],
    display: { 
      arrows: true, 
      textFade: 0.5, 
      nodeSize: 2.2, 
      linkThickness: 1.5, 
      animate: true,
      colorMode: 'provenance'
    },
    forces: { centerForce: 0.15, repelForce: 60, linkForce: 0.8, linkDistance: 45 },
    timelineScrubDate: '2026-09-14T12:00:00Z',
    domainPreset: 'all'
  },
  setGraphSettings: (update) => set((s) => ({ graphSettings: update(s.graphSettings) })),

  forgetMemory: (id: string) => set(s => ({ memory: s.memory.filter(m => m.id !== id) })),
  editMemory: (id: string, title: string) => set(s => ({ memory: s.memory.map(m => m.id === id ? { ...m, title } : m) })),
  selectWorkspace: (currentWorkspace) => set({ currentWorkspace }),
  loadLocalWorkspace: async () => {},
  setProfileOpen: (profileOpen) => set({ profileOpen }),
  setHistoryOpen: (historyOpen) => set({ historyOpen }),
  setProjectSwitcherOpen: (projectSwitcherOpen) => set({ projectSwitcherOpen }),
  setSelectedFile: (selectedFile) => set({ selectedFile }),
  setSelectedActivityId: (selectedActivityId) => set({ selectedActivityId }),
  setCurrentWorkspaceById: (_id) => {},
  setThinkingMode: (thinkingMode) => set({ thinkingMode }),
  setActiveAgent: (activeAgentPersona) => set({ activeAgentPersona, activeAgent: activeAgentPersona }),
  submitGoal: (goal) => get().runAutonomousTask(goal),
  approve: () => get().approveIncidentAction('INV-2026-001'),
  reject: () => get().resetIncidentApproval('INV-2026-001'),
  resetAgent: () => set({ isAnalyzing: false, agentState: 'idle' }),
  clearChatMessages: () => set({ chatMessages: [], executionLog: [], agentState: 'idle' })
}))

export const useEdithStore = useVelikyStore
export default useVelikyStore
