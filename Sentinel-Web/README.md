# EDITH Frontend — Dynamic Workspace Build

EDITH is a desktop-first, goal-driven Personal AI Operating System interface. This build focuses on a dynamic workspace experience rather than a chat UI.

## What changed in v0.4

- Added an always-visible **EDITH / AI workspace** control above Workspace, Graph, Memory, and Activity, plus a contextual **Back to EDITH** pill in the top bar. Pressing `Esc` from any tool view also returns to the agent.
- Reworked the application shell into floating matte/frosted surfaces with larger radii, softer highlights, fewer visible borders, quieter shadows, and more continuous negative space.
- Rebuilt the 3D Möbius core around a properly closed Möbius topology, pearlescent metal/glass material, a single restrained red signal filament, animated signal packets, soft reflections, contact shadowing, and calmer state-reactive motion.
- Rebuilt the 3D graph as a cleaner spatial constellation with glass node shells, internal cores, curved low-noise links, animated signal packets on active relationships, goal/task/memory context nodes, focus/search/filter controls, and a softer depth/fog treatment.
- Workspace remains the only place where the project file explorer/editor is shown. Graph, Memory, Activity, and EDITH remain visually separate modes.
- Local folder ingestion still builds a real client-side file tree, reads supported text files, detects common technologies, and derives folder/import relationships for the graph where possible.
- EDITH execution streams live events and updates its working set while the Möbius and graph react to agent state.
- Memory retains search, scope filtering, edit, and forget actions. Activity can switch between the current live execution session and historical audit entries.
- Command input supports multiline goals, attachments, drag/drop, command history, Enter submit, and Shift+Enter newline.
- The Graph bundle is lazy-loaded and is only rendered while the Graph view is open.

## Install and run

```bash
npm install
npm run dev
```

Then open the local Vite URL shown in the terminal.

## Production build

```bash
npm run build
npm run preview
```

## Google authentication

The frontend supports Google Identity Services when a Web Client ID is configured.

1. Copy `.env.example` to `.env`.
2. Set `VITE_GOOGLE_CLIENT_ID` to your Google OAuth 2.0 Web Client ID.
3. Add your local Vite origin and production origin in Google Cloud Console.
4. Restart `npm run dev`.

Without a client ID, EDITH deliberately exposes a clearly labeled local demo session instead of pretending real Google OAuth is active.

> Production note: the browser can receive the Google ID credential, but a production EDITH backend should verify that credential server-side and issue its own secure session.

## Opening a real local project

Use **Open Project Folder**. Modern Chromium browsers provide the selected folder files to the frontend through `webkitdirectory`.

EDITH then:

1. Builds the workspace file tree.
2. Reads supported text/code files up to safe prototype limits.
3. Detects common languages/framework markers.
4. Builds `contains` edges from folders.
5. Attempts to derive `imports` relationships from source text.
6. Uses those nodes as the 3D graph instead of the fallback mock graph.

This remains a frontend prototype. It does not silently write to disk, execute shell commands, or run an LLM. Controlled execution is represented by the UI state machine until a real backend agent/tool layer is connected.

## Keyboard controls

- `Enter` — execute goal
- `Shift + Enter` — newline
- `Alt + ↑ / ↓` — command history
- `Esc` — return to EDITH from Workspace / Graph / Memory / Activity
- Graph: drag to orbit, scroll to zoom, click nodes to focus

## Structure

```text
src/
├── components/
│   ├── agent/
│   ├── graph/
│   ├── mobius/
│   ├── files/
│   ├── memory/
│   ├── activity/
│   ├── layout/
│   └── profile/
├── lib/
│   ├── api.ts
│   ├── types.ts
│   └── workspace.ts
├── mock/
├── pages/
├── store/
└── styles.css
```
