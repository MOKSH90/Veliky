// ============================================================================
// EDITH: Personal AI Operating System Data Store
// Aligned with EDITH Final Year Project Report (Kurukshetra University, PIET)
// Chapters 5, 6, 7, 8, 10
// ============================================================================

export interface EdithGoal {
  id: string
  title: string
  objective: string
  deadline: string
  progress: number
  status: 'active' | 'in_progress' | 'completed' | 'blocked'
  category: 'Software Engineering' | 'Academics' | 'Research' | 'System Vertical Slice'
  priority: 'High' | 'Medium' | 'Critical'
  tasksTotal: number
  tasksDone: number
  tasksBlocked: number
  activeWorkflow?: string
  color: string
}

export interface DagNode {
  id: string
  goalId: string
  label: string
  phase: string
  status: 'done' | 'in_progress' | 'blocked' | 'pending'
  dependsOn: string[]
  isCriticalPath?: boolean
  tool?: string
  riskTier: 'LOW' | 'MEDIUM' | 'HIGH'
  estimatedHours: number
  verificationAssertion: string
  workingMemoryNote?: string
  outputSummary?: string
}

export interface PriorityTask {
  id: string
  goalId: string
  goalTitle: string
  title: string
  deadlineNotice: string
  effort: string
  priority: 'CRITICAL' | 'HIGH' | 'NORMAL'
  status: 'in_progress' | 'ready' | 'waiting_approval'
  blocksDownstream: number
  decisionExplanation: string
}

export interface PolicyApproval {
  id: string
  tool: string
  goalId: string
  taskLabel: string
  riskTier: 'MEDIUM' | 'HIGH'
  timestamp: string
  requester: string
  targetResource: string
  proposedAction: string
  rationale: string
  decisionFactors: string[]
  diffPreview?: string
  status: 'WAITING_APPROVAL' | 'APPROVED' | 'REJECTED'
}

export interface ExecutionRecord {
  execution_id: string
  goal_id: string
  task_id: string
  tool: string
  risk_tier: 'LOW' | 'MEDIUM' | 'HIGH'
  status: 'success' | 'failed' | 'executing' | 'waiting_approval'
  started_at: string
  finished_at: string
  duration_ms: number
  verified: boolean
  verification_assertion: string
  verification_proof: string
  parameters: Record<string, any>
  stdout_preview: string
}

export interface OrchestratorStep {
  stepNumber: number
  timestamp: string
  label: string
  subtext: string
  layer: 'Interaction' | 'Intelligence' | 'Memory' | 'Knowledge' | 'Tools' | 'Execution & Verification'
  status: 'completed' | 'active' | 'pending'
  details: string
}

export interface HybridMemoryItem {
  id: string
  tier: 'short_term' | 'working' | 'long_term' | 'semantic_rag'
  title: string
  content: string
  metadata: {
    source?: string
    created: string
    relevance?: number
    category?: string
    accessCount?: number
  }
}

export interface DocumentRagChunk {
  id: string
  documentName: string
  chunkIndex: number
  totalChunks: number
  text: string
  vectorId: string
  similarityScore: number
  tokens: number
  tags: string[]
}

export interface BenchmarkMetric {
  category: string
  edithScore: number
  baselineScore: number
  unit: string
  delta: string
  explanation: string
}

// ----------------------------------------------------------------------------
// Active Goals (Chapter 7.1 & 7.2)
// ----------------------------------------------------------------------------
export const EDITH_ACTIVE_GOALS: EdithGoal[] = [
  {
    id: 'goal_edith',
    title: 'EDITH Project',
    objective: 'Build, verify, and evaluate the goal-driven personal AI agent architecture across all 6 layers.',
    deadline: '30 September 2026',
    progress: 74,
    status: 'in_progress',
    category: 'Software Engineering',
    priority: 'Critical',
    tasksTotal: 6,
    tasksDone: 3,
    tasksBlocked: 0,
    activeWorkflow: 'Repository Analysis & Verification',
    color: '#6366f1',
  },
  {
    id: 'goal_exams',
    title: 'Exam Preparation (Sem 7/8)',
    objective: 'Master 5 CSE core subjects (DBMS, DAA, OS, AI, CN) with syllabus RAG indexing and revision tests.',
    deadline: '18 October 2026',
    progress: 42,
    status: 'in_progress',
    category: 'Academics',
    priority: 'High',
    tasksTotal: 5,
    tasksDone: 2,
    tasksBlocked: 1,
    color: '#06b6d4',
  },
  {
    id: 'goal_research',
    title: 'Multimodal Agent Research',
    objective: 'Systematic literature review on self-correction, ReAct architectures, MemGPT hybrid memory, and safe tool grounding.',
    deadline: '25 October 2026',
    progress: 61,
    status: 'in_progress',
    category: 'Research',
    priority: 'Medium',
    tasksTotal: 4,
    tasksDone: 2,
    tasksBlocked: 0,
    color: '#10b981',
  },
  {
    id: 'goal_vertical_slice',
    title: 'Document Organization (Vertical Slice)',
    objective: 'Phase 1 MVP: Classify 367 unorganized project files into 6 structured directories with policy gate and verify.',
    deadline: 'Completed (Verified)',
    progress: 100,
    status: 'completed',
    category: 'System Vertical Slice',
    priority: 'High',
    tasksTotal: 5,
    tasksDone: 5,
    tasksBlocked: 0,
    color: '#f59e0b',
  },
]

