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

## Try it / install

- **Web app:** open the deployed build in any browser — nothing to install.
- **Portfolio demo:** append `?demo` to the URL for an always-fresh sample library
  (collections, a moodboard, palettes, fonts, and a kit) that resets on each load.
- **Mac app:** download the `.dmg` from the latest [Release](../../releases) (or the
  "Build macOS app" workflow artifact under **Actions**).

### Opening the Mac app (first launch)

The Mac build is **not code-signed** (no paid Apple Developer certificate), so on the
first open macOS shows *"Forage can't be opened because it is from an unidentified
developer."* This is expected — the app is safe. To open it:

1. Open the `.dmg` and drag **Forage** into **Applications**.
2. In Applications, **right-click (Control-click) Forage → Open**, then click **Open**
   in the dialog. You only need to do this once; afterwards it opens normally.
   - If macOS still blocks it: **System Settings → Privacy & Security → Open Anyway**.
   - Or from Terminal: `xattr -cr /Applications/Forage.app`, then open normally.

## Status

Early. The prototype proves the canvas, capture, item detail, projects + resurfacing strip, and the
light/dark premium feel. Platform target is **macOS first** (via Tauri 2), then iOS/Android.
