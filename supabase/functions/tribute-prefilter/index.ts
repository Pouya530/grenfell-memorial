// Edge Function: tribute-prefilter
// Screens an incoming tribute message and returns { flagged: boolean }.
// IMPORTANT (CONTEXT.md §3.2): this function only FLAGS content for human
// attention. It never rejects and never approves. Humans decide everything.

import {
  RegExpMatcher,
  englishDataset,
  englishRecommendedTransformers,
} from "npm:obscenity";

const matcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

const URL_OR_EMAIL = /(https?:\/\/|www\.|[^\s]+@[^\s]+\.[^\s]+)/i;

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }
  const { message } = await req.json().catch(() => ({ message: "" }));
  if (typeof message !== "string" || !message.trim()) {
    return Response.json({ flagged: true, reason: "empty" });
  }
  const flagged = matcher.hasMatch(message) || URL_OR_EMAIL.test(message);
  return Response.json({ flagged });
});
