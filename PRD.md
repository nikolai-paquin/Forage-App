# Forage — Product Requirements Document

> **One line:** Forage is a calm, beautiful home for everything a creative person gathers and generates — so inspiration and assets stop dying in folders, tabs, and saved-for-later limbo.

- **Status:** Draft v1
- **Author:** Nikolai Paquin
- **Last updated:** 2026-06-18
- **Platforms:** macOS (desktop), iOS, Android

---

## 1. The Problem

Creative and technical work generates two relentless streams that both leak:

1. **Inbound inspiration** — YouTube videos, X threads, articles, Pinterest pins, websites. You tell yourself "I'll come back to this," and you almost never do. It scatters across browser tabs, bookmarks, screenshots, and saved posts in five different apps.
2. **Outbound creation** — AI-generated video, images, code, and design experiments you produce yourself. These pile up in Downloads, project folders, and on the desktop, and get lost the moment the project moves on.

The deeper problem isn't *saving* — saving is easy and a dozen apps do it. The problem is:

- **Saved ≠ seen.** Bookmarks are a graveyard. Nothing brings the right thing back at the right moment.
- **No project context.** You're running multiple design projects at work plus personal product/AI/code projects, and it all jumbles together in your head and on your machine.
- **Input and output live apart.** The reference that inspired a piece and the AI output it produced have no relationship anywhere in your tools.
- **No through-line for sequenced work.** AI video and design projects are inherently storyboarded/sequenced, but inspiration tools treat everything as a flat pile.

**Forage exists to close the loop between what you gather and what you make.**

---

## 2. Vision

A single, gorgeous, fast surface where every link, image, video, GIF, vector, snippet, and AI-generated asset you care about lives — organized by the projects in your head, resurfaced intelligently so it actually informs the work, and craftsmanship-grade enough that opening it feels like a creative ritual, not a chore.

Forage should feel less like a database and more like a **mind palace for the creative work you do.**

---

## 3. Target User & Personas

**Primary persona — "The Multi-Project Maker" (you).**
A designer / builder working across product, design, AI, and code, simultaneously, professionally and personally. Visually driven, taste-sensitive, generates and consumes large volumes of media, and is frustrated by tools that are either too dumb (bookmarks) or too generic (Pinterest, Notion, Finder).

**Secondary personas (for later growth, not MVP):**
- **AI creators / prompt artists** drowning in their own generated outputs.
- **Design researchers / art directors** building mood and reference libraries per client.
- **Indie developers** collecting code snippets, repos, and technical references alongside design.

---

## 4. Positioning — Why Not Just Pinterest / a Bookmark App?

This is the make-or-break question, so it's answered head-on. Forage wins on four axes that the incumbents structurally cannot:

