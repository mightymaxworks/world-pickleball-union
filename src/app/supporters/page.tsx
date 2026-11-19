import type { Metadata } from "next";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import SupporterDirectory from "./SupporterDirectory";
import PledgeForm from "./PledgeForm";

export const metadata: Metadata = {
  title: "Global Support Network",
  description: "Discover the organisations pledging support for the World Pickleball Union's inclusive global pickleball mission.",
  alternates: { canonical: "/supporters" },
};

export default function SupportersPage() {
  return (
    <main>
      <SiteHeader />
      <section style={{background:"#0b205b",color:"white",padding:"clamp(72px,9vw,130px) 24px"}}>
        <div style={{maxWidth:1120,margin:"0 auto"}}>
          <p style={{color:"#d9f93c",fontWeight:800,letterSpacing:3,fontSize:13}}>WPU GLOBAL SUPPORT NETWORK</p>
          <h1 style={{fontSize:"clamp(42px,6.5vw,86px)",lineHeight:1.04,letterSpacing:"-.055em",maxWidth:950,margin:"22px 0"}}>United in support.<br/>Connected by pickleball.</h1>
          <p style={{maxWidth:740,fontSize:"clamp(17px,2vw,22px)",lineHeight:1.7,color:"#e1e9f7"}}>A growing community of organisations working towards a more inclusive, accessible and connected future for pickleball worldwide.</p>
          <a href="#pledge" style={{display:"inline-block",background:"#d9f93c",color:"#0b205b",padding:"16px 24px",marginTop:25,fontWeight:800,textDecoration:"none"}}>Pledge your support →</a>
        </div>
      </section>
      <section style={{maxWidth:1120,margin:"0 auto",padding:"76px 24px"}}>
        <p style={{fontSize:13,fontWeight:800,letterSpacing:2,color:"#0b205b"}}>OUR SUPPORTERS</p>
        <h2 style={{fontSize:"clamp(30px,4vw,50px)",letterSpacing:"-.04em",margin:"12px 0"}}>Organisations behind the mission</h2>
        <p style={{maxWidth:750,lineHeight:1.7,marginBottom:28}}>This public directory lists organisations whose support has been verified and approved for publication. A pledge does not imply WPU membership, affiliation or national governing-body recognition.</p>
        <SupporterDirectory />
      </section>
      <section id="pledge" style={{background:"#f0f4f8",padding:"76px 24px"}}>
        <div style={{maxWidth:1120,margin:"0 auto",display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:40}}>
          <div>
            <p style={{fontSize:13,fontWeight:800,letterSpacing:2,color:"#0b205b"}}>JOIN THE NETWORK</p>
            <h2 style={{fontSize:"clamp(32px,4vw,52px)",letterSpacing:"-.04em",margin:"12px 0"}}>Pledge your support.</h2>
            <p style={{lineHeight:1.8}}>We welcome national and regional organisations, clubs, education and development groups, industry organisations, and institutional collaborators.</p>
            <p style={{lineHeight:1.8}}>Supporting the mission is voluntary, non-exclusive and does not create membership, commercial obligations or governing authority.</p>
          </div>
          <div style={{background:"white",padding:"clamp(22px,4vw,40px)",border:"1px solid #dce4ed"}}>
            <PledgeForm />
          </div>
        </div>
      </section>
      <footer><div className="footer-inner"><Link href="/" aria-label="World Pickleball Union home"><img src="/brand/wpu-logo-approved.png" alt="World Pickleball Union" width="220" height="75" style={{objectFit:"contain"}} /></Link><div className="footer-copy"><p>UNITING PICKLEBALL WORLDWIDE.</p><small>© {new Date().getFullYear()} World Pickleball Union. All rights reserved.</small><p><Link href="/members">Membership</Link> · <Link href="/supporters">Global Support Network</Link></p></div></div></footer>
    </main>
  );
}
