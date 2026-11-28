import { useEffect, useRef, useState } from "react";
import { canRegisterDivision, feeUnit, formatFee, registrationStatus, toMinorUnits, type Currency, type EntryStatus, type PilotKind, type Registration, type RegistrationSetup, type RegistrationSetupChange, type SavedRegistrationSetup } from "@/lib/entries/model";
import { registrationStage } from "@/lib/entries/workspace";
import type { EventRecord } from "@/lib/events/model";
import type { Division } from "@/lib/events/competition";

type Choice={id:string;name:string;kind:PilotKind};
type Roster={more:boolean;items:{id:string;status:EntryStatus;lead:string;partner:string|null}[]};
type Workspace={payments:boolean;setupReady:boolean;setups:SavedRegistrationSetup[];registered:Registration[];divisions:Choice[];roster?:Roster};
type Panel={kind:"overview"}|{kind:"edit";ids:string[]}|{kind:"open"|"manage";id:string};
const endpoint="/api/event-studio/entries";
const defaultSetup:RegistrationSetup={closesAt:null,amount:0,currency:"SGD",terms:"",contact:""};

function localTime(seconds:number|null) {
  if(seconds===null)return "";
  const date=new Date(seconds*1000);
  return new Date(date.getTime()-date.getTimezoneOffset()*60_000).toISOString().slice(0,16);
}
function displayDeadline(seconds:number,zone:string) {
  return new Intl.DateTimeFormat("en-SG",{dateStyle:"medium",timeStyle:"short",timeZone:zone}).format(new Date(seconds*1000));
}
function unavailableReason(division:Division) {
  if(canRegisterDivision(division))return undefined;
  if(division.kind==="team")return "Online team registration isn’t available.";
  if(division.entry.mode==="ranking")return "Online registration for ranking-gated divisions isn’t available.";
  return "Online registration for starting-score handicaps isn’t available.";
}

function SetupEditor({choices,setups,payments,busy,onSave,onCancel}:{
  choices:Choice[];setups:SavedRegistrationSetup[];payments:boolean;busy:boolean;
  onSave:(changes:RegistrationSetupChange[])=>void;onCancel:()=>void;
}) {
  const batch=choices.length>1;
  const initial=batch?undefined:setups.find(s=>s.divisionId===choices[0].id);
  const starting=initial?.settings??defaultSetup;
  const [close,setClose]=useState(()=>localTime(starting.closesAt));
  const [paid,setPaid]=useState(starting.amount!==0);
  const [playerFee,setPlayerFee]=useState(starting.amount&&feeUnit(choices[0].kind)==="per player"?String(starting.amount/100):"");
  const [pairFee,setPairFee]=useState(starting.amount&&feeUnit(choices[0].kind)==="per pair"?String(starting.amount/100):"");
  const [currency,setCurrency]=useState<Currency>(starting.currency);
  const [terms,setTerms]=useState(starting.terms);
  const [contact,setContact]=useState(starting.contact);
  const [error,setError]=useState("");
  const hasPlayers=choices.some(d=>feeUnit(d.kind)==="per player");
  const hasPairs=choices.some(d=>feeUnit(d.kind)==="per pair");
  const existing=new Map(setups.map(s=>[s.divisionId,s.revision]));
  const replace=choices.filter(d=>existing.has(d.id)).length;

  function save(){
    setError("");
    const closesAt=close?Math.floor(new Date(close).getTime()/1000):null;
    const playerAmount=paid?toMinorUnits(playerFee):0, pairAmount=paid?toMinorUnits(pairFee):0;
    if(closesAt!==null&&!Number.isFinite(closesAt)||paid&&(
      hasPlayers&&!!playerFee.trim()&&(playerAmount===null||playerAmount<50)||
      hasPairs&&!!pairFee.trim()&&(pairAmount===null||pairAmount<50)
    )){
      setError("Enter a valid deadline and a fee of at least 0.50, or leave the field blank for now.");return;
    }
    if(batch&&replace&&!window.confirm("Replace the saved settings for "+replace+" "+(replace===1?"selected division":"selected divisions")+"? Blank fields will replace existing values."))return;
    onSave(choices.map(d=>({divisionId:d.id,revision:existing.get(d.id)??0,settings:{
      closesAt,amount:feeUnit(d.kind)==="per player"?playerAmount:pairAmount,currency,terms,contact,
    }})));
  }

  return <form className="es-reg-card es-fields" onSubmit={e=>{e.preventDefault();save();}}>
    {batch&&<div className="es-reg-editor-context"><strong>Applying to {choices.length} divisions</strong>
      <ul className="es-reg-chips">{choices.map(d=><li key={d.id}>{d.name}</li>)}</ul>
      {replace>0&&<p>Saving will replace {replace} existing {replace===1?"setup":"setups"}, including fields left blank.</p>}
    </div>}
    <fieldset className="es-fields es-setup-fields" disabled={busy}>
      <div className="es-comp-edit-row es-reg-field-row">
        <label>Entry deadline <small>In your device’s time zone</small><input type="datetime-local" value={close} onChange={e=>setClose(e.target.value)}/></label>
        <label>Organiser contact email <small>Shown to players when entries open</small><input type="email" maxLength={254} value={contact} onChange={e=>setContact(e.target.value)}/></label>
      </div>
      <label>Entry payment<select value={paid?"paid":"free"} onChange={e=>setPaid(e.target.value==="paid")}>
        <option value="free">Free entry</option><option value="paid">Online card checkout</option>
      </select></label>
      {paid&&<><div className="es-comp-edit-row es-reg-fees">
        {hasPlayers&&<label>Fee per player<input inputMode="decimal" maxLength={8} value={playerFee} onChange={e=>setPlayerFee(e.target.value)}/></label>}
        {hasPairs&&<label>Fee per pair<input inputMode="decimal" maxLength={8} value={pairFee} onChange={e=>setPairFee(e.target.value)}/></label>}
        <label>Currency<select value={currency} onChange={e=>setCurrency(e.target.value as Currency)}>
          <option value="SGD">SGD</option><option value="USD">USD</option>
        </select></label>
      </div>{!payments&&<p className="es-comp-help">You can save a fee now. Paid entries can only open once card checkout is connected.</p>}</>}
      <label>Cancellation terms <small>{paid?"Required before opening paid entries":"Optional"}</small>
        <textarea rows={3} maxLength={1200} value={terms} onChange={e=>setTerms(e.target.value)}/></label>
    </fieldset>
    {error&&<p className="es-error" role="alert">{error}</p>}
    <div className="es-reg-footer">
      <p>Saving settings doesn’t open registration.</p>
      <div className="es-reg-actions"><button className="es-secondary" type="button" disabled={busy} onClick={onCancel}>Cancel</button>
        <button className="es-primary" type="submit" disabled={busy}>{busy?"Saving…":batch?"Save settings for "+choices.length+" divisions":"Save registration settings"}</button></div>
    </div>
  </form>;
}

