export type Supporter = {name:string;country:string;region:string;category:string;website:string;status:"pledged"};
type D1Result={success?:boolean;result?:Array<{results?:Record<string,unknown>[]}>};
export async function queryD1(sql:string,params:unknown[]=[]):Promise<Record<string,unknown>[]>{
 const {WPU_CF_ACCOUNT_ID:account,WPU_CF_D1_DATABASE_ID:database,WPU_CF_API_TOKEN:token}=process.env;
 if(!account||!database||!token)throw new Error("D1 not configured");
 const res=await fetch(`https://api.cloudflare.com/client/v4/accounts/${account}/d1/database/${database}/query`,{method:"POST",headers:{"Authorization":`Bearer ${token}`,"Content-Type":"application/json"},body:JSON.stringify({sql,params}),cache:"no-store"});
 const body=await res.json() as D1Result;
 if(!res.ok||!body.success)throw new Error("Database query failed");
 return body.result?.[0]?.results||[];
}
