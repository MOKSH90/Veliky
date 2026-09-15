# Backend integration handoff

The implemented frontend has no connected execution backend. `src/workbench/data.ts` owns a small typed browser demo store. Replace that persistence and sample execution adapter when connecting the server; retain the shared screens and honest pending/error states.

| Capability   | Current frontend                            | Required production contract                                                                                    |
| ------------ | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Identity     | Local display preference; no authentication | Organizational session, server roles, logout, expiry and 403 handling                                           |
| Tasks        | Local drafts, source IDs, sample decisions  | Transactional task CRUD with authorization, revision/conflict control and idempotency                           |
| Planning     | Explicit P-204 sample sequence              | Goal-scoped plan with model identity, selected tools and permission decisions                                   |
| Execution    | Cancelable timed sample walkthrough         | Streamed execution IDs, measured progress, cancellation acknowledgment, retry/replan and verification records   |
| Retrieval    | Sample records and tab-local files          | Permission-aware local retrieval, citation spans, document revision and provenance                              |
| Multimodal   | Local images and text previews              | Local OCR/vision jobs with extraction status, original page references and error recovery                       |
| Approvals    | Exact note preview; local decision receipt  | Server-owned scope, immutable preview revision, authorized actor, one-use approval and execution receipt        |
| Deliverables | Actual Markdown/CSV downloads               | Stored artifacts with MIME, filename, size, authenticated download, and generated Word/Excel/PPT when supported |
| Audit        | Browser-local JSON receipts                 | Append-only server audit, authenticated attribution, reliable timestamps and retention policy                   |
| Models       | Proposed model roles, visibly disconnected  | Actual local provider health, router decisions, loaded models and measured resource usage                       |
| Sovereignty  | No active cloud connector                   | Deployment-level egress telemetry, enforceable network policy, and test evidence                                |

Do not infer authorization from a browser dropdown or success from a completed animation. The local demonstration must remain explicitly labeled until live responses replace its records. An approval must not dispatch anything except the exact revision and scope the reviewer saw. No operation should allow the model to grant itself permission.

The SIH26117 interpretation is supported by the repository's existing problem ID and this [community-maintained statement archive](https://sih2026.vuce.in/ps/SIH26117). It is not an official policy document. The local EDITH report describes the six-layer architecture, policy gate, verification loop, and intended interfaces; it explicitly characterizes its walkthroughs as illustrative.
