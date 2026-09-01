# Lessons from Polis (FourPaths) applied to Last-Z

Polis is the founder path of the FourPaths system: it takes a person through
profile → candidate ventures → research → analysis → decision brief, and its
governing doctrine is *"the product exists to be able to say no."* That is the
same job as our G0 gate. This note records what transfers, what we adopted
immediately, and what is queued — with the FourPaths sources for each.

## Adopted into Phase 1 now (code changes in this commit)

1. **The anti-recommendation is a required artifact, not a risks list.**
   Polis requires every decision brief to carry the strongest case *against*,
   with falsifiable conditions and a kill criterion — and treats "an
   anti-recommendation containing no falsifiable condition" as a failing test.
   → Last-Z: `case_against` and `kill_criterion` are now G0 declarations; a
   candidate cannot be approved without both, and they render in the memo.
   The kill criterion is the sharpest possible complement to our
   pre-committed thresholds.
2. **Bands must be harsh, carry a verb, and actually reach the screen.**
   Polis bands scores (Strong ≥85 "Rare. Act on it." … "Not this one" <40)
   but computes the band and never renders it — rigor in code review, nothing
   for the user. → Last-Z: deterministic `band()` in `models.py`, shown in
   Mission Control and the memo. Thresholds deliberately harsh: a scorer that
   calls 75% "excellent" is not helping anyone decide.
3. **Never let the total renormalize over missing dimensions.** Polis's
   `overall()` divides by the weight actually present, so a model that omits
   the heaviest dimension silently produces a valid-looking score. → Last-Z
   already refuses to band or decide an incomplete scorecard (status stays
   `draft`); a regression test now pins that behavior explicitly.
4. **Determinism boundary.** Polis's best idea: the model judges dimensions;
   typed code computes totals and bands, because "asking a model to both
   judge and total lets it move the total toward the conclusion it already
   reached." Last-Z already works this way — status, totals, gates, and
   decidability are pure functions in `models.py`, and tests assert them with
   no model in the loop. This is now written down so it survives refactors.

## Already true in Last-Z (keep, and defend)

- **Gate before the first spend.** Polis counts a run only after the free
  welcome stage; our G0 costs two days of attention before any launch budget.
- **Tests exist.** The Polis spec lists ten acceptance tests and then admits
  none were written; its "never silently scored" constraint exists only in
  prose. Our gating, declaration, and lock rules are enforced server-side and
  covered by the suite — every future invariant added to the spec gets a test
  in the same commit, or it does not go in the spec.
- **Don't charge or reward on outcomes.** Their pricing doctrine (per pass,
  never per outcome, "charging on outcomes creates a financial interest in
  yes") maps to our reviewer incentives: gate reviews must never be scored on
  approval counts, or kill-by-default dies.

## Queued for later phases

- **Append-only refinements (Phase 1.5, registry).** Polis never mutates a
  candidate on refinement: a new record with `derived_from`, `operation`,
  `superseded_by`, and a mandatory `tradedAway` note — "a refinement loop that
  only ever improves things is lying." Our one-re-angle rule should be stored
  this way so month four can answer "why did month two choose this?"
- **Evidence provenance and rot (Phase 1 research pipeline / Phase 3).**
  Per-record source + date + confidence, staleness cadences by kind
  (30/60/90/120/180 days), records past 2× cadence marked *rotten*, contested
  figures stored as claims never averaged, and "not covered" never reported
  as "nothing found." Our scorecard evidence fields should graduate from
  free text to this shape when the research pipeline lands.
- **A bias pass on the finished memo (research pipeline).** Polis runs its
  strongest model over the *written* brief hunting named failure modes —
  anchoring on the first candidate, famous-company pattern-matching, an
  anti-recommendation written to be dismissed. Add as a memo-generation step.
- **Two-tier test harness (Phase 2).** A stubbed-model pipeline smoke test
  (catches prompt-schema/renderer drift) plus a paid live run with
  deliberately messy personas ("a persona that answers tidily tests
  nothing"). Their live runs found three demo-killing bugs and showed their
  cost estimate was 2× low — measure a real pass before pricing anything.
- **Blocking lint on outbound claims (Phase 2, Neubloc/Vox content).** Reject
  — don't warn on — drafts containing unratified prices, commitments, claims
  about unbuilt capability, or excluded segments.
- **Routing off the product (Phase 4).** Polis encodes "this person is in the
  wrong place" as a structured handoff. Our equivalent: a candidate that
  fails gating but scores well is explicitly routed to a conviction-funded
  track, not just marked untestable.

## Avoid (their documented scars)

- "Done and verified" without checking the produced artifact (their session
  middleware sat dead for weeks while the checklist said done).
- Retrofitting multi-user onto a single-user store (their retrofit shipped an
  unauthenticated list/switch/delete surface). We decide tenancy before the
  Phase 3 database migration, not after.
- Version/state strings that drift from reality ("built is not live") — state
  promotion is part of the run that changes it.
- Describing one engine in three documents; extract the engine, make variants
  config. (Our FRAMEWORK/ENGINE-SPEC split holds one description each.)
- Copying shared code into each deployable without a drift checker.
