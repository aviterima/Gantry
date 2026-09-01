# Gantry on Cloudflare Workers

A 1:1 port of the Phase 1 engine (`engine/app`) to a Cloudflare Worker:
same API routes, same email-allowlist auth and cookie scheme, same domain
rules, and the **same UI files** (imported verbatim from `engine/static/`,
so the two deployments cannot drift visually). Storage is Workers KV;
`src/seed.json` is generated from `engine/seed.py` so seed data has one
source of truth.

Target account: the Cloudflare account of **aviteri@neubloc.com**.

## Deploy — recommended path: GitHub Actions (one secret, then automatic)

1. In that Cloudflare account, create an API token:
   dash.cloudflare.com → My Profile → API Tokens → Create Token → use the
   **Edit Cloudflare Workers** template → Continue → Create Token. Copy it.
2. Add it to this GitHub repo as an Actions secret named
   `CLOUDFLARE_API_TOKEN` (repo → Settings → Secrets and variables →
   Actions → New repository secret). If the token can see more than one
   Cloudflare account, also add `CLOUDFLARE_ACCOUNT_ID` (shown in the
   dashboard sidebar).
3. The `Deploy to Cloudflare` workflow (`.github/workflows/deploy.yml`)
   deploys automatically on pushes touching `engine/` or
   `deploy/cloudflare/`, and can be run on demand from the Actions tab
   (or triggered by Claude via the GitHub API).

## Deploy — local alternative (three commands)

```bash
git clone -b claude/startup-launch-framework-f3h61a https://github.com/aviterima/Last-Z && cd Last-Z
pip install -r requirements.txt
CLOUDFLARE_API_TOKEN=<token> ./deploy/cloudflare/deploy.sh
```

The script is idempotent either way: it reuses the `gantry-kv` namespace if
one exists (never duplicating it), sets the session secret only once, and
regenerates `seed.json` from the Python source of truth on every run. The
printed `*.workers.dev` URL is permanent; a custom domain can be attached
from the Cloudflare dashboard (Workers → gantry → Settings → Domains &
Routes).

Seeding happens on the worker's first request and only once — it never
overwrites live data. The allowlist starts as `aviteri@neubloc.com`; add
more from the app's Configuration pane.

## Known debt

- KV is eventually consistent (~60s across edge locations). Fine for a
  small review team; repay with D1/Durable Objects when concurrent
  reviewers become routine.
- Email allowlist identifies but does not verify mailbox ownership —
  magic-link verification lands with the Neubloc adapter (Phase 2).
- `PUT /api/candidates/{slug}` (declaration edits) is not yet ported; the
  UI does not currently call it.
