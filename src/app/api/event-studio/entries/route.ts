import { controlBody, controlError, controlJson, isSameOrigin, signedInAccount } from "@/lib/control/http";
import { isEventId } from "@/lib/events/model";
import { getEvent } from "@/lib/events/service";
import { checkoutConfig } from "@/lib/entries/checkout";
import { canRegisterDivision, parseRegistrationInput } from "@/lib/entries/model";
import { entriesReady, openRegistration, organiserEntryList, organiserRegistrations, resetUnusedRegistration, setRegistrationPaused } from "@/lib/entries/service";

export const dynamic="force-dynamic";
const unavailable=()=>controlError(503,"Registration is temporarily unavailable.");

async function organiser(eventId:unknown) {
  const account=await signedInAccount();
  if(!account)return controlError(401,"Sign in to Event Studio.");
  if(!isEventId(eventId))return controlError(400,"Choose an event.");
  if(!await entriesReady())return unavailable();
  const event=await getEvent(account,eventId);
  return event?{account,event}:controlError(404,"Event not available in your workspace.");
}
export async function GET(request:Request) {
  try{
    const q=new URL(request.url).searchParams;
    const user=await organiser(q.get("event"));if(user instanceof Response)return user;
    const {account,event}=user, registered=await organiserRegistrations(account,event.id);
    const division=q.get("division"), offset=q.get("offset")??"0";
    if(division!==null&&(!isEventId(division)||!registered.some(r=>r.divisionId===division)||!/^\d{1,5}$/.test(offset)))
      return controlError(400,"Choose a division with registration.");
    const cfg=checkoutConfig();
    return controlJson({registered,payments:cfg?.host===event.organisation.id&&cfg?.origin===new URL(request.url).origin,
      divisions:event.publishedRevision===event.revision?event.draft.divisions.filter(canRegisterDivision).map(d=>({id:d.id,name:d.name,kind:d.kind})):[],
      ...(division?{roster:await organiserEntryList(account,event.id,division,Number(offset))}:{})});
  }catch{return unavailable();}
}
export async function POST(request:Request) {
  if(!isSameOrigin(request))return controlError(403,"This request did not come from Event Studio.");
  try{
    const body=await controlBody(request,8192);
    if(!body||!isEventId(body.division))return controlError(400,"Choose a division.");
    const user=await organiser(body.event);if(user instanceof Response)return user;
    const {account,event}=user;
    if(body.action==="open"){
      if(event.publishedRevision!==event.revision)return controlError(409,"Publish the current division rules before opening entries.");
      const input=parseRegistrationInput(body);
      if(!input)return controlError(422,"Add a future closing time, a valid contact email and cancellation terms for paid entries.");
      const cfg=checkoutConfig();
      const state=await openRegistration(account,event.id,body.division,input,cfg?.origin===new URL(request.url).origin?cfg.host:null);
      if(state!=="ok")return controlError(422,state==="payments"?"Paid checkout is not enabled for this organisation.":
        state==="closing"?"Entries must close on or before the event date.":"This division already has registration or is outside the singles and standard doubles pilot.");
    }else if(body.action==="pause"||body.action==="resume"){
      if(!await setRegistrationPaused(account,event.id,body.division,body.action==="pause"))
        return controlError(404,"Registration not found in your workspace.");
    }else if(body.action==="reset"){
      if(!await resetUnusedRegistration(account,event.id,body.division))
        return controlError(409,"Pause entries first. Only a registration without entry history can be reset.");
    }else return controlError(400,"Invalid registration action.");
    return controlJson({registered:await organiserRegistrations(account,event.id)});
  }catch{return unavailable();}
}
