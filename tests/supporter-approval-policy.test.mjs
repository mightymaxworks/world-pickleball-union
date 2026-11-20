import test from "node:test";
import assert from "node:assert/strict";
import {assessPledge} from "../src/lib/supporter-approval-policy.ts";

const base={
 name:"Community Pickleball Club",
 category:"Clubs & Communities",
 website:"https://club.example.org",
 email:"contact@club.example.org",
 duplicateCount:0,
 emailVerified:true,
 domainVerified:true,
 abusePassed:true
};
test("verified routine club qualifies for automatic approval",()=>{
 assert.equal(assessPledge(base).decision,"approve");
});
test("unverified club remains pending",()=>{
 assert.equal(assessPledge({...base,emailVerified:false}).decision,"pending_verification");
});
test("national federation always requires human review",()=>{
 assert.equal(assessPledge({...base,category:"National & Regional Organisations"}).decision,"human_review");
});
test("governing authority claims require human review",()=>{
 assert.equal(assessPledge({...base,name:"World Pickleball Federation"}).decision,"human_review");
});
test("duplicate requires human review",()=>{
 assert.equal(assessPledge({...base,duplicateCount:1}).decision,"human_review");
});
test("domain mismatch requires human review",()=>{
 assert.equal(assessPledge({...base,email:"club@gmail.com"}).decision,"human_review");
});
test("abuse check incomplete requires human review",()=>{
 assert.equal(assessPledge({...base,abusePassed:false}).decision,"human_review");
});
