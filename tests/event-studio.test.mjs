import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import { emptyDraft, parseDraft, publishIssues, publicProgramme, displayDate, eventSlug } from "../src/lib/events/model.ts";
import { canReviewSanctions, decideSanction, organiserSanctions, sanctionQueue, sanctionReviewReady, submitSanctions } from "../src/lib/events/sanction-service.ts";
import { readEvidence } from "../src/lib/events/sanction.ts";
import { describeEntry, newDivision, nextDivisionName, MAX_DIVISIONS } from "../src/lib/events/competition.ts";
import { changeEvent, createEvent, eventStudioReady, getEvent, getPublicEvent, listEvents, listOrganisations } from "../src/lib/events/service.ts";

const schema=filename=>readFileSync(new URL("../database/"+filename,import.meta.url),"utf8");
const activity=(time,title="Beginner clinic")=>({id:crypto.randomUUID(),kind:"clinic",title,time,location:"Court 1",description:"A coached warm-up."});
const rally=(time="08:30")=>({title:"Rally Day",date:"2027-04-17",timezone:"Asia/Singapore",venue:"Eastside Courts",description:"A community event.",activities:[activity(time),activity("","Internal planning") ]});
const binding=Symbol.for("__cloudflare-context__");
function fixture() {
 const db=new DatabaseSync(":memory:");
 db.exec(schema("wpu-identity-foundation-v1.sql"));
 db.exec(schema("wpu-passwordless-auth-v1.sql"));
 globalThis[binding]={env:{WPU_DB:{prepare:query=>({bind:(...parameters)=>({all:async()=>({results:db.prepare(query).all(...parameters)})})})}}};
 db.exec(`
 INSERT INTO wpu_organisations(id,name,status) VALUES('a','Federation A','verified'),('b','Federation B','verified'),('c','Federation C','pending');
 INSERT INTO wpu_persons(id,display_name) VALUES('p1','One'),('p2','Two'),('p3','Three'),('p4','Four');
 INSERT INTO wpu_accounts(id,person_id,auth_subject) VALUES('one','p1','one'),('two','p2','two'),('three','p3','three'),('four','p4','four');
 INSERT INTO wpu_auth_emails(email_normalized,account_id,verified_at) VALUES('one@example.com','one','2027-01-01'),('two@example.com','two','2027-01-01'),('three@example.com','three','2027-01-01'),('four@example.com','four',NULL);
 INSERT INTO wpu_role_assignments(id,account_id,role,scope_type,scope_id) VALUES('org-a','one','organiser','organisation','a'),('org-b','two','organiser','organisation','b'),
  ('ordinary','three','organisation_admin','organisation','a'),('unverified','four','organiser','organisation','a'),('unapproved','one','organiser','organisation','c');
 `);
 return db;
}

test("the draft parser rejects malformed dates, zones, times and unsupported activities",()=>{
 assert.equal(parseDraft({...rally(),date:"2027-02-30"}),null);
 assert.equal(parseDraft({...rally(),timezone:"Mars/Crater"}),null);
 assert.equal(parseDraft({...rally(),activities:[activity("09:99")]}),null);
 assert.equal(parseDraft({...rally(),activities:[{...activity("08:00"),kind:"constructor"}]}),null);
 const duplicate=activity("08:00");
 assert.equal(parseDraft({...rally(),activities:[duplicate,duplicate]}),null);
 assert.equal(publishIssues(emptyDraft()).length,4);
 assert.match(eventSlug("测试",crypto.randomUUID()),/^event-/);
});

