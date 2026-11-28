"use client";
import { useEffect, useRef, useState } from "react";
import { feeUnit, formatFee, registrationStatus, type EntryView, type Registration } from "@/lib/entries/model";

type State={hasBirthDate:boolean;entry:EntryView|null;invitedBy:string|null;accepting:boolean};
const endpoint="/api/events/entries";
export default function EntryForm({event,division,invite,plan,returned}:{
  event:string;division:string;invite?:string;plan:Registration;returned:boolean;
}){
  const [profile,setProfile]=useState<State>();
  const [birth,setBirth]=useState("");
  const [busy,setBusy]=useState(false);
  const [load,setLoad]=useState(0);
  const [error,setError]=useState("");
  const [copied,setCopied]=useState(false);
  const [withdraw,setWithdraw]=useState(false);
  const lock=useRef(false);
  const query=new URLSearchParams({event,division,...(invite?{invite}:{})}).toString();
  useEffect(()=>{
    const abort=new AbortController();
    let timer:ReturnType<typeof setTimeout>|undefined;
    async function fetchStatus(tries:number){
      try{
        const r=await fetch(endpoint+"?"+query,{signal:abort.signal});
        const body=await r.json();
        if(abort.signal.aborted)return;
        if(!r.ok){setError(body.error||"Couldn’t load registration.");return;}
        setProfile(body);
        if(tries>0&&body.entry?.status==="paying")timer=setTimeout(()=>void fetchStatus(tries-1),2000);
      }catch{if(!abort.signal.aborted)setError("Couldn’t load registration. Check your connection.");}
    }
    void fetchStatus(returned?5:0);
    return ()=>{abort.abort();clearTimeout(timer);};
  },[query,load,returned]);
  async function action(kind:string){
    if(lock.current)return;
    lock.current=true;setBusy(true);setError("");setWithdraw(false);
    try{
      const r=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({action:kind,event,division,invite,id:profile?.entry?.id,...(kind==="birthDate"?{birthDate:birth}:{})})});
      const data=await r.json();
      if(!r.ok){setError(data.error||"Registration could not be updated.");return;}
      if(typeof data.url==="string"){window.location.assign(data.url);return;}
      if(data.entry)setProfile(s=>s?{...s,entry:data.entry}:s);
      setLoad(n=>n+1);
    }catch{setError("Couldn’t confirm the change. Refresh your status before trying again.");}
    finally{lock.current=false;setBusy(false);}
  }
  async function copyInvite(){
    const code=profile?.entry?.invite;if(!code)return;
    const link=new URL(window.location.pathname,window.location.origin);
    link.searchParams.set("invite",code);
    try{await navigator.clipboard.writeText(link.href);setCopied(true);}
    catch{setError("Copy the invite link shown below.");}
  }
  const entry=profile?.entry;
  const current=entry&&!["withdrawn","expired"].includes(entry.status);
  return <div className="es-entry-panel">
    {error&&<p role="alert" className="es-error">{error}</p>}
    {!profile&&!error&&<p role="status">Checking your entry…</p>}
    {entry&&<div className="es-entry-notice" aria-live="polite">
      <strong>{registrationStatus[entry.status]}</strong>
      {entry.holdUntil&&<p>{entry.status==="invited"?"Invite expires":"Claim by"} {new Date(entry.holdUntil*1000).toLocaleString()}.</p>}
      {entry.status==="invited"&&<p>{entry.seatHeld?"A place is held until your partner accepts or the invite expires.":"The draw is full. If your partner accepts while it’s still full, your pair joins the waitlist."} Nobody pays before both players accept.</p>}
      {entry.status==="waitlisted"&&<p>You have not been charged. Check back here to claim a place if one opens.</p>}
      {entry.status==="paying"&&<p>{entry.canPay?"You started checkout. Resume it here if you haven’t paid.":"Your partner started checkout. You don’t need to pay."} Confirmation appears after the payment is verified.</p>}
      {entry.status==="confirmed"&&<p>{entry.kind==="singles"?"You’re in.":"Your pair is in."}{entry.fee.amount>0?" Payment confirmed.":""}</p>}
    </div>}
    {!current&&profile?.accepting&&(!invite||profile.invitedBy)&&(!profile.hasBirthDate?
      <form className="es-fields" onSubmit={e=>{e.preventDefault();void action("birthDate");}}>
        <p>Add your date of birth once to use your Passport for tournament entries. It isn’t shown on entry lists.</p>
        <label>Date of birth<input type="date" autoComplete="bday" required value={birth} onChange={e=>setBirth(e.target.value)}/></label>
        <button className="es-primary" disabled={busy} type="submit">Save and continue</button>
      </form>:
      <div className="es-entry-panel">
        {profile.invitedBy&&<p>{profile.invitedBy} invited you to enter as their partner. Accepting does not charge you.</p>}
        <button className="es-primary" disabled={busy} onClick={()=>void action(invite?"accept":"enter")}>
          {invite?"Accept partner invite":plan.kind!=="singles"?"Create pair and invite partner":plan.fee.amount?"Reserve and continue to payment":"Enter division"}
        </button>
      </div>)}
    {!current&&profile&&invite&&!profile.invitedBy&&<p>This invite has expired or was already used. Ask your partner for a new link.</p>}
    {entry?.invite&&entry.status==="invited"&&<div className="es-fields">
      <label>Link for your partner<input readOnly value={typeof window==="undefined"?"":window.location.origin+window.location.pathname+"?invite="+entry.invite} onFocus={e=>e.target.select()}/></label>
      <button className="es-primary" onClick={()=>void copyInvite()}>{copied?"Invite link copied":"Copy invite link"}</button>
    </div>}
    {entry?.status==="offered"&&<button className="es-primary" disabled={busy} onClick={()=>void action("claim")}>Claim place</button>}
    {entry?.canPay&&<button className="es-primary" disabled={busy} onClick={()=>void action("pay")}>
      {entry.status==="paying"?"Resume checkout":"Pay "+formatFee(entry.fee)+" "+feeUnit(entry.kind)}
    </button>}
    {entry&&current&&entry.status!=="paying"&&!(entry.status==="confirmed"&&entry.fee.amount>0)&&
      (withdraw?<div className="es-entry-notice"><p>{entry.kind==="singles"?"Withdraw your entry?":"Withdraw the entire pair?"}</p>
        <button className="es-secondary" disabled={busy} onClick={()=>void action("withdraw")}>Confirm withdrawal</button>
        <button className="es-back" onClick={()=>setWithdraw(false)}>Keep entry</button>
      </div>:<button className="es-back" disabled={busy} onClick={()=>setWithdraw(true)}>Withdraw entry</button>)}
    <button className="es-secondary" disabled={busy} onClick={()=>{setError("");setLoad(n=>n+1);}}>Refresh status</button>
  </div>;
}
