"use client";
import {useState,type FormEvent,type ReactNode} from "react";
export default function InquiryForm({type,children}:{type:"membership"|"competition";children:ReactNode}){
 const [state,setState]=useState<"idle"|"sending"|"success"|"error">("idle");
 const [message,setMessage]=useState("");
 async function submit(event:FormEvent<HTMLFormElement>){
  event.preventDefault();const form=event.currentTarget;
  const values=Object.fromEntries(new FormData(form).entries());
  setState("sending");setMessage("");
  try{const response=await fetch("/api/inquiries",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...values,form_type:type,consent:"yes"})});
   const body=await response.json();if(!response.ok)throw new Error(body.error||"Submission unavailable");
   form.reset();setState("success");setMessage("Your interest has been received. WPU will review your submission.");
  }catch(e){setState("error");setMessage(e instanceof Error?e.message:"Unable to submit");}
 }
 return <form className={type==="membership"?"mem-form":"comp-form"} onSubmit={submit}>
  <label style={{display:"none"}}>Leave blank<input name="company_fax" tabIndex={-1} autoComplete="off"/></label>
  {children}
  <p role="status" aria-live="polite" style={{color:state==="error"?"#b91c1c":"#166534",fontSize:14}}>{message}</p>
  <button type="submit" disabled={state==="sending"}>{state==="sending"?"SUBMITTING…":"SUBMIT INTEREST →"}</button>
 </form>;
}