test("verified scoped organiser drafts stay private, publish atomically and remain isolated", async t=>{
 const db=fixture();t.after(()=>{db.close();delete globalThis[binding];});
 assert.equal(await eventStudioReady(),false);
 db.exec(schema("wpu-event-studio-v1.sql"));
 assert.equal(await eventStudioReady(),true);
 assert.deepEqual(await listOrganisations("one"),[{id:"a",name:"Federation A"}]);
 assert.deepEqual(await listOrganisations("three"),[]);
 assert.deepEqual(await listOrganisations("four"),[]);
 assert.equal(await createEvent("one","b",rally()),null);
 assert.equal(await createEvent("one","c",rally()),null);
 const event=await createEvent("one","a",rally());
 assert.equal(event.revision,1);
 assert.equal(await getPublicEvent(event.slug),null);
 assert.equal(await getEvent("two",event.id),null);
 assert.deepEqual(await listEvents("two"),[]);
 assert.equal((await changeEvent("two",event.id,1,"publish")).status,"missing");
 assert.equal((await changeEvent("one",event.id,1,"publish")).status,"ok");
 const first=await getPublicEvent(event.slug);
 assert.equal(first.organiser,"Federation A");
 assert.equal(first.programme.activities[0].time,"08:30");
 assert.equal(first.programme.activities.length,1);
 assert.ok(!JSON.stringify(first).includes("Internal planning"));
 assert.equal((await changeEvent("one",event.id,1,"save",rally("08:00"))).status,"ok");
 assert.equal((await changeEvent("one",event.id,1,"publish")).status,"stale");
 assert.equal((await getPublicEvent(event.slug)).programme.activities[0].time,"08:30");
 assert.equal((await changeEvent("one",event.id,2,"publish")).status,"ok");
 assert.equal((await getPublicEvent(event.slug)).programme.activities[0].time,"08:00");
 assert.equal((await changeEvent("one",event.id,2,"unpublish")).status,"ok");
 assert.equal(await getPublicEvent(event.slug),null);
 assert.equal((await getEvent("one",event.id)).draft.activities[0].time,"08:00");
 assert.deepEqual(db.prepare("SELECT action FROM wpu_studio_event_audit ORDER BY sequence").all().map(x=>x.action),
  ["created","published","draft_saved","published","unpublished"]);
 db.exec("UPDATE wpu_role_assignments SET revoked_at='2027-01-01' WHERE id='org-a'");
 assert.equal(await getEvent("one",event.id),null);
 assert.equal((await changeEvent("one",event.id,2,"save",rally())).status,"missing");
 assert.deepEqual(await listEvents("one"),[]);
});

test("each preset sets an open entry, an editable format and capacity in the right units",()=>{
 const d1=newDivision("singles",crypto.randomUUID(),[]);
 const d2=newDivision("doubles",crypto.randomUUID(),[]);
 const d3=newDivision("mixed",crypto.randomUUID(),[]);
 const d4=newDivision("team",crypto.randomUUID(),[]);
 assert.deepEqual([d1,d2,d3,d4].map(d=>d.entry.mode),["open","open","open","open"]);
 assert.deepEqual([d1,d2,d3,d4].map(d=>d.capacity),[16,16,16,8]);
 assert.equal(d1.format,"double-elimination");
 assert.equal(d4.format,"round-robin");
 assert.equal(nextDivisionName("Open singles",[d1]),"Open singles 2");
 assert.equal(describeEntry(d1,displayDate),"No WPU ranking required.");
 assert.equal(parseDraft(rally()).divisions.length,0);
 assert.equal(publishIssues(parseDraft({...rally(),activities:[],divisions:[d1,d2,d3,d4]})).length,0);
});

test("division rules reject skill-rating fields and incompatible ranking tracks",()=>{
 const division=newDivision("mixed",crypto.randomUUID(),[]);
 const ranked={...division,entry:{mode:"ranking",track:"mixed-doubles",minimum:800,cutoffDate:"2027-04-10"}};
 const data={...rally(),activities:[],divisions:[ranked]};
 assert.match(describeEntry(ranked,displayDate),/^Both partners independently need 800 WPU Mixed Doubles points/);
 assert.doesNotMatch(describeEntry(ranked,displayDate),/DUPR/);
 assert.equal(parseDraft({...data,divisions:[{...ranked,skillRating:4}]}),null);
 assert.equal(parseDraft({...data,divisions:[{...ranked,entry:{...ranked.entry,duprMaximum:3}}]}),null);
 assert.equal(parseDraft({...data,divisions:[{...ranked,entry:{...ranked.entry,track:"mens-doubles"}}]}),null);
 assert.equal(parseDraft({...data,divisions:[{...ranked,entry:{...ranked.entry,cutoffDate:"2027-02-30"}}]}),null);
 assert.equal(parseDraft({...data,divisions:[ranked,ranked]}),null);
 assert.equal(parseDraft({...data,divisions:Array.from({length:MAX_DIVISIONS+1},()=>({...ranked,id:crypto.randomUUID()}))}),null);
 const team={...newDivision("team",crypto.randomUUID(),[]),entry:{mode:"ranking",track:"team",minimum:10,cutoffDate:"2027-04-10"}};
 assert.match(describeEntry(team,displayDate),/^Each team needs 10 WPU team ranking points/);
 assert.match(publishIssues(parseDraft({...data,divisions:[{...ranked,entry:{...ranked.entry,minimum:null}}]})).join(" "),/minimum number/);
 assert.match(publishIssues(parseDraft({...data,divisions:[{...ranked,entry:{...ranked.entry,cutoffDate:"2027-04-20"}}]})).join(" "),/on or before/);
 assert.match(publishIssues(parseDraft({...data,divisions:[{...ranked,capacity:1}]})).join(" "),/capacity/);
 assert.match(publishIssues(parseDraft({...data,divisions:[ranked,{...ranked,id:crypto.randomUUID()}]})).join(" "),/distinct name/);
 assert.deepEqual(Object.keys(publicProgramme(parseDraft(data)).divisions[0]),["id","kind","name","format","capacity","entry"]);
});

