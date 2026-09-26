export type ActiveView = 
  | 'overview' 
  | 'assets' 
  | 'threats' 
  | 'detection' 
  | 'incidents' 
  | 'monitoring' 
  | 'analytics' 
  | 'reports' 
  | 'settings'
  | 'agent' 
  | 'workspace' 
  | 'graph' 
  | 'memory'
  | 'activity'

export type AgentState = 'idle' | 'planning' | 'waiting_approval' | 'executing' | 'verifying' | 'success' | 'failed'
export type AppStage = 'auth' | 'picker' | 'initializing' | 'workspace'
export type DefconLevel = 'DEFCON 1 · SEVERE' | 'DEFCON 2 · ELEVATED' | 'DEFCON 3 · GUARDED' | 'DEFCON 4 · LOW'
export type AirGapState = 'ENFORCED' | 'ISOLATED' | 'OFFLINE_VERIFIED'

export type Role = 'admin' | 'engineer' | 'investigator' | 'manager' | 'viewer' | 'secops_lead' | 'operator' | 'analyst'
export type ClearanceLevel = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED' | 'operator' | 'engineer' | 'secops_lead' | 'admin' | 'analyst'

export const CLEARANCE_HIERARCHY: Record<string, number> = {
  PUBLIC: 1,
  INTERNAL: 2,
  CONFIDENTIAL: 4,
  RESTRICTED: 6,
  operator: 3,
  analyst: 4,
  engineer: 5,
  secops_lead: 6,
  admin: 7,
}

export type TrustLevel = 'verified-by-tool' | 'ai-inferred' | 'human-asserted' | 'source-document'

export interface SovereignUser {
  id?: string
  employeeId?: string
  name: string
  email: string
  role: Role
  clearance: ClearanceLevel
  clearanceLevel?: number
  department?: string
  site?: string
  assignedAssets?: string[]
  token?: string
  loginTime?: string
  avatarColor?: string
  provider: 'sovereign' | 'demo' | 'google'
  picture?: string
}

export type AuthUser = SovereignUser

export interface Workspace {
  id: string
  name: string
  path: string
  progress: number
  tech: string[]
  source?: 'mock' | 'local'
  fileCount?: number
  gitDetected?: boolean
}

export interface NoteMetadata {
  id?: string
  title?: string
  equipment_id?: string
  clearance_level?: ClearanceLevel
  trust_level?: TrustLevel
  category?: string
  unit?: string
  criticality?: 'Low' | 'Medium' | 'High' | 'Critical'
  status?: string
  timestamp?: string
  author?: string
  sops?: string[]
  connected_equipment?: string[]
  sha256?: string
  [key: string]: unknown
}

export interface FileNode {
  name: string
  type: 'file' | 'folder'
  path: string
  children?: FileNode[]
  language?: string
  content?: string
  size?: number
  clearance?: ClearanceLevel
  trustLevel?: TrustLevel
  metadata?: NoteMetadata
  sha256?: string
  timestamp?: string
  category?: string
}

export interface PlanStep {
  id: string
  label: string
  status: 'pending' | 'active' | 'done' | 'failed'
}

export interface MemoryItem {
  id: string
  scope: 'Working' | 'Long-Term' | 'Knowledge'
  title: string
  subtitle: string
  stored: string
  clearance?: ClearanceLevel
}

export interface ActivityItem {
  id: string
  time: string
  title: string
  status: 'Verified' | 'Completed' | 'Approved' | 'Failed'
  detail: string
  tool: string
  verification: 'PASSED' | 'FAILED' | 'N/A'
  started: string
  finished: string
  operator?: string
  clearance?: ClearanceLevel
}

export type GraphNodeKind = 'file' | 'folder' | 'goal' | 'task' | 'memory' | 'equipment' | 'sop' | 'report' | 'person' | 'investigation' | 'ticket'
export type GraphRelation = 'contains' | 'imports' | 'references' | 'depends_on' | 'related_to' | 'used_by' | 'monitors' | 'assigned_to' | 'oversees' | 'inspects'

export interface WorkspaceGraphNode {
  id: string
  label: string
  path?: string
  kind: GraphNodeKind
  language?: string
  cluster: string
  weight?: number
  trustLevel?: TrustLevel
  clearance?: ClearanceLevel
  timestamp?: string
}

export interface WorkspaceGraphEdge {
  id: string
  source: string
  target: string
  relation: GraphRelation
  trustLevel?: TrustLevel
  timestamp?: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  reasoning?: string // Chain-of-Thought (<thinking>...</thinking>)
  createdFiles?: Array<{ path: string; content: string }>
  executedCommands?: Array<{ command: string; output: string }>
  verificationStatus?: 'PASSED' | 'FAILED' | 'ATTENTION' | 'N/A'
  citedSources?: string[] // Wikilinks e.g. ['[[Pump-P204]]', '[[Inspection-Report-62]]']
  latencyMs?: number
  model?: string
}

export interface ExecutionLogItem {
  id: string
  time: string
  label: string
  detail: string
  status: 'running' | 'done' | 'waiting' | 'error'
  file?: string
  role?: 'user' | 'assistant' | 'system'
  reasoning?: string
  verification?: string
  createdFiles?: Array<{ path: string; content: string }>
}

