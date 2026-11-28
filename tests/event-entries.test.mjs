import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createHmac } from "node:crypto";
import { DatabaseSync } from "node:sqlite";
import { test } from "node:test";
import { newDivision } from "../src/lib/events/competition.ts";
import { changeEvent,createEvent } from "../src/lib/events/service.ts";
import { acceptEntry,claimOffer,entriesReady,entryFor,entryPlayer,invitation,openRegistration,organiserEntryList,
  organiserRegistrations,playerEntries,publicRegistration,registrationFor,resetUnusedRegistration,saveBirthDate,setRegistrationPaused,startEntry,withdrawEntry } from "../src/lib/entries/service.ts";
import { checkoutConfig,processWebhook,settleCheckout,startCheckout,verifiedWebhook } from "../src/lib/entries/checkout.ts";
import { entryReturnPath,parseRegistrationInput,toMinorUnits,validBirthDate } from "../src/lib/entries/model.ts";

const binding=Symbol.for("__cloudflare-context__");
const current=()=>Math.floor(Date.now()/1000);
const payload=(amount=0)=>({closesAt:current()+86400,amount,currency:"SGD",terms:"Contact the organiser before the draw.",contact:"events@example.com"});
const cfg={secret:"sk_test_not_a_secret",signing:"whsec_demo",host:"wpu",live:false,origin:"https://wpu-checkout.example"};
function fixture(t){
  const db=new DatabaseSync(":memory:");
  for(const schema of ["identity-foundation","passwordless-auth","passwordless-auth-v2","passwordless-auth-v3","event-studio","event-sanction","event-entries"]){
    const name=schema.includes("-v")?schema:schema+"-v1";
    db.exec(readFileSync(new URL("../database/wpu-"+name+".sql",import.meta.url),"utf8"));
  }
  globalThis[binding]={env:{WPU_DB:{prepare:q=>({bind:(...params)=>({all:async()=>({results:db.prepare(q).all(...params)})})})}}};
  t.after(()=>{db.close();delete globalThis[binding];});
  db.exec("INSERT INTO wpu_organisations(id,name,status) VALUES('wpu','WPU','verified'),('other','Other','verified')");
  for(let i=1;i<=9;i++){
    db.prepare("INSERT INTO wpu_persons(id,display_name,birth_date,gender) VALUES(?,?,?,?)")
      .run("p"+i,"Player "+i,i===9?null:"1990-05-10",i%2===1?"female":"male");
    db.prepare("INSERT INTO wpu_accounts(id,person_id,auth_subject) VALUES(?,?,?)").run("a"+i,"p"+i,"a"+i);
    db.prepare("INSERT INTO wpu_player_profiles(person_id,public_player_code) VALUES(?,?)").run("p"+i,"WPU-P"+i);
    db.prepare("INSERT INTO wpu_auth_emails(email_normalized,account_id,verified_at) VALUES(?,?,?)").run("p"+i+"@example.com","a"+i,"2026-01-01");
  }
  db.exec("INSERT INTO wpu_role_assignments(id,account_id,role,scope_type,scope_id) VALUES('org','a1','organiser','organisation','wpu'),('outside','a8','organiser','organisation','other')");
  return db;
}
async function create(division,amount=0){
  const draft={title:"WPU Test Tournament",date:new Date(Date.now()+8*86400000).toISOString().slice(0,10),timezone:"Asia/Singapore",
    venue:"Test courts",description:"",activities:[],divisions:[{...division,capacity:2}]};
  const event=await createEvent("a1","wpu",draft);
  assert.equal((await changeEvent("a1",event.id,event.revision,"publish")).status,"ok");
  assert.equal(await openRegistration("a1",event.id,division.id,payload(amount),amount?cfg.host:null),"ok");
  const context=await registrationFor(event.slug,division.id);
  return {draft,event,context};
}
const player=i=>entryPlayer("a"+i);

