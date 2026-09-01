# Last-Z Engine: Multi-Phase Specification

Companion to `FRAMEWORK.md`. The framework defines *what* we decide (lanes, scorecard,
gates); this spec defines the system that executes it — from candidate intake through
market test — and how it integrates the operating stack:

| Tool | Role | Stages it serves |
|------|------|------------------|
| **Neubloc (email engine)** | Outbound sequences, smoke-test campaigns, nurture flows | G1 smoke → G3 money |
| **Vox** | Social media: audience listening during selection, distribution and demand-gen during testing | G0 research → G3 |
| **Forum (CRM)** | System of record for every lead, account, and conversation across all launches | G1 → promotion |

Guiding principle from the framework: **the engine must make launching cheap and killing
easy.** Every phase below ships something usable on the next cohort; nothing waits for
the full build.

---

## Architecture overview

One shared platform, multi-tenant by launch. Core objects:

- **Candidate** — an idea in the selection pipeline. Carries lane (§2.2 substitution /
  §2.3 vertical), scorecard, G0 memo, research corpus.
- **Launch** — a candidate that cleared G0. Owns a brand, a landing property, channel
  configs (Neubloc sequence IDs, Vox account/campaign IDs, Forum pipeline ID), gate
  state, budget/time caps.
- **Persona** — named buyer definition per launch: titles, firmographics, watering holes,
  channel hypotheses.
- **Signal** — a normalized event: `{launch_id, channel, stage, actor, event_type,
  timestamp, value}`. Everything the gates consume is a Signal. Channel adapters
  (Neubloc, Vox, Forum, web analytics) translate native events into this one schema —
  this is the heart of the engine, because it is what makes cohorts comparable.
- **Gate record** — per launch per gate: thresholds *written at G0*, current metrics,
  cap countdown, decision + memo.

Integration style: thin adapters over each tool's API/webhooks. The engine never
re-implements email sending, social posting, or CRM storage — it orchestrates and
normalizes. If a tool lacks an API for something, the adapter degrades to a CSV
import/export step rather than blocking the phase.

---

## Phase 1 — Selection engine (candidate intake → G0)

**Goal:** any idea can go from raw thesis to a scored, evidenced go/no-go decision in
≤ 2 days of human attention.

Deliverables:
1. **Candidate registry** — repo-backed to start (one directory per candidate:
   `candidates/<slug>/memo.md`, `scorecard.yaml`, `research/`). No database until Phase 3
   proves we need one.
2. **Scorecard as code** — the 10 dimensions from FRAMEWORK §3 in a schema with the two
   gating dimensions (buyer reachability, time-to-signal) enforced: a candidate scoring
   below threshold on either is auto-marked `untestable` regardless of total.
3. **AI domain-expert research pipeline** — given a vertical/category, produce the G0
   research corpus: workflow map, regulatory landscape, incumbent/legacy vendors, budget
   evidence, persona draft with titles and firmographics, watering-hole inventory
   (communities, subreddits, associations, hashtags). **Vox integration (read-only):**
   social listening queries to size and locate the audience — where does this persona
   actually congregate, what language do they use for the pain, who are the loud voices.
   Listening output feeds scorecard dimension 2 (reachability) with evidence instead of
   guesses.
4. **G0 memo generator** — drafts the one-page memo from scorecard + corpus; a human
   edits and signs it. The memo must contain the *pre-committed* G1–G3 thresholds and
   caps (framework rule: thresholds are written before launch, never after seeing data).

Acceptance: run 10 real candidates through it; ≥ 8 reach a signed G0 decision within the
2-day cap; both gating dimensions have evidence attached, not vibes.

---

## Phase 2 — Launch stack (G0 → G1 smoke test live)

**Goal:** a cleared candidate goes from G0 sign-off to a live, instrumented smoke test in
≤ 3 working days.

Deliverables:
1. **Landing property template** — brandable landing page (positioning, intent-qualifying
   capture form, pricing-signal block), deployed per launch on a shared host under its
   own domain. Every page emits Signals (visit, scroll-depth, form start, qualified
   capture) tagged with `launch_id` and channel attribution (UTM discipline enforced by
   the template — hand-built links are how attribution dies).
