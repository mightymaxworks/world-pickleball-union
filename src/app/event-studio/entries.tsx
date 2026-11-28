import { useEffect, useRef, useState } from "react";
import { feeUnit, formatFee, parseRegistrationInput, registrationStatus, toMinorUnits, type Currency, type EntryStatus, type PilotKind, type Registration, type RegistrationSetup, type SavedRegistrationSetup } from "@/lib/entries/model";
import type { EventRecord } from "@/lib/events/model";

type Choice={id:string;name:string;kind:PilotKind};
type Roster={more:boolean;items:{id:string;status:EntryStatus;lead:string;partner:string|null}[]};
type Workspace={payments:boolean;setupReady:boolean;setups:SavedRegistrationSetup[];registered:Registration[];divisions:Choice[];roster?:Roster};
const endpoint="/api/event-studio/entries";

const defaultSetup:RegistrationSetup={closesAt:null,amount:0,currency:"SGD",terms:"",contact:""};
function localTime(seconds:number|null) {
  if(seconds===null)return "";
  const date=new Date(seconds*1000);
  return new Date(date.getTime()-date.getTimezoneOffset()*60_000).toISOString().slice(0,16);
}
function SetupForm({event,division,initial,payments,canOpen,onOpened}:{event:EventRecord;division:Choice;initial?:SavedRegistrationSetup;payments:boolean;canOpen:boolean;onOpened:()=>void}) {
  const starting=initial?.settings??defaultSetup;
  const [saved,setSaved]=useState(initial);
  const [close,setClose]=useState(()=>localTime(starting.closesAt));
  const [paid,setPaid]=useState(starting.amount!==0);
  const [amount,setAmount]=useState(starting.amount?String(starting.amount/100):"");
  const [currency,setCurrency]=useState(starting.currency);
  const [terms,setTerms]=useState(starting.terms);
  const [contact,setContact]=useState(starting.contact);
  const [busy,setBusy]=useState(false);
  const [feedback,setFeedback]=useState({error:false,text:""});
  const lock=useRef(false);
  const timestamp=close?Math.floor(new Date(close).getTime()/1000):null;
  const cents=paid?toMinorUnits(amount):0;
  const settings:RegistrationSetup={closesAt:timestamp,amount:cents,currency,terms:terms.trim(),contact:contact.trim()};
  const matches=!!saved&&JSON.stringify(saved.settings)===JSON.stringify(settings);
  const ready=!!parseRegistrationInput(settings)&&(!paid||payments);
  async function submit(action:"save-setup"|"open") {
    if(lock.current||action==="open"&&(!canOpen||!matches||!ready))return;
    if(paid&&amount.trim()&&(cents===null||cents<50)||timestamp!==null&&!Number.isFinite(timestamp)){
      setFeedback({error:true,text:"Enter a valid closing time and a total paid fee of at least 0.50, or leave them blank for now."});return;
    }
    lock.current=true;setBusy(true);setFeedback({error:false,text:""});
    try {
      const r=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({event:event.id,division:division.id,action,
        setupRevision:saved?.revision??0,...(action==="save-setup"?{settings,eventRevision:event.revision}:{})})});
      const data=await r.json();
      if(!r.ok){setFeedback({error:true,text:data.error||"Couldn’t update registration."});return;}
      if(action==="save-setup") {
        setSaved(data.setup);
        setFeedback({error:false,text:"Registration settings saved privately. Entries are still closed."});
      } else onOpened();
    }catch{setFeedback({error:true,text:"Couldn’t confirm the update. Refresh before trying again."});}
    finally{lock.current=false;setBusy(false);}
  }
  return <form className="es-fields" onSubmit={e=>{e.preventDefault();void submit("save-setup");}}>
    <fieldset className="es-fields es-setup-fields" disabled={busy}>
      <label>Close entries at <small>Time is in your device’s timezone.</small><input type="datetime-local" value={close} onChange={e=>setClose(e.target.value)}/></label>
      <label>Public organiser contact email<input type="email" maxLength={254} value={contact} onChange={e=>setContact(e.target.value)}/></label>
      <label>Payment method<select value={paid?"paid":"free"} onChange={e=>setPaid(e.target.value==="paid")}>
        <option value="free">No payment · free entry</option><option value="paid">Online card checkout</option>
      </select></label>
      {paid&&<><div className="es-comp-edit-row">
        <label>Total fee {feeUnit(division.kind)}<input type="text" inputMode="decimal" maxLength={8} value={amount} onChange={e=>setAmount(e.target.value)}/></label>
        <label>Currency<select value={currency} onChange={e=>setCurrency(e.target.value as Currency)}><option value="SGD">SGD</option><option value="USD">USD</option></select></label>
      </div>{!payments&&<p className="es-comp-help">You can save these settings, but card checkout isn’t connected for this organisation. Paid entries can’t open yet.</p>}</>}
      <label>Cancellation terms <small>{paid?"Required before opening paid entries":"Optional"}</small>
        <textarea rows={3} maxLength={1200} value={terms} onChange={e=>setTerms(e.target.value)}/></label>
    </fieldset>
    <div className="es-item-actions">
      <button className="es-primary" type="submit" disabled={busy||matches}>Save registration settings</button>
      {canOpen&&<button className="es-secondary" type="button" disabled={busy||!matches||!ready} onClick={()=>void submit("open")}>Open registration to players</button>}
    </div>
    <p className="es-comp-help">{!canOpen?"When the event and division rules are published, come back here to open registration. Publishing does not open entries.":
      !matches?"Save your settings before opening registration.":!ready?"To open entries, add a future closing time and a valid contact email. Paid entries also need a fee, terms and connected checkout.":
      "Opening takes entries live and locks the division rules and fees. You can pause new entries any time."}</p>
    {feedback.text&&<p role={feedback.error?"alert":"status"} className={feedback.error?"es-error":undefined}>{feedback.text}</p>}
  </form>;
}

