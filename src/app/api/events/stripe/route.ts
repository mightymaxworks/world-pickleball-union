import { checkoutConfig, processWebhook, verifiedWebhook } from "@/lib/entries/checkout";

export const dynamic="force-dynamic";

export async function POST(request:Request) {
  const config=checkoutConfig();
  if(!config)return new Response("Checkout unavailable",{status:503});
  const reader=request.body?.getReader();
  if(!reader)return new Response("Invalid request",{status:400});
  let raw="",bytes=0;
  const decoder=new TextDecoder("utf-8",{fatal:true});
  try{
    while(true){
      const part=await reader.read();
      if(part.done)break;
      bytes+=part.value.byteLength;
      if(bytes>131072){await reader.cancel();return new Response("Body too large",{status:413});}
      raw+=decoder.decode(part.value,{stream:true});
    }
    raw+=decoder.decode();
  }catch{return new Response("Invalid request",{status:400});}
  finally{reader.releaseLock();}
  if(!verifiedWebhook(raw,request.headers.get("stripe-signature"),config.signing))return new Response("Invalid signature",{status:400});
  try{await processWebhook(config,raw);return new Response("OK");}
  catch{return new Response("Retry delivery",{status:503});}
}
