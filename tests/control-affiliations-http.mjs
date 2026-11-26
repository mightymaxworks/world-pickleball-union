import assert from "node:assert/strict";
import { sign } from "node:crypto";
import { readFileSync } from "node:fs";

const base = process.env.TEST_BASE_URL ?? "http://localhost:8787";
assert.equal(new URL(base).origin, base);
assert.ok(["localhost", "127.0.0.1"].includes(new URL(base).hostname));
const { issuer, audience, identities, privateKey } = JSON.parse(readFileSync(process.argv[2], "utf8"));
const control = "/api/control/affiliations";
const playerRoute = "/api/passport/affiliation-requests";

function token(id, changes = {}, algorithm = "RS256") {
  const now = Math.floor(Date.now() / 1000);
  const enc = data => Buffer.from(JSON.stringify(data)).toString("base64url");
  const value = enc({ alg: algorithm, kid: "isolated-key", typ: "JWT" }) + "." + enc({
    iss: issuer, aud: [audience], type: "app", email: identities[id].email, iat: now, nbf: now, exp: now + 300, ...changes,
  });
  return value + "." + sign("RSA-SHA256", Buffer.from(value), privateKey).toString("base64url");
}
function request(path, { id, proof, body, origin = base } = {}) {
  return fetch(base + path, {
    method: body ? "POST" : "GET",
    headers: {
      ...(id ? { Cookie: "__Host-wpu_session=" + identities[id].token } : {}),
      ...(proof ? { "cf-access-jwt-assertion": proof } : {}),
      ...(body ? { Origin: origin, "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}
async function check(response, status) {
  const res = await response;
  const text = await res.text();
  assert.equal(res.status, status, text);
  assert.equal(res.headers.get("cache-control"), "private, no-store");
  return JSON.parse(text);
}
const getWorkspace = (id, status = 200) => check(request(control, { id, proof: token(id) }), status);
const staff = (id, body, status = 200, origin = base) => check(request(control, { id, proof: token(id), body, origin }), status);
const player = (id, body, status = 200) => check(request(playerRoute, { id, body }), status);
const propose = { action: "propose", organisationId: "isolated-club", playerCode: identities.player.code, reason: "Roster verified by isolated test operator." };
const decision = (action, id) => ({ action, id, reason: "Isolated reviewer checked the case." });

const blockedPage = await request("/control");
assert.equal(blockedPage.status, 200);
assert.match(await blockedPage.text(), /Staff verification required/);
const verifiedPage = await request("/control", { proof: token("reviewer") });
assert.equal(verifiedPage.status, 200);
assert.doesNotMatch(await verifiedPage.text(), /Staff verification required/);

await check(request(control), 401);
await check(request(playerRoute), 401);
await check(request(control, { id: "operator" }), 403);
await check(request(control, { id: "operator", proof: token("reviewer") }), 403);
await check(request(control, { id: "operator", proof: token("operator", { aud: ["invalid-audience"] }) }), 403);
await check(request(control, { id: "operator", proof: token("operator", { iss: "https://wrong.cloudflareaccess.com" }) }), 403);
await check(request(control, { id: "operator", proof: token("operator", { exp: 1 }) }), 403);
await check(request(control, { id: "operator", proof: token("operator", { exp: Math.floor(Date.now() / 1000) + 7200 }) }), 403);
await check(request(control, { id: "operator", proof: token("operator", { nbf: Math.floor(Date.now() / 1000) + 120 }) }), 403);
await check(request(control, { id: "operator", proof: token("operator", { type: "org" }) }), 403);
await check(request(control, { id: "operator", proof: token("operator", {}, "none") }), 403);
const corrupt = token("operator").split(".");
corrupt[2] = (corrupt[2][0] === "A" ? "B" : "A") + corrupt[2].slice(1);
await check(request(control, { id: "operator", proof: corrupt.join(".") }), 403);
await getWorkspace("outsider", 403);
assert.deepEqual((await getWorkspace("operator")).organisations, [{ id: "isolated-club", name: "Isolated Pilot Club" }]);
assert.deepEqual((await getWorkspace("reviewer")).organisations, []);

const before = (await check(request("/api/passport", { id: "player" }), 200)).passport;
assert.equal(before.affiliationRequestsEnabled, true);
assert.equal(before.membershipStatus, "active");
assert.deepEqual(before.affiliations, []);
await staff("operator", propose, 403, "https://example.org");
await staff("operator", { ...propose, organisationId: "other-club" }, 409);
await staff("operator", { ...propose, organisationId: "unverified-club" }, 409);
await staff("operator", { ...propose, playerCode: identities.operator.code }, 409);
await staff("reviewer", propose, 409);
const { id } = await staff("operator", propose, 201);
await staff("operator", propose, 409);
await staff("reviewer", decision("approve", id), 409);
assert.deepEqual((await getWorkspace("other-reviewer")).cases, []);
assert.deepEqual((await player("outsider")).invitations, []);
await player("outsider", { action: "accept", id }, 409);
assert.deepEqual((await player("player")).invitations.map(item => item.id), [id]);
await player("player", { action: "accept", id });
await player("player", { action: "accept", id }, 409);
await staff("operator", decision("approve", id), 409);
await staff("other-reviewer", decision("approve", id), 409);
const ready = (await getWorkspace("reviewer")).cases[0];
assert.deepEqual(ready.actions, ["approve","reject"]);
assert.equal(ready.playerCodeEnding, identities.player.code.slice(-8));
assert.equal(ready.history[1].actor, null);
assert.doesNotMatch(JSON.stringify(ready), /example\.org|isolated:|WPU-111/);

const attempts = await Promise.all([
  request(control, { id: "reviewer", proof: token("reviewer"), body: decision("approve", id) }),
  request(control, { id: "reviewer", proof: token("reviewer"), body: decision("approve", id) }),
]);
assert.deepEqual(attempts.map(result => result.status).sort(), [200,409]);
const after = (await check(request("/api/passport", { id: "player" }), 200)).passport;
assert.equal(after.playerCode, before.playerCode);
assert.equal(after.memberSince, before.memberSince);
assert.equal(after.visibility, "private");
assert.deepEqual(after.affiliations.map(record => [record.name,record.status]), [["Isolated Pilot Club","active"]]);
assert.deepEqual((await getWorkspace("reviewer")).cases[0].history.map(entry => [entry.state,entry.actor]), [
  ["awaiting_player","Isolated operator"],["awaiting_review",null],["approved","Isolated reviewer"],
]);
await staff("reviewer", decision("revoke", id));
const revoked = (await check(request("/api/passport", { id: "player" }), 200)).passport;
assert.equal(revoked.playerCode, before.playerCode);
assert.equal(revoked.affiliations[0].status, "revoked");
const { id: declined } = await staff("operator", propose, 201);
await player("player", { action: "decline", id: declined });
await staff("reviewer", decision("approve", declined), 409);
const { id: rejected } = await staff("operator", propose, 201);
await staff("reviewer", decision("reject", rejected));
await player("player", { action: "accept", id: rejected }, 409);
console.log("WPU Control isolated Worker: Access/session binding, scoped proposal, consent, independent approval, atomic audit, race, private Passport and revocation passed");

const own = { action: "request", organisationId: "bhutan-isolated" };
const testOrganisation = { id: "bhutan-isolated", name: "Bhutan Pickleball Federation (test fixture)" };
const details = await player("player");
assert.deepEqual(details.options, [testOrganisation]);
assert.deepEqual(details.requests, []);
assert.deepEqual((await player("unverified")).options, []);
await player("unverified", own, 409);
await check(request(playerRoute, { body: own }), 401);
await check(request(playerRoute, { id: "player", body: own, origin: "https://example.org" }), 403);
await player("player", { ...own, personId: "outsider" }, 400);
await player("player", { ...own, playerCode: identities.outsider.code }, 400);
await player("player", { ...own, organisationId: "other-club" }, 409);
await player("player", { ...own, organisationId: "unverified-club" }, 409);
await getWorkspace("pilot-operator", 403);
await staff("pilot-operator", { ...propose, organisationId: own.organisationId }, 409);

const submissions = await Promise.all([
  request(playerRoute, { id: "player", body: own }),
  request(playerRoute, { id: "player", body: own }),
]);
assert.deepEqual(submissions.map(res => res.status).sort(), [201, 409]);
const created = await submissions.find(res => res.status === 201).json();
assert.equal(created.state, "awaiting_review");
assert.deepEqual((await player("player")).options, []);
assert.deepEqual((await player("player")).requests, [{ id: created.id, organisation: testOrganisation.name, state: "awaiting_review" }]);
assert.deepEqual((await player("outsider")).requests, []);
assert.deepEqual((await player("player")).invitations, []);
const pendingPassport = (await check(request("/api/passport", { id: "player" }), 200)).passport;
assert.ok(pendingPassport.affiliations.every(item => item.organisationId !== own.organisationId));

const reviewerCase = (await getWorkspace("reviewer")).cases.find(item => item.id === created.id);
assert.equal(reviewerCase.source, "player");
assert.equal(reviewerCase.playerName, "Isolated player");
assert.equal(reviewerCase.playerCodeEnding, identities.player.code.slice(-8));
assert.deepEqual(reviewerCase.history.map(entry => [entry.kind, entry.state, entry.actor]), [["player", "awaiting_review", null]]);
assert.doesNotMatch(JSON.stringify(reviewerCase), /example\.org|WPU-111/);
assert.deepEqual((await getWorkspace("other-reviewer")).cases, []);
assert.deepEqual((await getWorkspace("player-alias")).cases.find(item => item.id === created.id).actions, []);
await staff("player", decision("approve", created.id), 409);
await staff("player-alias", decision("approve", created.id), 409);
await staff("other-reviewer", decision("approve", created.id), 409);
await staff("reviewer", decision("approve", created.id));
assert.equal((await player("player")).requests[0].state, "approved");
const approvedPassport = (await check(request("/api/passport", { id: "player" }), 200)).passport;
assert.equal(approvedPassport.playerCode, before.playerCode);
assert.equal(approvedPassport.memberSince, before.memberSince);
assert.equal(approvedPassport.visibility, "private");
assert.deepEqual(approvedPassport.affiliations.filter(item => item.organisationId === own.organisationId)
  .map(item => [item.name, item.status]), [[testOrganisation.name, "active"]]);
await staff("reviewer", decision("revoke", created.id));
assert.equal((await player("player")).requests[0].state, "revoked");
const second = await player("player", own, 201);
await staff("reviewer", decision("reject", second.id));
assert.equal((await player("player")).requests.find(item => item.id === second.id).state, "rejected");
assert.notEqual((await check(request("/api/passport", { id: "player" }), 200)).passport.affiliations
  .find(item => item.organisationId === own.organisationId).status, "active");
console.log("Self-service affiliation: submit into review, scoped decisions, reject and revoke, private Passport, same-person review blocked");
