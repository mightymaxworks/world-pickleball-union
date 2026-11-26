// Isolated release rehearsal. Never writes real federation or member records.
import assert from "node:assert/strict";
import { randomUUID, sign } from "node:crypto";
import { readFileSync } from "node:fs";
const base = process.env.TEST_BASE_URL ?? "http://localhost:8787";
assert.ok(["localhost","127.0.0.1"].includes(new URL(base).hostname));
const {issuer,audience,identities,privateKey} = JSON.parse(readFileSync(process.argv[2],"utf8"));
const activation = "/api/control/federation-activation";
const intake = "/api/control/organisation-intake";
const playerRequests = "/api/passport/affiliation-requests";
const portal = "/federations/activation-test";
const roster = "/api/control/federation-roster?federation=activation-test";
function token(id) {
  const now = Math.floor(Date.now()/1000);
  const encode = value => Buffer.from(JSON.stringify(value)).toString("base64url");
  const first = encode({alg:"RS256",kid:"isolated-key"}) + "." + encode({iss:issuer,aud:[audience],type:"app",
    email:identities[id].email,iat:now,exp:now+300});
  return first+"."+sign("RSA-SHA256",Buffer.from(first),privateKey).toString("base64url");
}
function request(path, {id,staff,body,origin=base}={}) {
  return fetch(base+path,{method:body?"POST":"GET",headers:{
    ...(id ? {Cookie:"__Host-wpu_session="+identities[id].token} : {}),
    ...(staff ? {"cf-access-jwt-assertion":token(staff)} : {}),
    ...(body ? {Origin:origin,"Content-Type":"application/json"} : {}),
  },body:body?JSON.stringify(body):undefined});
}
async function check(promise,status) {
  const response = await promise, value = await response.json();
  assert.equal(response.status,status,JSON.stringify(value));
  assert.match(response.headers.get("cache-control") ?? "",/no-store/);
  return value;
}
const publisher={id:"reviewer",staff:"reviewer"}, operator={id:"second-admin",staff:"second-admin"};
const directory = async () => (await request("/federations")).text();
const lookup = (q="",who=publisher,expected=200) =>
  check(request(activation + "?q=" + encodeURIComponent(q),who),expected);
const change = (body,status=200,who=publisher) => check(request(activation,{...who,body}),status);

await lookup("",{},401);
await lookup("",operator,403);
await lookup("",{id:"other-reviewer",staff:"other-reviewer"},403);
await lookup("",{id:"reviewer",staff:"other-reviewer"},403);
assert.match(await (await request("/control",publisher)).text(),/<h2[^>]*>Federation activation<\/h2>/);
assert.doesNotMatch(await (await request("/control",operator)).text(),/<h2[^>]*>Federation activation<\/h2>/);
assert.equal((await lookup("bhutan")).items[0].state,"open");
assert.equal((await lookup("Other Federation")).items[0].state,"unpublished");
assert.equal((await lookup("Isolated Pilot Club")).items.length,0);
assert.equal((await request(portal)).status,404);

const reference=randomUUID();
const organisation="Activation Test Federation";
await check(request("/api/inquiries",{body:{
  form_type:"organisation",reference,organisation,organisationType:"national_federation",country:"NZ",
  contactName:"Isolated applicant",email:"activation-applicant@example.org",role:"Chair",
  website:"",message:"Request to participate.",consent:"yes",
}}),201);
assert.equal((await lookup(organisation)).items.length,0);
await check(request(intake,{...publisher,body:{reference,version:0,decision:"approve_new",reason:"Approved participation for testing."}}),200);
const reviewed = (await check(request(intake+"?reference="+reference,publisher),200)).cases[0];
const [candidate] = (await lookup(organisation)).items;
assert.equal(candidate.id,reviewed.review.organisationId);
assert.equal(candidate.verified,false);
assert.equal(candidate.hasOperator,false);
assert.equal(candidate.hasReviewer,false);
assert.equal(candidate.state,"unpublished");
const publish={action:"open",organisationId:candidate.id,revision:0,reason:"Operational federation and staff verified.",
  slug:"activation-test",operatorEmail:"second-admin@example.org",confirmed:true};
await change({...publish,confirmed:false},400);
await change(publish,403,{...publisher,origin:"https://example.org"});
await change(publish,403,operator);
await change({...publish,operatorEmail:"unverified@example.org"},409);
await change({...publish,slug:"bhutan"},409);
await change({...publish,slug:"activation-test",organisationId:"isolated-club"},409);
assert.equal((await request(portal)).status,404);
const publication=await change(publish);
assert.equal(publication.state,"open");
assert.ok(publication.revision>0);
await change(publish,409);
assert.match(await directory(),/Activation Test Federation/);
assert.match(await (await request(portal)).text(),/One Passport, one Player ID/);
assert.match(await (await request("/join?federation=activation-test&mode=login")).text(),/<h2>Sign in<\/h2>/);
await check(request(roster,operator),200);
await check(request(roster,{id:"pilot-operator",staff:"pilot-operator"}),403);
const open = (await lookup(organisation)).items[0];
assert.equal(open.verified,true);
assert.equal(open.hasOperator,true);
assert.equal(open.hasReviewer,true);
assert.equal(open.lastAction.actor,"Isolated reviewer");
assert.equal(open.lastAction.reason,publish.reason);

const own={action:"request",organisationId:candidate.id};
const requested=await check(request(playerRequests,{id:"player",body:own}),201);
const paused=await change({action:"paused",organisationId:candidate.id,revision:publication.revision,reason:"Pause new requests for support."});
assert.equal(paused.state,"paused");
assert.doesNotMatch(await directory(),/Activation Test Federation/);
assert.equal((await request(portal)).status,200);
assert.doesNotMatch(await (await request(portal,{id:"outsider"})).text(),/>Request affiliation<\/button>/);
assert.ok(!(await check(request(playerRequests,{id:"outsider"}),200)).options.some(x=>x.id===candidate.id));
await check(request(playerRequests,{id:"outsider",body:own}),409);
await check(request(roster,operator),200);
assert.ok((await check(request(playerRequests,{id:"player"}),200)).requests.some(x=>x.id===requested.id && x.state==="awaiting_review"));
await check(request("/api/control/affiliations",{...publisher,body:{
  id:requested.id, action:"approve",reason:"Pending work can finish during a pause.",
}}),200);
assert.equal((await check(request(roster,operator),200)).players[0].playerId,identities.player.code);
const passport = (await check(request("/api/passport",{id:"player"}),200)).passport;
assert.equal(passport.playerCode,identities.player.code);
assert.ok(passport.affiliations.some(x=>x.organisationId===candidate.id && x.status==="active"));
const resume = { action:"open",organisationId:candidate.id,revision:paused.revision,reason:"Ready to receive requests.",confirmed:true };
await change({...resume,slug:"different-url"},409);
await change({...resume,revision:publication.revision},409);
assert.equal((await change(resume)).slug,"activation-test");
assert.match(await directory(),/Activation Test Federation/);
await check(request(playerRequests,{id:"outsider",body:own}),201);
assert.match(await directory(),/Bhutan Pickleball Federation/);
console.log("Federation activation passed: intake, scoped publication, review, pause/resume, existing links, and stable Player IDs.");
