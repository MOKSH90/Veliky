# Veliky frontend behavior contract

## Scope and evidence

User authorized a full frontend redesign. Business context: `EDITH_Project_Report (1).docx`, chapters 5.5, 5.7, 5.11, 6.3, 7; existing `src/mock/velikyData.ts`; SIH26117 community statement at https://sih2026.vuce.in/ps/SIH26117 (not an official policy source). No backend authorization, deployment contract, or official compliance standard is supplied. This app is an explicitly labeled demonstration; actual model execution, permission enforcement, egress verification and organizational sign-in require backend integration. No UI claims those are implemented.

## Canonical UI Map

| Capability     | Canonical owner                 | Source of truth | Allowed variants                 | Verification       |
| -------------- | ------------------------------- | --------------- | -------------------------------- | ------------------ |
| Select/Listbox | Native select                   | DESIGN.md       | platform owned                   | browser keyboard   |
| Form           | ui.tsx + WorkspaceView.tsx      | this contract   | goal/preferences                 | browser validation |
| Scrollbar      | workbench.css global baseline   | DESIGN.md       | horizontal table                 | mobile overflow    |
| Toast          | WorkbenchApp notice live region | this contract   | success/error                    | browser            |
| CRUD           | useWorkbench store              | report ch 7     | create/read/update/delete drafts | browser lifecycle  |
| Modal          | ui.tsx Modal                    | this contract   | detail/review/mobile menu        | focus/Escape       |
| Search         | ui.tsx Search                   | this contract   | local search                     | clear/no-results   |

## Navigation and data

URL `view` and `item` identify routes and detail views. Back/forward restores them. Local list search is transient and deliberately excluded from URLs to avoid exposing confidential queries. Lists use 6-row pages and clamp after filtering. Global search finds library documents, assets, and tasks. Browser-only demo state persists via versioned local storage; local uploaded contents remain in memory and are never sent to a server. The interface exposes storage failures. No secrets are stored. Cross-tab changes reload the persisted demo state through storage events.

## Workflows

Goal: enter objective → validate → create local draft → inspect plan → run sample walkthrough → waiting for review. Arbitrary objectives remain drafts, with no fabricated model response. Only the named P-204 sample runs the illustrative scenario. A sample review previews a local approval note; approve/reject changes only the demo record and appends an activity receipt. Never dispatch equipment commands. Completed sample deliverables download as actual Markdown files and CSV calculation data, truthfully labeled. No fake Word/PPT conversion.

Knowledge: select local files → validate type/size → keep file and content in memory → display preview and local-only status. Unsupported binary extraction requires backend OCR. Individual removal requires app-owned confirmation and affects the session library only. Original files are untouched.

Preferences: native selects and explicit save; success feedback; values restored on reload. Access policy is read-only because there is no authoritative server permission contract. Settings do not pretend to grant roles or alter real infrastructure.

## Accessibility and recovery

Native semantics, visible focus, modal initial focus and restoration, skip link, mobile menu, reduced motion. Clear labels, no color-only meaning. Native selects intentionally use OS popup geometry. Empty and no-results views show recovery actions. Download errors show feedback. Validation preserves goal input and focuses the failing field. Local draft auto-save avoids in-app loss; beforeunload guards any unsaved storage failure. Offline banner accurately states that sample data remains usable. Sample runs are cancelable and timer cleanup prevents late state changes after navigation/unmount. Activity dates use en-IN and Asia/Kolkata explicitly.

Draft editing preserves source selections; cancellation warns before discarding edits. Draft deletion confirms the exact task and removes only its browser-local record. Source documents and completed review receipts are retained. Screen implementations are separate modules under `src/workbench/`; `views.ts` is their public export surface.