export default function Entries({event,dirty,saveEvent,goCompetition,reviewEvent}:{
  event:EventRecord|null;dirty:boolean;saveEvent:()=>void;goCompetition:()=>void;reviewEvent:()=>void;
}){
  const [panel,setPanel]=useState<Panel>({kind:"overview"});
  const [selecting,setSelecting]=useState(false);
  const [selection,setSelection]=useState<string[]>([]);
  const [offset,setOffset]=useState(0);
  const [load,setLoad]=useState(0);
  const [loaded,setLoaded]=useState<{key:string;scope:string;data?:Workspace;error?:string}>();
  const [feedback,setFeedback]=useState({error:false,text:""});
  const [busy,setBusy]=useState(false);
  const lock=useRef(false);
  const heading=useRef<HTMLHeadingElement>(null);
  const feedbackRef=useRef<HTMLParagraphElement>(null);
  const focusNext=useRef(false);
  const eventId=event?.id, revision=event?.revision, published=event?.publishedRevision;
  const roster=panel.kind==="manage"?panel.id:"";
  const scope=[eventId,revision,published].join(":");
  const key=[scope,roster,offset,load].join(":");
  useEffect(()=>{
    if(!eventId)return;
    const abort=new AbortController();
    const q=new URLSearchParams({event:eventId,...(roster?{division:roster,offset:String(offset)}:{})});
    fetch(endpoint+"?"+q,{signal:abort.signal}).then(async r=>{
      const data=await r.json();
      if(abort.signal.aborted)return;
      setLoaded(r.ok?{key,scope,data}:{key,scope,error:data.error||"Couldn’t load registration."});
    }).catch(()=>{if(!abort.signal.aborted)setLoaded({key,scope,error:"Couldn’t load registration."});});
    return ()=>abort.abort();
  },[eventId,key,scope,roster,offset]);
  useEffect(()=>{
    if(!focusNext.current)return;
    heading.current?.focus({preventScroll:true});
    heading.current?.scrollIntoView({block:"start"});
    focusNext.current=false;
  },[panel]);
  useEffect(()=>{if(feedback.error)feedbackRef.current?.focus();},[feedback]);

  const fresh=loaded?.key===key;
  const workspace=loaded?.scope===scope?loaded.data:undefined;
  const page={date:event?.draft.date??"",timezone:event?.draft.timezone??"UTC",publishedCurrent:!!event&&published===revision&&!dirty,payments:workspace?.payments===true};
  const live=new Map(workspace?.registered.map(r=>[r.divisionId,r]));
  const setups=new Map(workspace?.setups.map(s=>[s.divisionId,s]));
  const eligible=new Map(workspace?.divisions.map(d=>[d.id,d]));
  const all=event?.draft.divisions??[];
  const rows=[...all.map(d=>({id:d.id,name:live.get(d.id)?.name??d.name,unavailable:unavailableReason(d)})),
    ...[...live.values()].filter(r=>!all.some(d=>d.id===r.divisionId)).map(r=>({id:r.divisionId,name:r.name,unavailable:undefined}))];
  const canConfigure=!!workspace?.setupReady&&!dirty&&fresh;
  const configurable=workspace?.divisions.filter(d=>!live.has(d.id))??[];
  const unconfigured=configurable.filter(d=>!setups.has(d.id));
  const chosen=selection.filter(id=>configurable.some(d=>d.id===id));
  const editing=panel.kind==="edit"?panel.ids.flatMap(id=>{
    const d=eligible.get(id);return d&&!live.has(id)?[d]:[];
  }):[];
  const selectedOpening=panel.kind==="open"?eligible.get(panel.id):undefined;
  const openingSetup=selectedOpening?setups.get(selectedOpening.id):undefined;
  const active=roster?live.get(roster):undefined;
  const activeRoster=fresh?workspace?.roster:undefined;
  const loadError=fresh?loaded?.error:undefined;

  function show(next:Panel){
    focusNext.current=true;setPanel(next);setOffset(0);setFeedback({error:false,text:""});
  }
  function done(message:string){
    show({kind:"overview"});setSelecting(false);setSelection([]);
    setFeedback({error:false,text:message});setLoad(n=>n+1);
  }
  async function mutate(payload:Record<string,unknown>,onSuccess:()=>void){
    if(!eventId||lock.current)return;
    lock.current=true;setBusy(true);setFeedback({error:false,text:""});
    try{
      const r=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({event:eventId,...payload})});
      const data=await r.json();
      if(!r.ok){setFeedback({error:true,text:data.error||"Couldn’t update registration."});return;}
      onSuccess();
    }catch{setFeedback({error:true,text:"Couldn’t confirm the change. Refresh before trying again."});}
    finally{lock.current=false;setBusy(false);}
  }
  function changeLive(action:"pause"|"resume"|"reset",registration:Registration){
    if(action==="reset"&&!window.confirm("Remove this unused registration? Its saved settings will be available to edit."))return;
    void mutate({action,division:registration.divisionId},()=>{
      if(action==="reset"){done("Unused registration removed. You can edit its setup.");return;}
      setFeedback({error:false,text:action==="pause"?"New entries paused.":"Registration reopened."});setLoad(n=>n+1);
    });
  }
  function backToDivisions(){setSelecting(false);setSelection([]);show({kind:"overview"});}
  const title=panel.kind==="edit"?editing.length===1?editing[0].name:"Edit selected divisions":
    panel.kind==="open"?selectedOpening?.name??"Open registration":panel.kind==="manage"?active?.name??"Manage entries":"Registration & payments";
  return <section className="es-comp es-registration" aria-labelledby="es-registration-title">
    <header className="es-reg-head">
      {panel.kind!=="overview"&&<button className="es-back" type="button" disabled={busy} onClick={backToDivisions}>← All divisions</button>}
      {panel.kind!=="overview"&&<p className="es-kicker">{panel.kind==="edit"?"Registration settings":panel.kind==="open"?"Open registration":"Manage entries"}</p>}
      <h1 id="es-registration-title" ref={heading} tabIndex={-1}>{title}</h1>
      {panel.kind==="overview"&&<p>Manage settings and entry status for each division.</p>}
    </header>
    {feedback.text&&<p ref={feedbackRef} tabIndex={-1} role={feedback.error?"alert":"status"} className={feedback.error?"es-error":"es-message"}>{feedback.text}</p>}
    {loadError&&<div className="es-reg-card"><p role="alert">{loadError}</p>
      <button className="es-secondary" type="button" onClick={()=>setLoad(n=>n+1)}>Try again</button></div>}
    {!event?<div className="es-reg-card"><h2>Save the event first</h2><p>The event can stay private while you set up registration.</p>
      <button className="es-secondary" type="button" onClick={saveEvent}>Save event draft</button></div>:
      !workspace&&!loadError?<p role="status">Loading divisions…</p>:workspace&&panel.kind==="overview"?<>
      {(dirty||!page.publishedCurrent)&&<div className="es-reg-context">
        <div><strong>{dirty?"Save your latest event edits":"Set up registration before publishing"}</strong>
          <p>{dirty?"Registration settings use the divisions in your saved event draft.":"Publish the current event page before opening entries. Publishing doesn’t open them automatically."}</p></div>
        {dirty?<button className="es-secondary" type="button" onClick={saveEvent}>Save event draft</button>:
          !page.publishedCurrent&&<button className="es-secondary" type="button" onClick={reviewEvent}>Review event page</button>}
      </div>}
      {!workspace.setupReady&&<p role="status">New registration setups are temporarily unavailable.</p>}
      <div className="es-reg-board" aria-busy={!fresh&&!loadError}>
        <div className="es-reg-board-head"><div><h2>Divisions</h2><p>{selecting?chosen.length+" selected":rows.length+" total"}</p></div>
          <div className="es-reg-actions">{selecting?<>
            {unconfigured.length>0&&<button className="es-back" type="button" onClick={()=>setSelection(unconfigured.map(d=>d.id))}>Select unconfigured</button>}
            <button className="es-secondary" type="button" onClick={()=>{setSelecting(false);setSelection([]);}}>Cancel selection</button>
            <button className="es-primary" type="button" disabled={!chosen.length||!canConfigure} onClick={()=>show({kind:"edit",ids:chosen})}>Edit selected{chosen.length?" ("+chosen.length+")":""}</button>
          </>:configurable.length>1&&<button className="es-secondary" type="button" disabled={!canConfigure} onClick={()=>setSelecting(true)}>Set up multiple divisions</button>}</div>
        </div>
        {!rows.length?<div className="es-reg-empty"><p>No divisions yet. Add them in Competition before setting up entries.</p>
          <button type="button" className="es-secondary" onClick={goCompetition}>Go to Competition</button></div>:
          <ul className="es-reg-divisions" aria-label="Divisions">{rows.map(d=>{
            const registration=live.get(d.id), setup=setups.get(d.id), choice=eligible.get(d.id);
            const canEdit=canConfigure&&!registration&&!!choice;
            const {stage,label,detail}=registrationStage({live:registration,settings:setup?.settings,unavailable:d.unavailable,page});
            const fee=registration?.fee??(typeof setup?.settings.amount==="number"?{amount:setup.settings.amount,currency:setup.settings.currency}:undefined);
            const kind=registration?.kind??choice?.kind;
            const count=registration?.counts;
            return <li className="es-reg-division" key={d.id}>
              {selecting&&<div className="es-reg-select">{canEdit&&<input type="checkbox" aria-label={"Select "+d.name}
                checked={chosen.includes(d.id)} onChange={e=>setSelection(e.target.checked?[...chosen,d.id]:chosen.filter(id=>id!==d.id))}/>}</div>}
              <div className="es-reg-row-name"><h3>{d.name||"Unnamed division"}</h3>
                {registration?<p>{count?.confirmed??0} of {registration.capacity} confirmed{count?.waitlisted?" · "+count.waitlisted+" waitlisted":""}</p>:
                  fee&&kind?<p>{formatFee(fee)}{fee.amount>0?" "+feeUnit(kind):""}</p>:null}</div>
              <div className="es-reg-row-status"><span className="es-reg-badge" data-stage={stage}>{label}</span>{detail&&<p>{detail}</p>}</div>
              {!selecting&&<div className="es-reg-actions es-reg-row-actions">
                {registration?<button type="button" className="es-secondary" aria-label={"Manage entries for "+d.name} onClick={()=>show({kind:"manage",id:d.id})}>Manage entries</button>:canEdit&&<>
                  {stage==="ready"&&<button type="button" className="es-primary" aria-label={"Open registration for "+d.name} onClick={()=>show({kind:"open",id:d.id})}>Open registration</button>}
                  <button type="button" className={stage==="ready"?"es-back":"es-secondary"} aria-label={(setup?"Edit settings for ":"Set up ")+d.name}
                    onClick={()=>show({kind:"edit",ids:[d.id]})}>{setup?"Edit settings":"Set up"}</button>
                </>}
              </div>}
            </li>;
          })}</ul>}
      </div>
    </>:workspace&&panel.kind==="edit"?editing.length===panel.ids.length&&!dirty?
      <SetupEditor key={panel.ids.join(",")} choices={editing} setups={workspace.setups} payments={workspace.payments} busy={busy||!fresh}
        onCancel={backToDivisions} onSave={changes=>void mutate({action:"save-setups",eventRevision:revision,setups:changes},
          ()=>done(changes.length===1?"Registration settings saved.":changes.length+" division setups saved."))}/>:<p>This selection is no longer editable. Return to all divisions to check its status.</p>:
    workspace&&panel.kind==="open"?selectedOpening&&openingSetup&&registrationStage({settings:openingSetup.settings,page}).stage==="ready"?
      <div className="es-reg-card">
        <h2>Confirm opening</h2><p>Players will be able to enter this division. The published division rules and entry fee will be locked.</p>
        <dl className="es-reg-facts">
          <div><dt>Entry fee</dt><dd>{formatFee({amount:openingSetup.settings.amount!,currency:openingSetup.settings.currency})} {feeUnit(selectedOpening.kind)}</dd></div>
          <div><dt>Entry deadline</dt><dd>{displayDeadline(openingSetup.settings.closesAt!,page.timezone)} · {page.timezone}</dd></div>
        </dl>
        <div className="es-reg-actions"><button type="button" className="es-secondary" disabled={busy} onClick={backToDivisions}>Cancel</button>
          <button type="button" className="es-primary" disabled={busy||!fresh} onClick={()=>void mutate({
            action:"open",division:selectedOpening.id,setupRevision:openingSetup.revision},()=>done("Registration opened for "+selectedOpening.name+"."))}>{busy?"Opening…":"Confirm and open registration"}</button></div>
      </div>:<p>This division isn’t ready to open. Return to all divisions to check its status.</p>:
    workspace&&panel.kind==="manage"&&active?<div className="es-reg-card">
      <dl className="es-reg-facts">
        <div><dt>Status</dt><dd>{registrationStage({live:active,page}).label}</dd></div>
        <div><dt>Entry fee</dt><dd>{formatFee(active.fee)} {feeUnit(active.kind)}</dd></div>
        <div><dt>Confirmed</dt><dd>{active.counts?.confirmed??0} of {active.capacity}</dd></div>
        <div><dt>Pending</dt><dd>{(active.counts?.invited??0)+(active.counts?.offered??0)+(active.counts?.ready??0)+(active.counts?.paying??0)}</dd></div>
        <div><dt>Waitlisted</dt><dd>{active.counts?.waitlisted??0}</dd></div>
      </dl>
      <div className="es-reg-actions">
        {!active.ended&&published!==null&&<button className="es-secondary" type="button" disabled={busy||!fresh} onClick={()=>changeLive(active.accepting?"pause":"resume",active)}>{active.accepting?"Pause new entries":"Resume entries"}</button>}
        {!active.accepting&&!Object.keys(active.counts??{}).length&&<button className="es-back" type="button" disabled={busy||!fresh} onClick={()=>changeLive("reset",active)}>Reset unused registration</button>}
      </div>
      {!active.ended&&published===null&&<p>Publish the event page before resuming entries.</p>}
      <div className="es-reg-roster-head"><h2>Entries</h2>
        <button type="button" className="es-back" disabled={busy||!fresh} onClick={()=>setLoad(n=>n+1)}>Refresh entries</button></div>
      {!activeRoster?<p role="status">Loading entries…</p>:!activeRoster.items.length?<p>No entries yet.</p>:<ul className="es-entry-list">
        {activeRoster.items.map(x=><li key={x.id}><strong>{x.lead}{x.partner?" / "+x.partner:""}</strong><span>{registrationStatus[x.status]}</span></li>)}
      </ul>}
      {(offset>0||activeRoster?.more)&&<div className="es-reg-actions">
        <button type="button" className="es-secondary" disabled={busy||!fresh||offset===0} onClick={()=>setOffset(n=>n-50)}>Previous</button>
        <button type="button" className="es-secondary" disabled={busy||!fresh||!activeRoster?.more} onClick={()=>setOffset(n=>n+50)}>Next</button>
      </div>}
    </div>:null}
  </section>;
}
