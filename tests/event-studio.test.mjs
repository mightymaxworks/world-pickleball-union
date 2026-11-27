import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import { emptyDraft, parseDraft, publishIssues, eventSlug } from "../src/lib/events/model.ts";
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