test("a competition can publish without a programme, but never leaks edits or auto-opens entries",async t=>{
 const db=fixture();t.after(()=>{db.close();delete globalThis[binding];});
 db.exec(schema("wpu-event-studio-v1.sql"));
 const division=newDivision("singles",crypto.randomUUID(),[]);
 const plan={...rally(),activities:[activity("","Private scratchpad")],divisions:[division]};
 const event=await createEvent("one","a",plan);
 assert.equal(await getPublicEvent(event.slug),null);
 assert.equal((await changeEvent("two",event.id,1,"publish")).status,"missing");
 assert.equal((await changeEvent("one",event.id,1,"publish")).status,"ok");
 const first=await getPublicEvent(event.slug);
 assert.equal(first.programme.activities.length,0);
 assert.equal(first.programme.divisions[0].name,"Open singles");
 assert.ok(!JSON.stringify(first).includes("Private scratchpad"));
 assert.ok(!JSON.stringify(first).includes("sanction"));
 const incomplete={...division,entry:{mode:"ranking",track:null,minimum:null,cutoffDate:""}};
 assert.equal((await changeEvent("one",event.id,1,"save",{...plan,divisions:[incomplete]})).status,"ok");
 assert.equal((await changeEvent("one",event.id,2,"publish")).status,"invalid");
 assert.deepEqual(await getPublicEvent(event.slug),first);
 assert.equal((await changeEvent("one",event.id,2,"unpublish")).status,"ok");
 assert.equal(await getPublicEvent(event.slug),null);
});

const evidence={field:"Expected competitive field",officiating:"Named head referee and court officials",verification:"Director reviews signed score sheets"};
const central={account:"three",email:"three@example.com"};
const scoped={account:"two",email:"two@example.com"};
function sanctionFixture(t) {
 const db=fixture();t.after(()=>{db.close();delete globalThis[binding];});
 db.exec(schema("wpu-event-studio-v1.sql"));
 db.exec(schema("wpu-organisation-intake-v1.sql"));
 db.exec(schema("wpu-control-affiliations-v1.sql"));
 db.exec(schema("wpu-federation-activation-v1.sql"));
 db.exec(schema("wpu-event-sanction-v1.sql"));
 db.exec(`INSERT INTO wpu_organisation_intake_reviewers(account_id) VALUES('three'),('two');
  INSERT INTO wpu_federation_publishers(account_id) VALUES('three');`);
 return db;
}
function competitionPlan() {
 const singles=newDivision("singles",crypto.randomUUID(),[]);
 const mixed=newDivision("mixed",crypto.randomUUID(),[]);
 const ranked={...mixed,name:"International Mixed",entry:{mode:"ranking",track:"mixed-doubles",minimum:800,cutoffDate:"2027-04-03"}};
 return { ...rally(),venue:'Élite "Court" 🏓',activities:[],divisions:[singles,ranked] };
}

test("a complete Local Open division gets T5 only on publication, including without a review migration",async t=>{
 const db=fixture();t.after(()=>{db.close();delete globalThis[binding];});
 db.exec(schema("wpu-event-studio-v1.sql"));
 const plan=competitionPlan(), [open,ranked]=plan.divisions;
 const event=await createEvent("one","a",plan);
 assert.equal(await sanctionReviewReady(),false);
 assert.equal(await getPublicEvent(event.slug),null);
 assert.deepEqual((await organiserSanctions("one",event)).preview,{[open.id]:"T5"});
 assert.equal((await changeEvent("one",event.id,1,"publish")).status,"ok");
 assert.deepEqual((await getPublicEvent(event.slug)).tiers,{[open.id]:"T5"});
 const stored=JSON.parse(db.prepare("SELECT published_json FROM wpu_studio_events").get().published_json);
 assert.equal(stored.sanctionPolicy,1);
 assert.equal(stored.programme.divisions[1].id,ranked.id);
 // A pre-release publication remains a public programme without editorial backfilling.
 delete stored.sanctionPolicy;
 db.prepare("UPDATE wpu_studio_events SET published_json=? WHERE id=?").run(JSON.stringify(stored),event.id);
 assert.deepEqual((await getPublicEvent(event.slug)).tiers,{});
});

