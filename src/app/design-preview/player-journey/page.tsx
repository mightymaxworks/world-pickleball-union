import Image from "next/image";
import Link from "next/link";
import "./preview.css";

const events = [
  {name:"Community Open",place:"Singapore",date:"12 Dec 2026",type:"Doubles",tier:"Tier pending",status:"Registration preview"},
  {name:"Regional Challenge",place:"Kuala Lumpur",date:"19 Dec 2026",type:"Singles",tier:"Tier pending",status:"Registration preview"},
  {name:"Masters Invitational",place:"Bangkok",date:"9 Jan 2027",type:"Mixed doubles",tier:"Tier pending",status:"Registration preview"},
];

export const metadata = {title:"Player Journey Design Preview | WPU",robots:{index:false,follow:false}};

export default function PlayerJourneyPreview(){
 return <main className="wpu-preview">
   <header className="preview-header">
     <Link href="/" aria-label="WPU homepage"><Image src="/brand/wpu-logo-approved.png" alt="World Pickleball Union" width={210} height={70} style={{objectFit:"contain"}}/></Link>
     <nav aria-label="Preview sections"><a href="#discover">Discover</a><a href="#passport">Passport</a><a href="#journey">How it works</a></nav>
     <span className="preview-label">DESIGN PREVIEW · SAMPLE DATA</span>
   </header>
   <section className="preview-hero">
     <div><p className="preview-eyebrow">WPU COMPETITION NETWORK</p><h1>Your game.<br/><em>Your world.</em></h1><p>Find competitions, follow your progress and build your player journey through one connected WPU experience.</p><a className="preview-primary" href="#discover">Explore tournaments →</a></div>
     <aside className="preview-summary"><small>PLAYER OVERVIEW · DEMO</small><h2>Welcome, Player</h2><div className="preview-metrics"><div><strong>02</strong><span>Upcoming entries</span></div><div><strong>—</strong><span>Official points</span></div></div><p>Official rankings are not yet active. This is a design preview, not a registered player account.</p></aside>
   </section>
   <section id="discover" className="preview-section"><div className="preview-section-head"><div><p className="preview-eyebrow">01 / DISCOVER</p><h2>Find your next competition.</h2></div><span>Illustrative events only</span></div>
     <div className="preview-event-grid">{events.map((e,i)=><article key={e.name} className="preview-event"><div className="preview-event-top"><span>{e.type}</span><span>{e.tier}</span></div><h3>{e.name}</h3><p>{e.place} · {e.date}</p><div className="preview-event-bottom"><small>{e.status}</small><a href="#journey" aria-label={`View sample journey for ${e.name}`}>View journey →</a></div></article>)}</div>
   </section>
   <section id="passport" className="preview-section preview-passport"><div><p className="preview-eyebrow">02 / PLAYER PASSPORT</p><h2>One identity.<br/>Every milestone.</h2><p>Keep your competition history, memberships, results and ranking progress in one place.</p><div className="preview-tags"><span>Membership</span><span>My entries</span><span>Match history</span><span>Ranking breakdown</span></div></div><article className="preview-passport-card"><div className="preview-passport-top"><span>WPU PLAYER PASSPORT</span><span>PREVIEW</span></div><div className="preview-avatar">P</div><h3>Sample Player</h3><p>WPU ID: NOT ISSUED</p><div className="preview-passport-status">Membership: Not registered</div><div className="preview-passport-stats"><div><strong>0</strong><span>Verified events</span></div><div><strong>—</strong><span>Official rank</span></div></div></article></section>
   <section id="journey" className="preview-section"><p className="preview-eyebrow">03 / HOW IT WORKS</p><h2>From entry to results.</h2><div className="preview-steps">{["Create your WPU account","Choose an eligible division","Confirm tournament entry","Play and verify results","Follow provisional ranking progress"].map((x,i)=><div key={x}><b>{String(i+1).padStart(2,"0")}</b><span>{x}</span></div>)}</div><p className="preview-note">This is a static interaction concept. Registration, scoring and ranking calculation are not enabled here.</p></section>
   <footer className="preview-footer"><span>WORLD PICKLEBALL UNION · UI/UX CONCEPT V1</span><Link href="/">Return to WPU website</Link></footer>
 </main>
}
