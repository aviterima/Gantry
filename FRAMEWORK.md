# Gantry: A Selection Framework for Parallel Company Launches

## 0. The thesis, restated

The marginal cost of writing software to address a market need is converging on zero.
Therefore, instead of picking one company and betting years on it, we run cheap,
evidence-ranked **launch tournaments**: batches of ~5 parallel launches, each
instrumented for demand signals — with **paid usage and retention** as the signals that
count — killing the ones that stay dark, concentrating attention and budget on survivors
the week they clear a gate, and promoting the one or two in twenty that prove paid
demand into fully-resourced companies.

This document is the framework for the **selection** problem: which launches enter each
tournament, and how we decide, early and cheaply, which to kill, which to concentrate
on, and which to promote. The model's structural risks and the four modifications
adopted in response are argued in `CRITIQUE.md`; this document reflects the
post-critique model.

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

### 2.1 The one exclusion: attacking established enterprise incumbents head-on

Incumbents like Salesforce, SAP, and Workday have three assets we cannot replicate: deep
embedded functionality, decades of workflow lock-in, and — most importantly — the
proprietary data their customers have poured into them. The most likely incumbent move is
exactly the one predicted in the thesis: push an AI-native interface *on top of* the
existing system, leveraging all the functionality and data underneath. When that happens,
"AI wrapper around what Salesforce already stores" is a dead category. **We do not attack
the installed base.** That is the only structural exclusion — both lanes below are fully
in play.

### 2.2 Lane one: product substitution — de-configured systems of record for younger and smaller companies

Established horizontal categories remain attractive when the play is **substitution, not
displacement**: a de-configured, inexpensive, AI-native version of a proven system,
targeted at companies the incumbent does not really serve — startups, young companies,
and smaller businesses for whom the incumbent's depth is a liability (complexity, cost,
admin overhead), not a moat. The incumbent's data-gravity only holds companies that
*already have data inside*; a two-year-old startup has nothing to migrate. This is the
Attio play in CRM: an AI-native, radically simpler system of record aimed at companies
too young to be locked in.

This lane has real structural advantages for the parallel-launch model: the category is
already validated (no need to prove the problem exists), the buyer already understands
what the product is, budget substitution beats budget creation (scorecard dimension 4),
and demand signals come through clean, fast, self-serve channels. Its main hazard is
crowding — it is the obvious play, so every well-funded studio is running it. Our filter
for entering it:

- Pick systems of record where **no credible AI-native challenger has yet emerged**
  (CRM has Attio; but consider e.g. PLM, quality management, clinical trial management,
  fund administration, grant management).
- The buyer must be reachable through channels we can automate (see §4).
- The wedge must generate its own data moat fast — the product should get better with
  each customer's usage in a way a later entrant can't shortcut.

### 2.3 Lane two: vertical solutions where AI is the domain expert

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

**Default entry mode for this lane: sell the work before building the product.** Where
the workflow allows, the first offer is an AI-powered productized service — the outcome
the buyer already pays a consultant, vendor, or headcount for, delivered part-manually
at first. Revenue, repeat purchase, and renewal become the demand signal (the only
signals that survive the selection bias in §1), and manual delivery generates exactly
the workflow knowledge and proprietary data (dimension 7) the eventual product needs.
Software is codified from what customers already pay for, not launched on spec. A
launch's delivery mode — service-first or self-serve product — is declared at G0 and
determines which gate profile in §4 applies.

---

## 3. The selection scorecard

Score every candidate 1–5 on each dimension. The scorecard's purpose is not the total —
it is to force the same questions to be answered for every candidate before launch, and
to make kill decisions later feel less personal.

| # | Dimension | Question | Disqualifier |
|---|-----------|----------|--------------|
| 1 | **Pain intensity** | Is this hair-on-fire (compliance deadline, revenue leak, labor shortage) or a vitamin? | Nice-to-have with no forcing event |
| 2 | **Buyer reachability** | Can we reach 1,000+ qualified buyers through automatable channels (outbound, SEO, ads, communities) for < $2k? | Buyer identifiable only through relationships |
| 3 | **Time-to-signal** | Will a real buyer pay or make a paid commitment within 4–6 weeks of launch? | Sales cycle structurally > 1 quarter |
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
For dimension 3, the signal that must arrive quickly is a *payment or paid commitment*,
not a lead. Dimensions 6 and 7 are what separate a real company from a demo. Dimension 8
includes operator-bench fit: at equal scores, a candidate matched to a bench operator
(§5) outranks an unmatched one, and clearing G0 without a plausible operator match is an
explicit exception, not the norm.