// ----------------------------------------------------------------------------
// Task Graph / DAG Planner (Section 5.9 & 7.2 Figure 10)
// ----------------------------------------------------------------------------
export const EDITH_DAG_NODES: DagNode[] = [
  {
    id: 't_db',
    goalId: 'goal_edith',
    label: 'PostgreSQL Operational Schema',
    phase: 'Backend Core',
    status: 'done',
    dependsOn: [],
    isCriticalPath: true,
    tool: 'db_migration()',
    riskTier: 'LOW',
    estimatedHours: 4.0,
    verificationAssertion: 'SELECT COUNT(*) FROM information_schema.tables WHERE table_schema="public" == 8',
    workingMemoryNote: 'Schema initialized: users, goals, tasks, memories, documents, tool_calls, executions, audit_logs.',
    outputSummary: 'PostgreSQL tables and foreign key constraints verified with migration 001_initial.sql.',
  },
  {
    id: 't_auth',
    goalId: 'goal_edith',
    label: 'Security & Policy Engine Gating',
    phase: 'Security Subsystem',
    status: 'done',
    dependsOn: ['t_db'],
    isCriticalPath: true,
    tool: 'policy_test_suite()',
    riskTier: 'MEDIUM',
    estimatedHours: 6.5,
    verificationAssertion: 'assert policy_engine.classify("delete_file") == RiskTier.BLOCKED',
    workingMemoryNote: 'Three-tier deterministic policy rules compiled. Canary token sanitization verified.',
    outputSummary: '3-tier classification active. 100% of high/medium tool proposals correctly intercepted.',
  },
  {
    id: 't_mem',
    goalId: 'goal_edith',
    label: 'Hybrid Memory & Vector RAG',
    phase: 'Memory Layer',
    status: 'done',
    dependsOn: ['t_db'],
    isCriticalPath: false,
    tool: 'vector_index_test()',
    riskTier: 'LOW',
    estimatedHours: 8.0,
    verificationAssertion: 'assert len(vector_store.similarity_search("FastAPI", k=3)) == 3',
    workingMemoryNote: 'Short-term buffer, working memory state machine, and pgvector cosine search connected.',
    outputSummary: 'Hybrid memory operational. Cosine distance query latency < 12ms over 312 document chunks.',
  },
  {
    id: 't_plan',
    goalId: 'goal_edith',
    label: 'Planner & Tool Dispatch System',
    phase: 'Intelligence Layer',
    status: 'in_progress',
    dependsOn: ['t_auth', 't_mem'],
    isCriticalPath: true,
    tool: 'planner_orchestrator()',
    riskTier: 'MEDIUM',
    estimatedHours: 12.0,
    verificationAssertion: 'assert len(dag_engine.get_critical_path()) >= 3 and not dag_engine.has_cycle()',
    workingMemoryNote: 'Refactoring topological sort from Tarjan to Kahn for incremental subtask re-planning.',
    outputSummary: 'Evaluating cycle detection patch. Pending human approval for file modification.',
  },
  {
    id: 't_verif',
    goalId: 'goal_edith',
    label: 'Deterministic Verifier & Benchmark Run',
    phase: 'Evaluation & Verifier',
    status: 'pending',
    dependsOn: ['t_plan'],
    isCriticalPath: true,
    tool: 'benchmark_harness()',
    riskTier: 'LOW',
    estimatedHours: 10.0,
    verificationAssertion: 'assert benchmark_results["edith_task_completion"] > 0.85',
    workingMemoryNote: 'Pending completion of planner dispatch loop.',
    outputSummary: 'Awaiting upstream Planner verification.',
  },
  {
    id: 't_deploy',
    goalId: 'goal_edith',
    label: 'Packaging, Audit Ledger & Final Report',
    phase: 'Deployment',
    status: 'pending',
    dependsOn: ['t_verif'],
    isCriticalPath: true,
    tool: 'generate_dossier()',
    riskTier: 'HIGH',
    estimatedHours: 5.0,
    verificationAssertion: 'assert audit_ledger.verify_tamper_evident_hashes() == True',
    workingMemoryNote: 'Final project submission dossier for Kurukshetra University / PIET.',
    outputSummary: 'Awaiting evaluation benchmarks.',
  },
]

// ----------------------------------------------------------------------------
// Today's Priority Tasks (Chapter 7.1)
// ----------------------------------------------------------------------------
export const EDITH_PRIORITY_TASKS: PriorityTask[] = [
  {
    id: 'pt_1',
    goalId: 'goal_edith',
    goalTitle: 'EDITH Project',
    title: 'Review Policy Gate: Kahn DAG Cycle Detection Patch',
    deadlineNotice: 'Due today · 17:00 IST',
    effort: '1.5 hrs',
    priority: 'CRITICAL',
    status: 'waiting_approval',
    blocksDownstream: 2,
    decisionExplanation: 'Blocks Verification and Deployment. Policy Engine intercepted file write to server/planner/dag_engine.py.',
  },
  {
    id: 'pt_2',
    goalId: 'goal_exams',
    goalTitle: 'Exam Preparation',
    title: 'Index Kurukshetra University DAA & DBMS Question Papers',
    deadlineNotice: 'Due today · 21:00 IST',
    effort: '45 mins',
    priority: 'HIGH',
    status: 'ready',
    blocksDownstream: 1,
    decisionExplanation: 'Semester exams start in 23 days. Ingestion required before AI can generate mock exam questions.',
  },
  {
    id: 'pt_3',
    goalId: 'goal_research',
    goalTitle: 'Multimodal Research',
    title: 'Synthesize MemGPT vs ReAct Comparison Matrix',
    deadlineNotice: 'Due tomorrow',
    effort: '2.0 hrs',
    priority: 'NORMAL',
    status: 'in_progress',
    blocksDownstream: 0,
    decisionExplanation: 'Literature claims extracted from 3 papers. Synthesized output destined for Long-Term Memory.',
  },
]

