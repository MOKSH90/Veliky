import type { 
  IndustrialAsset, 
  ThreatItem, 
  IncidentItem, 
  ModelCapability, 
  SystemResources, 
  AuditLedgerRecord, 
  ReasoningLedgerStep 
} from '../lib/types'

export const INITIAL_SYSTEM_RESOURCES: SystemResources = {
  cpuUtilization: 28.4,
  vramUsedGb: 11.4,
  vramTotalGb: 16.0,
  ramUsedGb: 18.2,
  ramTotalGb: 32.0,
  networkOutboundKbps: 0.00, // Strictly 0.00 to guarantee sovereign air-gap
  airGappedPacketsBlocked: 14289,
  verificationAccuracyPct: 99.82,
  activeSensorsCount: 48,
}

export const INDUSTRIAL_ASSETS: IndustrialAsset[] = [
  {
    id: 'P-204',
    name: 'Centrifugal Slurry Pump P-204',
    tag: 'P-204',
    category: 'Rotating Equipment',
    unit: 'Unit 2 Bottoms Transfer',
    cluster: 'REFINERY_UNIT_2',
    criticality: 'CRITICAL',
    status: 'ATTENTION_REQUIRED',
    isoZone: 'Zone_C',
    manufacturer: 'Sulzer / Flowserve Model HPX-II',
    ratedSpeed: '1480 RPM (1X = 24.67 Hz)',
    driver: 'Siemens 75 kW 3-Phase Induction Motor, 415 V, 50 Hz',
    bearings: '6314 C3 Deep Groove Ball (DE) / 6312 C3 Deep Groove Ball (NDE)',
    seal: 'Dual pressurized cartridge seal Plan 53A (3.5 bar nitrogen precharge)',
    clearanceLevel: 'operator',
    connectedAssetIds: ['C-104', 'TK-101', 'E-201', 'V-19'],
    downstreamHazard: 'High vibration propagates hydraulic surges to C-104 compressor vapor circuit and E-201 preheater.',
    lastInspected: '2026-08-28',
    linkedDocuments: ['Inspection-Report-62.md', 'Maintenance-Report-184.md', 'SOP-Pump-Maintenance.md'],
    coordinates: { x: 260, y: 190 },
    telemetry: {
      rmsVelocity: 5.4, // mm/s - ISO 10816-3 Zone C alert
      temperatureC: 68.2, // Approaching 70°C warning threshold
      pressureBar: 6.8,
      rpm: 1480,
      motorCurrentA: 84.2,
      acousticDb: 89.4,
      harmonic1X: 4.1,
      harmonic2X: 2.3,
      history: [
        { date: '2026-01-15', rmsVelocity: 2.8, temperatureC: 48, isoZone: 'Zone_B', note: 'Commissioning baseline post-overhaul' },
        { date: '2026-03-10', rmsVelocity: 2.9, temperatureC: 50, isoZone: 'Zone_B', note: 'Routine monthly check' },
        { date: '2026-05-14', rmsVelocity: 3.1, temperatureC: 51, isoZone: 'Zone_B', note: 'Normal continuous operation' },
        { date: '2026-06-12', rmsVelocity: 3.2, temperatureC: 52, isoZone: 'Zone_B', note: 'Post quarterly greasing (MR-184)' },
        { date: '2026-07-20', rmsVelocity: 3.8, temperatureC: 58, isoZone: 'Zone_B', note: 'Slight upward harmonic trend noted' },
        { date: '2026-08-15', rmsVelocity: 4.4, temperatureC: 62, isoZone: 'Zone_B', note: 'Near Zone B upper limit of 4.5 mm/s' },
        { date: '2026-08-28', rmsVelocity: 5.4, temperatureC: 68, isoZone: 'Zone_C', note: 'Inspection Report #62 Zone C alert raised (+92.9%)' },
      ]
    }
  },
  {
    id: 'C-104',
    name: 'Wet Gas Centrifugal Compressor C-104',
    tag: 'C-104',
    category: 'Rotating Equipment',
    unit: 'Unit 2 Light Ends Vapor Recovery',
    cluster: 'REFINERY_UNIT_2',
    criticality: 'CRITICAL',
    status: 'NORMAL',
    isoZone: 'Zone_A',
    manufacturer: 'Elliott Ebara Heavy Duty Frame 4',
    ratedSpeed: '6200 RPM',
    driver: 'General Electric 450 kW Synchronous Motor',
    bearings: 'Tilting Pad Journal Bearings (Force feed oil)',
    clearanceLevel: 'operator',
    connectedAssetIds: ['P-204', 'E-201'],
    downstreamHazard: 'If P-204 trips abruptly, liquid carryover will flood suction knock-out drum, risking impellers.',
    lastInspected: '2026-08-20',
    linkedDocuments: ['Compressor-C104.md', 'SOP-Gas-Handling.md'],
    coordinates: { x: 420, y: 150 },
    telemetry: {
      rmsVelocity: 1.8,
      temperatureC: 54.0,
      pressureBar: 18.4,
      rpm: 6200,
      motorCurrentA: 210.5,
      acousticDb: 82.1,
      harmonic1X: 1.2,
      harmonic2X: 0.4,
      history: [
        { date: '2026-01-15', rmsVelocity: 1.6, temperatureC: 52, isoZone: 'Zone_A', note: 'Baseline stable' },
        { date: '2026-08-28', rmsVelocity: 1.8, temperatureC: 54, isoZone: 'Zone_A', note: 'Normal continuous monitoring' },
      ]
    }
  },
  {
    id: 'TK-101',
    name: 'Atmospheric Tower Bottoms Surge Drum TK-101',
    tag: 'TK-101',
    category: 'Pressure Vessel',
    unit: 'Unit 2 Feed Section',
    cluster: 'REFINERY_UNIT_2',
    criticality: 'HIGH',
    status: 'NORMAL',
    clearanceLevel: 'operator',
    connectedAssetIds: ['P-204'],
    lastInspected: '2026-07-15',
    linkedDocuments: ['P204_Drawing.png', 'Unit2_Vessel_Registry.md'],
    coordinates: { x: 120, y: 220 },
    telemetry: {
      temperatureC: 142.0,
      pressureBar: 1.4,
      history: [
        { date: '2026-08-28', rmsVelocity: 0.4, temperatureC: 142, isoZone: 'Zone_A', note: 'Level 74.2% stable' }
      ]
    }
  },
  {
    id: 'E-201',
    name: 'Hydrocracker Feed Preheater Train E-201',
    tag: 'E-201',
    category: 'Exchanger',
    unit: 'Unit 2 Preheat Train',
    cluster: 'REFINERY_UNIT_2',
    criticality: 'MEDIUM',
    status: 'NORMAL',
    clearanceLevel: 'operator',
    connectedAssetIds: ['P-204', 'C-104'],
    lastInspected: '2026-06-10',
    linkedDocuments: ['HeatExchanger_Spec.pdf'],
    coordinates: { x: 380, y: 290 },
    telemetry: {
      temperatureC: 198.5,
      pressureBar: 5.2,
      history: [
        { date: '2026-08-28', rmsVelocity: 0.6, temperatureC: 198.5, isoZone: 'Zone_A', note: 'Heat duty nominal' }
      ]
    }
  },
  {
    id: 'V-19',
    name: 'Emergency Isolation & Bypass Valve V-19',
    tag: 'V-19',
    category: 'Safety System',
    unit: 'Unit 2 Hydrocracker Protection',
    cluster: 'REFINERY_UNIT_2',
    criticality: 'HIGH',
    status: 'ARMED',
    clearanceLevel: 'operator',
    connectedAssetIds: ['P-204'],
    lastInspected: '2026-08-01',
    linkedDocuments: ['Safety_Interlock_Matrix.xlsx'],
    coordinates: { x: 230, y: 340 },
    telemetry: {
      pressureBar: 6.4,
      history: [
        { date: '2026-08-28', rmsVelocity: 0.1, temperatureC: 38, isoZone: 'Zone_A', note: 'Actuator primed' }
      ]
    }
  },
  {
    id: 'SCADA-PLC-03',
    name: 'Modbus / DNP3 Industrial Controller Rack 03',
    tag: 'SCADA-PLC-03',
    category: 'ICS Controller',
    unit: 'Control Room Subnet 192.168.10.0/24',
    cluster: 'CONTROL_SCADA',
    criticality: 'HIGH',
    status: 'NORMAL',
    clearanceLevel: 'engineer',
    connectedAssetIds: ['P-204', 'C-104', 'SIS-GATEWAY', 'VELIKY-ROUTER'],
    lastInspected: '2026-09-01',
    linkedDocuments: ['ICS_Network_Map.pdf'],
    coordinates: { x: 560, y: 220 },
    telemetry: {
      temperatureC: 32.0,
      history: [
        { date: '2026-09-14', rmsVelocity: 0.0, temperatureC: 32, isoZone: 'Zone_A', note: 'Deterministic scan cycle 12ms' }
      ]
    }
  },
  {
    id: 'SIS-GATEWAY',
    name: 'Safety Instrumented System (SIL-3 Interlock)',
    tag: 'SIS-GATEWAY',
    category: 'Safety System',
    unit: 'Emergency Shutdown (ESD) Subsystem',
    cluster: 'CONTROL_SCADA',
    criticality: 'CRITICAL',
    status: 'ARMED',
    clearanceLevel: 'admin',
    connectedAssetIds: ['SCADA-PLC-03', 'V-19'],
    lastInspected: '2026-08-15',
    linkedDocuments: ['SIL3_Certificate.pdf'],
    coordinates: { x: 670, y: 170 },
    telemetry: {
      temperatureC: 28.5,
      history: [
        { date: '2026-09-14', rmsVelocity: 0.0, temperatureC: 28.5, isoZone: 'Zone_A', note: 'Dual redundancy verified' }
      ]
    }
  },
  {
    id: 'VELIKY-ROUTER',
    name: 'Sovereign Multi-Model AI Router',
    tag: 'VELIKY-AI',
    category: 'AI Inference Cluster',
    unit: 'On-Premise GPU Rig (Air-Gapped)',
    cluster: 'SOVEREIGN_AI',
    criticality: 'CRITICAL',
    status: 'NORMAL',
    clearanceLevel: 'secops_lead',
    connectedAssetIds: ['SCADA-PLC-03', 'VELIKY-SANDBOX', 'VELIKY-VAULT'],
    lastInspected: '2026-09-14',
    linkedDocuments: ['VELIKY_Project_Documentation.md', 'CAPABILITIES.md'],
    coordinates: { x: 610, y: 350 },
    telemetry: {
      temperatureC: 56.4,
      history: [
        { date: '2026-09-14', rmsVelocity: 0.0, temperatureC: 56.4, isoZone: 'Zone_A', note: 'Serving Qwen 2.5 7B & Qwen VL locally' }
      ]
    }
  },
  {
    id: 'VELIKY-SANDBOX',
    name: 'Docker Isolated Python Math Sandbox',
    tag: 'SANDBOX-EXEC',
    category: 'AI Inference Cluster',
    unit: 'Isolated Container Network (0 Net Access)',
    cluster: 'SOVEREIGN_AI',
    criticality: 'HIGH',
    status: 'NORMAL',
    clearanceLevel: 'operator',
    connectedAssetIds: ['VELIKY-ROUTER', 'VELIKY-VAULT'],
    lastInspected: '2026-09-14',
    linkedDocuments: ['sandbox_executor.py'],
    coordinates: { x: 740, y: 320 },
    telemetry: {
      temperatureC: 44.0,
      history: [
        { date: '2026-09-14', rmsVelocity: 0.0, temperatureC: 44.0, isoZone: 'Zone_A', note: 'Sandbox active: isolated calculation' }
      ]
    }
  },
  {
    id: 'VELIKY-VAULT',
    name: 'Cryptographic SQLite3 & Hash-Chained Audit Ledger',
    tag: 'VAULT-STORE',
    category: 'Storage',
    unit: 'Encrypted Local NVMe State Store',
    cluster: 'VAULT_STORE',
    criticality: 'CRITICAL',
    status: 'NORMAL',
    clearanceLevel: 'secops_lead',
    connectedAssetIds: ['VELIKY-ROUTER', 'VELIKY-SANDBOX'],
    lastInspected: '2026-09-14',
    linkedDocuments: ['audit.jsonl', 'veliky.sqlite3'],
    coordinates: { x: 710, y: 440 },
    telemetry: {
      temperatureC: 36.0,
      history: [
        { date: '2026-09-14', rmsVelocity: 0.0, temperatureC: 36.0, isoZone: 'Zone_A', note: 'Immutable merkle-tree log synchronized' }
      ]
    }
  }
]

