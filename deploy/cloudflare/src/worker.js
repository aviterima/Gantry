/**
 * Gantry Mission Control — Cloudflare Worker port of the Phase 1 engine.
 *
 * Same API surface, auth scheme, and domain rules as engine/app (the Python
 * reference implementation); storage is Workers KV instead of the repo-backed
 * registry. The UI is imported verbatim from engine/static so the two
 * deployments cannot drift visually.
 *
 * Bindings (wrangler.toml / secrets):
 *   GANTRY_KV      — KV namespace
 *   GANTRY_SECRET  — HMAC secret for session cookies (wrangler secret put)
 *
 * Known debt (mirrors ENGINE-SPEC's register): KV is eventually consistent
 * (~60s cross-edge), acceptable for a small review team — repay with D1 or
 * Durable Objects when concurrent reviewers become routine. Email allowlist
 * identifies but does not verify mailbox ownership until the Neubloc adapter
 * enables magic links (Phase 2).
 */

import appHtml from "../../../engine/static/index.html";
import loginHtml from "../../../engine/static/login.html";
import seed from "./seed.json";

/* ---------- domain rules (mirrors engine/app/models.py) ---------- */

const DIMS = ["pain_intensity", "buyer_reachability", "time_to_signal",
  "budget_existence", "incumbent_exposure", "ai_leverage", "moat_trajectory",
  "founder_market_access", "expansion_path", "portfolio_synergy"];
const GATING = ["buyer_reachability", "time_to_signal"];
const BANDS = [
  [43, "strong", "Rare. Launch early in the next tournament."],
  [35, "credible", "Launchable — queue it."],
  [28, "conditional", "Fix the named weakness first."],
  [20, "weak", "Park it; revisit only with new evidence."],
  [0, "not_this_one", "No."]];

const dims = (c) => (c.scorecard && c.scorecard.dimensions) || {};
const missingDims = (c) => DIMS.filter((d) => !dims(c)[d]);
const failedGates = (c) => GATING.filter((d) => {
  const ds = dims(c)[d];
  return !ds || ds.score < 3 || !(ds.evidence || "").trim();
});
const totalScore = (c) => DIMS.reduce((t, d) => t + (dims(c)[d]?.score || 0), 0);
const band = (c) => {
  if (missingDims(c).length) return null; // never band a partial scorecard
  const t = totalScore(c);
  for (const [floor, name, note] of BANDS) if (t >= floor) return { name, note };
  return null;
};
const status = (c) => c.decision
  ? (c.decision.approved ? "g0_approved" : "g0_rejected")
  : missingDims(c).length ? "draft"
  : failedGates(c).length ? "untestable" : "scored";
const declGaps = (c) => {
  const g = [];
  if (!c.cluster && !(c.cluster_exception || "").trim()) g.push("cluster");
  if (!c.operator && !(c.operator_exception || "").trim()) g.push("operator");
  const t = c.thresholds || {};
  if (![t.g1_reachability, t.g2_engagement, t.g3_retention].every((v) => (v || "").trim()))
    g.push("thresholds");
  if (!(c.case_against || "").trim()) g.push("case-against");
  if (!(c.kill_criterion || "").trim()) g.push("kill-criterion");
  return g;
};
const blockers = (c) => {
  const b = [];
  if (missingDims(c).length) b.push("unscored dimensions: " + missingDims(c).join(", "));
  if (failedGates(c).length) b.push("failed gating dimensions: " + failedGates(c).join(", "));
  if (declGaps(c).length) b.push("missing declarations: " + declGaps(c).join(", "));
  return b;
};
const decidable = (c) => blockers(c).length === 0;

const LANE_LABELS = {
  substitution: "Lane one — product substitution (FRAMEWORK §2.2)",
  vertical: "Lane two — vertical, AI as domain expert (FRAMEWORK §2.3)",
};
const MODE_LABELS = {
  service_first: "Service-first (sell the work before building the product)",
  self_serve: "Self-serve product",
};