// ----------------------------------------------------------------------------
// Human-in-the-Loop Approvals (Chapter 5.11 & 7.1 Figure 9)
// ----------------------------------------------------------------------------
export const EDITH_APPROVALS: PolicyApproval[] = [
  {
    id: 'appr_01',
    tool: 'apply_patch',
    goalId: 'goal_edith',
    taskLabel: 'Planner / Tool system (dag_engine.py)',
    riskTier: 'MEDIUM',
    timestamp: '12:41:06 IST',
    requester: 'EDITH Orchestrator (Intelligence Layer)',
    targetResource: 'server/planner/dag_engine.py',
    proposedAction: 'Replace Tarjan recursive cycle detector with Kahn topological sort to enable real-time subtask replanning.',
    rationale: 'Kahn algorithm reduces replan overhead from O(V+E) recursion to iterative queue processing, preventing call-stack exhaustion on dynamic DAGs.',
    decisionFactors: [
      'Medium-risk tier declared in Tool Registry (code modification)',
      'Deterministic policy requires human confirmation before altering core scheduling logic',
      'Pre-condition verified: test suite passing on baseline commit',
      'Post-condition assertion prepared: test_cycle_detection.py',
    ],
    diffPreview: `--- a/server/planner/dag_engine.py
+++ b/server/planner/dag_engine.py
@@ -42,12 +42,16 @@
-def detect_cycles_tarjan(nodes, edges):
-    # Recursive DFS implementation
-    visited = set()
+def resolve_topological_kahn(nodes, edges):
+    # Iterative Kahn's algorithm for dynamic replanning
+    in_degree = {n.id: 0 for n in nodes}
+    for edge in edges:
+        in_degree[edge.target] += 1
+    queue = [n.id for n in nodes if in_degree[n.id] == 0]
+    order = []
+    while queue:
+        curr = queue.pop(0)
+        order.append(curr)
+    return order`,
    status: 'WAITING_APPROVAL',
  },
  {
    id: 'appr_02',
    tool: 'move_files',
    goalId: 'goal_vertical_slice',
    taskLabel: 'Document Organization Vertical Slice',
    riskTier: 'MEDIUM',
    timestamp: '10:46:12 IST',
    requester: 'EDITH Orchestrator (Phase 1 Slice)',
    targetResource: '367 files in /workspace/unorganized',
    proposedAction: 'Batch move 367 files into 6 structured directories: Documentation/, Research/, Images/, Source/, Releases/, Archives/.',
    rationale: 'File relocation is classified as Medium Risk by the Policy Engine to prevent accidental path breakage. Zero files deleted.',
    decisionFactors: [
      'File system modification touching multiple extensions (.pdf, .docx, .py, .png)',
      'Backup snapshot hash created before operation',
      'Requires human sign-off on target folder taxonomy',
    ],
    diffPreview: `Batch Move Matrix:
  [Docs]     91 PDFs, 32 DOCX files -> /workspace/Documentation/
  [Research] 28 LaTeX, 14 BibTeX   -> /workspace/Research/
  [Images]   118 PNG/JPG/SVG       -> /workspace/Images/
  [Source]   79 .py, .tsx files    -> /workspace/Source/
  [Archives] 47 .zip, .tar.gz      -> /workspace/Archives/`,
    status: 'APPROVED',
  },
]

// ----------------------------------------------------------------------------
// Execution Timeline & Orchestrator Sequence (Chapter 7.3 Figure 11 & Section 5.8)
// ----------------------------------------------------------------------------
export const ORCHESTRATOR_TIMELINE_STEPS: OrchestratorStep[] = [
  {
    stepNumber: 1,
    timestamp: '12:41:03',
    label: 'Goal received',
    subtext: '"Analyze repo, verify tests, and update cycle detection algorithm"',
    layer: 'Interaction',
    status: 'completed',
    details: 'Natural language request parsed into structured intent: { intent: "software_maintenance", goal: "optimize_dag_cycle_sort", priority: "high" }',
  },
  {
    stepNumber: 2,
    timestamp: '12:41:04',
    label: 'Context retrieved',
    subtext: 'Hybrid Memory + Semantic Vector RAG consulted',
    layer: 'Memory',
    status: 'completed',
    details: 'Retrieved 2 Long-Term facts ("Backend uses FastAPI", "Prefer Python for services") and 3 document chunks from docs/architecture.md.',
  },
  {
    stepNumber: 3,
    timestamp: '12:41:05',
    label: 'Plan generated',
    subtext: 'Task DAG formulated with 6 subtasks and critical path',
    layer: 'Intelligence',
    status: 'completed',
    details: 'Dependency tree generated. Critical path identified: DB -> Policy Engine -> Planner -> Verifier -> Dossier.',
  },
  {
    stepNumber: 4,
    timestamp: '12:41:06',
    label: 'Permission checked',
    subtext: 'Policy Engine gated tool "apply_patch" as MEDIUM RISK',
    layer: 'Tools',
    status: 'completed',
    details: 'Policy check: read_file = AUTO_APPROVED; apply_patch = REQUIRES_HUMAN_APPROVAL. Dispatched approval request to interaction layer.',
  },
  {
    stepNumber: 5,
    timestamp: '12:41:07',
    label: 'Repository tool called',
    subtext: 'Invoking inspect_workspace() on server/planner/',
    layer: 'Tools',
    status: 'completed',
    details: 'Tool execution dispatched within deterministic sandbox. Monitored file handles and syscall boundary.',
  },
  {
    stepNumber: 6,
    timestamp: '12:41:08',
    label: '14 files analyzed',
    subtext: 'AST parsed; cycle detection bottlenecks mapped in dag_engine.py',
    layer: 'Intelligence',
    status: 'completed',
    details: 'Recursive call graph traced in dag_engine.py lines 42-68. Synthetic benchmark demonstrates 3.4x speedup with Kahn formulation.',
  },
  {
    stepNumber: 7,
    timestamp: '12:41:09',
    label: 'Result verified',
    subtext: 'Post-condition assertion executed: PASS',
    layer: 'Execution & Verification',
    status: 'active',
    details: 'Deterministic Verifier ran: pytest server/tests/test_planner.py -k "cycle". Exit code: 0. 14 test cases passed in 0.28s.',
  },
  {
    stepNumber: 8,
    timestamp: '12:41:10',
    label: 'Task state updated',
    subtext: 'Working memory updated · Audit ledger signed',
    layer: 'Memory',
    status: 'pending',
    details: 'Committed execution record exec_129 to PostgreSQL executions table. Cryptographic hash recorded in audit_logs.',
  },
]

