"use client";
import {useEffect,useState} from "react";
import Link from "next/link";
import Image from "next/image";
import "../join/membership.css";

type Passport={name:string;residenceCountry:string;playerCode:string;visibility:string;membershipStatus:string;affiliations:{organisationId:string;name:string;type:string;status:string;validFrom:string|null;validUntil:string|null}[]};
export default function PassportPage(){
 const [passport,setPassport]=useState<Passport|null>(null);
 const [state,setState]=useState<"loading"|"signed-out"|"error"|"ready">("loading");
 const [editName,setEditName]=useState("");const [saved,setSaved]=useState("");
 const [busy,setBusy]=useState(false);const [error,setError]=useState("");
 useEffect(()=>{let active=true;fetch("/api/passport",{cache:"no-store"}).then(async r=>{
 if(!active)return;if(r.status===401){setState("signed-out");return;}if(!r.ok)throw Error();
 const data=await r.json();if(active){setPassport(data.passport);setEditName(data.passport.name);setState("ready");}
 }).catch(()=>{if(active)setState("error");});return()=>{active=false;};},[]);
 async function saveName(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError("");setSaved("");try{const r=await fetch("/api/passport",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:editName})});if(!r.ok)throw Error();const data=await r.json();setPassport(p=>p?{...p,name:data.name}:p);setEditName(data.name);setSaved("Your name has been updated.");}catch{setError("Unable to save your name. Please try again.");}finally{setBusy(false);}}
 async function makePrivate(){setBusy(true);setError("");setSaved("");try{const r=await fetch("/api/passport",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({visibility:"private"})});if(!r.ok)throw Error();setPassport(p=>p?{...p,visibility:"private"}:p);setSaved("Your profile is private.");}catch{setError("Unable to update privacy. Please try again.");}finally{setBusy(false);}}
 async function logout(){setBusy(true);setError("");try{const r=await fetch("/api/auth/logout",{method:"POST"});if(!r.ok)throw Error();window.location.assign("/join");}catch{setError("Unable to sign out. Please try again.");setBusy(false);}}
 return <main className="membership-shell"><section className="membership-intro">
 <Image src="/brand/wpu-logo-approved.png" alt="World Pickleball Union" width={210} height={70} style={{objectFit:"contain"}}/>
 <p className="membership-kicker">YOUR GLOBAL SPORTING IDENTITY</p><h1>Player Passport</h1>
 <p>One permanent identity across the WPU ecosystem.</p></section>
 <section className="membership-panel" aria-label="Your Passport">
 {state==="loading"&&<p role="status">Loading your Passport…</p>}
 {state==="signed-out"&&<><h2>Sign in to continue</h2><Link href="/join">Go to registration and sign-in</Link></>}
 {state==="error"&&<><p role="alert">Your Passport is temporarily unavailable.</p><button onClick={()=>window.location.reload()}>Try again</button></>}
 {state==="ready"&&passport&&<>
 <article style={{background:"#0B2A66",color:"white",padding:24,borderRadius:12,overflowWrap:"anywhere"}}>
 <p style={{color:"#C6FF3D",fontSize:12,fontWeight:700}}>WPU PLAYER PASSPORT</p><h2>{passport.name}</h2><p>{passport.playerCode}</p><p>Residence: {passport.residenceCountry}</p><p>Global membership: {passport.membershipStatus}</p></article>
 <h3>Personal information</h3><form onSubmit={saveName}><label>Full name<input required maxLength={160} autoComplete="name" value={editName} onChange={e=>setEditName(e.target.value)}/></label><button disabled={busy||editName.trim()===passport.name} type="submit">Save name</button>{saved&&<p role="status">{saved}</p>}</form><h3>Profile privacy</h3><p>Visibility: {passport.visibility}. Public sharing is not yet enabled.</p>{passport.visibility!=="private"&&<button disabled={busy} onClick={()=>void makePrivate()}>Make my profile private</button>}<p>Your organisation memberships do not automatically make your personal profile public.</p>
 <h3>Affiliations</h3>{passport.affiliations.length===0?<p>No organisation memberships recorded yet.</p>:<ul>{passport.affiliations.map((a,i)=><li key={a.organisationId+"-"+i}><strong>{a.name}</strong><p>{a.type.replaceAll("_"," ")} · Recorded status: {a.status}</p>{a.validUntil&&<p>Valid until: {a.validUntil}</p>}</li>)}</ul>}<p>Membership does not establish national representation eligibility or official recognition.</p>
 <h3>Competition and rankings</h3><p>Competition history and official ranking services are not yet enabled.</p>
 {error&&<p role="alert">{error}</p>}<button disabled={busy} onClick={()=>void logout()}>{busy?"Signing out…":"Sign out"}</button>
 </>}
 </section></main>;
}
