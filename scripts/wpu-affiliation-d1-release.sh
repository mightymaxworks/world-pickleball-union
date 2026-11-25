#!/usr/bin/env bash
# Apply only the two reviewed pilot schema files, keeping user data and access configuration untouched.
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ $# -lt 1 || $# -gt 2 || ( "$1" != inspect && "$1" != apply ) ]]; then
  echo 'Usage: wpu-affiliation-d1-release.sh inspect|apply [isolated-local-persistence-dir]' >&2
  exit 2
fi
pilot_mode=$1
database=f245a594-0932-41b9-b255-aeaa1300b639
target=(--remote)
if [[ $# == 2 ]]; then
  test -n "$2"
  database=wpu-supporters
  target=(--local --persist-to "$2")
fi
wrangler=node_modules/.bin/wrangler
d1() { "$wrangler" d1 execute "$database" "${target[@]}" --json "$@"; }
scalar() { d1 --command "$1" | jq -er 'if type == "array" and length == 1 and .[0].success then .[0].results[0].n else error("D1 query failed") end'; }
checksum() { sha256sum "database/$1" | cut -d' ' -f1; }
registry() {
  d1 --command 'SELECT filename, sha256 FROM wpu_schema_migrations;' |
    jq -cer 'if type == "array" and length == 1 and .[0].success then
      (.[0].results | map({key:.filename,value:.sha256}) | from_entries)
      else error("Could not read migration registry") end'
}
registered() { jq -er --arg file "$1" '.[$file] // "missing"' <<< "$registry_json"; }
fatal() { printf 'Migration preflight stopped: %s\n' "$1" >&2; exit 1; }
check_fks() { d1 --command 'PRAGMA foreign_key_check;' | jq -e 'length == 1 and .[0].success and (.[0].results | length == 0)' >/dev/null; }

baseline=(wpu-identity-foundation-v1.sql wpu-identity-invariants-v1.sql wpu-passwordless-auth-v1.sql
          wpu-passwordless-auth-v2.sql wpu-passwordless-auth-v3.sql wpu-organisation-foundation-v2.sql)
pilot=(wpu-control-affiliations-v1.sql wpu-control-affiliations-v2.sql)
registry_json=$(registry)
for file in "${baseline[@]}"; do
  [[ "$(registered "$file")" == "$(checksum "$file")" ]] || fatal "missing or mismatched baseline $file"
done
echo 'Verified six baseline membership migration checksums'
check_fks || fatal 'foreign key check failed before the pilot migration'

foundation_objects="SELECT count(*) AS n FROM sqlite_master WHERE name IN
 ('wpu_affiliation_requests','wpu_affiliation_audit','ux_wpu_affiliation_open_pair','wpu_affiliation_proposal_guard',
  'wpu_affiliation_transition_guard','wpu_affiliation_proposed','wpu_affiliation_transitioned',
  'wpu_affiliation_requests_no_delete','wpu_affiliation_audit_no_update','wpu_affiliation_audit_no_delete');"
self_request_objects="SELECT
 (SELECT count(*) FROM sqlite_master WHERE name IN ('wpu_affiliation_self_request_orgs','wpu_affiliation_source_immutable'))
 +(SELECT count(*) FROM pragma_table_info('wpu_affiliation_requests') WHERE name='request_source')
 +(SELECT count(*) FROM sqlite_master WHERE name='wpu_affiliation_proposed' AND instr(sql,'NEW.request_source')>0)
 AS n;"
previous_missing=false
pending=()
for i in 0 1; do
  file="${pilot[$i]}"
  logged=$(registered "$file")
  query="$foundation_objects"
  expected=10
  if [[ $i == 1 ]]; then query="$self_request_objects"; expected=4; fi
  actual=$(scalar "$query")
  if [[ "$logged" == missing ]]; then
    [[ "$actual" == 0 ]] || fatal "unrecorded objects for $file"
    previous_missing=true
    pending+=("$file")
  else
    [[ "$previous_missing" == false && "$logged" == "$(checksum "$file")" && "$actual" == "$expected" ]] ||
      fatal "recorded schema or checksum does not match $file"
    printf 'Already present and verified %s\n' "$file"
  fi
done
if [[ "$pilot_mode" == inspect || ${#pending[@]} == 0 ]]; then
  for file in "${pending[@]}"; do printf 'Pending %s\n' "$file"; done
  exit 0
fi

if [[ "${target[0]}" == --remote ]]; then "$wrangler" d1 time-travel info "$database"; fi
wpu_batch=$(mktemp)
trap 'rm -f "$wpu_batch"' EXIT
for file in "${pending[@]}"; do
  hash=$(checksum "$file")
  cat "database/$file" >> "$wpu_batch"
  printf "\nINSERT INTO wpu_schema_migrations(filename,sha256) VALUES('%s','%s');\n" "$file" "$hash" >> "$wpu_batch"
done
d1 --yes --file "$wpu_batch" >/dev/null
registry_json=$(registry)
for file in "${pilot[@]}"; do
  [[ "$(registered "$file")" == "$(checksum "$file")" ]] || fatal "post-apply checksum did not match $file"
  printf 'Applied and recorded %s\n' "$file"
done
[[ "$(scalar "$foundation_objects")" == 10 && "$(scalar "$self_request_objects")" == 4 ]] ||
  fatal 'post-apply schema verification failed'
check_fks || fatal 'post-apply foreign key check failed'
echo 'Pilot schema verified. No roles granted, organisations enabled or Worker settings changed.'
