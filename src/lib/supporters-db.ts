// Cloudflare D1 is provided as a native Worker binding.
// No REST API token or third-party service is required.
// In OpenNext's Node compatibility runtime, bindings are available on process.env.
type D1 = {prepare:(sql:string)=>{bind:(...params:unknown[])=>{all:()=>Promise<{results:Record<string,unknown>[]}>}}};
export async function queryD1(sql:string,params:unknown[]=[]):Promise<Record<string,unknown>[]>{
 const database=(process.env as unknown as {WPU_DB?:D1}).WPU_DB;
 if(!database||typeof database.prepare!=="function")throw new Error("WPU_DB_NATIVE_BINDING_MISSING");
 const result=await database.prepare(sql).bind(...params).all();
 return result.results||[];
}
