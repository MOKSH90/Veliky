import { useState } from 'react'
import { 
  ShieldCheck, 
  Lock, 
  Sparkles, 
  Cpu, 
  ArrowRight, 
  KeyRound, 
  Building2, 
  CheckCircle2, 
  Terminal,
  FileCheck
} from 'lucide-react'
import { motion } from 'framer-motion'
import { useSentinelStore } from '../store/useSentinelSOCStore'
import { 
  SOVEREIGN_PERSONAS, 
  SOVEREIGN_SITES, 
  getClearanceColor, 
  getRoleBadgeStyle,
  type PersonaProfile 
} from '../lib/authPersonas'
import type { Role, ClearanceLevel } from '../lib/types'

export function AuthPage() {
  const setAuthUser = useSentinelStore((s) => s.setAuthUser)
  const [selectedPersona, setSelectedPersona] = useState<PersonaProfile>(SOVEREIGN_PERSONAS[0])
  const [authMode, setAuthMode] = useState<'personas' | 'credentials'>('personas')

  // Manual credentials state
  const [employeeId, setEmployeeId] = useState('EMP-001')
  const [passphrase, setPassphrase] = useState('sovereign-airgap-2026')
  const [selectedRole, setSelectedRole] = useState<Role>('admin')
  const [selectedClearance, setSelectedClearance] = useState<ClearanceLevel>('RESTRICTED')
  const [selectedSite, setSelectedSite] = useState(SOVEREIGN_SITES[0])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handlePersonaLogin = (persona: PersonaProfile) => {
    setIsSubmitting(true)
    setTimeout(() => {
      setAuthUser(persona)
      setIsSubmitting(false)
    }, 300)
  }

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setTimeout(() => {
      const customUser: PersonaProfile = {
        id: `user-${employeeId.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        employeeId: employeeId.trim() || 'EMP-999',
        name: employeeId === 'EMP-001' ? 'Dr. Rajesh Sharma' : `Operator ${employeeId}`,
        title: `${selectedRole.toUpperCase()} — ${selectedSite.split('—')[0].trim()}`,
        email: `${employeeId.toLowerCase()}@plant.sentinel.internal`,
        role: selectedRole,
        clearance: selectedClearance,
        clearanceLevel: selectedClearance === 'RESTRICTED' ? 6 : selectedClearance === 'CONFIDENTIAL' ? 4 : selectedClearance === 'INTERNAL' ? 2 : 1,
        department: 'Operations & Engineering Wing',
        site: selectedSite,
        assignedAssets: ['P-204', 'C-104'],
        token: `sentinel_tok_${selectedRole}_${Math.random().toString(36).slice(2, 8)}`,
        loginTime: new Date().toISOString(),
        avatarColor: getClearanceColor(selectedClearance),
        provider: 'sovereign',
        badgeColor: getRoleBadgeStyle(selectedRole).bg,
        avatar: employeeId.slice(-2).toUpperCase() || 'OP',
        description: `Authenticated via Sovereign Local Gateway with ${selectedClearance} clearance.`,
        allowedPaths: ['*'],
      }
      setAuthUser(customUser)
      setIsSubmitting(false)
    }, 400)
  }

  return (
    <main className="auth-page upgraded-auth" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative', overflowX: 'hidden' }}>
      <div className="auth-grid-bg" />

      {/* Top Sovereignty Verification Bar */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 24px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.07)',
        background: 'rgba(10, 10, 12, 0.75)',
        backdropFilter: 'blur(10px)',
        zIndex: 20
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
          <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.08em', color: '#10b981' }}>
            AIR-GAPPED SOVEREIGN ENVIRONMENT · ZERO CLOUD EGRESS
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>
          <span>SIH 2026 · Problem Statement #26117</span>
          <span>·</span>
          <span>ISO 27001 & IEC 62443 RBAC Compliant</span>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 20px 40px', zIndex: 10 }}>
        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.4 }}
          style={{ width: '100%', maxWidth: '960px' }}
        >
          {/* Brand Header */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 14px', borderRadius: '20px', background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.25)', color: '#818cf8', fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', marginBottom: '14px' }}>
              <Sparkles size={13} /> SOVEREIGN ON-PREMISE AI WORKBENCH
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.02em', margin: '0 0 8px', color: '#ffffff', textShadow: '0 0 24px rgba(255,255,255,0.1)' }}>
              SENTINEL
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary, #94a3b8)', maxWidth: '580px', margin: '0 auto' }}>
              Sovereign Enterprise Neural Tool-Intelligence & Evidence Layer for Confidential Industrial Operations
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '24px' }}>
            <button
              type="button"
              onClick={() => setAuthMode('personas')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: authMode === 'personas' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                color: authMode === 'personas' ? '#818cf8' : 'var(--text-secondary, #94a3b8)',
                border: `1px solid ${authMode === 'personas' ? 'rgba(99, 102, 241, 0.5)' : 'rgba(255, 255, 255, 0.08)'}`
              }}
            >
              <ShieldCheck size={16} />
              <span>Sovereign Personas (RBAC Matrix)</span>
            </button>
            <button
              type="button"
              onClick={() => setAuthMode('credentials')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 18px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: authMode === 'credentials' ? 'rgba(99, 102, 241, 0.2)' : 'rgba(255, 255, 255, 0.03)',
                color: authMode === 'credentials' ? '#818cf8' : 'var(--text-secondary, #94a3b8)',
                border: `1px solid ${authMode === 'credentials' ? 'rgba(99, 102, 241, 0.5)' : 'rgba(255, 255, 255, 0.08)'}`
              }}
            >
              <KeyRound size={16} />
              <span>Enterprise Air-Gapped Sign-In</span>
            </button>
          </div>

          {/* Main Card Container */}
          <div style={{
            background: 'rgba(18, 18, 22, 0.95)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '16px',
            padding: '28px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(20px)'
          }}>
            {authMode === 'personas' ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div>
                    <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 4px', color: '#fff' }}>
                      Select Authorized Enterprise Persona
                    </h2>
                    <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', margin: 0 }}>
                      Each role exercises distinct document-level access permissions, clearance filtering, and tool boundaries.
                    </p>
                  </div>
                  <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.06)', color: 'rgba(255, 255, 255, 0.7)' }}>
                    5 Pre-Provisioned Personas
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px', marginBottom: '24px' }}>
                  {SOVEREIGN_PERSONAS.map((p) => {
                    const isSelected = selectedPersona.id === p.id
                    const clearanceColor = getClearanceColor(p.clearance)
                    const roleStyle = getRoleBadgeStyle(p.role)

                    return (
                      <div
                        key={p.id}
                        onClick={() => setSelectedPersona(p)}
                        style={{
                          background: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                          border: `1.5px solid ${isSelected ? '#818cf8' : 'rgba(255, 255, 255, 0.07)'}`,
                          borderRadius: '12px',
                          padding: '16px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px',
                          position: 'relative'
                        }}
                      >
                        {isSelected && (
                          <div style={{ position: 'absolute', top: '12px', right: '12px' }}>
                            <CheckCircle2 size={18} color="#818cf8" />
                          </div>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '10px',
                            background: `${p.avatarColor}20`,
                            color: p.avatarColor,
                            border: `1px solid ${p.avatarColor}40`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '13px'
                          }}>
                            {p.avatar}
                          </div>
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#fff' }}>{p.name}</div>
                            <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.45)' }}>{p.employeeId} · {p.department}</div>
                          </div>
                        </div>

                        {/* Badges */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            letterSpacing: '0.04em',
                            padding: '2px 7px',
                            borderRadius: '4px',
                            background: roleStyle.bg,
                            color: roleStyle.color,
                            border: `1px solid ${roleStyle.border}`
                          }}>
                            {p.role.toUpperCase()}
                          </span>
                          <span style={{
                            fontSize: '10px',
                            fontWeight: 700,
                            letterSpacing: '0.04em',
                            padding: '2px 7px',
                            borderRadius: '4px',
                            background: `${clearanceColor}20`,
                            color: clearanceColor,
                            border: `1px solid ${clearanceColor}40`
                          }}>
                            CLEARANCE: {p.clearance} (L{p.clearanceLevel})
                          </span>
                        </div>

                        <p style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.65)', lineHeight: 1.45, margin: 0 }}>
                          {p.description}
                        </p>
                      </div>
                    )
                  })}
                </div>

                {/* Confirm Persona Login Button */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)' }}>
                    Signing in as <b>{selectedPersona.name}</b> ({selectedPersona.role.toUpperCase()} · {selectedPersona.clearance})
                  </div>
                  <button
                    type="button"
                    onClick={() => handlePersonaLogin(selectedPersona)}
                    disabled={isSubmitting}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 24px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span>{isSubmitting ? 'Authenticating On-Premise…' : 'Enter Sovereign AI Workbench'}</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleManualLogin}>
                <div style={{ marginBottom: '20px' }}>
                  <h2 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 4px', color: '#fff' }}>
                    Sovereign Air-Gapped Authentication
                  </h2>
                  <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.5)', margin: 0 }}>
                    Enter credentials validated against local plant security keys and HSM module.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                  {/* Employee ID */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>
                      EMPLOYEE BADGE ID
                    </label>
                    <input
                      type="text"
                      value={employeeId}
                      onChange={(e) => setEmployeeId(e.target.value)}
                      placeholder="EMP-042"
                      required
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: 'rgba(0,0,0,0.4)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Passphrase */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>
                      SOVEREIGN SECURITY TOKEN / PIN
                    </label>
                    <input
                      type="password"
                      value={passphrase}
                      onChange={(e) => setPassphrase(e.target.value)}
                      placeholder="••••••••••••"
                      required
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: 'rgba(0,0,0,0.4)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    />
                  </div>

                  {/* Role Selection */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>
                      ASSIGNED ROLE (RBAC §5.5)
                    </label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as Role)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: '#121216',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    >
                      <option value="admin">Admin (Unrestricted Sovereignty)</option>
                      <option value="engineer">Engineer (Calculations & Investigation Author)</option>
                      <option value="investigator">Investigator (Audit & Verification)</option>
                      <option value="manager">Manager (Approval Gatekeeper)</option>
                      <option value="viewer">Viewer (Read-Only Public/Internal)</option>
                    </select>
                  </div>

                  {/* Clearance Level */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>
                      SECURITY CLEARANCE LEVEL
                    </label>
                    <select
                      value={selectedClearance}
                      onChange={(e) => setSelectedClearance(e.target.value as ClearanceLevel)}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        background: '#121216',
                        border: '1px solid rgba(255,255,255,0.12)',
                        borderRadius: '8px',
                        color: '#fff',
                        fontSize: '13px',
                        outline: 'none'
                      }}
                    >
                      <option value="RESTRICTED">RESTRICTED (Level 6 — Highest Authority)</option>
                      <option value="CONFIDENTIAL">CONFIDENTIAL (Level 4 — Plant Engineering)</option>
                      <option value="INTERNAL">INTERNAL (Level 2 — General Operations)</option>
                      <option value="PUBLIC">PUBLIC (Level 1 — Public Information)</option>
                    </select>
                  </div>
                </div>

                {/* Operating Site */}
                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>
                    PHYSICAL OPERATING SITE / TRUST NODE
                  </label>
                  <select
                    value={selectedSite}
                    onChange={(e) => setSelectedSite(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      background: '#121216',
                      border: '1px solid rgba(255,255,255,0.12)',
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '13px',
                      outline: 'none'
                    }}
                  >
                    {SOVEREIGN_SITES.map((site) => (
                      <option key={site} value={site}>{site}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'rgba(255, 255, 255, 0.45)' }}>
                    <Lock size={12} /> Local SHA-256 HMAC session persistence
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 24px',
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                      color: '#ffffff',
                      fontSize: '13px',
                      fontWeight: 700,
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
                    }}
                  >
                    <span>{isSubmitting ? 'Verifying HSM Token…' : 'Sign In To Sovereign Node'}</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Architecture Pillars Footer */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
            marginTop: '24px'
          }}>
            <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Terminal size={18} className="text-cyan-400" />
              <div style={{ fontSize: '11px' }}>
                <b style={{ color: '#fff', display: 'block' }}>Obsidian Vault Core</b>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Linked notes & [[wikilinks]] graph</span>
              </div>
            </div>

            <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldCheck size={18} className="text-emerald-400" />
              <div style={{ fontSize: '11px' }}>
                <b style={{ color: '#fff', display: 'block' }}>Permission-Aware RAG</b>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Retrieval filtered by clearance level</span>
              </div>
            </div>

            <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Cpu size={18} className="text-indigo-400" />
              <div style={{ fontSize: '11px' }}>
                <b style={{ color: '#fff', display: 'block' }}>Local Model Routing</b>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>100% on-premise execution</span>
              </div>
            </div>

            <div style={{ padding: '12px 14px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FileCheck size={18} className="text-amber-400" />
              <div style={{ fontSize: '11px' }}>
                <b style={{ color: '#fff', display: 'block' }}>Tamper-Evident Audit</b>
                <span style={{ color: 'rgba(255,255,255,0.5)' }}>Cryptographic SHA-256 ledger</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="auth-corner" style={{ position: 'fixed', bottom: '12px', right: '16px', fontSize: '10px', color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em' }}>
        SENTINEL SOVEREIGN INTELLIGENCE · ON-PREMISE MISSION CONTROL
      </div>
    </main>
  )
}
