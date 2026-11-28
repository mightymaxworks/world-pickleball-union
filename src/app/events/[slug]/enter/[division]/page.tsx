import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { signedInAccount } from "@/lib/control/http";
import { displayDate, isEventId, isEventSlug } from "@/lib/events/model";
import { isSinglesKind } from "@/lib/events/competition";
import { feeUnit, formatFee, isInvite } from "@/lib/entries/model";
import { entriesReady, registrationFor } from "@/lib/entries/service";
import EntryForm from "./form";
import "../../../../event-studio/studio.css";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Tournament entry",robots:{index:false,follow:false},referrer:"no-referrer"};

export default async function EntryPage({params,searchParams}:{
  params:Promise<{slug:string;division:string}>;searchParams:Promise<{invite?:string;checkout?:string}>;
}) {
  const {slug,division}=await params, q=await searchParams;
  if(!isEventSlug(slug)||!isEventId(division)||q.invite!==undefined&&!isInvite(q.invite)||!await entriesReady())notFound();
  const plan=await registrationFor(slug,division);
  if(!plan||q.invite&&isSinglesKind(plan.kind))notFound();
  const account=await signedInAccount().catch(()=>null);
  const query=new URLSearchParams({mode:"login",from:"event-entry",event:slug,division,...(q.invite?{invite:q.invite}:{})});
  const closing=new Intl.DateTimeFormat("en-SG",{dateStyle:"medium",timeStyle:"short",timeZone:plan.timeZone}).format(new Date(plan.closesAt*1000));
  return <main className="es"><div className="es-shell"><section className="es-gate es-entry-loop">
    <nav className="es-entry-nav" aria-label="Tournament entry navigation">
      <Link href={"/events/"+slug}>Event page</Link><Link href="/passport/entries">My entries</Link>
    </nav>
    <p className="es-kicker">Tournament entry</p><h1>{plan.name}</h1>
    <p><strong>{formatFee(plan.fee)}</strong> · {feeUnit(plan.kind)} · {plan.accepting?"Entries close "+closing+" · "+plan.timeZone:"Registration closed"}</p>
    {plan.minimumAge&&<p>{isSinglesKind(plan.kind)?"Players":"Both partners"} must be {plan.minimumAge} or older on {displayDate(plan.eventDate)}.</p>}
    {plan.terms && <div className="es-entry-notice"><strong>Cancellation terms</strong><p>{plan.terms}</p></div>}
    {!account?<><p>Sign in or create your WPU Passport to {q.invite?"accept a doubles invitation":"enter or check an entry"}.</p>
      <Link href={"/join?"+query} className="es-primary">Continue with WPU Passport</Link></>:
      <EntryForm event={slug} division={division} invite={q.invite} plan={plan} returned={q.checkout==="returned"}/>}
    <p>Questions or changes to a paid entry? <a href={"mailto:"+plan.contact}>Contact the organiser</a>.</p>
  </section></div></main>;
}
