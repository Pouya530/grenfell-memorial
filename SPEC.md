# SPEC.md — Grenfell Tower Digital Memorial: Technical Specification

> **Generated from**: CONTEXT.md (Step 3 of Venture Pipeline)
> **Purpose**: Complete implementation blueprint for Claude Code in Cursor
> **Stack**: Next.js 14+ App Router / TypeScript strict / R3F / Supabase / Vercel
> **Visual source of truth**: `prototype/prototype-v2.html` — when in doubt, match it.

---

## 1. Architecture Overview

```
Browser
├── Next.js App (Vercel)
│   ├── /            → Scene page (R3F canvas + DOM overlays)
│   ├── /moderate    → Moderation console (role-gated, SSR)
│   └── /api/tributes → POST (Zod-validated, pre-filtered, inserts as 'pending')
├── Supabase
│   ├── Auth         → magic link only
│   ├── Postgres     → profiles, tributes, moderation_log (RLS on everything)
│   ├── Realtime     → postgres_changes on tributes (status=approved)
│   └── Edge Function→ tribute-prefilter (obscenity screen → flag, never auto-reject)
└── Static assets    → sky texture generated at runtime (no asset pipeline in MVP)
```

Data flow for a tribute:
`compose → POST /api/tributes → Zod → Edge prefilter (sets flagged bool) → insert status='pending' → moderator approves → Realtime broadcast → heart spawns for all connected clients`

## 2. File Structure

```
app/
  layout.tsx                 # fonts, metadata, memorial line in footer slot
  page.tsx                   # main scene page
  moderate/page.tsx          # moderation console (server component + client queue)
  api/tributes/route.ts      # POST handler
components/
  scene/
    MemorialScene.tsx        # Canvas, camera rig, lights, fog, sky
    Sky.tsx                  # canvas-texture gradient + puff clouds (port from prototype)
    Ground.tsx               # grass circle, path apron, finger blocks, trees
    Tower1974/
      index.tsx              # assembles shaft + podium + crown + roof
      Shaft.tsx              # spandrel bands, window strips, white panels, piers
      Podium.tsx             # pilotis, mezz band (pink/glazing), deck, stair, screen wall, canopies
      Crown.tsx              # openings row, parapet, plant box, rails, mast
    Tower2016/
      index.tsx              # clad grid, crown fins, enclosed podium, canopy
    CameraRig.tsx            # orbit: theta/phi/radius, damping, autorotate, pinch
  overlay/
    RecordCard.tsx           # archival card: facts, era toggle, orbit checkbox
    TributePanel.tsx         # sign-in / compose states
    MemorialLine.tsx         # permanent — imported by layout, cannot be removed by a page
    HeartsLayer.tsx          # spawner + <FloatingHeart/> (DOM, CSS keyframes from prototype)
lib/
  tower-dimensions.ts        # ALL geometry constants (values from prototype §dimensions)
  materials.ts               # useMemo'd material palette (1974 + 2016 + context)
  schemas.ts                 # Zod: TributeInsert, Tribute, Profile, ModerationAction
  strings.ts                 # every user-facing string
  supabase/
    client.ts / server.ts    # typed clients
    tributes.ts              # submitTribute, subscribeApproved, listQueue, review
supabase/
  schema.sql                 # tables + RLS + trigger (in repo, run via SQL editor or CLI)
  functions/tribute-prefilter/index.ts
prototype/prototype-v2.html  # reference implementation
reference/                   # photos (gitignored)
```

## 3. Data Models (see supabase/schema.sql for DDL)

**profiles** — `id uuid PK → auth.users`, `display_name text (2–24 chars)`,
`is_moderator boolean default false`, `created_at`.
Created by trigger on auth signup; display_name set on first sign-in.

**tributes** — `id uuid PK`, `user_id → profiles`, `display_name text` (snapshot),
`message text` (CHECK 1–60 chars), `status text CHECK in ('pending','approved','rejected')
default 'pending'`, `flagged boolean default false` (prefilter hit),
`created_at`, `reviewed_by uuid null`, `reviewed_at timestamptz null`.

**moderation_log** — `id`, `tribute_id`, `moderator_id`, `action ('approve'|'reject')`,
`note text null`, `created_at`. Insert-only audit trail.

### RLS (the security model — implement exactly)
- `profiles`: user can select/update own row (display_name only); moderators select all.
- `tributes`:
  - INSERT: authenticated, `user_id = auth.uid()`, status forced 'pending' by trigger
    (client cannot set status), AND rate limit: reject if the user has a tribute in the
    last 10 minutes (enforced by `before insert` trigger).
  - SELECT: anyone (including anon) can read rows where `status='approved'`;
    owner can read own rows any status; moderators read all.
  - UPDATE: moderators only, and only `status/reviewed_by/reviewed_at`.
- `moderation_log`: moderators insert + select. No update/delete for anyone.
- Realtime publication: `tributes` filtered `status=eq.approved` client-side; RLS
  guarantees pending rows never reach anon subscribers.

## 4. API Contract

`POST /api/tributes`
Body (Zod `TributeInsert`): `{ message: string }` — trim, 1–60 chars, no URLs
(regex reject `https?://|www\.`), no email addresses.
Flow: auth check → Zod → call Edge prefilter → insert. Returns
`201 {id, status:'pending'}` | `400` validation | `401` | `429` rate-limited.
UI copy on success (strings.ts): *"Thank you. Your message will appear after review."*

## 5. 3D Scene Specification

Port the prototype **verbatim** — same dimensions, same material colours, same layout.
Key constants (already correct in prototype, move to `tower-dimensions.ts`):

