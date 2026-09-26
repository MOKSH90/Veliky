import { useState, useEffect } from 'react'
import { 
  Activity, 
  Gauge, 
  Radio, 
  Lock, 
  Cpu, 
  HardDrive, 
  Flame, 
  Sliders, 
  Layers,
  Thermometer,
  Zap,
  CheckCircle2,
  RefreshCw
} from 'lucide-react'
import { useVelikyStore } from '../../store/useVelikySOCStore'

export function MonitoringView() {
  const assets = useVelikyStore((s) => s.assets)
  const systemResources = useVelikyStore((s) => s.systemResources)
  const [pulse, setPulse] = useState(0)

  // Simulation pulse to make live charts breathe
  useEffect(() => {
    const timer = setInterval(() => {
      setPulse(p => p + 1)
    }, 1500)
    return () => clearInterval(timer)
  }, [])

  const p204 = assets.find(a => a.id === 'P-204') || assets[0]
  const c104 = assets.find(a => a.id === 'C-104') || assets[1]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', padding: '16px 20px', gap: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} style={{ color: 'var(--soc-emerald)' }} />
            <h2 style={{ margin: 0, fontSize: '16px', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.06em', color: 'var(--soc-text-high)' }}>
              REAL-TIME OPERATIONAL TELEMETRY & SPECTRUM COMMAND
            </h2>
          </div>
          <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: 'var(--soc-text-muted)' }}>
            High-Speed Vibration Diagnostics · FFT Harmonics · Air-Gap Hardware Watcher
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="soc-badge badge-normal">
            <Radio size={10} className="pulse" />
            <span>48 SENSORS ONLINE</span>
          </span>
          <span className="soc-badge badge-sovereign">
            <Lock size={10} />
            <span>EGRESS LEAK: 0.00 KB/s</span>
          </span>
        </div>
      </div>

      {/* Main Sensor Grid */}
      <div className="overview-kpi-grid">
        {/* P-204 Vibration */}
        <div className="kpi-metric-box" style={{ '--kpi-accent': 'var(--soc-red)' } as any}>
          <span className="kpi-metric-label">
            <span>P-204 RMS VELOCITY</span>
            <span className="soc-dot red pulse" />
          </span>
          <span className="kpi-metric-value" style={{ color: 'var(--soc-red)' }}>
            {((p204.telemetry.rmsVelocity || 5.4) + (pulse % 2 === 0 ? 0.04 : -0.03)).toFixed(2)}
            <span style={{ fontSize: '11px' }}>mm/s</span>
          </span>
          <span className="kpi-metric-sub">ISO Zone C Alert (Ceiling 4.5 mm/s)</span>
        </div>

        {/* P-204 Bearing Temperature */}
        <div className="kpi-metric-box" style={{ '--kpi-accent': 'var(--soc-amber)' } as any}>
          <span className="kpi-metric-label">
            <span>P-204 NDE HOUSING TEMP</span>
            <Thermometer size={12} style={{ color: 'var(--soc-amber)' }} />
          </span>
          <span className="kpi-metric-value" style={{ color: 'var(--soc-amber)' }}>
            {((p204.telemetry.temperatureC || 68.2) + (pulse % 3 === 0 ? 0.2 : -0.1)).toFixed(1)}
            <span style={{ fontSize: '11px' }}>°C</span>
          </span>
          <span className="kpi-metric-sub">Warning Limit: 70.0 °C</span>
        </div>

        {/* C-104 Vibration */}
        <div className="kpi-metric-box" style={{ '--kpi-accent': 'var(--soc-emerald)' } as any}>
          <span className="kpi-metric-label">
            <span>C-104 RMS VELOCITY</span>
            <span className="soc-dot emerald" />
          </span>
          <span className="kpi-metric-value" style={{ color: 'var(--soc-emerald)' }}>
            {c104.telemetry.rmsVelocity || 1.80}
            <span style={{ fontSize: '11px' }}>mm/s</span>
          </span>
          <span className="kpi-metric-sub">Zone A Baseline Stable</span>
        </div>

        {/* Discharge Pressure */}
        <div className="kpi-metric-box" style={{ '--kpi-accent': 'var(--soc-primary)' } as any}>
          <span className="kpi-metric-label">
            <span>P-204 DISCHARGE HEAD</span>
            <Gauge size={12} style={{ color: 'var(--soc-primary)' }} />
          </span>
          <span className="kpi-metric-value" style={{ color: 'var(--soc-primary)' }}>
            {p204.telemetry.pressureBar || 6.8}
            <span style={{ fontSize: '11px' }}>bar</span>
          </span>
          <span className="kpi-metric-sub">Operating at nominal head</span>
        </div>
      </div>

      {/* Middle: Vibration Comparison & Spectral FFT Charts */}
      <div className="overview-two-col">
        {/* Real-time Streaming SVG Waveform */}
        <div className="soc-plate">
          <div className="soc-plate-header">
            <span className="soc-plate-title">
              <Activity size={12} /> Live Multi-Asset Vibration Comparison (10 Hz – 1000 Hz)
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '9px', fontFamily: 'var(--font-mono)' }}>
              <span style={{ color: 'var(--soc-red)' }}>● P-204 (5.4 mm/s)</span>
              <span style={{ color: 'var(--soc-emerald)' }}>● C-104 (1.8 mm/s)</span>
              <span style={{ color: 'var(--soc-amber)' }}>-- Zone B Limit (4.5)</span>
            </div>
          </div>

          <div className="soc-plate-body" style={{ height: '220px', padding: '10px' }}>
            <svg viewBox="0 0 500 180" style={{ width: '100%', height: '100%' }}>
              {/* Grid Lines */}
              <line x1="0" y1="40" x2="500" y2="40" stroke="rgba(239, 68, 68, 0.3)" strokeDasharray="4 4" />
              <text x="5" y="36" fill="var(--soc-red)" fontSize="8px" fontFamily="var(--font-mono)">Zone C Limit (7.1 mm/s)</text>

              <line x1="0" y1="90" x2="500" y2="90" stroke="rgba(245, 158, 11, 0.4)" strokeDasharray="3 3" />
              <text x="5" y="86" fill="var(--soc-amber)" fontSize="8px" fontFamily="var(--font-mono)">Zone B Limit (4.5 mm/s)</text>

              {/* P-204 Waveform (Zone C high amplitude) */}
              <path
                d="M 0 70 Q 30 55, 60 72 T 120 68 T 180 60 T 240 75 T 300 65 T 360 70 T 420 62 T 500 68"
                fill="none"
                stroke="var(--soc-red)"
                strokeWidth="2"
              />

              {/* C-104 Waveform (Zone A low amplitude) */}
              <path
                d="M 0 145 Q 30 140, 60 146 T 120 142 T 180 147 T 240 144 T 300 145 T 360 142 T 420 146 T 500 144"
                fill="none"
                stroke="var(--soc-emerald)"
                strokeWidth="1.5"
              />
            </svg>
          </div>
        </div>

        {/* FFT Frequency Harmonics Spectrum */}
        <div className="soc-plate">
          <div className="soc-plate-header">
            <span className="soc-plate-title" style={{ color: 'var(--soc-primary)' }}>
              <Zap size={12} /> FFT Harmonic Spectrum (NDE Bearing Housing)
            </span>
            <span className="soc-eyebrow">1480 RPM · 24.67 Hz 1X</span>
          </div>

          <div className="soc-plate-body" style={{ height: '220px', padding: '10px' }}>
            <svg viewBox="0 0 400 180" style={{ width: '100%', height: '100%' }}>
              {/* Spectrum Axis */}
              <line x1="30" y1="160" x2="380" y2="160" stroke="var(--soc-border-medium)" />
              <line x1="30" y1="20" x2="30" y2="160" stroke="var(--soc-border-medium)" />

              {/* Spectral Peak 1X (24.67 Hz) */}
              <rect x="75" y="45" width="18" height="115" rx="2" fill="var(--soc-red)" />
              <text x="84" y="38" fill="var(--soc-red)" fontSize="9px" fontFamily="var(--font-mono)" textAnchor="middle" fontWeight="700">1X</text>
              <text x="84" y="172" fill="var(--soc-text-dim)" fontSize="8px" fontFamily="var(--font-mono)" textAnchor="middle">24.7 Hz</text>

              {/* Spectral Peak 2X Harmonic (49.33 Hz) */}
              <rect x="150" y="85" width="18" height="75" rx="2" fill="var(--soc-amber)" />
              <text x="159" y="78" fill="var(--soc-amber)" fontSize="9px" fontFamily="var(--font-mono)" textAnchor="middle" fontWeight="700">2X</text>
              <text x="159" y="172" fill="var(--soc-text-dim)" fontSize="8px" fontFamily="var(--font-mono)" textAnchor="middle">49.3 Hz</text>

              {/* 3X and higher noise floor */}
              <rect x="225" y="135" width="14" height="25" rx="2" fill="var(--soc-text-dim)" />
              <text x="232" y="172" fill="var(--soc-text-dim)" fontSize="8px" fontFamily="var(--font-mono)" textAnchor="middle">3X</text>

              <rect x="300" y="145" width="14" height="15" rx="2" fill="var(--soc-text-dim)" />
              <text x="307" y="172" fill="var(--soc-text-dim)" fontSize="8px" fontFamily="var(--font-mono)" textAnchor="middle">4X</text>
            </svg>
          </div>
        </div>
      </div>

      {/* Bottom: Air-Gap Network & Host Hardware Watcher */}
      <div className="soc-plate">
        <div className="soc-plate-header">
          <span className="soc-plate-title">
            <Cpu size={12} /> Air-Gapped Sovereign Hardware & Network Firewall
          </span>
          <span className="soc-badge badge-normal">AIR-GAP STRICT INTEGRITY</span>
        </div>

        <div className="soc-plate-body overview-gauge-grid">
          <div>
            <span className="soc-eyebrow">GPU VRAM CONSUMPTION:</span>
            <div style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--soc-primary)', marginTop: '2px' }}>
              {systemResources.vramUsedGb} / {systemResources.vramTotalGb} GB (71%)
            </div>
            <div style={{ fontSize: '10px', color: 'var(--soc-text-dim)' }}>Qwen-2.5 7B loaded in GPU memory</div>
          </div>

          <div>
            <span className="soc-eyebrow">HOST CPU LOAD:</span>
            <div style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--soc-emerald)', marginTop: '2px' }}>
              {systemResources.cpuUtilization}% Nominal
            </div>
            <div style={{ fontSize: '10px', color: 'var(--soc-text-dim)' }}>4 cores pinned for inference & sandbox</div>
          </div>

          <div>
            <span className="soc-eyebrow">OUTBOUND EGRESS:</span>
            <div style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--soc-emerald)', marginTop: '2px' }}>
              0.00 KB/s (0 LEAK)
            </div>
            <div style={{ fontSize: '10px', color: 'var(--soc-text-dim)' }}>External internet fully severed</div>
          </div>

          <div>
            <span className="soc-eyebrow">FIREWALL PACKET DROPS:</span>
            <div style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--soc-text-high)', marginTop: '2px' }}>
              {systemResources.airGappedPacketsBlocked.toLocaleString()} Blocked
            </div>
            <div style={{ fontSize: '10px', color: 'var(--soc-text-dim)' }}>100% telemetry retained locally</div>
          </div>
        </div>
      </div>
    </div>
  )
}
