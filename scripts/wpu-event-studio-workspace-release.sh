#!/usr/bin/env bash
# One approved WPU organiser grant. No Bhutan grant or event publication.
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ $# -lt 1 || $# -gt 2 || ( "$1" != inspect && "$1" != prepare ) ]]; then
  echo 'Usage: wpu-event-studio-workspace-release.sh inspect|prepare [isolated-local-dir]' >&2
  exit 2
fi
mode=$1
database=f245a594-0932-41b9-b255-aeaa1300b639
target=(--remote)
# Same previously nominated WPU operations account as the federation activation release.
fingerprint='d35c4a91259ff54a4eab25012e4488b0f4cab9cefefa11630f5e8cad912d6daa'
if [[ $# == 2 ]]; then
  [[ -n "$2" ]]
  database=wpu-supporters
  target=(--local --persist-to "$2")
  fingerprint="${WPU_WORKSPACE_TEST_FINGERPRINT:?Set the isolated operator fingerprint}"
else
  jq -e --arg db "$database" '[.d1_databases[] | select(.binding=="WPU_DB" and .database_id==$db)] | length==1' wrangler.jsonc >/dev/null
fi
wrangler=node_modules/.bin/wrangler
d1() { "$wrangler" d1 execute "$database" "${target[@]}" --json "$@"; }
scalar() {
  d1 --command "$1" | jq -er 'if length==1 and .[0].success and (.[0].results|length)==1 then .[0].results[0].n else error("D1 query failed") end'
}
fatal() { printf 'Workspace setup stopped: %s\n' "$1" >&2; exit 1; }
file=wpu-event-studio-v1.sql
hash=$(sha256sum "database/$file" | cut -d' ' -f1)
[[ "$(scalar "SELECT count(*) AS n FROM wpu_schema_migrations WHERE filename='$file' AND sha256='$hash';")" == 1 ]] ||
  fatal 'reviewed Event Studio schema is missing'
[[ "$(scalar "SELECT count(*) AS n FROM sqlite_master WHERE type='table' AND name IN ('wpu_studio_events','wpu_studio_event_audit','wpu_federation_portals','wpu_federation_publishers');")" == 4 ]] ||
  fatal 'expected schema objects are missing'

readonly candidates="SELECT a.id,e.email_normalized FROM wpu_accounts a
 JOIN wpu_auth_emails e ON e.account_id=a.id AND e.verified_at IS NOT NULL
 JOIN wpu_federation_publishers p ON p.account_id=a.id AND p.revoked_at IS NULL
 JOIN wpu_organisation_intake_reviewers i ON i.account_id=a.id AND i.revoked_at IS NULL
 WHERE a.status='active';"
account=$(d1 --command "$candidates" | node -e '
 const data=JSON.parse(require("node:fs").readFileSync(0,"utf8"));
 if(data.length!==1 || !data[0].success)process.exit(1);
 const {createHash}=require("node:crypto");
 const rows=data[0].results.filter(x=>createHash("sha256").update("WPU organisation intake reviewer v1:"+x.email_normalized).digest("hex")===process.argv[1]);
 if(rows.length!==1||typeof rows[0].id!=="string"||!/^[A-Za-z0-9:_-]{1,128}$/.test(rows[0].id))process.exit(1);
 process.stdout.write(rows[0].id);
 ' "$fingerprint") || fatal 'the nominated verified WPU operator could not be uniquely resolved'

# Reuse a recognised WPU record; do not overwrite existing organisations.
readonly wpu_match="(id IN ('wpu','world-pickleball-union') OR lower(trim(name)) IN ('world pickleball union','world pickleball union (wpu)'))"
readonly valid_wpu="$wpu_match AND lower(trim(name)) IN ('world pickleball union','world pickleball union (wpu)') AND status='verified'"
matches=$(scalar "SELECT count(*) AS n FROM wpu_organisations WHERE $wpu_match;")
[[ "$matches" == 0 || "$matches" == 1 ]] || fatal 'more than one WPU organisation matches'
if [[ "$matches" == 1 ]]; then
  [[ "$(scalar "SELECT count(*) AS n FROM wpu_organisations WHERE $valid_wpu;")" == 1 ]] ||
    fatal 'the existing WPU organisation requires review'
fi
readonly wpu_grant="SELECT count(*) AS n FROM wpu_role_assignments r
 WHERE r.account_id='$account' AND r.role='organiser' AND r.scope_type='organisation'
 AND r.scope_id IN (SELECT id FROM wpu_organisations WHERE $valid_wpu)"
active=$(scalar "$wpu_grant AND r.revoked_at IS NULL;")
if [[ "$active" == 0 && "$(scalar "$wpu_grant AND r.revoked_at IS NOT NULL;")" != 0 ]]; then
  fatal 'a previous WPU organiser grant was revoked and will not be restored automatically'
fi

if [[ "$mode" == prepare && "$active" == 0 ]]; then
  if [[ "${target[0]}" == --remote ]]; then "$wrangler" d1 time-travel info "$database"; fi
  batch=$(mktemp)
  trap 'rm -f "$batch"' EXIT
  cat > "$batch" <<SQL
INSERT INTO wpu_organisations(id,name,status,organisation_type)
 SELECT 'world-pickleball-union','World Pickleball Union','verified','international'
 WHERE NOT EXISTS(SELECT 1 FROM wpu_organisations WHERE $wpu_match);
INSERT INTO wpu_role_assignments(id,account_id,role,scope_type,scope_id,granted_by_account_id)
 SELECT 'event-studio:wpu-organiser:v1',a.id,'organiser','organisation',o.id,a.id
 FROM wpu_organisations o JOIN wpu_accounts a ON a.id='$account' AND a.status='active'
 WHERE o.id IN (SELECT id FROM wpu_organisations WHERE $valid_wpu)
 AND (SELECT count(*) FROM wpu_organisations WHERE $wpu_match)=1
 AND EXISTS(SELECT 1 FROM wpu_auth_emails e WHERE e.account_id=a.id AND e.verified_at IS NOT NULL)
 AND EXISTS(SELECT 1 FROM wpu_federation_publishers p WHERE p.account_id=a.id AND p.revoked_at IS NULL)
 AND EXISTS(SELECT 1 FROM wpu_organisation_intake_reviewers i WHERE i.account_id=a.id AND i.revoked_at IS NULL)
 AND NOT EXISTS(SELECT 1 FROM wpu_role_assignments r WHERE r.account_id=a.id AND r.role='organiser'
  AND r.scope_type='organisation' AND r.scope_id=o.id);
SQL
  d1 --yes --file "$batch" >/dev/null
  active=$(scalar "$wpu_grant AND r.revoked_at IS NULL;")
fi

if [[ "$active" == 1 ]]; then
  echo 'WPU Event Studio workspace: active for the nominated WPU organiser.'
elif [[ "$mode" == inspect && "$active" == 0 ]]; then
  echo 'WPU Event Studio workspace: organiser grant pending.'
else
  fatal 'expected WPU organiser grant could not be verified'
fi

# Federation workspace is determined by organisation scope, not affiliation portal settings.
readonly bhutan="FROM wpu_federation_portals f JOIN wpu_organisations o ON o.id=f.organisation_id
 WHERE f.slug='bhutan' AND o.status='verified' AND o.organisation_type='national_federation'"
if [[ "$(scalar "SELECT count(*) AS n $bhutan;")" == 1 ]]; then
  bhutan_count=$(scalar "SELECT count(DISTINCT r.account_id) AS n FROM wpu_role_assignments r
   JOIN wpu_accounts a ON a.id=r.account_id AND a.status='active'
   WHERE r.scope_type='organisation' AND r.role='organiser' AND r.revoked_at IS NULL
   AND r.scope_id IN (SELECT o.id $bhutan)
   AND EXISTS(SELECT 1 FROM wpu_auth_emails e WHERE e.account_id=a.id AND e.verified_at IS NOT NULL);")
  echo "Bhutan remains a separate verified organisation with $bhutan_count active Event Studio organiser(s). Its access was not changed."
else
  echo 'The Bhutan workspace could not be verified from its existing federation record. No changes made to Bhutan.'
fi
