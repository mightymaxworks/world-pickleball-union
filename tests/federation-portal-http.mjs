// WPU-owned reference client. Uses only the disposable Worker, never partner systems.
import assert from "node:assert/strict";
import { sign } from "node:crypto";
import { readFileSync } from "node:fs";

const base = process.env.TEST_BASE_URL ?? "http://localhost:8787";
assert.equal(new URL(base).origin, base);
assert.ok(["localhost", "127.0.0.1"].includes(new URL(base).hostname));
const { issuer, audience, identities, clients, privateKey } = JSON.parse(readFileSync(process.argv[2], "utf8"));
const control = "/api/control/affiliations";
const roster = "/api/control/federation-roster";
const grant = "/api/federations/v1/identity/grant";
const exchange = "/api/federations/v1/identity/exchange";

function token(id) {
  const now = Math.floor(Date.now() / 1000);
  const enc = data => Buffer.from(JSON.stringify(data)).toString("base64url");
  const value = enc({ alg: "RS256", kid: "isolated-key" }) + "." + enc({
    iss: issuer, aud: [audience], type: "app", email: identities[id].email, iat: now, exp: now + 300,
  });
  return value + "." + sign("RSA-SHA256", Buffer.from(value), privateKey).toString("base64url");
}
function request(path, { id, staff, body, client, origin = base } = {}) {
  return fetch(base + path, {
    method: body ? "POST" : "GET",
    headers: {
      ...(id ? { Cookie: "__Host-wpu_session=" + identities[id].token } : {}),
      ...(staff ? { "cf-access-jwt-assertion": token(staff) } : {}),
      ...(client ? { Authorization: "Bearer " + clients[client] } : {}),
      ...(body ? { Origin: origin, "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}
async function check(promise, status) {
  const response = await promise;
  const body = await response.json();
  assert.equal(response.status, status, JSON.stringify(body));
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  return body;
}
const decide = (id, action, staff) => check(request(control, { id: staff, staff, body: { id, action, reason: "Isolated federation test." } }), 200);
const playerAffiliation = (id, body, status = 200) => check(request("/api/passport/affiliation-requests", { id, body }), status);
const readRoster = (staff, federation, status = 200) =>
  check(request(roster + "?federation=" + federation, { id: staff, staff }), status);
const issue = (id, clientId, status = 201, consent = true) => check(request(grant, { id, body: { clientId, consent } }), status);
const redeem = (client, clientId, code, status = 200) => check(request(exchange, { client, body: { clientId, code } }), status);

const entry = await request("/federations/bhutan");
assert.equal(entry.status, 200);
assert.match(entry.headers.get("cache-control"), /no-store/);
assert.match(await entry.text(), /Bhutan Pickleball Federation.*Sign in to WPU/);
assert.equal((await request("/federations/no-enabled-portal")).status, 404);
assert.match(await (await request("/join?federation=bhutan&mode=login")).text(), /New to WPU\? Register/);
assert.doesNotMatch(await (await request("/join?federation=unknown&mode=login")).text(), /New to WPU\? Register/);
await check(request(roster), 401);
await check(request(roster, { id: "pilot-operator" }), 403);
await check(request(roster, { id: "pilot-operator", staff: "reviewer" }), 403);
await check(request(roster, { id: "reviewer", staff: "reviewer" }), 403);
await check(request(roster, { id: "outsider", staff: "outsider" }), 403);
assert.deepEqual(await check(request(roster, { id: "pilot-operator", staff: "pilot-operator" }), 200), {
  version: 1, federations: [{ slug: "bhutan", name: "Bhutan Pickleball Federation (test fixture)" }],
});
await readRoster("pilot-operator", "second", 403);
await readRoster("second-admin", "bhutan", 403);
assert.deepEqual((await readRoster("pilot-operator", "bhutan")).players, []);
await issue("player", "bhutan-reference", 403);
assert.match(await (await request("/federations/bhutan", { id: "player" })).text(), /Request affiliation/);

const first = await playerAffiliation("player", { action: "request", organisationId: "bhutan-isolated" }, 201);
assert.match(await (await request("/federations/bhutan", { id: "player" })).text(), /Your request is awaiting WPU review/);
assert.deepEqual((await readRoster("pilot-operator", "bhutan")).players, []);
await decide(first.id, "approve", "reviewer");
assert.match(await (await request("/federations/bhutan", { id: "player" })).text(), /WPU approved your affiliation/);
const second = await check(request(control, { id: "second-admin", staff: "second-admin", body: {
  action: "propose", organisationId: "second-federation", playerCode: identities.outsider.code, reason: "Isolated federation test.",
} }), 201);
await playerAffiliation("outsider", { action: "accept", id: second.id });
await decide(second.id, "approve", "second-reviewer");
const row = { playerId: identities.player.code, displayName: "Isolated player", rosterStatus: "listed" };
assert.deepEqual(await readRoster("pilot-operator", "bhutan"), { version: 1, federation: "bhutan", players: [row], next: null });
assert.deepEqual((await readRoster("second-admin", "second")).players, [
  { playerId: identities.outsider.code, displayName: "Isolated outsider", rosterStatus: "listed" },
]);

const hold = { federation: "bhutan", playerId: row.playerId, rosterStatus: "on_hold" };
await check(request(roster, { id: "pilot-operator", staff: "pilot-operator", body: hold, origin: "https://example.org" }), 403);
await check(request(roster, { id: "second-admin", staff: "second-admin", body: hold }), 403);
await check(request(roster, { id: "pilot-operator", staff: "pilot-operator", body: { ...hold, playerId: identities.outsider.code } }), 409);
await check(request(roster, { id: "pilot-operator", staff: "pilot-operator", body: hold }), 200);
assert.deepEqual((await readRoster("pilot-operator", "bhutan")).players, [{ ...row, rosterStatus: "on_hold" }]);
const passport = (await check(request("/api/passport", { id: "player" }), 200)).passport;
assert.equal(passport.playerCode, row.playerId);
assert.equal(passport.affiliations.find(a => a.organisationId === "bhutan-isolated").status, "active");
const staffPage = await request("/control", { id: "pilot-operator", staff: "pilot-operator" });
assert.match(await staffPage.text(), /Federation roster/);

await issue(undefined, "bhutan-reference", 401);
await issue("player", "bhutan-reference", 400, false);
await issue("player", "other-reference", 403);
await issue("player", "disabled-reference", 403);
await issue("outsider", "bhutan-reference", 403);
await check(request(grant, { id: "player", origin: "https://example.org", body: { clientId: "bhutan-reference", consent: true } }), 403);
const firstGrant = await issue("player", "bhutan-reference");
assert.equal(firstGrant.expiresIn, 120);
assert.match(firstGrant.code, /^[A-Za-z0-9_-]{43}$/);
const { code } = await issue("player", "bhutan-reference");
await redeem("bhutan-reference", "bhutan-reference", firstGrant.code, 403);
await redeem(undefined, "bhutan-reference", code, 401);
await redeem("other-reference", "bhutan-reference", code, 403);
await redeem("other-reference", "other-reference", code, 403);
const concurrent = await Promise.all([
  request(exchange, { client: "bhutan-reference", body: { clientId: "bhutan-reference", code } }),
  request(exchange, { client: "bhutan-reference", body: { clientId: "bhutan-reference", code } }),
]);
assert.deepEqual(concurrent.map(r => r.status).sort(), [200, 403]);
assert.deepEqual(await concurrent.find(r => r.ok).json(), {
  version: 1, playerId: row.playerId, displayName: row.displayName, organisationId: "bhutan-isolated",
});
const secondGrant = await issue("outsider", "other-reference");
assert.equal((await redeem("other-reference", "other-reference", secondGrant.code)).playerId, identities.outsider.code);
const pendingCode = (await issue("player", "bhutan-reference")).code;
await decide(first.id, "revoke", "reviewer");
await redeem("bhutan-reference", "bhutan-reference", pendingCode, 403);
assert.deepEqual((await readRoster("pilot-operator", "bhutan")).players, []);
assert.equal((await readRoster("second-admin", "second")).players.length, 1);
console.log("Federation portal: existing Passport, two isolated rosters, scoped changes and consented one-time identity handoff passed");
