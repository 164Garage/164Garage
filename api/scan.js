// 1:64 Garage scanner: reads card photos with Claude.
// Needs the environment variable ANTHROPIC_API_KEY in Vercel (Settings -> Environment Variables).
// Only logged-in collectors can scan, and each one is capped at DAILY_LIMIT scans a day.

const SUPABASE_URL = "https://bgrteibwyedrxuytifto.supabase.co";
const SUPABASE_KEY = "sb_publishable_pubSfz5V2kAozok-R4HUzw_oGMTI5ul";
const DAILY_LIMIT = Number(process.env.SCAN_DAILY_LIMIT || 150);
const MAX_IMAGES = 8;
const MODELS = {
  default: process.env.SCAN_MODEL || "claude-sonnet-5-5",
  quick: process.env.SCAN_MODEL_QUICK || "claude-haiku-4-5-20251001",
};

const sbHeaders = (token, extra = {}) => ({ apikey: SUPABASE_KEY, authorization: "Bearer " + token, ...extra });

function parseJson(text) {
  const t = String(text || "").replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
  try { return JSON.parse(t); } catch (e) {}
  const starts = [t.indexOf("{"), t.indexOf("[")].filter((i) => i >= 0);
  if (!starts.length) return null;
  const s = Math.min(...starts), close = t[s] === "{" ? "}" : "]", e = t.lastIndexOf(close);
  try { return JSON.parse(t.slice(s, e + 1)); } catch (err) { return null; }
}

export default async function handler(req, res) {
  res.setHeader("cache-control", "no-store");
  const enabled = !!process.env.ANTHROPIC_API_KEY;
  if (req.method === "GET") return res.status(200).json({ enabled, maxImages: MAX_IMAGES });
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!enabled) return res.status(503).json({ error: "The scanner isn't switched on yet." });

  // who is scanning?
  const token = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ error: "Log in to scan." });
  const who = await fetch(SUPABASE_URL + "/auth/v1/user", { headers: sbHeaders(token) });
  if (!who.ok) return res.status(401).json({ error: "Log in to scan." });

  // daily cap
  const since = new Date(Date.now() - 864e5).toISOString();
  const cnt = await fetch(`${SUPABASE_URL}/rest/v1/scans?select=id&created_at=gte.${encodeURIComponent(since)}`,
    { method: "HEAD", headers: sbHeaders(token, { prefer: "count=exact" }) });
  const used = Number((cnt.headers.get("content-range") || "").split("/")[1] || 0);
  if (used >= DAILY_LIMIT) return res.status(429).json({ error: `That's ${DAILY_LIMIT} scans today. The scanner resets in 24 hours.` });

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {});
  const prompt = String(body.prompt || "").slice(0, 20000);
  if (!prompt) return res.status(400).json({ error: "Nothing to scan." });
  const images = (Array.isArray(body.images) ? body.images : []).slice(0, MAX_IMAGES).map((u) => {
    const m = /^data:(image\/(?:jpeg|png|webp|gif));base64,(.+)$/.exec(String(u));
    return m && { type: "image", source: { type: "base64", media_type: m[1], data: m[2] } };
  }).filter(Boolean);

  await fetch(SUPABASE_URL + "/rest/v1/scans", { method: "POST", headers: sbHeaders(token, { "content-type": "application/json", prefer: "return=minimal" }), body: "{}" });

  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
    body: JSON.stringify({
      model: MODELS[body.tier] || MODELS.default,
      max_tokens: 4096,
      system: "You read photos of 1:64 diecast cars for a collector site. Answer with only the JSON the user asks for: no prose, no code fences.",
      messages: [{ role: "user", content: [...images, { type: "text", text: prompt }] }],
    }),
  });
  const out = await r.json().catch(() => ({}));
  if (!r.ok) {
    console.error("anthropic", r.status, out?.error?.message);
    return res.status(502).json({ error: r.status === 429 || r.status === 529 ? "The scanner is busy. Try again in a minute." : "The scanner couldn't read that. Try again." });
  }
  const text = (out.content || []).filter((c) => c.type === "text").map((c) => c.text).join("");
  const result = parseJson(text);
  if (result === null) return res.status(502).json({ error: "The scanner couldn't read that. Try again." });
  return res.status(200).json({ result });
}