// ----------------------------------------------------------------------------
// Execution Objects (Chapter 6.2 Figure 8)
// ----------------------------------------------------------------------------
export const EDITH_EXECUTIONS: ExecutionRecord[] = [
  {
    execution_id: 'exec_129',
    goal_id: 'goal_edith',
    task_id: 't_plan',
    tool: 'search_files',
    risk_tier: 'LOW',
    status: 'success',
    started_at: '2026-09-14T12:41:07.102Z',
    finished_at: '2026-09-14T12:41:08.411Z',
    duration_ms: 1309,
    verified: true,
    verification_assertion: 'assert len(analyzed_files) == 14 and all(f.endswith(".py") for f in analyzed_files)',
    verification_proof: 'EXIT_CODE: 0 | SHA256_TREE_MATCH: b4a98f12... | 14 FILES INSPECTED VALID',
    parameters: {
      directory: 'server/planner',
      extension_filter: ['.py'],
      parse_ast: true,
    },
    stdout_preview: `[inspect_workspace] Found 14 matching Python files in server/planner/
- server/planner/dag_engine.py (184 lines, 1 cycle risk)
- server/planner/context_engine.py (142 lines)
- server/planner/orchestrator.py (310 lines)
... (11 more files)
AST parsing completed in 410ms. No syntax violations detected.`,
  },
  {
    execution_id: 'exec_128',
    goal_id: 'goal_vertical_slice',
    task_id: 't_verif_org',
    tool: 'verify_checksums',
    risk_tier: 'LOW',
    status: 'success',
    started_at: '2026-09-14T10:47:03.012Z',
    finished_at: '2026-09-14T10:47:05.188Z',
    duration_ms: 2176,
    verified: true,
    verification_assertion: 'assert moved_count == 367 and unlinked_corruptions == 0',
    verification_proof: 'EXIT_CODE: 0 | INTEGRITY_CHECK: 367/367 MD5_MATCH | DIRECTORY_STRUCTURE: COMPLIANT',
    parameters: {
      target_dir: '/workspace',
      expected_folders: ['Documentation', 'Research', 'Images', 'Source', 'Releases', 'Archives'],
    },
    stdout_preview: `[verify_checksums] Scanning target directory structure...
- Documentation/ : 123 files (MD5 verified)
- Research/      : 42 files (MD5 verified)
- Images/        : 118 files (MD5 verified)
- Source/        : 79 files (MD5 verified)
- Archives/      : 47 files (MD5 verified)
Total: 367 files. 0 orphaned files, 0 data loss. Verification PASSED.`,
  },
  {
    execution_id: 'exec_127',
    goal_id: 'goal_edith',
    task_id: 't_auth',
    tool: 'policy_test_suite',
    risk_tier: 'MEDIUM',
    status: 'success',
    started_at: '2026-09-14T09:15:10.000Z',
    finished_at: '2026-09-14T09:15:12.450Z',
    duration_ms: 2450,
    verified: true,
    verification_assertion: 'assert all_policies_enforced == True and canary_leak == 0',
    verification_proof: 'ALL_ASSERTIONS_PASSED: 24/24 POLICY TESTS OK | ZERO BYPASSES',
    parameters: {
      synthetic_attacks: ['prompt_injection_file_delete', 'rm_rf_sandbox', 'privilege_escalation'],
    },
    stdout_preview: `[policy_engine_eval] Testing 3-tier risk classification:
Test 1: Read harmless README.md -> AUTO_APPROVE [PASS]
Test 2: Modify calendar event -> REQUIRE_APPROVAL [PASS]
Test 3: Delete database table -> BLOCKED [PASS]
Test 4: Indirect prompt injection via mock PDF -> CANARY_INTERCEPTED [PASS]`,
  },
]

