# A Hard Look at the Parallel-Launch Thesis

Companion to `FRAMEWORK.md` and `ENGINE-SPEC.md`. Those documents assume the thesis and
optimize its execution. This one attacks it, then proposes modifications that keep what
is right about it while fixing the weakest joints.

## What the thesis gets right

- Build cost really is collapsing, and the portfolio logic that follows is sound: when
  experiments are cheap, run many and let evidence pick.
- The instinct to avoid incumbent installed bases, and the read that AI-as-domain-expert
  opens verticals that were previously too expertise-bound or too small, are both correct.
- Writing kill criteria before launch is the single best process decision in the
  framework; most portfolios die of moved goalposts, not bad ideas.

## Five hard problems

### 1. Signal-selected is not success-selected (the biggest one)

The gates measure *detectability*, not *durability*. Smoke tests and lead metrics select
for markets that respond to smoke tests: impulsive buyers, low-trust purchases, SMB
self-serve — which are also the churniest, most competitive, lowest-moat markets. The
best businesses (high trust, considered purchase, deep workflow) are precisely the ones
that look dead on a four-week lead dashboard. Run naively, the engine systematically
promotes the worst businesses that produce the best early signals. Early leads predict
interest; only paid, repeated usage predicts a business.

### 2. Attention doesn't parallelize

Code cost went to zero; founder-grade attention did not, and it divides badly. Twenty
launches at 5% attention each are not one company at 100%. The moment a launch shows
life, it is competing against dedicated founders at full obsession — the window between
"signs of life" and "a focused team catches up" is short and shrinking. The promote step
quietly assumes a great operator can be found and installed at exactly the right moment.
That is the actual bottleneck of every studio in history, it is a recruiting problem not
a software problem, and the best founders are reluctant to adopt someone else's idea for
a minority stake. Studios don't die of bad ideas; they die of operator quality and
studio-heavy cap tables that repel both operators and downstream investors.

### 3. Everyone can run this play, and the channels are decaying

The same zero-cost logic arms thousands of others running parallel launches. The engine's
channels — cold email, social, landing pages — are exactly the ones being flooded by
AI-generated outbound. Reply rates are falling, buyers are developing antibodies to
landing-page-plus-sequence probes, and search is being eaten by AI answers. Two
consequences: signal thresholds calibrated today decay (recalibrate per cohort against a
control, don't trust absolute numbers), and channel access itself — a warm list, a
community, a brand — becomes the scarce asset, which the fully-diversified
twenty-unrelated-launches design keeps throwing away and rebuying.

### 4. The substitution lane has a structural ceiling

Selling de-configured systems of record to startups means: customers that churn by dying,
low ACVs, and winners who graduate off the product. Attio-style plays work by raising
heavily and surviving long enough to move upmarket — meaning the "cheap launch" advantage
evaporates at exactly the moment a launch succeeds, and the promoted company immediately
needs conviction-scale capital. The lane is fine for the portfolio; just price in that
its wins are capital-hungry and its early signals are the most flattering.

### 5. Brand and trust debt compounds across kills

Vertical markets are small, tight communities — the same watering holes the research
pipeline targets. Twenty disposable brands doing outbound, with eighteen abandoned —
dead domains, orphaned users, complaint residue — leave traces. Burning a vertical with a
half-hearted probe can poison it for a later, serious entry. Killed launches need a
respectful wind-down (user notice, data export, domain kept alive), and the studio should
treat each vertical community as a durable asset it might return to.

## Alternative approaches

**A. Sell the work before building the product (strongest change).** In the vertical
lane, replace "launch product, count leads" with "sell the outcome as an AI-powered
productized service, delivered part-manually at first." Revenue, repeat purchase, and
renewal become the signal — the only ones that survive problem #1 — and delivering the
service manually generates the exact workflow knowledge and proprietary data the eventual
product needs. Codify into software only what customers already pay for. This is slower
per test but each test is worth ~10x more evidence.

**B. Tournament, not lottery.** Twenty parallel shallow probes at equal weight is the
wrong shape given problem #2. Run batches of ~5 with fast reallocation: kill fast, but
*concentrate immediately* on survivors — a G2 pass should trigger a step-change in
attention and budget that week, not at some distant promotion ceremony. The portfolio's
alpha comes from speed of reallocation, not breadth of deployment.

**C. Operator-first inversion.** Recruit a bench of 3–5 hungry domain operators *before*
scaling launches, run the engine as their selection-and-launch infrastructure, and give
real founder equity from day one. This dissolves the promotion bottleneck (the operator
was there from G1), fixes attention, and fixes the cap-table problem that kills studio
spinouts downstream. The operator bench is the slowest asset to build — start now, in
parallel with Phase 1.

**D. Cluster launches by audience instead of fully diversifying.** Instead of twenty
uncorrelated companies, pick one or two vertical audience clusters and launch many
products into them. Each launch then compounds a shared asset — the studio's list, brand,
community trust, and data in that vertical — instead of rebuying attention from zero.
FRAMEWORK §5 warns against correlated channels; that is right for simultaneous
independent launches, but *deliberate sequential correlation* is a different and likely
stronger strategy: the portfolio converges toward a vertical platform. This directly
counters problems #3 and #5.

**E. Be honest about where the enterprise value accrues.** After a few cohorts, the
engine itself — calibrated thresholds, channel performance data, the operator playbook —
may be worth more than any individual launch. That's fine, but model studio economics
now: expected value = (hit rate) × (ownership retained at promotion) × (outcome size),
and problems #2 and #4 pressure the second and third terms. If the honest model only
works with studio-heavy ownership, it conflicts with alternative C, and that conflict
should be resolved on paper before cohort 1, not discovered at the first spinout
negotiation.

## Recommendation

Keep the engine and the gates — they are the right machinery. Change four things:

1. **Primary signal: paid usage and retention, not leads.** Service-first (A) in the
   vertical lane wherever the workflow allows; leads demoted to a G1 reachability check.
2. **Batch shape: ~5-launch tournaments with immediate concentration on survivors (B),**
   not twenty-wide equal-weight deployment.
3. **Start recruiting the operator bench now (C)** — it gates promotion and is the
   slowest asset to acquire; decide the equity model before cohort 1.
4. **Cluster at least half of each cohort into shared audience verticals (D)** so
   channel spend compounds instead of evaporating with each kill; wind down kills
   respectfully to preserve the vertical for re-entry.

The thesis survives the critique, but its center of gravity moves: from "launch many
cheap products and detect leads" to "run cheap, evidence-ranked tournaments that
concentrate scarce attention, capital, and channel trust onto paid demand as fast as
possible."
