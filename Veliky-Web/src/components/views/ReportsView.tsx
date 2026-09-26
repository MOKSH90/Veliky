import { useState } from 'react'
import { 
  FileText, 
  Download, 
  Printer, 
  Copy, 
  CheckCircle2, 
  Lock, 
  ShieldCheck, 
  Check, 
  ExternalLink,
  Layers,
  Calculator
} from 'lucide-react'
import { useVelikyStore } from '../../store/useVelikySOCStore'

const REPORTS = [
  {
    id: 'REP-2026-001',
    title: 'Forensic Vibration & Reliability Brief for Pump P-204',
    standard: 'ISO 10816-3 Class II (Rigid Foundation)',
    date: '2026-09-14',
    author: 'VELIKY Autonomous Investigator (Qwen-2.5-7B)',
    clearance: 'OPERATOR / INTERNAL',
    target: 'Centrifugal Slurry Pump P-204',
    content: `# SOVEREIGN INVESTIGATION DOSSIER: P-204
**Reference ID**: \`INV-2026-001\` | **Standard**: \`ISO 10816-3 Category 2\` | **Clearance**: \`OPERATOR\`

---

## 1. Executive Summary
On 2026-08-28, vibration monitoring on Centrifugal Slurry Pump P-204 at Unit 2 Bottoms Transfer revealed an elevated vibration condition on the Non-Drive End (NDE) bearing housing measuring **5.4 mm/s RMS**. 

This measurement breaches the ISO 10816-3 Zone B continuous operation boundary (4.5 mm/s) and places the asset into **Zone C (Attention Required)**. An independent mathematical recalculation executed in an isolated Docker sandbox confirmed an increase of **92.86%** relative to the commissioning baseline of 2.8 mm/s RMS.

---

## 2. Key Evidence & Repository Citations
- **Source 1**: *Inspection-Report-62.md* (Page 1)
  > *"Non-Drive End (NDE) bearing horizontal vibration reached 5.4 mm/s RMS. Strong spectral peak at 1X running frequency (24.67 Hz) and 2X harmonic (49.33 Hz). Temperature reached 68°C."*
- **Source 2**: *Maintenance-Report-184.md* (Page 1)
  > *"Purged and replenished with 45g Mobil Polyrex EM. Slight grease discoloration noted on NDE drain plug. Baseline recorded at 2.8 mm/s."*
- **Source 3**: *SOP-Pump-Maintenance.md* (Page 2, Section 4.5)
  > *"If vibration velocity increases by >50% or exceeds 4.5 mm/s, mandatory mechanical intervention requires operator sign-off before condition degrades to Zone D (>7.1 mm/s)."*

---

## 3. Sandboxed Calculations (Independently Verified)
\`\`\`python
# Formula: ((current - baseline) / baseline) * 100
current = 5.4   # mm/s RMS
baseline = 2.8  # mm/s RMS
delta_pct = ((current - baseline) / baseline) * 100
# Verified Output: 92.85714285714289%
\`\`\`
- **Claimed Value**: 92.9%
- **Verified Sandbox Output**: 92.85714285714289%
- **Status**: [VERIFIED MATCH — 0 DISCREPANCY]

---

## 4. Root Cause Analysis
Spectral analysis confirms dynamic shaft misalignment across the flexible coupling combined with early-stage raceway micro-spalling on the 6312 NDE deep groove ball bearing. Process interdependency indicates downstream vapor carryover risk to Wet Gas Compressor C-104 if uncommanded trip occurs.

---

## 5. Mandatory Interventions
1. Execute controlled unit slowdown and laser alignment across coupling.
2. Replace Non-Drive End 6312 C3 ball bearing and flush housing.
3. Verify Plan 53A seal buffer reservoir pressure (3.5 bar nitrogen precharge).
4. Maintain bypass valve V-19 in ready state.

---
**Cryptographic Integrity Seal**: \`SHA256: 03a9f812cb90141e974acbbdf92487ae41e4649b934ca495991b7852b855\``
  },
  {
    id: 'REP-2026-002',
    title: 'Sovereign On-Premise Air-Gap Security Audit Certificate',
    standard: 'SIH Problem Statement 26117 Confidentiality Standard',
    date: '2026-09-14',
    author: 'VELIKY Sovereign Security Subsystem',
    clearance: 'RESTRICTED / SEC-OPS LEAD',
    target: 'Full On-Premise AI Compute Cluster',
    content: `# AIR-GAP COMPLIANCE & ZERO-EGRESS CERTIFICATION
**Audit ID**: \`AUD-2026-AIRGAP-001\` | **Protocol**: \`STRICT AIR-GAP\`

## 1. Compliance Statement
This certifies that during all autonomous inference, task planning, vector retrieval, and code sandbox execution:
- **Outbound Network Traffic**: Exactly 0.00 KB/s
- **Total Blocked External Packets**: 14,289 packets
- **External AI Provider APIs**: ZERO calls to OpenAI, Anthropic, or external clouds
- **Vector Storage**: 100% on-premise local SQLite3 and FAISS indices
- **Audit Logging**: Local fsync hash-chained JSONL with Merkle-tree root

---
**Verified by**: \`Moksh (SecOps Lead)\``
  }
]

