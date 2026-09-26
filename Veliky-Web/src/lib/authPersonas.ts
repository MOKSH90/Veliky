import type { Role, ClearanceLevel, SovereignUser } from './types'
import { CLEARANCE_HIERARCHY } from './types'

export interface PersonaProfile extends SovereignUser {
  title: string
  description: string
  badgeColor: string
  avatar: string
  allowedPaths: string[]
}

export const SOVEREIGN_PERSONAS: PersonaProfile[] = [
  {
    id: 'user-rajesh-sharma',
    employeeId: 'EMP-001',
    name: 'Dr. Rajesh Sharma',
    title: 'Chief Plant Reliability Director & System Admin',
    email: 'r.sharma@plant.veliky.internal',
    role: 'admin',
    clearance: 'RESTRICTED',
    clearanceLevel: 6,
    department: 'Plant Reliability & Executive Directorate',
    site: 'Refinery Unit 2 — Mission Control',
    assignedAssets: ['P-204', 'C-104', 'E-201', 'TK-101'],
    token: 'veliky_tok_admin_secops_9921e4',
    loginTime: '2026-09-14T08:00:00Z',
    avatarColor: '#ef4444',
    provider: 'sovereign',
    badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30',
    avatar: 'RS',
    description: 'Unrestricted sovereign administrator authority. Full audit ledger review, policy overrides, and restricted shutdown authorizations.',
    allowedPaths: ['*'],
  },
  {
    id: 'user-rakesh-patel',
    employeeId: 'EMP-042',
    name: 'Rakesh Patel',
    title: 'Senior Reliability & Vibration Engineer',
    email: 'r.patel@plant.veliky.internal',
    role: 'engineer',
    clearance: 'CONFIDENTIAL',
    clearanceLevel: 4,
    department: 'Unit 2 Rotating Equipment Division',
    site: 'Refinery Unit 2 — Engineering Wing',
    assignedAssets: ['P-204', 'C-104'],
    token: 'veliky_tok_eng_vib_4412a9',
    loginTime: '2026-09-14T08:15:00Z',
    avatarColor: '#3b82f6',
    provider: 'sovereign',
    badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    avatar: 'RP',
    description: 'Level II Vibration Analyst. Manages rotating machinery health, performs sandboxed mathematical drift calculations, and author of vibration logs.',
    allowedPaths: ['Equipment/', 'SOPs/SOP-Pump-Maintenance.md', 'Reports/', 'Tickets/', 'Investigations/'],
  },
  {
    id: 'user-priya-nair',
    employeeId: 'EMP-088',
    name: 'Priya Nair',
    title: 'HSE Safety & Process Incident Investigator',
    email: 'p.nair@plant.veliky.internal',
    role: 'investigator',
    clearance: 'CONFIDENTIAL',
    clearanceLevel: 4,
    department: 'Health, Safety & Incident Analysis',
    site: 'Offshore & Refining Process Center',
    assignedAssets: ['P-204', 'E-201'],
    token: 'veliky_tok_inv_safe_7718b3',
    loginTime: '2026-09-14T08:30:00Z',
    avatarColor: '#8b5cf6',
    provider: 'sovereign',
    badgeColor: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    avatar: 'PN',
    description: 'Root cause incident analysis lead. Conducts multi-document evidence verification and ISO compliance assessments.',
    allowedPaths: ['Equipment/', 'Reports/', 'Investigations/', 'Tickets/', 'SOPs/'],
  },
  {
    id: 'user-vikram-malhotra',
    employeeId: 'EMP-014',
    name: 'Vikram Malhotra',
    title: 'Operations Plant Manager',
    email: 'v.malhotra@plant.veliky.internal',
    role: 'manager',
    clearance: 'RESTRICTED',
    clearanceLevel: 6,
    department: 'Refinery Unit 2 Operations Command',
    site: 'Refinery Unit 2 — Operations Center',
    assignedAssets: ['P-204', 'C-104', 'E-201', 'TK-101'],
    token: 'veliky_tok_mgr_ops_1294c8',
    loginTime: '2026-09-14T08:10:00Z',
    avatarColor: '#f59e0b',
    provider: 'sovereign',
    badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    avatar: 'VM',
    description: 'Operations supervisor. Authorizes human-in-the-loop vault modifications, approves shutdown work orders, and oversees shift handovers.',
    allowedPaths: ['*'],
  },
  {
    id: 'user-ananya-sen',
    employeeId: 'EMP-119',
    name: 'Ananya Sen',
    title: 'Junior Plant Operations Technician',
    email: 'a.sen@plant.veliky.internal',
    role: 'viewer',
    clearance: 'INTERNAL',
    clearanceLevel: 2,
    department: 'Field Telemetry & Maintenance Support',
    site: 'Refinery Unit 2 — Field Deck',
    assignedAssets: ['P-204'],
    token: 'veliky_tok_view_tech_5583d1',
    loginTime: '2026-09-14T09:00:00Z',
    avatarColor: '#10b981',
    provider: 'sovereign',
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    avatar: 'AS',
    description: 'Field operator read-only clearance. Access limited to basic equipment specifications and general operating manuals. Restricted from confidential investigation drafts.',
    allowedPaths: ['Equipment/Pump-P204.md', 'Equipment/Compressor-C104.md', 'SOPs/SOP-Pump-Maintenance.md'],
  },
]

export const SOVEREIGN_SITES = [
  'Refinery Unit 2 — Vacuum Distillation (On-Premise)',
  'Offshore Gas Platform Alpha — Subsea Hub',
  'Central Processing Facility — Mission Control Room',
  'Isolated Tactical Field Station (Zero-Connectivity)',
]

export function checkClearance(
  userClearance: ClearanceLevel | undefined,
  requiredClearance: ClearanceLevel | undefined
): boolean {
  if (!requiredClearance || requiredClearance === 'PUBLIC') return true
  if (!userClearance) return false
  const userLevel = CLEARANCE_HIERARCHY[userClearance] || 1
  const reqLevel = CLEARANCE_HIERARCHY[requiredClearance] || 1
  return userLevel >= reqLevel
}

export function getClearanceColor(clearance: ClearanceLevel | undefined): string {
  switch (clearance) {
    case 'RESTRICTED':
      return '#ef4444' // red
    case 'CONFIDENTIAL':
      return '#f59e0b' // amber
    case 'INTERNAL':
      return '#06b6d4' // cyan
    case 'PUBLIC':
    default:
      return '#10b981' // emerald
  }
}

export function getRoleBadgeStyle(role: Role): { bg: string; color: string; border: string } {
  switch (role) {
    case 'admin':
      return { bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: 'rgba(239, 68, 68, 0.3)' }
    case 'manager':
      return { bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: 'rgba(245, 158, 11, 0.3)' }
    case 'engineer':
      return { bg: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', border: 'rgba(59, 130, 246, 0.3)' }
    case 'investigator':
      return { bg: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa', border: 'rgba(139, 92, 246, 0.3)' }
    case 'viewer':
    default:
      return { bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: 'rgba(16, 185, 129, 0.3)' }
  }
}