// ----------------------------------------------------------------------------
// Hybrid Memory Architecture (Chapter 5.4 Figure 4)
// ----------------------------------------------------------------------------
export const EDITH_HYBRID_MEMORIES: HybridMemoryItem[] = [
  // Short-Term Memory (Live Conversation Context)
  {
    id: 'mem_st_1',
    tier: 'short_term',
    title: 'Current Session Context (Turn Buffer)',
    content: 'User requested repository analysis for cycle detection in dag_engine.py and asked for verification before applying changes.',
    metadata: {
      source: 'WebSocket Session #9021',
      created: 'Just now (Turn 3)',
      accessCount: 8,
    },
  },
  {
    id: 'mem_st_2',
    tier: 'short_term',
    title: 'Pending Tool Resolution',
    content: 'Waiting for operator approval on apply_patch diff for server/planner/dag_engine.py.',
    metadata: {
      source: 'Policy Interceptor',
      created: '2 mins ago',
      accessCount: 4,
    },
  },

  // Working Memory (Active Task State Machine)
  {
    id: 'mem_wm_1',
    tier: 'working',
    title: 'Active Goal Register: goal_edith',
    content: 'Active Task: t_plan (Planner / Tool system). Progress: 74%. Upstream t_db and t_auth verified.',
    metadata: {
      category: 'Task Register',
      created: 'Active Session',
      accessCount: 19,
    },
  },
  {
    id: 'mem_wm_2',
    tier: 'working',
    title: 'Scratchpad: AST Analysis dag_engine.py',
    content: 'Detected cycle vulnerability in recursive DFS at recursion depth > 250. Target fix: iterative Kahn in-degree array.',
    metadata: {
      category: 'Scratchpad',
      created: '12:41:08 IST',
      accessCount: 12,
    },
  },

  // Long-Term Memory (PostgreSQL Durable Store)
  {
    id: 'mem_lt_1',
    tier: 'long_term',
    title: 'Architectural Convention: FastAPI Backend',
    content: 'The user prefers FastAPI for microservices with Pydantic v2 strict models and typed router endpoints.',
    metadata: {
      category: 'Durable Fact',
      created: '14 days ago',
      source: 'User Preference Dialogue',
      accessCount: 45,
    },
  },
  {
    id: 'mem_lt_2',
    tier: 'long_term',
    title: 'Notification Style Preference',
    content: 'Prefer concise decision explanations with explicit factor bullet points rather than lengthy chain-of-thought dumps.',
    metadata: {
      category: 'User Persona',
      created: '21 days ago',
      source: 'Settings Onboarding',
      accessCount: 62,
    },
  },
  {
    id: 'mem_lt_3',
    tier: 'long_term',
    title: 'Academic Profile: CSE Semester 7/8',
    content: 'Student at Kurukshetra University (P.I.E.T.). Major: Computer Science & Engineering. Final year project: EDITH.',
    metadata: {
      category: 'Identity Profile',
      created: '30 days ago',
      source: 'Academic Onboarding',
      accessCount: 110,
    },
  },

  // Semantic Memory (Vector RAG)
  {
    id: 'mem_rag_1',
    tier: 'semantic_rag',
    title: 'EDITH Report Chapter 5.8: The Orchestrator',
    content: 'The orchestrator receives natural language, detects goals, retrieves context, invokes the planner, checks permissions, issues tool calls, and verifies outcomes.',
    metadata: {
      source: 'docs/EDITH_Project_Report.docx [Chunk #42]',
      created: 'Indexed 3 days ago',
      relevance: 0.94,
    },
  },
  {
    id: 'mem_rag_2',
    tier: 'semantic_rag',
    title: 'EDITH Report Chapter 5.11: 3-Tier Policy Risk Matrix',
    content: 'Tool risk classifications: Low Risk (read, search) = Auto-approved; Medium Risk (move, patch, calendar) = Requires approval; High Risk (delete, shell) = Blocked.',
    metadata: {
      source: 'docs/EDITH_Project_Report.docx [Chunk #58]',
      created: 'Indexed 3 days ago',
      relevance: 0.91,
    },
  },
]

// ----------------------------------------------------------------------------
// Document RAG Chunks (Chapter 5.5)
// ----------------------------------------------------------------------------
export const EDITH_RAG_CHUNKS: DocumentRagChunk[] = [
  {
    id: 'chk_001',
    documentName: 'EDITH_Project_Report.docx',
    chunkIndex: 42,
    totalChunks: 128,
    text: '5.8 The Orchestrator: The orchestrator is arguably the most important backend component, since every other layer is invoked through it rather than directly by the user interface. It receives the user request with active goal, relevant memory, available tool set, and permissions.',
    vectorId: 'vec_7741',
    similarityScore: 0.942,
    tokens: 78,
    tags: ['orchestrator', 'architecture', 'layer6'],
  },
  {
    id: 'chk_002',
    documentName: 'EDITH_Project_Report.docx',
    chunkIndex: 45,
    totalChunks: 128,
    text: '5.9 Task Graph and Dependency Planning: A conventional task manager presents tasks as a flat list. EDITH planner instead represents them as a directed acyclic graph (DAG), so that dependency relationships are explicit (e.g. API depends on DB and backend design).',
    vectorId: 'vec_7744',
    similarityScore: 0.918,
    tokens: 84,
    tags: ['dag', 'planner', 'dependencies'],
  },
  {
    id: 'chk_003',
    documentName: 'EDITH_Project_Report.docx',
    chunkIndex: 58,
    totalChunks: 128,
    text: '5.11 The Policy Engine and Permission Model: Every tool the system can call is declared with a risk tier. Ordinary deterministic backend logic, not an LLM, decides whether a proposed call is auto-approved, requires approval, or is blocked outright.',
    vectorId: 'vec_7757',
    similarityScore: 0.895,
    tokens: 92,
    tags: ['policy_engine', 'security', 'permissions'],
  },
  {
    id: 'chk_004',
    documentName: 'Kurukshetra_Univ_DAA_Syllabus.pdf',
    chunkIndex: 12,
    totalChunks: 34,
    text: 'Unit III: Dynamic Programming and Greedy Method. Optimal binary search trees, 0/1 Knapsack, All-pairs shortest path, Bellman-Ford, Dijkstra, String matching with KMP algorithm.',
    vectorId: 'vec_3312',
    similarityScore: 0.864,
    tokens: 65,
    tags: ['syllabus', 'daa', 'exams'],
  },
]

