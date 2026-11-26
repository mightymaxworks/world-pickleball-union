#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
pilot_dir=$(mktemp -d)
trap 'rm -rf "$pilot_dir"' EXIT
d1() { node_modules/.bin/wrangler d1 execute wpu-supporters --local --persist-to "$pilot_dir/d1" --json "$@"; }
node tests/fixtures/control-affiliations.mjs "$pilot_dir"
{
  echo 'CREATE TABLE wpu_schema_migrations(filename TEXT PRIMARY KEY,sha256 TEXT NOT NULL);'
  for name in wpu-identity-foundation-v1 wpu-identity-invariants-v1 wpu-passwordless-auth-v1 wpu-passwordless-auth-v2 wpu-passwordless-auth-v3 wpu-organisation-foundation-v2 wpu-control-affiliations-v1 wpu-control-affiliations-v2 wpu-federation-portal-v1 wpu-federation-members-v1 inquiries; do
    file="$name.sql"
    cat "database/$file"
    printf "\nINSERT INTO wpu_schema_migrations VALUES('%s','%s');\n" "$file" "$(sha256sum "database/$file" | cut -d' ' -f1)"
  done
  cat "$pilot_dir/control-seed.sql"
  echo "
    INSERT INTO wpu_inquiries(id,form_type,organisation,country,contact_name,email,details_json,status)
    VALUES('legacy-test','membership','Isolated legacy request','Bhutan','Test contact','legacy@example.org','{}','pending');"
} > "$pilot_dir/bootstrap.sql"
d1 --file "$pilot_dir/bootstrap.sql" >/dev/null
WPU_INTAKE_LOCAL_FINGERPRINT=$(printf 'WPU organisation intake reviewer v1:reviewer@example.org' | sha256sum | cut -d' ' -f1)
export WPU_INTAKE_LOCAL_FINGERPRINT
[[ "$(bash scripts/wpu-organisation-intake-release.sh inspect "$pilot_dir/d1")" == *"schema is pending"* ]]
bash scripts/wpu-organisation-intake-release.sh prepare "$pilot_dir/d1"
d1 --command "SELECT
  (SELECT count(*) FROM wpu_inquiries WHERE id='legacy-test') AS preserved,
  (SELECT count(*) FROM wpu_organisation_intake_reviewers WHERE account_id='reviewer' AND revoked_at IS NULL) AS appointed,
  (SELECT count(*) FROM wpu_organisation_intake_reviewers) AS grants,
  (SELECT count(*) FROM wpu_organisation_intake_events) AS events;" |
  jq -e '.[0].results==[{preserved:1,appointed:1,grants:1,events:0}]' >/dev/null
d1 --command "UPDATE wpu_organisation_intake_reviewers SET revoked_at=datetime('now') WHERE account_id='reviewer';" >/dev/null
bash scripts/wpu-organisation-intake-release.sh prepare "$pilot_dir/d1"
d1 --command "SELECT count(*) AS active FROM wpu_organisation_intake_reviewers WHERE revoked_at IS NULL;" |
  jq -e '.[0].results==[{active:0}]' >/dev/null
echo 'Release preserved existing inquiries and respected the reviewer revocation.'
