"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { displayDate } from "@/lib/events/model";
import { divisionKinds, drawFormats, isDoublesKind, rankingTracks, type DivisionKind, type DrawFormat, type RankingTrack } from "@/lib/events/competition";
import { tierLabel, type StaffDecision } from "@/lib/events/sanction";
import type { SanctionQueueItem } from "@/lib/events/sanction-service";

const endpoint="/api/control/competition-sanctions";
type Queue={items:SanctionQueueItem[];hasMore:boolean};

export default function CompetitionSanctionWorkspace() {
  const [filter,setFilter]=useState<"pending"|"history">("pending");
  const [offset,setOffset]=useState(0);
  const [serial,setSerial]=useState(0);
  const [loaded,setLoaded]=useState<{key:string;data?:Queue;error?:string}>();
  const [opened,setOpened]=useState<string|null>(null);
  const [note,setNote]=useState("");
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");
  const key=[filter,offset,serial].join(":");
  const state=loaded?.key===key?loaded:undefined;
  useEffect(()=>{
    const abort=new AbortController();
    fetch(endpoint+"?filter="+filter+"&offset="+offset,{signal:abort.signal}).then(async r=>{
      if (!r.ok) throw new Error();
      const data=await r.json() as Queue;
      if (!abort.signal.aborted) setLoaded({key,data});
    }).catch(()=>{if (!abort.signal.aborted) setLoaded({key,error:"Couldn’t load the competition queue. Check your staff session and retry."});});
    return ()=>abort.abort();
  },[filter,offset,key]);

  function navigate(target:"pending"|"history", page=0) {
    setFilter(target);setOffset(page);setOpened(null);setNote("");setMessage("");setError("");
  }
  async function decide(item:SanctionQueueItem,decision:StaffDecision) {
    if (busy || (decision==="approved" && !item.current) || (decision==="changes_requested" && !note.trim())) return;
    setBusy(true);setError("");setMessage("");
    try {
      const result=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({id:item.id,decision,note})});
      const body=await result.json();
      if (!result.ok) {setError(body.error||"Couldn’t save the decision.");return;}
      setOpened(null);setNote("");setSerial(n=>n+1);
      setMessage(decision==="approved"?tierLabel(item.tier)+" approved for "+item.division+".":"Changes requested for "+item.division+".");
    } catch {setError("Couldn’t confirm the decision. Reload the queue before trying again.");}
    finally {setBusy(false);}
  }
  return <section className="wc-box wc-sanction" aria-labelledby="wc-sanction-name">
    <div className="wc-section-head"><div>
      <h2 id="wc-sanction-name">Competition sanctions</h2>
      <p>Review higher-tier divisions. Eligible Local Open divisions receive T5 automatically when published.</p>
    </div><button type="button" disabled={busy} onClick={()=>setSerial(n=>n+1)}>Refresh queue</button></div>
    <div className="wc-sanction-toggle" aria-label="Request list">
      <button type="button" disabled={busy} aria-pressed={filter==="pending"} onClick={()=>navigate("pending")}>Under review</button>
      <button type="button" disabled={busy} aria-pressed={filter==="history"} onClick={()=>navigate("history")}>Decision history</button>
    </div>
    {message&&<p role="status">{message}</p>}{error&&<p className="wc-sanction-error" role="alert">{error}</p>}
    {!state?<p role="status">Loading requests…</p>:state.error?<p role="alert">{state.error}</p>:
      state.data?.items.length===0?<p>{filter==="pending"?"No requests need review.":"No decisions have been recorded."}</p>:null}
    {state?.data?.items.map(item=><article key={item.id} className="wc-sanction-item">
      <div className="wc-section-head">
        <div><p className="wc-label">{tierLabel(item.tier)} · {item.status==="pending"?"Under review":item.status==="approved"?"Approved":"Changes requested"}</p>
          <h3>{item.division}</h3><p>{item.title} · {item.organisation}</p></div>
        <button type="button" disabled={busy} aria-expanded={opened===item.id} aria-label={(opened===item.id?"Close ":"Review ")+item.division}
          onClick={()=>{setOpened(opened===item.id?null:item.id);setNote("");setError("");}}>{opened===item.id?"Close":"View details"}</button>
      </div>
      {item.status==="pending"&&!item.current&&<p className="wc-sanction-error">The submitted division details have changed. Request an updated submission instead of approving this version.</p>}
      {opened===item.id&&<div className="wc-sanction-detail">
        <dl>
          <div><dt>Event</dt><dd>{displayDate(item.date)} · {item.venue} ({item.timezone})</dd></div>
          <div><dt>Division</dt><dd>{divisionKinds[item.kind as DivisionKind].label} · {drawFormats[item.format as DrawFormat]} · {item.capacity} {divisionKinds[item.kind as DivisionKind].units}</dd></div>
          {item.minimumAge&&<div><dt>Minimum age</dt><dd>{item.minimumAge} on the event date{isDoublesKind(item.kind)?" for both partners":""}</dd></div>}
          <div><dt>Entry rule</dt><dd>{item.mode==="open"?"Open entry, no WPU ranking requirement":item.minimum+" WPU "+
            rankingTracks[item.track as RankingTrack]+" points on "+displayDate(item.cutoff??"")+
            (isDoublesKind(item.kind)?" for each partner independently":"")}</dd></div>
          <div><dt>Expected field</dt><dd>{item.evidence.field}</dd></div>
          <div><dt>Officiating plan</dt><dd>{item.evidence.officiating}</dd></div>
          <div><dt>Results verification</dt><dd>{item.evidence.verification}</dd></div>
          {item.note&&<div><dt>Decision note</dt><dd>{item.note}</dd></div>}
        </dl>
        {item.publicSlug&&<Link href={"/events/"+item.publicSlug} target="_blank" rel="noopener">Open published event page</Link>}
        {item.status==="pending"&&<div className="wc-sanction-decision">
          <label>Decision note<textarea maxLength={500} rows={3} value={note} onChange={e=>setNote(e.target.value)} disabled={busy}/>
            <small>Tell the organiser what to update if you request changes.</small></label>
          <div className="wc-sanction-toggle">
            <button disabled={busy||!note.trim()} type="button" onClick={()=>void decide(item,"changes_requested")}>Request changes</button>
            <button disabled={busy||!item.current} type="button" onClick={()=>void decide(item,"approved")}>Approve {item.tier}</button>
          </div>
        </div>}
      </div>}
    </article>)}
    {(offset>0||state?.data?.hasMore)&&<div className="wc-sanction-toggle">
      <button type="button" disabled={busy||offset===0} onClick={()=>navigate(filter,offset-20)}>Previous page</button>
      <button type="button" disabled={busy||!state?.data?.hasMore} onClick={()=>navigate(filter,offset+20)}>Next page</button>
    </div>}
  </section>;
}
