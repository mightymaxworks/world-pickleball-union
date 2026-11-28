import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { queryD1 } from "../supporters-db.ts";
import { isEventId } from "../events/model.ts";
import type { Currency } from "./model.ts";
import type { registrationFor } from "./service.ts";

type Env=Record<string,string|undefined>;
export function checkoutConfig() {
  const key=Symbol.for("__cloudflare-context__");
  const env=(globalThis as unknown as Record<symbol,{env?:Env}|undefined>)[key]?.env;
  const get=(name:string)=>env?.[name]??process.env[name];
  const secret=get("WPU_STRIPE_SECRET_KEY"),signing=get("WPU_STRIPE_WEBHOOK_SECRET"),host=get("WPU_CHECKOUT_HOST_ORGANISATION");
  const mode=get("WPU_CHECKOUT_MODE");
  if ((mode!=="test"&&mode!=="live")||!secret||!(secret.startsWith("sk_"+mode+"_")||secret.startsWith("rk_"+mode+"_"))||!signing?.startsWith("whsec_")||
      !host||!/^[a-zA-Z0-9:_-]{1,128}$/.test(host)) return null;
  const production="https://worldpickleball.world";
  const origin=get("WPU_CHECKOUT_ORIGIN")??production;
  try{
    const url=new URL(origin);
    if(url.protocol!=="https:"||url.origin!==origin||(mode==="test"&&origin===production))return null;
  }catch{return null;}
  return {secret,signing,host,live:mode==="live",origin};
}
type Config=NonNullable<ReturnType<typeof checkoutConfig>>;
type Context=NonNullable<Awaited<ReturnType<typeof registrationFor>>>;
type Ticket={entry:string;attempt:string;email:string;started:number;session:string|null};
const sessionPattern=/^cs_(test|live)_[A-Za-z0-9_]+$/;
type CheckoutSession={id:string;mode:string;status:string;payment_status:string;amount_total:number;currency:string;url:string|null;
  expires_at:number;client_reference_id:string;livemode:boolean;metadata?:{wpu_entry?:string;wpu_attempt?:string};payment_intent:string|null};