export const THREAT_INTELLIGENCE: ThreatItem[] = [
  {
    id: 'THR-2026-09',
    title: 'Pump P-204 NDE Bearing Micro-Spalling & 1X-2X Dynamic Resonance',
    targetAssetId: 'P-204',
    severity: 'CRITICAL',
    confidence: 94.2,
    vector: 'Mechanical fatigue on 6312 raceway coupled with angular shaft misalignment across coupling',
    mitreTechnique: 'T0888 - Loss of Safety / Physical Process Degradation',
    detectionSource: 'Spectral FFT Harmonics & Inspection Report #62',
    description: 'Vibration velocity has jumped from 2.8 mm/s baseline to 5.4 mm/s RMS (Zone C breach, +92.9% rise). Dominant 1X running frequency (24.67 Hz) and 2X harmonic (49.33 Hz) indicate imminent raceway failure.',
    detectedAt: '2026-08-28 14:12:00',
    status: 'ACTIVE',
    affectedPaths: ['P-204', 'E-201', 'C-104'],
    recommendedAction: 'Trigger emergency containment protocol: schedule 48h shutdown, laser realignment, and NDE 6312 bearing replacement.'
  },
  {
    id: 'THR-2026-14',
    title: 'Downstream Vapor Knock-Out Liquid Carryover Risk',
    targetAssetId: 'C-104',
    severity: 'HIGH',
    confidence: 88.6,
    vector: 'Process interdependency: unbalance in P-204 bottoms loop alters temperature gradient to C-104 suction drum',
    mitreTechnique: 'T0855 - Unauthorized Process Parameter Deviation',
    detectionSource: 'Correlated Thermodynamic Model / Sovereign Inference',
    description: 'If P-204 experiences uncommanded trip, liquid hydrocarbon slugs will breach the vapor knock-out vessel, destroying C-104 compressor impellers.',
    detectedAt: '2026-08-28 14:15:20',
    status: 'ACTIVE',
    affectedPaths: ['P-204', 'C-104'],
    recommendedAction: 'Verify automated bypass valve V-19 interlock and preheat delta-T thresholds.'
  },
  {
    id: 'THR-2026-22',
    title: 'Out-of-Spec Modbus Register 40012 Polling Frequency',
    targetAssetId: 'SCADA-PLC-03',
    severity: 'MEDIUM',
    confidence: 91.0,
    vector: 'Unusual rapid cyclic polling of vibration transmitter register from engineering terminal 192.168.10.88',
    mitreTechnique: 'T0807 - Command and Control / Protocol Manipulation',
    detectionSource: 'VELIKY Protocol Watcher (Air-Gap Filter)',
    description: 'Engineering terminal polling frequency spiked from 1 Hz to 45 Hz on Modbus RTU telemetry register.',
    detectedAt: '2026-09-11 11:32:45',
    status: 'MITIGATING',
    affectedPaths: ['SCADA-PLC-03'],
    recommendedAction: 'Throttle SCADA polling bus rate and verify operator certificate.'
  },
  {
    id: 'THR-2026-31',
    title: 'Thermal Transfer Coefficient Degradation on E-201 Exchanger',
    targetAssetId: 'E-201',
    severity: 'LOW',
    confidence: 84.5,
    vector: 'Heavy slurry tube-side fouling causing localized delta-T resistance',
    mitreTechnique: 'T0815 - Degradation of Process Efficiency',
    detectionSource: 'Sovereign Spreadsheet Engine (pump_p204_vibration_history.csv correlation)',
    description: 'Heat transfer coefficient diminished by 4.2% over 60 operating days.',
    detectedAt: '2026-09-04 08:20:10',
    status: 'ACTIVE',
    affectedPaths: ['E-201'],
    recommendedAction: 'Schedule chemical wash at next scheduled turnaround.'
  }
]

