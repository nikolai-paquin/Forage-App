# Forage — Screens & Key Flows (Wireframes)

Companion to [`../PRD.md`](../PRD.md). Low-fidelity wireframes for the **macOS-first** build. ASCII layouts describe structure, hierarchy, and motion — not final visuals. The aesthetic target is Apple-grade: content-forward, generous whitespace, materials/blur, restrained chrome.

Legend: `▦` media tile · `▶` video · `◳` link card · `{}` code · `✶` AI asset · `·····` subtle/secondary

---

## 1. App Shell (macOS)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ ●●●            ⌕ Search everything…                       ◐ theme    ⊕ Add │  ← translucent toolbar
├───────────────┬──────────────────────────────────────────────────────────┤
│  FORAGE       │                                                            │
│               │   Library  ·  Basket (4)  ·  Storyboards     [▦ grid ▾]    │  ← context bar
│  ⌕ Search     │  ┌────────┐ ┌──────────────┐ ┌───────┐ ┌────────┐         │
│               │  │  ▦     │ │   ▶ video     │ │  ◳    │ │  ✶ AI  │         │
│  ◇ Library    │  │        │ │   (hover=play)│ │ link  │ │ image  │         │
│  ▣ Basket  4  │  └────────┘ │              │ └───────┘ │        │         │
│               │  ┌───────┐  └──────────────┘ ┌────────┐└────────┘         │
│  PROJECTS     │  │ {} code│  ┌────────┐      │  ▦      │ ┌─────┐           │
│  ● Studio Re… │  │        │  │  ▦     │      │         │ │ gif │           │
│  ● AI Film    │  └───────┘  │        │      └────────┘ └─────┘            │
│  ● Type Study │             └────────┘                                     │
│  ● Personal   │        ·····  masonry: virtualized, mixed media  ·····     │
│  + New project│                                                            │
│               │                                                            │
│  ─────────    │                                                            │
│  ◷ Digest     │                                                            │
│  ⚙ Settings   │                                                            │
└───────────────┴──────────────────────────────────────────────────────────┘
```

- **Left rail:** Library (everything), Basket (unsorted captures), Projects list with status dots, Digest, Settings. Collapsible.
- **Toolbar:** universal search, theme toggle (sun/moon with a smooth cross-fade), global **Add (⌘N)**.
- **Context bar:** segmented control + grid-density / layout switch (grid · feed · board).
- **Motion:** tiles enter with a staggered spring; hover lifts a tile with a soft shadow + palette-aware glow; video/gif tiles play muted on hover.

---

## 2. Capture (the <3s path)

Triggered by ⌘N, drag-drop onto the window, paste, or the menubar item.

```
            ┌─────────────────────────────────────────────┐
            │   Forage something                       ✕   │
            │  ┌───────────────────────────────────────┐  │
            │  │  Paste a link, or drop a file…        │  │ ← autofocus; detects type on paste
            │  └───────────────────────────────────────┘  │
            │                                             │
            │   ┌─────────────┐   detected: ▶ YouTube     │ ← live preview fetched (OG/oEmbed)
            │   │   ▶ preview  │   "How diffusion works"   │
            │   └─────────────┘   youtube.com · 14:32      │
            │                                             │
            │   Add to:  [ Basket ▾ ]      # tags…         │ ← defaults to Basket; optional project
            │                                             │
            │                         [ Forage it  ⌘↵ ]    │
            └─────────────────────────────────────────────┘
```

- Opens instantly; paste auto-detects link/image/code. Metadata + thumbnail fetched live.
- Default destination = **Basket** (capture now, organize later). One keystroke (`⌘↵`) to save.
- Confirmation: a small tile animates from the dialog into the grid (shared-element), then the dialog dismisses. That motion *is* the reward.

---

## 3. Item Detail (shared-element expand)

Clicking a tile expands it in place into a focused view (not a jarring page swap).

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ‹ back                                                       ✶ favorite   │
│  ┌───────────────────────────────┐   How diffusion models work            │
│  │                               │   ▶ youtube.com · 14:32                 │
│  │         ▶  media               │                                        │
│  │      (plays inline)           │   ◷ Saved 3 weeks ago · last seen today │
│  │                               │                                        │
│  └───────────────────────────────┘   ◫ Palette  ■■■□□                      │
│                                                                            │
│  ✎ Notes ─────────────────────────    In projects:  ● AI Film  ● Type Study│
│  "great explanation of the noise                                           │
│   schedule — ref for the title seq"   # tags: ai, motion, explainer        │
│                                                                            │
│  ── AI summary ───────────────────    ── Related (semantic) ──             │
│  TL;DR: walks through forward/reverse  ▦  ▦  ▶  ◳   ← "more like this"      │
│  diffusion, noise schedules, and …                                         │
└──────────────────────────────────────────────────────────────────────────┘
```

- For **AI assets**: this panel also shows **prompt, model, parameters, and the source inspiration link** — the input→output bridge.
- "Related" row is semantic (powered by local embeddings) — the quiet engine that resurfaces across projects.

---