async function stripe<T>(cfg:Config,path:string,body?:URLSearchParams,attempt?:string) {
  const r=await fetch("https://api.stripe.com/v1/"+path,{
    method:body?"POST":"GET",headers:{Authorization:"Bearer "+cfg.secret,...(body?{"Content-Type":"application/x-www-form-urlencoded"}:{}),
      ...(attempt?{"Idempotency-Key":"wpu-entry-"+attempt}:{})},body,cache:"no-store",signal:AbortSignal.timeout(12000),
  });
  if(!r.ok)throw new Error("CHECKOUT_PROVIDER_UNAVAILABLE");
  return await r.json() as T;
}
async function claim(context:Context,personId:string,account:string,id:string):Promise<Ticket|null> {
  const time=Math.floor(Date.now()/1000);
  await queryD1(`UPDATE wpu_event_entries AS t SET status='paying',payer_id=?,checkout_started=?,checkout_attempt=?,hold_until=NULL,
    checkout_email=(SELECT email_normalized FROM wpu_auth_emails m WHERE m.account_id=? AND m.verified_at IS NOT NULL
      ORDER BY m.verified_at DESC LIMIT 1)
    WHERE t.id=? AND t.event_id=? AND t.division_id=? AND t.status='ready' AND t.hold_until>?
      AND (t.lead_id=? OR t.partner_id=?) AND EXISTS(SELECT 1 FROM wpu_accounts a JOIN wpu_auth_emails m ON m.account_id=a.id
        WHERE a.id=? AND a.person_id=? AND a.status='active' AND m.verified_at IS NOT NULL)`,
    [personId,time,randomUUID(),account,id,context.eventId,context.divisionId,time,personId,personId,account,personId]);
  const [t]=await queryD1(`SELECT checkout_attempt,checkout_email,checkout_started,stripe_session FROM wpu_event_entries
    WHERE id=? AND event_id=? AND division_id=? AND status='paying' AND payer_id=?`,[id,context.eventId,context.divisionId,personId]);
  return t?{entry:id,attempt:String(t.checkout_attempt),email:String(t.checkout_email),started:Number(t.checkout_started),
    session:typeof t.stripe_session==="string"?t.stripe_session:null}:null;
}
function hostedLink(url:string|null) {
  if(!url)return null;
  try {const parsed=new URL(url);return parsed.origin==="https://checkout.stripe.com"?parsed.href:null;}
  catch{return null;}
}
export async function startCheckout(cfg:Config,context:Context,personId:string,account:string,id:string) {
  if(cfg.host!==context.hostId||context.fee.amount<=0)return {error:"Paid checkout is not available for this division."};
  const t=await claim(context,personId,account,id);
  if(!t)return {error:"This entry is not ready to pay, or the other player has already started checkout."};
  let session:CheckoutSession;
  if(t.session)session=await stripe(cfg,"checkout/sessions/"+encodeURIComponent(t.session));
  else{
    // Stable expiry, email and amount keep retries byte-for-byte idempotent.
    const expiresAt=t.started+33*60;
    if(Math.floor(Date.now()/1000)>=expiresAt-30*60)
      return {error:"Checkout could not be resumed. Contact the organiser to check this payment before trying again."};
    const returnTo=cfg.origin+"/events/"+context.slug+"/enter/"+context.divisionId;
    const form=new URLSearchParams({
      mode:"payment","payment_method_types[0]":"card",
      client_reference_id:t.entry,customer_email:t.email,
      "payment_intent_data[receipt_email]":t.email,
      success_url:returnTo+"?checkout=returned",cancel_url:returnTo,
      "metadata[wpu_entry]":t.entry,"metadata[wpu_attempt]":t.attempt,
      "line_items[0][quantity]":"1","line_items[0][price_data][currency]":context.fee.currency.toLowerCase(),
      "line_items[0][price_data][unit_amount]":String(context.fee.amount),
      "line_items[0][price_data][product_data][name]":context.name,
      expires_at:String(expiresAt),
    });
    session=await stripe(cfg,"checkout/sessions",form,t.attempt);
    if(!sessionPattern.test(session.id)||session.client_reference_id!==t.entry||session.metadata?.wpu_attempt!==t.attempt)
      throw new Error("CHECKOUT_PROVIDER_SESSION_MISMATCH");
    await queryD1(`UPDATE wpu_event_entries SET stripe_session=? WHERE id=? AND status='paying' AND checkout_attempt=? AND stripe_session IS NULL`,
      [session.id,t.entry,t.attempt]);
  }
  if(session.status==="complete"||session.status==="expired"){
    await settleCheckout(cfg,session);
    return {updated:true};
  }
  if(session.livemode!==cfg.live||session.mode!=="payment"||session.amount_total!==context.fee.amount||session.currency!==context.fee.currency.toLowerCase())return {error:"Unable to verify this checkout."};
  const url=hostedLink(session.url);
  return url?{url}:{error:"The hosted checkout could not be opened."};
}
export async function settleCheckout(cfg:Config,session:CheckoutSession) {
  const entry=session.metadata?.wpu_entry,attempt=session.metadata?.wpu_attempt;
  if(!isEventId(entry)||!isEventId(attempt)||!sessionPattern.test(session.id)||session.client_reference_id!==entry||
      session.mode!=="payment"||session.livemode!==cfg.live)return false;
  const [t]=await queryD1(`SELECT t.stripe_session,r.fee_minor,r.currency,e.organisation_id FROM wpu_event_entries t
    JOIN wpu_event_registration r ON r.event_id=t.event_id AND r.division_id=t.division_id
    JOIN wpu_studio_events e ON e.id=t.event_id WHERE t.id=? AND t.checkout_attempt=? AND t.status='paying'`,[entry,attempt]);
  if(!t||t.organisation_id!==cfg.host||(t.stripe_session&&t.stripe_session!==session.id)||
      Number(t.fee_minor)!==session.amount_total||String(t.currency as Currency).toLowerCase()!==session.currency)return false;
  if(session.status==="complete"&&session.payment_status==="paid"&&typeof session.payment_intent==="string"&&/^pi_[A-Za-z0-9_]+$/.test(session.payment_intent)){
    await queryD1(`UPDATE wpu_event_entries SET status='confirmed',stripe_session=?,payment_ref=?,checkout_email=NULL
      WHERE id=? AND checkout_attempt=? AND status='paying'`,[session.id,session.payment_intent,entry,attempt]);
    return true;
  }
  if(session.status==="expired"&&session.payment_status==="unpaid"){
    await queryD1(`UPDATE wpu_event_entries SET status='expired',reserved=0,stripe_session=?,checkout_email=NULL
      WHERE id=? AND checkout_attempt=? AND status='paying'`,[session.id,entry,attempt]);
    return true;
  }
  return false;
}
export function verifiedWebhook(raw:string,header:string|null,secret:string,time=Math.floor(Date.now()/1000)){
  const parts=header?.split(",")??[];
  const timestamp=parts.find(p=>p.startsWith("t="))?.slice(2);
  if(!timestamp||!/^\d{1,12}$/.test(timestamp)||Math.abs(time-Number(timestamp))>300)return false;
  const expected=createHmac("sha256",secret).update(timestamp+"."+raw).digest();
  return parts.filter(p=>p.startsWith("v1=")).map(p=>p.slice(3)).some(s=>/^[a-f0-9]{64}$/.test(s)&&timingSafeEqual(expected,Buffer.from(s,"hex")));
}
export async function processWebhook(cfg:Config,raw:string) {
  const event=JSON.parse(raw);
  if(!["checkout.session.completed","checkout.session.expired","checkout.session.async_payment_succeeded"].includes(event?.type))return;
  const session=event?.data?.object;
  if(!sessionPattern.test(String(session?.id))||!isEventId(session?.metadata?.wpu_entry))return;
  // A signed event is the notification. The provider Session is the payment record.
  await settleCheckout(cfg,await stripe(cfg,"checkout/sessions/"+encodeURIComponent(session.id)));
}
