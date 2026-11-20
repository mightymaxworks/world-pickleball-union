// Works with a native D1 binding when exposed by the runtime, or with the
// Cloudflare D1 REST API when restricted server-side credentials are configured.
// Never expose these credentials through NEXT_PUBLIC_* variables.
type D1 = {prepare:(sql:string)=>{bind:(...params:unknown[])=>{all:()=>Promise<{results:Record<string,unknown>[]}>}}};
export async function queryD1(sql:string,params:unknown[]=[]):Promise<Record<string,unknown>[]>{
 const binding=(process.env as unknown as {WPU_DB?:D1}).WPU_DB;
 if(binding&&typeof binding.prepare==="function"){
  const result=await binding.prepare(sql).bind(...params).all();
  return result.results||[];
 }
 const account=process.env.WPU_CF_ACCOUNT_ID;
 const database=process.env.WPU_CF_D1_DATABASE_ID;
 const token=process.env.WPU_CF_API_TOKEN;
 if(!account||!database||!token)throw new Error("D1 unavailable: native binding missing and REST credentials not configured");
 const response=await fetch(`https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(account)}/d1/database/${encodeURIComponent(database)}/query`,{
  method:"POST",headers:{"Authorization":`Bearer ${token}`,"Content-Type":"application/json"},
  body:JSON.stringify({sql,params}),cache:"no-store"
 });
 const payload=await response.json() as {success?:boolean;result?:Array<{results?:Record<string,unknown>[];success?:boolean}>};
 if(!response.ok||!payload.success||!payload.result?.[0]?.success)throw new Error(`D1 REST query failed (HTTP ${response.status})`);
 return payload.result[0].results||[];
}