function draftMemo(c) {
  const t = c.thresholds || {};
  const bd = band(c);
  const testable = !missingDims(c).length && !failedGates(c).length;
  const cluster = c.cluster || `_exception: ${c.cluster_exception || "none given"}_`;
  const operator = c.operator || `_exception: ${c.operator_exception || "none given"}_`;
  const lines = [
    `# G0 Memo — ${c.name}`, "",
    `**Thesis:** ${c.one_liner}`, "",
    `- **Lane:** ${LANE_LABELS[c.lane]}`,
    `- **Delivery mode:** ${MODE_LABELS[c.delivery_mode]}`,
    `- **Buyer persona:** ${c.persona || "_not yet defined_"}`,
    `- **Primary channel:** ${c.channel || "_not yet defined_"}`,
    `- **Cluster:** ${cluster}`,
    `- **Operator match:** ${operator}`, "",
    "## Scorecard", "",
    "| Dimension | Score | Evidence |", "|---|---|---|",
  ];
  for (const d of DIMS) {
    const ds = dims(c)[d];
    const gate = GATING.includes(d) ? " *(gating)*" : "";
    lines.push(ds ? `| ${d}${gate} | ${ds.score} | ${ds.evidence || "—"} |`
                  : `| ${d}${gate} | — | _unscored_ |`);
  }
  let bandNote = "";
  if (!testable) bandNote = " — **UNTESTABLE** (gating dimension failed or unscored)";
  else if (bd) bandNote = ` — band: **${bd.name.toUpperCase().replace(/_/g, " ")}** (${bd.note})`;
  lines.push("", `**Total:** ${totalScore(c)} / 50${bandNote}`, "",
    "## Case against (required at G0)", "",
    c.case_against || "_NOT WRITTEN — approval is blocked until the strongest case against is argued._", "",
    `**Kill criterion:** ${c.kill_criterion || "_NOT SET — approval is blocked until a falsifiable kill criterion exists._"}`, "",
    "## Pre-committed thresholds (locked at G0)", "",
    `- **G1 reachability:** ${t.g1_reachability || "_not set_"}`,
    `- **G2 engagement:** ${t.g2_engagement || "_not set_"}`,
    `- **G3 retention:** ${t.g3_retention || "_not set_"}`,
    `- **Caps:** $${(t.budget_cap_usd || 0).toLocaleString("en-US")} / ${t.time_cap_weeks || 0} weeks`,
    "", "## Decision", "");
  lines.push(c.decision
    ? `**${c.decision.approved ? "APPROVED" : "REJECTED"}** by ${c.decision.decided_by} — ${c.decision.notes || "no notes"}`
    : "_Pending G0 review._");
  return lines.join("\n") + "\n";
}

function view(c) {
  return {
    ...c,
    memo: draftMemo(c),
    status: status(c),
    total_score: totalScore(c),
    band: band(c),
    failed_gates: failedGates(c),
    decidable: decidable(c),
    blockers: blockers(c),
  };
}

/* ---------- storage (KV) ---------- */

const store = {
  async seedIfNeeded(kv) {
    if (await kv.get("seeded")) return;
    for (const c of seed.candidates) await kv.put("candidate:" + c.slug, JSON.stringify(c));
    await kv.put("clusters", JSON.stringify(seed.clusters));
    await kv.put("operators", JSON.stringify(seed.operators));
    if (!(await kv.get("allowed"))) await kv.put("allowed", JSON.stringify(seed.allowed_emails));
    await kv.put("seeded", new Date().toISOString());
  },
  async candidates(kv) {
    const list = await kv.list({ prefix: "candidate:" });
    const out = [];
    for (const k of list.keys) {
      const raw = await kv.get(k.name);
      if (raw) out.push(JSON.parse(raw));
    }
    out.sort((a, b) => (a.slug < b.slug ? -1 : 1));
    return out;
  },
  async candidate(kv, slug) {
    const raw = await kv.get("candidate:" + slug);
    return raw ? JSON.parse(raw) : null;
  },
  saveCandidate: (kv, c) => kv.put("candidate:" + c.slug, JSON.stringify(c)),
  getList: async (kv, key) => JSON.parse((await kv.get(key)) || "[]"),
  putList: (kv, key, v) => kv.put(key, JSON.stringify(v)),
};

/* ---------- auth (mirrors engine/app/auth.py) ---------- */

const COOKIE = "gantry_session";
const TTL = 30 * 24 * 3600;

