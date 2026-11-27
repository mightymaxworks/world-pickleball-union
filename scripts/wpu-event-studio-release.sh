#!/usr/bin/env bash
# Additive schema only. Does not grant permissions or publish events.
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ $# != 1 || ( "$1" != inspect && "$1" != prepare ) ]]; then
  echo 'Usage: wpu-event-studio-release.sh inspect|prepare' >&2
  exit 2
fi
readonly database=f245a594-0932-41b9-b255-aeaa1300b639
file=wpu-event-studio-v1.sql
sha=$(sha256sum "database/$file" | cut -d' ' -f1)
jq -e --arg db "$database" '[.d1_databases[] | select(.binding=="WPU_DB" and .database_id==$db)] | length==1' wrangler.jsonc >/dev/null
wrangler=node_modules/.bin/wrangler
d1() { "$wrangler" d1 execute "$database" --remote --json "$@"; }
scalar() {
  d1 --command "$1" | jq -er 'if length==1 and .[0].success and (.[0].results|length)==1 then .[0].results[0].n else error("D1 query failed") end'
}
expected="SELECT count(*) AS n FROM sqlite_master WHERE
 (type='table' AND name IN ('wpu_studio_events','wpu_studio_event_audit'))
 OR (type='index' AND name='idx_wpu_studio_events_organisation')
 OR (type='trigger' AND name IN ('wpu_studio_event_created','wpu_studio_event_changed'));"
registry="SELECT coalesce((SELECT sha256 FROM wpu_schema_migrations WHERE filename='$file'),'missing') AS n;"
[[ "$(scalar "SELECT count(*) AS n FROM sqlite_master WHERE type='table' AND name IN ('wpu_organisations','wpu_accounts','wpu_auth_emails','wpu_role_assignments','wpu_schema_migrations');")" == 5 ]]
logged=$(scalar "$registry")
if [[ "$logged" == missing ]]; then
  [[ "$(scalar "$expected")" == 0 ]]
  if [[ "$1" == inspect ]]; then echo 'Event Studio schema is pending.'; exit 0; fi
  "$wrangler" d1 time-travel info "$database"
  batch=$(mktemp)
  trap 'rm -f "$batch"' EXIT
  cat "database/$file" > "$batch"
  printf "\nINSERT INTO wpu_schema_migrations(filename,sha256) VALUES('%s','%s');\n" "$file" "$sha" >> "$batch"
  # Remote file imports can emit progress before their final output.
  # Use Wrangler's exit status, then verify the checksum and objects below.
  d1 --yes --file "$batch" >/dev/null
fi
[[ "$(scalar "$registry")" == "$sha" && "$(scalar "$expected")" == 5 ]]
for table in wpu_studio_events wpu_studio_event_audit; do
  d1 --command "PRAGMA foreign_key_check($table);" \
    | jq -e 'length==1 and .[0].success and (.[0].results | length==0)' >/dev/null
done
echo 'Event Studio schema verified. No access was granted and no events were published.'
