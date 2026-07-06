/**
 * Bake demo preview pages into static HTML at build time.
 * Source .md files are read locally only — they are excluded from Vercel via .vercelignore.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DEMO_STYLES = path.join(ROOT, "..", "demo", "public", "styles.css");
const OUT_HUB = path.join(ROOT, "public", "hub");
const OUT_PREVIEW = path.join(ROOT, "public", "preview");

const CATALOG = {
  deploy: { rel: "DEPLOY.md", title: "DEPLOY.md", type: "markdown", desc: "Going live on grenfell.memorial — DNS, Vercel, Supabase, email, post-deploy.", stage: "Deploy runbook" },
  seo: { rel: "SEO.md", title: "SEO.md", type: "markdown", desc: "Search and AI-search metadata, JSON-LD, sitemap, launch checklist.", stage: "Deploy runbook" },
  security: { rel: "SECURITY.md", title: "SECURITY.md", type: "markdown", desc: "Security model, headers, vulnerability reporting, controls checklist.", stage: "Deploy runbook" },
  context: { rel: "CONTEXT.md", title: "CONTEXT.md", type: "markdown", desc: "Requirements, ethical guardrails, stack, and glossary.", stage: "Pipeline stage 3" },
  spec: { rel: "SPEC.md", title: "SPEC.md", type: "markdown", desc: "Architecture, data models, RLS, scene spec, and build order.", stage: "Pipeline stage 4" },
  agents: { rel: "AGENTS.md", title: "AGENTS.md", type: "markdown", desc: "Cursor agent roster with system prompts and Sensitivity Reviewer veto.", stage: "Pipeline stage 5" },
  readme: { rel: "README.md", title: "README.md", type: "markdown", desc: "Project overview, zero-setup prototype, and full app quick start." },
  schema: { rel: "supabase/schema.sql", title: "schema.sql", type: "sql", desc: "Tables, triggers, and RLS — the database enforces moderation." },
  prefilter: { rel: "supabase/functions/tribute-prefilter/index.ts", title: "tribute-prefilter", type: "typescript", desc: "Edge Function: obscenity pre-screen — flags only, never decides." },
  env: { rel: ".env.example", title: ".env.example", type: "env", desc: "Environment template for Supabase and preview protection." },
  reference: { rel: "reference/README.txt", title: "reference/", type: "text", desc: "Local reference photos (gitignored — licence unconfirmed)." },
};

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function readSource(rel) {
  const full = path.join(ROOT, rel);
  if (!fs.existsSync(full)) return null;
  return fs.readFileSync(full, "utf8");
}

function renderPreviewPage(id, entry, raw) {
  const lang = entry.type === "sql" ? "sql" : entry.type === "typescript" ? "typescript" : entry.type === "env" ? "bash" : "plaintext";
  const body = entry.type === "markdown"
    ? `<article class="md-content">${marked.parse(raw, { gfm: true, breaks: false })}</article>`
    : `<pre><code class="language-${lang}">${escapeHtml(raw)}</code></pre>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex, nofollow">
  <title>${escapeHtml(entry.title)} — Grenfell Memorial</title>
  <link rel="stylesheet" href="/hub/styles.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/styles/github.min.css">
  <script src="https://cdn.jsdelivr.net/gh/highlightjs/cdn-release@11.9.0/build/highlight.min.js"></script>
</head>
<body class="preview-page">
  <header class="preview-header">
    <a class="back" href="/hub">← All previews</a>
    <div class="preview-meta">
      <span class="eyebrow">${escapeHtml(entry.stage ?? entry.type)}</span>
      <h1>${escapeHtml(entry.title)}</h1>
      <p class="sub">${escapeHtml(entry.desc)}</p>
      <code class="path">${escapeHtml(entry.rel)}</code>
    </div>
  </header>
  <main class="preview-body">${body}</main>
  <footer class="demo-footer">
    <span>In memory of the 72 people who lost their lives, 14 June 2017.</span>
  </footer>
  <script>document.querySelectorAll('pre code').forEach(b => hljs.highlightElement(b));</script>
</body>
</html>`;
}

function buildHubIndex() {
  const demoIndex = fs.readFileSync(path.join(ROOT, "..", "demo", "public", "index.html"), "utf8");
  return demoIndex
    .replace('href="/styles.css"', 'href="/hub/styles.css"')
    .replace("Local preview · port 3530", "Project previews")
    .replace("Running at <strong>localhost:3530</strong> only", "Hosted at <strong>grenfell.memorial</strong>")
    .replace('href="/prototype"', 'href="/"')
    .replace(/href="\/preview\/([a-z]+)"/g, 'href="/preview/$1.html"');
}

fs.mkdirSync(OUT_HUB, { recursive: true });
fs.mkdirSync(OUT_PREVIEW, { recursive: true });
fs.copyFileSync(DEMO_STYLES, path.join(OUT_HUB, "styles.css"));
fs.writeFileSync(path.join(OUT_HUB, "index.html"), buildHubIndex());

for (const [id, entry] of Object.entries(CATALOG)) {
  const raw = readSource(entry.rel);
  if (!raw) {
    console.warn(`skip ${id}: ${entry.rel} not found`);
    continue;
  }
  fs.writeFileSync(path.join(OUT_PREVIEW, `${id}.html`), renderPreviewPage(id, entry, raw));
}

const proto = path.join(ROOT, "prototype", "prototype-v2.html");
const scene = path.join(ROOT, "public", "scene.html");
if (fs.existsSync(proto)) fs.copyFileSync(proto, scene);

console.log("Static previews built → public/hub, public/preview");
