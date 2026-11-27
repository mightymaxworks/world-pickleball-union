#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
test_dir=$(mktemp -d)
trap 'rm -rf "$test_dir"' EXIT
d1() { node_modules/.bin/wrangler d1 execute wpu-supporters --local --persist-to "$test_dir/db" --json "$@"; }
file=wpu-event-studio-v1.sql
hash=$(sha256sum "database/$file" | cut -d' ' -f1)
{
  cat database/wpu-identity-foundation-v1.sql database/wpu-identity-invariants-v1.sql \
      database/wpu-organisation-foundation-v2.sql database/wpu-passwordless-auth-v1.sql \
      database/wpu-federation-portal-v1.sql "database/$file"
  cat <<SQL
CREATE TABLE wpu_schema_migrations(filename TEXT PRIMARY KEY, sha256 TEXT NOT NULL);
INSERT INTO wpu_schema_migrations VALUES('$file','$hash');
CREATE TABLE wpu_federation_publishers(account_id TEXT PRIMARY KEY, revoked_at TEXT);
CREATE TABLE wpu_organisation_intake_reviewers(account_id TEXT PRIMARY KEY, revoked_at TEXT);
INSERT INTO wpu_persons(id,display_name) VALUES('p1','Test Operator'),('p2','Bhutan Admin');
INSERT INTO wpu_accounts(id,person_id,auth_subject) VALUES('operator','p1','test:operator'),('bhutan-admin','p2','test:bhutan');
INSERT INTO wpu_auth_emails(account_id,email_normalized,verified_at) VALUES('operator','operator@example.org','2027-01-01'),('bhutan-admin','bhutan@example.org','2027-01-01');
INSERT INTO wpu_federation_publishers(account_id) VALUES('operator');
INSERT INTO wpu_organisation_intake_reviewers(account_id) VALUES('operator');
INSERT INTO wpu_organisations(id,name,status,organisation_type) VALUES('bhutan-test','Bhutan Federation','verified','national_federation');
INSERT INTO wpu_federation_portals(slug,organisation_id,enabled) VALUES('bhutan','bhutan-test',1);
INSERT INTO wpu_role_assignments(id,account_id,role,scope_type,scope_id) VALUES('bhutan-current-role','bhutan-admin','organisation_admin','organisation','bhutan-test');
SQL
} > "$test_dir/fixture.sql"
d1 --file "$test_dir/fixture.sql" >/dev/null
export WPU_WORKSPACE_TEST_FINGERPRINT=$(printf 'WPU organisation intake reviewer v1:operator@example.org' | sha256sum | cut -d' ' -f1)
export WPU_BHUTAN_TEST_FINGERPRINT=$(printf 'WPU Event Studio Bhutan organiser v1:bhutan@example.org' | sha256sum | cut -d' ' -f1)
script=scripts/wpu-event-studio-bhutan-release.sh
bash "$script" "$test_dir/db"
bash "$script" "$test_dir/db"
d1 --command "SELECT count(*) AS n FROM wpu_role_assignments WHERE role='organiser' AND revoked_at IS NULL AND account_id='bhutan-admin' AND scope_id='bhutan-test' AND granted_by_account_id='operator';" | jq -e '.[0].results==[{n:1}]' >/dev/null
d1 --command "SELECT (SELECT count(*) FROM wpu_role_assignments WHERE role='organiser' AND scope_id<>'bhutan-test') AS other_roles,(SELECT count(*) FROM wpu_studio_events) AS events;" | jq -e '.[0].results==[{other_roles:0,events:0}]' >/dev/null
d1 --command "UPDATE wpu_role_assignments SET revoked_at=datetime('now') WHERE id='event-studio:bhutan-organiser:v1';" >/dev/null
if bash "$script" "$test_dir/db" > "$test_dir/revoked.log" 2>&1; then
  echo 'Revoked organiser access was not rejected.' >&2
  exit 1
fi
grep -q 'will not be restored' "$test_dir/revoked.log"
echo 'Verified the Bhutan scope, idempotency and revocation in isolated D1.'
