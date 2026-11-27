import { useState } from "react";
import { higherTiers, tierLabel, type Evidence, type HigherTier, type SanctionWorkspace } from "@/lib/events/sanction";
import type { EventDraft, EventRecord } from "@/lib/events/model";

const evidenceFields=[
  ["field","Expected field","Expected entrants, the level of competition and any qualifying route."],
  ["officiating","Officiating plan","Who will oversee matches and handle rules or disputes?"],
  ["verification","Results verification","Who will verify draws, scores and final results?"],
] as const;
const empty:Evidence={field:"",officiating:"",verification:""};

export default function Sanctions({draft,event,ready,workspace,update,refresh,loadError}:{
  draft:EventDraft;event:EventRecord|null;ready:boolean;workspace:SanctionWorkspace|undefined;update:(value:SanctionWorkspace)=>void;
  refresh:()=>void;loadError:string;
}) {
  const [tier,setTier]=useState<HigherTier>("T3");
  const [selected,setSelected]=useState<string[]>([]);
  const [evidence,setEvidence]=useState<Evidence>(empty);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");
  const options=draft.divisions.filter(d=>!workspace?.requests.some(r=>r.divisionId===d.id && r.matchesDraft &&
    (r.status==="pending" || (r.status==="approved" && r.tier<=tier))));
  const ids=selected.filter(id=>options.some(d=>d.id===id));
  async function submit() {
    if (busy || !event || !ready || !ids.length || !workspace?.available) return;
    setBusy(true);setError("");setMessage("");
    try {
      const response=await fetch("/api/event-studio/sanctions",{method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({event:event.id,revision:event.revision,tier,divisions:ids,evidence})});
      const data=await response.json();
      if (!response.ok) {setError(data.error||"Couldn’t send the request.");return;}
      update(data);setSelected([]);setEvidence(empty);
      setMessage(ids.length===1?"Division sent for WPU review.":ids.length+" divisions sent for WPU review.");
    } catch {setError("The request could not be confirmed. Check the review status before trying again.");}
    finally {setBusy(false);}
  }
  return <details className="es-comp-section es-higher-tier">
    <summary><strong>Request a higher tier</strong><span>T4 Development through T1 Championship</span></summary>
    <p>Local Open divisions don’t need a request. For a higher tier, select the divisions and tell WPU how you’ll run them.</p>
    {workspace?.available && ready && <button className="es-back" type="button" onClick={refresh}>Refresh review status</button>}
    {!event||!ready?<p role="status">Complete and save the tournament details and divisions to send a request.</p> :
      loadError?<div><p role="alert">{loadError}</p><button className="es-secondary" onClick={refresh}>Retry</button></div> :
      !workspace?<p role="status">Checking review availability…</p> :
      !workspace.available?<p>Higher-tier review is temporarily unavailable. You can still publish eligible Local Open divisions.</p> :
      <form className="es-fields es-tier-form" onSubmit={e=>{e.preventDefault();void submit();}}>
        <fieldset disabled={busy}>
          <label>Requested tier<select value={tier} onChange={e=>setTier(e.target.value as HigherTier)}>
            {higherTiers.map(t=><option key={t} value={t}>{tierLabel(t)}</option>)}
          </select></label>
        </fieldset>
        {options.length===0?<p>All divisions are already in review or approved at this level or higher.</p>:
          <fieldset className="es-tier-options" disabled={busy}><legend>Divisions to review</legend>{options.map(d=><label key={d.id}>
            <input type="checkbox" checked={ids.includes(d.id)} onChange={e=>setSelected(e.target.checked?[...ids,d.id]:ids.filter(id=>id!==d.id))}/>
            {d.name}
          </label>)}</fieldset>}
        {options.length>0 && <>
          <fieldset disabled={busy} className="es-fields">{evidenceFields.map(([key,label,hint])=><label key={key}>{label}<small>{hint}</small>
            <textarea required rows={2} maxLength={1000} value={evidence[key]} onChange={e=>setEvidence({...evidence,[key]:e.target.value})}/>
          </label>)}</fieldset>
          <button className="es-secondary" disabled={busy||!ids.length} type="submit">{busy?"Sending…":"Send to WPU"}</button>
        </>}
      </form>}
    {message && <p role="status">{message}</p>}{error && <p className="es-error" role="alert">{error}</p>}
  </details>;
}
