---
version: alpha
name: Sentinel Workbench
description: A calm industrial AI workspace that puts goals and evidence before telemetry.
colors:
  primary: "#6151c3"
  background: "#f7f8fa"
  surface: "#ffffff"
  text: "#202535"
  muted: "#657084"
  border: "#e5e8ef"
  rail: "#18212f"
  success: "#247354"
  warning: "#956313"
  danger: "#b23845"
typography:
  sans:
    fontFamily: "Arial, sans-serif"
  display:
    fontFamily: "Trebuchet MS, Arial, sans-serif"
  mono:
    fontFamily: "ui-monospace, monospace"
rounded:
  DEFAULT: "0.5rem"
  lg: "0.875rem"
spacing:
  section-gap: "1.5rem"
  page-max: "90rem"
components:
  button: {}
  card: {}
  dialog: {}
  badge: {}
  search: {}
---

# Sentinel Workbench Design System

## Overview

A product workspace for Indian industrial engineers and reviewers, grounded in the EDITH report chapters 5–7 and the existing SIH26117 project. The reference is an orderly engineering project folder: clear tasks, source records, review slips, and deliverables. English (en-IN), Asia/Kolkata. Desktop daily work with full mobile access. The signature is the goal composer with a restrained violet task pathway. Avoid command-center neon, competing intelligence panels, decorative graphs, fake live gauges, and invented compliance badges.

Runtime ownership: `src/workbench/workbench.css` is canonical. Frontmatter colors map directly to `--primary`, `--background`, etc.; typography maps to `--font-body`, `--font-display`, `--font-mono`. Shared primitives consume these CSS variables. No external fonts or runtime CDN assets.

## Colors

White work surfaces on cool gray, with a slate navigation rail. Violet identifies the current location and primary action. Green means completed, amber waiting, and red error; text always carries the meaning too. Borders define grouping. Light theme is the supported theme. Forced-colors uses platform defaults.

## Typography

Body Arial at 14px/1.5; headings Trebuchet MS with restrained weight and tighter tracking. Mono is reserved for file formats, identifiers, and technical values. Page heading 30px, section title 17px. No tiny all-caps body text.

## Layout

232px navigation rail, 72px topbar, naturally scrolling main with 32px desktop padding. Content max 90rem. At 1100px secondary columns stack; at 760px navigation becomes an accessible modal drawer and content uses 18px padding. Tables own horizontal overflow. Four overview summaries collapse into two columns and then one when necessary.

## Elevation & Depth

Flat bordered panels; only the goal composer and modal have subtle elevation. No glass or backdrop blur on normal content.

## Shapes

8px controls, 14px panels, circular avatars. Status badges use a pill outline with textual labels.

## Components

Shared Button, Badge, Search, Empty, PageHeading, Modal, and download helper live in `src/workbench/ui.tsx`. Native selects accept platform popup geometry. Modal uses native dialog showModal for background inertness, focus trapping, Escape, and trigger restoration. Search clears immediately; local results require no remote debounce. Forms own errors and use noValidate. Toasts use one polite live region. Lucide icons at 16–20px always accompany readable actions or accessible labels. Motion is a short fade only; reduced-motion disables it. Table, activity, and evidence views use the same spacing and text hierarchy.

## Do's and Don'ts

- Do lead with the user's objective and the next available action.
- Do distinguish sample evidence, local files, and backend verification.
- Don't claim live execution, air-gap enforcement, authentication, or compliance from frontend state.
- Don't add technical monitoring to the overview when it belongs in Settings.
