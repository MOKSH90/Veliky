---
equipment_id: "P-204"
name: "Centrifugal Slurry Pump P-204"
category: "Rotating Equipment"
unit: "Unit 2 Bottoms Transfer"
clearance_level: "operator"
criticality: "High"
connected_equipment:
  - "Compressor-C104"
  - "TK-101"
sops:
  - "SOP-Pump-Maintenance"
last_inspected: "2026-08-28"
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
- **Applicable Standard**: ISO 10816-3 Category 2 (Class II Industrial Machines with rigid foundation, 15 kW to 300 kW)

## Process Connectivity
- Suction Line: Drawn from Atmospheric Tower Bottoms Surge Drum [[TK-101]].
- Discharge Line: Supplies heavy residue to Feed Preheater Heat Exchanger E-201, which operates in tandem with [[Compressor-C104]] booster circuit.

## Related Documentation & History
- Standard Operating Procedure: [[SOP-Pump-Maintenance]]
- Latest Vibration Inspection: [[Inspection-Report-62]] (dated 2026-08-28)
- Last Maintenance Log: [[Maintenance-Report-184]] (dated 2026-06-12)