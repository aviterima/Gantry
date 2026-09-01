# Last-Z: A Selection Framework for Parallel Company Launches

## 0. The thesis, restated

The marginal cost of writing software to address a market need is converging on zero.
Therefore, instead of picking one company and betting years on it, we launch many small
companies in parallel, instrument each one for demand signals (leads, conversions,
retention), kill the ones that stay dark, and promote the one or two in twenty that show
signs of life into fully-resourced companies.

This document is the framework for the **selection** problem: which twenty do we launch,
and how do we decide, early and cheaply, which ones to kill and which to promote.

---

## 1. A correction to the thesis that shapes everything below

If code is free for us, it is free for everyone. Two consequences:

1. **Defensibility can never come from the code.** It must come from something the zero-cost
   world does not commoditize: proprietary data accumulation, workflow embedding, network
   effects, distribution channels, regulatory position, or trust/brand.
2. **The scarce resource shifts from engineering to distribution and attention.** The cost
   of building converges on zero while the cost of being *noticed* rises, because everyone
   else's build cost also fell. So the selection framework must weight
   *"can we cheaply reach and test this buyer?"* at least as heavily as
   *"is this a good product idea?"* — a great idea whose buyer we cannot reach through
   automatable channels is untestable in this system and therefore unlaunchable in it.

A third, subtler consequence: the parallel-launch model itself has a **selection bias**.
It can only detect demand that expresses itself quickly through measurable channels
(sign-ups, inbound leads, reply rates, pre-orders). Markets with 9-month enterprise sales
cycles may be excellent businesses and will still read as "dead" in our instrumentation.
We should either exclude them deliberately or measure them with different proxies
(discovery-call bookings, LOIs) — never with the same dashboard thresholds as self-serve
products.

---

## 2. Market structure: where the openings are

### 2.1 Horizontal systems of record (Salesforce, SAP, Workday...) — avoid head-on

These incumbents have three assets we cannot replicate: deep embedded functionality,
decades of workflow lock-in, and — most importantly — the proprietary data their customers
have poured into them. The most likely incumbent move is exactly the one predicted in the
thesis: push an AI-native interface *on top of* the existing system, leveraging all the
functionality and data underneath. When that happens, "AI wrapper around what Salesforce
already stores" is a dead category. **We do not attack the installed base.**

### 2.2 The exception: AI-native simplified re-implementations for young companies

The incumbent's data-gravity moat only applies to companies that *already have data in the
incumbent*. A two-year-old startup has nothing to migrate; for them the incumbent's depth
is a liability (complexity, cost, admin overhead), not a moat. This is the Attio play in
CRM: an AI-native, radically simpler system of record aimed at companies too young to be
locked in.

This lane is **viable but crowded** — it is the most obvious play, so every well-funded
studio is running it. Our filter for entering it:

- Pick systems of record where **no credible AI-native challenger has yet emerged**
  (CRM has Attio; but consider e.g. PLM, quality management, clinical trial management,
  fund administration, grant management).
- The buyer must be reachable through channels we can automate (see §4).
- The wedge must generate its own data moat fast — the product should get better with
  each customer's usage in a way a later entrant can't shortcut.

### 2.3 The main lane: vertical solutions where AI is the domain expert

Historically, vertical SaaS required a founder with deep domain expertise, and many
verticals were too small to justify venture-scale engineering investment. Both constraints
just broke:

