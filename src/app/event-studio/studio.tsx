"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { displayDate, emptyDraft, kinds, MAX_ACTIVITIES, publishIssues, type Activity, type ActivityKind, type EventDraft, type EventRecord, type Organisation } from "@/lib/events/model";
import { localTiers, type SanctionWorkspace } from "@/lib/events/sanction";
import PublicProgramme from "./programme";
import Entries from "./entries";
import Competition, { CompetitionStatus, EventDetails } from "./competition";

const templates: {title:string;description:string;kinds:ActivityKind[];competition?:boolean}[]=[
  {title:"Create a tournament",description:"Set up divisions and entry rules",kinds:[],competition:true},
  {title:"Clinic",description:"Coaching and skills sessions",kinds:["clinic"]},
  {title:"Community event",description:"Meetups, open days and socials",kinds:["social"]},
  {title:"Festival",description:"Put different activities on one programme",kinds:["tournament","clinic","social","information"]},
];
const kindEntries=Object.entries(kinds) as [ActivityKind,typeof kinds[ActivityKind]][];
function activity(kind: ActivityKind):Activity {
  return {id:crypto.randomUUID(),kind,title:kinds[kind].example,time:"",location:"",description:""};
}

export default function Studio({organisations,initialEvents}:{organisations:Organisation[];initialEvents:EventRecord[]}) {
  const [events,setEvents]=useState(initialEvents);
  const [organisation,setOrganisation]=useState(organisations[0].id);
  const [current,setCurrent]=useState<EventRecord|null>(null);
  const [draft,setDraft]=useState<EventDraft>(emptyDraft);
  const [view,setView]=useState<"list"|"edit"|"preview">("list");
  const [section,setSection]=useState<"programme"|"competition">("programme");
  const [audience,setAudience]=useState<"player"|"spectator">("player");
  const [openActivity,setOpenActivity]=useState<string|null>(null);
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");
  const [confirmation,setConfirmation]=useState<"publish"|"unpublish"|null>(null);
  const mutation=useRef(false);
  const [sanctions,setSanctions]=useState<{key:string;workspace?:SanctionWorkspace;error?:string}>();
  const [sanctionReload,setSanctionReload]=useState(0);
  const organiser=organisations.find(o=>o.id===organisation) ?? organisations[0];
  const dirty=!!current && JSON.stringify(current.draft)!==JSON.stringify(draft);
  const issues=publishIssues(draft);
  const sanctionId=view!=="list" && draft.divisions.length ? current?.id : undefined;
  const sanctionKey=sanctionId ? [sanctionId,current?.revision,current?.publishedRevision,sanctionReload].join(":") : "";
  useEffect(()=>{
    if (!sanctionId) return;
    const abort=new AbortController();
    fetch("/api/event-studio/sanctions?event="+encodeURIComponent(sanctionId),{signal:abort.signal})
      .then(async r=>{
        if (!r.ok) throw new Error();
        const workspace=await r.json() as SanctionWorkspace;
        if (!abort.signal.aborted) setSanctions({key:sanctionKey,workspace});
      })
      .catch(()=>{if (!abort.signal.aborted) setSanctions({key:sanctionKey,error:"Couldn’t load tier review status."});});
    return ()=>abort.abort();
  },[sanctionId,sanctionKey]);
  const sanction= sanctions?.key===sanctionKey?sanctions:undefined;
  const liveCount=Object.keys(sanction?.workspace?.live??{}).length;
  const previewTiers=issues.length?{}:!dirty && sanction?.workspace ? sanction.workspace.preview : localTiers(draft);
  const hasLocal=Object.keys(localTiers(draft)).length>0;
  const status=!current ? "Unsaved draft" : current.publishedRevision===null ? dirty ? "Unsaved changes" : "Saved draft" :
    current.publishedRevision!==current.revision || dirty ? "Public · unpublished edits" : "Published";
  const initialZone=()=>Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  function start(kinds:ActivityKind[],competition=false) {
    setCurrent(null);setDraft({...emptyDraft(),timezone:initialZone(),activities:kinds.map(activity)});
    setSection(competition?"competition":"programme");
    setView("edit");setMessage("");setError("");setOpenActivity(null);setConfirmation(null);
  }
  function open(event:EventRecord) {
    setCurrent(event);setDraft(event.draft);setOrganisation(event.organisation.id);
    setSection(event.draft.divisions.length?"competition":"programme");
    setView("edit");setMessage("");setError("");setConfirmation(null);setOpenActivity(null);
  }
  function change<K extends keyof EventDraft>(key:K,value:EventDraft[K]) {
    setDraft(d=>({...d,[key]:value}));setMessage("");setConfirmation(null);
  }
  function adjust(id:string,values:Partial<Activity>) {
    setDraft(d=>({...d,activities:d.activities.map(a=>a.id===id ? {...a,...values} : a)}));setMessage("");setConfirmation(null);
  }
  function add(kind:ActivityKind) {
    if (draft.activities.length>=MAX_ACTIVITIES) return;
    const a=activity(kind);change("activities",[...draft.activities,a]);setOpenActivity(a.id);
  }
  async function save(action:"create"|"save"|"publish"|"unpublish") {
    if (mutation.current) return;
    mutation.current=true;
    setBusy(true);setMessage("");setError("");setConfirmation(null);
    try {
      const request=action==="create" ? {action,organisation,draft} : {action,id:current?.id,revision:current?.revision,...(action==="save"?{draft}:{})};
      const response=await fetch("/api/event-studio",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(request)});
      const json=await response.json();
      if (!response.ok) { setError(json.error || "The change was not saved.");return; }
      const event=json.event as EventRecord;
      setEvents(xs=>[event,...xs.filter(x=>x.id!==event.id)]);
      // Unpublishing uses the saved event but must not discard unsaved editor changes.
      setCurrent(event);
      if (action!=="unpublish") setDraft(event.draft);
      setMessage(action==="publish"?"Published. The public page is ready to share.":action==="unpublish"?"Public page taken offline. The draft is still here.":"Draft saved.");
    } catch { setError("We couldn’t confirm the change. Check your connection and reload before trying again."); }
    finally { mutation.current=false;setBusy(false); }
  }
  function preview() {
    setAudience("player");setView("preview");setConfirmation(null);
    window.scrollTo({top:0});
  }
  function back() {
    if (view==="preview") {setView("edit");return;}
    if ((!current || dirty) && !window.confirm("Leave without saving your changes?")) return;
    setView("list");setMessage("");setError("");setConfirmation(null);
  }

  if(view==="list") return <div className="es-start">
    <section className="es-start-top"><div><p className="es-kicker">Organiser workspace</p><h1>What are we<br/>putting on?</h1><p>Start with a lineup. Make it yours as you go.</p></div>
    <div className="es-org-switch">{organisations.length>1 ? <>
      <label htmlFor="es-organisation">Hosting organisation</label>
      <select id="es-organisation" value={organisation} onChange={e=>setOrganisation(e.target.value)}>
        {organisations.map(o=><option value={o.id} key={o.id}>{o.name}</option>)}
      </select>
    </> : <div className="es-org-current"><span>Hosting organisation</span><strong>{organiser.name}</strong></div>}
      <p>This name appears on the public page.</p></div></section>
    <div className="es-section-heading"><h2>Start with a template</h2><button className="es-secondary" onClick={()=>start([])}>Start from scratch</button></div>
    <div className="es-templates">{templates.map((t,i)=><button className={"es-template es-kind-"+(t.kinds[0]??"tournament")} key={t.title} onClick={()=>start(t.kinds,t.competition)}>
      <span className="es-template-mark" aria-hidden="true">{["▤","✦","○","▦"][i]}</span><strong>{t.title}</strong><span>{t.description}</span></button>)}</div>
    <section className="es-saved"><h2>Events for {organiser.name}</h2>{!events.some(e=>e.organisation.id===organisation) && <p>No events yet. Start with a template above.</p>}
      {events.filter(e=>e.organisation.id===organisation).map(e=><button className="es-existing" key={e.id} onClick={()=>open(e)}>
        <span><strong>{e.draft.title || "Untitled event"}</strong><small>{displayDate(e.draft.date)}</small></span>
        <span className="es-pill">{e.publishedRevision===null?"Draft":e.publishedRevision===e.revision?"Published":"Unpublished edits"}</span></button>)}</section>
  </div>;

  const ordered=[...draft.activities].sort((a,b)=>(a.time||"99:99").localeCompare(b.time||"99:99"));
  return <div className="es-studio">
    <div className="es-toolbar"><button className="es-back" disabled={busy} onClick={back}>{view==="preview"?"Back to studio":"All events"}</button><span className="es-pill">{status}</span>
      <div className="es-actions">
        {view==="edit" ? <button className="es-secondary" disabled={busy} onClick={preview}>Preview</button> :
          <div className="es-switch" aria-label="Preview audience"><button aria-pressed={audience==="player"} onClick={()=>setAudience("player")}>Player</button><button aria-pressed={audience==="spectator"} onClick={()=>setAudience("spectator")}>Spectator</button></div>}
        <button className="es-primary" disabled={busy || !!current&&!dirty} onClick={()=>void save(current?"save":"create")}>{busy?"Working…":"Save draft"}</button>
      </div></div>
    {message && <p className="es-message" role="status">{message}</p>}{error && <p className="es-error" role="alert">{error}</p>}
    {view==="preview" ? <>
      {draft.divisions.length>0 && <aside className="es-comp-preview-status" aria-label="Preview only"><div><strong>{audience==="player"?"Player preview":"Spectator preview"}</strong><p>Nothing changes on your public page until you publish.</p></div><CompetitionStatus isPublic={current?.publishedRevision!=null} liveCount={liveCount} hasLocal={hasLocal}/></aside>}
      <PublicProgramme event={{organiser:organiser.name,programme:draft,tiers:previewTiers}} spectator={audience==="spectator"} preview/>
    </> : <>
      <nav className="es-studio-sections" aria-label="Event workspace">
        <button className="es-section-tab" disabled={busy} aria-pressed={section==="programme"} onClick={()=>setSection("programme")}>Programme</button>
        <button className="es-section-tab" disabled={busy} aria-pressed={section==="competition"} onClick={()=>setSection("competition")}>Competition</button>
      </nav>
      {section==="competition" ? <fieldset className="es-comp-shell" disabled={busy}><Competition draft={draft} change={change} isPublic={current?.publishedRevision!=null} preview={preview}
        event={current} ready={!!current && !dirty && !issues.length} workspace={sanction?.workspace}
        updateSanction={workspace=>setSanctions({key:sanctionKey,workspace})} refreshSanction={()=>setSanctionReload(n=>n+1)}
        sanctionError={sanction?.error??""}/>
        <Entries key={current?.id??"new"} event={current} dirty={dirty}/></fieldset> :
      <fieldset className="es-grid" disabled={busy}>
        <section className="es-work">
          <p className="es-kicker">The lineup · {organiser.name}</p><h1>Programme</h1><p>Give the day a shape. You can always change it.</p>
          {([true,false] as const).map(scheduled=>{
            const items=ordered.filter(a=>Boolean(a.time)===scheduled);
            return <div className="es-activities" key={String(scheduled)}>
              <h2>{scheduled?"Scheduled":"Unscheduled"}</h2>
              {!items.length && <p className="es-blank">{scheduled?"Add a time to see an activity on the published programme.":"Nothing unscheduled."}</p>}
              {items.map(a=><div className={"es-activity es-kind-"+a.kind} key={a.id}>
                <button className="es-activity-head" aria-expanded={openActivity===a.id} onClick={()=>setOpenActivity(openActivity===a.id?null:a.id)}><time>{a.time || "—"}</time>
                  <span><strong>{a.title || kinds[a.kind].label}</strong><small>{kinds[a.kind].label}{a.location?" · "+a.location:""}</small></span><span>{openActivity===a.id ? "Close" : "Edit"}</span></button>
                {openActivity===a.id && <div className="es-fields es-activity-edit">
                  <label>Activity name<input maxLength={100} value={a.title} onChange={e=>adjust(a.id,{title:e.target.value})}/></label>
                  <div className="es-pair"><label><span className="es-field-caption">Start time</span><input type="time" value={a.time} onChange={e=>adjust(a.id,{time:e.target.value})}/></label>
                    <label><span className="es-field-caption">Location <small>Optional</small></span><input maxLength={120} value={a.location} onChange={e=>adjust(a.id,{location:e.target.value})}/></label></div>
                  <label><span className="es-field-caption">Public details <small>Optional</small></span><textarea maxLength={350} rows={2} value={a.description} onChange={e=>adjust(a.id,{description:e.target.value})}/></label>
                  <div className="es-item-actions"><button className="es-back" onClick={()=>change("activities",draft.activities.filter(x=>x.id!==a.id))}>Remove activity</button><button className="es-secondary" onClick={()=>setOpenActivity(null)}>Done</button></div>
                </div>}
              </div>)}
            </div>;
          })}
          <div className="es-add"><h2>Add activity</h2><div>{kindEntries.map(([kind,meta])=><button className="es-secondary" key={kind} disabled={draft.activities.length>=MAX_ACTIVITIES} onClick={()=>add(kind)}>+ {kind==="tournament"?"Competition session":meta.label}</button>)}</div>{draft.activities.length===MAX_ACTIVITIES && <p>This release supports up to {MAX_ACTIVITIES} activities in one event.</p>}</div>
        </section>
        <EventDetails draft={draft} change={change}/>
      </fieldset>}
    </>}
    <section className="es-publish"><div><h2>Public page</h2>
      <p>{current?.publishedRevision!=null ? "People see the last version you published." : "Your event stays private until you publish it."}</p>
      <p>Unscheduled activities stay in your draft. Publishing sanctions eligible Local Open divisions at T5. It does not open registration.</p>
      {issues.length>0 && <ul>{issues.map(i=><li key={i}>{i}</li>)}</ul>}
      {!issues.length && (!current || dirty) && <p>Save your draft to publish these changes.</p>}
      {current?.publishedRevision!=null && <Link className="es-live-link" href={"/events/"+current.slug} target="_blank" rel="noopener">Open public page</Link>}</div>
      <div className="es-publish-buttons">
        {current?.publishedRevision!=null && <button className="es-secondary" disabled={busy} onClick={()=>setConfirmation("unpublish")}>Take offline</button>}
        <button className="es-primary" disabled={busy || !current || dirty || !!issues.length || current.publishedRevision===current.revision} onClick={()=>setConfirmation("publish")}>{current?.publishedRevision!=null?"Publish changes":"Publish event page"}</button>
      </div>
      {confirmation && <div className="es-confirm" role="group" aria-label="Confirm publication change">
        <p>{confirmation==="publish" ? "Make this saved event page public under "+organiser.name+"? Eligible Local Open divisions will be sanctioned at T5." : "Take the public page offline? The draft will still be available here."}</p>
        <button className="es-secondary" onClick={()=>setConfirmation(null)}>Cancel</button>
        <button className="es-primary" onClick={()=>void save(confirmation)}>{confirmation==="publish"?"Publish event":"Take page offline"}</button>
      </div>}
    </section>
  </div>;
}
