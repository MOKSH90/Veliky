import type { FileNode, ActivityItem, MemoryItem } from '../lib/types'

export const sentinelVaultTree: FileNode[] = [
  {
    name: 'Equipment',
    type: 'folder',
    path: 'Equipment',
    category: 'Equipment',
    children: [
      {
        name: 'Pump-P204.md',
        type: 'file',
        path: 'Equipment/Pump-P204.md',
        language: 'markdown',
        clearance: 'INTERNAL',
        trustLevel: 'source-document',
        timestamp: '2026-01-15T09:00:00Z',
        sha256: '9f2c8d88e0b19d42ac92c4314777d12f11ae88090510d9ce45bc493540dbef71',
        metadata: {
          equipment_id: 'P-204',
          name: 'Centrifugal Slurry Pump P-204',
          category: 'Rotating Equipment',
          unit: 'Unit 2 Bottoms Transfer',
          clearance_level: 'INTERNAL',
          trust_level: 'source-document',
          criticality: 'High',
          connected_equipment: ['Compressor-C104', 'SurgeDrum-TK101', 'HeatExchanger-E201'],
          sops: ['SOP-Pump-Maintenance'],
          last_inspected: '2026-08-28',
          timestamp: '2026-01-15T09:00:00Z'
        },
        content: `---
equipment_id: "P-204"
name: "Centrifugal Slurry Pump P-204"
category: "Rotating Equipment"
unit: "Unit 2 Bottoms Transfer"
clearance_level: "INTERNAL"
trust_level: "source-document"
criticality: "High"
connected_equipment:
  - "Compressor-C104"
  - "SurgeDrum-TK101"
  - "HeatExchanger-E201"
sops:
  - "SOP-Pump-Maintenance"
last_inspected: "2026-08-28"
timestamp: "2026-01-15T09:00:00Z"
---

# Pump P-204 — Equipment Master Record

## Overview
Pump P-204 is a high-head centrifugal slurry pump dedicated to Unit 2 vacuum distillation column bottoms circulation and transfer to the hydrocracker preheat train. 

## Technical Specifications
- **Equipment Tag**: P-204
- **Manufacturer**: Sulzer / Flowserve Model HPX-II
- **Driver**: Siemens 75 kW 3-Phase Induction Motor, 415 V, 50 Hz
- **Rated Operating Speed**: 1480 RPM (Nominal 1X running frequency = 24.67 Hz)
- **Impeller Type**: Enclosed 5-vane stainless steel (SS316L)
- **Drive End (DE) Bearing**: 6314 C3 Deep Groove Ball Bearing (Grease lubricated)
- **Non-Drive End (NDE) Bearing**: 6312 C3 Deep Groove Ball Bearing (Grease lubricated)
- **Mechanical Seal**: Dual pressurized cartridge seal with API Plan 53A barrier fluid reservoir (operating at 3.5 bar nitrogen overpressure)
- **Applicable Standard**: [[SOP-Pump-Maintenance]] (ISO 10816-3 Category 2: Rigid foundation, 15 kW to 300 kW)

## Process Connectivity & Risk Propagation
- Suction Line: Drawn from Atmospheric Tower Bottoms Surge Drum [[SurgeDrum-TK101]].
- Discharge Line: Supplies heavy residue to Feed Preheater Heat Exchanger [[HeatExchanger-E201]], which operates in tandem with [[Compressor-C104]] booster circuit.
- **Interlock Notice**: Tripping Pump P-204 necessitates load reduction on [[Compressor-C104]] to prevent compressor surge.

## Related Documentation & History
- Standard Operating Procedure: [[SOP-Pump-Maintenance]]
- Emergency Isolation Procedure: [[SOP-Emergency-Isolation]]
- Latest Vibration Inspection: [[Inspection-Report-62]] (dated 2026-08-28)
- Last Maintenance Log: [[Maintenance-Report-184]] (dated 2026-06-12)
- Assigned Engineer: [[Employee-Rakesh]]
- Active Incident Case: [[P-204_INV-2026-001]]
`
      },
      {
        name: 'Compressor-C104.md',
        type: 'file',
        path: 'Equipment/Compressor-C104.md',
        language: 'markdown',
        clearance: 'INTERNAL',
        trustLevel: 'source-document',
        timestamp: '2026-01-15T09:00:00Z',
        sha256: '8e71b2d198ca6e28ad101188319bafe32c8172901a9df28091aa465b09ee8109',
        metadata: {
          equipment_id: 'C-104',
          name: 'Hydrocracker Recycle Gas Booster Compressor C-104',
          category: 'Rotating Equipment',
          unit: 'Unit 2 Hydrocracker Booster Train',
          clearance_level: 'INTERNAL',
          trust_level: 'source-document',
          criticality: 'Critical',
          connected_equipment: ['Pump-P204', 'HeatExchanger-E201'],
          sops: ['SOP-Pump-Maintenance'],
          timestamp: '2026-01-15T09:00:00Z'
        },
        content: `---
equipment_id: "C-104"
name: "Gas Booster Compressor C-104"
category: "Rotating Equipment"
unit: "Unit 2 Hydrocracker Booster Train"
clearance_level: "INTERNAL"
trust_level: "source-document"
criticality: "Critical"
connected_equipment:
  - "Pump-P204"
  - "HeatExchanger-E201"
sops:
  - "SOP-Pump-Maintenance"
last_inspected: "2026-08-28"
timestamp: "2026-01-15T09:00:00Z"
---

# Compressor C-104 — Equipment Master Record

## Overview
Recycle gas booster centrifugal compressor C-104 delivers hydrogen-rich make-up gas to the hydrocracking reactor loop. Operates in thermal integration with [[HeatExchanger-E201]] and hydraulic cascade with [[Pump-P204]].

## Operational Parameters
- **Driver**: 250 kW ABB Variable Frequency Inverter Motor
- **Design Vibration**: 2.1 mm/s RMS (Well within Zone A)
- **Current Vibration**: 2.2 mm/s RMS (Nominal / Stable)
- **Correlated Risk**: Connected downstream to the effluent line preheated by [[Pump-P204]]. Any sudden thermal loss or cavitation in P-204 causes pressure swings in C-104.
`
      },
      {
        name: 'HeatExchanger-E201.md',
        type: 'file',
        path: 'Equipment/HeatExchanger-E201.md',
        language: 'markdown',
        clearance: 'INTERNAL',
        trustLevel: 'source-document',
        timestamp: '2026-01-15T09:00:00Z',
        sha256: '4190c108aefb2049182390ba03810f13348f9801817e018a101b09230af9001b',
        metadata: {
          equipment_id: 'E-201',
          name: 'Feed Preheater Heat Exchanger E-201',
          category: 'Static Equipment',
          unit: 'Unit 2 Preheating Train',
          clearance_level: 'INTERNAL',
          trust_level: 'source-document',
          timestamp: '2026-01-15T09:00:00Z'
        },
        content: `---
equipment_id: "E-201"
name: "Feed Preheater Heat Exchanger E-201"
category: "Static Equipment"
unit: "Unit 2 Preheating Train"
clearance_level: "INTERNAL"
trust_level: "source-document"
connected_equipment:
  - "Pump-P204"
  - "Compressor-C104"
timestamp: "2026-01-15T09:00:00Z"
---

# Heat Exchanger E-201 — Master Record

TEMA Type AES shell-and-tube exchanger. Receives heavy bottoms residue from [[Pump-P204]] on tube side and hot reactor effluent from [[Compressor-C104]] circuit on shell side.
`
      },
      {
        name: 'SurgeDrum-TK101.md',
        type: 'file',
        path: 'Equipment/SurgeDrum-TK101.md',
        language: 'markdown',
        clearance: 'INTERNAL',
        trustLevel: 'source-document',
        timestamp: '2026-01-15T09:00:00Z',
        sha256: '38190fa187cba1029e018b10938174092b10948ac019283fa0181938b0918301',
        metadata: {
          equipment_id: 'TK-101',
          name: 'Atmospheric Tower Bottoms Surge Drum TK-101',
          category: 'Vessels & Drums',
          clearance_level: 'INTERNAL',
          trust_level: 'source-document',
          timestamp: '2026-01-15T09:00:00Z'
        },
        content: `---
equipment_id: "TK-101"
name: "Atmospheric Tower Bottoms Surge Drum TK-101"
category: "Vessels & Drums"
clearance_level: "INTERNAL"
trust_level: "source-document"
connected_equipment:
  - "Pump-P204"
timestamp: "2026-01-15T09:00:00Z"
---

# Surge Drum TK-101 — Master Record

Atmospheric Tower Bottoms surge vessel maintaining 4.2 meters hydrostatic liquid level feed buffer to [[Pump-P204]].
`
      }
    ]
  },
  {
    name: 'SOPs',
    type: 'folder',
    path: 'SOPs',
    category: 'SOPs',
    children: [
      {
        name: 'SOP-Pump-Maintenance.md',
        type: 'file',
        path: 'SOPs/SOP-Pump-Maintenance.md',
        language: 'markdown',
        clearance: 'INTERNAL',
        trustLevel: 'source-document',
        timestamp: '2026-02-01T10:00:00Z',
        sha256: '721ba8019bca021948ac01827b01938fa0192837b018293746a0182746b01827',
        metadata: {
          sop_id: 'SOP-ROT-042',
          title: 'Standard Operating Procedure: Centrifugal Pump Vibration & Maintenance',
          clearance_level: 'INTERNAL',
          trust_level: 'source-document',
          applicable_standard: 'ISO 10816-3',
          timestamp: '2026-02-01T10:00:00Z'
        },
        content: `---
sop_id: "SOP-ROT-042"
title: "Standard Operating Procedure: Centrifugal Pump Vibration & Maintenance"
category: "Maintenance Standard"
clearance_level: "INTERNAL"
trust_level: "source-document"
applicable_standard: "ISO 10816-3 Category 2"
timestamp: "2026-02-01T10:00:00Z"
---

# SOP-Pump-Maintenance — Vibration Severity & Maintenance Criteria

## 1. Scope & Standard Classification
Governs condition assessment and emergency responses for rotating equipment including [[Pump-P204]] and auxiliary pumps per **ISO 10816-3 (Class II, 15 kW to 300 kW, Rigid Foundation)**.

## 2. Quantitative Vibration Severity Thresholds
| Velocity Range (RMS) | ISO 10816-3 Zone | Operational Classification | Required Action |
| :--- | :--- | :--- | :--- |
| **0.0 – 2.3 mm/s** | **Zone A** | Newly Commissioned | Baseline verification; nominal continuous service. |
| **2.3 – 4.5 mm/s** | **Zone B** | Acceptable / Satisfactory | Unrestricted long-term industrial service. |
| **4.5 – 7.1 mm/s** | **Zone C** | **Attention Required (Alert)** | Plan maintenance; investigate cause within 7 calendar days. |
| **> 7.1 mm/s** | **Zone D** | **Danger / Trip Level** | Immediate emergency trip and shutdown to avoid catastrophic failure. |

## 3. Mandatory Engineering Rules
- Any measurement crossing into **Zone C (>4.5 mm/s)** mandates logging a priority maintenance ticket and root-cause analysis by [[Employee-Rakesh]].
- Percentage deviation greater than **50% over baseline** triggers mandatory laser shaft realignment check.
- If vibration reaches **7.1 mm/s (Zone D)**, initiate immediate isolation under [[SOP-Emergency-Isolation]].
`
      },
      {
        name: 'SOP-Emergency-Isolation.md',
        type: 'file',
        path: 'SOPs/SOP-Emergency-Isolation.md',
        language: 'markdown',
        clearance: 'RESTRICTED',
        trustLevel: 'source-document',
        timestamp: '2026-02-15T11:00:00Z',
        sha256: '99018abfc0192847a01928374b01928374a01928471b01928374a01928471b01',
        metadata: {
          sop_id: 'SOP-HSE-901',
          title: 'High-Hazard Unit 2 Emergency Isolation & LOTO Procedure',
          clearance_level: 'RESTRICTED',
          trust_level: 'source-document',
          timestamp: '2026-02-15T11:00:00Z'
        },
        content: `---
sop_id: "SOP-HSE-901"
title: "High-Hazard Unit 2 Emergency Isolation & LOTO Procedure"
category: "Safety & Emergency Procedure"
clearance_level: "RESTRICTED"
trust_level: "source-document"
authorized_roles:
  - "admin"
  - "manager"
timestamp: "2026-02-15T11:00:00Z"
---

# SOP-Emergency-Isolation — Unit 2 Bottoms & Rotating Assets

> [!CAUTION]
> **RESTRICTED ACCESS LEVEL 6**: This protocol details electrical trip breakers, isolation blind locations, and emergency hydrocarbon depressuring valves for [[Pump-P204]]. Unauthorized execution is strictly forbidden under OSHA 1910.147 and Indian Petroleum Safety Regulations.

## Emergency Shutdown Sequence
1. Operator trips local manual breaker 415V-SWGR-U2-P204.
2. Close pneumatic suction isolation valve MOV-2041 within 45 seconds to isolate from [[SurgeDrum-TK101]].
3. Operations Manager [[Manager-Sharma]] must countersign the lock-out tag-out manifest.
`
      }
    ]
  },
  {
    name: 'Reports',
    type: 'folder',
    path: 'Reports',
    category: 'Reports',
    children: [
      {
        name: 'Inspection-Report-62.md',
        type: 'file',
        path: 'Reports/Inspection-Report-62.md',
        language: 'markdown',
        clearance: 'CONFIDENTIAL',
        trustLevel: 'source-document',
        timestamp: '2026-08-28T14:30:00Z',
        sha256: '5a4190c108aefb2049182390ba03810f13348f9801817e018a101b09230af900',
        metadata: {
          report_id: 'IR-2026-062',
          title: 'Vibration Condition Monitoring & Inspection Report #62',
          equipment_id: 'P-204',
          inspection_date: '2026-08-28',
          inspector: 'Rakesh Patel (Level II Vibration Analyst)',
          clearance_level: 'CONFIDENTIAL',
          trust_level: 'source-document',
          status: 'Attention Required',
          timestamp: '2026-08-28T14:30:00Z'
        },
        content: `---
report_id: "IR-2026-062"
title: "Vibration Condition Monitoring & Inspection Report #62"
equipment_id: "P-204"
inspection_date: "2026-08-28"
inspector: "Rakesh Patel (Level II Vibration Analyst)"
clearance_level: "CONFIDENTIAL"
trust_level: "source-document"
status: "Attention Required"
timestamp: "2026-08-28T14:30:00Z"
---

# Vibration Inspection Report #62 — Pump P-204

## 1. Executive Summary
Vibration analysis of [[Pump-P204]] conducted on 2026-08-28 during normal unit operation at 1480 RPM indicates an elevated vibration condition on the Non-Drive End (NDE) bearing housing. The vibration has entered **ISO 10816-3 Zone C (Attention Required)**.

## 2. Measurement Data
- **Operating Speed**: 1480 RPM (1X Running Frequency = 24.67 Hz)
- **Drive End (DE) Bearing Vibration**: 2.9 mm/s RMS (Horizontal) — Normal (Zone B)
- **Non-Drive End (NDE) Bearing Vibration**: 5.4 mm/s RMS (Horizontal) — **Zone C Alert**
- **Non-Drive End (NDE) Axial Vibration**: 3.1 mm/s RMS
- **Baseline Measurement (Commissioning 2026-01-15)**: 2.8 mm/s RMS
- **NDE Bearing Housing Temperature**: 68 °C (Approaching 70 °C warning threshold)
- **DE Bearing Housing Temperature**: 52 °C (Normal)
- **Seal Plan 53A Barrier Pressure**: 3.5 bar (Stable)

## 3. Spectral Findings & Observations
- Strong spectral peak at 1X running frequency (24.67 Hz) measuring 4.1 mm/s peak amplitude on the NDE bearing.
- Substantial 2X harmonic (49.33 Hz) measuring 2.3 mm/s, indicating angular shaft misalignment across the flexible coupling or dynamic unbalance.
- Ultrasonic acoustic emission indicates early-stage micro-spalling on the 6312 NDE outer raceway.
- Baseline measurement was 2.8 mm/s RMS; current measurement is 5.4 mm/s RMS.

## 4. Analyst Recommendation
Attention is immediately required per [[SOP-Pump-Maintenance]]. The current measurement represents a 92.9% increase over baseline (exceeding the 4.5 mm/s Zone B threshold by 0.9 mm/s). Plan a controlled shutdown to perform laser realignment and inspect the 6312 NDE bearing before condition escalates to Zone D (>7.1 mm/s). Work order assigned to [[Employee-Rakesh]]; logged as [[Ticket-4471]].
`
      },
      {
        name: 'Maintenance-Report-184.md',
        type: 'file',
        path: 'Reports/Maintenance-Report-184.md',
        language: 'markdown',
        clearance: 'CONFIDENTIAL',
        trustLevel: 'source-document',
        timestamp: '2026-06-12T16:00:00Z',
        sha256: '31908abfc0192847a01928374b01928374a01928471b01928374a01928471b01',
        metadata: {
          report_id: 'MR-2026-184',
          title: 'Scheduled Mechanical Seal Overhaul & Coupling Service Log #184',
          equipment_id: 'P-204',
          maintenance_date: '2026-06-12',
          lead_technician: 'Rakesh Patel',
          clearance_level: 'CONFIDENTIAL',
          trust_level: 'source-document',
          timestamp: '2026-06-12T16:00:00Z'
        },
        content: `---
report_id: "MR-2026-184"
title: "Mechanical Seal Overhaul & Coupling Service Log #184"
equipment_id: "P-204"
maintenance_date: "2026-06-12"
lead_technician: "Rakesh Patel"
clearance_level: "CONFIDENTIAL"
trust_level: "source-document"
status: "Completed"
timestamp: "2026-06-12T16:00:00Z"
---

# Maintenance Report #184 — Pump P-204 Overhaul

Conducted dual cartridge mechanical seal Plan 53A barrier fluid flush and elastomer O-ring replacements on [[Pump-P204]]. Coupling hubs aligned using dial indicators to within 0.04 mm runout. Post-repair vibration checked at 3.0 mm/s RMS (Zone B satisfactory).
`
      }
    ]
  },
  {
    name: 'People',
    type: 'folder',
    path: 'People',
    category: 'People',
    children: [
      {
        name: 'Employee-Rakesh.md',
        type: 'file',
        path: 'People/Employee-Rakesh.md',
        language: 'markdown',
        clearance: 'INTERNAL',
        trustLevel: 'human-asserted',
        timestamp: '2026-01-01T00:00:00Z',
        sha256: '1190c108aefb2049182390ba03810f13348f9801817e018a101b09230af900aa',
        metadata: {
          employee_id: 'EMP-042',
          name: 'Rakesh Patel',
          role: 'engineer',
          clearance_level: 'CONFIDENTIAL',
          trust_level: 'human-asserted',
          reports_to: 'Manager-Sharma',
          timestamp: '2026-01-01T00:00:00Z'
        },
        content: `---
employee_id: "EMP-042"
name: "Rakesh Patel"
role: "Senior Reliability & Vibration Engineer"
clearance_level: "INTERNAL"
trust_level: "human-asserted"
reports_to: "Manager-Sharma"
assigned_assets:
  - "Pump-P204"
  - "Compressor-C104"
timestamp: "2026-01-01T00:00:00Z"
---

# Rakesh Patel — Senior Reliability Engineer

- **Employee ID**: EMP-042
- **Certification**: ISO 18436-2 Category III Vibration Specialist
- **Direct Supervisor**: [[Manager-Sharma]]
- **Primary Asset Focus**: [[Pump-P204]], [[Compressor-C104]]
- **Authored Records**: [[Inspection-Report-62]], [[Maintenance-Report-184]]
- **Resolved Tickets**: Solved [[Ticket-4471]]
`
      },
      {
        name: 'Manager-Sharma.md',
        type: 'file',
        path: 'People/Manager-Sharma.md',
        language: 'markdown',
        clearance: 'CONFIDENTIAL',
        trustLevel: 'human-asserted',
        timestamp: '2026-01-01T00:00:00Z',
        sha256: '2290c108aefb2049182390ba03810f13348f9801817e018a101b09230af900bb',
        metadata: {
          employee_id: 'EMP-001',
          name: 'Dr. Rajesh Sharma',
          role: 'admin',
          clearance_level: 'RESTRICTED',
          trust_level: 'human-asserted',
          reports_to: 'Director-Verma',
          timestamp: '2026-01-01T00:00:00Z'
        },
        content: `---
employee_id: "EMP-001"
name: "Dr. Rajesh Sharma"
role: "Chief Plant Reliability Director & System Admin"
clearance_level: "CONFIDENTIAL"
trust_level: "human-asserted"
reports_to: "Director-Verma"
direct_reports:
  - "Employee-Rakesh"
  - "Investigator-Priya"
timestamp: "2026-01-01T00:00:00Z"
---

# Dr. Rajesh Sharma — Chief Reliability Director

- **Employee ID**: EMP-001
- **Clearance**: RESTRICTED Level 6
- **Supervises**: [[Employee-Rakesh]], [[Investigator-Priya]]
- **Reports To**: [[Director-Verma]]
- **Authority**: Approval authority for write actions, emergency shutdown [[SOP-Emergency-Isolation]], and investigation sign-off on [[P-204_INV-2026-001]].
`
      },
      {
        name: 'Investigator-Priya.md',
        type: 'file',
        path: 'People/Investigator-Priya.md',
        language: 'markdown',
        clearance: 'CONFIDENTIAL',
        trustLevel: 'human-asserted',
        timestamp: '2026-01-01T00:00:00Z',
        sha256: '3390c108aefb2049182390ba03810f13348f9801817e018a101b09230af900cc',
        metadata: {
          employee_id: 'EMP-088',
          name: 'Priya Nair',
          role: 'investigator',
          clearance_level: 'CONFIDENTIAL',
          trust_level: 'human-asserted',
          reports_to: 'Manager-Sharma',
          timestamp: '2026-01-01T00:00:00Z'
        },
        content: `---
employee_id: "EMP-088"
name: "Priya Nair"
role: "HSE Safety & Process Incident Investigator"
clearance_level: "CONFIDENTIAL"
trust_level: "human-asserted"
reports_to: "Manager-Sharma"
assigned_investigations:
  - "P-204_INV-2026-001"
timestamp: "2026-01-01T00:00:00Z"
---

# Priya Nair — Safety & Incident Investigator

Lead investigator on high-priority anomalies. Conducts root cause analysis and evidence cross-referencing on [[P-204_INV-2026-001]].
`
      },
      {
        name: 'Director-Verma.md',
        type: 'file',
        path: 'People/Director-Verma.md',
        language: 'markdown',
        clearance: 'RESTRICTED',
        trustLevel: 'human-asserted',
        timestamp: '2026-01-01T00:00:00Z',
        sha256: '4490c108aefb2049182390ba03810f13348f9801817e018a101b09230af900dd',
        metadata: {
          employee_id: 'EMP-000',
          name: 'Suresh Verma',
          role: 'executive',
          clearance_level: 'RESTRICTED',
          trust_level: 'human-asserted',
          timestamp: '2026-01-01T00:00:00Z'
        },
        content: `---
employee_id: "EMP-000"
name: "Suresh Verma"
role: "Executive VP of Refining Operations"
clearance_level: "RESTRICTED"
trust_level: "human-asserted"
oversees:
  - "Manager-Sharma"
timestamp: "2026-01-01T00:00:00Z"
---

# Suresh Verma — Executive VP of Refining Operations

Top of the organizational accountability hierarchy. Reviews macro plant availability and recurring reliability risks across all operating units.
`
      }
    ]
  },
  {
    name: 'Tickets',
    type: 'folder',
    path: 'Tickets',
    category: 'Tickets',
    children: [
      {
        name: 'Ticket-4471.md',
        type: 'file',
        path: 'Tickets/Ticket-4471.md',
        language: 'markdown',
        clearance: 'CONFIDENTIAL',
        trustLevel: 'human-asserted',
        timestamp: '2026-08-29T08:15:00Z',
        sha256: '5590c108aefb2049182390ba03810f13348f9801817e018a101b09230af900ee',
        metadata: {
          ticket_id: 'TKT-4471',
          title: 'Corrective Maintenance: P-204 NDE Bearing Misalignment & Spalling',
          equipment_id: 'P-204',
          assigned_to: 'Employee-Rakesh',
          supervisor: 'Manager-Sharma',
          clearance_level: 'CONFIDENTIAL',
          trust_level: 'human-asserted',
          status: 'In-Progress',
          timestamp: '2026-08-29T08:15:00Z'
        },
        content: `---
ticket_id: "TKT-4471"
title: "Corrective Maintenance: P-204 NDE Bearing Misalignment & Spalling"
equipment_id: "P-204"
assigned_to: "Employee-Rakesh"
supervisor: "Manager-Sharma"
clearance_level: "CONFIDENTIAL"
trust_level: "human-asserted"
status: "In-Progress"
timestamp: "2026-08-29T08:15:00Z"
---

# Work Order Ticket #4471

- **Target Equipment**: [[Pump-P204]]
- **Trigger**: [[Inspection-Report-62]] finding of 5.4 mm/s RMS vibration (ISO Zone C).
- **Assigned Technician**: [[Employee-Rakesh]]
- **Supervisor Sign-off**: [[Manager-Sharma]]
- **Required Action**: Laser shaft realignment, replacement of 6312 NDE deep groove ball bearing, lubrication check per [[SOP-Pump-Maintenance]].
`
      }
    ]
  },
  {
    name: 'Investigations',
    type: 'folder',
    path: 'Investigations',
    category: 'Investigations',
    children: [
      {
        name: 'P-204_INV-2026-001.md',
        type: 'file',
        path: 'Investigations/P-204_INV-2026-001.md',
        language: 'markdown',
        clearance: 'CONFIDENTIAL',
        trustLevel: 'verified-by-tool',
        timestamp: '2026-09-11T13:46:20Z',
        sha256: '6690c108aefb2049182390ba03810f13348f9801817e018a101b09230af900ff',
        metadata: {
          investigation_id: 'INV-2026-001',
          target_entity: 'P-204',
          domain: 'industrial',
          verdict: 'ATTENTION_REQUIRED',
          confidence_score: 0.929,
          policy_tier: 'REQUIRES_APPROVAL',
          clearance_level: 'CONFIDENTIAL',
          trust_level: 'verified-by-tool',
          timestamp: '2026-09-11T13:46:20Z'
        },
        content: `---
investigation_id: "INV-2026-001"
target_entity: "P-204"
domain: "industrial"
verdict: "ATTENTION_REQUIRED"
confidence_score: 0.929
policy_tier: "REQUIRES_APPROVAL"
clearance_level: "CONFIDENTIAL"
trust_level: "verified-by-tool"
timestamp: "2026-09-11T13:46:20Z"
---

# Enterprise Investigation: Pump P-204 Vibration Anomaly
**Case ID**: \`INV-2026-001\` | **Verdict**: \`ATTENTION_REQUIRED\` | **Confidence**: \`92.9%\`

## 1. Executive Summary
The current vibration condition of [[Pump-P204]] has surged by **+92.86%** relative to the commissioning baseline, entering **ISO 10816-3 Zone C (Attention Required)**. An independent 4-tier verification was executed and confirmed by tool.

## 2. Key Evidence & Source Citations
- **Current Measurement**: \`5.4 mm/s RMS\` (Source: [[Inspection-Report-62]], Section 2)
  > Non-Drive End (NDE) Bearing Vibration: 5.4 mm/s RMS (Horizontal) — Zone C Alert
- **Commissioning Baseline**: \`2.8 mm/s RMS\` (Source: [[Inspection-Report-62]], Section 2)
  > Baseline Measurement (Commissioning 2026-01-15): 2.8 mm/s RMS
- **Applicable Threshold**: \`4.5 mm/s RMS\` (Source: [[SOP-Pump-Maintenance]], Section 2)
  > Zone C: 4.5 – 7.1 mm/s | Attention Required (Alert)

## 3. Sandboxed Calculations (Independently Verified)
- **Calculation**: Percentage Drift from Commissioning Baseline
  - Formula: \`((current - baseline) / baseline) * 100\`
  - Operands: \`current = 5.4\`, \`baseline = 2.8\`
  - Claimed Result: \`92.86 %\` | Sandboxed Python Verification: \`92.85714285714289 %\` [VERIFIED MATCH]
- **Calculation**: Exceedance over Zone B Boundary (4.5 mm/s)
  - Result: \`+0.90 mm/s\` above acceptable limit [VERIFIED MATCH]

## 4. Root Cause & Graph Risk Propagation
- Spectral 1X (4.1 mm/s) and 2X (2.3 mm/s) harmonics indicate angular coupling misalignment.
- Acoustic ultrasonic emission indicates early-stage micro-spalling on 6312 NDE bearing race.
- Connected downstream unit [[Compressor-C104]] is currently stable at 2.2 mm/s, but requires proactive monitoring to prevent cascade trips.

## 5. Actionable Recommendations
1. Approve [[Ticket-4471]] to schedule a 4-hour maintenance window for [[Employee-Rakesh]].
2. Perform laser shaft realignment and replace NDE bearing 6312 C3.
3. If vibration reaches 7.1 mm/s prior to shutdown, immediately invoke [[SOP-Emergency-Isolation]].
`
      }
    ]
  },
  {
    name: 'Agent-Generated',
    type: 'folder',
    path: 'Agent-Generated',
    category: 'Agent-Generated',
    children: [
      {
        name: 'P204-Vibration-Analysis-2026-09-03.md',
        type: 'file',
        path: 'Agent-Generated/P204-Vibration-Analysis-2026-09-03.md',
        language: 'markdown',
        clearance: 'CONFIDENTIAL',
        trustLevel: 'ai-inferred',
        timestamp: '2026-09-03T18:22:00Z',
        sha256: '7790c108aefb2049182390ba03810f13348f9801817e018a101b09230af90000',
        metadata: {
          generation_type: 'Proactive Sensor Watcher Auto-Dispatch',
          target_asset: 'P-204',
          clearance_level: 'CONFIDENTIAL',
          trust_level: 'ai-inferred',
          timestamp: '2026-09-03T18:22:00Z'
        },
        content: `---
generation_type: "Proactive Sensor Watcher Auto-Dispatch"
target_asset: "P-204"
clearance_level: "CONFIDENTIAL"
trust_level: "ai-inferred"
timestamp: "2026-09-03T18:22:00Z"
---

# Autonomous Telemetry Alert: P-204 Drift Notice

Generated automatically by the background sensor watcher (SENTINEL Differentiator 7.4). Sensor historian telemetry crossed the 4.5 mm/s rolling average threshold. Linked notes inspected: [[Pump-P204]], [[Inspection-Report-62]], [[SOP-Pump-Maintenance]]. Prompted formal case creation for [[P-204_INV-2026-001]].
`
      }
    ]
  },
  {
    name: 'AuditLogs',
    type: 'folder',
    path: 'AuditLogs',
    category: 'AuditLogs',
    children: [
      {
        name: 'audit_trail.jsonl',
        type: 'file',
        path: 'AuditLogs/audit_trail.jsonl',
        language: 'text',
        clearance: 'RESTRICTED',
        trustLevel: 'verified-by-tool',
        timestamp: '2026-09-14T12:00:00Z',
        sha256: '8890c108aefb2049182390ba03810f13348f9801817e018a101b09230af90011',
        metadata: {
          log_type: 'Cryptographic Hash-Chained Audit Ledger',
          clearance_level: 'RESTRICTED',
          trust_level: 'verified-by-tool',
          timestamp: '2026-09-14T12:00:00Z'
        },
        content: `{"event_id":"ev_001","timestamp":"2026-09-11T13:45:00Z","user":"r.patel","action":"TOOL_EXECUTE","tool":"search_documents","params":{"query":"Pump-P204 vibration"},"prev_hash":"0000000000000000000000000000000000000000000000000000000000000000","hash":"a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0"}
{"event_id":"ev_002","timestamp":"2026-09-11T13:45:30Z","user":"r.patel","action":"TOOL_EXECUTE","tool":"calculate_metric","params":{"formula":"(5.4-2.8)/2.8*100"},"prev_hash":"a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0","hash":"b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef01"}
{"event_id":"ev_003","timestamp":"2026-09-11T13:46:20Z","user":"r.sharma","action":"POLICY_APPROVAL","target":"Investigations/P-204_INV-2026-001.md","status":"APPROVED","prev_hash":"b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef01","hash":"c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef012"}
`
      }
    ]
  }
]

