# AGENTS.md

> **Remember to update AGENTS.md frequently to match current source.**

## Project Overview

**Location Guard Neo** is a UserScript that protects browser geolocation privacy by intercepting the Geolocation API and either adding controlled noise (via Planar Laplace mechanism) or spoofing with fixed coordinates. It is a modern rewrite of the discontinued [Location Guard](https://github.com/chatziko/location-guard) browser extension (killed by Chrome's MV2 deprecation).

Published to npm as `location-guard`. Configuration UI host and distribution URLs are configurable at build time via environment variables (see Build-time Configuration below); defaults to `location-guard-neo.pages.dev` and unpkg.

## Repository Structure

Monorepo managed with **pnpm workspaces** and **Turborepo**.

```
location-guard-neo/
├── packages/
│   ├── types/            # Shared TypeScript type definitions (package: location-guard-types)
│   ├── userscripts/      # Core UserScript — the main deliverable (package: location-guard)
│   │   ├── src/
│   │   │   ├── index.ts          # Entry point: spoofs location, registers menu command, renders config UI
│   │   │   ├── spoof-location.ts # Geolocation API interception (getCurrentPosition, watchPosition, clearWatch)
│   │   │   ├── laplace.ts        # Planar Laplace noise mechanism (differential privacy)
│   │   │   ├── storage.ts        # GM_getValue/GM_setValue wrappers with defaults
│   │   │   ├── utils.ts          # Mobile detection, random int helper
│   │   │   └── ui/index.ts       # Exposes $locationGuard API on unsafeWindow for config UI
│   │   ├── rollup.config.ts      # Rollup + SWC build config, outputs IIFE bundle
│   │   └── userscript.meta.json  # Tampermonkey/Violentmonkey metadata (grants, match patterns)
│   ├── web/              # Next.js configuration UI (WIP, React + MUI Joy)
│   └── configs/          # Shared tsconfig base
├── web/                  # Legacy static config UI (HTML/CSS/JS), deployed to GitHub Pages
├── turbo.json            # Turborepo task definitions
├── pnpm-workspace.yaml   # Workspace package locations
└── eslint.config.mjs    # ESLint flat config (@antfu/eslint-config)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | TypeScript (strict, target ES2020) |
| Package manager | pnpm 10.x |
| Build orchestration | Turborepo |
| UserScript bundler | Rollup + SWC (`rollup-plugin-swc3`) |
| UserScript metadata | `rollup-plugin-userscript-metablock` |
| Web UI framework | Next.js 14 + React 19 + MUI Joy |
| Linting | ESLint 10 with `@antfu/eslint-config` |
| CI/CD | GitHub Actions (npm publish + GitHub Pages) |
| Versioning | `bumpp` for synchronized monorepo releases |

## Key Commands

```bash
pnpm install              # Install all dependencies
pnpm run build            # Build all packages (via Turborepo)
pnpm run lint             # Lint all packages
pnpm run release          # Bump version, commit, and tag (uses bumpp)
```

Per-package dev:
```bash
cd packages/userscripts && pnpm run dev    # Watch mode for UserScript
cd packages/web && pnpm run dev            # Next.js dev server (port 3000)
```

## Architecture

### Geolocation Interception (`spoof-location.ts`)

The core mechanism replaces `navigator.geolocation.getCurrentPosition`, `watchPosition`, and `clearWatch` with custom implementations that:

1. Check privacy level and paused state
2. For `fixed` level: return preconfigured coordinates without calling the real API
3. For `low`/`medium`/`high` levels: call the real API, then apply Planar Laplace noise
4. For `real` level or when paused: pass through unmodified
5. Cache noisy positions to avoid generating multiple noise samples centered on the real location

### Planar Laplace Mechanism (`laplace.ts`)

Implements location obfuscation based on 2D Laplace distribution for differential privacy guarantees. Uses Mercator projection for coordinate transforms and Lambert W function for inverse cumulative distribution sampling.

### Storage (`storage.ts`)

Wraps Greasemonkey/Tampermonkey `GM.getValue`/`GM.setValue` APIs. Provides both async (`GM.getValue`) and sync (`GM_getValue`) accessors. Default config sets `fixed` level with a dummy ocean coordinate.

### Configuration UI Bridge (`ui/index.ts`)

Exposes a `$locationGuard` object on `unsafeWindow` that the config web page consumes. The config UI host is injected at build time via `__CONFIG_UI_HOST__`.

## Privacy Levels

| Level | Behavior |
|-------|----------|
| `real` | No modification, real location passed through |
| `low` | Noise with 200m radius, 10min cache |
| `medium` | Noise with 500m radius, 30min cache |
| `high` | Noise with 2000m radius, 60min cache |
| `fixed` | Returns preconfigured fixed coordinates (no real geolocation call) |

## Types (`packages/types/index.ts`)

Key types to know:

- `Level = 'fixed' | 'real' | NoisyLevel` — privacy level union
- `NoisyLevel = 'low' | 'medium' | 'high'` — levels that apply Laplace noise
- `StoredValues` — full configuration schema (levels, epsilon, fixedPos, cachedPos, paused, etc.)
- `$LocationGuard` — the API bridge exposed on `unsafeWindow` for the config UI
- `PlanarLaplaceLike` — interface for the noise generation module

## CI/CD

- **Publish workflow** (`.github/workflows/publish.yml`): On push to `master`, builds and publishes to npm if the commit message matches `release: X.Y.Z`. Pre-release tags publish under `next` dist-tag. Uses npm provenance.
- **Pages workflow** (`.github/workflows/pages.yml`): Deploys the `web/` directory (legacy config UI) to GitHub Pages on push to `master`.

## Known TODOs

- Per-domain configuration (different privacy levels per website) — not yet implemented
- New configuration UI in React + MUI Joy — the `packages/web` package is scaffolded but mostly empty; the current UI is the legacy HTML/JS version in `web/`

## Build-time Configuration

URLs are not hardcoded in source. They are injected at build time via `@rollup/plugin-replace` (for TypeScript) and `rollup-plugin-userscript-metablock` override (for metadata). Environment variables with defaults:

| Variable | Default | Used in |
|----------|---------|---------|
| `CONFIG_UI_HOST` | `location-guard-neo.pages.dev` | `index.ts` host check, via `__CONFIG_UI_HOST__` |
| `CONFIG_UI_ORIGIN` | `https://${CONFIG_UI_HOST}` | `index.ts` options URL, metadata namespace, via `__CONFIG_UI_ORIGIN__` |
| `DIST_BASE_URL` | `https://unpkg.com/location-guard@latest/dist` | metadata `updateURL` / `downloadURL` |

## Coding Conventions

- Strict TypeScript with `strictNullChecks`
- ESLint with `@antfu/eslint-config` (TypeScript, React, stylistic with semicolons)
- React ESLint rules enabled globally via `@antfu/eslint-config` react option
- No source maps in production builds
- IIFE output format for UserScript bundle (ES2015 generated code)
- Use `this: void` annotations on object method implementations (enforced by eslint)
- Versions are synchronized across all packages via `bumpp -r --all`