test("entry routing, minor units and DOB are narrowly validated",()=>{
 const id=crypto.randomUUID(),code="a".repeat(48);
 assert.equal(toMinorUnits("80.10"),8010);
 assert.equal(toMinorUnits("0.005"),null);
 assert.equal(parseRegistrationInput(payload(49)),null);
 assert.equal(parseRegistrationInput(payload(500)).amount,500);
 assert.equal(entryReturnPath("test-draw",id,code),"/events/test-draw/enter/"+id+"?invite="+code);
 assert.equal(entryReturnPath("//example.com",id,undefined),null);
 assert.equal(validBirthDate("2026-02-30"),false);
 assert.equal(validBirthDate("2025-01-01",Date.parse("2026-03-01")),true);
});

test("free singles can fill, waitlist and offer the next place without duplicating a player",async t=>{
 fixture(t);
 assert.equal(await entriesReady(),true);
 const div=newDivision("singles",crypto.randomUUID(),[]);
 const {event,context}=await create(div);
 const p1=await player(1),p2=await player(2),p3=await player(3),p4=await player(4);
 assert.equal(await startEntry(context,p1),"ok");
 assert.equal(await startEntry(context,p1),"unavailable");
 await Promise.all([p2,p3,p4].map(p=>startEntry(context,p)));
 const p2Entry=await entryFor(context,p2.id), p3Entry=await entryFor(context,p3.id),p4Entry=await entryFor(context,p4.id);
 const entries=[p2Entry,p3Entry,p4Entry];
 assert.equal(entries.filter(x=>x.status==="confirmed").length,1);
 assert.equal(entries.filter(x=>x.status==="waitlisted").length,2);
 const organiser=await organiserRegistrations("a1",event.id);
 assert.equal(organiser[0].counts.confirmed,2);
 assert.deepEqual(await organiserRegistrations("a8",event.id),[]);
 assert.equal((await organiserEntryList("a1",event.id,div.id,0)).items.length,4);
 assert.deepEqual((await organiserEntryList("a8",event.id,div.id,0)).items,[]);
 const e1=await entryFor(context,p1.id);
 assert.equal(await withdrawEntry(context,p4.id,e1.id),false);
 assert.equal(await withdrawEntry(context,p1.id,e1.id),true);
 const offered=(await Promise.all([p2,p3,p4].map(p=>entryFor(context,p.id)))).find(e=>e.status==="offered");
 assert.ok(offered);
 const e=entries.findIndex(e=>e.id===offered.id);
 assert.equal(await claimOffer(context,[p2,p3,p4][e].id,offered.id),true);
 assert.equal((await entryFor(context,[p2,p3,p4][e].id)).status,"confirmed");
 assert.equal(await setRegistrationPaused("a1",event.id,div.id,true),true);
 assert.equal((await publicRegistration(event.slug))[0].accepting,false);
 assert.equal(await startEntry(context,await player(5)),"unavailable");
 assert.equal(await setRegistrationPaused("a8",event.id,div.id,false),false);
 assert.equal(await setRegistrationPaused("a1",event.id,div.id,false),true);
 assert.equal((await playerEntries(p1.id))[0].status,"withdrawn");
});