async function hmacHex(secret, payload) {
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function makeCookie(secret, email) {
  const payload = `${email}|${Math.floor(Date.now() / 1000) + TTL}`;
  return `${payload}|${await hmacHex(secret, payload)}`;
}
async function verifyCookie(secret, kv, cookieHeader) {
  const raw = (cookieHeader || "").split(";").map((s) => s.trim())
    .find((s) => s.startsWith(COOKIE + "="))?.slice(COOKIE.length + 1);
  if (!raw) return null;
  const parts = decodeURIComponent(raw).split("|");
  if (parts.length !== 3) return null;
  const [email, expires, sig] = parts;
  if ((await hmacHex(secret, `${email}|${expires}`)) !== sig) return null;
  if (parseInt(expires, 10) < Date.now() / 1000) return null;
  const allowed = await store.getList(kv, "allowed");
  return allowed.includes(email) ? email : null; // revocation ends sessions
}

/* ---------- http helpers ---------- */

const json = (data, status = 200, headers = {}) =>
  new Response(JSON.stringify(data), {
    status, headers: { "Content-Type": "application/json", ...headers } });
const err = (status, detail) => json({ detail }, status);
const html = (body) => new Response(body, {
  headers: { "Content-Type": "text/html; charset=utf-8" } });

/* ---------- router ---------- */

export default {
  async fetch(request, env) {
    const kv = env.GANTRY_KV;
    const secret = env.GANTRY_SECRET;
    if (!secret) return err(500, "GANTRY_SECRET is not set (wrangler secret put GANTRY_SECRET)");
    await store.seedIfNeeded(kv);

    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const body = async () => { try { return await request.json(); } catch { return {}; } };

    /* public routes */
    if (path === "/login") return html(loginHtml);
    if (path === "/api/login" && method === "POST") {
      const email = ((await body()).email || "").trim().toLowerCase();
      const allowed = await store.getList(kv, "allowed");
      if (!allowed.includes(email))
        return err(403, "This email is not on the allowlist. Ask an existing member to add it.");
      return json({ email }, 200, {
        "Set-Cookie": `${COOKIE}=${await makeCookie(secret, email)}; Max-Age=${TTL}; Path=/; HttpOnly; Secure; SameSite=Lax`,
      });
    }

    /* everything else requires a session */
    const email = await verifyCookie(secret, kv, request.headers.get("Cookie"));
    if (!email) {
      if (path.startsWith("/api/")) return err(401, "authentication required");
      return Response.redirect(new URL("/login", url).toString(), 302);
    }

    if (path === "/" || path === "") return html(appHtml);
    if (path === "/api/logout" && method === "POST")
      return json({ ok: true }, 200, {
        "Set-Cookie": `${COOKIE}=; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=Lax` });
    if (path === "/api/me") return json({ email });

    if (path === "/api/summary") {
      const cs = (await store.candidates(kv)).map(view);
      const by = { draft: 0, scored: 0, untestable: 0, g0_approved: 0, g0_rejected: 0 };
      cs.forEach((c) => by[c.status]++);
      return json({
        candidates: cs.length, by_status: by,
        g0_queue: cs.filter((c) => c.status === "scored" && c.decidable).length,
        clusters: (await store.getList(kv, "clusters")).length,
        operators: (await store.getList(kv, "operators")).length,
      });
    }

    if (path === "/api/candidates" && method === "GET")
      return json((await store.candidates(kv)).map(view));

    if (path === "/api/candidates" && method === "POST") {
      const b = await body();
      const slug = (b.slug || "").trim();
      if (!/^[a-z0-9][a-z0-9-]*$/.test(slug)) return err(422, "slug must be lowercase-kebab");
      if (await store.candidate(kv, slug)) return err(409, `candidate '${slug}' already exists`);
      const c = {
        slug, name: b.name || slug, one_liner: b.one_liner || "",
        lane: b.lane === "substitution" ? "substitution" : "vertical",
        delivery_mode: b.delivery_mode === "service_first" ? "service_first" : "self_serve",
        persona: b.persona || "", channel: b.channel || "",
        cluster: b.cluster || null, cluster_exception: b.cluster_exception || "",
        operator: b.operator || null, operator_exception: b.operator_exception || "",
        case_against: b.case_against || "", kill_criterion: b.kill_criterion || "",
        scorecard: { dimensions: {} },
        thresholds: { g1_reachability: "", g2_engagement: "", g3_retention: "",
          budget_cap_usd: 2000, time_cap_weeks: 3 },
        memo: "", decision: null, created_at: new Date().toISOString(),
      };
      await store.saveCandidate(kv, c);
      return json(view(c), 201);
    }

    if (path === "/api/g0-queue")
      return json((await store.candidates(kv)).map(view)
        .filter((c) => ["scored", "untestable"].includes(c.status)));

    const m = path.match(/^\/api\/candidates\/([a-z0-9-]+)(?:\/(\w+))?$/);
    if (m) {
      const [, slug, action] = m;
      const c = await store.candidate(kv, slug);
      if (!c) return err(404, `no candidate '${slug}'`);
      if (!action && method === "GET") return json(view(c));
      const locked = () => c.decision != null;
      if (action === "score" && method === "POST") {
        if (locked()) return err(409, "candidate already has a G0 decision; the scorecard is locked");
        const b = await body();
        for (const [d, ds] of Object.entries(b.dimensions || {})) {
          if (!DIMS.includes(d)) continue;
          const score = Math.round(Number(ds.score));
          if (score >= 1 && score <= 5)
            c.scorecard.dimensions[d] = { score, evidence: String(ds.evidence || "") };
        }
        await store.saveCandidate(kv, c);
        return json(view(c));
      }
      if (action === "thresholds" && method === "POST") {
        if (locked()) return err(409, "thresholds are locked at G0; use the extension-memo flow");
        const b = await body();
        c.thresholds = {
          g1_reachability: String(b.g1_reachability || ""),
          g2_engagement: String(b.g2_engagement || ""),
          g3_retention: String(b.g3_retention || ""),
          budget_cap_usd: Number(b.budget_cap_usd) || 0,
          time_cap_weeks: Number(b.time_cap_weeks) || 0,
        };
        await store.saveCandidate(kv, c);
        return json(view(c));
      }
      if (action === "case" && method === "POST") {
        if (locked()) return err(409, "candidate already has a G0 decision; the case against is locked");
        const b = await body();
        c.case_against = String(b.case_against || "");
        c.kill_criterion = String(b.kill_criterion || "");
        await store.saveCandidate(kv, c);
        return json(view(c));
      }
      if (action === "decision" && method === "POST") {
        if (locked()) return err(409, "candidate already decided");
        const b = await body();
        if (b.approved && !decidable(c))
          return err(422, "cannot approve: " + blockers(c).join("; "));
        c.decision = { approved: !!b.approved, decided_by: email,
          notes: String(b.notes || ""), decided_at: new Date().toISOString() };
        await store.saveCandidate(kv, c);
        return json(view(c));
      }
      if (action === "memo" && method === "POST") return json({ memo: draftMemo(c) });
    }

    for (const [route, key] of [["/api/clusters", "clusters"], ["/api/operators", "operators"]]) {
      if (path === route && method === "GET") return json(await store.getList(kv, key));
      if (path === route && method === "POST") {
        const b = await body();
        const items = await store.getList(kv, key);
        if (!/^[a-z0-9][a-z0-9-]*$/.test(b.slug || "")) return err(422, "slug must be lowercase-kebab");
        if (items.some((i) => i.slug === b.slug)) return err(409, `'${b.slug}' already exists`);
        items.push(b);
        await store.putList(kv, key, items);
        return json(b, 201);
      }
    }

    if (path === "/api/allowed-emails" && method === "GET")
      return json(await store.getList(kv, "allowed"));
    if (path === "/api/allowed-emails" && method === "POST") {
      const e = ((await body()).email || "").trim().toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return err(422, "That doesn't look like an email address.");
      const allowed = await store.getList(kv, "allowed");
      if (allowed.includes(e)) return err(409, `${e} is already on the allowlist`);
      allowed.push(e);
      await store.putList(kv, "allowed", allowed);
      return json({ email: e }, 201);
    }

    return err(404, "not found");
  },
};
