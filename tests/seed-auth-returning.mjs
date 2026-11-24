import {createHmac} from "node:crypto";
const pepper=process.env.AUTH_CODE_PEPPER;
if(!pepper||pepper.length<32)throw Error("Missing synthetic test pepper");
const email="synthetic-auth@example.org",id="synthetic-http-returning";
const hash=createHmac("sha256",pepper).update(JSON.stringify([email,id,"654321"])).digest("hex");
console.log(`INSERT INTO wpu_auth_challenges(id,email_normalized,secret_hash,purpose,expires_at,delivered_at) VALUES('${id}','${email}','${hash}','signin','2099-01-01T00:00:00.000Z',datetime('now'));`);
