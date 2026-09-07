export type ActiveView = 'agent' | 'workspace' | 'graph' | 'memory' | 'activity'
export type AgentState = 'idle' | 'planning' | 'waiting_approval' | 'executing' | 'verifying' | 'success' | 'failed'
export type AppStage = 'auth' | 'picker' | 'initializing' | 'workspace'

export interface AuthUser {
  name: string
  email: string
  picture?: string
  provider: 'google' | 'demo'
}

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

export interface FileNode {
  name: string
  type: 'file' | 'folder'
  path: string
  children?: FileNode[]
  language?: string
  content?: string
  size?: number
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
}

export type GraphNodeKind = 'file' | 'folder' | 'goal' | 'task' | 'memory'
export type GraphRelation = 'contains' | 'imports' | 'references' | 'depends_on' | 'related_to' | 'used_by'

export interface WorkspaceGraphNode {
  id: string
  label: string
  path?: string
  kind: GraphNodeKind
  language?: string
  cluster: string
  weight?: number
}

export interface WorkspaceGraphEdge {
  id: string
  source: string
  target: string
  relation: GraphRelation
}

export interface ExecutionLogItem {
  id: string
  time: string
  label: string
  detail: string
  status: 'running' | 'done' | 'waiting' | 'error'
  file?: string
}