// ----------------------------------------------------------------------------
// Tool Registry (Chapter 5.6 & 5.11)
// ----------------------------------------------------------------------------
export interface ToolDefinition {
  name: string
  category: 'Filesystem' | 'Intelligence' | 'System' | 'External API'
  riskTier: 'LOW' | 'MEDIUM' | 'HIGH'
  policyAction: 'AUTO_APPROVE' | 'REQUIRE_APPROVAL' | 'BLOCKED'
  description: string
  sampleCall: string
  verificationMechanism: string
}

export const EDITH_TOOL_REGISTRY: ToolDefinition[] = [
  {
    name: 'read_file',
    category: 'Filesystem',
    riskTier: 'LOW',
    policyAction: 'AUTO_APPROVE',
    description: 'Reads text or code files within the bounded project workspace.',
    sampleCall: 'read_file(path="docs/architecture.md")',
    verificationMechanism: 'File exists and bytes read > 0',
  },
  {
    name: 'search_files',
    category: 'Filesystem',
    riskTier: 'LOW',
    policyAction: 'AUTO_APPROVE',
    description: 'Searches filenames and contents matching regex or glob patterns.',
    sampleCall: 'search_files(pattern="*.py", search_text="Kahn")',
    verificationMechanism: 'Return match count >= 0 within search directory',
  },
  {
    name: 'move_files',
    category: 'Filesystem',
    riskTier: 'MEDIUM',
    policyAction: 'REQUIRE_APPROVAL',
    description: 'Relocates or reorganizes files between workspace subdirectories.',
    sampleCall: 'move_files(source="unorganized/*.pdf", target="Documentation/")',
    verificationMechanism: 'Source unlinked, target file exists with identical SHA256 checksum',
  },
  {
    name: 'apply_patch',
    category: 'Filesystem',
    riskTier: 'MEDIUM',
    policyAction: 'REQUIRE_APPROVAL',
    description: 'Applies unified diff patches to code repositories.',
    sampleCall: 'apply_patch(target="server/dag_engine.py", diff="...")',
    verificationMechanism: 'Syntax check py_compile and test assertion execution',
  },
  {
    name: 'create_calendar_event',
    category: 'External API',
    riskTier: 'MEDIUM',
    policyAction: 'REQUIRE_APPROVAL',
    description: 'Schedules workload study blocks in Google Calendar / ICS calendar.',
    sampleCall: 'create_calendar_event(title="DBMS Query Opt", start="14:00")',
    verificationMechanism: 'Calendar API returns event_id and status=confirmed',
  },
  {
    name: 'delete_file',
    category: 'Filesystem',
    riskTier: 'HIGH',
    policyAction: 'BLOCKED',
    description: 'Permanently removes files from disk. Blocked by Phase 1-2 Policy Engine.',
    sampleCall: 'delete_file(path="temp.py")',
    verificationMechanism: 'BLOCKED BY POLICY ENGINE · NOT PERMITTED',
  },
  {
    name: 'run_arbitrary_shell',
    category: 'System',
    riskTier: 'HIGH',
    policyAction: 'BLOCKED',
    description: 'Executes un-sandboxed bash/zsh shell strings. Strictly forbidden.',
    sampleCall: 'exec_shell("rm -rf /")',
    verificationMechanism: 'BLOCKED BY POLICY ENGINE · ZERO ARBITRARY SHELL',
  },
]

// ----------------------------------------------------------------------------
// Chapter 8: The 4 Complete Interactive Scenarios
// ----------------------------------------------------------------------------
export interface ScenarioData {
  id: string
  chapter: string
  title: string
  userPrompt: string
  intentJson: Record<string, any>
  dagTasks: Array<{ label: string; status: string; tool: string; risk: string }>
  executionTrace: string[]
  verificationProof: string
  decisionExplanation: string
  memoryUpdate: string
}