test("a doubles partner must consent, satisfy the category, and cannot appear on two entries",async t=>{
 const db=fixture(t);
 const div=newDivision("mixed",crypto.randomUUID(),[]);
 const {context}=await create(div);
 const p1=await player(1),p2=await player(2),p3=await player(3),p4=await player(4);
 assert.equal(await startEntry(context,p1),"ok");
 const e=await entryFor(context,p1.id);
 assert.equal(e.status,"invited");
 assert.equal(e.seatHeld,true);
 assert.equal(e.canPay,false);
 assert.equal(await invitation(context,e.invite),p1.name);
 assert.equal(await acceptEntry(context,p3,e.invite),"ineligible");
 assert.equal(await acceptEntry(context,p1,e.invite),"unavailable");
 assert.equal(await acceptEntry(context,p2,e.invite),"ok");
 assert.equal(await acceptEntry(context,p4,e.invite),"unavailable");
 assert.equal((await entryFor(context,p1.id)).status,"confirmed");
 assert.equal((await entryFor(context,p2.id)).role,"partner");
 assert.equal(await startEntry(context,p2),"unavailable");
 assert.equal(await startEntry(context,p3),"ok");
 const hold=await entryFor(context,p3.id);
 db.prepare("UPDATE wpu_event_entries SET hold_until=? WHERE id=?").run(current()-1,hold.id);
 assert.equal(await invitation(context,hold.invite),null);
 assert.equal(await acceptEntry(context,p4,hold.invite),"unavailable");
 assert.equal((await entryFor(context,p3.id)).status,"expired");
 assert.equal(await startEntry(context,await player(9)),"ineligible");
 assert.equal(await saveBirthDate("a9","1994-02-27"),true);
 assert.equal(await startEntry(context,await player(9)),"ok");
 assert.equal(await saveBirthDate("a9","1995-03-01"),true);
 assert.equal(db.prepare("SELECT birth_date FROM wpu_persons WHERE id='p9'").get().birth_date,"1994-02-27");
});

test("opening registration locks the published division, not the entire event programme",async t=>{
 fixture(t);
 const division=newDivision("doubles",crypto.randomUUID(),[]);
 const {event,draft,context}=await create(division);
 assert.equal(await openRegistration("a8",event.id,division.id,payload(),null),"missing");
 assert.equal((await changeEvent("a1",event.id,1,"save",{...draft,description:"Updated introduction"})).status,"ok");
 assert.equal((await changeEvent("a1",event.id,2,"publish")).status,"ok");
 assert.equal((await changeEvent("a1",event.id,2,"save",{...draft,divisions:[{...division,capacity:64}]})).status,"ok");
 assert.equal((await changeEvent("a1",event.id,3,"publish")).status,"invalid");
 assert.equal((await changeEvent("a1",event.id,3,"unpublish")).status,"invalid");
 assert.equal(await startEntry(context,await player(1)),"ok");
 assert.equal(await setRegistrationPaused("a1",event.id,division.id,true),true);
 assert.equal((await changeEvent("a1",event.id,3,"unpublish")).status,"invalid");
});

test("either doubles player can cover the fee but only one checkout can fulfil an entry",async t=>{
 fixture(t);
 const division=newDivision("doubles",crypto.randomUUID(),[]);
 const {context,event}=await create(division,8000);
 const p1=await player(1),p2=await player(2);
 assert.equal((await openRegistration("a1",event.id,division.id,payload(9000),"other")),"payments");
 assert.equal(await startEntry(context,p1),"ok");
 const invite=await entryFor(context,p1.id);
 let touched=0,provider;
 const realFetch=globalThis.fetch;
 t.after(()=>{globalThis.fetch=realFetch;});
 globalThis.fetch=async (url,options)=>{
   if(options.method==="GET")return Response.json(provider);
   touched++;
   const body=options.body;
   assert.match(options.headers["Idempotency-Key"],/^wpu-entry-/);
   assert.equal(body.get("line_items[0][price_data][unit_amount]"),"8000");
   assert.equal(body.get("payment_intent_data[receipt_email]"),"p2@example.com");
   provider={id:"cs_test_example",status:"open",mode:"payment",livemode:false,amount_total:8000,currency:"sgd",
     url:"https://checkout.stripe.com/c/pay/example",payment_status:"unpaid",client_reference_id:invite.id,
     metadata:{wpu_entry:body.get("metadata[wpu_entry]"),wpu_attempt:body.get("metadata[wpu_attempt]")}};
   return Response.json(provider);
 };
 assert.ok((await startCheckout(cfg,context,p1.id,"a1",invite.id)).error);
 assert.equal(touched,0);
 assert.equal(await acceptEntry(context,p2,invite.invite),"ok");
 assert.equal((await entryFor(context,p2.id)).status,"ready");
 const [winner,other]=await Promise.all([startCheckout(cfg,context,p2.id,"a2",invite.id),startCheckout(cfg,context,p1.id,"a1",invite.id)]);
 assert.equal(winner.url,provider.url);
 assert.ok(other.error);
 assert.equal(touched,1);
 assert.equal((await startCheckout(cfg,context,p2.id,"a2",invite.id)).url,provider.url);
 assert.equal(touched,1);
 assert.equal(await settleCheckout(cfg,{...provider,status:"complete",payment_status:"paid",amount_total:7999,payment_intent:"pi_abcd"}),false);
 assert.equal((await entryFor(context,p1.id)).status,"paying");
 provider={...provider,status:"complete",payment_status:"paid",payment_intent:"pi_abcd"};
 const raw=JSON.stringify({type:"checkout.session.completed",data:{object:provider}});
 const ts=current();
 const sig="t="+ts+",v1="+createHmac("sha256",cfg.signing).update(ts+"."+raw).digest("hex");
 assert.equal(verifiedWebhook(raw,sig,cfg.signing,ts),true);
 assert.equal(verifiedWebhook(raw+" ",sig,cfg.signing,ts),false);
 assert.equal(verifiedWebhook(raw,sig,cfg.signing,ts+301),false);
 await processWebhook(cfg,raw);
 await processWebhook(cfg,raw);
 assert.equal((await entryFor(context,p1.id)).status,"confirmed");
 assert.equal((await entryFor(context,p2.id)).status,"confirmed");
 assert.equal(await withdrawEntry(context,p2.id,invite.id),false);
 assert.equal(checkoutConfig(),null);
});

