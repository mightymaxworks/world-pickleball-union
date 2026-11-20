// Deferred runtime access avoids resolving the Workers-only module during Next.js build.
type Database = {prepare:(sql:string)=>{bind:(...params:unknown[])=>{all:()=>Promise<{results:Record<string,unknown>[]}>}}};
export async function queryD1(sql:string,params:unknown[]=[]):Promise<Record<string,unknown>[]>{
 const {env}=await import("cloudflare:workers");
 const database=(env as unknown as {WPU_DB?:Database}).WPU_DB;
 if(!database)throw new Error("WPU_DB binding unavailable");
 const result=await database.prepare(sql).bind(...params).all();
 return result.results||[];
}
