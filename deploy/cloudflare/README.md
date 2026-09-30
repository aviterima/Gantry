# Gantry on Cloudflare Workers

The Worker and FastAPI use the same UI and generated request schemas. Pydantic
exports JSON Schema; a build-time generator creates static JavaScript validators,
so the deployed Worker never compiles schemas using eval. Run `npm ci` from the
repository root; the deploy script builds these artifacts automatically.

## Publication

Deployment is **manual** through the `Deploy to Cloudflare` workflow, after review.
The workflow runs tests first. Repository secrets: `CLOUDFLARE_API_TOKEN`, optional
`CLOUDFLARE_ACCOUNT_ID`, and `GANTRY_ACCESS_KEY_HASHES` (JSON email → SHA-256 digest).
Never submit API credentials as workflow text inputs.

```bash
# From the repo root, with authorized secrets already in the environment:
./deploy/cloudflare/deploy.sh
```

The script uses the locked Wrangler version, reuses the KV namespace, preserves
the cookie signing secret, and refuses first deployment without reviewer-key
configuration. It can register an account-level workers.dev subdomain; review
that account change before running. The Worker never overwrites existing seed
candidate keys during first initialization. Do not delete the `seeded` marker.

Optional research secrets: `GANTRY_RESEARCH_URL` and `GANTRY_RESEARCH_TOKEN`.
The included Python provider service is described in `engine/README.md`.

## Verified deployment history

As checked 2026-09-29, this repository has two failed deployment runs and no
successful one. The latest (September 8, run 34260303414) failed at **Check for
Cloudflare token**, before checkout or deployment. A separate manual deployment
is not ruled out. No live Worker URL has been verified. This build was not deployed.

## Operations storage

The v0.4 Worker adds the `OperationsStore` SQLite-backed Durable Object using the
`operations-v1` migration. It stores a capped JSON state inside transactions and
requires matching revisions for writes. This does not migrate or rewrite existing
KV candidate records. Review the new binding/migration before an authorized deploy.
Both runtimes share `engine/operations/kernel.mjs`; FastAPI uses Node + SQLite.

## Debt

KV is eventually consistent, not a transactional store. Use one reviewer only;
move selection state to a transactional service before simultaneous reviewers.
Operations state already uses a Durable Object transaction; selection remains KV. Contract tests
exercise the Worker with deterministic KV, and do not model cross-edge races.
Any existing KV records lacking `is_demo` require owner review before classifying
them; no operational records are automatically relabeled by slug.
