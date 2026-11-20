"use client";
import {useState,type FormEvent} from "react";
const categories=["National & Regional Organisations","Clubs & Communities","Education & Development","Industry & Commercial","Institutional & Strategic"];
export default function PledgeForm(){
 const [state,setState]=useState<"idle"|"sending"|"success"|"error">("idle");
 const [message,setMessage]=useState("");
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault();const form=e.currentTarget;const data=Object.fromEntries(new FormData(form).entries());
  setState("sending");setMessage("");
  try{const res=await fetch("/api/supporters/pledge",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});const result=await res.json();
   if(!res.ok)throw new Error(result.error||"Submission unavailable");
   setState("success");setMessage("Your pledge has been received for verification. It will not appear publicly until approved.");form.reset();
  }catch(e){setState("error");setMessage(e instanceof Error?e.message:"Submission failed. Please try again.");}
 }
 const input={display:"block",width:"100%",padding:"12px",border:"1px solid #b6c3d4",marginTop:6,marginBottom:14,color:"#10204a",background:"white"};
 return <form onSubmit={submit}>
  <h3 style={{fontSize:24,marginBottom:14}}>Organisation pledge</h3>
  <p style={{lineHeight:1.7,marginBottom:18}}>Our organisation supports WPU&apos;s mission to advance an inclusive, accessible and globally connected pickleball community.</p>
  <label>Organisation name *<input style={input} name="name" required maxLength={160}/></label>
  <label>Country / territory *<input style={input} name="country" required maxLength={100}/></label>
  <label>Region *<select style={input} name="region" required defaultValue=""><option value="" disabled>Select region</option>{["Africa","Americas","Asia","Europe","Oceania"].map(x=><option key={x}>{x}</option>)}</select></label>
  <label>Organisation type *<select style={input} name="category" required defaultValue=""><option value="" disabled>Select type</option>{categories.map(x=><option key={x}>{x}</option>)}</select></label>
  <label>Official website *<input style={input} name="website" type="url" placeholder="https://" required maxLength={500}/></label>
  <label>Authorised representative *<input style={input} name="representative" required maxLength={160}/></label>
  <label>Representative email *<input style={input} name="email" type="email" required maxLength={254}/></label>
  <label style={{display:"none"}}>Leave blank<input name="company_fax" tabIndex={-1} autoComplete="off"/></label>
  <label style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:12}}><input type="checkbox" name="authority" value="yes" required/>I am authorised to pledge support on behalf of this organisation.</label>
  <label style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:16}}><input type="checkbox" name="publication" value="yes" required/>I authorise WPU to publish our organisation&apos;s name, website and approved logo after verification.</label>
  <button type="submit" disabled={state==="sending"} style={{background:"#0b205b",color:"white",padding:"16px 22px",border:0,cursor:"pointer",fontWeight:800}}>{state==="sending"?"Submitting…":"Submit pledge for approval →"}</button>
  {message&&<p role="status" style={{marginTop:15,color:state==="error"?"#a31d1d":"#185c38"}}>{message}</p>}
 </form>
}