```ts
PLAN 21.9  FLOOR_H 2.64  CORNER 1.05  BAYS 4 (1974) / COLS 6 (2016)
PILOTI_H 3.8  MEZZ_H 5.0  PODIUM_H 8.8  RES_FLOORS 20  CROWN_H 2.7  ROOF_Y ≈ 64.3
```

- **Instancing**: the prototype uses individual meshes; the R3F port should use
  `<Instances>` (drei) for windows, white panels, spandrels and piers — one instance
  group per (material × era). Target < 60 draw calls per era.
- **Era switching**: both towers mounted, `visible` toggled (matches prototype; no
  remount cost). Zustand store: `{ era: '1974'|'2016', autoRotate: boolean }`.
- **Camera**: spherical orbit, phi ∈ [0.35, 1.52], radius ∈ [45, 420], initial
  (θ 0.35, φ 1.24, r 155), target y = ROOF_Y × 0.44, autorotate +0.0015 rad/frame,
  pause while dragging, damping 0.08. Disable autorotate if `prefers-reduced-motion`.
- **Sky**: runtime canvas texture — vertical gradient `#5fa8e6 → #9cc8ee → #e8f1f8`
  plus 6 puff-cluster clouds (port `makeSky()` exactly). Fog `#e8f1f8` 280–750.
- **Lights**: hemisphere (`#dcecff`/`#8c8a7c`, 0.85) + directional sun
  (`#fff0d8`, 1.15, pos [-95,120,85], 2048 shadow map, bias −0.0005).
- **Performance budget**: 60fps on M-series laptop, ≥30fps mid-range Android.
  DPR clamp 2. No postprocessing in MVP.

## 6. Hearts Layer Specification

DOM overlay, `position:fixed`, `pointer-events:none`, above canvas, below cards.

- Spawn zones: left 3–18vw, right 78–93vw (tower always clear). Alternate sides.
- Composition per heart: outer `rise` (translateY 0 → −100vh+120px, opacity 0→1→1→0,
  8–11.5s linear) → middle `sway` (±18–40px translateX, ±3° rotate, 2.8–4.4s
  ease-in-out alternate) → inner `pop` (scale 0 → 1.12 @60% → 1, rotate −14°→3°→0,
  0.55s cubic-bezier(.2,1.7,.45,1)).
- Heart: SVG path from prototype, greens `#0f8148 #15995a #0b6b3c #1a8f57`,
  size 108–152px, drop-shadow. Message centered, 11.5px white; attribution
  `— name` in 9px @75% opacity.
- Rotation pool: approved tributes shuffled; one spawn / 2.7s; hard cap 9 concurrent;
  pause when `document.hidden`. A visitor's own just-approved tribute spawns
  immediately on the Realtime event.
- Seeded tributes (strings.ts) fill the rotation until ≥8 approved rows exist.
- `prefers-reduced-motion`: fade in/out in place, no rise/sway/pop.

## 7. Overlay UI

Match prototype CSS exactly (palette, Georgia display / system body, 1px `--line`
borders, archival card shadows). Components: RecordCard (top-left), TributePanel
(top-right; bottom-right ≤760px), MemorialLine (bottom-left, permanent), hint
(bottom-right, hidden on mobile/reduced-motion).

TributePanel states: `signed-out → magic-link-sent → signed-in(compose)`.
Compose: 60-char counter, "Release a heart" button, post-submit confirmation state.

## 8. Moderation Console (`/moderate`)

- Server component checks `profiles.is_moderator`; non-moderators → 404 (not 403 —
  don't advertise the route).
- Queue: oldest first, `flagged` rows visually marked (amber left border), message +
  display_name + relative time. Approve / Reject buttons; optional note on reject.
- Keyboard: `a` approve, `r` reject, `j/k` navigate.
- Every action writes `moderation_log`. Realtime updates the queue live.

## 9. Build Order (each step = one Cursor agent session)

1. Scaffold: create-next-app, Tailwind, deps (`three @react-three/fiber @react-three/drei zustand zod @supabase/supabase-js @supabase/ssr obscenity`), palette tokens, strings.ts, tower-dimensions.ts
2. Supabase: run schema.sql, generate types, typed clients, auth (magic link) flow
3. Scene shell: Canvas, Sky, lights, fog, Ground, CameraRig
4. Tower1974 (Shaft → Crown → Podium) — validate against prototype screenshots side-by-side
5. Tower2016 + era toggle + RecordCard
6. HeartsLayer with seeded pool
7. TributePanel + POST route + prefilter Edge Function
8. Realtime subscription → live heart spawns
9. Moderation console + moderation_log
10. A11y & perf pass (reduced motion, focus, draw calls, mobile), Vercel deploy (password-protected preview until community engagement — CONTEXT §3.1)

## 10. Testing

- Unit: schemas (message length/URL rejection), rate-limit trigger, spawn-zone maths.
- RLS: anon cannot read pending; user cannot set status; non-moderator cannot update.
  (Supabase CLI `db test` with pgTAP or scripted client asserts.)
- Visual: Playwright screenshot of each era vs stored prototype captures, diff < 5%.

## 11. Phase 2 (separate spec later — do not build now)

Drawing-validated geometry from RBKC planning refs → corrections to
tower-dimensions.ts; photogrammetry texture pass (Meshroom/RealityCapture from
archival imagery) → glTF facade detail with Draco; annotation hotspots
(architectural education layer); community-partnership features as guided by
Grenfell United / Memorial Commission conversations.
