#!/usr/bin/env bash
# Test the exact release script against an isolated local D1, never production.
set -euo pipefail
cd "$(dirname "$0")/.."
pilot_dir=$(mktemp -d)
trap 'rm -rf "$pilot_dir"' EXIT
d1() { node_modules/.bin/wrangler d1 execute wpu-supporters --local --persist-to "$pilot_dir/d1" --json "$@"; }
{
  echo "CREATE TABLE wpu_schema_migrations(filename TEXT PRIMARY KEY,sha256 TEXT NOT NULL);"
  for name in wpu-identity-foundation-v1 wpu-identity-invariants-v1 wpu-passwordless-auth-v1 wpu-passwordless-auth-v2 wpu-passwordless-auth-v3 wpu-organisation-foundation-v2 wpu-control-affiliations-v1 wpu-control-affiliations-v2; do
    file="$name.sql"
    cat "database/$file"
    printf "\nINSERT INTO wpu_schema_migrations VALUES('%s','%s');\n" "$file" "$(sha256sum "database/$file" | cut -d' ' -f1)"
  done
  cat <<'SQL'
INSERT INTO wpu_organisations(id,name,country_code,status,organisation_type)
VALUES('bhutan-pickleball-federation','Bhutan Pickleball Federation','BT','verified','national_federation');
INSERT INTO wpu_affiliation_self_request_orgs(organisation_id) VALUES('bhutan-pickleball-federation');
SQL
} > "$pilot_dir/bootstrap.sql"
d1 --file "$pilot_dir/bootstrap.sql" >/dev/null
[[ "$(bash scripts/wpu-federation-d1-release.sh inspect "$pilot_dir/d1")" == *"Federation schema is pending"* ]]
bash scripts/wpu-federation-d1-release.sh prepare "$pilot_dir/d1"
d1 --command "SELECT
 (SELECT enabled FROM wpu_federation_portals WHERE slug='bhutan') AS enabled,
 (SELECT count(*) FROM wpu_role_assignments) AS roles,
 (SELECT count(*) FROM wpu_federation_identity_clients) AS clients;" |
 jq -e '.[0].results==[{enabled:0,roles:0,clients:0}]' >/dev/null
[[ "$(bash scripts/wpu-federation-d1-release.sh prepare "$pilot_dir/d1")" == *"already prepared"* ]]
echo 'Federation release preparation stages a disabled Bhutan portal without granting live access.'
