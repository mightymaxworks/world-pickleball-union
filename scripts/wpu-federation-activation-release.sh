#!/usr/bin/env bash
# Add publishing controls without publishing, pausing or reconfiguring any federation.
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ $# -lt 1 || $# -gt 2 || ( "$1" != inspect && "$1" != prepare ) ]]; then
  echo 'Usage: wpu-federation-activation-release.sh inspect|prepare [isolated-local-persistence-dir]' >&2
  exit 2
fi
mode=$1
database=f245a594-0932-41b9-b255-aeaa1300b639
target=(--remote)
# Use the same nominated WPU operations account as the existing intake release.
# No email, account ID or applicant data is printed.
fingerprint='d35c4a91259ff54a4eab25012e4488b0f4cab9cefefa11630f5e8cad912d6daa'
if [[ $# == 2 ]]; then
  [[ -n "$2" ]]
  database=wpu-supporters
  target=(--local --persist-to "$2")
  fingerprint="${WPU_ACTIVATION_LOCAL_FINGERPRINT:?Set the isolated operator fingerprint}"
else
  jq -e --arg db "$database" '[.d1_databases[] | select(.binding=="WPU_DB" and .database_id==$db)] | length==1' wrangler.jsonc >/dev/null
fi
wrangler=node_modules/.bin/wrangler
d1() { "$wrangler" d1 execute "$database" "${target[@]}" --json "$@"; }
scalar() {
  d1 --command "$1" | jq -er 'if length==1 and .[0].success and (.[0].results|length)==1
    then .[0].results[0].n else error("D1 query failed") end'
}
fatal() { printf 'Federation activation release stopped: %s\n' "$1" >&2; exit 1; }
for prior in wpu-federation-members-v1.sql wpu-organisation-intake-v1.sql; do
  checksum=$(sha256sum "database/$prior" | cut -d' ' -f1)
  [[ "$(scalar "SELECT count(*) AS n FROM wpu_schema_migrations WHERE filename='$prior' AND sha256='$checksum';")" == 1 ]] ||
    fatal 'reviewed prerequisites are missing on this binding'
done
file=wpu-federation-activation-v1.sql
hash=$(sha256sum "database/$file" | cut -d' ' -f1)
registry="SELECT coalesce((SELECT sha256 FROM wpu_schema_migrations WHERE filename='$file'),'missing') AS n;"
objects="SELECT count(*) AS n FROM sqlite_master WHERE name IN ('wpu_federation_publishers',
 'wpu_federation_activation_events','idx_wpu_fed_activation_events','wpu_fed_activation_publish',
 'wpu_fed_activation_events_no_update','wpu_fed_activation_events_no_delete','wpu_fed_activation_pause_guard');"
logged=$(scalar "$registry")
if [[ "$logged" == missing ]]; then
  [[ "$(scalar "$objects")" == 0 ]] || fatal 'unrecorded activation objects exist'
else
  [[ "$logged" == "$hash" && "$(scalar "$objects")" == 7 ]] || fatal 'activation objects or checksum do not match'
fi

if [[ "$mode" == inspect ]]; then
  if [[ "$logged" == missing ]]; then echo 'Federation activation schema is pending.'; else echo 'Federation activation schema is verified.'; fi
  exit 0
fi

if [[ "$logged" == missing ]]; then
  if [[ "${target[0]}" == --remote ]]; then "$wrangler" d1 time-travel info "$database"; fi
  batch=$(mktemp)
  trap 'rm -f "$batch"' EXIT
  cat "database/$file" > "$batch"
  printf "\nINSERT INTO wpu_schema_migrations(filename,sha256) VALUES('%s','%s');\n" "$file" "$hash" >> "$batch"
  d1 --yes --file "$batch" >/dev/null
fi
[[ "$(scalar "$registry")" == "$hash" && "$(scalar "$objects")" == 7 ]] || fatal 'post-apply schema verification failed'
d1 --command 'PRAGMA foreign_key_check;' | jq -e 'length == 1 and .[0].success and (.[0].results | length == 0)' >/dev/null
echo 'Federation activation schema applied and verified. Existing publication states preserved.'

# Bootstrap once. An existing row, including a revoked grant, is never restored.
if [[ "$(scalar 'SELECT count(*) AS n FROM wpu_federation_publishers;')" == 0 ]]; then
  readonly candidate_sql="SELECT DISTINCT a.id,e.email_normalized FROM wpu_accounts a
    JOIN wpu_auth_emails e ON e.account_id=a.id AND e.verified_at IS NOT NULL
    JOIN wpu_organisation_intake_reviewers i ON i.account_id=a.id AND i.revoked_at IS NULL
    JOIN wpu_role_assignments r ON r.account_id=a.id AND r.role='wpu_reviewer' AND r.revoked_at IS NULL
    JOIN wpu_federation_portals f ON r.scope_id=f.organisation_id AND f.slug='bhutan'
    WHERE a.status='active' AND r.scope_type='organisation';"
  account=$(d1 --command "$candidate_sql" | node -e '
    const data = JSON.parse(require("node:fs").readFileSync(0, "utf8"));
    if (data.length !== 1 || !data[0].success) process.exit(1);
    const rows = data[0].results.filter(x => require("node:crypto").createHash("sha256")
      .update("WPU organisation intake reviewer v1:" + x.email_normalized).digest("hex") === process.argv[1]);
    if (rows.length !== 1 || typeof rows[0].id !== "string" || !/^[A-Za-z0-9:_-]{1,128}$/.test(rows[0].id)) process.exit(1);
    process.stdout.write(rows[0].id);
  ' "$fingerprint") || fatal 'could not resolve the nominated and verified WPU operations reviewer'
  d1 --command "INSERT INTO wpu_federation_publishers(account_id)
    SELECT '$account' WHERE NOT EXISTS(SELECT 1 FROM wpu_federation_publishers);" >/dev/null
  [[ "$(scalar "SELECT count(*) AS n FROM wpu_federation_publishers WHERE account_id='$account' AND revoked_at IS NULL;")" == 1 ]] ||
    fatal 'initial publication grant could not be verified'
  echo 'One nominated WPU operator received federation publication access. No federation was published or paused.'
else
  echo 'Existing federation publication grants left unchanged.'
fi
