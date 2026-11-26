// Isolated WPU Worker, disposable data. No production forms or credentials.
import assert from "node:assert/strict";
import { randomUUID, sign } from "node:crypto";
import { readFileSync } from "node:fs";
const base = process.env.TEST_BASE_URL ?? "http://localhost:8787";
assert.ok(["localhost","127.0.0.1"].includes(new URL(base).hostname));
const { issuer, audience, identities, privateKey } = JSON.parse(readFileSync(process.argv[2], "utf8"));
const intake = "/api/control/organisation-intake";
const publicRequest = "/api/inquiries";
function jwt(id) {
  const time = Math.floor(Date.now()/1000);
  const encode = value => Buffer.from(JSON.stringify(value)).toString("base64url");
  const value = encode({ alg:"RS256",kid:"isolated-key" }) + "." + encode({iss:issuer,aud:[audience],type:"app",
    email:identities[id].email,iat:time,exp:time+300});
  return value+"."+sign("RSA-SHA256",Buffer.from(value),privateKey).toString("base64url");
}
function request(path,{ id, staff, body, origin = base } = {}) {
  return fetch(base+path,{method:body ? "POST" : "GET",headers:{
    ...(id ? { Cookie:"__Host-wpu_session="+identities[id].token } : {}),
    ...(staff ? { "cf-access-jwt-assertion":jwt(staff) } : {}),
    ...(body ? { Origin:origin,"Content-Type":"application/json" } : {}),
  },body:body ? JSON.stringify(body) : undefined, redirect:"manual"});
}
async function check(promise,status) {
  const response = await promise;
  const data = await response.json();
  assert.equal(response.status,status,JSON.stringify(data));
  assert.match(response.headers.get("cache-control") ?? "",/no-store/);
  return data;
}
const reviewer = {id:"reviewer",staff:"reviewer"};
const review = (body,status=200,who=reviewer) => check(request(intake,{...who,body}),status);
const get = (query="",status=200,who=reviewer) => check(request(intake+query,who),status);
const apply = (body,status=201) => check(request(publicRequest,{body}),status);
const form = {form_type:"organisation",reference:randomUUID(),organisation:"Isolated intake club",organisationType:"club",
  country:"BT",contactName:"Isolated contact",email:"intake@example.org",role:"Secretary",
  website:"https://example.org/",message:"Request to participate",consent:"yes"};
const home = await (await request("/")).text();
assert.match(home,/href="\/get-involved"[^>]*>Join WPU/);
assert.match(home,/href="\/join\?mode=login"[^>]*>Sign in/);
const hub = await (await request("/get-involved")).text();
assert.match(hub,/href="\/join"[^>]*>Create a Player Passport/);
assert.match(hub,/href="\/members"[^>]*>Federations/);
assert.match(await (await request("/members#register")).text(),/id="register".*Introduce your organisation/s);
assert.match(await (await request("/join?mode=login")).text(),/<h2>Sign in<\/h2>/);
assert.equal((await request("/federations")).headers.get("location"),"/members");
assert.match(await (await request("/control",reviewer)).text(),/Organisation participation requests/);
assert.doesNotMatch(await (await request("/control",{id:"pilot-operator",staff:"pilot-operator"})).text(),/Organisation participation requests/);
await get("",401,{});
await get("",403,{id:"reviewer",staff:"other-reviewer"});
await get("",403,{id:"second-reviewer",staff:"second-reviewer"});
await get("",403,{id:"pilot-operator",staff:"pilot-operator"});
const legacy = (await get()).cases.find(x => x.email === "legacy@example.org");
assert.equal(legacy.type,null);
assert.equal((await request(publicRequest,{body:form,origin:"https://example.org"})).status,403);
assert.equal((await request(publicRequest,{body:{...form,website:"javascript:void(0)"}})).status,400);
assert.equal((await request(publicRequest,{body:{...form,organisationType:"unknown"}})).status,400);
assert.equal((await request(publicRequest,{body:{...form,consent:""}})).status,400);
assert.deepEqual(await apply(form),{reference:form.reference});
assert.deepEqual(await apply({...form,message:"Must not overwrite the original"}),{reference:form.reference});
const entry = (await get("?reference="+form.reference)).cases[0];
assert.equal(entry.message,"Request to participate");
assert.equal(entry.type,"club");
assert.equal(entry.version,0);
const follow = {reference:form.reference,version:0,decision:"follow_up",reason:"Confirm the location of the club."};
await review(follow,403,{...reviewer,origin:"https://example.org"});
await review(follow);
await review(follow,409);
const followed = (await get("?reference="+form.reference)).cases[0];
assert.equal(followed.review.name,"Isolated reviewer");
assert.equal(followed.review.reason,follow.reason);
assert.equal(followed.review.organisationId,null);
await review({...follow,version:followed.version,decision:"approve_existing",existingId:"second-federation"},409);
await review({...follow,version:followed.version,decision:"approve_new",reason:"Verified pilot participation proposal."});
const approved = (await get("?reference="+form.reference)).cases[0];
assert.match(approved.review.organisationId,/^intake:/);
assert.equal(approved.review.decision,"approve_new");
assert.ok((await get("?filter=completed")).cases.some(item => item.reference === form.reference));
assert.ok(!(await get()).cases.some(item => item.reference === form.reference));
await review({...follow,version:approved.version,decision:"close"},409);
const duplicate = {...form,reference:randomUUID(),organisation:"isolated INTake club"};
await apply(duplicate);
await review({...follow,reference:duplicate.reference,decision:"approve_new"},409);
const candidates = (await get("?reference="+duplicate.reference+"&findOrganisation=intake")).matches;
assert.equal(candidates.length,1);
assert.equal(candidates[0].id,approved.review.organisationId);
assert.equal(candidates[0].status,"pending");
await review({...follow,reference:duplicate.reference,decision:"approve_existing",existingId:candidates[0].id});
assert.equal((await get("?reference="+duplicate.reference)).cases[0].review.organisationId,approved.review.organisationId);
const comp = await request(publicRequest,{body:{ form_type:"competition",organisation:"Isolated host",country:"Bhutan",
  name:"Isolated host contact",email:"isolate-host@example.org",consent:"yes",interest:"hosting" }});
assert.equal(comp.status,201);
assert.ok(!(await get()).cases.some(item => item.email === "isolate-host@example.org"));
console.log("Public join and protected organisation intake passed with receipts, legacy continuity, role isolation and pending organisation linking.");
