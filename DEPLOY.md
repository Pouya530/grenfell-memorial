# DEPLOY.md — Going Live on grenfell.memorial

> Domain: **grenfell.memorial** (registered at Porkbun ✓)
> Hosting: Vercel · Backend: Supabase (eu-west) · Cost at MVP scale: £0/month
> Gate: keep Vercel password protection ON until CONTEXT.md §3.1 (community
> engagement) is complete. DNS and infrastructure can all be set up now.

---

## What's needed from you (the complete list)

1. **Porkbun** — one DNS change (Option A below, ~2 minutes)
2. **Vercel** — create project, connect repo, add 3 env vars, add the domain
3. **Supabase** — create project (region: eu-west), run `schema.sql`, enable
   magic-link email auth + Realtime on `tributes`, copy URL + keys
4. **Email sender** (recommended) — free Resend account + 3 DNS records, so
   magic links come from `@grenfell.memorial` and don't hit spam
5. **Post-deploy** — promote your account to moderator (one SQL line), run the
   SEO launch checklist (SEO.md §8)

Nothing else. No payment details needed anywhere at MVP scale.

---

## Step 1 — DNS at Porkbun

**Option A (recommended): hand DNS to Vercel.**
Porkbun → Domain Management → grenfell.memorial → Nameservers → change to:

```
ns1.vercel-dns.com
ns2.vercel-dns.com
```

Vercel then manages all records, SSL renewals, and the www redirect automatically.

**Option B: keep Porkbun DNS.** Add:

| Type  | Host | Answer                |
|-------|------|-----------------------|
| A     | @    | 76.76.21.21           |
| CNAME | www  | cname.vercel-dns.com  |

(Delete Porkbun's default parked-page ALIAS/CNAME records first or they conflict.)

Propagation: usually minutes, up to 24h. SSL: Vercel issues Let's Encrypt
automatically once DNS resolves — nothing to buy, .memorial works like any TLD.

## Step 2 — Vercel

1. Import the GitHub repo (push the bundle first). Framework preset: Next.js.
2. Settings → Environment Variables (Production + Preview):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only; never `NEXT_PUBLIC_`)
3. Settings → Domains → add `grenfell.memorial` (primary) and
   `www.grenfell.memorial` (redirect to apex, 308).
4. Settings → Deployment Protection → **Password Protection: ON** (the launch gate).
5. `.vercelignore` (in repo) strips all `.md` files, `prototype/`, `reference/`,
   and `supabase/` from the deployment — only core app files ship. Verify in the
   deployment's "Source" tab after first build.

## Step 3 — Supabase

1. New project → region **eu-west** (UK GDPR posture, SECURITY.md).
2. SQL Editor → paste `supabase/schema.sql` → Run.
3. Authentication → Providers: enable **Email**, switch to magic link (OTP off,
   password off). Disable all other providers.
4. Authentication → URL Configuration:
   - Site URL: `https://grenfell.memorial`
   - Redirect URLs: `https://grenfell.memorial/**`, plus your
     `https://*-<team>.vercel.app/**` preview pattern for testing.
5. Database → Replication → enable Realtime on `public.tributes`.
6. Edge Function: `supabase functions deploy tribute-prefilter`.

## Step 4 — Magic-link email deliverability (do this — it matters)

Supabase's built-in sender (3 emails/hour) is fine for dev but will rate-limit and
spam-folder in production. Free fix:

1. Resend (resend.com) free tier → add domain `grenfell.memorial`.
2. Add the 3 records Resend gives you at Porkbun/Vercel DNS (DKIM TXT, SPF TXT,
   MX for bounces). Also add a DMARC record:
   `_dmarc TXT "v=DMARC1; p=quarantine; rua=mailto:security@grenfell.memorial"`
3. Supabase → Authentication → SMTP: point at Resend
   (sender: `hearts@grenfell.memorial`, name: "Grenfell Tower Digital Memorial").
4. Porkbun email forwarding (free): `security@` and `hello@grenfell.memorial`
   → your inbox (referenced by SECURITY.md and llms.txt).

## Step 5 — Post-deploy

```sql
-- make yourself a moderator (Supabase SQL editor, after first sign-in)
update public.profiles set is_moderator = true where id = '<your-user-uuid>';
```

- Verify: `/robots.txt`, `/llms.txt`, `/sitemap.xml`, `/og-image.png`, `/favicon.svg`
- Run SEO.md §8 launch checklist (Rich Results Test, OG card preview, Lighthouse)
- Send a test tribute → confirm it does NOT appear pre-approval → approve in
  `/moderate` → confirm the heart spawns live in a second browser
- Search Console + Bing Webmaster: add property, submit sitemap
  (indexing can start pre-launch even behind password? **No** — do this at launch,
  crawlers can't pass the password gate; it's the last step before going public)

## Launch-day flip (after community engagement)

1. Vercel → Deployment Protection → OFF
2. Submit sitemap in Search Console + Bing
3. Confirm moderator coverage rota for the first week — launch traffic means
   tribute volume; a full pending queue is better than a rushed approval
