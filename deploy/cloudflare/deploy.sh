#!/usr/bin/env bash
# Deploy Gantry Mission Control to Cloudflare Workers.
#
# Requires: node 18+, CLOUDFLARE_API_TOKEN in the environment (a token from
# the target Cloudflare account with Workers Scripts:Edit + Workers KV
# Storage:Edit permissions).
#
# Usage:  ./deploy.sh          # idempotent: creates KV namespace on first
#                              # run, generates the session secret if unset,
#                              # regenerates seed.json, deploys.
set -euo pipefail
cd "$(dirname "$0")"

if [ -z "${CLOUDFLARE_API_TOKEN:-}" ]; then
  echo "CLOUDFLARE_API_TOKEN is not set." >&2
  exit 1
fi

# Regenerate seed.json from the Python source of truth when available.
if command -v python3 >/dev/null && [ -f ../../engine/seed.py ]; then
  (cd ../.. && python3 - <<'PY'
import json
from engine.seed import build_candidates, CLUSTERS, OPERATORS
from engine.app.memo import draft_memo
cands = []
for c in build_candidates():
    c.memo = draft_memo(c)
    cands.append(json.loads(c.model_dump_json()))
data = {
  "candidates": cands,
  "clusters": [json.loads(c.model_dump_json()) for c in CLUSTERS],
  "operators": [json.loads(o.model_dump_json()) for o in OPERATORS],
  "allowed_emails": ["aviteri@neubloc.com"],
}
open("deploy/cloudflare/src/seed.json", "w").write(json.dumps(data, indent=1))
print("seed.json regenerated")
PY
  )
fi

# Create the KV namespace once and pin its id into wrangler.toml.
if grep -q REPLACED_BY_DEPLOY_SH wrangler.toml; then
  echo "Creating KV namespace gantry-kv..."
  OUT=$(npx --yes wrangler kv namespace create gantry-kv 2>&1) || { echo "$OUT"; exit 1; }
  ID=$(echo "$OUT" | grep -oE '"?id"?[ =:]+"[a-f0-9]{32}"' | grep -oE '[a-f0-9]{32}' | head -1)
  [ -n "$ID" ] || { echo "Could not parse KV namespace id from: $OUT"; exit 1; }
  sed -i.bak "s/REPLACED_BY_DEPLOY_SH/$ID/" wrangler.toml && rm -f wrangler.toml.bak
  echo "KV namespace: $ID (pinned in wrangler.toml — commit this change)"
fi

# Session secret: set once; skip if it already exists.
if ! npx --yes wrangler secret list 2>/dev/null | grep -q GANTRY_SECRET; then
  echo "Setting GANTRY_SECRET..."
  head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n' | npx --yes wrangler secret put GANTRY_SECRET
fi

npx --yes wrangler deploy
echo
echo "Deployed. The workers.dev URL above is the permanent address"
echo "(or attach a custom domain/route in the Cloudflare dashboard)."
