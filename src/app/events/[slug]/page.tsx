import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { cache } from "react";
import { eventStudioReady, getPublicEvent } from "@/lib/events/service";
import PublicProgramme from "../../event-studio/programme";
import "../../event-studio/studio.css";

export const dynamic="force-dynamic";
const eventFor=cache(async (slug:string)=>await eventStudioReady() ? getPublicEvent(slug) : null);

export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata> {
  const {slug}=await params;
  const event=await eventFor(slug);
  if (!event) return {title:"Event not found",robots:{index:false,follow:false}};
  return {title:event.programme.title,description:event.programme.description || "Hosted by "+event.organiser,
    alternates:{canonical:"/events/"+slug}};
}
export default async function EventPage({params}:{params:Promise<{slug:string}>}) {
  const event=await eventFor((await params).slug);
  if (!event) notFound();
  return <main className="es">
    <header className="es-header"><Link href="/" aria-label="World Pickleball Union home"><Image width={126} height={42} alt="World Pickleball Union" src="/brand/wpu-logo-approved.png" unoptimized/></Link><Link className="es-passport" href="/competitions">WPU Competitions</Link></header>
    <div className="es-shell"><PublicProgramme event={event}/></div>
    <footer className="es-footer">Powered by Waypoint and OurOwn. (c) World Pickleball Union 2026. All Rights Reserved.</footer>
  </main>;
}
