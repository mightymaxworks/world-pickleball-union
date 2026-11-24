"use client";
import { useState, type FormEvent } from "react";
import Image from "next/image";
import "./membership.css";

export default function MembershipPage() {
 const [mode,setMode]=useState<"register"|"login">("register");
 const [step,setStep]=useState<"details"|"code">("details");
 const [email,setEmail]=useState(""); const [name,setName]=useState("");
 const [country,setCountry]=useState(""); const [consent,setConsent]=useState(false);
 const [code,setCode]=useState(""); const [busy,setBusy]=useState(false);
 const [error,setError]=useState(""); const [notice,setNotice]=useState("");
 async function requestCode() {
  setBusy(true);setError("");setNotice("");
  try {
   const r=await fetch("/api/auth/request-code",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email})});
   if(!r.ok) throw Error("Unable to request a code. Please try again later.");
   setStep("code");setNotice("If eligible, a code will arrive by email. Check your spam folder.");
  } catch(e){setError(e instanceof Error?e.message:"Please try again.");} finally{setBusy(false);}
 }
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();
  if(step==="details"){await requestCode();return;}
  setBusy(true);setError("");
  try{
   const r=await fetch("/api/auth/verify-code",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,code,...(mode==="register"?{name,country,consent}:{})})});
   if(!r.ok)throw Error("Verification unsuccessful. Check your code or request a new one. New members must register first.");
   window.location.assign("/passport");
  }catch(e){setError(e instanceof Error?e.message:"Please try again.");}finally{setBusy(false);}
 }
 return <main className="membership-shell"><section className="membership-intro">
 <Image src="/brand/wpu-logo-approved.png" alt="World Pickleball Union" width={210} height={70} style={{objectFit:"contain"}}/>
 <p className="membership-kicker">ONE GLOBAL IDENTITY</p><h1>Your game. Your world.</h1><p>Your WPU Passport connects your sporting journey, memberships and future competition records.</p></section>
 <section className="membership-panel"><h2>{step==="code"?"Check your email":mode==="register"?"Create your account":"Sign in"}</h2>
 <form onSubmit={submit}>
 {step==="details"?<>
 {mode==="register"&&<><label>Full name<input required maxLength={160} autoComplete="name" value={name} onChange={e=>setName(e.target.value)}/></label><label>Country of residence (two-letter country code)<input required pattern="[A-Za-z]{2}" maxLength={2} autoComplete="country" placeholder="e.g. BT" value={country} onChange={e=>setCountry(e.target.value)}/></label></>}
 <label>Email address<input type="email" required maxLength={254} autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/></label>
 {mode==="register"&&<label className="membership-consent"><input type="checkbox" required checked={consent} onChange={e=>setConsent(e.target.checked)}/> I acknowledge the WPU registration privacy and terms requirements (draft; public launch pending approved policy links).</label>}
 </>:<><p>Enter the six-digit code sent to {email}.</p><label>Verification code<input required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={e=>setCode(e.target.value)}/></label></>}
 {error&&<p role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}
 <button disabled={busy} type="submit">{busy?"Please wait…":step==="code"?"Verify and continue":"Continue"}</button>
 </form>
 {step==="code"?<><button className="membership-secondary" disabled={busy} onClick={()=>void requestCode()}>Request another code</button><button className="membership-secondary" disabled={busy} onClick={()=>{setStep("details");setCode("");setError("");setNotice("");}}>Change email</button></>:<button className="membership-secondary" disabled={busy} onClick={()=>{setMode(mode==="register"?"login":"register");setError("");}}>{mode==="register"?"Already a member? Sign in":"New to WPU? Register"}</button>}
 <p className="membership-note">Pre-release interface. Public activation requires approved policies and end-to-end testing.</p></section></main>;
}