export const sentinelVaultMemories: MemoryItem[] = [
  { id: 'm1', scope: 'Working', title: 'P-204 Vibration Investigation active', subtitle: 'Refinery Unit 2 Rotating Equipment', stored: 'Active Session', clearance: 'CONFIDENTIAL' },
  { id: 'm2', scope: 'Long-Term', title: 'ISO 10816-3 Category 2 Zone C alert threshold is 4.5 mm/s RMS', subtitle: 'SOPs/SOP-Pump-Maintenance.md', stored: 'Permanent', clearance: 'INTERNAL' },
  { id: 'm3', scope: 'Knowledge', title: 'Pump P-204 baseline vibration is 2.8 mm/s RMS (Commissioning 2026-01-15)', subtitle: 'Equipment/Pump-P204.md', stored: 'Permanent', clearance: 'INTERNAL' },
  { id: 'm4', scope: 'Long-Term', title: 'Compressor C-104 operates in thermal and cascade integration with P-204', subtitle: 'Equipment/Compressor-C104.md', stored: 'Permanent', clearance: 'INTERNAL' },
  { id: 'm5', scope: 'Knowledge', title: 'Emergency isolation protocol requires Supervisor countersign', subtitle: 'SOPs/SOP-Emergency-Isolation.md', stored: 'Permanent', clearance: 'RESTRICTED' },
]

