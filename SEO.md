# SEO.md — Grenfell Tower Digital Memorial: Search & AI-Search Specification

> **Domain**: https://grenfell.memorial (Porkbun)
> **Goal**: Maximum legitimate visibility for "grenfell memorial" and related queries
> across Google/Bing AND AI answer engines (ChatGPT, Claude, Perplexity, Gemini).
> **Assets**: everything referenced here already exists in `public/`.

---

## 0. Honest framing (read first)

Nobody can *guarantee* a #1 ranking — anyone who promises that is selling something.
What we control: flawless technical SEO, an exact-match domain, rich structured data,
crawlable text content, and AI-crawler friendliness — all specified below. What
ultimately decides ranking: authority and links, which for this project come from
press, education, and community endorsement **after** the community engagement in
CONTEXT.md §3.1. Note also that the official Grenfell Tower Memorial Commission site
serves the bereaved and survivors directly; our structured data and llms.txt point to
it as an authoritative source. Ranking alongside it is success; trying to outrank the
community's own site would not be.

## 1. Metadata — `app/layout.tsx`

```ts
import type { Metadata, Viewport } from "next";

const SITE = "https://grenfell.memorial";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "Grenfell Tower Digital Memorial — Explore the Tower in 3D",
    template: "%s · Grenfell Tower Digital Memorial",
  },
  description:
    "An educational 3D reconstruction of Grenfell Tower as built in 1974 and as " +
    "reclad in 2016. Explore the architecture and leave a tribute. In memory of " +
    "the 72 people who lost their lives, 14 June 2017.",
  keywords: [
    "Grenfell Tower", "Grenfell memorial", "Grenfell Tower memorial",
    "Grenfell Tower 3D model", "Grenfell Tower architecture",
    "Lancaster West Estate", "North Kensington", "digital memorial",
  ],
  alternates: { canonical: SITE },
  openGraph: {
    type: "website",
    url: SITE,
    siteName: "Grenfell Tower Digital Memorial",
    title: "Grenfell Tower Digital Memorial",
    description:
      "Explore Grenfell Tower in 3D — 1974 and 2016 — and leave a tribute. " +
      "In memory of the 72.",
    images: [{ url: "/og-image.png", width: 1200, height: 630,
               alt: "3D reconstruction of Grenfell Tower beside a record card reading Grenfell Tower Digital Memorial — In memory of the 72" }],
    locale: "en_GB",
  },
  twitter: {
    card: "summary_large_image",
    title: "Grenfell Tower Digital Memorial",
    description: "Explore the tower in 3D and leave a tribute. In memory of the 72.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },   // green heart
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  robots: { index: true, follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" } },
  other: { "format-detection": "telephone=no" },
};

export const viewport: Viewport = { themeColor: "#f0eee9" };
```

`/moderate/page.tsx` additionally exports
`metadata = { robots: { index: false, follow: false } }`.

## 2. Structured data (JSON-LD) — `components/StructuredData.tsx`

Rendered in layout `<head>` via a `<script type="application/ld+json">`. Three graphs:

```ts
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://grenfell.memorial/#website",
      url: "https://grenfell.memorial",
      name: "Grenfell Tower Digital Memorial",
      description: "Educational 3D reconstruction and memorial for Grenfell Tower.",
      inLanguage: "en-GB",
      isAccessibleForFree: true,
      publisher: { "@id": "https://grenfell.memorial/#org" },
    },
    {
      "@type": "Organization",
      "@id": "https://grenfell.memorial/#org",
      name: "Grenfell Tower Digital Memorial",
      url: "https://grenfell.memorial",
      logo: "https://grenfell.memorial/icon-512.png",
    },
    {
      "@type": "LandmarksOrHistoricalBuildings",
      "@id": "https://grenfell.memorial/#tower",
      name: "Grenfell Tower",
      description:
        "24-storey residential tower completed in 1974 on the Lancaster West " +
        "Estate, North Kensington. Reclad in 2016. 72 people lost their lives " +
        "in the fire of 14 June 2017.",
      address: {
        "@type": "PostalAddress",
        streetAddress: "Grenfell Road, Lancaster West Estate",
        addressLocality: "North Kensington, London",
        postalCode: "W11",
        addressCountry: "GB",
      },
      geo: { "@type": "GeoCoordinates", latitude: 51.514, longitude: -0.2157 },
      image: "https://grenfell.memorial/og-image.png",
      sameAs: [
        "https://en.wikipedia.org/wiki/Grenfell_Tower",
        "https://www.grenfelltowerinquiry.org.uk",
      ],
    },
  ],
};
```

