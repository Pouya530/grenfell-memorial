# CONTEXT.md — Grenfell Tower Digital Memorial

> **Pipeline stage**: 3 of 7 (Requirements / Context Doc)
> **Project code**: NC-HER-001 (Heritage vertical — first entry)
> **For**: Claude Code / Cursor agents
> **Prototype**: `prototype/prototype-v2.html` (working vanilla Three.js reference — treat as the visual source of truth)

---

## 1. What This Is

A web-based educational memorial and architectural reconstruction of Grenfell Tower,
Lancaster West Estate, North Kensington, London W11 — preserving the building digitally
in both of its historical states:

- **1974–2015 (original)**: Buff ribbed-concrete piers, dark aggregate spandrel bands,
  white infill panels, pilotis podium with mauve panel band, walkway deck, broad
  entrance stair, screen-block wall, blue canopies, rooftop plant and lattice mast.
- **2016 (as reclad)**: Light grey ACM rainscreen panel grid, vertical window columns,
  angled crown fins, enclosed community levels.

Visitors explore an interactive 3D scene and, after signing in, release a **green heart
tribute** — a short message that floats up beside the tower with a gentle pop-and-drift
animation (reference: the prototype's TikTok-like heart release). Tributes are
human-moderated before they appear publicly, and approved tributes appear live for all
visitors via realtime subscription.

**This is not a commercial product.** No ads, no monetisation, no gamification, no
engagement metrics. Sustainability comes from grants / heritage funding (natural
adjacency: Nocturnal Cloud's Khalili Foundation cultural-heritage relationship).

---

## 2. Why It Matters (and Why Now)

- 72 people lost their lives on 14 June 2017. The tower is a site of national memory.
- The physical structure is being carefully dismantled. Once it is gone, digital
  reconstruction becomes one of the primary ways future generations experience the
  building's architecture and understand the story of the refurbishment.
- Rich source material exists: RBKC planning portal (2012–2016 refurbishment drawings,
  elevations, sections), extensive archival photography, inquiry survey data, and
  Forensic Architecture's media-sourced 3D investigation model — proving the
  photogrammetry approach works for this building.

## 3. Ethical Guardrails (NON-NEGOTIABLE — read before writing any code)

1. **Community first.** Before any public launch, engagement with Grenfell United and
   the Grenfell Tower Memorial Commission is required. The build proceeds as a private
   prototype until that conversation happens. No marketing, no social posts, no press.
2. **Moderation before visibility.** No tribute is ever publicly rendered without human
   approval. There is no "post first, review later" mode. Ever.
3. **Restraint in design.** Documentary, archival tone. The green heart (the community's
   own symbol) is the single expressive element. No fire imagery, no red/orange palette
   accents, no dramatisation, no sound effects.
4. **Data minimisation.** Sign-in exists solely to attribute and rate-limit tributes.
   Collect display name + email (via magic link) and nothing else. No analytics beyond
   privacy-respecting page counts. No tracking pixels.
5. **The memorial line is permanent.** "In memory of the 72 people who lost their
   lives, 14 June 2017" appears on every view, always.
6. **Accuracy with honesty.** Geometry is labelled "approximate" until validated against
   planning drawings. Never present the model as survey-grade unless it is.

## 4. Users

| User | Need |
|---|---|
| Students / educators | Understand the building's architecture and the significance of the 2016 recladding |
| Community & diaspora | A quiet place to leave a tribute, from anywhere in the world |
| Researchers / journalists | Accurate massing + era comparison as reference material |
| Moderators (trusted, small team) | Fast, humane review queue for incoming tributes |

## 5. Product Definition (MVP)

1. **3D scene** — the prototype's reconstruction ported to React Three Fiber:
   era toggle (1974 / 2016), slow auto-orbit, drag/pinch controls, blue sky with soft
   clouds, warm afternoon light, estate context (finger blocks, trees, entrance clear).
2. **Tribute system** — Supabase magic-link auth → compose (≤60 chars) → pending →
   moderator approval → enters the floating rotation for all visitors (Realtime).
3. **Heart animation** — pop-in with overshoot, upward drift with sway in the left/right
   margins (tower stays clear), fade at top, max ~9 concurrent, reduced-motion fallback.
4. **Info layer** — the archival record card (facts, era toggle) and memorial line,
   styled exactly as the prototype.
5. **Moderation console** — `/moderate` route, role-gated: queue, approve/reject,
   audit trail.

### Explicitly OUT of scope for MVP
- Photogrammetry / glTF facade detail (Phase 2 — see SPEC §11)
- Interior reconstruction (likely never — private homes; requires community guidance)
- Public API, embeds, VR/AR
- Any timeline or narrative of the fire itself (requires community partnership first)

## 6. Tech Stack (locked)

| Layer | Choice | Notes |
|---|---|---|
| Framework | Next.js 14+ App Router, TypeScript strict | House standard |
| 3D | React Three Fiber + drei + three | Port prototype geometry 1:1 |
| Styling | Tailwind + CSS variables from prototype palette | `--paper #f0eee9`, `--ink #22252a`, `--heart #0f8148`, `--line #c9c5bc`, `--muted #6d6a63` |
| Auth / DB / Realtime | Supabase (magic link only — no passwords, no OAuth for MVP) | RLS everywhere |
| Validation | Zod at every boundary | |
| Hosting | Vercel | |
| Profanity pre-filter | `obscenity` npm package in an Edge Function (pre-screen only — humans still approve) | Free, no API cost |

**API cost model**: £0/month at MVP scale (Supabase free tier: 50k MAU auth,
500MB DB, 2M Realtime messages). Vercel Hobby → Pro (£16/mo) only if traffic demands.

## 7. Source Material for Accuracy Work

- Prototype geometry constants (PLAN 21.9m, FLOOR_H 2.64m, 20 residential floors,
  crown 2.7m, podium 8.8m ≈ 67m total) — carry into `lib/tower-dimensions.ts`.
- RBKC planning portal refs for the 2012–2016 refurbishment (elevations/sections) —
  Phase 2 validation source.
- Three user-supplied reference photos (aerial 1974 state, 2016 reclad, podium/entrance
  detail) — stored in `reference/` (not committed publicly if licence unclear).

## 8. Domain Glossary

| Term | Meaning |
|---|---|
| Pilotis | Ground-level support columns leaving the ground floor open |
| Spandrel | The band of wall between window heads and the sill above |
| ACM | Aluminium composite material — the 2016 rainscreen cladding panels |
| Rainscreen | Outer cladding layer standing off the structural wall |
| Crown | The tower's top plant level (1974: small dark openings; 2016: angled fins) |
| Finger blocks | The low linear blocks of Lancaster West Estate around the tower |
| Green heart | The Grenfell community's symbol of remembrance |
| Tribute | A moderated ≤60-character message rendered inside a floating green heart |

## 9. Development Guidelines

- TypeScript strict; no `any`. Zod schemas in `lib/schemas.ts` are the single source
  of truth for all data shapes.
- All Supabase access through typed helpers in `lib/supabase/`. Never raw client calls
  in components.
- 3D code lives in `components/scene/`; each architectural element is its own component
  (`TowerShaft1974.tsx`, `Podium1974.tsx`, `Crown2016.tsx`, …) driven by the shared
  constants file, so drawing-based corrections in Phase 2 are one-file edits.
- Hearts are DOM overlay (not 3D sprites) — matches prototype; crisper text, cheaper.
- `prefers-reduced-motion` honoured everywhere; keyboard focus visible; WCAG AA contrast.
- Any copy shown to users goes through `content/strings.ts` — reviewed as a whole for tone.

---

**Next step**: Open SPEC.md in a fresh context for the full technical specification,
then AGENTS.md for the build roster.