export const sentinelVaultActivities: ActivityItem[] = [
  { id: 'a1', time: '13:46', title: 'Investigation Note Published', status: 'Verified', detail: 'INV-2026-001 evidence verified against Inspection-Report-62 & SOP-Pump-Maintenance', tool: 'verify_evidence()', verification: 'PASSED', started: '13:46:01', finished: '13:46:20', operator: 'Rakesh Patel', clearance: 'CONFIDENTIAL' },
  { id: 'a2', time: '13:45', title: 'Sandboxed Metric Calculation', status: 'Verified', detail: 'Formula ((5.4 - 2.8) / 2.8) * 100 evaluated in Python sandbox = 92.86%', tool: 'calculate_metric()', verification: 'PASSED', started: '13:45:22', finished: '13:45:25', operator: 'Rakesh Patel', clearance: 'INTERNAL' },
  { id: 'a3', time: '13:44', title: 'Knowledge Vault Hybrid Search', status: 'Completed', detail: 'Retrieved 4 evidence documents for entity P-204 vibration condition', tool: 'search_documents()', verification: 'N/A', started: '13:44:10', finished: '13:44:14', operator: 'Rakesh Patel', clearance: 'INTERNAL' },
  { id: 'a4', time: '12:10', title: 'Proactive Sensor Watcher Alert', status: 'Approved', detail: 'Historian telemetry crossed 4.5 mm/s alert threshold; dispatched investigation', tool: 'sensor_watcher_daemon', verification: 'PASSED', started: '12:10:00', finished: '12:10:08', operator: 'System Daemon', clearance: 'CONFIDENTIAL' },
]