2. **Neubloc adapter (outbound):**
   - Push: create/update sequences from launch playbook templates (2 angles per launch,
     per the one-re-angle rule); load target lists built from the persona definition.
   - Pull: webhook/poll delivery, open, reply, positive-reply classification into
     Signals. Reply text lands in Forum (below), metrics land in the Signal store.
   - Guardrails: per-launch sending domains (never the studio's root domain), warm-up
     scheduling, global suppression list shared across all launches so one person is
     never sequenced by two launches simultaneously (framework §5: correlated channels).
3. **Vox adapter (distribution):**
   - Push: per-launch social profiles/campaigns; scheduled content from the launch
     playbook; paid boosts where the persona warrants it.
   - Pull: impressions, engagements, click-throughs, DM/comment leads → Signals; DM
     leads forwarded into Forum.
4. **Forum adapter (CRM):**
   - One Forum workspace, one pipeline per launch, shared stage taxonomy across ALL
     launches: `Captured → Qualified → Conversation → Pilot/Paid → Retained` (plus
     `Disqualified`). The shared taxonomy is non-negotiable — it is what makes G-gate
     metrics identical across launches.
   - Every lead from any channel (Neubloc reply, Vox DM, landing capture) is upserted to
     Forum with source attribution within minutes. Forum is the single system of record
     for *people*; the Signal store is the system of record for *metrics*. Stage changes
     in Forum flow back as Signals.
5. **Launch checklist runner** — brand assets, domain, page, sequences, social, pipeline,
   thresholds loaded, caps armed. A launch is "live" only when the checklist is green.

Acceptance: launch cohort 1 (3–5 candidates) with ≤ 3 days G0→live each; every lead in
Forum traceable to its channel; zero cross-launch duplicate sequencing.

---

## Phase 3 — Signal engine & gate management (G1 → G3)

**Goal:** gate decisions become a weekly review of a queue, not an archaeology project.

Deliverables:
1. **Signal store + metric definitions** — the normalized event stream persisted
   (database earns its keep here), with the gate metrics from FRAMEWORK §4 computed
   identically for every launch: qualified-capture rate (G1), activation and week-2
   unprompted return (G2), paying customers with at least one from pure outbound (G3),
   plus channel-level CAC-to-signal.
2. **Cohort dashboard** — every live launch vs. its pre-committed thresholds: current
   value, trend, days-to-cap remaining, spend vs. budget cap. Color state is computed,
   not asserted.
3. **Kill/extend/promote queue** — when a launch hits its cap or clears its gate, it
   enters the decision queue. Kill is the default: an `extend` requires an attached memo
   naming the one specific re-angle and its new (shorter) cap; the system enforces the
   one-re-angle-per-gate rule by refusing a second extension at the same gate.
4. **Stage-appropriate signal weighting** — self-serve launches gate on activation
   metrics; sales-assisted ones gate on Forum stage progression (calls held, pilots
   signed). Which profile applies is declared at G0, not chosen after.
5. **Post-mortem capture** — killing a launch triggers a structured write-back:
   channel performance, message performance, persona learnings, filed into the research
   corpus where Phase 1's pipeline reads it for future candidates (framework open
   question #3 — killed launches' channel data and research outlive the code).

Acceptance: cohort 2 runs entirely on the dashboard; every kill/extend decision has a
gate record with pre-committed thresholds; at least one Phase-1 candidate memo cites
learnings from a killed launch.

---

## Phase 4 — Portfolio operations & promotion (G3 → G4 and steady state)

**Goal:** the studio runs multiple concurrent cohorts without decision-attention
becoming the bottleneck it inevitably wants to become.

Deliverables:
1. **Portfolio view** — all launches across cohorts by lane (substitution vs. vertical),
   gate stage, spend, and signal quality; lane-mix tracking against the 2/3–1/3 starting
   ratio with per-cohort adjustment (FRAMEWORK §5).
2. **Cadence automation** — cohort scheduling, gate-review calendar, reviewer load
   metering (framework open question #4: max concurrent live launches per reviewer is
   measured, then enforced as the batch-size cap).
3. **Promotion workflow (G4)** — a promoted launch is re-founded, not graduated:
   checklist for spinning out (entity, operator, cap table per counsel's answer to open
   question #1), **data handover** (its Forum pipeline and lead history export cleanly to
   the new company's own stack), and **playbook retention** (channel and message learnings
   stay in the studio corpus).
4. **Channel health & compliance** — deliverability monitoring across Neubloc sending
   domains, Vox account standing, suppression-list integrity, CAN-SPAM/GDPR hygiene
   (per-launch privacy policy on every landing property, honored opt-outs shared
   globally).
5. **Candidate generation flywheel** — Phase 1's research pipeline runs continuously
   against the accumulated corpus and Vox listening data to propose candidates, so the
   top of the funnel approaches zero marginal cost too.

Acceptance: two cohorts running concurrently with gate reviews inside their calendar
slots; first promotion (or a portfolio review explaining why none) executed through the
workflow.

---

## Cross-phase requirements

- **Attribution discipline:** every outbound touch (email link, social post, ad) carries
  launch + channel + angle tags; the landing template rejects untagged campaign traffic
  into a `direct/unknown` bucket that the dashboard surfaces (if that bucket grows,
  instrumentation is broken — treat as an incident).
- **Identity resolution:** one person appearing across channels (opened email, then DM'd
  on social, then signed up) resolves to one Forum contact and one Signal actor.
  Email-first matching; good enough beats perfect.
- **Tenancy & blast-radius:** launches share infrastructure but never sending
  reputation, branding, or data visibility; a spam complaint on one launch cannot burn
  another's domain.
- **Human-in-the-loop boundaries:** the engine drafts and schedules; a human approves
  G0 memos, first sends of any new sequence, and every kill/extend/promote decision.
  Nothing customer-facing goes out unreviewed in cohort 1–2; loosen deliberately later.
- **Tool abstraction:** Neubloc/Vox/Forum sit behind adapter interfaces
  (`EmailChannel`, `SocialChannel`, `CRMStore`) so a tool swap is an adapter, not a
  rewrite.

## Build order & dependencies

Phase 1 has no dependencies — start immediately; its outputs are useful even run by
hand. Phase 2 needs Phase 1's persona/threshold outputs and API access to all three
tools (first integration task: confirm Neubloc, Vox, and Forum API/webhook capabilities;
any gap becomes a CSV bridge, logged as debt). Phase 3 needs Phase 2's Signal emission.
Phase 4 needs a cohort's worth of Phase 3 history. Cohort 1 can launch at end of
Phase 2 with gates reviewed semi-manually — do not hold cohort 1 for Phase 3.

## Open items to confirm

1. API surface of Neubloc's email engine (sequences, webhooks, suppression) — determines
   how much of the Phase 2 adapter is real-time vs. batch.
2. Vox capabilities: does it cover listening (Phase 1 research) as well as
   posting/campaigns (Phase 2), or do we need a separate listening source?
3. Forum: multi-pipeline support in one workspace, webhook support for stage changes,
   and API rate limits at portfolio scale.
4. Signal store technology choice — deferred to Phase 3 by design; a spreadsheet-grade
   store is acceptable through cohort 1.