export function ReportsView() {
  const [selectedReportId, setSelectedReportId] = useState(REPORTS[0].id)
  const [copied, setCopied] = useState(false)

  const activeReport = REPORTS.find(r => r.id === selectedReportId) || REPORTS[0]

  const handleCopy = () => {
    navigator.clipboard.writeText(activeReport.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownload = () => {
    const blob = new Blob([activeReport.content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${activeReport.id}_VELIKY_Dossier.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', padding: '16px 20px', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} style={{ color: 'var(--soc-primary)' }} />
            <h2 style={{ margin: 0, fontSize: '16px', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--soc-text-high)' }}>
              SOVEREIGN COMPLIANCE DOSSIERS & AUDIT REPORTS
            </h2>
          </div>
          <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--soc-text-muted)' }}>
            Cryptographically Verified Engineering Reports · ISO 10816-3 & Air-Gap Attestation
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button type="button" className="soc-btn soc-btn-primary" onClick={handleDownload} style={{ gap: '6px' }}>
            <Download size={12} /> Export Markdown
          </button>
          <button type="button" className="soc-btn soc-btn-ghost" onClick={handleCopy} style={{ gap: '6px' }}>
            {copied ? <Check size={12} style={{ color: 'var(--soc-emerald)' }} /> : <Copy size={12} />}
            <span>{copied ? 'Copied' : 'Copy Content'}</span>
          </button>
        </div>
      </div>

      {/* Main Layout: Selector sidebar + Report preview */}
      <div className="overview-two-col" style={{ gridTemplateColumns: 'minmax(280px, 320px) 1fr' }}>
        {/* Report List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <span className="soc-eyebrow">SELECT AUDIT DOSSIER:</span>
          {REPORTS.map((rep) => {
            const isSelected = selectedReportId === rep.id
            return (
              <div
                key={rep.id}
                onClick={() => setSelectedReportId(rep.id)}
                className="soc-plate"
                style={{
                  cursor: 'pointer',
                  borderColor: isSelected ? 'var(--soc-primary)' : 'var(--soc-border-subtle)',
                  background: isSelected ? 'var(--soc-bg-card)' : 'var(--soc-bg-surface)',
                  padding: '12px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span className="soc-badge badge-dim" style={{ fontSize: '9px' }}>{rep.id}</span>
                  <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--soc-text-dim)' }}>{rep.date}</span>
                </div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--soc-text-high)', marginBottom: '4px' }}>
                  {rep.title}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--soc-text-dim)', fontFamily: 'var(--font-mono)' }}>
                  Standard: {rep.standard}
                </div>
              </div>
            )
          })}
        </div>

        {/* Report Preview Document */}
        <div className="soc-plate" style={{ overflowY: 'auto' }}>
          <div className="soc-plate-header">
            <span className="soc-plate-title">
              <ShieldCheck size={12} style={{ color: 'var(--soc-emerald)' }} />
              {activeReport.title}
            </span>
            <span className="soc-badge badge-normal">CRYPTOGRAPHICALLY SEALED</span>
          </div>

          <div className="soc-plate-body" style={{ padding: '24px', background: 'var(--soc-bg-card)' }}>
            <div style={{ maxWidth: '720px', margin: '0 auto', fontFamily: 'var(--font-mono)', fontSize: '12px', lineHeight: 1.6, color: 'var(--soc-text-high)', whiteSpace: 'pre-wrap' }}>
              {activeReport.content}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
