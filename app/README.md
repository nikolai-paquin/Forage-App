# Forage — Prototype

A clickable prototype of the Forage canvas: the masonry grid, capture flow, item detail, and the
premium light/dark micro-interactions. Built with **React + TypeScript + Tailwind v4 + Framer
Motion** — the exact frontend stack we'll wrap in **Tauri 2** for the downloadable macOS app (and
later iOS/Android), per [`../PRD.md`](../PRD.md) §10.

## Run it

```bash
cd app
npm install
npm run dev        # http://localhost:5173
```

Other scripts: `npm run build` (type-check + production build), `npm run preview`,
`npm test` (Vitest unit suite for the core logic).

## What's here (and what it demonstrates)

| Area | File(s) | PRD link |
|---|---|---|
| Unified masonry grid (balanced shortest-column packing, mixed media) | `components/MasonryGrid.tsx`, `components/ItemTile.tsx` | F2/F3 |
| Mixed media tiles — image, video (hover-to-play), gif, vector, link card, code, AI asset | `components/ItemTile.tsx` | F2 |
| Capture dialog with smart-paste type detection (⌘N) | `components/CaptureDialog.tsx` | F1 |
| Item detail — notes, summary, palette, **derived-from source-ref bridge**, related row | `components/ItemDetail.tsx` | F8/F10 |
| Projects with brief + **"Resurfaced for you"** strip | `components/ContextHeader.tsx`, `components/Sidebar.tsx` | F4/F9 |
| **Storyboard mode** — drag-to-reorder frames, editable shot beats, per-frame notes, frame picker, export shot list | `components/StoryboardView.tsx` | F11 |
| Light/dark theming as first-class equals, system-aware, no-flash | `index.css`, `lib/theme.ts` | F5 |
| **Command palette (⌘K)** — full-text search across saves + jump-to-view + run-command, keyboard navigable | `components/SearchOverlay.tsx` | F6 |
| **Virtualized masonry** — exact-offset windowing for 10k+ saves (kicks in past 80 items) | `components/MasonryGrid.tsx` | F2 |
| **Durable storage** — library in IndexedDB (no localStorage quota cliff for image uploads), migrated automatically | `lib/idb.ts`, `lib/store.tsx` | §0 |
| **In-grid keyboard nav** — arrows/hjkl to move, Enter to open, x/Space to select, with auto-scroll | `App.tsx`, `components/MasonryGrid.tsx` | F6 |
| **Desktop build (Tauri 2)** — one-click macOS `.dmg` via CI, or local build | `src-tauri/`, `../.github/workflows/desktop.yml`, `DESKTOP.md` | §10 |
| **Duplicate detection** — capture flows skip URLs/images already saved | `lib/dedupe.ts` | F1 |
| **Cross-device sync (optional)** — per-item last-write-wins merge against a KV Worker; auto or manual | `lib/sync.ts`, `../server/sync-worker.js` | §0 |
| **Library export** — download the whole library as an organized .zip (one folder per collection) or portable JSON; re-import either | `lib/exportLibrary.ts`, `lib/backup.ts`, `components/SettingsModal.tsx` (Data) | §0 |
| **Unit tests** — Vitest coverage of dedupe, sync merge, and input detection | `lib/__tests__/logic.test.ts` | — |
| **PWA** — installable, offline app-shell caching, mobile share target | `public/sw.js`, `public/manifest.webmanifest`, `lib/pwa.ts` | §10 |
| **First-run onboarding** | `components/Onboarding.tsx` | — |
| Local-first persistence (localStorage stands in for the SQLite source of truth) | `lib/store.tsx` | §0 |

## Try this

1. **⌘N** (or the **Add** button) → paste a link or an image URL → watch it auto-detect the type and
   fly into the grid.
2. Hover a **video** tile — it plays muted; hover any image tile for the lift + palette glow.
3. Open the **AI Film** project → see the brief and the *Resurfaced for you* strip.
4. Open the **"Memory — opening frame v3"** AI asset → see the **"derived from"**
   link back to the grain study (the input→output graph).
5. Open the **Opening sequence** storyboard (left sidebar) → **drag frames** to re-sequence, edit a
   shot description, and **Add frame** from the project's items.
6. Toggle **light/dark** in the top-right.

## Optional backends

Forage works fully offline. Optional Cloudflare Workers in [`../server`](../server) add
cross-device **Sync**, read-only collection **Sharing**, and **Link previews** (rich
bookmark unfurling + image proxy) — each pasted into its own Settings tab. None require an
API key beyond Sync's generated key.

## Not yet built (next milestones)

The Forage Digest surface, and a **signed/notarized** auto-updating Tauri release (the CI build is
unsigned — Gatekeeper right-click-open on first launch, see `DESKTOP.md`). See the PRD roadmap (§12).

## Notes

- Sample media uses remote placeholder images/videos, so first load needs a network connection.
  Real Forage stores media locally.
- State persists to `localStorage` under `forage.items.v1`; clear it to reset to the seed set.