test("higher tier requests and review are scoped, atomic, and limited to the reviewed division",async t=>{
 const db=sanctionFixture(t);
 const plan=competitionPlan(), [open,ranked]=plan.divisions;
 const event=await createEvent("one","a",plan);
 assert.equal(await canReviewSanctions(scoped),false);
 assert.equal(await canReviewSanctions({...central,email:scoped.email}),false);
 assert.equal(await canReviewSanctions(central),true);
 assert.equal(readEvidence({...evidence,field:" "}),null);
 assert.equal(await submitSanctions("two",event,[open.id,ranked.id],"T2",evidence),"conflict");
 assert.equal(await submitSanctions("one",event,[open.id,ranked.id],"T2",evidence),"ok");
 assert.equal(await submitSanctions("one",event,[open.id,ranked.id],"T2",evidence),"conflict");
 assert.equal((await organiserSanctions("two",event)).requests.length,0);
 assert.equal((await sanctionQueue(scoped,false,0)).items.length,0);
 const queue=(await sanctionQueue(central,false,0)).items;
 assert.equal(queue.length,2);
 assert.ok(queue.every(x=>x.current));
 const openRequest=queue.find(x=>x.division===open.name);
 const rankedRequest=queue.find(x=>x.division===ranked.name);
 assert.equal((await changeEvent("one",event.id,1,"publish")).status,"ok");
 assert.deepEqual((await getPublicEvent(event.slug)).tiers,{[open.id]:"T5"});
 assert.equal(await decideSanction(scoped,rankedRequest.id,"approved",""),false);
 assert.equal(await decideSanction(central,rankedRequest.id,"approved",""),true);
 assert.equal(await decideSanction(central,rankedRequest.id,"approved",""),false);
 assert.equal(await decideSanction(central,openRequest.id,"changes_requested",""),false);
 assert.equal(await decideSanction(central,openRequest.id,"changes_requested","Confirm officials"),true);
 assert.equal((await sanctionQueue(central,false,0)).items.length,0);
 assert.equal((await sanctionQueue(central,true,0)).items.length,2);
 const published=await getPublicEvent(event.slug);
 assert.deepEqual(published.tiers,{[open.id]:"T5",[ranked.id]:"T2"});
 assert.doesNotMatch(JSON.stringify(published),/Confirm officials|Named head referee|decided/);
 assert.equal((await organiserSanctions("one",event)).requests.find(x=>x.id===openRequest.id).note,"Confirm officials");
 assert.throws(()=>db.prepare("UPDATE wpu_event_sanction_requests SET requested_tier='T1' WHERE id=?").run(rankedRequest.id),/decide only once/);
 assert.throws(()=>db.prepare("DELETE FROM wpu_event_sanction_requests WHERE id=?").run(rankedRequest.id),/retain competition/);
});

test("edits don’t alter live tiers, and a higher tier never carries to different division settings",async t=>{
 sanctionFixture(t);
 const plan=competitionPlan(), [open,ranked]=plan.divisions;
 const event=await createEvent("one","a",plan);
 assert.equal(await submitSanctions("one",event,[open.id,ranked.id],"T3",evidence),"ok");
 const queue=(await sanctionQueue(central,false,0)).items;
 const pending=queue.find(x=>x.division===open.name);
 const approved=queue.find(x=>x.division===ranked.name);
 // Unrelated programme and description changes do not require a new decision.
 const description={...plan,description:"Revised promoter copy",activities:[activity("09:00")]};
 const saved=await changeEvent("one",event.id,1,"save",description);
 assert.equal(saved.status,"ok");
 assert.equal(await submitSanctions("one",event,[open.id],"T4",evidence),"conflict");
 assert.equal(await decideSanction(central,approved.id,"approved",""),true);
 assert.equal((await changeEvent("one",event.id,2,"publish")).status,"ok");
 assert.equal((await getPublicEvent(event.slug)).tiers[ranked.id],"T3");
 const changed={...description,venue:"Different venue",divisions:[{...open,capacity:32},ranked]};
 const current=await changeEvent("one",event.id,2,"save",changed);
 assert.equal(current.status,"ok");
 assert.equal((await getPublicEvent(event.slug)).tiers[ranked.id],"T3");
 assert.equal((await sanctionQueue(central,false,0)).items[0].current,false);
 assert.equal(await decideSanction(central,pending.id,"approved",""),false);
 assert.equal(await decideSanction(central,pending.id,"changes_requested","Resubmit the new plan"),true);
 assert.equal((await changeEvent("one",event.id,3,"publish")).status,"ok");
 assert.deepEqual((await getPublicEvent(event.slug)).tiers,{[open.id]:"T5"});
 assert.equal(await submitSanctions("one",current.event,[ranked.id],"T3",evidence),"ok");
});
