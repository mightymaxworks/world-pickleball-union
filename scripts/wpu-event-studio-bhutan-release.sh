#!/usr/bin/env bash
# One approved organiser grant scoped only to Bhutan's verified federation.
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ $# -gt 1 ]]; then
  echo 'Usage: wpu-event-studio-bhutan-release.sh [isolated-local-dir]' >&2
  exit 2
fi
database=f245a594-0932-41b9-b255-aeaa1300b639
target=(--remote)
operator_fingerprint='d35c4a91259ff54a4eab25012e4488b0f4cab9cefefa11630f5e8cad912d6daa'
bhutan_fingerprint='54e5f84004dac7be514faff2f26d2b098f056b3aa7b7769b0f8b080033e12892'
if [[ $# == 1 ]]; then
  [[ -n "$1" ]]
  database=wpu-supporters
  target=(--local --persist-to "$1")
  operator_fingerprint="${WPU_WORKSPACE_TEST_FINGERPRINT:?Set the isolated operator fingerprint}"
  bhutan_fingerprint="${WPU_BHUTAN_TEST_FINGERPRINT:?Set the isolated Bhutan nominee fingerprint}"
else
  jq -e --arg db "$database" '[.d1_databases[] | select(.binding=="WPU_DB" and .database_id==$db)] | length==1' wrangler.jsonc >/dev/null
fi
wrangler=node_modules/.bin/wrangler
d1() { "$wrangler" d1 execute "$database" "${target[@]}" --json "$@"; }
scalar() {
  d1 --command "$1" | jq -er 'if length==1 and .[0].success and (.[0].results|length)==1 then .[0].results[0].n else error("D1 query failed") end'
}
lookup() {
  d1 --command "$1" | node -e '
    const data=JSON.parse(require("node:fs").readFileSync(0,"utf8"));
    if(data.length!==1 || !data[0].success)process.exit(1);
    const {createHash}=require("node:crypto");
    const rows=data[0].results.filter(x=>createHash("sha256").update(process.argv[1]+x.email_normalized).digest("hex")===process.argv[2]);
    if(rows.length!==1||typeof rows[0].id!=="string"||!/^[A-Za-z0-9:_-]{1,128}$/.test(rows[0].id))process.exit(1);
    process.stdout.write(rows[0].id);
  ' "$2" "$3"
}
fatal() { printf 'Bhutan workspace setup stopped: %s\n' "$1" >&2; exit 1; }
file=wpu-event-studio-v1.sql
hash=$(sha256sum "database/$file" | cut -d' ' -f1)
[[ "$(scalar "SELECT count(*) AS n FROM wpu_schema_migrations WHERE filename='$file' AND sha256='$hash';")" == 1 ]] ||
  fatal 'reviewed Event Studio schema is missing'
readonly bhutan="FROM wpu_federation_portals f JOIN wpu_organisations o ON o.id=f.organisation_id
 WHERE f.slug='bhutan' AND o.status='verified' AND o.organisation_type='national_federation'"
[[ "$(scalar "SELECT count(*) AS n $bhutan;")" == 1 ]] || fatal 'the verified Bhutan federation was not uniquely found'
readonly accounts="FROM wpu_accounts a JOIN wpu_auth_emails e ON e.account_id=a.id AND e.verified_at IS NOT NULL WHERE a.status='active'"
readonly authorised_wpu="AND EXISTS(SELECT 1 FROM wpu_federation_publishers p WHERE p.account_id=a.id AND p.revoked_at IS NULL)
 AND EXISTS(SELECT 1 FROM wpu_organisation_intake_reviewers i WHERE i.account_id=a.id AND i.revoked_at IS NULL)"
readonly authorised_bhutan="AND EXISTS(SELECT 1 FROM wpu_role_assignments r WHERE r.account_id=a.id AND r.role='organisation_admin'
 AND r.scope_type='organisation' AND r.revoked_at IS NULL AND r.scope_id IN (SELECT o.id $bhutan))"
operator=$(lookup "SELECT a.id,e.email_normalized $accounts $authorised_wpu;" 'WPU organisation intake reviewer v1:' "$operator_fingerprint") ||
  fatal 'the WPU approver could not be uniquely resolved'
nominee=$(lookup "SELECT a.id,e.email_normalized $accounts $authorised_bhutan;" 'WPU Event Studio Bhutan organiser v1:' "$bhutan_fingerprint") ||
  fatal 'the nominated verified Bhutan administrator could not be uniquely resolved'
[[ "$operator" != "$nominee" ]] || fatal 'the Bhutan nominee and WPU approver must be distinct'

readonly grants="SELECT count(*) AS n FROM wpu_role_assignments r
 WHERE r.account_id='$nominee' AND r.role='organiser' AND r.scope_type='organisation'
 AND r.scope_id IN (SELECT o.id $bhutan)"
active=$(scalar "$grants AND r.revoked_at IS NULL;")
if [[ "$active" == 0 ]]; then
  [[ "$(scalar "$grants AND r.revoked_at IS NOT NULL;")" == 0 ]] || fatal 'a previously revoked grant will not be restored'
  if [[ "${target[0]}" == --remote ]]; then "$wrangler" d1 time-travel info "$database"; fi
  d1 --command "INSERT INTO wpu_role_assignments(id,account_id,role,scope_type,scope_id,granted_by_account_id)
    SELECT 'event-studio:bhutan-organiser:v1',a.id,'organiser','organisation',q.id,'$operator'
    FROM (SELECT o.id $bhutan) q JOIN wpu_accounts a ON a.id='$nominee' AND a.status='active'
    WHERE EXISTS(SELECT 1 FROM wpu_auth_emails e WHERE e.account_id=a.id AND e.verified_at IS NOT NULL)
    $authorised_bhutan
    AND EXISTS(SELECT 1 $accounts AND a.id='$operator' $authorised_wpu)
    AND NOT EXISTS(SELECT 1 FROM wpu_role_assignments r WHERE r.account_id=a.id AND r.role='organiser'
      AND r.scope_type='organisation' AND r.scope_id=q.id);" >/dev/null
  active=$(scalar "$grants AND r.revoked_at IS NULL;")
fi
[[ "$active" == 1 ]] || fatal 'the expected Bhutan organiser grant could not be verified'
echo 'Bhutan Event Studio workspace: active for the nominated Bhutan organiser. No other workspace access was granted and no events were published.'
