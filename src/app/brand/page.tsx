import Image from "next/image";
import SiteHeader from "@/components/SiteHeader";

export const metadata = {
  title: "Brand Identity",
  description: "Explore the World Pickleball Union visual identity and official brand principles.",
  alternates: { canonical: "/brand" },
};

const colors = [
  ["Navy", "#0B2A66"],
  ["Lime", "#C6FF3D"],
  ["Blue", "#2B6FFF"],
  ["Grey", "#E6E9EF"],
  ["White", "#FFFFFF"],
];

export default function BrandPage() {
  return (
    <main>
      <SiteHeader />
      <section style={{background:"#0B2A66",color:"#fff",padding:"clamp(48px,8vw,110px) 6vw"}}>
        <p style={{letterSpacing:".2em",fontSize:12}}>WORLD PICKLEBALL UNION</p>
        <h1 style={{fontSize:"clamp(36px,6vw,72px)",fontWeight:800,margin:"20px 0"}}>One identity. One global game.</h1>
        <p style={{maxWidth:650,lineHeight:1.7}}>Uniting Pickleball Worldwide. Our identity combines the official WPU logo with a clear, accessible visual system for international sport.</p>
        <div style={{maxWidth:660,marginTop:40}}><Image src="/brand/wpu-logo-approved.png" alt="Official World Pickleball Union logo" width={900} height={220} style={{width:"100%",height:"auto",objectFit:"contain"}} priority /></div>
      </section>
      <section style={{padding:"70px 6vw",maxWidth:1250,margin:"auto"}}>
        <h2 style={{fontSize:"clamp(28px,4vw,44px)",marginBottom:16}}>Our visual language</h2>
        <p style={{lineHeight:1.7,maxWidth:750}}>Navy provides institutional clarity, lime brings energy, and blue supports digital applications. The primary logo remains the official master; alternative marks must be verified against that source before public use.</p>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(155px,1fr))",gap:18,marginTop:35}}>
          {colors.map(([name,hex])=><div key={name}>
            <div style={{height:110,background:hex,border:"1px solid #d7dce6",borderRadius:12}} />
            <strong style={{display:"block",marginTop:12}}>{name}</strong><span>{hex}</span>
          </div>)}
        </div>
      </section>
      <section style={{padding:"60px 6vw",maxWidth:1250,margin:"auto"}}>\n        <h2 style={{fontSize:32}}>Certification mark — design candidate</h2>\n        <p style={{lineHeight:1.7,maxWidth:760}}>This versioned shield is a proposed production master, not a live certification or an issued approval. Its artwork will be locked after final review.</p>\n        <Image src="/brand/candidates/wpu-approved-shield-v1.svg" alt="Proposed WPU Approved equipment shield" width={240} height={288} style={{width:240,height:"auto",maxWidth:"100%"}} />\n      </section>\n      <section style={{background:"#eef2f8",padding:"60px 6vw"}}>
        <div style={{maxWidth:1100,margin:"auto"}}>
          <h2 style={{fontSize:32}}>Equipment approval and verification</h2>
          <p style={{lineHeight:1.8,maxWidth:760}}>WPU is developing an accessible equipment certification system. A consistent WPU Approved mark will identify certified equipment; NFC and QR technology are intended to link to authoritative, time-limited certification records. Public verification is not yet available.</p>
          <a href="/standards" style={{display:"inline-block",background:"#0B2A66",color:"white",padding:"15px 22px",marginTop:14}}>Explore standards →</a>
        </div>
      </section>
    </main>
  );
}
