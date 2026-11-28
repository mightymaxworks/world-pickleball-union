import { controlBody, controlError, controlJson, isSameOrigin, signedInAccount } from "@/lib/control/http";
import { isEventId, isEventSlug } from "@/lib/events/model";
import { checkoutConfig, startCheckout } from "@/lib/entries/checkout";
import { isInvite, validBirthDate } from "@/lib/entries/model";
import {
  acceptEntry, claimOffer, entriesReady, entryFor, entryPlayer, invitation, registrationFor, saveBirthDate, startEntry, withdrawEntry,
} from "@/lib/entries/service";

export const dynamic="force-dynamic";
const unavailable=()=>controlError(503,"Registration is temporarily unavailable.");

async function identity() {
  const account=await signedInAccount();
  if(!account)return controlError(401,"Sign in with your WPU Passport to continue.");
  if(!await entriesReady())return unavailable();
  const player=await entryPlayer(account);
  return player?{account,player}:controlError(403,"An active WPU Passport is required.");
}

export async function GET(request:Request) {
  try{
    const user=await identity();if(user instanceof Response)return user;
    const query=new URL(request.url).searchParams, slug=query.get("event"),division=query.get("division"),invite=query.get("invite");
    if(!isEventSlug(slug)||!isEventId(division)||(invite!==null&&!isInvite(invite)))return controlError(400,"Invalid entry link.");
    const context=await registrationFor(slug,division);
    if(!context)return controlError(404,"This division is not available for registration.");
    return controlJson({hasBirthDate:user.player.hasBirthDate,accepting:context.accepting,
      entry:await entryFor(context,user.player.id),invitedBy:invite?await invitation(context,invite):null});
  }catch{return unavailable();}
}
export async function POST(request:Request) {
  if(!isSameOrigin(request))return controlError(403,"This request did not come from WPU.");
  try{
    const user=await identity();if(user instanceof Response)return user;
    const body=await controlBody(request);
    if(!body||!isEventSlug(body.event)||!isEventId(body.division))return controlError(400,"Invalid entry request.");
    const context=await registrationFor(body.event,body.division);
    if(!context)return controlError(404,"This division is not available for registration.");
    const {account,player}=user;
    if(body.action==="birthDate"){
      if(!validBirthDate(body.birthDate)||!await saveBirthDate(account,body.birthDate))return controlError(422,"Enter your date of birth to continue.");
      return controlJson({ok:true});
    }
    if(!player.hasBirthDate)return controlError(422,"Add your date of birth to your Passport first.");
    if(body.action==="enter"||body.action==="accept"){
      if(!context.accepting)return controlError(409,"Entries are closed.");
      if(body.action==="accept"&&!isInvite(body.invite))return controlError(400,"Invalid partner invite.");
      const state=body.action==="enter"?await startEntry(context,player):await acceptEntry(context,player,body.invite as string);
      if(state==="ineligible")return controlError(422,"This Passport or pair does not meet the division category.");
      if(state!=="ok")return controlError(409,"This invite or entry is no longer available. Check your status.");
    }else if((body.action==="claim"||body.action==="withdraw"||body.action==="pay")&&isEventId(body.id)){
      if(body.action==="pay"){
        const cfg=checkoutConfig();
        if(!cfg||cfg.host!==context.hostId||cfg.origin!==new URL(request.url).origin)return unavailable();
        const state=await startCheckout(cfg,context,player.id,account,body.id);
        return "error" in state?controlError(409,state.error??"Checkout is unavailable."):controlJson(state);
      }
      const done=body.action==="claim"?await claimOffer(context,player.id,body.id):await withdrawEntry(context,player.id,body.id);
      if(!done)return controlError(409,"This entry changed. Check your status before continuing.");
    }else return controlError(400,"Invalid entry action.");
    return controlJson({entry:await entryFor(context,player.id)});
  }catch{return unavailable();}
}