export const EDITH_SCENARIOS: ScenarioData[] = [
  {
    id: 'sc_academic',
    chapter: '8.1',
    title: 'Academic Workload Management',
    userPrompt: 'I have five subjects and three projects this semester. Help me manage everything.',
    intentJson: {
      intent: 'academic_workload_management',
      subjects: ['DBMS', 'DAA', 'Operating Systems', 'AI & Agents', 'Computer Networks'],
      projects: ['EDITH Personal AI OS', 'Compiler Lab', 'Mobile Security App'],
      deadline_window: '2026-09-01 to 2026-11-30',
      priority: 'high',
    },
    dagTasks: [
      { label: 'Parse 5 subject syllabi & exam dates', status: 'done', tool: 'parse_syllabus()', risk: 'LOW' },
      { label: 'Map project dependencies & deliverables', status: 'done', tool: 'graph_dependencies()', risk: 'LOW' },
      { label: 'Calculate priority weights by deadline proximity', status: 'done', tool: 'priority_calculator()', risk: 'LOW' },
      { label: 'Synthesize dynamic weekly study schedule', status: 'done', tool: 'generate_schedule()', risk: 'LOW' },
      { label: 'Propose calendar schedule blocks', status: 'waiting_approval', tool: 'create_calendar_event()', risk: 'MEDIUM' },
    ],
    executionTrace: [
      '14:02:01 — Goal received: Semester workload management for 5 subjects & 3 projects',
      '14:02:02 — Ingested syllabus PDFs; calculated 16 weeks remaining to final exams',
      '14:02:03 — Formulated multi-subject DAG: Monday: 2h DBMS + 2h EDITH backend; Tuesday: 1.5h DAA + 2h EDITH frontend',
      '14:02:04 — Detected slip: Backend milestone behind by 1 day; dynamically shifted non-critical DAA revision to Thursday',
      '14:02:05 — Calendar synchronization requested; policy engine intercepted as MEDIUM RISK',
    ],
    verificationProof: 'TIMETABLE_INTEGRITY: 0 OVERLAPPING BLOCKS | ALL 5 SUBJECTS COVERED (40H/WEEK) | ADAPTIVE SHIFT PASSED',
    decisionExplanation: 'Priority calculated by deadline proximity (EDITH 30 Sept > Exams 18 Oct), dependency count (backend blocks frontend), and estimated effort.',
    memoryUpdate: 'Saved active study schedule to Working Memory; updated student preference profile in Long-Term Memory (PostgreSQL).',
  },
  {
    id: 'sc_software',
    chapter: '8.2',
    title: 'Software Development Assistance',
    userPrompt: 'Find why my project isn\'t starting.',
    intentJson: {
      intent: 'codebase_debugging',
      goal: 'diagnose_startup_failure',
      scope: 'backend_service',
      environment: 'fastapi_python3',
      priority: 'critical',
    },
    dagTasks: [
      { label: 'Inspect repository & requirements.txt', status: 'done', tool: 'read_file()', risk: 'LOW' },
      { label: 'Run diagnostic test command', status: 'done', tool: 'run_diagnostic()', risk: 'LOW' },
      { label: 'Analyze stack trace for root cause', status: 'done', tool: 'ast_analyze()', risk: 'LOW' },
      { label: 'Propose patch for pydantic_settings version mismatch', status: 'waiting_approval', tool: 'apply_patch()', risk: 'MEDIUM' },
      { label: 'Verify service startup exit code 0', status: 'pending', tool: 'verify_service()', risk: 'LOW' },
    ],
    executionTrace: [
      '16:10:11 — Goal received: "Find why my project isn\'t starting"',
      '16:10:12 — Read requirements.txt and server/main.py',
      '16:10:13 — Diagnostic run: ImportError: cannot import name "BaseSettings" from "pydantic"',
      '16:10:14 — Root cause identified: Pydantic v2 moved BaseSettings to pydantic-settings',
      '16:10:15 — Generated unified diff patch; Policy Engine gated apply_patch as MEDIUM RISK',
    ],
    verificationProof: 'POST_CONDITION: python -c "from backend.core.settings import Settings; Settings()" EXIT_CODE 0',
    decisionExplanation: 'Identified root cause without hallucinating. Gated file write behind human review before modifying repository files.',
    memoryUpdate: 'Stored dependency resolution in Long-Term Memory: "Project uses Pydantic v2 with separate pydantic-settings module".',
  },
  {
    id: 'sc_research',
    chapter: '8.3',
    title: 'Research Assistance (Agent Architectures)',
    userPrompt: 'I need to understand multimodal agent systems and hybrid memory.',
    intentJson: {
      intent: 'literature_research',
      topics: ['ReAct prompting', 'MemGPT memory tiers', 'Toolformer grounding', 'Self-correction loops'],
      output_format: 'structured_comparison_matrix',
      priority: 'high',
    },
    dagTasks: [
      { label: 'Search and collect 3 foundational papers', status: 'done', tool: 'arxiv_search()', risk: 'LOW' },
      { label: 'Extract architectural claims and trade-offs', status: 'done', tool: 'extract_claims()', risk: 'LOW' },
      { label: 'Build comparative synthesis matrix', status: 'done', tool: 'matrix_synthesizer()', risk: 'LOW' },
      { label: 'Persist structured notes into Long-Term Memory', status: 'done', tool: 'store_ltm()', risk: 'LOW' },
    ],
    executionTrace: [
      '11:20:01 — Goal received: Multimodal agent systems research',
      '11:20:03 — Ingested Yao et al. (ReAct), Packer et al. (MemGPT), and Schick et al. (Toolformer)',
      '11:20:06 — Synthesized core trade-offs: pure vector RAG fails for stateful tracking; tiered relational/vector is superior',
      '11:20:08 — Written structured synthesis to PostgreSQL long-term knowledge table',
      '11:20:09 — Verified: Follow-up query "What did we learn about memory?" answered in 18ms without re-reading papers',
    ],
    verificationProof: 'KNOWLEDGE_CONSISTENCY: 3 PAPERS CROSS-VERIFIED | ZERO FACTUAL CONFLICTS | PERSISTED TO POSTGRESQL',
    decisionExplanation: 'Research stored permanently in system memory so future queries don\'t burn context window re-reading raw papers.',
    memoryUpdate: 'Added 3 durable research cards to Long-Term Memory (PostgreSQL) and 12 chunks to Semantic Vector index.',
  },
  {
    id: 'sc_vertical_slice',
    chapter: '8.4 & 9.2',
    title: 'Document Organization (The First Vertical Slice)',
    userPrompt: 'Clean my project folder.',
    intentJson: {
      intent: 'filesystem_organization',
      target_folder: '/workspace/unorganized',
      files_count: 367,
      priority: 'high',
    },
    dagTasks: [
      { label: 'Analyze 367 unorganized files by MIME & extension', status: 'done', tool: 'search_files()', risk: 'LOW' },
      { label: 'Formulate 6-category taxonomy (Docs, Research, Images, Source, Releases, Archives)', status: 'done', tool: 'plan_taxonomy()', risk: 'LOW' },
      { label: 'Request human approval for batch relocation', status: 'done', tool: 'policy_gate()', risk: 'MEDIUM' },
      { label: 'Execute batch file relocation', status: 'done', tool: 'move_files()', risk: 'MEDIUM' },
      { label: 'Verify file checksums & directory integrity', status: 'done', tool: 'verify_checksums()', risk: 'LOW' },
    ],
    executionTrace: [
      '10:45:01 — Goal received: "Clean my project folder"',
      '10:45:02 — File breakdown: 91 PDFs, 32 DOCX, 118 images, 47 archives, 79 code files (Total: 367 files)',
      '10:45:03 — Taxonomy proposed: Documentation, Research, Images, Source, Releases, Archives',
      '10:45:04 — Policy Engine check: move_files requires human approval (Medium Risk)',
      '10:45:07 — Operator approved relocation in Interaction Layer',
      '10:45:09 — 367 files moved cleanly in 1.4 seconds',
      '10:45:10 — Deterministic verifier confirmed 367/367 MD5 hashes match original source files',
    ],
    verificationProof: 'POST_CONDITION: 367/367 MOVED | ZERO UNLINKED CORRUPTIONS | STRUCTURE COMPLIANT | ZERO DATA LOSS',
    decisionExplanation: 'Demonstrates the complete end-to-end loop: Intent -> Context -> DAG -> Policy Gate -> Tool -> Verify -> Update.',
    memoryUpdate: 'Working memory state set to completed. Audit receipt #8812 recorded with cryptographic tree hash.',
  },
]

