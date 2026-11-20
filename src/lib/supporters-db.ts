// Native Cloudflare D1 access for the existing OpenNext Worker runtime.
// OpenNext publishes request-scoped bindings on Symbol.for("__cloudflare-context__").
// Keep process.env fallback for environments that expose native bindings there.
// No REST API token or external service is used.
type D1 = {
 prepare:(sql:string)=>{bind:(...params:unknown[])=>{all:()=>Promise<{results:Record<string,unknown>[]}>}}
};
type CloudflareContext = {env?:{WPU_DB?:D1}};
export function bindingDiagnostics(){
 const context=(globalThis as unknown as Record<symbol,CloudflareContext|undefined>)[Symbol.for("__cloudflare-context__")];
 const binding=context?.env?.WPU_DB;
 const processBinding=(process.env as unknown as {WPU_DB?:D1}).WPU_DB;
 return {contextPresent:!!context,contextEnvPresent:!!context?.env,contextBindingPresent:!!binding,contextBindingUsable:typeof binding?.prepare==="function",processBindingPresent:!!processBinding,processBindingUsable:typeof processBinding?.prepare==="function"};
}
function nativeDatabase():D1|undefined {
 const contextKey=Symbol.for("__cloudflare-context__");
 const context=(globalThis as unknown as Record<symbol,CloudflareContext|undefined>)[contextKey];
 const fromContext=context?.env?.WPU_DB;
 if(fromContext&&typeof fromContext.prepare==="function")return fromContext;
 const fromProcess=(process.env as unknown as {WPU_DB?:D1}).WPU_DB;
 if(fromProcess&&typeof fromProcess.prepare==="function")return fromProcess;
 return undefined;
}
export async function queryD1(sql:string,params:unknown[]=[]):Promise<Record<string,unknown>[]>{
 const database=nativeDatabase();
 if(!database)throw new Error("WPU_DB_NATIVE_BINDING_MISSING");
 const result=await database.prepare(sql).bind(...params).all();
 return result.results||[];
}
