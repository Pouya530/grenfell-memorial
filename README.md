# Grenfell Tower Digital Memorial

An educational 3D reconstruction of Grenfell Tower in both its historical states
(1974 original and 2016 reclad), with a moderated tribute system: signed-in visitors
release short messages that float beside the tower inside green hearts.

In memory of the 72 people who lost their lives, 14 June 2017.

**Status: private prototype.** No public launch before community engagement
(see CONTEXT.md §3.1). No ads, no monetisation, ever.

---

## See it now (zero setup)

Open `prototype/prototype-v2.html` in any modern browser. This vanilla Three.js
prototype is the visual source of truth for the full build — geometry, palette,
heart animation timings all originate here.

## Repo map

| File | Purpose | Pipeline stage |
|---|---|---|
| `CONTEXT.md` | Requirements, ethical guardrails, stack, glossary | 3 |
| `SPEC.md` | Architecture, data models, RLS, scene + hearts spec, build order | 4 |
| `AGENTS.md` | Cursor agent roster with system prompts (incl. Sensitivity Reviewer veto) | 5 |
| `supabase/schema.sql` | Tables, triggers, RLS — run before building the app |  |
| `supabase/functions/tribute-prefilter/` | Edge Function: profanity pre-screen (flags, never decides) |  |
| `prototype/prototype-v2.html` | Working reference implementation |  |
| `.env.example` | Environment template |  |

## Full app quick start

```bash
# 1. Scaffold (Build step 1, SPEC §9)
npx create-next-app@latest grenfell-memorial --typescript --tailwind --app
cd grenfell-memorial
npm i three @react-three/fiber @react-three/drei zustand zod \
      @supabase/supabase-js @supabase/ssr obscenity

# 2. Supabase
#    - Create a project at supabase.com
#    - SQL editor → paste supabase/schema.sql → run
#    - Auth → Providers → enable Email (magic link), disable everything else
#    - Database → Replication → enable Realtime on public.tributes
cp .env.example .env.local   # fill in your project URL + anon key

# 3. Build steps 3–10 per SPEC §9, one Cursor agent session each,
#    using the matching system prompt from AGENTS.md.
npm run dev
```

### Make yourself a moderator (dev)

Sign in once via magic link, then in the SQL editor:

```sql
update public.profiles set is_moderator = true where id = '<your-user-uuid>';
```

`/moderate` returns 404 for everyone else by design.

## The rules that don't bend

1. No tribute appears publicly without human approval — the database enforces this,
   not the client.
2. The memorial line renders on every view and cannot be removed.
3. Documentary tone: the green heart is the only expressive element.
4. Data minimisation: display name + email, nothing else, no tracking.
5. Community engagement before any public launch.

See CONTEXT.md §3 for the full guardrails; the Sensitivity Reviewer agent
(AGENTS.md §2.4) holds veto power over all other work.