export default function Entries({event,dirty,saveEvent}:{event:EventRecord|null;dirty:boolean;saveEvent:()=>void}){
  const [roster,setRoster]=useState("");
  const [offset,setOffset]=useState(0);
  const [load,setLoad]=useState(0);
  const [loaded,setLoaded]=useState<{key:string;data?:Workspace;error?:string}>();
  const [division,setDivision]=useState("");
  const [feedback,setFeedback]=useState({error:false,text:""});
  const [busy,setBusy]=useState(false);
  const lock=useRef(false);
  const eventId=event?.id, revision=event?.revision, published=event?.publishedRevision;
  const key=[eventId,revision,published,roster,offset,load].join(":");
  useEffect(()=>{
    if(!eventId)return;
    const abort=new AbortController();
    const q=new URLSearchParams({event:eventId,...(roster?{division:roster,offset:String(offset)}:{})});
    fetch(endpoint+"?"+q,{signal:abort.signal}).then(async r=>{
      const data=await r.json();
      if(abort.signal.aborted)return;
      setLoaded(r.ok?{key,data}:{key,error:data.error||"Couldn’t load registration."});
    }).catch(()=>{if(!abort.signal.aborted)setLoaded({key,error:"Couldn’t load registration."});});
    return ()=>abort.abort();
  },[eventId,key,roster,offset]);
  const state=loaded?.key===key?loaded:undefined, workspace=state?.data;
  const choices=workspace?.divisions.filter(d=>!workspace.registered.some(r=>r.divisionId===d.id))??[];
  const selected=choices.find(d=>d.id===division)??choices[0];
  async function change(action:"pause"|"resume"|"reset",id:string){
    if(!eventId||lock.current)return;
    if(action==="reset"&&!window.confirm("Remove this unused registration so you can edit its setup?"))return;
    lock.current=true;setBusy(true);setFeedback({error:false,text:""});
    try{
      const r=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({event:eventId,division:id,action})});
      const data=await r.json();
      if(!r.ok){setFeedback({error:true,text:data.error||"Couldn’t update registration."});return;}
      setFeedback({error:false,text:action==="pause"?"New entries are paused.":action==="reset"?"Unused registration removed.":"New entries are open again."});
      setLoad(n=>n+1);
    }catch{setFeedback({error:true,text:"Couldn’t confirm the update. Refresh first."});}
    finally{lock.current=false;setBusy(false);}
  }
  return <section className="es-comp es-registration" aria-label="Tournament registration">
    <div className="es-comp-section es-entry-management">
    <div><p className="es-kicker">Entries &amp; payments</p><h2>Registration settings</h2><p>Prepare fees and entry details privately. Opening registration is a separate step.</p></div>
    {!event || dirty ? <div><p>Save the event draft to work with the latest divisions. The event can stay private.</p>
      <button className="es-secondary" type="button" onClick={saveEvent}>Save event draft</button></div>:
      state?.error?<p className="es-error" role="alert">{state.error}</p>:!workspace?<p role="status">Loading registrations…</p>:<>
        {workspace.registered.length>0&&<h3>Manage entries</h3>}
        {workspace.registered.map(r=>{
          const counts=r.counts??{}, awaiting=(counts.invited??0)+(counts.offered??0)+(counts.ready??0)+(counts.paying??0);
          return <div className="es-entry-notice" key={r.divisionId}>
            <strong>{r.name}</strong>
            <p>{r.accepting?"Registration open":r.ended?"Registration closed":"Registration paused"} · {formatFee(r.fee)} {feeUnit(r.kind)}</p>
            <p>{counts.confirmed??0} of {r.capacity} confirmed · {awaiting} pending · {counts.waitlisted??0} waitlisted</p>
            {!r.ended&&<button className="es-secondary" disabled={busy} onClick={()=>void change(r.accepting?"pause":"resume",r.divisionId)}>
              {r.accepting?"Pause new entries":"Resume entries"}</button>}
            {!r.accepting&&Object.keys(counts).length===0&&<button className="es-back" disabled={busy} onClick={()=>void change("reset",r.divisionId)}>Reset unused registration</button>}
            <button className="es-back" disabled={busy} onClick={()=>{setOffset(0);setRoster(roster===r.divisionId?"":r.divisionId);}}>
              {roster===r.divisionId?"Hide entries":"View entries"}
            </button>
          </div>;
        })}
        {roster&&workspace.roster&&<div className="es-entry-notice">
          <h3>Division entries</h3>
          {!workspace.roster.items.length?<p>No entries yet.</p>:<ul className="es-entry-list">{workspace.roster.items.map(x=><li key={x.id}>
            <strong>{x.lead}{x.partner?" / "+x.partner:""}</strong><span>{registrationStatus[x.status]}</span>
          </li>)}</ul>}
          {(offset>0||workspace.roster.more)&&<div className="es-publish-buttons">
            <button className="es-secondary" disabled={offset===0} onClick={()=>setOffset(n=>n-50)}>Previous</button>
            <button className="es-secondary" disabled={!workspace.roster.more} onClick={()=>setOffset(n=>n+50)}>Next</button>
          </div>}
        </div>}
        {!workspace.setupReady?<p>Registration setup is temporarily unavailable. Your event and entries are unchanged.</p>:
          selected?<div className="es-registration-setup">
            <h3>{workspace.setups.some(s=>s.divisionId===selected.id)?"Edit saved setup":"Set up a division"}</h3>
            <label>Division<select value={selected.id} onChange={e=>setDivision(e.target.value)}>
              {choices.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
            </select></label>
            <SetupForm key={selected.id} event={event} division={selected} payments={workspace.payments}
              initial={workspace.setups.find(s=>s.divisionId===selected.id)} canOpen={published===revision}
              onOpened={()=>{setFeedback({error:false,text:"Registration is open. The event page now accepts entries."});setLoad(n=>n+1);}}/>
          </div>:<p>{workspace.registered.length?"All eligible divisions already have registration.":"In Competition, add an open-entry singles or doubles division without a starting-score handicap."}</p>}
      </>}
    {feedback.text&&<p role={feedback.error?"alert":"status"} className={feedback.error?"es-error":undefined}>{feedback.text}</p>}
    {event&&!dirty&&<button className="es-back" disabled={busy} onClick={()=>setLoad(n=>n+1)}>Refresh registrations</button>}
    </div>
  </section>;
}
