# Sentinel — Industrial AI Workbench

A complete React + TypeScript frontend for confidential industrial knowledge work. Redesigned around goals, source documents, human review, and deliverables, using the local **EDITH project report** and the repository's **SIH26117** reference.

## Run

```sh
npm install
npm run dev
```

Open http://localhost:5173. For a production bundle, run `npm run build`; serve `dist/` with a static web server. No client API credentials are required.

## Included screens

- **Overview:** goal composer, recent work, pending review, knowledge collections.
- **AI workspace:** create, edit and delete drafts; attach source records; inspect the sample plan; run/cancel a P-204 walkthrough.
- **Knowledge library:** paginated collection search, local file import, Markdown/text/CSV previews, local image previews, download and removal.
- **Asset register:** searchable inventory, sortable IDs, equipment details, historical sample measurements, source links.
- **Approvals:** preview the exact sample note and its evidence, approve/decline, inspect completed decisions.
- **Deliverables:** preview and download real Markdown and CSV files.
- **Activity log:** searchable decision receipts and JSON export.
- **Settings:** saved preferences, proposed model roles, tool readiness, read-only action boundaries.

Responsive navigation, keyboard-accessible dialogs, focus restoration, unsaved-change guards, visible error/no-results states, reduced-motion support, and URL navigation are included. Drafts, sample decisions, and preferences persist in browser local storage. Uploaded files are held in tab memory only and disappear on reload; they are not sent to a server.

## Integration boundary

This is a **frontend demonstration**, not a deployed sovereign AI system. The sample walkthrough reproduces an arithmetic calculation in JavaScript. It does not run a model, execute code in a sandbox, inspect physical equipment, dispatch a work order, or verify an air gap. Arbitrary goals remain drafts. Existing historical `src/services/` connectors are not invoked by the new app.

Production deployment still needs organizational authentication and server-side authorization, a local model router, permission-aware retrieval and OCR, sandbox execution, artifact generation, transactional task storage, immutable server auditing, and measured network isolation. See [BACKEND_INTEGRATION.md](BACKEND_INTEGRATION.md).

## Structure

`src/workbench/` contains the active app shell, separate screen modules, shared UI primitives, demo store, and canonical CSS tokens. `src/mock/` supplies the existing project records. Old UI modules remain available as migration reference but are not imported by the new entry point or bundled into the app.

The maintained visual and behavior contracts are [DESIGN.md](DESIGN.md) and [UX-CONTRACT.md](UX-CONTRACT.md).

## Verify

```sh
npm run typecheck
npm run build
npm run format:check
npm run qa:browser
```

The browser suite expects a running development server and Chromium at `/usr/bin/chromium`. Override `SENTINEL_QA_URL`, `CHROMIUM_PATH`, or `SENTINEL_QA_OUTPUT` as needed. It uses isolated browser storage and writes screenshots, sample downloads, and accessibility results to `/tmp/sentinel-qa` by default.
