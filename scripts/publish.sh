#!/usr/bin/env bash
# Runs scripts/publish-releases.ts against production Firestore.
#
# Why this exists instead of `npx ts-node scripts/publish-releases.ts`:
# on newer Node versions (v23+), Node's own native TypeScript loader claims
# .ts files before ts-node's require hook can register, so `ts-node` silently
# no-ops (exit 0, zero output, nothing published). This compiles the script
# to plain JS with tsc and runs that with node instead, which sidesteps the
# conflict entirely regardless of which Node version is installed.
set -euo pipefail
cd "$(dirname "$0")/.."

rm -rf .publish-build

# tsc exits 2 here because of a known, unrelated, harmless type error in
# src/firebase/config.ts (see HANDOFF.md's "getReactNativePersistence" note)
# — it still emits valid JS, so the non-zero exit is expected and ignored.
npx tsc --module commonjs --target es2020 --esModuleInterop --skipLibCheck \
  --resolveJsonModule --outDir .publish-build scripts/publish-releases.ts || true

if [ ! -f .publish-build/scripts/publish-releases.js ]; then
  echo "publish-releases.js was not emitted — a real compile error, not the known false-positive. Aborting." >&2
  rm -rf .publish-build
  exit 1
fi

cp service-account.json .publish-build/service-account.json
node .publish-build/scripts/publish-releases.js
rm -rf .publish-build
