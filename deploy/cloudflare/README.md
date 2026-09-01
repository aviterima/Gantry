# Gantry on Cloudflare Workers

A 1:1 port of the Phase 1 engine (`engine/app`) to a Cloudflare Worker:
same API routes, same email-allowlist auth and cookie scheme, same domain
rules, and the **same UI files** (imported verbatim from `engine/static/`,
so the two deployments cannot drift visually). Storage is Workers KV;
`src/seed.json` is generated from `engine/seed.py` so seed data has one
source of truth.

Target account: the Cloudflare account of **aviteri@neubloc.com**.

## Deploy (one time setup, then one command)

1. In that Cloudflare account, create an API token
   (dash.cloudflare.com → My Profile → API Tokens → Create Token) with
   permissions **Workers Scripts: Edit** and **Workers KV Storage: Edit**.
2. Make the token available as `CLOUDFLARE_API_TOKEN`. For deploys from a
   Claude Code remote session, add it as an environment variable in the
   environment settings, and add these hosts to the environment's network
   allowlist: `api.cloudflare.com`, `workers.cloudflare.com`,
   `registry.npmjs.org` (for wrangler).
3. Run:

   ```bash
   cd deploy/cloudflare && ./deploy.sh
   ```

The script is idempotent: first run creates the `gantry-kv` namespace (and
pins its id into `wrangler.toml` — commit that change) and generates the
session secret; every run regenerates `seed.json` and deploys. The printed
`*.workers.dev` URL is permanent; a custom domain can be attached from the
Cloudflare dashboard (Workers → gantry → Settings → Domains & Routes).

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
