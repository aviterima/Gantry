# Gantry v0.4 — testing guide

This build covers selection, structured precommitment, tournaments, launch readiness,
landing previews, CSV signals, G1–G3 reviews, concentration, wind-down, promotion,
contact reservations, suppression, portfolio summaries and handoff ZIPs.
It does not send campaigns, process payments, provision domains, or create entities.
Provider APIs remain unverified. Use fictional information for the initial test.

## Start on Windows

1. Install Python 3.11+ and Node.js 22+ if they are not already installed.
2. Download the GitHub branch ZIP and extract it completely.
3. Double-click **Start-Gantry.cmd**. The first run installs Python dependencies.
4. The browser opens **http://127.0.0.1:8765**. Enter the email and generated access
   key printed in the command window. Leave that window open while testing.

The local server runs on your computer. It is not a hosted public URL.
The `.testing-data` folder preserves test data and the reviewer key between runs.
The launcher never seeds the operational `data/` directory or changes its allowlist.
Deleting `.testing-data` resets the sandbox, so do that only deliberately.

macOS/Linux: run `./start-gantry.sh` from the extracted folder. To start without
opening a browser, set `GANTRY_OPEN_BROWSER=0`. Set `GANTRY_TEST_PORT` if 8765 is occupied.

## First test: service-first launch to promotion

1. Open **Launch operations** from Selection.
2. Create a **Sandbox** tournament with capacity 5 and your next review date.
3. Choose **Prepare launch → Sandbox · Contractor estimating**. This is an explicitly
   synthetic approved candidate with small test thresholds, not a business decision.
4. Open the launch. Review **Edit offer & playbook**. Record sandbox evidence for all
   eight readiness checks, then activate the test launch.
5. Open the landing test preview. Enter `buyer-1` and a fictional need. Submission
   records a visit, form start, capture and service booking. It sends no email.
6. Return to operations and reload. Pass G1 with a rationale.
7. Import the CSV below, replacing timestamps with the current UTC time after launch
   activation. Example format: `2026-09-29T19:00:00.000Z`.

```csv
id,event_type,timestamp,actor,channel,angle,value_cents,order_id,unprompted,pure_outbound,crm_stage
test-payment-1,payment,REPLACE_WITH_CURRENT_UTC,buyer-1,email,angle-a,10000,order-1,false,true,
test-delivery-1,delivered,REPLACE_WITH_CURRENT_UTC,buyer-1,email,angle-a,0,order-1,false,false,
```

8. Pass G2. Confirm concentration by naming a fictional hands-on operator and
   authorizing an additional budget. Download the first handoff ZIP.
9. Import a second payment with a new event ID and `order-2`, for the same actor.
   G3 now has an outbound payer and repeat purchaser. Pass G3.
10. Record evidence for all six promotion checklist items; use explicit test-only
    descriptions, not assertions that real legal work has occurred. Confirm promotion.
11. Download the final ZIP. Inspect the signals, audit, signed plans, staged CRM and
    launch scaffold. Run its smoke test. Closed launches reject further signals.

For convenience, the automated browser test performs this entire path without
external accounts. All thresholds and signals in that test are synthetic.

## Other acceptance scenarios

| Scenario | Expected behavior |
|---|---|
| Cancel a decision dialog | No state change |
| Approve without gate evidence | Blocked |
| Edit signed G0 thresholds | Blocked |
| Launch an older candidate without a structured plan | Blocked; create and review a new candidate |
| Import a batch containing an invalid event | No events written |
| Reimport identical IDs | No duplicate signals |
| Reuse an ID with changed evidence | Conflict |
| Deliver/refund an unknown payment order | Blocked |
| Refunded payment | Excluded from payer/revenue metrics |
| Self-serve return before day 7 or without activation | Does not count as a week-2 return |
| Pass G3 without outbound or repeat payer | Blocked |
| Reach a time or spend cap | Queued for review; no automatic decision |
| Extend a gate twice | Second extension blocked |
| Extend for as long as the original gate | Blocked |
| Stale browser revision | Conflict; reload before retrying |
| Exceed reviewer capacity | Activation blocked |
| Reserve one contact for two launches | Second reservation blocked |
| Suppress a reserved contact | Reservation removed; reclaim blocked |
| Kill a launch | Learnings retained, reservations released, wind-down tasks opened |
| Incomplete promotion checklist | Promotion blocked |

## Developer validation

```bash
pip install -r requirements-dev.txt
npm ci
python -m engine.export_contract
node scripts/build-validators.mjs
python -m ruff check engine
python -m ruff format --check engine
python -m mypy
python -m pytest engine/tests -q
npm run test:operations
npx playwright install chromium
npm run test:ui
npm run build:worker
```

## Production acceptance still required

Verify provider APIs/accounts, live evidence quality, real CRM reconciliation,
domain and payment controls, legal/operator terms and professional handoff readiness.
Run ten real candidates with at least eight signed G0 decisions. Replace the capped
operations document with normalized event tables before production-scale use.
Selection itself remains a single-reviewer file/KV workflow; operations writes are
transactional. No production deployment or existing data migration is performed by
this test launcher.
