// Isolated D1 fixtures only. Never copy these to production.
import { createHash, generateKeyPairSync, randomBytes } from "node:crypto";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const folder = process.argv[2];
if (!folder) throw Error("Pass the temporary fixture directory");
const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const key = publicKey.export({ format: "jwk" });
const issuer = "https://isolated-wpu.cloudflareaccess.com";
const audience = "2".repeat(64);
const identities = Object.fromEntries(["player","operator","reviewer","outsider","other-reviewer","player-alias","pilot-operator","unverified","second-admin","second-reviewer"].map((id, index) => [id, {
  code: "WPU-" + (index + 1).toString(16).toUpperCase().repeat(32),
  email: id + "@example.org",
  token: randomBytes(32).toString("base64url"),
}]));
const clients = Object.fromEntries(["bhutan-reference", "other-reference", "disabled-reference"].map(id => [id, randomBytes(32).toString("base64url")]));
const sql = [];
for (const [id, identity] of Object.entries(identities)) {
  const hash = createHash("sha256").update(identity.token).digest("hex");
  sql.push(
    `INSERT INTO wpu_persons(id,display_name) VALUES('${id}','Isolated ${id}');`,
    `INSERT INTO wpu_accounts(id,person_id,auth_subject) VALUES('${id}','${id === "player-alias" ? "player" : id}','isolated:${id}');`,
    `INSERT INTO wpu_auth_emails(account_id,email_normalized,verified_at) VALUES('${id}','${identity.email}',${id === "unverified" ? "NULL" : "datetime('now')"});`,
    `INSERT INTO wpu_auth_sessions(id,account_id,session_hash,expires_at) VALUES('isolated:${id}','${id}','${hash}','2099-01-01T00:00:00.000Z');`,
    `INSERT INTO wpu_player_profiles(person_id,public_player_code) VALUES('${id}','${identity.code}');`,
  );
}
sql.push(`INSERT INTO wpu_organisations(id,name,status,organisation_type) VALUES
 ('isolated-club','Isolated Pilot Club','verified','club'),('other-club','Other Isolated Club','verified','club'),
 ('unverified-club','Unverified Isolated Club','pending','club'),
 ('bhutan-isolated','Bhutan Pickleball Federation (test fixture)','verified','national_federation'),
 ('second-federation','Other Federation (test fixture)','verified','national_federation'),
 ('rollout-federation','Rollout Federation (test fixture)','verified','national_federation'),
 ('disabled-federation','Disabled Federation (test fixture)','verified','national_federation');
UPDATE wpu_organisations SET country_code='BT' WHERE id='bhutan-isolated';
UPDATE wpu_organisations SET country_code='SG' WHERE id='rollout-federation';
INSERT INTO wpu_federation_portals(slug,organisation_id,enabled) VALUES
 ('bhutan','bhutan-isolated',1),('second','second-federation',1),
 ('rollout-test','rollout-federation',1),('disabled-test','disabled-federation',0);
INSERT INTO wpu_federation_identity_clients(id,organisation_id,label,key_hash,enabled) VALUES
 ('bhutan-reference','bhutan-isolated','WPU Bhutan reference client','${createHash("sha256").update(clients["bhutan-reference"]).digest("hex")}',1),
 ('other-reference','second-federation','WPU second reference client','${createHash("sha256").update(clients["other-reference"]).digest("hex")}',1),
 ('disabled-reference','bhutan-isolated','WPU disabled reference client','${createHash("sha256").update(clients["disabled-reference"]).digest("hex")}',0);
INSERT INTO wpu_affiliation_self_request_orgs(organisation_id) VALUES('bhutan-isolated'),('unverified-club'),('rollout-federation');
INSERT INTO wpu_role_assignments(id,account_id,role,scope_type,scope_id) VALUES
 ('operator-grant','operator','organisation_admin','organisation','isolated-club'),
 ('operator-review','operator','wpu_reviewer','organisation','isolated-club'),
 ('reviewer-grant','reviewer','wpu_reviewer','organisation','isolated-club'),
 ('other-reviewer-grant','other-reviewer','wpu_reviewer','organisation','other-club'),
 ('outsider-global-grant','outsider','wpu_admin','global',NULL),
 ('pilot-reviewer','reviewer','wpu_reviewer','organisation','bhutan-isolated'),
 ('pilot-player-reviewer','player','wpu_reviewer','organisation','bhutan-isolated'),
 ('pilot-alias-reviewer','player-alias','wpu_reviewer','organisation','bhutan-isolated'),
 ('pilot-operator-grant','pilot-operator','organisation_admin','organisation','bhutan-isolated'),
 ('second-admin-grant','second-admin','organisation_admin','organisation','second-federation'),
 ('second-review-grant','second-reviewer','wpu_reviewer','organisation','second-federation'),
 ('rollout-review','second-reviewer','wpu_reviewer','organisation','rollout-federation');
INSERT INTO wpu_memberships(id,person_id,membership_type,status,valid_from)
 VALUES('original-membership','player','individual','active','2026-01-01T00:00:00.000Z');`);
writeFileSync(join(folder, "control-seed.sql"), sql.join("\n"), { mode: 0o600 });
const jwks = JSON.stringify({ keys: [{ ...key, alg: "RS256", kid: "isolated-key", use: "sig" }] });
writeFileSync(join(folder, "control-fixtures.json"), JSON.stringify({
  issuer, audience, identities, clients, privateKey: privateKey.export({ format: "pem", type: "pkcs8" }),
}), { mode: 0o600 });
writeFileSync(join(folder, "pilot.env"), [
  "WPU_AFFILIATION_PILOT_ENABLED=true",
  "WPU_FEDERATION_PILOT_ENABLED=true",
  "WPU_CONTROL_ACCESS_ISSUER=" + issuer,
  "WPU_CONTROL_ACCESS_AUDIENCE=" + audience,
  "WPU_CONTROL_ACCESS_JWKS='" + jwks + "'",
  "",
].join("\n"), { mode: 0o600 });
