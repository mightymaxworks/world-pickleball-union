#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
pilot_dir=$(mktemp -d)
trap 'rm -rf "$pilot_dir"' EXIT
d1() { node_modules/.bin/wrangler d1 execute wpu-supporters --local --persist-to "$pilot_dir/d1" --json "$@"; }
node tests/fixtures/control-affiliations.mjs "$pilot_dir"
{
  echo 'CREATE TABLE wpu_schema_migrations(filename TEXT PRIMARY KEY,sha256 TEXT NOT NULL);'
  for name in wpu-identity-foundation-v1 wpu-identity-invariants-v1 wpu-passwordless-auth-v1 wpu-passwordless-auth-v2 wpu-passwordless-auth-v3 wpu-organisation-foundation-v2 wpu-control-affiliations-v1 wpu-control-affiliations-v2 wpu-federation-portal-v1 wpu-federation-members-v1 inquiries wpu-organisation-intake-v1; do
    file="$name.sql"
    cat "database/$file"
    printf "\nINSERT INTO wpu_schema_migrations VALUES('%s','%s');\n" "$file" "$(sha256sum "database/$file" | cut -d' ' -f1)"
  done
  cat "$pilot_dir/control-seed.sql"
  printf "\nINSERT INTO wpu_organisation_intake_reviewers(account_id) VALUES('reviewer');\n"
} > "$pilot_dir/bootstrap.sql"
d1 --file "$pilot_dir/bootstrap.sql" >/dev/null
WPU_ACTIVATION_LOCAL_FINGERPRINT=$(printf 'WPU organisation intake reviewer v1:reviewer@example.org' | sha256sum | cut -d' ' -f1)
export WPU_ACTIVATION_LOCAL_FINGERPRINT
[[ "$(bash scripts/wpu-federation-activation-release.sh inspect "$pilot_dir/d1")" == *"schema is pending"* ]]
bash scripts/wpu-federation-activation-release.sh prepare "$pilot_dir/d1"
d1 --command "SELECT (SELECT enabled FROM wpu_federation_portals WHERE slug='bhutan') AS enabled,
  (SELECT count(*) FROM wpu_federation_publishers WHERE account_id='reviewer' AND revoked_at IS NULL) AS publisher,
  (SELECT count(*) FROM wpu_federation_publishers) AS total_publishers,
  (SELECT count(*) FROM wpu_federation_activation_events) AS events;" |
  jq -e '.[0].results==[{enabled:1,publisher:1,total_publishers:1,events:0}]' >/dev/null
d1 --command "UPDATE wpu_federation_publishers SET revoked_at=datetime('now') WHERE account_id='reviewer';" >/dev/null
bash scripts/wpu-federation-activation-release.sh prepare "$pilot_dir/d1"
d1 --command "SELECT count(*) AS active FROM wpu_federation_publishers WHERE revoked_at IS NULL;" |
  jq -e '.[0].results==[{active:0}]' >/dev/null
# Prove an older application writing directly through the original table cannot reopen a pause.
d1 --command "INSERT INTO wpu_federation_activation_events(organisation_id,slug,state,actor_account_id,reason)
  VALUES('bhutan-isolated','bhutan','paused','reviewer','Isolated rollback rehearsal');" >/dev/null
if d1 --command "INSERT INTO wpu_affiliation_requests(id,person_id,organisation_id,proposed_by,last_actor,last_reason,state,request_source)
  VALUES('rollback-attempt','player','bhutan-isolated','player','player','Request from old Worker','awaiting_review','player');" > "$pilot_dir/rollback.json" 2>&1; then
  echo 'A paused federation accepted a new request through the original table.' >&2
  exit 1
fi
grep -q 'new federation affiliation requests are paused' "$pilot_dir/rollback.json"
echo 'Release preserved existing publication states, respected revocation and blocked new requests during rollback.'
