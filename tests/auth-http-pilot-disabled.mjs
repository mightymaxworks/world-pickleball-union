import assert from "node:assert/strict";
const base=process.env.TEST_BASE_URL||"http://127.0.0.1:3000";
const post=(path,body,origin=base)=>fetch(base+path,{method:"POST",headers:{"Content-Type":"application/json",Origin:origin},body:JSON.stringify(body)});
for(const [path,body] of [["/api/auth/request-code",{email:"synthetic@example.org"}],["/api/auth/verify-code",{email:"synthetic@example.org",code:"123456"}]]){
 const response=await post(path,body);
 assert.equal(response.status,503,`${path}: pilot must be disabled; response ${await response.text()}`);
 assert.equal((await post(path,body,"https://untrusted.example")).status,403);
 assert.ok([400,413].includes((await post(path,{...body,padding:"x".repeat(2048)})).status));
}
assert.equal((await fetch(base+"/api/passport")).status,401);
assert.equal((await fetch(base+"/api/passport",{method:"PATCH",headers:{Origin:base,"Content-Type":"application/json"},body:JSON.stringify({name:"Synthetic"})})).status,401);
assert.equal((await fetch(base+"/federations/bhutan")).status,404);
assert.equal((await fetch(base+"/api/control/federation-roster")).status,404);
assert.equal((await post("/api/federations/v1/identity/grant",{clientId:"reference",consent:true})).status,404);
assert.equal((await post("/api/federations/v1/identity/exchange",{clientId:"reference",code:"a".repeat(43)})).status,404);
console.log("HTTP pilot-disabled and unauthenticated access checks passed");
