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

Other scripts: `npm run build` (type-check + production build), `npm run preview`.

## What's here (and what it demonstrates)

| Area | File(s) | PRD link |
|---|---|---|
| Unified masonry grid (balanced shortest-column packing, mixed media) | `components/MasonryGrid.tsx`, `components/ItemTile.tsx` | F2/F3 |
| Mixed media tiles — image, video (hover-to-play), gif, vector, link card, code, AI asset | `components/ItemTile.tsx` | F2 |
| Capture dialog with smart-paste type detection (⌘N) | `components/CaptureDialog.tsx` | F1 |
| Item detail — notes, AI summary, palette, **AI prompt + model + source-ref bridge**, related row | `components/ItemDetail.tsx` | F8/F10 |
| Projects with brief + **"Resurfaced for you"** strip | `components/ContextHeader.tsx`, `components/Sidebar.tsx` | F4/F9 |
| Light/dark theming as first-class equals, system-aware, no-flash | `index.css`, `lib/theme.ts` | F5 |
| Search + type filters | `components/Toolbar.tsx`, `components/ContextHeader.tsx` | F6 |
| Local-first persistence (localStorage stands in for the SQLite source of truth) | `lib/store.tsx` | §0 |

## Try this

1. **⌘N** (or the **Add** button) → paste a link or an image URL → watch it auto-detect the type and
   fly into the grid.
2. Hover a **video** tile — it plays muted; hover any image tile for the lift + palette glow.
3. Open the **AI Film** project → see the brief and the *Resurfaced for you* strip.
4. Open the **"Memory — opening frame v3"** AI asset → see the prompt/model and the **"derived from"**
   link back to the grain study (the input→output graph).
5. Toggle **light/dark** in the top-right.

## Not yet built (next milestones)

Virtualized grid for 10k+ items, browser extension + mobile share-sheet capture, real AI
tagging/embeddings/summaries, the Forage Digest surface, storyboard mode, and the Tauri shell. See
the PRD roadmap (§12).

## Notes

- Sample media uses remote placeholder images/videos, so first load needs a network connection.
  Real Forage stores media locally.
- State persists to `localStorage` under `forage.items.v1`; clear it to reset to the seed set.
