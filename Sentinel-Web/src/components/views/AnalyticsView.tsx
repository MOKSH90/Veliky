import { 
  BarChart3, 
  TrendingUp, 
  Activity, 
  CheckCircle2, 
  Cpu, 
  Clock, 
  ShieldCheck, 
  Zap,
  Lock,
  Layers
} from 'lucide-react'
import { useSentinelStore } from '../../store/useSentinelSOCStore'

export function AnalyticsView() {
  const systemResources = useSentinelStore((s) => s.systemResources)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', padding: '16px 20px', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={18} style={{ color: 'var(--soc-primary)' }} />
            <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--soc-text-high)', fontFamily: 'var(--font-mono)' }}>
              WEIBULL HAZARD ACCELERATION PROFILE
            </span>
          </div>
          <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--soc-text-muted)' }}>
            Weibull Hazard Modeling · RUL Estimation · Model Router Execution Efficiency
          </p>
        </div>

        <div className="soc-badge badge-normal">
          <CheckCircle2 size={11} />
          <span>99.82% AUDITED VERIFICATION RATE</span>
        </div>
      </div>

      {/* Top 3 Analytical Metric Cards */}
      <div className="overview-kpi-grid">
        <div className="kpi-metric-box" style={{ '--kpi-accent': 'var(--soc-red)' } as any}>
          <span className="kpi-metric-label">ESTIMATED REMAINING USEFUL LIFE (RUL)</span>
          <span className="kpi-metric-value" style={{ color: 'var(--soc-red)' }}>
            48.5 <span style={{ fontSize: '11px' }}>HOURS</span>
          </span>
          <span className="kpi-metric-sub">P-204 NDE 6312 Bearing to Zone D Trip</span>
        </div>

        <div className="kpi-metric-box" style={{ '--kpi-accent': 'var(--soc-emerald)' } as any}>
          <span className="kpi-metric-label">VERIFIED FACTUALITY ACCURACY</span>
          <span className="kpi-metric-value" style={{ color: 'var(--soc-emerald)' }}>
            {systemResources.verificationAccuracyPct}%
          </span>
          <span className="kpi-metric-sub">1,420 sandboxed calculations (0 failures)</span>
        </div>

        <div className="kpi-metric-box" style={{ '--kpi-accent': 'var(--soc-primary)' } as any}>
          <span className="kpi-metric-label">AVERAGE SOVEREIGN LATENCY</span>
          <span className="kpi-metric-value" style={{ color: 'var(--soc-primary)' }}>
            3.2 <span style={{ fontSize: '11px' }}>SEC</span>
          </span>
          <span className="kpi-metric-sub">Multi-Model Agent Turnaround</span>
        </div>
      </div>

      {/* Middle Row: RUL Degradation Curve & Model Task Breakdown */}
      <div className="overview-two-col">
        {/* RUL Curve */}
        <div className="soc-plate">
          <div className="soc-plate-header">
            <span className="soc-plate-title">
              <TrendingUp size={12} /> Predictive Remaining Useful Life (Weibull Hazard Curve)
            </span>
            <span className="soc-eyebrow">EQUIPMENT P-204</span>
          </div>

          <div className="soc-plate-body" style={{ height: '220px', padding: '10px' }}>
            <svg viewBox="0 0 450 180" style={{ width: '100%', height: '100%' }}>
              <defs>
                <linearGradient id="rulGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(239,68,68,0.2)" />
                  <stop offset="100%" stopColor="transparent" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="30" y1="30" x2="430" y2="30" stroke="rgba(239,68,68,0.3)" strokeDasharray="3 3" />
              <text x="35" y="26" fill="var(--soc-red)" fontSize="8px" fontFamily="var(--font-mono)">Critical Failure Threshold (Zone D &gt; 7.1 mm/s)</text>

              <line x1="30" y1="150" x2="430" y2="150" stroke="var(--soc-border-medium)" />
              <line x1="30" y1="20" x2="30" y2="150" stroke="var(--soc-border-medium)" />

              {/* Degradation Curve */}
              <path
                d="M 30 135 C 150 130, 240 115, 300 80 S 370 50, 410 32"
                fill="none"
                stroke="var(--soc-red)"
                strokeWidth="2.5"
              />

              {/* Current Operating Point */}
              <circle cx="300" cy="80" r="5" fill="var(--soc-amber)" stroke="#fff" strokeWidth="1.5" />
              <text x="300" y="70" fill="var(--soc-amber)" fontSize="9px" fontFamily="var(--font-mono)" textAnchor="middle" fontWeight="700">
                NOW: 5.4 mm/s
              </text>

              {/* Projected Failure Marker */}
              <circle cx="410" cy="32" r="5" fill="var(--soc-red)" stroke="#fff" strokeWidth="1.5" />
              <text x="410" y="24" fill="var(--soc-red)" fontSize="9px" fontFamily="var(--font-mono)" textAnchor="middle" fontWeight="700">
                +48h FAILURE
              </text>
            </svg>
          </div>
        </div>

        {/* Model Task Dispatch Distribution */}
        <div className="soc-plate">
          <div className="soc-plate-header">
            <span className="soc-plate-title">
              <Cpu size={12} /> Model Router Task Distribution
            </span>
            <span className="soc-eyebrow">LAST 30 DAYS</span>
          </div>

          <div className="soc-plate-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { label: 'Reasoning & Synthesis (Qwen-2.5 7B)', pct: 44, color: 'var(--soc-primary)' },
              { label: 'Vision & P&ID Drawings (Qwen-VL)', pct: 28, color: 'var(--soc-primary-hover)' },
              { label: 'Sandboxed Python Calculations (Docker)', pct: 18, color: 'var(--soc-emerald)' },
              { label: 'Semantic Retrieval (BGE Large Vector)', pct: 10, color: 'var(--soc-text-dim)' },
            ].map((t) => (
              <div key={t.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginBottom: '3px' }}>
                  <span style={{ color: 'var(--soc-text-high)' }}>{t.label}</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: t.color }}>{t.pct}%</span>
                </div>
                <div style={{ width: '100%', height: '5px', background: 'var(--soc-bg-elevated)', border: '1px solid var(--soc-border-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${t.pct}%`, height: '100%', background: t.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Anomaly Correlation Matrix */}
      <div className="soc-plate">
        <div className="soc-plate-header">
          <span className="soc-plate-title">
            <Activity size={12} /> Industrial Parameter Correlation Coefficients (Pearson r)
          </span>
          <span className="soc-eyebrow">CROSS-SENSOR CORRELATION</span>
        </div>

        <div className="soc-plate-body">
          <table className="soc-table">
            <thead>
              <tr>
                <th>Telemetry Parameter</th>
                <th>Vibration RMS</th>
                <th>Housing Temp</th>
                <th>Discharge Head</th>
                <th>Motor Amps</th>
                <th>Risk Factor</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="soc-mono" style={{ fontWeight: 700 }}>Vibration Velocity (mm/s)</td>
                <td className="soc-mono" style={{ color: 'var(--soc-primary)' }}>1.00</td>
                <td className="soc-mono" style={{ color: 'var(--soc-red)', fontWeight: 700 }}>+0.89 (High)</td>
                <td className="soc-mono" style={{ color: 'var(--soc-amber)' }}>-0.42 (Moderate)</td>
                <td className="soc-mono" style={{ color: 'var(--soc-amber)' }}>+0.68 (Moderate)</td>
                <td><span className="soc-badge badge-critical">PRIMARY HAZARD</span></td>
              </tr>
              <tr>
                <td className="soc-mono" style={{ fontWeight: 700 }}>Bearing Temp (°C)</td>
                <td className="soc-mono" style={{ color: 'var(--soc-red)', fontWeight: 700 }}>+0.89</td>
                <td className="soc-mono" style={{ color: 'var(--soc-primary)' }}>1.00</td>
                <td className="soc-mono">-0.31</td>
                <td className="soc-mono">+0.54</td>
                <td><span className="soc-badge badge-warning">SECONDARY INDICATOR</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
