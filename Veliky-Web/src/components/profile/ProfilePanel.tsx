import { useState } from 'react'
import { 
  X, 
  ShieldCheck, 
  LockKeyhole, 
  LogOut, 
  KeyRound, 
  ShieldAlert, 
  Building2, 
  Check, 
  Cpu, 
  Database,
  Terminal,
  ChevronRight
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEdithStore } from '../../store/useEdithStore'
import { SOVEREIGN_PERSONAS, getClearanceColor, getRoleBadgeStyle } from '../../lib/authPersonas'

export function ProfilePanel() {
  const open = useEdithStore((s) => s.profileOpen)
  const set = useEdithStore((s) => s.setProfileOpen)
  const user = useEdithStore((s) => s.authUser)
  const signOut = useEdithStore((s) => s.signOut)
  const switchSovereignPersona = useEdithStore((s) => s.switchSovereignPersona)
  const [copiedToken, setCopiedToken] = useState(false)

  const copyToken = () => {
    if (user?.token) {
      navigator.clipboard.writeText(user.token)
      setCopiedToken(true)
      setTimeout(() => setCopiedToken(false), 2000)
    }
  }

  const clearanceColor = getClearanceColor(user?.clearance)
  const roleStyle = user ? getRoleBadgeStyle(user.role) : { bg: 'rgba(255,255,255,0.1)', color: '#fff', border: 'transparent' }

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          className="profile-panel"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          style={{
            width: '380px',
            background: 'rgba(18, 18, 22, 0.98)',
            borderLeft: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
            zIndex: 100,
            backdropFilter: 'blur(20px)',
            overflowY: 'auto'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: `${user?.avatarColor || '#3b82f6'}25`,
                  color: user?.avatarColor || '#3b82f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: '13px'
                }}
              >
                {user?.name?.slice(0, 2).toUpperCase() || 'OP'}
              </div>
              <div>
                <strong style={{ fontSize: '14px', color: '#fff', display: 'block' }}>{user?.name || 'Sovereign Operator'}</strong>
                <small style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.45)' }}>{user?.employeeId} · {user?.department}</small>
              </div>
            </div>
            <button className="icon-button" onClick={() => set(false)} style={{ background: 'transparent', border: 'none', color: '#aaa', cursor: 'pointer' }}>
              <X size={18} />
            </button>
          </div>

          {/* Clearance & Role Status Card */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            borderRadius: '10px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>SECURITY CLEARANCE</span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: `${clearanceColor}20`,
                  color: clearanceColor,
                  border: `1px solid ${clearanceColor}40`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <ShieldAlert size={12} />
                {user?.clearance} (Level {user?.clearanceLevel})
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>ASSIGNED RBAC ROLE</span>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: roleStyle.bg,
                  color: roleStyle.color,
                  border: `1px solid ${roleStyle.border}`
                }}
              >
                {user?.role.toUpperCase()}
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>OPERATIONAL SITE</span>
              <span style={{ fontSize: '11px', color: '#fff', fontWeight: 500 }}>
                {user?.site?.split('—')[0] || 'Refinery Unit 2'}
              </span>
            </div>
          </div>

          {/* Cryptographic Session Token */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            borderRadius: '10px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <KeyRound size={12} /> AIR-GAPPED SESSION TOKEN
              </span>
              <button
                type="button"
                onClick={copyToken}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: 'none',
                  color: '#818cf8',
                  fontSize: '10px',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                {copiedToken ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <code style={{ fontSize: '10px', color: '#94a3b8', background: 'rgba(0,0,0,0.4)', padding: '6px 8px', borderRadius: '6px', wordBreak: 'break-all' }}>
              {user?.token || 'veliky_tok_sovereign_local'}
            </code>
          </div>

          {/* Quick Persona Switcher */}
          <div>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.6)', marginBottom: '8px', display: 'block' }}>
              SWITCH SOVEREIGN PERSONA
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {SOVEREIGN_PERSONAS.map((p) => {
                const isActive = user?.id === p.id
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => { if (p.id && switchSovereignPersona) switchSovereignPersona(p.id) }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: '8px',
                      background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                      border: `1px solid ${isActive ? 'rgba(99, 102, 241, 0.4)' : 'rgba(255, 255, 255, 0.05)'}`,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 600, color: isActive ? '#818cf8' : '#fff' }}>{p.name}</div>
                      <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>{p.role.toUpperCase()} · {p.clearance}</div>
                    </div>
                    {isActive ? <Check size={14} color="#818cf8" /> : <ChevronRight size={13} color="rgba(255,255,255,0.2)" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Sign out */}
          <div style={{ marginTop: 'auto', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
            <button
              type="button"
              className="signout"
              onClick={signOut}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '9px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                color: '#f87171',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              <LogOut size={15} />
              <span>Lock Terminal & Sign Out</span>
            </button>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