Validate with Google's Rich Results Test after deploy. Do NOT add FAQPage/Review/
Event schema — inappropriate here and Google penalises misuse.

## 3. Crawlable content (the single most important item)

WebGL is invisible to crawlers. The page MUST contain real, server-rendered prose:

- One `<h1>`: **Grenfell Tower Digital Memorial**.
- Below the canvas (visually quiet, `<section aria-label="About this memorial">`),
  400–600 words of plain-language content with `<h2>`s: *The tower* (1974 design,
  dimensions, Lancaster West), *The 2016 refurbishment* (what changed externally),
  *This reconstruction* (sources, "approximate" honesty), *Leaving a tribute*
  (how moderation works). Written in `content/strings.ts`, reviewed by the
  Sensitivity Reviewer (AGENTS.md §2.4).
- `<noscript>` fallback: the og-image with full alt text plus the prose section.
- Descriptive alt text on every image; the memorial line in real text, never an image.

This section is what ranks, what answer engines quote, and what screen-reader users
get — one artefact, three audiences.

## 4. `app/sitemap.ts` and headers

```ts
import type { MetadataRoute } from "next";
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: "https://grenfell.memorial", lastModified: new Date(),
            changeFrequency: "monthly", priority: 1 }];
}
```

`robots.txt`, `llms.txt`, `site.webmanifest` are static in `public/` (already built).
Redirect `www.grenfell.memorial → grenfell.memorial` (308) in `next.config.mjs`.

## 5. AI SEO (answer-engine optimisation)

1. **`public/llms.txt`** (built): plain-markdown site summary, key facts, accuracy
   note, and guidance for assistants — including pointing to the Inquiry and the
   Memorial Commission as authoritative sources.
2. **robots.txt** explicitly allows GPTBot, ClaudeBot, PerplexityBot,
   Google-Extended, Applebot-Extended, CCBot (built).
3. **Stable facts in plain HTML** (§3) — answer engines quote text, not WebGL.
4. **Consistent entity naming**: always "Grenfell Tower Digital Memorial" +
   "grenfell.memorial" so the entity consolidates in knowledge graphs.
5. JSON-LD `sameAs` links tie the entity to Wikipedia/Inquiry pages AI models
   already know.

## 6. Performance = ranking (Core Web Vitals)

- LCP target < 2.0s: the record card and prose render server-side before the
  canvas hydrates; canvas `loading` is deferred; DPR clamp 2.
- CLS ≈ 0: canvas is `position:fixed` full-viewport; overlays absolutely placed.
- INP: hearts are CSS animations (compositor), not JS-driven layout.
- `next/font` for any webfont (or stay with system stack — currently zero font
  payload); no third-party scripts, no analytics SDKs (CONTEXT §3.4 also = fast).

## 7. Off-site (post community engagement ONLY — CONTEXT §3.1)

Search Console + Bing Webmaster verification and sitemap submission; outreach to
architecture-education sites, RIBA journal, C20 Society, local press; Wikipedia
external-link consideration (editors decide, never self-spam); consistent link from
Nocturnal Cloud / Khalili Foundation properties. Links from education and community
endorsement are the only path to durable rankings for this query — and the only
appropriate one.

## 8. Launch checklist

- [ ] Deploy → verify `/robots.txt`, `/llms.txt`, `/sitemap.xml`, `/og-image.png` resolve
- [ ] Rich Results Test passes (LandmarksOrHistoricalBuildings + WebSite)
- [ ] OG check: paste URL into a Slack/WhatsApp draft — card shows tower image
- [ ] Favicon shows green heart in tab, iOS home screen, and Google result
- [ ] Lighthouse ≥ 95 Performance / 100 SEO / 100 Accessibility / 100 Best Practices
- [ ] `site:grenfell.memorial` indexed within a week of Search Console submission
- [ ] Replace generated `og-image.png` with a real in-app screenshot at 1200×630
      (same filename — everything else keeps working)
