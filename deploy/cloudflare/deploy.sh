#!/usr/bin/env bash
# Deploy Gantry Mission Control to Cloudflare Workers. Idempotent — safe to
# run repeatedly, locally or in CI.
#
# Requires: node 18+, python3, CLOUDFLARE_API_TOKEN in the environment
# (a token from the target Cloudflare account — the "Edit Cloudflare
# Workers" token template has the needed permissions). If the token can see
# multiple accounts, also set CLOUDFLARE_ACCOUNT_ID.
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

# Resolve the KV namespace id at runtime: reuse the existing gantry-kv
# namespace if one exists, create it otherwise. Never pinned in git, so CI
# runs are idempotent and never create duplicate namespaces.
ID=$(npx --yes wrangler kv namespace list 2>/dev/null | python3 -c "
import json, sys
try:
    ns = [n for n in json.load(sys.stdin) if 'gantry-kv' in n.get('title', '')]
    print(ns[0]['id'] if ns else '')
except Exception:
    print('')")
if [ -z "$ID" ]; then
  echo "Creating KV namespace gantry-kv..."
  OUT=$(npx --yes wrangler kv namespace create gantry-kv 2>&1) || { echo "$OUT"; exit 1; }
  ID=$(echo "$OUT" | grep -oE '[a-f0-9]{32}' | head -1)
  [ -n "$ID" ] || { echo "Could not parse KV namespace id from: $OUT"; exit 1; }
fi
echo "KV namespace: $ID"
python3 - "$ID" <<'PY'
import re, sys
s = open("wrangler.toml").read()
s = re.sub(r'\{ binding = "GANTRY_KV", id = "[^"]*" \}',
           f'{{ binding = "GANTRY_KV", id = "{sys.argv[1]}" }}', s)
open("wrangler.toml", "w").write(s)
PY

# Session secret: set once; later runs leave the existing secret alone.
if ! npx --yes wrangler secret list 2>/dev/null | grep -q GANTRY_SECRET; then
  echo "Setting GANTRY_SECRET..."
  head -c 32 /dev/urandom | od -An -tx1 | tr -d ' \n' | npx --yes wrangler secret put GANTRY_SECRET
fi

npx --yes wrangler deploy
echo
echo "Deployed. The workers.dev URL above is the permanent address"
echo "(or attach a custom domain in the Cloudflare dashboard:"
echo " Workers -> gantry -> Settings -> Domains & Routes)."
