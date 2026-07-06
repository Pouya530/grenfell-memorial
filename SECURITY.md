# SECURITY.md — Grenfell Tower Digital Memorial

This is a memorial. It will attract goodwill, and it may attract abuse.
Security here protects three things: **visitors' data**, **the dignity of the
tribute wall**, and **the integrity of the site itself**.

## Reporting a vulnerability

Email **security@grenfell.memorial** (or the repo owner directly). Please include
steps to reproduce. We aim to acknowledge within 48 hours and fix critical issues
within 7 days. Good-faith research is welcome; please don't test against real
visitors' data or post proof-of-concept tributes publicly.

Out of scope: volumetric DoS, clickjacking on pages with no state-changing actions,
missing best-practice headers on third-party domains we don't control.

## The security model in one paragraph

The client is untrusted. Every rule that matters — tributes are pending until a human
approves them, users can't change status, one tribute per user per 10 minutes,
anonymous visitors can only ever read approved rows — is enforced by Postgres RLS and
triggers in `supabase/schema.sql`, not by application code. If the entire frontend
were replaced by a hostile client, the moderation model would still hold.

## Controls checklist

### Database (implemented in schema.sql)
- [x] RLS enabled on every table; no table readable or writable without a policy
- [x] `status` forced to `'pending'` by `before insert` trigger regardless of payload
- [x] Rate limit (10 min/user) enforced in-database, not in JS
- [x] Moderator role changes cannot be self-granted (profiles UPDATE policy)
- [x] No DELETE policies on tributes/moderation_log — audit trail is append-only
- [x] `security definer` functions pin `search_path = public`

### Application
- [ ] Zod validation on every API boundary; reject URLs and email addresses in messages
- [ ] `SUPABASE_SERVICE_ROLE_KEY` used server-side only, never in `NEXT_PUBLIC_*`
- [ ] Auth: magic link only — no passwords to leak, no OAuth scope creep
- [ ] `/moderate` returns 404 (not 403) to non-moderators — don't advertise the route
- [ ] Moderation console renders tribute text as text (React default) — no
      `dangerouslySetInnerHTML` anywhere in the repo (CI grep check)
- [ ] Magic-link emails via a domain with SPF + DKIM + DMARC (see DEPLOY.md) to
      prevent spoofed "memorial" emails

### Headers — `next.config.mjs`

```js
const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  { key: "Content-Security-Policy", value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'",          // Next.js inline runtime; move to nonces post-MVP
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
      "font-src 'self'",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join("; ") },
];
```

### Abuse & content safety
- Human moderation of 100% of tributes before visibility (the primary control)
- `obscenity` prefilter flags likely-abusive content for priority review — it never
  auto-decides in either direction
- Rate limiting caps flood attempts at 6 tributes/user/hour; magic-link auth adds an
  email-verification cost per identity
- Moderator handbook (`docs/moderation.md`) covers doxxing attempts, names of real
  individuals, and coordinated abuse — when in doubt, hold and discuss
- If sustained targeted abuse occurs: pause new-tribute intake via a single
  `INTAKE_PAUSED` env flag (build this switch in step 7)

### Data protection (UK GDPR)
- Data collected: email (auth) + display name + tribute text. Nothing else. No
  analytics SDKs, no tracking pixels, no fingerprinting.
- Lawful basis: consent (user-initiated sign-up to leave a tribute).
- Right to erasure: deleting the auth user cascades profile + tributes (FKs on
  delete cascade). Document the request route on the site's privacy page.
- Data stays in Supabase's EU region — select **eu-west** at project creation.

### Dependencies & pipeline
- `npm audit` + Dependabot on the repo; lockfile committed; no postinstall scripts
  from unvetted packages (run your NodeGuard checks — this is exactly its use case)
- Vercel deploy protection (password) stays ON until community engagement completes
- Production env vars set in Vercel only — never committed; `.env*` gitignored

## What we deliberately don't have

No ads, no third-party scripts, no cookies beyond Supabase auth, no analytics,
no user-uploaded media, no comments/replies, no DMs. The smallest possible attack
surface is also the most respectful product.
