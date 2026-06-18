# Forage

> Gather what inspires you. Find it when it matters.

A calm, beautiful, local-first home for everything a creative person **gathers** (videos, threads,
sites, pins, images) and **generates** (AI video, images, code, design) — so inspiration and assets
stop dying in folders, tabs, and saved-for-later limbo. Organized by the projects in your head,
resurfaced when you're actually making something.

## Repository

| Path | What it is |
|---|---|
| [`PRD.md`](PRD.md) | Product requirements — vision, the Forage Loop, features, data model, architecture |
| [`docs/STRATEGY.md`](docs/STRATEGY.md) | Positioning, "why not Pinterest", the moat, naming |
| [`docs/SCREENS.md`](docs/SCREENS.md) | Wireframes & key flows |
| [`app/`](app/) | The working prototype (React + TS + Tailwind + Framer Motion) |

## Quick start

```bash
cd app
npm install
npm run dev      # http://localhost:5173
```

See [`app/README.md`](app/README.md) for a tour of what the prototype demonstrates.

## Status

Early. The prototype proves the canvas, capture, item detail, projects + resurfacing strip, and the
light/dark premium feel. Platform target is **macOS first** (via Tauri 2), then iOS/Android.