- **AI can serve as the domain expert** — both during design (interviewing practitioners,
  mining regulations/forums/job postings to map the workflow) and inside the product
  itself (the product's core value is often "an expert in the loop, at software prices").
- **Zero build cost makes small verticals economic.** A $30M TAM vertical was never worth
  a startup; it is absolutely worth one of twenty parallel launches.

This is the greenfield. The best targets share a shape:

- The industry runs on **spreadsheets, email, phone calls, and one hated legacy vendor**.
- Value delivery currently requires a **scarce human expert** (compliance officer,
  estimator, underwriter, licensed reviewer) whose judgment AI can now approximate.
- The workflow produces **proprietary operational data** that accumulates into a moat.
- Practitioners congregate somewhere reachable (trade association, subreddit, conference,
  a LinkedIn-searchable job title) — so lead generation can be automated.

---

## 3. The selection scorecard

Score every candidate 1–5 on each dimension. The scorecard's purpose is not the total —
it is to force the same questions to be answered for every candidate before launch, and
to make kill decisions later feel less personal.

| # | Dimension | Question | Disqualifier |
|---|-----------|----------|--------------|
| 1 | **Pain intensity** | Is this hair-on-fire (compliance deadline, revenue leak, labor shortage) or a vitamin? | Nice-to-have with no forcing event |
| 2 | **Buyer reachability** | Can we reach 1,000+ qualified buyers through automatable channels (outbound, SEO, ads, communities) for < $2k? | Buyer identifiable only through relationships |
| 3 | **Time-to-signal** | Will a real buyer act (sign up, reply, book a call, pre-pay) within 4–6 weeks of launch? | Sales cycle structurally > 1 quarter |
| 4 | **Budget existence** | Does the buyer already pay for something adjacent (legacy vendor, consultant, headcount)? Replacing spend beats creating it. | "They'd have to find new budget" |
| 5 | **Incumbent exposure** | If the dominant horizontal vendor ships an AI UI tomorrow, does our product die? | We depend on data the incumbent already holds |
| 6 | **AI leverage** | Does AI collapse the cost of the *value delivery* (the expert judgment), not merely the cost of building the app? | AI only helped us write the code |
| 7 | **Moat trajectory** | After 100 customers, what do we have that a fast follower can't clone in a weekend? (data, embeddings in workflow, network) | Nothing — product is the moat |
| 8 | **Founder-market access** | Do we have, or can AI synthesize, enough domain understanding to be credible in the first sales conversation? | Domain requires licensure/trust we can't earn quickly |
| 9 | **Expansion path** | If the wedge works, is there an obvious second product for the same buyer? | One-and-done tool |
| 10 | **Portfolio synergy** | Does it reuse our launch stack, share an audience with another launch, or feed the studio's data/learnings? | Fully bespoke everything |

**Weighting:** dimensions 2 and 3 (reachability, time-to-signal) are *gating*, not just
scored — a candidate that fails either is untestable in this system regardless of how
attractive it is, and belongs in a different (conviction-funded) process, not this one.
Dimensions 6 and 7 are what separate a real company from a demo.

---

## 4. The signal engine: how "signs of life" are measured

Every launch ships with the same instrumentation so cohorts are comparable. The stage
gates, with default thresholds (tune per category, but write the threshold down *before*
launch — moving goalposts after seeing data is how zombie companies are born):

| Gate | What we ship | Signal we need | Budget/time cap | Kill condition |
|------|--------------|----------------|-----------------|----------------|
| **G0 — Thesis** | Scorecard + one-page memo | Score clears bar; a named buyer persona; a named channel | 2 days | Fails a gating dimension |
| **G1 — Smoke** | Landing page + outbound sequence / ads to ~1–2k targets | ≥ 2–5% qualified conversion (email captured, call booked, waitlist with intent question answered) | $1–2k, 2–3 weeks | Sub-1% with two message/angle iterations |
| **G2 — Product signal** | Working product (AI-built, narrow wedge) in the hands of signups | Activation: ≥ 30–40% of signups reach the core "aha" action; unprompted usage in week 2 | 4–6 weeks | Users try once and vanish despite onboarding fixes |
| **G3 — Money** | Pricing page, paid pilot, or pre-order | ≥ 3–5 paying customers or signed pilots, at least one from pure outbound (not a friend) | 4–8 weeks | Everyone loves it, nobody pays |
| **G4 — Promote** | Decision memo | Retention curve flattening + payback math + repeatable channel | — | — |

Two rules that matter more than the thresholds:

- **The kill decision is the default; promotion requires evidence.** With a 5–10% expected
  hit rate, the portfolio's biggest risk is not failed launches — it is *ambiguous,
  middling* launches that consume attention for months. A launch that hasn't cleared its
  gate by the cap is killed unless someone writes a memo arguing for one specific,
  time-boxed extension.
- **One re-angle per gate.** A weak G1 earns exactly one repositioning attempt (new
  message, new segment, same product thesis). If the second attempt also misses, the
  thesis is wrong, not the copy.

What counts as a lead is defined per category at G0 (self-serve: activated signup;
SMB sales-assisted: booked call held; anything heavier probably fails the gating
dimensions and shouldn't be in this portfolio).

---

## 5. Portfolio construction

- **Batch size and cadence:** launch in cohorts (e.g. 5 at a time, every 6–8 weeks) rather
  than 20 at once — the launch stack improves with each cohort, and later launches inherit
  it.
- **Diversify across the two lanes:** roughly 2/3 vertical greenfield (§2.3), 1/3
  simplified-system-of-record (§2.2). The vertical lane has better moats; the horizontal
  lane has faster, cleaner demand signals. Don't let the dashboard's legibility bias the
  whole portfolio into lane 2.
- **Correlated bets are fine, correlated channels are not.** Two launches selling to the
  same buyer persona through the same channel compete with each other for the same
  attention; stagger them.
- **Cost model:** at roughly $3–8k fully-loaded per launch through G2, twenty launches cost
  less than one seed-stage engineer-year. The binding constraint is not money — it is
  decision-making attention at the gates. Protect gate reviews; they are the actual product
  of the studio.
- **Promotion is a re-founding, not a graduation.** A G4 company gets a dedicated operator,
  its own cap table, and leaves the shared launch stack. The studio keeps the playbook,
  the channel learnings, and equity.

---

## 6. What the system automates (build order, once we commit)

1. **Intake & scoring** — candidate registry, the §3 scorecard, G0 memos.
2. **Launch stack** — templated landing pages, outbound sequencing (Apollo or similar),
   ad deployment, shared analytics with the §4 gate metrics computed identically for
   every launch.
3. **Cohort dashboard** — every live launch against its gate, days-to-cap remaining,
   kill/extend/promote queue.
4. **Domain-expert synthesis** — the AI research pipeline that maps a vertical (workflow,
   regulations, tooling, communities, job titles) and drafts the G0 memo, so candidate
   generation itself approaches zero cost.

The system should make killing easy and launching cheap. If it ever makes launches feel
precious, it has failed.

---

## 7. Open questions to resolve before building

1. **Legal/ops chassis:** one holding entity with DBAs per launch until promotion, or an
   entity per launch? (Holding-entity-until-promotion is cheaper and faster; confirm with
   counsel.)
2. **Naming/branding debt:** cheap-to-launch brands that don't embarrass a promoted
   company later.
3. **What happens to killed launches' assets** — the code is worthless by thesis, but the
   channel data and the vertical research are not; they need a home the next cohort reads.
4. **Human bandwidth at the gates:** who reviews, and what is the max number of concurrent
   live launches one reviewer can honestly evaluate? That number, not budget, sets batch
   size.