/* =========================================================================
   VELIKY SOVEREIGN INDUSTRIAL DEFENSE & SOC DOMAIN TYPES
   ========================================================================= */

export type AssetCluster = 
  | 'REFINERY_UNIT_2'
  | 'CONTROL_SCADA'
  | 'SOVEREIGN_AI'
  | 'VAULT_STORE'

export type AssetCriticality = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
export type AssetOperationalStatus = 'NORMAL' | 'ATTENTION_REQUIRED' | 'ALARM' | 'ARMED' | 'MAINTENANCE'

export interface AssetTelemetry {
  rmsVelocity?: number // mm/s
  temperatureC?: number
  pressureBar?: number
  rpm?: number
  motorCurrentA?: number
  acousticDb?: number
  harmonic1X?: number
  harmonic2X?: number
  history: Array<{
    date: string
    rmsVelocity: number
    temperatureC: number
    isoZone: 'Zone_A' | 'Zone_B' | 'Zone_C' | 'Zone_D'
    note?: string
  }>
}

export interface IndustrialAsset {
  id: string // e.g. "P-204"
  name: string
  tag: string
  category: 'Rotating Equipment' | 'Pressure Vessel' | 'Exchanger' | 'Safety System' | 'ICS Controller' | 'AI Inference Cluster' | 'Storage'
  unit: string // e.g. "Unit 2 Bottoms Transfer"
  cluster: AssetCluster
  criticality: AssetCriticality
  status: AssetOperationalStatus
  isoZone?: 'Zone_A' | 'Zone_B' | 'Zone_C' | 'Zone_D'
  manufacturer?: string
  ratedSpeed?: string
  driver?: string
  bearings?: string
  seal?: string
  clearanceLevel: ClearanceLevel
  connectedAssetIds: string[]
  downstreamHazard?: string
  telemetry: AssetTelemetry
  lastInspected: string
  linkedDocuments: string[]
  coordinates: { x: number; y: number }
}

export type ThreatSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'

export interface ThreatItem {
  id: string // e.g. "THR-2026-09"
  title: string
  targetAssetId: string
  severity: ThreatSeverity
  confidence: number // 0 to 100
  vector: string
  mitreTechnique?: string
  detectionSource: string
  description: string
  detectedAt: string
  status: 'ACTIVE' | 'MITIGATING' | 'RESOLVED'
  affectedPaths: string[] // e.g. ['P-204', 'E-201', 'C-104']
  recommendedAction: string
}

export interface SandboxedCalculation {
  id: string
  formula: string
  claimedValue: string
  verifiedValue: string
  match: boolean
  executedInSandbox: boolean
  runtimeMs: number
}

export interface EvidenceSource {
  title: string
  documentName: string
  pageNumber: number | string
  excerpt: string
  timestamp: string
  verified: boolean
}

export interface IncidentItem {
  id: string // e.g. "INV-2026-001"
  title: string
  targetAssetId: string
  domain: string
  verdict: 'ATTENTION_REQUIRED' | 'CRITICAL_ALERT' | 'GUARDED' | 'CLEARED'
  riskScore: number // 0 to 100
  confidenceScore: number // 0 to 100
  policyTier: 'REQUIRES_APPROVAL' | 'AUTO_APPROVE' | 'BLOCKED'
  status: 'OPEN' | 'INVESTIGATING' | 'WAITING_APPROVAL' | 'APPROVED' | 'RESOLVED'
  createdAt: string
  operatorRole: ClearanceLevel
  executiveSummary: string
  attackChain: Array<{
    step: number
    title: string
    description: string
    timestamp: string
    status: 'detected' | 'propagating' | 'contained'
  }>
  evidence: EvidenceSource[]
  calculations: SandboxedCalculation[]
  rootCauseAnalysis: string
  recommendations: string[]
  approvedBy?: string
  approvedAt?: string
  cryptoSignature?: string
}

export type ReasoningCycleStage = 
  | 'SEE' 
  | 'UNDERSTAND' 
  | 'PLAN' 
  | 'REASON' 
  | 'ACT' 
  | 'VERIFY' 
  | 'EXPLAIN' 
  | 'AUDIT'

export interface ReasoningLedgerStep {
  stage: ReasoningCycleStage
  label: string
  detail: string
  durationMs: number
  status: 'completed' | 'active' | 'pending' | 'failed'
  evidenceTag?: string
  payload?: any
}

export interface ModelCapability {
  id: string
  name: string
  role: 'Reasoning' | 'Vision & P&ID' | 'Code & Sandbox' | 'Embedding & Vector'
  vramUsageGb: number
  maxVramGb: number
  activeContext: string
  accuracyScore: number
  status: 'ONLINE' | 'STANDBY' | 'THROTTLED'
  onPremise: boolean
}

export interface SystemResources {
  cpuUtilization: number
  vramUsedGb: number
  vramTotalGb: number
  ramUsedGb: number
  ramTotalGb: number
  networkOutboundKbps: number
  airGappedPacketsBlocked: number
  verificationAccuracyPct: number
  activeSensorsCount: number
}

export interface AuditLedgerRecord {
  id: string
  timestamp: string
  investigationId: string
  operatorRole: ClearanceLevel
  targetAsset: string
  action: string
  verdict: string
  sha256Hash: string
  sourcesCount: number
  sandboxPassed: boolean
}