| Axis | Bookmark apps (Raindrop, Pocket) | Pinterest | Notion / Finder | **Forage** |
|---|---|---|---|---|
| **Medium** | Mostly links | Mostly images | Anything, but ugly/manual | Native masonry of links, video, GIF, vector, image, **and your own AI outputs** — side by side |
| **Your own creations** | No | No (it's for discovery) | Yes, but unstructured | First-class: store, version, and tag generated assets |
| **Resurfacing** | None | Algorithmic feed (for *their* engagement, not yours) | None | Intentional resurfacing for *your* projects |
| **Project context** | Flat folders/tags | Public boards | Manual | Projects as living creative spaces with intent, not just buckets |
| **Sequencing** | No | No | No | Built-in storyboard mode |
| **Feel** | Utilitarian | Cluttered, ad-driven, public | Generic | Apple-grade, private, premium |

**The one-sentence rebuttal:** *Pinterest is built to keep you discovering on their platform; Forage is built to bring your own gathered and generated work back to you when it matters.*

### What makes it defensible (the moat)
1. **Input + output in one graph.** No incumbent connects "the reference that inspired this" to "the thing I made." Forage does.
2. **Resurfacing engine.** Turning a passive archive into an active creative partner is the core feature, not a bookmark list.
3. **Craft as a feature.** For a taste-driven audience, the feel *is* the product. This is hard to copy and easy to love.

---

## 5. Goals & Non-Goals

### Goals (what success looks like)
- Capture anything in **under 3 seconds** from anywhere (share sheet, browser extension, drag-and-drop, paste).
- Make a saved item **resurface usefully** instead of disappearing.
- Let the user **think in projects**, not folders.
- Deliver a **best-in-class, Apple-grade UI** with light/dark and premium micro-interactions.
- Run natively-feeling on **macOS, iOS, and Android** from one codebase.

### Non-Goals (explicitly out of scope, at least for v1)
- ❌ A social/discovery network. Forage is private-first. No public feeds, no follower graph.
- ❌ A full design/editing tool (no Figma/Photoshop replacement). Forage references and sequences; it doesn't edit pixels.
- ❌ A general note-taking app. Notes exist only as annotations on items/projects.
- ❌ A team collaboration suite at launch (single-player first; sharing is a later milestone).

---

## 6. Core Concepts & Data Model

Four primitives. Keep it this small.

- **Item** — the atomic unit. A saved or generated thing.
  - `type`: `link | image | video | gif | vector | audio | code | text | ai_asset`
  - `source`: where it came from (URL, upload, AI tool name)
  - `media`: stored file(s) + generated thumbnail/preview + dominant color palette
  - `metadata`: title, description, auto-extracted (oEmbed/OpenGraph), dimensions, duration
  - `ai`: auto-tags, semantic embedding, auto-summary (for articles/videos)
  - `annotations`: user notes, highlights, prompt used (for AI assets)
  - `created_at`, `last_surfaced_at`, `favorite`

- **Project** — a living creative space, not just a folder.
  - Has a `brief`/intent (one paragraph of what this project is about — powers resurfacing relevance).
  - Holds Items (an item can belong to multiple projects).
  - Has a cover, color theme, and status (`active | archived`).
  - Can contain **Collections** (sub-groupings, e.g. "type studies", "color", "motion refs").

- **Collection** — a lightweight grouping within a project (a "shelf").

- **Storyboard** — an ordered sequence of frames built from Items (see §8.4).

Plus cross-cutting: **Tags** (manual + AI), **Palette** (extracted colors, used for filtering "show me everything warm").

---

## 7. The Forage Loop (the product's heartbeat)

```
   CAPTURE  →  ORGANIZE  →  RESURFACE  →  CREATE  →  (capture the output)
      ↑                                                      │
      └──────────────────────────────────────────────────────┘
```

Every feature serves one stage of this loop. If a feature doesn't, it's a non-goal.

---

## 8. Features

### MVP (v0 — must ship to be useful at all)
| # | Feature | Why |
|---|---|---|
| F1 | **Universal capture** — drag-drop, paste, file upload, share sheet (mobile), browser extension (desktop) | The loop dies without frictionless capture |
| F2 | **Masonry grid** — unified, performant, virtualized; mixed media in one flowing layout | The core canvas; the thing people see |
| F3 | **Rich previews** — auto-thumbnails for video/gif, OpenGraph/oEmbed for links, inline play on hover | "Visually see all my links" requirement |
| F4 | **Projects & Collections** | Organize by what's in your head |
| F5 | **Light / Dark mode + Apple-grade UI & micro-interactions** | The feel *is* the product |
| F6 | **Fast search & filter** (by type, project, tag, color) | Retrieval is the whole point |
| F7 | **Local-first storage + cloud sync** | Cross-device, offline, fast |

### V1 (the differentiators — what makes it Forage, not a bookmark app)
| # | Feature | Why |
|---|---|---|
| F8 | **AI auto-tagging & semantic search** ("brutalist UI in blue", "that video about diffusion") | Makes the archive queryable by intent |
| F9 | **Resurfacing engine** — a "Forage Digest" + contextual resurfacing when you open a project | Turns the graveyard into a living reference |
| F10 | **AI asset hub** — store generated video/image/code with the *prompt*, model, and source ref | Closes the input→output loop; nobody else does this |
| F11 | **Storyboard mode** | For AI video & sequenced design work |
| F12 | **Auto-summaries** of long articles / YouTube / X threads | "Remind me why I saved this" |

### Later (growth & delight)
- Visual similarity / "more like this"
- Shareable read-only project links (curated portfolios / mood boards)
- Multiplayer / shared projects
- Public template gallery
- API / integrations (Figma, Arc, Raycast, ComfyUI, Midjourney imports)

### 8.1 Universal Capture (F1)
- **Desktop:** browser extension (one click + right-click "Forage this"), global hotkey, drag-and-drop onto window or menubar, paste URL/image.
- **Mobile:** native share sheet target (the #1 mobile capture path), camera/screenshot import.
- **Smart paste:** detect URL → fetch metadata; detect image → store + palette; detect code → syntax-highlight.
- **Quick triage:** captured items land in an **Inbox**; assign to project later (capture now, organize never-or-later).

### 8.2 The Masonry Grid (F2/F3)
- Pinterest-style variable-height masonry, **virtualized** for thousands of items at 60fps.
- Mixed media in one grid: video tiles autoplay-on-hover (muted), GIFs loop on hover, vectors render crisply, links show rich cards, code shows a syntax-highlighted snippet.
- **Micro-interactions:** spring-based tile entrance, magnetic hover lift, smooth shared-element transition into detail view, drag-to-reorder with physics, palette-aware focus glow.
- Adjustable density (comfortable / compact), and grid ↔ feed ↔ board toggle.

### 8.3 Resurfacing Engine (F9) — *the core differentiator*
- **Forage Digest:** a periodic (daily/weekly, user-controlled) gentle resurfacing of items you haven't seen — "Three things from your *Type Studies* project."
- **Contextual resurfacing:** opening a project surfaces older relevant items and semantically related items from *other* projects ("You saved this for Project A — relevant here too").
- **On this day / rediscovery** without being gimmicky.
- Never an engagement-farming feed. Calm, infrequent, useful. User controls cadence (incl. "never").

### 8.4 Storyboard Mode (F11)
- A horizontal/grid sequence of **frames**; each frame can be an Item (image/video clip), a text beat, or a prompt.
- For AI video: order shots, attach the prompt/model per frame, add notes on transitions and direction.
- For design: sequence screens / user flows / narrative beats.
- Export storyboard as a shareable board or a contact-sheet image.
- Lives inside a Project.

### 8.5 AI Asset Hub (F10)
- When saving a generated asset, capture **prompt + model + parameters + source inspiration link**.
- Group **variations/versions** of the same generation.
- Filter "show me everything I made with [model]" or "all outputs derived from [reference]".
- This is the bridge between Forage-as-inspiration and Forage-as-portfolio.

---

## 9. UX & Design Principles

1. **Calm, not busy.** Generous whitespace, content-forward, chrome recedes. The media is the UI.
2. **Apple feel.** SF-style typography, soft depth, materials/blur, restrained color, content-driven accent (palette-aware).
3. **Motion with meaning.** Spring physics, shared-element transitions, momentum scrolling. Every interaction confirms itself with a subtle, premium response. Nothing janky, nothing gratuitous.
4. **Light & Dark as equals.** Both designed first-class, not one derived from the other. Auto-switch with system, manual override.
5. **Speed is a feature.** Sub-100ms interactions, optimistic UI, instant search. A slow inspiration tool is a dead one.
6. **Private by default.** It's the user's mind. No social pressure, no public-by-default.

---

## 10. Technical Architecture & Platform Strategy

**Goal:** one codebase, native-feeling, on macOS + iOS + Android, downloadable.

### Recommended stack
- **App shell:** **Tauri 2** — Rust core + web frontend, produces a real downloadable macOS app *and* iOS/Android binaries from one codebase, with much smaller/faster output than Electron and native system-webview rendering (great for the Apple feel). Native share-sheet and filesystem access via plugins.
- **Frontend:** **React + TypeScript**, **Tailwind CSS** for the design system, **Framer Motion** for micro-interactions, a virtualized masonry lib (custom or `masonic`-style) for grid performance.
- **Local-first data:** local SQLite (via Tauri) + a sync layer. Media cached locally; offline-capable.
- **Backend / sync / AI:** **Supabase** — Postgres + Auth + Storage + **pgvector** for semantic search embeddings. Object storage (Supabase Storage / S3) for media.
- **AI layer:** embeddings + auto-tagging + summaries via the latest **Claude** models (e.g. `claude-opus-4-8` for summaries/understanding, plus an embedding model for semantic search). Vision tagging for images.

### Trade-off noted
- The *absolute* best Apple feel would be native SwiftUI — but that abandons Android and doubles the work. **Tauri 2 is the recommended balance:** one codebase, real native binaries, web-tech velocity for the premium UI, and a path to all three platforms. (Alternative considered: Expo/React Native for mobile + Tauri/Electron for desktop sharing a component layer — more native widgets, but two UI runtimes to maintain. Recommendation: start Tauri 2 unified.)

### Why this serves the PRD
- One design system → consistent premium feel everywhere.
- Local-first → the speed principle.
- pgvector + Claude → the resurfacing & semantic-search differentiators are first-class, not bolted on.

---

## 11. Success Metrics

**North Star:** *Resurfaced items that get re-opened / used* — proof the loop is closed (saving leads to seeing leads to making).

Supporting metrics:
- Capture friction: median time-to-save (target < 3s).
- Activation: % of new users who capture 10+ items and create a project in week 1.
- Retention: % who return weekly; % who open a Forage Digest and click through.
- Loop closure: # of AI assets linked back to a source inspiration.
- Library health: items per active project; search → open rate.

---

## 12. Roadmap / Milestones

- **M0 — Foundation:** Tauri 2 + React scaffold, design system, light/dark theming, data model, local SQLite.
- **M1 — The Canvas:** masonry grid, item detail view, projects/collections, drag-drop & paste capture, core micro-interactions. *(Demo-able, genuinely usable single-player.)*
- **M2 — Capture everywhere:** browser extension + mobile share sheet, rich link/video/gif previews, Inbox triage.
- **M3 — Intelligence:** AI auto-tagging, semantic search, auto-summaries (Supabase + pgvector + Claude).
- **M4 — The Differentiators:** resurfacing engine + Forage Digest, AI asset hub.
- **M5 — Sequencing:** storyboard mode.
- **M6 — Polish & ship:** cross-platform builds, onboarding, performance pass, signed/notarized macOS build + mobile store prep.

---

## 13. Open Questions

1. **Sync model:** fully cloud-synced from day one, or local-first with opt-in sync later? (Affects M0 architecture.)
2. **Auth & accounts:** single-user local, or accounts from the start (needed for cross-device sync)?
3. **AI cost:** auto-summarize/tag everything on capture (better UX, higher cost) vs. on-demand?
4. **Mobile scope for v1:** full app, or capture-and-browse companion first?
5. **Monetization (later):** personal tool, or a product? (Changes nothing about MVP, but shapes the data model for sharing.)

---

*This is a living document. The Forage Loop (§7) is the spine — every proposed feature must serve Capture, Organize, Resurface, or Create, or it doesn't belong.*
