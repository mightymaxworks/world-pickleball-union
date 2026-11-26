#!/usr/bin/env bash
# Local-only D1 integration test. Uses disposable persistence, not the project database.
set -euo pipefail
cd "$(dirname "$0")/.."
pilot_tmp=$(mktemp -d)
pilot_worker=
cleanup() {
  if [[ -n "$pilot_worker" ]]; then kill "$pilot_worker" 2>/dev/null || true; fi
  if [[ -e "$pilot_tmp/worker.log" ]]; then cat "$pilot_tmp/worker.log"; fi
  rm -rf "$pilot_tmp"
}
trap cleanup EXIT

export TEST_BASE_URL=http://localhost:8787
wrangler=node_modules/.bin/wrangler
db=wpu-supporters
test -f .open-next/worker.js
for file in wpu-identity-foundation-v1 wpu-identity-invariants-v1 wpu-passwordless-auth-v1 wpu-passwordless-auth-v2 wpu-passwordless-auth-v3 wpu-organisation-foundation-v2 wpu-control-affiliations-v1 wpu-control-affiliations-v2; do
  "$wrangler" d1 execute "$db" --local --persist-to "$pilot_tmp/db" --file "database/$file.sql" >/dev/null
done
node tests/fixtures/control-affiliations.mjs "$pilot_tmp"
"$wrangler" d1 execute "$db" --local --persist-to "$pilot_tmp/db" --file "$pilot_tmp/control-seed.sql" >/dev/null
"$wrangler" dev --local --persist-to "$pilot_tmp/db" --env-file "$pilot_tmp/pilot.env" --ip localhost --port 8787 > "$pilot_tmp/worker.log" 2>&1 &
pilot_worker=$!
for i in $(seq 1 65); do
  if curl -fsS "$TEST_BASE_URL/join" >/dev/null 2>&1; then break; fi
  kill -0 "$pilot_worker"
  sleep 1
done
curl -fsS "$TEST_BASE_URL/join" >/dev/null
node tests/control-affiliations-http.mjs "$pilot_tmp/control-fixtures.json"
node --input-type=module - "$pilot_tmp/worker.log" <<'NODE'
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const log = readFileSync(process.argv[2], "utf8");
const events = log.split("\n")
  .filter(line => line.includes("wpu_control_access_rejected"))
  .map(line => {
    const event = JSON.parse(line.slice(line.indexOf("{"), line.lastIndexOf("}") + 1));
    assert.deepEqual(Object.keys(event), ["event", "surface", "reason"]);
    assert.equal(event.event, "wpu_control_access_rejected");
    assert.ok(["page", "api"].includes(event.surface));
    assert.match(event.reason, /^[a-z_]+$/);
    return event.surface + "/" + event.reason;
  });
for (const expected of ["page/missing_assertion", "api/missing_assertion", "api/wrong_audience",
  "api/wrong_issuer", "api/invalid_expiry", "api/session_too_long", "api/not_yet_valid",
  "api/wrong_token_type", "api/unexpected_algorithm", "api/invalid_signature"]) {
  assert.ok(events.includes(expected), "Missing diagnostic: " + expected);
}
console.log("WPU Control staff access rejection diagnostics contain only fixed labels");
NODE
