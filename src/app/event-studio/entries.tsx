import { useEffect, useRef, useState } from "react";
import { feeUnit, formatFee, registrationStatus, toMinorUnits, type Currency, type EntryStatus, type PilotKind, type Registration } from "@/lib/entries/model";
import type { EventRecord } from "@/lib/events/model";

type Choice={id:string;name:string;kind:PilotKind};
type Roster={more:boolean;items:{id:string;status:EntryStatus;lead:string;partner:string|null}[]};
type Workspace={payments:boolean;registered:Registration[];divisions:Choice[];roster?:Roster};
const endpoint="/api/event-studio/entries";

export default function Entries({event,dirty}:{event:EventRecord|null;dirty:boolean}){
  const [expanded,setExpanded]=useState(false);
  const [roster,setRoster]=useState("");
  const [offset,setOffset]=useState(0);
  const [load,setLoad]=useState(0);
  const [loaded,setLoaded]=useState<{key:string;data?:Workspace;error?:string}>();
  const [division,setDivision]=useState("");
  const [close,setClose]=useState("");
  const [paid,setPaid]=useState(false);
  const [amount,setAmount]=useState("");
  const [currency,setCurrency]=useState<Currency>("SGD");
  const [terms,setTerms]=useState("");
  const [contact,setContact]=useState("");
  const [feedback,setFeedback]=useState({error:false,text:""});
  const [busy,setBusy]=useState(false);
  const lock=useRef(false);
  const eventId=event?.id, revision=event?.revision, published=event?.publishedRevision;
  const key=[eventId,revision,published,roster,offset,load].join(":");
  useEffect(()=>{
    if(!expanded||!eventId||!published)return;
    const abort=new AbortController();
    const q=new URLSearchParams({event:eventId,...(roster?{division:roster,offset:String(offset)}:{})});
    fetch(endpoint+"?"+q,{signal:abort.signal}).then(async r=>{
      const data=await r.json();
      if(abort.signal.aborted)return;
      setLoaded(r.ok?{key,data}:{key,error:data.error||"Couldn’t load registration."});
    }).catch(()=>{if(!abort.signal.aborted)setLoaded({key,error:"Couldn’t load registration."});});
    return ()=>abort.abort();
  },[expanded,eventId,published,key,roster,offset]);
  const state=loaded?.key===key?loaded:undefined, workspace=state?.data;
  const choices=workspace?.divisions.filter(d=>!workspace.registered.some(r=>r.divisionId===d.id))??[];
  const selected=choices.find(d=>d.id===division)??choices[0];
  async function change(action:"open"|"pause"|"resume"|"reset",id:string){
    if(!eventId||lock.current)return;
    if(action==="reset"&&!window.confirm("Reset the fee, closing time and terms for this unused registration?"))return;
    const cents=paid?toMinorUnits(amount):0;
    const closesAt=Math.floor(new Date(close).getTime()/1000);
    if(action==="open"&&(cents===null||paid&&cents<50||!Number.isFinite(closesAt))){
      setFeedback({error:true,text:"Enter the closing time and a total paid fee of at least 0.50."});return;
    }
    lock.current=true;setBusy(true);setFeedback({error:false,text:""});
    try{
      const r=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({event:eventId,division:id,action,...(action==="open"?{closesAt,amount:cents,currency,terms,contact}:{})})});
      const data=await r.json();
      if(!r.ok){setFeedback({error:true,text:data.error||"Couldn’t update registration."});return;}
      setFeedback({error:false,text:action==="open"?"Registration is open. The event page now accepts entries.":action==="pause"?"New entries are paused.":action==="reset"?"Unused registration reset.":"New entries are open again."});
      if(action==="open"){setClose("");setAmount("");setPaid(false);setTerms("");}
      setLoad(n=>n+1);
    }catch{setFeedback({error:true,text:"Couldn’t confirm the update. Refresh first."});}
    finally{lock.current=false;setBusy(false);}
  }
  return <details className="es-comp-section es-entry-management" onToggle={e=>setExpanded(e.currentTarget.open)}>
    <summary><strong>Tournament registration</strong></summary>
    {!published?<p>Publish the event page before opening registration.</p>:
      state?.error?<p className="es-error" role="alert">{state.error}</p>:!workspace?<p role="status">Loading registrations…</p>:<>
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
        {dirty||published!==revision?<p>Publish the current division rules before opening new registrations.</p>:
          selected?<form className="es-fields" onSubmit={e=>{e.preventDefault();void change("open",selected.id);}}>
            <label>Division<select value={selected.id} onChange={e=>setDivision(e.target.value)}>
              {choices.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
            </select></label>
            <label>Close entries at <small>Time is in your device’s timezone.</small>
              <input type="datetime-local" required value={close} onChange={e=>setClose(e.target.value)}/></label>
            <label>Public organiser contact email<input type="email" required maxLength={254} value={contact} onChange={e=>setContact(e.target.value)}/></label>
            {workspace.payments?<label>Entry fee<select value={paid?"paid":"free"} onChange={e=>setPaid(e.target.value==="paid")}>
              <option value="free">Free</option><option value="paid">Paid</option>
            </select></label>:<p className="es-comp-help">Free entry is available. Paid checkout isn’t enabled for this organisation.</p>}
            {workspace.payments&&paid&&<div className="es-comp-edit-row">
              <label>Total fee {feeUnit(selected.kind)}<input type="text" inputMode="decimal" required value={amount} onChange={e=>setAmount(e.target.value)}/></label>
              <label>Currency<select value={currency} onChange={e=>setCurrency(e.target.value as Currency)}>
                <option value="SGD">SGD</option><option value="USD">USD</option>
              </select></label>
            </div>}
            <label>Cancellation terms <small>{paid?"Required for paid entries":"Optional"}</small>
              <textarea required={paid} rows={3} maxLength={1200} value={terms} onChange={e=>setTerms(e.target.value)}/></label>
            <p className="es-comp-help">Opening registration locks the division rules and fees. You can pause new entries at any time.</p>
            <button className="es-primary" type="submit" disabled={busy}>Open registration</button>
          </form>:<p>No other divisions are eligible for this pilot. Use an open-entry singles or doubles division without a starting-score handicap.</p>}
      </>}
    {feedback.text&&<p role={feedback.error?"alert":"status"} className={feedback.error?"es-error":undefined}>{feedback.text}</p>}
    {published&&<button className="es-back" disabled={busy} onClick={()=>setLoad(n=>n+1)}>Refresh registrations</button>}
  </details>;
}