---

## 4. The signal engine: how "signs of life" are measured

Every launch ships with the same instrumentation so tournaments are comparable. **Paid
usage and retention are the primary signals; lead metrics are demoted to a G1
reachability check** — leads are the most gameable, least predictive metric in an
AI-saturated channel world, and gating on them selects for detectable markets rather
than durable ones (see `CRITIQUE.md` §1). Default thresholds below — tune per category,
but write the threshold down *before* launch; moving goalposts after seeing data is how
zombie companies are born.

| Gate | What we ship | Signal we need | Budget/time cap | Kill condition |
|------|--------------|----------------|-----------------|----------------|
| **G0 — Thesis** | Scorecard + one-page memo | Score clears bar; named buyer persona, channel, delivery mode (service-first or self-serve), cluster assignment, operator match | 2 days | Fails a gating dimension |
| **G1 — Reachability** | Landing page + outbound sequence / ads to ~1–2k targets | Proof the buyer is reachable and the pain resonates: ≥ 2–5% qualified conversion (call booked, service inquiry, high-intent capture). A pass here proves *testability*, not demand | $1–2k, 2–3 weeks | Sub-1% with two message/angle iterations |
| **G2 — Engagement** | *Service-first:* first paid engagements, delivered part-manually. *Self-serve:* working wedge product in signups' hands | *Service-first:* ≥ 2–3 paid engagements delivered and accepted. *Self-serve:* ≥ 30–40% activation and unprompted week-2 return | 4–6 weeks | No one pays for the service / users try once and vanish despite fixes |
| **G3 — Retention** | Pricing, renewals, repeat engagements | ≥ 3–5 paying customers with at least one from pure outbound (not a friend), **and at least one renewal or repeat purchase** | 4–8 weeks | Everyone buys once, nobody comes back |
| **G4 — Promote** | Decision memo | Retention curve flattening + payback math + repeatable channel + operator committed | — | — |

Three rules that matter more than the thresholds:

- **The kill decision is the default; promotion requires evidence.** With a 5–10% expected
  hit rate, the portfolio's biggest risk is not failed launches — it is *ambiguous,
  middling* launches that consume attention for months. A launch that hasn't cleared its
  gate by the cap is killed unless someone writes a memo arguing for one specific,
  time-boxed extension.
- **One re-angle per gate.** A weak G1 earns exactly one repositioning attempt (new
  message, new segment, same product thesis). If the second attempt also misses, the
  thesis is wrong, not the copy.
- **Concentration is immediate, not ceremonial.** A G2 pass triggers a step-change in
  attention and budget *that week* — the matched operator goes hands-on, spend caps
  rise, the launch jumps the review queue. The window between "signs of life" and "a
  fully-focused competitor catches up" is short; the tournament's alpha is speed of
  reallocation, not breadth of deployment.

A launch's gate profile follows its G0-declared delivery mode; anything heavier than
SMB sales-assisted probably fails the gating dimensions and shouldn't be in this
portfolio.

---

## 5. Portfolio construction

- **Tournament, not lottery.** Launch in tournaments of ~5 every 6–8 weeks, never 20 at
  once at equal weight. Kill fast, and *concentrate immediately* on survivors — a gate
  pass reallocates attention and budget the same week (§4). The portfolio's alpha comes
  from speed of reallocation, not breadth of deployment; the launch stack also improves
  with each tournament, and later launches inherit it.
- **Cluster by audience.** At least half of each tournament targets one or two shared
  audience verticals, so each launch compounds a durable studio asset in that vertical —
  the list, the brand trust, the community presence, the data — instead of rebuying
  attention from zero. Sequential correlation is a strategy: successive launches into a
  cluster get cheaper and more credible, and the cluster converges toward a vertical
  platform. *Simultaneous* launches to the same persona through the same channel still
  compete for the same attention — stagger those within a cluster.
- **Diversify across the two lanes:** both are legitimate; only head-on attacks on
  incumbent installed bases (§2.1) are excluded. As a starting mix, roughly 2/3 vertical
  greenfield (§2.3) and 1/3 product-substitution (§2.2), then let gate outcomes per
  tournament adjust the ratio. The vertical lane tends toward better moats; the
  substitution lane toward faster, more flattering signals and more capital-hungry wins —
  don't let the dashboard's legibility alone bias the whole portfolio into it.