test("unused registration may be reset without allowing rule changes through unpublish",async t=>{
 fixture(t);
 const div=newDivision("singles",crypto.randomUUID(),[]);
 const {event,draft}=await create(div);
 assert.equal(await resetUnusedRegistration("a1",event.id,div.id),false);
 assert.equal(await setRegistrationPaused("a1",event.id,div.id,true),true);
 assert.equal((await changeEvent("a1",event.id,1,"unpublish")).status,"ok");
 assert.equal((await changeEvent("a1",event.id,1,"save",{...draft,venue:"New courts"})).status,"ok");
 assert.equal((await changeEvent("a1",event.id,2,"publish")).status,"invalid");
 assert.equal(await resetUnusedRegistration("a1",event.id,div.id),true);
 assert.equal((await changeEvent("a1",event.id,2,"publish")).status,"ok");
});

test("only verified expiry releases a checkout seat to the waitlist",async t=>{
 const db=fixture(t);
 const division=newDivision("singles",crypto.randomUUID(),[]);
 const {context}=await create(division,8000);
 const ps=await Promise.all([1,2,3].map(player));
 for(const p of ps) assert.equal(await startEntry(context,p),"ok");
 const first=await entryFor(context,ps[0].id);
 assert.equal((await entryFor(context,ps[2].id)).status,"waitlisted");
 const old=globalThis.fetch;
 t.after(()=>{globalThis.fetch=old;});
 let session;
 globalThis.fetch=async(_url,options)=>{
   session={id:"cs_test_expiration",client_reference_id:first.id,mode:"payment",livemode:false,status:"open",
    amount_total:8000,currency:"sgd",payment_status:"unpaid",url:"https://checkout.stripe.com/c/pay/demo",
    metadata:{wpu_entry:first.id,wpu_attempt:options.body.get("metadata[wpu_attempt]")}};
   return Response.json(session);
 };
 assert.ok((await startCheckout(cfg,context,ps[0].id,"a1",first.id)).url);
 db.prepare("UPDATE wpu_event_entries SET checkout_started=? WHERE id=?").run(current()-86400,first.id);
 assert.equal((await entryFor(context,ps[2].id)).status,"waitlisted");
 assert.equal(await settleCheckout(cfg,{...session,status:"expired",livemode:true}),false);
 assert.equal(await settleCheckout(cfg,{...session,status:"expired"}),true);
 assert.equal((await entryFor(context,ps[2].id)).status,"offered");
 assert.equal((await entryFor(context,ps[0].id)).status,"expired");
});
