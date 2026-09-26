import { useState } from 'react'
import { 
  Settings2, 
  Lock, 
  Cpu, 
  ShieldCheck, 
  Users, 
  Sliders, 
  Check, 
  AlertTriangle,
  Server,
  KeyRound,
  FileCheck
} from 'lucide-react'
import { useVelikyStore } from '../../store/useVelikySOCStore'

export function SettingsView() {
  const airGapState = useVelikyStore((s) => s.airGapState)
  const setAirGapState = useVelikyStore((s) => s.setAirGapState)
  const modelRegistry = useVelikyStore((s) => s.modelRegistry)
  const authUser = useVelikyStore((s) => s.authUser)

  const [activeSubTab, setActiveSubTab] = useState<'airgap' | 'models' | 'rbac' | 'guardrails'>('airgap')
  const [strictAirgap, setStrictAirgap] = useState(true)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', padding: '16px 20px', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings2 size={18} style={{ color: 'var(--soc-primary)' }} />
            <h2 style={{ margin: 0, fontSize: '16px', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--soc-text-high)' }}>
              SOVEREIGN POLICY & SYSTEM GOVERNANCE
            </h2>
          </div>
          <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--soc-text-muted)' }}>
            Physical Air-Gap Configuration · Model Capability Registry · RBAC Permissions · AI Guardrails
          </p>
        </div>

        <div className="soc-badge badge-normal">
          <Lock size={11} />
          <span>POLICY ENGINE ENFORCED</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--soc-border-subtle)', background: 'var(--soc-bg-elevated)' }}>
        {[
          { id: 'airgap', label: 'Air-Gap Enforcement' },
          { id: 'models', label: 'Local Model Registry' },
          { id: 'rbac', label: 'RBAC Clearance Matrix' },
          { id: 'guardrails', label: 'AI Guardrail Policy' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveSubTab(tab.id as any)}
            style={{
              padding: '8px 16px',
              fontFamily: 'var(--font-mono)',
              fontSize: '11px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              color: activeSubTab === tab.id ? 'var(--soc-primary)' : 'var(--soc-text-dim)',
              borderBottom: activeSubTab === tab.id ? '2px solid var(--soc-primary)' : '2px solid transparent',
              background: 'transparent',
              cursor: 'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Air-Gap Enforcement */}
      {activeSubTab === 'airgap' && (
        <div className="soc-plate">
          <div className="soc-plate-header">
            <span className="soc-plate-title">
              <Lock size={12} /> Air-Gap Network Egress Firewall Rules
            </span>
            <span className="soc-badge badge-normal">STRICT AIR-GAP: ENFORCED</span>
          </div>

          <div className="soc-plate-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--soc-bg-elevated)', border: '1px solid var(--soc-border-subtle)', borderRadius: '6px' }}>
              <div>
                <div style={{ fontWeight: 600, color: 'var(--soc-text-high)', fontSize: '13px' }}>
                  Zero-Egress Sovereign Firewall
                </div>
                <div style={{ fontSize: '11px', color: 'var(--soc-text-muted)' }}>
                  Drops all external TCP/UDP packets. Only localhost (127.0.0.1) and Modbus SCADA subnet allowed.
                </div>
              </div>
              <input
                type="checkbox"
                checked={strictAirgap}
                onChange={(e) => setStrictAirgap(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--soc-primary)', cursor: 'pointer' }}
              />
            </div>

            <table className="soc-table">
              <thead>
                <tr>
                  <th>Interface</th>
                  <th>Subnet / Binding</th>
                  <th>Direction</th>
                  <th>Action</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="soc-mono">lo (loopback)</td>
                  <td className="soc-mono">127.0.0.1:8000 (PyTorch LLM Server)</td>
                  <td>Internal IPC</td>
                  <td>ALLOW</td>
                  <td><span className="soc-badge badge-normal">ACTIVE</span></td>
                </tr>
                <tr>
                  <td className="soc-mono">eth0 (ICS Bus)</td>
                  <td className="soc-mono">192.168.10.0/24 (SCADA Modbus)</td>
                  <td>Inbound Sensors</td>
                  <td>ALLOW</td>
                  <td><span className="soc-badge badge-normal">ACTIVE</span></td>
                </tr>
                <tr>
                  <td className="soc-mono">wan0 (Cloud)</td>
                  <td className="soc-mono">0.0.0.0/0 (Internet / Public AI)</td>
                  <td>Outbound Egress</td>
                  <td><b style={{ color: 'var(--soc-red)' }}>STRICT DROP</b></td>
                  <td><span className="soc-badge badge-critical">BLOCKED</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Model Registry */}
      {activeSubTab === 'models' && (
        <div className="soc-plate">
          <div className="soc-plate-header">
            <span className="soc-plate-title">
              <Cpu size={12} /> Local Open-Weight Model Weights Registry
            </span>
            <span className="soc-eyebrow">4 MODELS REGISTERED</span>
          </div>

          <div className="soc-plate-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {modelRegistry.map((mod) => (
              <div key={mod.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--soc-bg-elevated)', borderRadius: '6px', border: '1px solid var(--soc-border-subtle)' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--soc-text-high)' }}>
                      {mod.name}
                    </span>
                    <span className="soc-badge badge-dim" style={{ fontSize: '9px' }}>{mod.role}</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--soc-text-muted)', marginTop: '2px' }}>
                    Context: {mod.activeContext} · Allocated VRAM: {mod.vramUsageGb} GB
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="soc-badge badge-normal">{mod.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: RBAC Clearance Matrix */}
      {activeSubTab === 'rbac' && (
        <div className="soc-plate">
          <div className="soc-plate-header">
            <span className="soc-plate-title">
              <Users size={12} /> Role-Based Access Control (RBAC) & Document Permissions
            </span>
            <span className="soc-eyebrow">PERMISSION-AWARE RAG</span>
          </div>

          <div className="soc-plate-body">
            <table className="soc-table">
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Clearance Level</th>
                  <th>Document Access Scope</th>
                  <th>Can Execute Sandbox</th>
                  <th>Can Approve Work Order</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 700, color: 'var(--soc-text-high)' }}>Admin</td>
                  <td><span className="soc-badge badge-dim">RESTRICTED (Level 6)</span></td>
                  <td>Global (Refinery, ICS, AI, Financials)</td>
                  <td>Yes</td>
                  <td>Yes</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 700, color: 'var(--soc-primary)' }}>SecOps Lead</td>
                  <td><span className="soc-badge badge-sovereign">CONFIDENTIAL (Level 4)</span></td>
                  <td>Refinery Unit 2, SCADA Telemetry, Incident Room</td>
                  <td>Yes</td>
                  <td>Yes</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 700 }}>Engineer</td>
                  <td><span className="soc-badge badge-dim">INTERNAL (Level 2)</span></td>
                  <td>Unit 2 Equipment Specs, P&ID Drawings</td>
                  <td>Yes</td>
                  <td>No</td>
                </tr>
                <tr>
                  <td style={{ fontWeight: 700 }}>Operator</td>
                  <td><span className="soc-badge badge-dim">INTERNAL (Level 2)</span></td>
                  <td>Inspection Reports, SOP Maintenance</td>
                  <td>View Only</td>
                  <td>No</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: AI Guardrail Policy */}
      {activeSubTab === 'guardrails' && (
        <div className="soc-plate">
          <div className="soc-plate-header">
            <span className="soc-plate-title">
              <ShieldCheck size={12} /> Autonomous AI Policy Engine Guardrails
            </span>
            <span className="soc-eyebrow">ALLOWED / RESTRICTED / BLOCKED</span>
          </div>

          <div className="soc-plate-body overview-kpi-grid">
            {/* Allowed Actions */}
            <div style={{ background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: '6px', padding: '12px' }}>
              <div style={{ color: 'var(--soc-emerald)', fontWeight: 700, fontSize: '12px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Check size={14} /> ALLOWED (Autonomous)
              </div>
              <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: 'var(--soc-text-main)', lineHeight: 1.6 }}>
                <li>Analyze vibration inspection PDF</li>
                <li>Summarize ISO 10816-3 standards</li>
                <li>Calculate mathematical statistics</li>
                <li>Search internal vault documents</li>
                <li>Generate draft incident dossier</li>
              </ul>
            </div>

            {/* Restricted Actions */}
            <div style={{ background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '6px', padding: '12px' }}>
              <div style={{ color: 'var(--soc-amber)', fontWeight: 700, fontSize: '12px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={14} /> RESTRICTED (Human Approval)
              </div>
              <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: 'var(--soc-text-main)', lineHeight: 1.6 }}>
                <li>Execute Python code in Docker</li>
                <li>Modify maintenance log files</li>
                <li>Access restricted engineering drawings</li>
                <li>Dispatch SCADA work orders</li>
                <li>Trigger equipment shutdown</li>
              </ul>
            </div>

            {/* Blocked Actions */}
            <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '6px', padding: '12px' }}>
              <div style={{ color: 'var(--soc-red)', fontWeight: 700, fontSize: '12px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Lock size={14} /> BLOCKED (Strictly Forbidden)
              </div>
              <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: 'var(--soc-text-main)', lineHeight: 1.6 }}>
                <li>Export data outside on-premise network</li>
                <li>Delete cryptographic audit records</li>
                <li>Execute uncontained OS commands</li>
                <li>Bypass SIL-3 safety interlocks</li>
                <li>Send prompt to external cloud LLM</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