export const INCIDENT_CASES: IncidentItem[] = [
  {
    id: 'INV-2026-001',
    title: 'Critical Vibration Exceedance & Thermal Anomaly on Pump P-204',
    targetAssetId: 'P-204',
    domain: 'Industrial Rotating Machinery / Refinery Unit 2',
    verdict: 'ATTENTION_REQUIRED',
    riskScore: 89,
    confidenceScore: 92.9,
    policyTier: 'REQUIRES_APPROVAL',
    status: 'WAITING_APPROVAL',
    createdAt: '2026-09-11T13:46:20.106748',
    operatorRole: 'analyst',
    executiveSummary: 'Vibration monitoring of centrifugal slurry pump P-204 indicates an elevated vibration condition on the Non-Drive End (NDE) bearing housing (5.4 mm/s RMS), entering ISO 10816-3 Zone C (Attention Required). Sandboxed calculation independently verified a 92.86% deviation above the commissioning baseline.',
    attackChain: [
      {
        step: 1,
        title: 'Preventive Maintenance Note (MR-184)',
        description: 'Quarterly greasing completed. Slight grease discoloration noted on NDE drain plug (Bearing 6312).',
        timestamp: '2026-06-12 10:14:00',
        status: 'detected'
      },
      {
        step: 2,
        title: 'Thermal & Harmonic Escalation',
        description: 'Vibration drifts from 3.2 mm/s to 4.4 mm/s. Temperature rises from 52°C to 62°C.',
        timestamp: '2026-08-15 09:30:00',
        status: 'detected'
      },
      {
        step: 3,
        title: 'ISO 10816-3 Zone C Breach (IR-62)',
        description: 'NDE vibration reaches 5.4 mm/s RMS (exceeding 4.5 mm/s Zone B ceiling). 1X (24.67 Hz) and 2X (49.33 Hz) spectral peaks confirm angular misalignment and outer raceway micro-spalling.',
        timestamp: '2026-08-28 14:12:00',
        status: 'propagating'
      },
      {
        step: 4,
        title: 'Sovereign Agent Orchestration & Verification',
        description: 'Multi-Model agent retrieved 3 internal sources, verified calculation in Docker sandbox (+92.86%), generated evidence dossier, and triggered approval gate.',
        timestamp: '2026-09-11 13:46:20',
        status: 'contained'
      }
    ],
    evidence: [
      {
        title: 'Vibration Inspection Report #62',
        documentName: 'Inspection-Report-62.md',
        pageNumber: 1,
        excerpt: 'Non-Drive End (NDE) bearing horizontal vibration reached 5.4 mm/s RMS. ISO 10816-3 Zone C Alert. Temperature reached 68°C.',
        timestamp: '2026-08-28',
        verified: true
      },
      {
        title: 'Preventive Maintenance Work Order #184',
        documentName: 'Maintenance-Report-184.md',
        pageNumber: 1,
        excerpt: 'Replenished 45g Mobil Polyrex EM. Slight grease discoloration noted on NDE drain plug. Baseline measured at 2.8 mm/s.',
        timestamp: '2026-06-12',
        verified: true
      },
      {
        title: 'Centrifugal Pump Maintenance Standard',
        documentName: 'SOP-Pump-Maintenance.md',
        pageNumber: 2,
        excerpt: 'Zone B limit: 4.5 mm/s. Zone C limit: 7.1 mm/s. For increases exceeding 50% over baseline, raise REQUIRES_APPROVAL intervention work order.',
        timestamp: '2025-01-01',
        verified: true
      }
    ],
    calculations: [
      {
        id: 'calc-01',
        formula: '((current_velocity - baseline_velocity) / baseline_velocity) * 100',
        claimedValue: '92.9 %',
        verifiedValue: '92.85714285714289 %',
        match: true,
        executedInSandbox: true,
        runtimeMs: 14.2
      }
    ],
    rootCauseAnalysis: 'Progressive mechanical fatigue and grease degradation causing micro-spalling on NDE 6312 outer raceway, exacerbated by angular shaft misalignment across flexible coupling.',
    recommendations: [
      'Perform controlled unit slowdown and laser realignment of pump-to-motor shafts.',
      'Replace Non-Drive End 6312 C3 ball bearing assembly and flush housing.',
      'Verify API Plan 53A barrier fluid pressure (currently nominal at 3.5 bar nitrogen precharge).',
      'Monitor downstream Compressor C-104 vapor knock-out drum to avoid liquid carryover surges.'
    ]
  },
  {
    id: 'INV-2026-002',
    title: 'Liquid Carryover Mitigation for Wet Gas Compressor C-104',
    targetAssetId: 'C-104',
    domain: 'Industrial Rotating Machinery / Unit 2 Light Ends',
    verdict: 'GUARDED',
    riskScore: 54,
    confidenceScore: 88.4,
    policyTier: 'AUTO_APPROVE',
    status: 'INVESTIGATING',
    createdAt: '2026-09-12T09:15:00.000000',
    operatorRole: 'engineer',
    executiveSummary: 'Downstream process risk model evaluated after P-204 vibration alert. Vapor knock-out drum TK-101 level remains stable at 74%, but automated interlock bypass valve V-19 has been put on active watch.',
    attackChain: [
      {
        step: 1,
        title: 'Process Coupling Alarm',
        description: 'Veliky correlation engine established dependency link between P-204 slurry loop and C-104 vapor intake.',
        timestamp: '2026-09-12 09:15:00',
        status: 'detected'
      }
    ],
    evidence: [
      {
        title: 'Compressor C-104 Master Record',
        documentName: 'Compressor-C104.md',
        pageNumber: 1,
        excerpt: 'Coupled to Unit 2 vapor circuit. If P-204 suffers unbalance or shutdown, reduced heat exchange causes liquid carryover risk.',
        timestamp: '2026-08-20',
        verified: true
      }
    ],
    calculations: [],
    rootCauseAnalysis: 'Process hydraulic interdependence with slurry loop.',
    recommendations: [
      'Maintain automated bypass valve V-19 in ready state.',
      'Verify C-104 baseline vibration at 1.8 mm/s.'
    ]
  }
]

