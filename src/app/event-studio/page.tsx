import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { signedInAccount } from "@/lib/control/http";
import { eventStudioReady, listEvents, listOrganisations } from "@/lib/events/service";
import Studio from "./studio";
import "./studio.css";

export const dynamic="force-dynamic";
export const metadata: Metadata={title:"WPU Event Studio",robots:{index:false,follow:false}};

async function loadStudio() {
  try {
    const account=await signedInAccount();
    if (!account) return {status:"signed-out" as const};
    if (!await eventStudioReady()) return {status:"pending" as const};
    const [organisations,events]=await Promise.all([listOrganisations(account),listEvents(account)]);
    return {status:"ready" as const,organisations,events};
  } catch { return {status:"unavailable" as const}; }
}
export default async function EventStudioPage() {
  const state=await loadStudio();
  const content=state.status==="signed-out" ? <section className="es-gate"><p className="es-kicker">Organiser workspace</p>
    <h1>Make it an event.</h1><p>Sign in with your WPU account to find your organisation’s workspace.</p>
    <Link className="es-primary" href="/join?mode=login&from=event-studio">Sign in to WPU</Link></section>
    : state.status==="pending" ? <section className="es-gate"><h1>Event Studio is not available yet.</h1><p>Please check back shortly.</p></section>
    : state.status==="unavailable" ? <section className="es-gate"><h1>Event Studio is temporarily unavailable.</h1><p>Reload the page to try again.</p></section>
    : state.organisations.length ? <Studio organisations={state.organisations} initialEvents={state.events}/>
    : <section className="es-gate"><p className="es-kicker">Organiser access</p><h1>No workspace assigned.</h1>
      <p>You’re signed in. Ask WPU to enable organiser access for your organisation.</p>
      <Link className="es-secondary" href="/passport">Go to Player Passport</Link></section>;
  return <main className="es">
    <header className="es-header"><Link href="/" aria-label="World Pickleball Union home"><Image width={126} height={42} alt="World Pickleball Union" src="/brand/wpu-logo-approved.png" unoptimized/></Link><strong>Event Studio</strong><Link className="es-passport" href="/passport">Player Passport</Link></header>
    <div className="es-shell">{content}</div>
    <footer className="es-footer">Powered by Waypoint and OurOwn. (c) World Pickleball Union 2026. All Rights Reserved.</footer>
  </main>;
}
