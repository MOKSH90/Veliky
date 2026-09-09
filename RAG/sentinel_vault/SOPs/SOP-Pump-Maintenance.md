---
sop_id: "SOP-PM-204"
title: "Standard Operating Procedure — Centrifugal Pump Vibration & Maintenance"
category: "Maintenance SOP"
clearance_level: "operator"
applicable_standard: "ISO 10816-3 (Category 2, Class II)"
effective_date: "2025-01-01"
---

# SOP-PM-204: Centrifugal Pump Vibration & Preventive Maintenance

## 1. Scope & Standard Reference
This SOP governs condition monitoring and mechanical intervention for medium-to-large industrial centrifugal pumps (15 kW to 300 kW), including [[Pump-P204]]. Evaluations are benchmarked against ISO 10816-3 Category 2 (Rigid Support).

## 2. Vibration Severity Limits (Overall Velocity RMS: 10 Hz – 1000 Hz)
| Zone | RMS Velocity Range (mm/s) | Operational Status | Mandatory Action |
|---|---|---|---|
| Zone A | < 2.3 mm/s | Newly commissioned | Normal unrestricted operation. Record baseline. |
| Zone B | 2.3 mm/s – 4.5 mm/s | Acceptable operation | Long-term unrestricted continuous operation. Routine monitoring. |
| Zone C | 4.5 mm/s – 7.1 mm/s | Attention Required | Restricted continuous operation. Perform spectral diagnostic within 48 hours. Schedule inspection. |
| Zone D | > 7.1 mm/s | Danger / Trip Level | Immediate shutdown / emergency trip. Prevent catastrophic bearing failure. |

## 3. Temperature Limits
- Normal Operating Bearing Temperature: 45 °C to 65 °C
- Warning Threshold: 70 °C
- Maximum Allowable / Trip Threshold: 80 °C

## 4. Diagnostic & Intervention Protocol for Zone C Alerts
1. Verify Non-Drive End (NDE) and Drive End (DE) vibration spectra.
2. If 1X running speed frequency (24.67 Hz at 1480 RPM) dominates, inspect for mechanical unbalance, impeller fouling, or coupling misalignment.
3. If high-frequency harmonics (3X to 10X) or bearing pass frequencies (BPFI, BPFO) appear, inspect 6312 / 6314 ball bearing condition.
4. Calculate percentage change from commissioning baseline:
   
5. If increase exceeds 50% or absolute velocity exceeds 4.5 mm/s, raise a **REQUIRES_APPROVAL** work order to relubricate or replace the bearing assembly.