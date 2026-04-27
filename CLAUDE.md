# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # next dev on :3000
npm run build            # next build (production)
npm start                # next start (after build)
npm run lint             # eslint flat config (eslint-config-next)
npm run capture:assets   # spawns next dev on :3100, drives Playwright to refresh public/csdm3d-assets/*
```

No test runner is configured. There is no `typecheck` script — `next build` performs type checking.

## Architecture

CSDM3D is a single-page Next.js 16 App Router demo (React 19, Tailwind v4) that visualizes ServiceNow CSDM5 maturity as a 3D map plus a workspace dashboard. The entire app surface fits in three files:

- `src/app/page.tsx` — the **only** route. Holds login gate, ServiceNow form, dashboard layout, demo data, and the JSON report download. Marked `"use client"`; all state is local React state (no global store, no auth library, no persistence).
- `src/components/Csdm3dUniverse.tsx` — the 3D scene. Uses `@react-three/fiber` + `@react-three/drei` (`Canvas`, `OrbitControls`, `Html`, `RoundedBox`, `Stars`, `Line`) over `three`. All three.js mesh refs, animation via `useFrame`, and HUD overlays live here.
- `src/app/api/servicenow/analyze/route.ts` — the **only** API route. POST handler that calls ServiceNow `/api/now/table/<table>?sysparm_limit=1` with HTTP Basic auth across a fixed table list per CSDM5 domain, then derives a 0–100 score and stage from table coverage + record-count signal.

### Domain model (must stay aligned across all three files)

The two literal unions and the `Analysis` / `DomainScore` / `Agent` shapes are **duplicated** in `page.tsx`, `Csdm3dUniverse.tsx`, and `route.ts` — there is no shared types file. When adding a domain, stage, agent, or analysis field, update all three call sites and the per-file lookup tables (`domainShort`, `domainTheme`, `positions`, `tableLabels`, `TABLES`, `LABELS`).

- `Stage = "foundation" | "crawl" | "walk" | "run" | "fly"` (CSDM 5.0 maturity ladder)
- `Domain = "foundational" | "design" | "build" | "technical-services" | "sell-consume"` (CSDM 5.0 domains)
- Score → stage thresholds live only in `route.ts::scoreToStage` (90 / 78 / 66 / 48). The 3D component reads `domain.stage` directly.

### Specialist agents

The analysis returns two specialist agent personas in `analysis.agents`. They are **templated server-side** in `route.ts::buildAgents` — there is no LLM call, the "AI" framing is narrative only.

- `pierrondi-ea` — **Paulo Pierrondi, Enterprise Architect.** Strategy, exec narrative, CSDM 5.0 roadmap, AI/Now Assist readiness.
- `itom-doctor` — **ITOM Doctor, CMDB & Discovery Specialist.** CMDB health, Discovery coverage, Service Mapping signals, missing-anchor diagnosis.

Each agent emits 3–4 `{ title, detail }` insights derived from `domains[]`, `overallScore`, `globalStage`, `weakest`, and per-table availability. The flat `analysis.insights` array is a **fallback** built from each agent's first insight — the 3D HUD reads `insights[0]?.detail` only.

### Live analysis flow

1. UI posts `{ instanceUrl, username, password }` to `/api/servicenow/analyze`.
2. Route normalizes the URL and fans out parallel `fetch` calls to the ServiceNow Table API for each CSDM 5.0 anchor table in `TABLES`.
3. Score = clamped `tableCoverage * 62 + min(recordSignal / 24, 30)`; blockers = `(100 - score) / 11`.
4. `buildAgents` then composes the two specialist insight blocks from those signals.
5. Credentials are never stored — they live only in the request body and Basic-auth header per call. Do not add persistence without the production hardening list in `README.md`.

### 3D scene structure

`Csdm3dUniverse` → `<Canvas>` → `<Scene>` which composes `BoardFoundation` (grid + zone tiles), `DomainLinks` (curved bezier edges colored by avg score), `DataFlowParticles` (130 instanced spheres traveling between domains, speed scaled by `overallScore`), and one `DomainPlatform` per domain (with a `StageRail` HUD and `DataNode` mesh per `tableLabels[domain]` entry). Coordinates are hard-coded in the `positions` map. RAG color thresholds (75 / 55–45) are duplicated in `DomainPlatform` and `DataNode`.

### Asset capture

`scripts/capture-assets.mjs` spawns its own `next dev` on port 3100, then drives Playwright to take screenshots into `public/csdm3d-assets/` and record a webm. It clicks `Load demo` (no live ServiceNow call), so changes to demo copy or layout will alter committed assets — re-run the script before launch posts.

## Conventions

- Path alias `@/*` → `src/*` (configured in `tsconfig.json`).
- Tailwind v4 via `@tailwindcss/postcss`. **Design language: Linear-inspired, dark-first.** Tokens live in `src/app/globals.css` as CSS custom properties (`--bg`, `--bg-elev-1/2/3`, `--border`, `--border-strong`, `--text`, `--text-2`, `--text-3`, `--accent`, `--success`, `--warn`, `--danger`) and are mapped through `@theme inline` for Tailwind v4 utility access. **Don't reintroduce inline brand hexes (`#0b7285`, `#3dd0d8`) or `font-black` weights** — keep weights ≤ 600 and use the CSS variables.
- Fonts: `Inter` (sans) + `IBM_Plex_Mono` (mono) loaded in `src/app/layout.tsx` as CSS variables. Body text is 14 px / 1.45 / `-0.005em` tracking by default.
- **Mobile-first layout.** The workspace renders a fixed bottom tab bar (`Map / Agents / Domains / Report`) under `lg`, and switches to a 3-column app shell (`260px sidebar / fluid main / 340px inspector`) at `lg` and up. The 3D canvas height steps `440 → 520 → 640 px` across `sm/lg`. The ServiceNow connect form is a modal opened from the top bar — do not put it back inline in the sidebar.
- React 19 + Next 16 — server components by default; both `page.tsx` and `Csdm3dUniverse.tsx` opt into `"use client"`. The API route is a standard Route Handler.