export const REASONING_LEDGER_STEPS: ReasoningLedgerStep[] = [
  {
    stage: 'SEE',
    label: 'Multimodal Ingestion & Optical Analysis',
    detail: 'Ingested 200-page engineering PDF, scanned P&ID drawing (P204_Drawing.png), and CSV vibration telemetry without cloud egress.',
    durationMs: 420,
    status: 'completed',
    evidenceTag: 'Qwen-2.5-VL / OCR Engine'
  },
  {
    stage: 'UNDERSTAND',
    label: 'Semantic Entity & Context Decomposition',
    detail: 'Identified target entity P-204 (Centrifugal Slurry Pump), connected compressor C-104, surge drum TK-101, and matched ISO 10816-3 standard.',
    durationMs: 310,
    status: 'completed',
    evidenceTag: 'BGE-Large Vector RAG'
  },
  {
    stage: 'PLAN',
    label: 'Autonomous 8-Step Plan Formulation',
    detail: 'Constructed deterministic execution tree: 1. Search vault 2. Parse IR-62 3. Parse MR-184 4. Extract SOP limits 5. Run sandbox math 6. Check contradictions 7. Formulate dossier 8. Hash-chain audit.',
    durationMs: 250,
    status: 'completed',
    evidenceTag: 'Agent Orchestrator'
  },
  {
    stage: 'REASON',
    label: 'Cross-Correlation & Anomaly Synthesis',
    detail: 'Correlated January baseline (2.8 mm/s) vs August measurement (5.4 mm/s). Identified Zone C exceedance (+0.9 mm/s above 4.5 mm/s limit) and 68°C housing thermal spike.',
    durationMs: 840,
    status: 'completed',
    evidenceTag: 'Qwen-2.5-7B Reasoning Engine'
  },
  {
    stage: 'ACT',
    label: 'Sandboxed Python Math Execution',
    detail: 'Spawned isolated Docker container (zero network permissions). Executed: `((5.4 - 2.8) / 2.8) * 100`. Returned verified output: 92.85714285714289%.',
    durationMs: 180,
    status: 'completed',
    evidenceTag: 'Docker Isolated Sandbox'
  },
  {
    stage: 'VERIFY',
    label: 'Self-Verification & Contradiction Detection',
    detail: 'Cross-checked 3 independent internal records (IR-62, MR-184, SOP-PM-204). Contradiction score: 0.00. Mathematical match: 100%. Evidence tier: HIGH.',
    durationMs: 340,
    status: 'completed',
    evidenceTag: 'Verification Engine'
  },
  {
    stage: 'EXPLAIN',
    label: 'Evidence-Backed Dossier Generation',
    detail: 'Synthesized executive summary with strict page and line citations. Classified policy tier as REQUIRES_APPROVAL (exceeds 50% deviation threshold).',
    durationMs: 620,
    status: 'completed',
    evidenceTag: 'Dossier Synthesizer'
  },
  {
    stage: 'AUDIT',
    label: 'Immutable Merkle Hash-Chain Fsync',
    detail: 'Logged SHA-256 chained transaction `03a9f8...` into state/audit.jsonl. Identity: analyst · Clearance: Operator · Fsync complete.',
    durationMs: 95,
    status: 'completed',
    evidenceTag: 'Audit Log Chain'
  }
]

