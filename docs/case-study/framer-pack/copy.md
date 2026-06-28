# Forage — Case Study Copy (for Framer)

> Paste these sections into your Framer page. Everything is dark‑mode ready.
> `[ASSET]` notes show which file from this pack goes where — they're suggestions,
> not text to publish. Edit freely; the copy is true to the product but generic
> where I couldn't know your specifics (swap in real metrics/dates where you have them).

---

## Asset index

**Videos** (`/videos`, 1920×1080 MP4, silent, loopable — set autoplay + loop + muted in Framer)
- `hero.mp4` — scroll the library, open a save
- `capture.mp4` — capture flow
- `color-browse.mp4` — browse by color
- `moodboard.mp4` — moodboard canvas
- `collection-moodboard.mp4` — one‑click auto‑moodboard from a collection
- `themes.mp4` — cycling color themes
- `command-palette.mp4` — ⌘K command palette
- `export.mp4` — export the whole library

**Images** (`/images`, retina PNG)
- `01-library`, `02-collections`, `03-collection`, `04-moodboard`, `05-kit`,
  `06-item-detail`, `07-command-palette`, `08-settings-stats`, `09-settings-themes`,
  `10-library-warm`, `11-library-sage`, `12-library-sky`, `13-library-rose`

**Diagrams** (`/diagrams`, high-res static PNG)
- `forage-loop`, `user-flow`, `information-architecture`, `design-system`,
  `problem-principles`, `architecture`

---

# Forage — a calm home for everything you gather.

**Product design case study · 2026**

I designed and built Forage end to end: a fast, local‑first visual library for the things creatives collect — and the things they make from them. It ships to the web, mobile, and macOS from one codebase.

- **Role** · Product design + build (solo)
- **Scope** · Research → IA → UI → motion → ship
- **Stack** · React · TypeScript · Tailwind · Tauri

`[ASSET: videos/hero.mp4 — full-bleed hero]`

---

## Overview

### One place that respects how creative work actually flows.

Forage is a visual library for images, links, video, audio, code, and AI work — and the moodboards, palettes, fonts, and kits people build from them.

It runs in any browser, installs as a mobile app, and ships as a native Mac app. Your library lives on your device and works fully offline. I owned the whole thing: product strategy, interaction and motion design, the design system, and front‑to‑back engineering — a real, shipping product, not a mockup.

---

## The problem

### Inspiration leaks. The stuff that should fuel the work dies in folders.

Creative work generates two relentless streams that both leak — and no tool is built to catch both and turn them into something.

**Inbound inspiration** — YouTube, X threads, articles, pins, sites. “I’ll come back to this.” You almost never do — it scatters across tabs, bookmarks, and five different apps.

**Outbound creation** — AI renders, images, code, design experiments you make yourself. They pile up in Downloads and project folders, then vanish when the project moves on.

**Tools for hoarding** — bookmark managers and cloud drives are built to *store*, not to *make*. Nothing resurfaces at the moment you’re actually building something.

`[ASSET: diagrams/problem-principles]`

---

## Principles

### Four rules shaped every decision.

- **Calm** — Generous space, soft motion, no noise. The work is the hero, never the chrome.
- **Fast** — Capture in two keystrokes. Everything is one shortcut away. Local data feels instant.
- **Local‑first** — Your library is yours, on your device, offline by default. Online features are opt‑in.
- **Beautiful by default** — A real system: type scale, color tokens, one corner & elevation language, light + dark.

### Organized around a loop, not a folder tree.

I rejected the folder hierarchy early — it’s where inspiration goes to die. Instead the whole product is a loop: **Capture → Organize → Resurface → Make**, then back again. Every surface exists to keep that loop turning with as little friction as possible.

- Five flat surfaces — Library, Collections, Moodboards, Storyboards, Kits
- An “Unfiltered” inbox so nothing has to be filed to be saved
- A deep but shallow settings spine — power without clutter

`[ASSET: diagrams/forage-loop]`

### The shortest path from a found thing to finished work.

The core flow has one job: remove friction between saving something and using it. Capture auto‑detects type, palette, and source. The decision “file it now?” is never forced — you can triage later from the inbox. From a collection you’re one click from a moodboard or a brand kit.

`[ASSET: diagrams/user-flow]`

### Information architecture — five surfaces for one loop.

`[ASSET: diagrams/information-architecture]`

---

## Design walkthrough — the product, surface by surface.

### 01 · Capture anything, in two keystrokes

