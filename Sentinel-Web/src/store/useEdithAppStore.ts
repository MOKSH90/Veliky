import { create } from 'zustand'
import {
  EDITH_ACTIVE_GOALS,
  EDITH_DAG_NODES,
  EDITH_PRIORITY_TASKS,
  EDITH_APPROVALS,
  ORCHESTRATOR_TIMELINE_STEPS,
  EDITH_EXECUTIONS,
  EDITH_HYBRID_MEMORIES,
  EDITH_RAG_CHUNKS,
  EDITH_TOOL_REGISTRY,
  EDITH_SCENARIOS,
  EDITH_BENCHMARK_METRICS,
  EDITH_SIX_LAYERS,
  type EdithGoal,
  type DagNode,
  type PriorityTask,
  type PolicyApproval,
  type ExecutionRecord,
  type OrchestratorStep,
  type HybridMemoryItem,
  type DocumentRagChunk,
  type ToolDefinition,
  type ScenarioData,
  type BenchmarkMetric,
  type ArchitecturalLayer,
} from '../mock/edithData'

export type EdithView =
  | 'dashboard'
  | 'goals'
  | 'timeline'
  | 'memory'
  | 'rag'
  | 'policy'
  | 'scenarios'
  | 'benchmark'
  | 'architecture'
  | 'chat'

export interface ChatMessage {
  id: string
  sender: 'user' | 'edith' | 'system'
  text: string
  timestamp: string
  intentJson?: Record<string, any>
  dagSummary?: { tasks: Array<{ label: string; status: string; tool?: string; risk?: string }> }
  toolExecution?: {
    tool: string
    riskTier: string
    verified: boolean
    assertion: string
    proof: string
    stdout: string
  }
  approvalRequest?: PolicyApproval
}

export interface EdithAppState {
  // Navigation & View
  activeView: EdithView
  setActiveView: (view: EdithView) => void

  // Goals
  goals: EdithGoal[]
  selectedGoalId: string
  setSelectedGoalId: (id: string) => void
  submitGoal: (rawPrompt: string) => void

  // DAG Planner
  dagNodes: DagNode[]
  selectedDagNodeId: string | null
  setSelectedDagNodeId: (id: string | null) => void
  toggleDagTaskStatus: (nodeId: string) => void
  criticalPathOnly: boolean
  setCriticalPathOnly: (enabled: boolean) => void

  // Priority Tasks
  priorityTasks: PriorityTask[]

  // Approvals & Policy Gate
  approvals: PolicyApproval[]
  selectedApproval: PolicyApproval | null
  showApprovalModal: boolean
  openApprovalModal: (approval: PolicyApproval) => void
  closeApprovalModal: () => void
  approveAction: (approvalId: string) => void
  rejectAction: (approvalId: string) => void

  // Execution & Timeline
  timelineSteps: OrchestratorStep[]
  executions: ExecutionRecord[]
  selectedExecutionId: string | null
  setSelectedExecutionId: (id: string | null) => void
  orchestratorStatus: 'IDLE' | 'EXECUTING' | 'WAITING_APPROVAL' | 'VERIFYING'

  // Hybrid Memory
  memories: HybridMemoryItem[]
  memoryFilter: 'all' | 'short_term' | 'working' | 'long_term' | 'semantic_rag'
  setMemoryFilter: (tier: 'all' | 'short_term' | 'working' | 'long_term' | 'semantic_rag') => void
  addMemoryItem: (item: Omit<HybridMemoryItem, 'id'>) => void

  // RAG / Knowledge
  ragChunks: DocumentRagChunk[]
  ragTopK: number
  setRagTopK: (k: number) => void
  ragSearchQuery: string
  setRagSearchQuery: (q: string) => void

  // Scenarios
  scenarios: ScenarioData[]
  activeScenarioId: string | null
  isScenarioRunning: boolean
  scenarioProgress: number
  scenarioActiveStepIndex: number
  runScenario: (scenarioId: string) => Promise<void>
  runFastVerticalSliceDemo: () => Promise<void>

  // Chat Copilot
  chatMessages: ChatMessage[]
  sendChatMessage: (text: string) => void
  clearChat: () => void

  // System Stats
  systemStats: {
    goalsActive: number
    tasksVerified: number
    approvalPendingCount: number
    memoryItemCount: number
    verifierPassRate: number
  }
}

