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
const screen = async (path, who = publisher) => {
  const res = await request(path,who);
  assert.equal(res.status,200);
  const html = await res.text();
  assert.doesNotMatch(html,/<h2>Workspace unavailable<\/h2>/);
  return html;
};
const controlView = (view,fields = {}) => "/control?" + new URLSearchParams({view,...fields});
const home = await screen("/control");
assert.match(home,/<h2[^>]*>Operations overview<\/h2>/);
assert.match(home,/Organisations on record/);
assert.match(home,/Recent activity/);
assert.doesNotMatch(home,/<h2[^>]*>Federation activation<\/h2>/);
assert.doesNotMatch(await screen(controlView("activity"),operator),/Activity type/);
assert.doesNotMatch(await screen(controlView("organisations"),operator),/All organisations/);
assert.doesNotMatch(await screen(controlView("organisations"),{id:"reviewer",staff:"other-reviewer"}),/All organisations/);
const intakeOnly = {id:"intake-only",staff:"intake-only"};
assert.match(await screen("/control",intakeOnly),/Organisation participation requests/);
assert.doesNotMatch(await screen(controlView("activity"),intakeOnly),/Activity type/);
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
assert.match(await screen(controlView("requests",{filter:"new",q:"Activation Test"})),/Activation Test Federation/);
assert.doesNotMatch(await screen(controlView("requests",{filter:"new",q:"Activation Test",type:"club"})),/Activation Test Federation/);
assert.match(await screen(controlView("requests",{request:reference})),/Record review/);
await check(request(intake,{...publisher,body:{reference,version:0,decision:"approve_new",reason:"Approved participation for testing."}}),200);
const reviewed = (await check(request(intake+"?reference="+reference,publisher),200)).cases[0];
const [candidate] = (await lookup(organisation)).items;
assert.equal(candidate.id,reviewed.review.organisationId);
assert.equal(candidate.verified,false);
assert.equal(candidate.hasOperator,false);
assert.equal(candidate.hasReviewer,false);
assert.equal(candidate.state,"unpublished");
const approvedRequest = await screen(controlView("requests",{request:reference}));
assert.match(approvedRequest,/Open organisation record/);
assert.ok(approvedRequest.includes("id="+encodeURIComponent(candidate.id)));
assert.match(approvedRequest,/This decision did not change public access/);
assert.match(await screen(controlView("organisations",{source:"approved",type:"national_federation",country:"NZ"})),/Activation Test Federation/);
assert.doesNotMatch(await screen(controlView("organisations",{type:"club",q:organisation})),/class="wc-row-title"/);
const recordPath = controlView("organisations",{id:candidate.id,fromRequest:reference});
const approvedRecord = await screen(recordPath);
assert.match(approvedRecord,/<h2>Activation Test Federation<\/h2>/);
assert.match(approvedRecord,/data-state="unpublished"/);
assert.match(approvedRecord,/Publish federation/);
assert.match(approvedRecord,/Back to application/);
assert.match(await screen(recordPath,intakeOnly),/<h2>Activation Test Federation<\/h2>/);
assert.doesNotMatch(await screen(recordPath,intakeOnly),/Publish federation/);
assert.match(await screen(controlView("organisations",{id:"bhutan-isolated"}),intakeOnly),/Organisation not available/);
assert.doesNotMatch(await screen(recordPath,operator),/<h2>Activation Test Federation<\/h2>/);
const reviewHistory = await screen(controlView("activity",{kind:"review",q:organisation}));
assert.match(reviewHistory,/Approved and created organisation/);
assert.ok(reviewHistory.includes("id="+encodeURIComponent(candidate.id)));
assert.doesNotMatch(reviewHistory,/activation-applicant@example.org/);
assert.match(await screen("/control"),/Approved and created organisation/);
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
assert.match(await screen(recordPath),/data-state="open"/);
assert.match(await screen(recordPath),/Pause new requests/);
assert.match(await screen(controlView("activity",{kind:"portal",q:organisation})),/Opened federation portal/);
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
assert.match(await screen(recordPath),/data-state="paused"/);
assert.match(await screen(controlView("organisations",{portal:"paused",q:organisation})),/class="wc-row-title"/);
assert.match(await screen(controlView("activity",{kind:"portal",q:organisation})),/Paused new affiliation requests/);
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
assert.match(await screen(controlView("activity",{kind:"portal",q:organisation})),/Resumed affiliation requests/);
assert.match(await directory(),/Activation Test Federation/);
await check(request(playerRequests,{id:"outsider",body:own}),201);
assert.match(await directory(),/Bhutan Pickleball Federation/);
console.log("Federation activation passed: intake, scoped publication, review, pause/resume, existing links, and stable Player IDs.");
