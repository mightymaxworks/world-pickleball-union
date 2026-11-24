/** Bound actual streamed request bytes, not just the caller-supplied Content-Length. */
export async function readAuthJson(request:Request):Promise<unknown>{
 const reader=request.body?.getReader();
 if(!reader)throw new Error("Missing body");
 const decoder=new TextDecoder("utf-8",{fatal:true});let size=0;let raw="";
 try{
  while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;
   if(size>1024){await reader.cancel();throw new Error("Body too large");}
   raw+=decoder.decode(value,{stream:true});
  }
  return JSON.parse(raw+decoder.decode());
 }finally{reader.releaseLock();}
}