- **Operator bench before scale.** Recruit a bench of 3–5 hungry domain operators before
  scaling launch volume — it is the slowest asset to build and it gates promotion.
  Candidates are matched to bench operators at G0 where possible; a matched operator goes
  hands-on at the G2 concentration trigger and receives real founder equity from day one,
  not a minority stake at promotion. The operator-equity model must be resolved on paper
  before the first tournament (§7).
- **Cost model:** at roughly $3–8k fully-loaded per launch through G2, twenty launches cost
  less than one seed-stage engineer-year. The binding constraint is not money — it is
  decision-making attention at the gates. Protect gate reviews; they are the actual product
  of the studio.
- **Kills are wound down respectfully.** Each vertical community is a durable asset the
  studio may return to: killed launches give users notice and a data export, honor
  refunds on undelivered service work, and keep domains alive. Eighteen abandoned brands
  with complaint residue can poison a cluster for a later, serious entry.
- **Promotion formalizes what concentration started.** With the operator hands-on since
  G2, a G4 promotion is the paperwork moment — own entity, own cap table, leaving the
  shared launch stack — not a search for a founder. The studio keeps the playbook, the
  channel learnings, the cluster assets, and equity.

---

## 6. What the system automates (build order, once we commit)

The full build specification lives in `ENGINE-SPEC.md` (which names the operating
stack: Neubloc for email, Vox for social, Forum for CRM). The entry point is
**Mission Control** — a single control, configuration, and data-summary dashboard
through which the whole system is operated — and every launch's software is built
spec-first on a professional engineering template so that, once a launch passes the
viability gates, its specs, code, and operating history hand off cleanly to a
dedicated team. In summary:

1. **Intake & scoring** — candidate registry, the §3 scorecard, G0 memos with delivery
   mode, cluster assignment, and operator match.
2. **Launch stack** — templated landing/booking pages, outbound sequencing, social
   distribution, shared CRM pipelines, with the §4 gate metrics computed identically for
   every launch.
3. **Tournament dashboard** — every live launch against its gate, days-to-cap remaining,
   the kill/extend/promote queue, and the G2 concentration trigger.
4. **Domain-expert synthesis** — the AI research pipeline that maps a vertical (workflow,
   regulations, tooling, communities, job titles) and drafts the G0 memo, so candidate
   generation itself approaches zero cost.
5. **Operator bench registry** — the bench, their domain profiles, current load, and
   candidate matching at G0.
6. **Engineering handoff** — per-launch PRD/architecture/ADR spec sets, a golden repo
   template with CI and tests from the first commit, a known-debt register, and an
   automatically assembled handoff package at the G2 concentration trigger and at G4
   spinout.

The system should make killing easy and launching cheap. If it ever makes launches feel
precious, it has failed.

---

## 7. Open questions to resolve before building

1. **Legal/ops chassis and the operator-equity model — must be resolved before the
   first tournament.** One holding entity with DBAs per launch until promotion, or an
   entity per launch (holding-entity-until-promotion is cheaper and faster; confirm with
   counsel)? And the harder one: what equity does a bench operator get at match, at the
   G2 concentration trigger, and at spinout? If honest studio economics only work with
   studio-heavy ownership, that conflicts with attracting real operators — resolve the
   conflict on paper now, not at the first spinout negotiation.
2. **Naming/branding debt:** cheap-to-launch brands that don't embarrass a promoted
   company later — with cluster-shared brands (§5) raising the stakes, since a cluster
   brand outlives any single launch.
3. **Killed launches' assets:** the wind-down protocol and post-mortem write-back are
   specified in `ENGINE-SPEC.md` (Phase 3); what remains open is retention policy —
   how long domains, lists, and service commitments are maintained after a kill.
4. **Human bandwidth at the gates:** who reviews, and what is the max number of concurrent
   live launches one reviewer can honestly evaluate? That number, not budget, sets
   tournament size — and the G2 concentration rule tightens it further, since every
   survivor consumes a multiple of a probe's attention.

## v0.3 approval policy clarification

New G0 approvals require at least 35/50 (Credible), in addition to all gating
and declaration requirements. Conditional and lower bands must improve before
launch approval. This policy is proposed in the v0.3 review branch. Existing
signed decisions remain historical records. See ADR-0003.
