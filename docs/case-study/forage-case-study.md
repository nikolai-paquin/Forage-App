# Forage — Case Study Copy

> Drop-in copy for the portfolio page. Each block maps to a section. Tone:
> confident, first-person, specific. Trim to taste — portfolio readers scan.

---

## HERO

**Forage**
Gather what inspires you. Find it when it matters.

A calm, fast, local-first home for everything a creative gathers and generates —
designed *and* built end to end, and shipped to the web, mobile, and macOS.

`Role: Design + Build (solo)` · `2025` · `React · TypeScript · Tailwind · Framer Motion · Tauri`

[ Live demo → ] [ Mac app → ]

---

## OVERVIEW

Forage is a visual library for the things creatives collect — images, links,
video, audio, code, AI work — and the things they make from them: moodboards,
storyboards, palettes, fonts, and brand kits.

I designed the whole product and then built it: a real, shipping app, not a
mockup. It runs in any browser, installs as a mobile app, and ships as a native
Mac app — and your library lives on your device, working fully offline.

**My role:** product design, interaction & motion design, design system, and
front-to-back engineering.

---

## THE PROBLEM

Inspiration and assets die in folders, browser tabs, camera rolls, and
"saved for later" limbo. The stuff that should fuel the work is scattered across
ten tools, none of which are built for *making* — only for hoarding.

I wanted one place that respects how creative work actually flows: grab things
fast, organize them the way they live in your head, and have them resurface at
the exact moment you're making something.

---

## PRINCIPLES

Four rules shaped every decision:

- **Calm.** Generous space, soft motion, no noise. The work is the hero.
- **Fast.** Capture in two keystrokes; everything is one shortcut away.
- **Local-first.** Your library is yours, on your device, offline by default.
  Online features (AI, sync, sharing) are opt-in — never required.
- **Beautiful by default.** A real design system: type scale, color tokens, a
  consistent corner/elevation language, light and dark.

---

## THE FORAGE LOOP

The product is organized around a loop, not a folder tree:

**Capture → Organize → Resurface → Make → (and back again).**

Everything in the app exists to keep that loop turning with as little friction
as possible.

*(diagram: forage-loop.svg)*

---

## DESIGN WALKTHROUGH

### Capture anything, in two keystrokes
Paste a link and it unfurls into a rich bookmark — real title, description, and
preview. Drag images onto the window, paste a snippet, or save from the browser
extension and the mobile share sheet. Press ⌘N from anywhere.

### A library that's a pleasure to scroll
A live masonry grid holds it all, at a density you control. Filter by type,
source, or tag — or by **color**: pick a hue and the whole library reorganizes
around it.

### Detail that does real work
Open any save and you get its palette (sampled with an eyedropper), an
AI-generated prompt, tags, the collections it lives in, and the "derived from"
graph linking inputs to outputs.

### Organize the way you think
Manual **collections**, **smart collections** that gather themselves by type or
source, **moodboards** on an infinite canvas (drag, annotate, present), and
**storyboards** for sequencing a narrative.

### Tools for design, not just storage
Save and extract **color palettes** (hover to read hex, click to copy),
**fonts** previewed in their real typeface, and **brand kits** that bundle a
palette, fonts, and references — exportable as CSS in one click.

### Intelligence where it helps
Opt-in AI (Claude) auto-tags saves, writes image prompts, and powers
"find by vibe" semantic search — all behind a single endpoint you control.

---

## CRAFT DETAILS

- **Motion.** Spring-based, restrained — tiles settle, sheets glide, nothing
  bounces for the sake of it.
- **Sound.** Optional, synthesized UI sounds with a "variety" mode and a distinct
  trash cue — designed, not stock.
- **Theming.** A full light/dark system on design tokens.
- **Responsive & mobile.** A dedicated mobile pass: bottom tab bar, full-screen
  detail sheets, touch-friendly controls, pinch-to-zoom on the canvas.
- **Speed.** Command palette (⌘K), full keyboard navigation, instant local data.

---

## BUILDING IT

I built the whole thing: **React + TypeScript + Vite + Tailwind CSS + Framer
Motion** on the front end; **IndexedDB** for a local-first library that holds
images without hitting storage limits; **Cloudflare Workers** for the optional
online layer (Claude for AI, KV for sync, an unfurl/image proxy, and read-only
sharing); and **Tauri 2** to ship it as a native Mac app from the same codebase.
It's a PWA, so it installs on a phone and runs offline.

*(diagram: architecture.svg)*

---

## OUTCOME

Forage shipped to three places from one codebase:

- **Web** — live, installable as a PWA.
- **Mobile** — installable, offline, with a touch-tuned UI.
- **macOS** — a native app via Tauri.

It's a complete, working product with a curated live demo — designed, built, and
released solo.

---

## REFLECTION

The biggest lesson was that "calm" is an engineering problem as much as a visual
one: local-first data, optimistic interactions, and tight motion are what make
the app *feel* quiet. Designing and building it myself meant every interaction
detail survived the trip from Figma to production — nothing got lost in handoff,
because there wasn't one.

**Next:** native mobile builds, richer sync, and collaborative collections.
