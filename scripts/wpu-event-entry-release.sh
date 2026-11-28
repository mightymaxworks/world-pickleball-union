#!/usr/bin/env bash
# Additive schema only. No review grants, decisions or event publication.
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ $# != 1 || ( "$1" != inspect && "$1" != prepare ) ]]; then
  echo 'Usage: wpu-event-entry-release.sh inspect|prepare' >&2
  exit 2
fi
readonly database=f245a594-0932-41b9-b255-aeaa1300b639
readonly file=wpu-event-entries-v1.sql
sha=$(sha256sum "database/$file" | cut -d' ' -f1)
jq -e --arg db "$database" '[.d1_databases[] | select(.binding=="WPU_DB" and .database_id==$db)] | length==1' wrangler.jsonc >/dev/null
wrangler=node_modules/.bin/wrangler
d1() { "$wrangler" d1 execute "$database" --remote --json "$@"; }
scalar() {
  d1 --command "$1" | jq -er 'if length==1 and .[0].success and (.[0].results|length)==1 then .[0].results[0].n else error("D1 query failed") end'
}
expected="SELECT count(*) AS n FROM sqlite_master WHERE
 (type='table' AND name IN ('wpu_event_registration','wpu_event_entries'))
 OR (type='index' AND name IN ('idx_wpu_event_entries_inventory','idx_wpu_event_entries_lead','idx_wpu_event_entries_partner'))
 OR (type='trigger' AND name IN ('wpu_event_entry_unique_insert','wpu_event_entry_unique_partner','wpu_event_registration_published_rules'));"
registry="SELECT coalesce((SELECT sha256 FROM wpu_schema_migrations WHERE filename='$file'),'missing') AS n;"
[[ "$(scalar "SELECT count(*) AS n FROM sqlite_master WHERE type='table' AND name IN ('wpu_studio_events','wpu_organisations','wpu_accounts','wpu_auth_emails','wpu_role_assignments','wpu_schema_migrations','wpu_organisation_intake_reviewers','wpu_federation_publishers');")" == 8 ]]
logged=$(scalar "$registry")
if [[ "$logged" == missing ]]; then
  [[ "$(scalar "$expected")" == 0 ]]
  if [[ "$1" == inspect ]]; then echo 'Tournament registration schema is pending.'; exit 0; fi
  "$wrangler" d1 time-travel info "$database"
  batch=$(mktemp)
  trap 'rm -f "$batch"' EXIT
  cat "database/$file" > "$batch"
  printf "\nINSERT INTO wpu_schema_migrations(filename,sha256) VALUES('%s','%s');\n" "$file" "$sha" >> "$batch"
  d1 --yes --file "$batch" >/dev/null
fi
[[ "$(scalar "$registry")" == "$sha" && "$(scalar "$expected")" == 8 ]]
d1 --command 'PRAGMA foreign_key_check(wpu_event_entries);'   | jq -e 'length==1 and .[0].success and (.[0].results | length==0)' >/dev/null

readonly setup_file=wpu-event-registration-setup-v1.sql
setup_sha=$(sha256sum "database/$setup_file" | cut -d' ' -f1)
setup_expected="SELECT count(*) AS n FROM sqlite_master WHERE type='table' AND name='wpu_event_registration_setup';"
setup_registry="SELECT coalesce((SELECT sha256 FROM wpu_schema_migrations WHERE filename='$setup_file'),'missing') AS n;"
setup_logged=$(scalar "$setup_registry")
if [[ "$setup_logged" == missing ]]; then
  [[ "$(scalar "$setup_expected")" == 0 ]]
  if [[ "$1" == inspect ]]; then echo 'Private registration setup schema is pending.'; exit 0; fi
  "$wrangler" d1 time-travel info "$database"
  setup_batch=$(mktemp)
  trap 'rm -f "${batch:-}" "$setup_batch"' EXIT
  cat "database/$setup_file" > "$setup_batch"
  printf "\nINSERT INTO wpu_schema_migrations(filename,sha256) VALUES('%s','%s');\n" "$setup_file" "$setup_sha" >> "$setup_batch"
  d1 --yes --file "$setup_batch" >/dev/null
fi
[[ "$(scalar "$setup_registry")" == "$setup_sha" && "$(scalar "$setup_expected")" == 1 ]]
d1 --command 'PRAGMA foreign_key_check(wpu_event_registration_setup);' | jq -e 'length==1 and .[0].success and (.[0].results | length==0)' >/dev/null
echo 'Tournament registration and private setup schemas verified. No registration opened and no payment was taken.'
