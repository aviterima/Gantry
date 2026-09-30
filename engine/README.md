# Gantry v0.4 testing release

Mission Control supports candidate intake, declaration editing, evidence scoring,
thresholds, reviewer commentary, cluster/operator creation, and deliberate G0
approval/rejection. Research produces a separately reviewed corpus and proposals.
See `docs/adr/0003-selection-v03.md` for exact rules and debt.

For the isolated end-to-end sandbox, use `../TESTING.md` and the root launch scripts.
Launch operations share a JavaScript kernel between FastAPI/SQLite and the Worker/
Durable Object. Node 22+ is required at runtime for FastAPI operations.

## Run locally

Python 3.11+ and Node 22+ are required for the full validation/build workflow.

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt
npm ci
python -m engine.export_contract
node scripts/build-validators.mjs
# Use a separate local data directory; never seed an operational registry.
export GANTRY_DATA_DIR="$PWD/.local-data"
python -m engine.seed
```

Provision a long random reviewer key separately. The following command prompts
without echoing the key and prints only the digest JSON for the environment:

```bash
python -c 'import getpass,hashlib,json; k=getpass.getpass("Reviewer key (32+ random characters): "); assert len(k)>=32; print(json.dumps({"aviteri@neubloc.com":hashlib.sha256(k.encode()).hexdigest()}))'
export GANTRY_ACCESS_KEY_HASHES='<paste the digest JSON here>'
python -m uvicorn engine.app.main:app --host 127.0.0.1 --port 8000
```

Open http://localhost:8000 and enter the allowlisted email and reviewer key.
`GANTRY_SECRET` optionally supplies the cookie signing secret; otherwise a local
secret file is generated. Missing reviewer configuration fails closed. Previous
email-only sessions are invalid. Rotating a reviewer's configured key digest
invalidates that reviewer's sessions. Access keys prove possession, not mailbox
ownership; SSO/magic links and roles remain future work.

Do not commit live candidate data. Keep `GANTRY_DATA_DIR` outside tracked `data/`.
The checked-in data is demonstration-only. `python -m engine.seed` is a demo
initializer, not a production migration; it overwrites matching example slugs.

## Validate

```bash
python -m ruff check engine
python -m ruff format --check engine
python -m mypy
python -m engine.export_contract
node scripts/build-validators.mjs
python -m pytest engine/tests -q
npx playwright install chromium
npm run test:operations
npm run test:ui
npm run build:worker
```

The Worker contract tests execute the real module against isolated in-memory KV.
They cover the same API scenarios as Python. They do not simulate eventual
consistency or prove safe concurrent use. The browser test covers intake, edits,
scoring, both decision cancellations, approval locks, configuration and mobile
layout. The dry build packages the Worker without publishing anything.

## Research

Both runtimes accept `GANTRY_RESEARCH_URL` (HTTPS endpoint ending `/research`) and
`GANTRY_RESEARCH_TOKEN` (bearer secret). Missing configuration is displayed in the
UI; manual scoring still works. No fake research runs when credentials are absent.

The included provider runs separately:

```bash
# Supply these through your process secret manager, never git:
# GANTRY_RESEARCH_SERVICE_KEY: at least 32 random characters
# GANTRY_SEARCH_URL: compatible JSON search endpoint
# GANTRY_SEARCH_KEY: search account key
# GANTRY_MODEL_URL: full chat-completions endpoint
# GANTRY_MODEL_KEY: model account key
# GANTRY_MODEL_NAME: model identifier
python -m uvicorn engine.research_service:app --host 127.0.0.1 --port 8001
```

Put the service behind HTTPS, then set the selection app's URL and token to this
service. Search protocol: POST `{query,max_results,include_answer}` with a bearer
key; response `{results:[{url,title,content}]}`. Synthesis uses
`{model,messages,response_format:{type:"json_object"},max_tokens}` and reads
`choices[0].message.content`. Choose a compatible endpoint/model.

Three searches are deduplicated into up to 18 dated source excerpts. A synthesis
call and an adversarial revision produce schema-validated proposals. Retrieved
source metadata is owned by code. Broken citations or malformed responses fail
without overwriting candidate data. Corpus excerpts and proposals are shown to
the reviewer before acceptance. Confidence is a model judgment, not a probability.
No live provider run has been completed using owner accounts. Measure quality,
coverage, latency and cost before accepting the research feature for operations.

## Remaining limitations

- Selection files/KV remain single-reviewer; lifecycle operations are transactional
  with revision checks. Operations use a capped 1.8 MB state document; normalize
  storage before production-scale event volumes.
- Research remains account-configured and has no freshness scheduler.
- Email/social/CRM connections are unverified; imported events are reviewer-supplied.
- Dates and queues are evaluated when viewed; no background notification jobs run.
- Handoffs include a landing scaffold and staged CRM, not a complete venture product
  or verified provider export. Legal/operator agreements remain external actions.
- Business acceptance remains 10 real candidates and >=8 decisions within two days.

See `docs/adr/0004-testing-release.md` for operations and `../TESTING.md` for the
walkthrough, local launchers and current integration boundary.