export const MODEL_REGISTRY: ModelCapability[] = [
  {
    id: 'deepseek-r1-7b',
    name: 'deepseek-ai/DeepSeek-R1-Distill-Qwen-7B',
    role: 'Reasoning',
    vramUsageGb: 4.8,
    maxVramGb: 6.0,
    activeContext: 'Chain-of-Thought Industrial Reliability & ISO 10816-3 (RTX 4050 Optimized)',
    accuracyScore: 99.4,
    status: 'ONLINE',
    onPremise: true
  },
  {
    id: 'qwen-vision',
    name: 'Qwen/Qwen2.5-VL-7B',
    role: 'Vision & P&ID',
    vramUsageGb: 7.1,
    maxVramGb: 8.0,
    activeContext: 'Engineering Drawings & Scanned Inspection Reports',
    accuracyScore: 96.1,
    status: 'ONLINE',
    onPremise: true
  },
  {
    id: 'qwen-coder',
    name: 'Qwen/Qwen2.5-Coder-7B',
    role: 'Code & Sandbox',
    vramUsageGb: 5.8,
    maxVramGb: 8.0,
    activeContext: 'Sandboxed Python Calculations & Mathematical Auditing',
    accuracyScore: 97.2,
    status: 'ONLINE',
    onPremise: true
  },
  {
    id: 'bge-embeddings',
    name: 'BAAI/bge-large-en-v1.5',
    role: 'Embedding & Vector',
    vramUsageGb: 1.2,
    maxVramGb: 2.0,
    activeContext: 'Permission-Aware Sovereign Knowledge Retrieval',
    accuracyScore: 99.1,
    status: 'ONLINE',
    onPremise: true
  }
]

