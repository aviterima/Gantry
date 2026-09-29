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
import dimensionQuestions from "./dimensions.json";
import * as validators from "./validators.js";
function validate(name, value) { if (!validators[name](value)) throw {status:422, detail:"Invalid " + name + " payload"}; return value; }

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
  if (!(c.persona || "").trim()) g.push("persona");
  if (!(c.channel || "").trim()) g.push("channel");
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
  if (!missingDims(c).length && totalScore(c) < 35) b.push("score below approval floor: 35/50 required");
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
    "", "## Reviewer commentary", "", c.memo_notes || "_No additional commentary._", "", "## Decision", "");
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
    for (const c of seed.candidates) {
      if (!(await kv.get("candidate:" + c.slug))) await kv.put("candidate:" + c.slug, JSON.stringify(c));
    }
    if (!(await kv.get("clusters"))) await kv.put("clusters", JSON.stringify(seed.clusters));
    if (!(await kv.get("operators"))) await kv.put("operators", JSON.stringify(seed.operators));
    if (!(await kv.get("allowed"))) await kv.put("allowed", JSON.stringify(seed.allowed_emails));
    await kv.put("seeded", new Date().toISOString());
  },
  async candidates(kv) {
    const keys = []; let cursor;
    do {
      const page = await kv.list({ prefix: "candidate:", cursor });
      keys.push(...page.keys); cursor = page.list_complete === false ? page.cursor : undefined;
    } while (cursor);
    const out = [];
    for (const k of keys) {
      const raw = await kv.get(k.name);
      if (raw) out.push(normalize(JSON.parse(raw)));
    }
    out.sort((a, b) => (a.slug < b.slug ? -1 : 1));
    return out;
  },
  async candidate(kv, slug) {
    const raw = await kv.get("candidate:" + slug);
    return raw ? normalize(JSON.parse(raw)) : null;
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
function accessHash(env, email) {
  try {const h = JSON.parse(env.GANTRY_ACCESS_KEY_HASHES || "{}")[email];
    return typeof h === "string" && /^[a-f0-9]{64}$/.test(h) ? h : null;
  } catch { return null; }
}
async function sha256(text) {
  return [...new Uint8Array(await crypto.subtle.digest("SHA-256",new TextEncoder().encode(text)))].map(b=>b.toString(16).padStart(2,"0")).join("");
}
function equal(a,b) { if(a.length!==b.length) return false; let n=0; for(let i=0;i<a.length;i++) n|=a.charCodeAt(i)^b.charCodeAt(i); return n===0; }
async function makeCookie(env, email) {
  const payload = `v2|${email}|${Math.floor(Date.now()/1000)+TTL}`;
  return `${payload}|${await hmacHex(env.GANTRY_SECRET, payload + "|" + accessHash(env,email))}`;
}
async function verifyCookie(env, kv, header) {
  try {
    const raw=(header||"").split(";").map(s=>s.trim()).find(s=>s.startsWith(COOKIE+"="))?.slice(COOKIE.length+1);
    if(!raw) return null;
    const parts=decodeURIComponent(raw).replace(/^"|"$/g,"").split("|");
    if(parts.length!==4) return null;
    const [version,email,expires,sig]=parts, digest=accessHash(env,email);
    if(version!=="v2" || !digest || !/^\d+$/.test(expires) || Number(expires)<=Date.now()/1000) return null;
    if(!equal(await hmacHex(env.GANTRY_SECRET,`${version}|${email}|${expires}|${digest}`),sig)) return null;
    return (await store.getList(kv,"allowed")).includes(email) ? email : null;
  } catch { return null; }
}
function normalize(c) {
  return {persona:"",channel:"",cluster:null,cluster_exception:"",operator:null,operator_exception:"",
    case_against:"",kill_criterion:"",memo_notes:"",research:null,is_demo:false,memo:"",decision:null,...c};
}
function researchConfigured(env) {
  try {const u=new URL(env.GANTRY_RESEARCH_URL);return u.protocol==="https:" && !u.username && !u.password;} catch {return false;}
}
function validTimestamp(value) {
  const [date, clock] = value.split('T');
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute, second] = clock.slice(0,8).split(':').map(Number);
  const maxDay = new Date(Date.UTC(year,month,0)).getUTCDate();
  return year >= 1 && month >= 1 && month <= 12 && day >= 1 && day <= maxDay &&
    hour < 24 && minute < 60 && second < 60 && Number.isFinite(Date.parse(value));
}
function validateCorpus(c) {
  validate("ResearchCorpus",c);
  const ids=c.sources.map(s=>s.id);
  if(new Set(ids).size!==ids.length || c.sources.some(s=>!validTimestamp(s.retrieved_at)) ||
    Object.values(c.proposed_scores).some(p=>p.source_ids.some(id=>!ids.includes(id))))
    throw {status:502,detail:"Invalid research citations"};
  return c;
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
    try { return await route(request,env); }
    catch(e) { return err(e.status || 500,e.detail || "Request failed"); }
  }
};
async function route(request, env) {
  const kv=env.GANTRY_KV, url=new URL(request.url), path=url.pathname, method=request.method;
  if(!env.GANTRY_SECRET) return err(503,"Session signing secret is not configured");
  await store.seedIfNeeded(kv);
  const body=async name=>{
    let b; try {b=await request.json();} catch {throw {status:422,detail:"Invalid JSON"};}
    return validate(name,b);
  };
  const cookie=value=>`${COOKIE}=${value}; Max-Age=${value?TTL:0}; Path=/; HttpOnly;${url.protocol==="https:"?" Secure;":""} SameSite=Lax`;
  if(path==="/login" && method==="GET") return html(loginHtml);
  if(path==="/api/login" && method==="POST") {
    const b=await body("LoginIn"), email=b.email.trim().toLowerCase(), digest=accessHash(env,email);
    if(!digest) return err(503,"Reviewer access key is not configured");
    if(!(await store.getList(kv,"allowed")).includes(email) || !equal(digest,await sha256(b.access_key)))
      return err(403,"Invalid email or access key");
    return json({email},200,{"Set-Cookie":cookie(await makeCookie(env,email))});
  }
  const email=await verifyCookie(env,kv,request.headers.get("Cookie"));
  if(!email) return path.startsWith("/api/") ? err(401,"authentication required") : Response.redirect(new URL("/login",url).toString(),307);
  const clusters=await store.getList(kv,"clusters"), operators=await store.getList(kv,"operators");
  const refs=c=>[...(c.cluster&&!clusters.some(x=>x.slug===c.cluster)?["unknown cluster"]:[]),
    ...(c.operator&&!operators.some(x=>x.slug===c.operator)?["unknown operator"]:[])];
  const output=c=>{const v=view(c);v.blockers.push(...refs(c));v.decidable=!v.blockers.length;return v;};
  const save=async c=>{c.memo=draftMemo(c);await store.saveCandidate(kv,c);return json(output(c));};
  if(path==="/" && method==="GET") return html(appHtml);
  if(path==="/api/me" && method==="GET") return json({email});
  if(path==="/api/logout" && method==="POST") return json({ok:true},200,{"Set-Cookie":cookie("")});
  if(path==="/api/research-status" && method==="GET") return json({configured:researchConfigured(env)});
  if(path==="/api/summary" && method==="GET") {
    const cs=(await store.candidates(kv)).map(output), by_status={draft:0,scored:0,untestable:0,g0_approved:0,g0_rejected:0};
    cs.forEach(c=>by_status[c.status]++);
    return json({candidates:cs.length,demo_candidates:cs.filter(c=>c.is_demo).length,by_status,
      g0_queue:cs.filter(c=>c.status==="scored"&&c.decidable).length,clusters:clusters.length,operators:operators.length});
  }
  if(path==="/api/candidates" && method==="GET") return json((await store.candidates(kv)).map(output));
  if(path==="/api/candidates" && method==="POST") {
    const b=await body("CandidateIn");
    if(await store.candidate(kv,b.slug)) return err(409,`candidate '${b.slug}' already exists`);
    if(refs(b).length) return err(422,refs(b).join("; "));
    const c=normalize({...b,scorecard:{dimensions:{}},thresholds:validate("GateThresholds",{}),created_at:new Date().toISOString()});
    c.memo=draftMemo(c);await store.saveCandidate(kv,c);return json(output(c),201);
  }
  if(path==="/api/g0-queue" && method==="GET")
    return json((await store.candidates(kv)).map(output).filter(c=>["scored","untestable"].includes(c.status)));
  const m=path.match(/^\/api\/candidates\/([a-z0-9][a-z0-9-]*)(?:\/([a-z-]+))?$/);
  if(m) {
    const [,slug,action]=m;
    let c=await store.candidate(kv,slug);
    if(!c) return err(404,`no candidate '${slug}'`);
    if(!action && method==="GET") return json(output(c));
    if(!["POST","PUT"].includes(method)) return err(405,"Method Not Allowed");
    if(c.decision) return err(409,"candidate already has a G0 decision; record is locked");
    if(!action && method==="PUT") {
      const b=await body("CandidateIn");
      if(b.slug!==slug) return err(422,"slug is immutable");
      if(refs(b).length) return err(422,refs(b).join("; "));
      return save({...c,...b});
    }
    if(action==="score" && method==="POST") {c.scorecard=await body("ScoreIn");return save(c);}
    if(action==="thresholds" && method==="POST") {c.thresholds=await body("GateThresholds");return save(c);}
    if(action==="case" && method==="POST") {Object.assign(c,await body("CaseIn"));return save(c);}
    if(action==="memo" && method==="PUT") {Object.assign(c,await body("MemoIn"));return save(c);}
    if(action==="memo" && method==="POST") {await save(c);return json({memo:c.memo});}
    if(action==="decision" && method==="POST") {
      const b=await body("DecisionIn"), bl=output(c).blockers;
      if(b.approved && bl.length) return err(422,"cannot approve: "+bl.join("; "));
      c.decision={...b,decided_by:email,decided_at:new Date().toISOString()};return save(c);
    }
    if(action==="research" && method==="POST") {
      if(!researchConfigured(env)) return err(503,"Research provider is not configured");
      const before=JSON.stringify(c); let corpus;
      try {
        const input=Object.fromEntries(["slug","name","one_liner","lane","delivery_mode"].map(k=>[k,c[k]]));
        const r=await fetch(env.GANTRY_RESEARCH_URL,{method:"POST",redirect:"error",signal:AbortSignal.timeout(60000),
          headers:{"Content-Type":"application/json",...(env.GANTRY_RESEARCH_TOKEN?{Authorization:"Bearer "+env.GANTRY_RESEARCH_TOKEN}:{})},
          body:JSON.stringify({candidate:input,dimensions:dimensionQuestions})});
        if(!r.ok) throw Error();const raw=await r.text();if(raw.length>512000) throw Error();
        corpus=validateCorpus(JSON.parse(raw));
      } catch {return err(502,"Research provider failed or returned invalid evidence");}
      c=await store.candidate(kv,slug);
      if(c.decision || JSON.stringify(c)!==before) return err(409,"Candidate changed during research; run again");
      c.research=corpus;return save(c);
    }
    if(action==="accept-research" && method==="POST") {
      if(!c.research || !Object.keys(c.research.proposed_scores).length) return err(422,"No proposed scores to accept");
      for(const [d,p] of Object.entries(c.research.proposed_scores)) {
        c.scorecard.dimensions[d]={score:p.score,evidence:p.evidence+"\nSources: "+p.source_ids.map(id=>{
          const s=c.research.sources.find(s=>s.id===id);return s.url+" ("+s.retrieved_at+")";
        }).join("; ")};
      }
      return save(c);
    }
    return err(405,"Method Not Allowed");
  }
  for(const [route,key,schema,items] of [["/api/clusters","clusters","Cluster",clusters],["/api/operators","operators","Operator",operators]]) {
    if(path===route && method==="GET") return json(items.map(x=>validate(schema,x)));
    if(path===route && method==="POST") {
      const b=await body(schema);if(items.some(x=>x.slug===b.slug)) return err(409,`'${b.slug}' already exists`);
      await store.putList(kv,key,[...items,b]);return json(b,201);
    }
  }
  if(path==="/api/allowed-emails" && method==="GET") return json(await store.getList(kv,"allowed"));
  if(path==="/api/allowed-emails" && method==="POST") {
    const b=await body("AllowedEmailIn"), e=b.email.trim().toLowerCase(), items=await store.getList(kv,"allowed");
    if(items.includes(e)) return err(409,`${e} is already on the allowlist`);
    await store.putList(kv,"allowed",[...items,e].sort());return json({email:e},201);
  }
  return err(404,"not found");
}
