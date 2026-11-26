"use client";
import { useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { residenceCountries as countries } from "@/lib/passport/regions";
import "./membership.css";

const localities:Record<string,string[]>={BT:["Thimphu","Paro","Punakha","Phuentsholing","Gelephu","Trongsa","Trashigang","Samdrup Jongkhar"],SG:["Singapore"],CN:["Beijing","Shanghai","Guangzhou","Shenzhen","Chengdu","Hangzhou","Hohhot"],MY:["Kuala Lumpur","Johor Bahru","George Town","Ipoh","Kuching","Kota Kinabalu"]};
export default function MembershipForm({ federation, initialMode }: { federation: string | null; initialMode: "register" | "login" }) {
 const [mode,setMode]=useState(initialMode);
 const [step,setStep]=useState<"details"|"code">("details");
 const [email,setEmail]=useState(""); const [givenName,setGivenName]=useState(""); const [familyName,setFamilyName]=useState(""); const [city,setCity]=useState(""); const [other,setOther]=useState("");
 const [gender,setGender]=useState("");
 const [country,setCountry]=useState(""); const [consent,setConsent]=useState(false); const [adult,setAdult]=useState(false);
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
   const r=await fetch("/api/auth/verify-code",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email,code,...(mode==="register"?{givenName,familyName,gender:gender||null,country,locality:city==="other"?other:city,consent,adult}:{})})});
   if(!r.ok)throw Error("Verification unsuccessful. Check your code or request a new one. New members must register first.");
   window.location.assign(federation ? "/federations/" + federation : "/passport");
  }catch(e){setError(e instanceof Error?e.message:"Please try again.");}finally{setBusy(false);}
 }
 return <main className="membership-shell"><section className="membership-intro">
 <Image src="/brand/wpu-logo-approved.png" alt="World Pickleball Union" width={210} height={70} style={{objectFit:"contain"}}/>
 <p className="membership-kicker">ONE GLOBAL IDENTITY</p><h1>Your game. Your world.</h1><p>Your WPU Passport connects your sporting journey, memberships and future competition records.</p><Link className="membership-back" href={federation ? "/federations/" + federation : "/get-involved"}>← {federation ? "Back to your federation" : "Join WPU options"}</Link></section>
 <section className="membership-panel"><h2>{step==="code"?"Check your email":mode==="register"?"Create your account":"Sign in"}</h2>
 <form onSubmit={submit}>
 {step==="details"?<>
 {mode==="register"&&<><label>Given name(s)<input required maxLength={80} autoComplete="given-name" value={givenName} onChange={e=>setGivenName(e.target.value)}/></label><label>Family name (surname)<input maxLength={79} autoComplete="family-name" value={familyName} onChange={e=>setFamilyName(e.target.value)}/><small>Leave blank if you have only one name.</small></label><label>Gender<select required value={gender} onChange={e=>setGender(e.target.value)}><option value="">Select gender</option><option value="male">Male</option><option value="female">Female</option></select></label><label>Country of residence<select required autoComplete="country" value={country} onChange={e=>{setCountry(e.target.value);setCity("");setOther("");}}><option value="">Select your country or territory</option>{countries.map(c=><option key={c.code} value={c.code}>{c.name}</option>)}</select></label>{country&&<><label>City / town / locality<select required value={city} onChange={e=>{setCity(e.target.value);setOther("");}}><option value="">Select your locality</option>{(localities[country]||[]).map(x=><option key={x}>{x}</option>)}<option value="other">Other — enter manually</option></select></label>{city==="other"&&<label>Enter your city, town or village<input required maxLength={120} autoComplete="address-level2" value={other} onChange={e=>setOther(e.target.value)}/></label>}</>}</>}
 <label>Email address<input type="email" required maxLength={254} autoComplete="email" value={email} onChange={e=>setEmail(e.target.value)}/></label>
 {mode==="register"&&<label className="membership-consent"><input type="checkbox" required checked={adult} onChange={e=>setAdult(e.target.checked)}/> I confirm that I am 18 years of age or older.</label>}
 {mode==="register"&&<label className="membership-consent"><input type="checkbox" required checked={consent} onChange={e=>setConsent(e.target.checked)}/> <span>I agree to the <a href="/membership/terms" target="_blank" rel="noopener noreferrer">Terms of Membership</a> and acknowledge the <a href="/membership/privacy" target="_blank" rel="noopener noreferrer">Privacy Notice</a>.</span></label>}
 </>:<><p>Enter the six-digit code sent to {email}.</p><label>Verification code<input required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={e=>setCode(e.target.value)}/></label></>}
 {error&&<p role="alert">{error}</p>}{notice&&<p role="status">{notice}</p>}
 <button disabled={busy} type="submit">{busy?"Please wait…":step==="code"?"Verify and continue":"Continue"}</button>
 </form>
 {step==="code"?<><button className="membership-secondary" disabled={busy} onClick={()=>void requestCode()}>Request another code</button><button className="membership-secondary" disabled={busy} onClick={()=>{setStep("details");setCode("");setError("");setNotice("");}}>Change email</button></>:<button className="membership-secondary" disabled={busy} onClick={()=>{setMode(mode==="register"?"login":"register");setError("");}}>{mode==="register"?"Already a member? Sign in":"New to WPU? Register"}</button>}
 </section></main>;
}
