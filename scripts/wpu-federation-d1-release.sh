#!/usr/bin/env bash
# Apply the reviewed federation schema and stage the existing Bhutan org without granting access.
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ $# -lt 1 || $# -gt 2 || ( "$1" != inspect && "$1" != prepare ) ]]; then
  echo 'Usage: wpu-federation-d1-release.sh inspect|prepare [isolated-local-persistence-dir]' >&2
  exit 2
fi
mode=$1
database=f245a594-0932-41b9-b255-aeaa1300b639
target=(--remote)
if [[ $# == 2 ]]; then
  [[ -n "$2" ]]
  database=wpu-supporters
  target=(--local --persist-to "$2")
fi
wrangler=node_modules/.bin/wrangler
d1() { "$wrangler" d1 execute "$database" "${target[@]}" --json "$@"; }
scalar() {
  d1 --command "$1" | jq -er 'if length==1 and .[0].success and (.[0].results|length)==1
    then .[0].results[0].n else error("D1 query failed") end'
}
fatal() { printf 'Federation pilot stopped: %s\n' "$1" >&2; exit 1; }
check_fks() { d1 --command 'PRAGMA foreign_key_check;' | jq -e 'length == 1 and .[0].success and (.[0].results | length == 0)' >/dev/null; }

# Validate the production binding and the prior release checksums and migration objects.
if [[ "${target[0]}" == --remote ]]; then
  jq -e --arg db "$database" '[.d1_databases[] | select(.binding=="WPU_DB" and .database_id==$db)] | length==1' wrangler.jsonc >/dev/null
fi
prior="$(bash scripts/wpu-affiliation-d1-release.sh inspect "${@:2}")"
[[ "$prior" != *Pending* ]] || fatal 'existing affiliation migrations must be applied first'
file=wpu-federation-portal-v1.sql
hash=$(sha256sum "database/$file" | cut -d' ' -f1)
registry="SELECT coalesce((SELECT sha256 FROM wpu_schema_migrations WHERE filename='$file'),'missing') AS n;"
objects="SELECT count(*) AS n FROM sqlite_master WHERE name IN ('wpu_federation_portals','wpu_federation_roster_events',
 'wpu_federation_identity_clients','wpu_federation_identity_grants','idx_wpu_roster_membership_sequence','idx_wpu_memberships_roster');"
eligible="SELECT count(*) AS n FROM wpu_organisations o
 JOIN wpu_affiliation_self_request_orgs pilot ON pilot.organisation_id=o.id
 WHERE o.id='bhutan-pickleball-federation' AND o.name='Bhutan Pickleball Federation'
 AND o.country_code='BT' AND o.organisation_type='national_federation' AND o.status='verified';"
match="SELECT count(*) AS n FROM wpu_federation_portals WHERE slug='bhutan' AND organisation_id='bhutan-pickleball-federation';"
conflict="SELECT count(*) AS n FROM wpu_federation_portals
 WHERE (slug='bhutan' OR organisation_id='bhutan-pickleball-federation') AND NOT (slug='bhutan' AND organisation_id='bhutan-pickleball-federation');"

[[ "$(scalar "$eligible")" == 1 ]] || fatal 'existing verified Bhutan self-request organisation not found'
logged=$(scalar "$registry")
if [[ "$logged" == missing ]]; then
  [[ "$(scalar "$objects")" == 0 ]] || fatal 'unrecorded federation schema objects already exist'
  echo 'Federation schema is pending.'
else
  [[ "$logged" == "$hash" && "$(scalar "$objects")" == 6 ]] || fatal 'recorded federation schema or checksum does not match'
  [[ "$(scalar "$conflict")" == 0 ]] || fatal 'Bhutan portal slug or organisation already assigned elsewhere'
  if [[ "$(scalar "$match")" == 1 ]]; then
    check_fks || fatal 'foreign key verification failed'
    echo 'Federation schema and Bhutan portal are already prepared. Existing access and enabled state left as-is.'
    exit 0
  fi
  echo 'Federation schema verified. Bhutan portal is not yet prepared.'
fi
[[ "$mode" == prepare ]] || exit 0

if [[ "${target[0]}" == --remote ]]; then "$wrangler" d1 time-travel info "$database"; fi
batch=$(mktemp)
trap 'rm -f "$batch"' EXIT
if [[ "$logged" == missing ]]; then
  cat "database/$file" >> "$batch"
  printf "\nINSERT INTO wpu_schema_migrations(filename,sha256) VALUES('%s','%s');\n" "$file" "$hash" >> "$batch"
fi
cat >> "$batch" <<'SQL'
INSERT INTO wpu_federation_portals(slug,organisation_id,enabled)
SELECT 'bhutan',o.id,0 FROM wpu_organisations o
 JOIN wpu_affiliation_self_request_orgs pilot ON pilot.organisation_id=o.id
 WHERE o.id='bhutan-pickleball-federation' AND o.name='Bhutan Pickleball Federation'
 AND o.country_code='BT' AND o.organisation_type='national_federation' AND o.status='verified'
ON CONFLICT DO NOTHING;
SQL
d1 --yes --file "$batch" >/dev/null
[[ "$(scalar "$registry")" == "$hash" && "$(scalar "$objects")" == 6 && "$(scalar "$match")" == 1 && "$(scalar "$conflict")" == 0 ]] ||
  fatal 'post-apply schema or portal verification failed'
[[ "$(scalar "SELECT enabled AS n FROM wpu_federation_portals WHERE slug='bhutan';")" == 0 ]] ||
  fatal 'new Bhutan portal was not staged disabled'
check_fks || fatal 'post-apply foreign key verification failed'
echo 'Federation schema is verified and Bhutan is staged disabled. No roles, clients or Worker settings changed.'
