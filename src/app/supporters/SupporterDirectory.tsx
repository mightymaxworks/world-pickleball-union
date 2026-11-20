"use client";
import { useEffect, useMemo, useState } from "react";

type Supporter = { name:string; country:string; region:string; category:string; website:string; logo?:string; status:"pledged"|"collaborator"|"partner" };

const categories = ["National & Regional Organisations","Clubs & Communities","Education & Development","Industry & Commercial","Institutional & Strategic"];
export default function SupporterDirectory(){
 const [supporters,setSupporters]=useState<Supporter[]>([]);
 const [loading,setLoading]=useState(true);
 const [unavailable,setUnavailable]=useState(false);
 useEffect(()=>{let active=true;fetch("/api/supporters",{cache:"no-store"}).then(async res=>{if(!res.ok)throw Error();return res.json()}).then(data=>{if(active)setSupporters(data.supporters||[])}).catch(()=>{if(active)setUnavailable(true)}).finally(()=>{if(active)setLoading(false)});return()=>{active=false}},[]);
 const [query,setQuery]=useState(""); const [region,setRegion]=useState("All regions"); const [category,setCategory]=useState("All categories");
 const filtered=useMemo(()=>supporters.filter(s=>(region==="All regions"||s.region===region)&&(category==="All categories"||s.category===category)&&[s.name,s.country].join(" ").toLowerCase().includes(query.toLowerCase())),[supporters,query,region,category]);
 const control={padding:"13px 15px",border:"1px solid #b9c7d9",borderRadius:4,background:"white",color:"#14233d",width:"100%",fontSize:15};
 return <div>
  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:12,marginBottom:30}}>
   <input aria-label="Search organisations" placeholder="Search organisations or countries" value={query} onChange={e=>setQuery(e.target.value)} style={control}/>
   <select aria-label="Filter by region" value={region} onChange={e=>setRegion(e.target.value)} style={control}>{["All regions","Africa","Americas","Asia","Europe","Oceania"].map(x=><option key={x}>{x}</option>)}</select>
   <select aria-label="Filter by category" value={category} onChange={e=>setCategory(e.target.value)} style={control}>{["All categories",...categories].map(x=><option key={x}>{x}</option>)}</select>
  </div>
  {filtered.length===0?<div style={{background:"#f0f4f8",padding:"clamp(28px,5vw,65px)",textAlign:"center",border:"1px solid #dbe4ef"}}>
    <h3 style={{fontSize:24,marginBottom:12}}>{loading?"Loading verified supporters…":unavailable?"Supporter directory temporarily unavailable":supporters.length===0?"Our global network is taking shape.":"No matching organisations"}</h3>
    <p style={{maxWidth:590,margin:"0 auto",lineHeight:1.8}}>{loading?"Please wait.":unavailable?"Please try again later.":supporters.length===0?"Verified organisations will be published here as pledges are confirmed and publication permission is received.":"Try another country, category or region."}</p>
   </div>:<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:18}}>{filtered.map(s=><article key={s.name+s.country} style={{border:"1px solid #dbe4ef",padding:24}}>
     <p style={{fontSize:12,textTransform:"uppercase",letterSpacing:1,color:"#50627e"}}>{s.category}</p>
     <h3 style={{fontSize:22,margin:"12px 0"}}>{s.name}</h3><p>{s.country}</p>
     <p style={{fontSize:13,textTransform:"capitalize"}}>{s.status==="pledged"?"Pledged support":s.status==="collaborator"?"Active collaborator":"Formal partner"}</p>
     {s.website&&<a href={s.website} target="_blank" rel="noopener noreferrer">Visit website ↗</a>}
    </article>)}</div>}
 </div>
}