export const AUDIT_LEDGER_RECORDS: AuditLedgerRecord[] = [
  {
    id: 'tx-8812',
    timestamp: '2026-09-14T17:28:31.102Z',
    investigationId: 'INV-2026-001',
    operatorRole: 'secops_lead',
    targetAsset: 'P-204',
    action: 'DISPATCH_INSPECTION_WORK_ORDER',
    verdict: 'ATTENTION_REQUIRED',
    sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    sourcesCount: 3,
    sandboxPassed: true
  },
  {
    id: 'tx-8811',
    timestamp: '2026-09-11T13:46:20.107Z',
    investigationId: 'INV-2026-001',
    operatorRole: 'analyst',
    targetAsset: 'P-204',
    action: 'EXECUTE_SOVEREIGN_REASONING_PIPELINE',
    verdict: 'ATTENTION_REQUIRED',
    sha256Hash: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    sourcesCount: 3,
    sandboxPassed: true
  },
  {
    id: 'tx-8810',
    timestamp: '2026-08-28T14:12:00.412Z',
    investigationId: 'INV-2026-062',
    operatorRole: 'operator',
    targetAsset: 'P-204',
    action: 'INGEST_INSPECTION_REPORT_62',
    verdict: 'ZONE_C_ALERT',
    sha256Hash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
    sourcesCount: 1,
    sandboxPassed: true
  }
]