## 4. Project View (a living space, not a folder)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ● AI Film                                              ⋯   [▦ grid ▾]     │
│  ──────────────────────────────────────────────────────────────────────   │
│  Brief: "A 60s AI short about memory. Warm, grainy, analog. Refs for       │ ← intent powers resurfacing
│          color, motion, and shot composition."                    ✎ edit   │
│                                                                            │
│  Collections:  [ Color ]  [ Motion ]  [ Shots ]  [ Sound ]  + new          │ ← shelves within the project
│                                                                            │
│  ◷ Resurfaced for you:  "3 items you saved here weeks ago →"  ▦ ▶ ▦        │ ← contextual resurfacing
│  ──────────────────────────────────────────────────────────────────────   │
│  ┌──────┐ ┌────────┐ ┌─────┐ ┌──────────┐ ┌─────┐                          │
│  │  ▦   │ │  ▶      │ │ ✶   │ │   ◳ link │ │ gif │   ····· project grid     │
│  └──────┘ └────────┘ └─────┘ └──────────┘ └─────┘                          │
└──────────────────────────────────────────────────────────────────────────┘
```

- The **Brief** is a real field — it feeds the resurfacing engine's relevance and gives the project intent.
- A persistent (dismissible) **resurfaced** strip is the differentiator made visible.

---

## 5. Storyboard Mode

```
┌──────────────────────────────────────────────────────────────────────────┐
│  ● AI Film › Storyboard: "Opening sequence"          + frame   ⤓ export    │
│  ──────────────────────────────────────────────────────────────────────   │
│   ┌────────┐    ┌────────┐    ┌────────┐    ┌────────┐    ┌────────┐        │
│   │  ▦ 01  │ →  │  ▶ 02  │ →  │  ✶ 03  │ →  │  ▦ 04  │ →  │  + add │        │
│   │ shot   │    │ shot   │    │ shot   │    │ shot   │    │        │        │
│   └────────┘    └────────┘    └────────┘    └────────┘    └────────┘        │
│   wide, dawn    push-in       gen: "grain   match cut                       │
│   ·····         ·····         + warm" ✶     ·····                           │
│                                                                            │
│   Frame 03 ▾  prompt: "warm grainy analog memory, 35mm…"  model: …  notes: │ ← per-frame detail
└──────────────────────────────────────────────────────────────────────────┘
```

- Horizontal sequence of **frames** built from Items; drag to reorder with physics.
- Each frame holds an item (image/clip), a beat/note, and — for AI shots — the prompt/model.
- Export as a shareable board or a contact-sheet image.

---

## 6. The Forage Digest

```
┌─────────────────────────────────────────────┐
│  ◷ Your Forage Digest · Thursday             │
│  ─────────────────────────────────────────   │
│  Three things worth a second look            │
│                                             │
│   ┌──────┐  Saved to AI Film · 3 wks ago     │
│   │  ▶   │  "noise schedule explainer"       │
│   └──────┘  [ open ]  [ tuck away ]          │
│                                             │
│   ┌──────┐  From Type Study · also fits      │
│   │  ▦   │   your current AI Film project →  │ ← cross-project resurfacing
│   └──────┘  [ open ]  [ add to AI Film ]      │
│  ─────────────────────────────────────────   │
│  cadence: ◉ weekly  ○ daily  ○ never         │ ← user fully controls
└─────────────────────────────────────────────┘
```

- Calm, infrequent, user-controlled. Never an engagement feed.
- The cross-project suggestion ("also fits your current project") is the resurfacing engine earning its keep.

---

## 7. Empty States (first-run craft)

- **Empty Library:** a soft illustration + "Your basket is empty — go forage something." with the three capture methods (paste / drop / extension) shown as gentle hints.
- **Empty Project:** "Give this project a brief, then start gathering." with the Brief field pre-focused.
- Empty states are designed, not afterthoughts — first run is where the premium feeling is won or lost.

---

## 8. Key Flows (happy paths)

1. **Forage from the web:** browser extension → one click → lands in Basket → (optional) later drag from Basket into a Project. *Friction target: one click, zero context-switch.*
2. **Triage the Basket:** open Basket → multi-select → assign to project / tag / dismiss. Batch, fast, keyboard-driven.
3. **Start a project session:** open Project → read the resurfaced strip → pull a related item in from another project → begin work.
4. **Save an AI output:** drop a generated image → Forage detects it's an asset → prompt to attach prompt/model + link the source reference → it now lives in the input→output graph.
5. **Build a storyboard:** in a project → new Storyboard → drag items into frames → annotate → export.

---

## 9. Motion & Micro-interaction Spec (the "premium feel")

- **Tile entrance:** staggered spring (mass/tension tuned for a soft settle, not a bounce-fest).
- **Hover:** magnetic lift + soft shadow + palette glow; video/gif play muted.
- **Open item:** shared-element transition (tile morphs into detail), ~300ms, eased.
- **Theme switch:** cross-fade of colors + a subtle radial wipe from the toggle.
- **Capture confirm:** new tile flies from the dialog into its grid position.
- **Drag:** physics-based with momentum; neighbors part to make room.
- **Principle:** every interaction confirms itself; nothing is instant-and-silent, nothing is slow-and-janky. Respect `prefers-reduced-motion`.
