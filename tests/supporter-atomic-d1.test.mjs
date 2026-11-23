import test from "node:test";
import assert from "node:assert/strict";
import {batchD1} from "../src/lib/supporters-db.ts";

const contextKey=Symbol.for("__cloudflare-context__");
const original=globalThis[contextKey];
function restore(){if(original===undefined)delete globalThis[contextKey];else globalThis[contextKey]=original;}

test("pledge and audit are prepared together and submitted in one D1 batch",async()=>{
 const statements=[];
 const batches=[];
 globalThis[contextKey]={env:{WPU_DB:{
   prepare(sql){return {bind(...params){const statement={sql,params};statements.push(statement);return statement;}};},
   async batch(prepared){batches.push(prepared);return [];}
 }}};
 try{
  await batchD1([{sql:"INSERT INTO supporter_pledges VALUES (?)",params:["pledge-1"]},{sql:"INSERT INTO supporter_audit VALUES (?)",params:["audit-1"]}]);
  assert.equal(batches.length,1);
  assert.deepEqual(batches[0],statements);
  assert.equal(statements.length,2);
 }finally{restore();}
});

test("batch failure is propagated instead of returning a false success",async()=>{
 globalThis[contextKey]={env:{WPU_DB:{
   prepare(sql){return {bind(...params){return {sql,params};}};},
   async batch(){throw new Error("audit insert failed");}
 }}};
 try{
  await assert.rejects(()=>batchD1([{sql:"pledge",params:[]},{sql:"audit",params:[]}]),/audit insert failed/);
 }finally{restore();}
});

test("missing batch capability fails closed",async()=>{
 globalThis[contextKey]={env:{WPU_DB:{prepare(){return {bind(){return {all:async()=>({results:[]})};}};}}}};
 try{
  await assert.rejects(()=>batchD1([{sql:"pledge",params:[]}]),/WPU_DB_BATCH_UNAVAILABLE/);
 }finally{restore();}
});
