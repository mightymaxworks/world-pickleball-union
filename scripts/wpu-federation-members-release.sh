#!/usr/bin/env bash
# Add the local details and hold-reason schema to the existing WPU binding.
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ $# -lt 1 || $# -gt 2 || ( "$1" != inspect && "$1" != prepare ) ]]; then
  echo 'Usage: wpu-federation-members-release.sh inspect|prepare [isolated-local-persistence-dir]' >&2
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
fatal() { printf 'Federation Members preparation stopped: %s\n' "$1" >&2; exit 1; }

prior="$(bash scripts/wpu-federation-d1-release.sh inspect "${@:2}")"
[[ "$prior" == *"Federation schema and Bhutan portal are already prepared."* ]] ||
  fatal 'existing federation schema and portal must be prepared first'
file=wpu-federation-members-v1.sql
hash=$(sha256sum "database/$file" | cut -d' ' -f1)
registry="SELECT coalesce((SELECT sha256 FROM wpu_schema_migrations WHERE filename='$file'),'missing') AS n;"
objects="SELECT ((SELECT count(*) FROM sqlite_master WHERE (name='wpu_federation_member_details' AND type='table') OR
 (name='idx_wpu_fed_local_membership_number' AND type='index')) +
 (SELECT count(*) FROM pragma_table_info('wpu_federation_roster_events') WHERE name='reason' AND type='TEXT')) AS n;"
existing=$(scalar "$registry")
if [[ "$existing" == "$hash" && "$(scalar "$objects")" == 3 ]]; then
  echo 'Federation Members schema already applied and verified.'
  exit 0
fi
[[ "$existing" == missing && "$(scalar "$objects")" == 0 ]] || fatal 'schema objects or recorded checksum do not match'
if [[ "$mode" == inspect ]]; then
  echo 'Federation Members schema is pending.'
  exit 0
fi

if [[ "${target[0]}" == --remote ]]; then "$wrangler" d1 time-travel info "$database"; fi
batch=$(mktemp)
trap 'rm -f "$batch"' EXIT
cat "database/$file" > "$batch"
printf "\nINSERT INTO wpu_schema_migrations(filename,sha256) VALUES('%s','%s');\n" "$file" "$hash" >> "$batch"
d1 --yes --file "$batch" >/dev/null
[[ "$(scalar "$registry")" == "$hash" && "$(scalar "$objects")" == 3 ]] || fatal 'post-apply verification failed'
d1 --command 'PRAGMA foreign_key_check;' | jq -e 'length == 1 and .[0].success and (.[0].results | length == 0)' >/dev/null
echo 'Federation Members schema applied and verified. No accounts, access or roster statuses changed.'
