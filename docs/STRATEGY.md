# Forage — Strategy, Positioning & Naming

Companion to [`../PRD.md`](../PRD.md). This is the "why it wins" document.

---

## 1. The Narrative (the story you tell in one breath)

> Every creative person runs two leaks at once. Inspiration pours in — videos, threads, sites, pins — and you tell yourself *later*. Work pours out — AI images, clips, code, design experiments — and it sinks into Downloads and dead project folders. Both streams vanish. **Forage is the one calm place that catches both, organizes them by the projects in your head, and brings the right thing back when you're actually making something.** Not a feed that wants your attention. A mind palace that gives you yours back.

### Why now
- **AI made everyone a high-volume producer.** People generate dozens of images/clips/snippets a day. The output-management problem is brand new and unsolved — bookmark apps never had to think about *your own* media.
- **Inspiration is more fragmented than ever** — it's split across X, YouTube, Pinterest, Arc, Figma, screenshots. There's no neutral home that holds *all* media types as equals.
- **Taste is the differentiator in an AI world.** A tool that helps you curate and resurface your taste is increasingly valuable, not less.

---

## 2. Positioning Statement

**For** multi-project designers, builders, and AI creators
**who** lose the things they save and the things they make,
**Forage is** a private, local-first creative library
**that** unifies found inspiration and generated work in one beautiful masonry canvas and resurfaces it for the project you're on.
**Unlike** bookmark managers (link-only, no resurfacing) and Pinterest (public discovery feed built for *their* engagement),
**Forage** connects your inputs to your outputs and brings your archive back to you — privately, on your machine, with craft you can feel.

---

## 3. The "Why Not Just…" Objection Handling

These are the exact pushbacks Forage will face. Each has a one-line kill.

- **"Why not a Pinterest board?"** → Pinterest is a public discovery network optimized to keep you scrolling *their* content; it can't hold your videos, code, vectors, or AI outputs, and it never brings *your* saves back for *your* projects.
- **"Why not Raindrop/Pocket?"** → Those are link lists. Forage is a visual canvas for *all* media — and it stores the work you *make*, not just links you find.
- **"Why not a Figma/FigJam board?"** → Great for one active board; terrible as a growing personal library across dozens of projects with capture-from-anywhere and resurfacing.
- **"Why not Notion?"** → Notion is a database you must lovingly maintain. Forage is content-forward and effortless: capture in 3 seconds, organize never-or-later, and the archive works *for* you.
- **"Why not just Finder folders?"** → Folders are where creative work goes to die. No previews-as-grid, no cross-project links, no resurfacing, no input↔output graph.

---

## 4. The Moat (what compounds and is hard to copy)

1. **The input→output graph.** Forage is the only place that knows *the reference that inspired a piece* and *the piece you made*. Over time this becomes a personal creative knowledge graph no competitor has.
2. **Resurfacing tuned to you, not engagement.** Incumbents' feeds serve their metrics. Forage's resurfacing serves *your* projects — a fundamentally different (and trust-building) objective.
3. **Craft + privacy as product.** For a taste-driven audience, feel and "this is mine, not surveilled" are features. Hard to fake, easy to love, compounding through word-of-mouth.
4. **Your own library is the lock-in.** The more you forage, the more irreplaceable it gets — switching cost is your own curated taste.

---

## 5. Naming

**Forage** is the right name. Keep it. Rationale:
- **Active, not passive.** "Foraging" implies intentional gathering of valuable things from the wild — exactly the behavior, and warmer than "save/bookmark/archive."
- **Ownable & evocative.** Organic, earthy, memorable; differentiates from the cold utility names (Pocket, Raindrop, Instapaper).
- **Verb-able.** "Forage it" works as a capture action (cf. "Google it", "Pin it").

**Tagline candidates** (pick one as primary):
1. **"Gather what inspires you. Find it when it matters."** *(clearest — recommended)*
2. "A home for everything you'll come back to."
3. "Where your inspiration and your work finally live together."
4. "Catch the things you'd otherwise lose."

**Vocabulary system** (lean into the metaphor, lightly — don't overdo it):
- Capture → **Forage** / "add to your basket"
- Inbox → **The Basket** (unsorted finds)
- Project → **Project** (keep it literal; don't get cute here)
- Resurfacing digest → **The Forage Digest**
- Empty state → "Your basket is empty — go forage something."

---

## 6. Go-to-Market (lightweight, later)

Forage is personal-first; it doesn't need a GTM to be valuable to you. But if it becomes a product:
- **Wedge:** AI creators overwhelmed by their own output — an underserved, fast-growing, taste-driven audience that lives on X.
- **Distribution:** build in public on X (the audience is already there), shareable read-only boards as organic top-of-funnel, Raycast/Arc/Figma integrations for reach.
- **Pricing (hypothesis):** generous free local tier; paid unlocks cloud sync + AI features + larger storage. Charge for the infra that costs money, give the craft away.

---

## 7. Risks & Mitigations

| Risk | Mitigation |
|---|---|
| "Yet another save app" perception | Lead every surface with resurfacing + AI-asset features, not capture; the demo must show the *loop closing*, not a grid filling. |
| Scope creep into an editor / Notion clone | The Forage Loop (§7 in PRD) is the gate. If a feature isn't Capture/Organize/Resurface/Create, cut it. |
| Capture friction kills the habit | Obsess over the <3s capture path on every platform; it's the top engineering priority after the grid. |
| AI cost at scale | Hybrid processing (cheap-on-capture, expensive-on-demand) + local embeddings; bring-your-own-key option for power users. |
| Local-first sync complexity later | Schema is sync-ready from day one (UUIDs, timestamps, soft-deletes) so sync is additive, not a rewrite. |
