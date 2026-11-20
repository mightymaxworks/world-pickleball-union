// OpenNext exposes Cloudflare bindings through its Node.js compatibility environment.
// Do not import cloudflare:workers: Next.js build runs outside the Workers runtime.
type Database = {prepare:(sql:string)=>{bind:(...params:unknown[])=>{all:()=>Promise<{results:Record<string,unknown>[]}>}}};
export async function queryD1(sql:string,params:unknown[]=[]):Promise<Record<string,unknown>[]>{
 const database=(process.env as unknown as {WPU_DB?:Database}).WPU_DB;
 if(!database||typeof database.prepare!=="function")throw new Error("WPU_DB binding unavailable in Node compatibility environment");
 const result=await database.prepare(sql).bind(...params).all();
 return result.results||[];
}