Paste a link and it unfurls into a rich bookmark — real title, description, preview. Drag images onto the window, paste a snippet, or save from the browser extension and the mobile share sheet. The capture sheet detects the type and samples a palette before you’ve let go of the mouse.

- Smart‑paste type detection
- Default collection + tagging baked into capture
- Duplicate detection skips things you already saved

`[ASSET: videos/capture.mp4]`

### 02 · A library that’s a pleasure to scroll

A unified masonry grid holds every type of save at a density you control, with balanced shortest‑column packing so it never looks ragged. Light and dark are first‑class equals — designed together, not one ported to the other.

`[ASSET: images/01-library.png]`

### 03 · Detail that does real work

Open any save into a focused lightbox: its palette sampled with an eyedropper, tags, the collections it lives in, notes, and the “derived from” graph that links an output back to the input that inspired it — the loop, made visible.

`[ASSET: images/06-item-detail.png]`

### 04 · Organize the way you think

Manual collections with a brief, an “Unfiltered” inbox for anything not yet filed, and a color browser — pick a hue and the whole library reorganizes around it. Multi‑select to add a batch, or turn an entire collection into a moodboard in one click.

`[ASSET: videos/color-browse.mp4 — and/or videos/collection-moodboard.mp4]`

### 05 · Moodboards on an infinite canvas

Pull saves onto a freeform canvas, drag to arrange, add notes and arrows, then present. Multi‑select to drop a batch at once, or auto‑lay‑out a whole collection — ratio‑aware packing means it never overlaps.

`[ASSET: videos/moodboard.mp4]`

### 06 · Tools for design, not just storage

Extract and save color palettes (hover to read hex, click to copy), preview fonts in their real typeface — pulled from your installed system fonts or Google Fonts — and bundle a palette, fonts, and references into a **style kit** you can export as CSS in one click.

`[ASSET: images/05-kit.png]`

### 07 · Make it yours — and take it with you

Optional color themes re‑tint the whole app. And because the library is genuinely yours, you can export everything as an organized **.zip** — a folder per collection, assets as real files — or a portable JSON backup, and re‑import either, losslessly.

`[ASSET: videos/themes.mp4 — and images/10–13 themed library variants]`

### 08 · Built for speed

A command palette (⌘K) searches every save and jumps to any view or command. Full keyboard navigation through the grid. Instant local data. The whole thing is tuned so the fast path is the default path.

`[ASSET: videos/command-palette.mp4]`

---

## Design system

### Making “calm” reproducible.

Calm is an engineering problem as much as a visual one. I built Forage on a small set of tokens — a type scale, color tokens, one corner & elevation language — so every new surface inherits the feel instead of re‑inventing it.

`[ASSET: diagrams/design-system]`

- **Motion** — Spring‑based and restrained. Tiles settle, sheets glide, the theme toggle cross‑fades. Nothing bounces for the sake of it.
- **Sound** — Optional, synthesized UI sounds with a “variety” mode and a distinct trash cue — designed, not stock.
- **Responsive** — A dedicated mobile pass: bottom tab bar, full‑screen sheets, touch targets, pinch‑to‑zoom on the canvas.

---

## Designed to ship

### I built what I designed.

Designing and building it myself meant every interaction survived the trip from Figma to production — nothing got lost in handoff, because there wasn’t one. React + TypeScript + Tailwind + Framer Motion on the front end; IndexedDB for a local‑first library that holds real images without hitting storage limits; optional Cloudflare Workers for sync, sharing, and link previews; and Tauri 2 to ship a native Mac app from the same codebase.

`Stack:` React · TypeScript · Tailwind v4 · Framer Motion · IndexedDB · PWA · Tauri 2 · Cloudflare Workers

`[ASSET: diagrams/architecture]`

---

## Outcome

### A complete, shipping product — from one codebase.

- **3** — platforms (web, mobile PWA, macOS)
- **1** — codebase, designed & built solo
- **10+** — save types unified in one grid
- **100%** — local‑first; works fully offline

### Reflection — what I’d carry forward

The biggest lesson: “calm” comes from the engineering — local‑first data, optimistic interactions, and tight motion are what make the app *feel* quiet. Owning design and build let me make those calls in one head, fast.

### Next — where it goes

Native mobile builds, richer cross‑device sync, and collaborative collections — turning a single‑player tool for taste into a shared one, without losing the calm.

---

*Designed & built by Nikolai Paquin. Gather what inspires you — find it when it matters.*
Live demo: https://nikolai-paquin.github.io/Forage-App/ · Code: https://github.com/nikolai-paquin/Forage-App