// ----------------------------------------------------------------------------
// Chapter 10: Empirical Evaluation Benchmark Deck
// ----------------------------------------------------------------------------
export const EDITH_BENCHMARK_METRICS: BenchmarkMetric[] = [
  {
    category: 'Task Completion Rate (Multi-step)',
    edithScore: 88.4,
    baselineScore: 41.2,
    unit: '%',
    delta: '+47.2%',
    explanation: 'EDITH with DAG planning and self-correction completed 88.4% of 50 graded multi-step tasks vs 41.2% for conversation-only LLM.',
  },
  {
    category: 'False-Success Reporting (Hallucinated Completion)',
    edithScore: 2.1,
    baselineScore: 37.8,
    unit: '%',
    delta: '-35.7%',
    explanation: 'Mandatory verification assertion prevents EDITH from claiming a task is done when a tool failed or produced incomplete results.',
  },
  {
    category: 'Verification Pass Rate (1st Attempt)',
    edithScore: 94.6,
    baselineScore: 0.0,
    unit: '%',
    delta: 'N/A (Baseline lacks verifier)',
    explanation: 'Independent verifier checks post-conditions. 5.4% of failed first attempts triggered automated re-planning.',
  },
  {
    category: 'Policy Safety Interception (Risky Tool Calls)',
    edithScore: 100.0,
    baselineScore: 18.5,
    unit: '%',
    delta: '+81.5%',
    explanation: '100% of destructive shell or unconfirmed file operations were intercepted by the deterministic policy engine.',
  },
  {
    category: 'Redundant Re-execution Steps',
    edithScore: 1.2,
    baselineScore: 4.8,
    unit: 'steps/task',
    delta: '-75.0%',
    explanation: 'Working memory preserves subtask execution registers, preventing redundant re-reads of already parsed files.',
  },
]

// ----------------------------------------------------------------------------
// Chapter 5: Six Architectural Layers Blueprint
// ----------------------------------------------------------------------------
export interface ArchitecturalLayer {
  layerNumber: number
  name: string
  responsibility: string
  keyComponents: string[]
  reportSection: string
  color: string
}

export const EDITH_SIX_LAYERS: ArchitecturalLayer[] = [
  {
    layerNumber: 1,
    name: 'Interaction Layer',
    responsibility: 'Translates human intent into system goals; surfaces active state, DAG progress, timelines, and pending human approvals.',
    keyComponents: ['Goal Dashboard', 'Goal Workspace', 'Execution Timeline', 'Approval Card Modal', 'WebSockets / SSE'],
    reportSection: '5.2 & Chapter 7',
    color: '#6366f1',
  },
  {
    layerNumber: 2,
    name: 'Intelligence Layer',
    responsibility: 'Intent understanding, structured goal extraction, DAG task decomposition, and adaptive decision-making.',
    keyComponents: ['Intent Parser', 'DAG Task Planner', 'Topological Sorter', 'Decision Engine'],
    reportSection: '5.3 & 5.9',
    color: '#06b6d4',
  },
  {
    layerNumber: 3,
    name: 'Memory Layer',
    responsibility: 'Separates operational state from semantic recall across 4 specialized tiers.',
    keyComponents: ['Short-Term Buffer', 'Working Memory State', 'PostgreSQL Long-Term DB', 'Semantic Vector Index'],
    reportSection: '5.4 & Figure 4',
    color: '#10b981',
  },
  {
    layerNumber: 4,
    name: 'Knowledge System (Document RAG)',
    responsibility: 'Ingests, parses, chunks, and embeds user documents for semantic retrieval by the Context Engine.',
    keyComponents: ['Document Ingestion', 'Recursive Text Splitter', 'Vector Store', 'Cosine Distance Retriever'],
    reportSection: '5.5',
    color: '#8b5cf6',
  },
  {
    layerNumber: 5,
    name: 'Tool System & Registry',
    responsibility: 'Declares bounded tools, input schemas, and risk tiers; provides sandboxed execution boundary.',
    keyComponents: ['Tool Registry', 'Policy Engine Gating', '3-Tier Risk Classifier', 'Sandbox Wrapper'],
    reportSection: '5.6 & 5.11',
    color: '#f59e0b',
  },
  {
    layerNumber: 6,
    name: 'Execution & Verification Layer',
    responsibility: 'Dispatches tool calls, captures execution objects, and deterministically verifies post-conditions before reporting done.',
    keyComponents: ['The Orchestrator (5.8)', 'Execution Record Logger', 'Deterministic Verifier', 'Self-Correction Replan Loop', 'Audit Ledger'],
    reportSection: '5.7 & 6.2, 6.3',
    color: '#ec4899',
  },
]