export const useEdithAppStore = create<EdithAppState>((set, get) => ({
  // Navigation & View
  activeView: 'dashboard',
  setActiveView: (activeView) => set({ activeView }),

  // Goals
  goals: EDITH_ACTIVE_GOALS,
  selectedGoalId: 'goal_edith',
  setSelectedGoalId: (selectedGoalId) => set({ selectedGoalId }),
  submitGoal: (rawPrompt) => {
    const newId = `goal_${Date.now()}`
    const newGoal: EdithGoal = {
      id: newId,
      title: rawPrompt.length > 32 ? rawPrompt.slice(0, 32) + '...' : rawPrompt,
      objective: rawPrompt,
      deadline: '15 Nov 2026',
      progress: 0,
      status: 'in_progress',
      category: 'Software Engineering',
      priority: 'High',
      tasksTotal: 4,
      tasksDone: 0,
      tasksBlocked: 0,
      activeWorkflow: 'Intent Decomposed · Planning DAG',
      color: '#06b6d4',
    }

    const newNodes: DagNode[] = [
      {
        id: `${newId}_1`,
        goalId: newId,
        label: `Ingest constraints: "${rawPrompt.slice(0, 24)}..."`,
        phase: 'Context Retrieval',
        status: 'done',
        dependsOn: [],
        isCriticalPath: true,
        tool: 'context_retriever()',
        riskTier: 'LOW',
        estimatedHours: 1.0,
        verificationAssertion: 'assert context_tokens > 0',
        workingMemoryNote: 'Parsed user goal intent and retrieved related facts from LTM.',
        outputSummary: 'Context indexed with 3 relevant prior memories.',
      },
      {
        id: `${newId}_2`,
        goalId: newId,
        label: 'Synthesize Subtask DAG',
        phase: 'Intelligence',
        status: 'in_progress',
        dependsOn: [`${newId}_1`],
        isCriticalPath: true,
        tool: 'dag_planner()',
        riskTier: 'LOW',
        estimatedHours: 2.0,
        verificationAssertion: 'assert not dag.has_cycle()',
        workingMemoryNote: 'Topological sort generated 3 executable child stages.',
        outputSummary: 'DAG generated with 0 cyclic violations.',
      },
      {
        id: `${newId}_3`,
        goalId: newId,
        label: 'Gated Action Execution',
        phase: 'Execution',
        status: 'pending',
        dependsOn: [`${newId}_2`],
        isCriticalPath: true,
        tool: 'tool_dispatcher()',
        riskTier: 'MEDIUM',
        estimatedHours: 3.5,
        verificationAssertion: 'assert verification_proof is not None',
        workingMemoryNote: 'Awaiting human review for Medium risk file updates.',
      },
      {
        id: `${newId}_4`,
        goalId: newId,
        label: 'Deterministic Post-Condition Audit',
        phase: 'Verification',
        status: 'pending',
        dependsOn: [`${newId}_3`],
        isCriticalPath: true,
        tool: 'verify_assertion()',
        riskTier: 'LOW',
        estimatedHours: 1.0,
        verificationAssertion: 'assert exit_code == 0',
        workingMemoryNote: 'Commit execution record to audit ledger.',
      },
    ]

    set((state) => ({
      goals: [newGoal, ...state.goals],
      selectedGoalId: newId,
      dagNodes: [...newNodes, ...state.dagNodes],
      activeView: 'goals',
    }))
  },

  // DAG Planner
  dagNodes: EDITH_DAG_NODES,
  selectedDagNodeId: 't_plan',
  setSelectedDagNodeId: (selectedDagNodeId) => set({ selectedDagNodeId }),
  toggleDagTaskStatus: (nodeId) => {
    set((state) => {
      const updatedNodes = state.dagNodes.map((node) => {
        if (node.id === nodeId) {
          const nextStatus: DagNode['status'] =
            node.status === 'done'
              ? 'in_progress'
              : node.status === 'in_progress'
              ? 'done'
              : 'in_progress'
          return { ...node, status: nextStatus }
        }
        return node
      })

      // Recalculate goal progress
      const currentGoalId = state.selectedGoalId
      const goalNodes = updatedNodes.filter((n) => n.goalId === currentGoalId)
      const doneCount = goalNodes.filter((n) => n.status === 'done').length
      const totalCount = goalNodes.length || 1
      const progress = Math.round((doneCount / totalCount) * 100)

      const updatedGoals = state.goals.map((g) => {
        if (g.id === currentGoalId) {
          return {
            ...g,
            progress,
            tasksDone: doneCount,
            status: progress === 100 ? ('completed' as const) : ('in_progress' as const),
          }
        }
        return g
      })

      return {
        dagNodes: updatedNodes,
        goals: updatedGoals,
      }
    })
  },
  criticalPathOnly: false,
  setCriticalPathOnly: (criticalPathOnly) => set({ criticalPathOnly }),

  // Priority Tasks
  priorityTasks: EDITH_PRIORITY_TASKS,

  // Approvals & Policy Gate
  approvals: EDITH_APPROVALS,
  selectedApproval: EDITH_APPROVALS[0],
  showApprovalModal: false,
  openApprovalModal: (approval) => set({ selectedApproval: approval, showApprovalModal: true }),
  closeApprovalModal: () => set({ showApprovalModal: false }),
  approveAction: (approvalId) => {
    set((state) => {
      const updated = state.approvals.map((a) =>
        a.id === approvalId ? { ...a, status: 'APPROVED' as const } : a
      )

      // Advance orchestrator step 7 to completed and 8 to active
      const updatedSteps = state.timelineSteps.map((step) => {
        if (step.stepNumber === 7) return { ...step, status: 'completed' as const }
        if (step.stepNumber === 8) return { ...step, status: 'active' as const }
        return step
      })

      // Add a working memory note of approval
      const newMemory: HybridMemoryItem = {
        id: `mem_wm_appr_${Date.now()}`,
        tier: 'working',
        title: `Operator Approved: ${approvalId}`,
        content: `Human operator signed policy release for target. Sandbox execution initiated under strict timeout boundary.`,
        metadata: {
          category: 'Policy Audit',
          created: 'Just now',
          accessCount: 1,
        },
      }

      return {
        approvals: updated,
        timelineSteps: updatedSteps,
        memories: [newMemory, ...state.memories],
        showApprovalModal: false,
        orchestratorStatus: 'VERIFYING',
      }
    })

    // Reset back to idle after verification simulation
    setTimeout(() => {
      set((state) => ({
        orchestratorStatus: 'IDLE',
        timelineSteps: state.timelineSteps.map((s) => ({
          ...s,
          status: 'completed' as const,
        })),
      }))
    }, 1800)
  },
  rejectAction: (approvalId) => {
    set((state) => ({
      approvals: state.approvals.map((a) =>
        a.id === approvalId ? { ...a, status: 'REJECTED' as const } : a
      ),
      showApprovalModal: false,
      orchestratorStatus: 'IDLE',
    }))
  },

  // Execution & Timeline
  timelineSteps: ORCHESTRATOR_TIMELINE_STEPS,
  executions: EDITH_EXECUTIONS,
  selectedExecutionId: 'exec_129',
  setSelectedExecutionId: (selectedExecutionId) => set({ selectedExecutionId }),
  orchestratorStatus: 'IDLE',

  // Hybrid Memory
  memories: EDITH_HYBRID_MEMORIES,
  memoryFilter: 'all',
  setMemoryFilter: (memoryFilter) => set({ memoryFilter }),
  addMemoryItem: (item) => {
    const newItem: HybridMemoryItem = {
      ...item,
      id: `mem_user_${Date.now()}`,
    }
    set((state) => ({ memories: [newItem, ...state.memories] }))
  },

  // RAG / Knowledge
  ragChunks: EDITH_RAG_CHUNKS,
  ragTopK: 4,
  setRagTopK: (ragTopK) => set({ ragTopK }),
  ragSearchQuery: '',
  setRagSearchQuery: (ragSearchQuery) => set({ ragSearchQuery }),

  // Scenarios
  scenarios: EDITH_SCENARIOS,
  activeScenarioId: 'sc_academic',
  isScenarioRunning: false,
  scenarioProgress: 0,
  scenarioActiveStepIndex: 0,
  runScenario: async (scenarioId: string) => {
    const scenario = get().scenarios.find((s) => s.id === scenarioId)
    if (!scenario) return

    set({
      activeScenarioId: scenarioId,
      isScenarioRunning: true,
      scenarioProgress: 10,
      scenarioActiveStepIndex: 0,
      orchestratorStatus: 'EXECUTING',
    })

    // Simulate multi-step orchestrator pipeline from Section 5.8
    for (let i = 0; i < scenario.executionTrace.length; i++) {
      await new Promise((res) => setTimeout(res, 850))
      const pct = Math.round(((i + 1) / scenario.executionTrace.length) * 100)
      set({
        scenarioActiveStepIndex: i,
        scenarioProgress: pct,
        orchestratorStatus: i === scenario.executionTrace.length - 1 ? 'VERIFYING' : 'EXECUTING',
      })
    }

    await new Promise((res) => setTimeout(res, 600))

    // Add memory item resulting from scenario
    const generatedMemory: HybridMemoryItem = {
      id: `mem_scenario_${Date.now()}`,
      tier: 'long_term',
      title: `Scenario ${scenario.chapter} Outcome: ${scenario.title}`,
      content: scenario.memoryUpdate,
      metadata: {
        category: 'Scenario Execution',
        created: 'Just now',
        accessCount: 1,
      },
    }

    set((state) => ({
      isScenarioRunning: false,
      scenarioProgress: 100,
      orchestratorStatus: 'IDLE',
      memories: [generatedMemory, ...state.memories],
    }))
  },

  runFastVerticalSliceDemo: async () => {
    // Jump straight to scenarios view and execute Section 8.4 Document Organization
    set({
      activeView: 'scenarios',
      activeScenarioId: 'sc_vertical_slice',
    })
    await get().runScenario('sc_vertical_slice')
  },

  // Chat Copilot
  chatMessages: [
    {
      id: 'msg_welcome',
      sender: 'edith',
      text: 'EDITH Personal AI OS online. Operating across 6 architectural layers: Interaction, Intelligence, Memory, Knowledge, Tools, and Execution & Verification.',
      timestamp: '12:40:00 IST',
      dagSummary: {
        tasks: [
          { label: 'PostgreSQL Operational Schema', status: 'done', tool: 'db_migration()' },
          { label: 'Security & Policy Engine Gating', status: 'done', tool: 'policy_test_suite()' },
          { label: 'Hybrid Memory & Vector RAG', status: 'done', tool: 'vector_index_test()' },
          { label: 'Planner & Tool Dispatch System', status: 'in_progress', tool: 'planner_orchestrator()' },
        ],
      },
    },
  ],
  sendChatMessage: (text) => {
    const userMsg: ChatMessage = {
      id: `usr_${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' IST',
    }

    set((state) => ({
      chatMessages: [...state.chatMessages, userMsg],
      orchestratorStatus: 'EXECUTING',
    }))

    // Intelligent response parsing based on intent keywords
    setTimeout(() => {
      const lower = text.toLowerCase().trim()
      let reply: ChatMessage

      if (/^(he|hello|hi|hey|greetings|good\s+morning|good\s+evening|sup|yo)\b/i.test(lower) || lower === 'he' || lower === 'hello' || lower === 'hi' || lower.includes('who are you')) {
        reply = {
          id: `edith_${Date.now()}`,
          sender: 'edith',
          text: 'Hello Operator! EDITH Personal AI OS is fully initialized and operational across all 6 cognitive layers. I can assist with file organization, codebase debugging, academic planning, and industrial reliability analysis.',
          timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' IST',
          intentJson: {
            intent: 'operator_greeting',
            active_layers: 6,
            security: 'SOVEREIGN_LOCAL',
          },
          dagSummary: {
            tasks: [
              { label: 'Interaction Layer Handshake', status: 'done', tool: 'session_init()' },
              { label: 'Hybrid Memory Access Check', status: 'done', tool: 'memory_ping()' },
              { label: 'Policy Engine Barrier Gating', status: 'done', tool: 'policy_check()' },
              { label: 'Awaiting Operator Goal', status: 'in_progress', tool: 'listen_command()' },
            ],
          },
        }
      } else if (lower.includes('clean') || lower.includes('organize') || lower.includes('folder') || lower.includes('file')) {
        reply = {
          id: `edith_${Date.now()}`,
          sender: 'edith',
          text: 'Detected intent: filesystem_organization (Chapter 8.4 Vertical Slice). I have parsed 367 unorganized files in /workspace/unorganized and formulated a 6-category taxonomy. Policy Engine requires human sign-off before moving files.',
          timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' IST',
          intentJson: {
            intent: 'filesystem_organization',
            target: '/workspace/unorganized',
            total_files: 367,
            risk_tier: 'MEDIUM',
          },
          dagSummary: {
            tasks: [
              { label: 'Analyze 367 unorganized files by MIME', status: 'done', tool: 'search_files()', risk: 'LOW' },
              { label: 'Formulate 6-category taxonomy', status: 'done', tool: 'plan_taxonomy()', risk: 'LOW' },
              { label: 'Request human approval for batch relocation', status: 'waiting_approval', tool: 'policy_gate()', risk: 'MEDIUM' },
              { label: 'Execute batch relocation', status: 'pending', tool: 'move_files()', risk: 'MEDIUM' },
              { label: 'Verify checksums & folder integrity', status: 'pending', tool: 'verify_checksums()', risk: 'LOW' },
            ],
          },
          toolExecution: {
            tool: 'search_files()',
            riskTier: 'LOW',
            verified: true,
            assertion: 'assert count(files) == 367',
            proof: 'EXIT_CODE: 0 | SHA256_TREE_MATCH: verified',
            stdout: 'Scanned 367 files: 91 PDFs, 32 DOCX, 118 Images, 79 Code, 47 Archives. Pre-condition verified.',
          },
        }
      } else if (lower.includes('exam') || lower.includes('study') || lower.includes('subject') || lower.includes('academic')) {
        reply = {
          id: `edith_${Date.now()}`,
          sender: 'edith',
          text: 'Academic Workload Planner (Chapter 8.1) invoked. I cross-referenced 5 CSE subjects with remaining semester calendar (43 days left). Prioritizing DAA Knapsack & DBMS indexing today.',
          timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' IST',
          intentJson: {
            intent: 'academic_workload_management',
            subjects_count: 5,
            critical_deadline: '18 October 2026',
            allocated_today_hrs: 4.5,
          },
          dagSummary: {
            tasks: [
              { label: 'Parse 5 subject syllabi & exam dates', status: 'done', tool: 'parse_syllabus()', risk: 'LOW' },
              { label: 'Map project dependencies & deliverables', status: 'done', tool: 'graph_dependencies()', risk: 'LOW' },
              { label: 'Calculate priority weights by deadline', status: 'done', tool: 'priority_calculator()', risk: 'LOW' },
              { label: 'Schedule 2h DAA + 2h EDITH work block', status: 'in_progress', tool: 'create_calendar_event()', risk: 'MEDIUM' },
            ],
          },
        }
      } else if (lower.includes('bug') || lower.includes('error') || lower.includes('start') || lower.includes('debug')) {
        reply = {
          id: `edith_${Date.now()}`,
          sender: 'edith',
          text: 'Diagnostic Tool called (Chapter 8.2). Inspected server logs and AST. Root cause: Pydantic v2 breaking change (BaseSettings was moved to pydantic-settings). Prepared unified diff patch.',
          timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' IST',
          intentJson: {
            intent: 'codebase_debugging',
            exception: 'ImportError: BaseSettings from pydantic',
            suggested_fix: 'pip install pydantic-settings',
          },
          toolExecution: {
            tool: 'ast_analyze()',
            riskTier: 'LOW',
            verified: true,
            assertion: 'assert "BaseSettings" in module_imports',
            proof: 'AST_SCAN_MATCH: server/core/settings.py line 4',
            stdout: 'Detected deprecated import from pydantic. Gating patch via Policy Engine (Medium Risk).',
          },
        }
      } else {
        reply = {
          id: `edith_${Date.now()}`,
          sender: 'edith',
          text: `Goal accepted: "${text}". Intelligence Layer decomposed request into a structured DAG with deterministic verification checkpoints. Consulted Hybrid Memory (Short-Term + PostgreSQL Long-Term + RAG).`,
          timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' IST',
          dagSummary: {
            tasks: [
              { label: 'Query Semantic Vector Index (docs & memories)', status: 'done', tool: 'vector_search()', risk: 'LOW' },
              { label: 'Validate Tool Registry policy & risk tiers', status: 'done', tool: 'policy_check()', risk: 'LOW' },
              { label: 'Synthesize solution step execution', status: 'in_progress', tool: 'orchestrator_dispatch()', risk: 'MEDIUM' },
              { label: 'Deterministic Post-condition Assertion', status: 'pending', tool: 'verify_assertion()', risk: 'LOW' },
            ],
          },
        }
      }

      set((state) => ({
        chatMessages: [...state.chatMessages, reply],
        orchestratorStatus: 'IDLE',
      }))
    }, 1200)
  },
  clearChat: () => {
    set({
      chatMessages: [
        {
          id: 'msg_welcome_reset',
          sender: 'edith',
          text: 'EDITH conversational context reset. Operational memory and PostgreSQL Long-Term stores remain intact.',
          timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' IST',
        },
      ],
    })
  },

  // System Stats
  systemStats: {
    goalsActive: 4,
    tasksVerified: 12,
    approvalPendingCount: 1,
    memoryItemCount: 11,
    verifierPassRate: 94.6,
  },
}))
