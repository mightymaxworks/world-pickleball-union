import { useState } from "react";
import {
  changeDoublesCategory, changeSinglesCategory, describeEntry, divisionKinds, doublesCategoryLabel, doublesKinds, drawFormats, isDoublesKind, isSinglesKind,
  MAX_DIVISION_CAPACITY, MAX_DIVISION_NAME, MAX_DIVISIONS,
  newDivision, nextDivisionName, planDivisions, rankingTracks, singlesCategoryLabel, singlesKinds, tracksFor, validMinimumAge,
  type Division, type DivisionKind, type DrawFormat, type RankingTrack,
} from "@/lib/events/competition";
import { displayDate, type EventDraft, type EventRecord } from "@/lib/events/model";
import { canSanctionDivision, tierLabel, type SanctionWorkspace } from "@/lib/events/sanction";
import Sanctions from "./sanctions";
import { StartingScoreSettings } from "./starting-score";

type Update = <K extends keyof EventDraft>(key:K,value:EventDraft[K])=>void;
const kinds:readonly DivisionKind[]=[...singlesKinds,...doublesKinds,"team"];
const label=(kind:DivisionKind)=>isSinglesKind(kind)?singlesCategoryLabel(kind):isDoublesKind(kind)?doublesCategoryLabel(kind):divisionKinds[kind].label;
const agePresets=[null,35,50,60] as const;

function BulkDivisions({existing,onAdd}:{existing:Division[];onAdd:(divisions:Division[])=>void}) {
  const [categories,setCategories]=useState<DivisionKind[]>([]);
  const [ages,setAges]=useState<(number|null)[]>([null]);
  const [skipped,setSkipped]=useState<string[]>([]);
  const rows=planDivisions(categories,ages,existing), selected=rows.filter(d=>!skipped.includes(d.id));
  const available=MAX_DIVISIONS-existing.length;
  return <details className="es-bulk"><summary>Add multiple divisions</summary>
    <div className="es-bulk-content">
      <fieldset className="es-choice-set"><legend>Categories</legend><div className="es-choice-grid">
        {kinds.map(kind=><label key={kind}><input type="checkbox" checked={categories.includes(kind)} onChange={e=>{
          setCategories(e.target.checked?[...categories,kind]:categories.filter(k=>k!==kind));
          setSkipped(keys=>keys.filter(key=>!key.startsWith(kind+":")));
        }}/>{label(kind)}</label>)}
      </div></fieldset>
      <fieldset className="es-choice-set"><legend>Age brackets</legend><div className="es-choice-grid">
        {agePresets.map(age=><label key={age??"all"}><input type="checkbox" checked={ages.includes(age)} onChange={e=>{
          setAges(e.target.checked?[...ages,age]:ages.filter(a=>a!==age));
          setSkipped(keys=>keys.filter(key=>!key.endsWith(":"+(age??"all"))));
        }}/>{age===null?"All ages":age+"+"}</label>)}
      </div><p>Minimum age is measured on the event date. Team presets use All ages.</p></fieldset>
      {rows.length>0?<fieldset className="es-choice-set"><legend>Preview · {selected.length} selected</legend><div className="es-choice-grid">
        {rows.map(d=><label key={d.id}><input type="checkbox" checked={!skipped.includes(d.id)} onChange={e=>setSkipped(e.target.checked?skipped.filter(k=>k!==d.id):[...skipped,d.id])}/>
          <span>{d.name}<small>{d.capacity} {divisionKinds[d.kind].units}</small></span></label>)}
      </div></fieldset>:<p>Select a category and an age bracket to preview divisions.</p>}
      {selected.length>available&&<p role="alert">Choose up to {available} more divisions for this event.</p>}
      <button type="button" className="es-primary" disabled={!selected.length||selected.length>available} onClick={()=>{
        onAdd(selected.map(d=>({...d,id:crypto.randomUUID()})));setCategories([]);setSkipped([]);
      }}>Add {selected.length||""} {selected.length===1?"division":"divisions"} to draft</button>
    </div>
  </details>;
}

export function CompetitionStatus({isPublic,liveCount=0,hasLocal=false}:{isPublic:boolean;liveCount?:number;hasLocal?:boolean}) {
  return <dl className="es-comp-status" aria-label="Competition status">
    <div><dt>Event page</dt><dd>{isPublic?"Public":"Private draft"}</dd></div>
    <div><dt>WPU sanction</dt><dd>{liveCount ? liveCount+" sanctioned" : hasLocal ? "T5 on publish" : "Not sanctioned"}</dd></div>
  </dl>;
}

export function EventDetails({draft,change,compact=false}:{draft:EventDraft;change:Update;compact?:boolean}) {
  const extra=<>
    <label>Time zone<input list="es-timezones" maxLength={100} value={draft.timezone} onChange={e=>change("timezone",e.target.value)}/></label>
    <datalist id="es-timezones">{["UTC",...Intl.supportedValuesOf("timeZone")].map(z=><option key={z} value={z}/>)}</datalist>
    <label><span className="es-field-caption">Public introduction <small>Optional</small></span><textarea rows={3} maxLength={700} value={draft.description} onChange={e=>change("description",e.target.value)}/></label>
  </>;
  const basics=<>
    <label>Event name<input placeholder="Rally Day" maxLength={100} value={draft.title} onChange={e=>change("title",e.target.value)}/></label>
    <label>Date<input type="date" value={draft.date} onChange={e=>change("date",e.target.value)}/></label>
    <label>Venue<input placeholder="Court or venue name" maxLength={160} value={draft.venue} onChange={e=>change("venue",e.target.value)}/></label>
  </>;
  return compact
    ? <section className="es-fields es-comp-basics" aria-labelledby="es-tournament-details">
        <h2 id="es-tournament-details">Tournament details</h2>
        <div className="es-comp-field-row">{basics}</div>
        <details className="es-comp-more"><summary>More event details</summary><div className="es-fields">{extra}</div></details>
      </section>
    : <aside className="es-fields es-details"><h2>Event details</h2>{basics}{extra}</aside>;
}

export default function Competition({
  draft, change, isPublic, preview, event, ready, workspace, updateSanction, refreshSanction, sanctionError,
}: {draft:EventDraft;change:Update;isPublic:boolean;preview:()=>void;event:EventRecord|null;ready:boolean;workspace:SanctionWorkspace|undefined;
    updateSanction:(value:SanctionWorkspace)=>void;refreshSanction:()=>void;sanctionError:string}) {
  const [editing,setEditing]=useState<string|null>(null);
  const [announcement,setAnnouncement]=useState("");
  const atLimit=draft.divisions.length>=MAX_DIVISIONS;
  function add(kind:DivisionKind) {
    if (atLimit) return;
    const division=newDivision(kind,crypto.randomUUID(),draft.divisions);
    change("divisions",[...draft.divisions,division]);
    setAnnouncement(division.name+" added. You can preview or edit the division.");
  }
  function update(division:Division,patch:Partial<Division>) {
    change("divisions",draft.divisions.map(d=>d.id===division.id?{...d,...patch}:d));
  }
  function duplicate(division:Division) {
    if (atLimit) return;
    const name=nextDivisionName(division.name,draft.divisions);
    const clone={...division,id:crypto.randomUUID(),name};
    const index=draft.divisions.findIndex(d=>d.id===division.id);
    change("divisions",[...draft.divisions.slice(0,index+1),clone,...draft.divisions.slice(index+1)]);
    setEditing(clone.id);
    setAnnouncement(name+" added.");
  }
  return <div className="es-comp">
    <header className="es-comp-header">
      <div><p className="es-kicker">Event Studio</p><h1>Competition</h1><p>Set up the divisions players can enter. Add schedule highlights in Programme when you’re ready.</p></div>
      <CompetitionStatus isPublic={isPublic} liveCount={Object.keys(workspace?.live??{}).length} hasLocal={draft.divisions.some(d=>d.entry.mode==="open"&&canSanctionDivision(d))}/>
    </header>
    <EventDetails draft={draft} change={change} compact/>
    <section className="es-comp-section" aria-labelledby="es-add-division">
      <div className="es-comp-section-head"><div><h2 id="es-add-division">Add divisions</h2><p>Pick one preset or build several from categories and age brackets.</p></div></div>
      {!atLimit&&<BulkDivisions existing={draft.divisions} onAdd={divisions=>{
        change("divisions",[...draft.divisions,...divisions]);setAnnouncement(divisions.length+" divisions added to the draft.");
      }}/>}
      <div className="es-comp-presets">
        {kinds.map(kind=><button key={kind} className="es-comp-preset" disabled={atLimit} onClick={()=>add(kind)}>
          <span className="es-comp-mark" aria-hidden="true">{isDoublesKind(kind)?"2":isSinglesKind(kind)?"1":"+"}</span><span><strong>{label(kind)}</strong>
          <small>{kind==="doubles"||kind==="singles"?"No gender category":divisionKinds[kind].description}</small></span>
        </button>)}
      </div>
      {atLimit && <p>This event has reached the limit of {MAX_DIVISIONS} divisions.</p>}
      <p role="status" className="es-sr-only">{announcement}</p>
    </section>
    {!!draft.divisions.length && <section className="es-comp-section es-comp-list" aria-labelledby="es-divisions">
      <div className="es-comp-section-head"><h2 id="es-divisions">Your divisions <span>{draft.divisions.length}</span></h2></div>
      {draft.divisions.map(d=>{
        const meta=divisionKinds[d.kind], isEditing=editing===d.id, title=d.name.trim() || meta.label;
        const mode=d.entry.mode, entry=d.entry;
        const tracks=tracksFor[d.kind], requests=workspace?.requests.filter(r=>r.divisionId===d.id)??[];
        const latest=ready?requests.find(r=>r.matchesDraft):undefined, liveTier=workspace?.live[d.id];
        const plannedTier=ready?workspace?.preview[d.id]:undefined, participation=!canSanctionDivision(d);
        return <article className="es-comp-division" key={d.id}>
          <div className="es-comp-division-head">
            <div><p className="es-kicker">{meta.label}</p><h3>{title}</h3>
              <p>{drawFormats[d.format]}{d.capacity===null?"":" · "+d.capacity+" "+meta.units}</p>
              <p>{describeEntry(d,displayDate)}</p>
              <p className="es-division-sanction">
                {liveTier ? "Live · WPU-sanctioned "+tierLabel(liveTier) : plannedTier && plannedTier!=="T5" ?
                  "Approved · "+tierLabel(plannedTier)+" on publish" : d.entry.mode==="open"&&!participation?"T5 Local on publish":"Not sanctioned"}
              </p>
              {participation && <p>Starting-score handicap · Participation only</p>}
              {latest?.status==="pending" && <p>{tierLabel(latest.tier)} · Under review</p>}
              {latest?.status==="changes_requested" && <p><strong>{tierLabel(latest.tier)} · Changes requested.</strong> {latest.note}</p>}
              {!latest && ready && requests.length>0 && !requests.some(r=>r.matchesDraft) &&
                <p>Previous tier reviews were for different division details.</p>}
            </div>
            <button className="es-secondary" aria-expanded={isEditing} aria-label={(isEditing?"Close ":"Edit ")+title} onClick={()=>setEditing(isEditing?null:d.id)}>{isEditing?"Done":"Edit"}</button>
          </div>
          {isEditing && <div className="es-fields es-comp-division-edit">
            {isSinglesKind(d.kind) && <label>Singles category<select value={d.kind} onChange={e=>{
              if (isSinglesKind(e.target.value)) update(d,changeSinglesCategory(d,e.target.value,draft.divisions));
            }}>{singlesKinds.map(kind=><option key={kind} value={kind}>{singlesCategoryLabel(kind)}</option>)}</select></label>}
            {isDoublesKind(d.kind) && <label>Doubles category<select value={d.kind} onChange={e=>{
              if (isDoublesKind(e.target.value)) update(d,changeDoublesCategory(d,e.target.value,draft.divisions));
            }}>
              {doublesKinds.map(kind=><option key={kind} value={kind}>{doublesCategoryLabel(kind)}</option>)}
            </select></label>}
            <label>Division name<input maxLength={MAX_DIVISION_NAME} value={d.name} onChange={e=>update(d,{name:e.target.value})}/></label>
            <div className="es-comp-edit-row">
              <label>Format<select value={d.format} onChange={e=>update(d,{format:e.target.value as DrawFormat})}>
                {Object.entries(drawFormats).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
              <label>Capacity ({meta.units})<input type="number" inputMode="numeric" min={2} max={MAX_DIVISION_CAPACITY} step={1} value={d.capacity??""} onChange={e=>{const n=e.target.valueAsNumber;update(d,{capacity:Number.isSafeInteger(n)&&n>=0?n:null});}}/></label>
            </div>
            {d.kind!=="team"&&<label>Minimum age <small>Optional · measured on the event date</small>
              <input type="number" inputMode="numeric" min={1} max={120} step={1} value={d.minimumAge??""} onChange={e=>{
                const n=e.target.valueAsNumber;if(e.target.value===""||validMinimumAge(n))update(d,{minimumAge:e.target.value===""?undefined:n});
              }}/></label>}
            <label>How do players qualify?<select value={mode} onChange={e=>update(d,{entry:e.target.value==="ranking"?{mode:"ranking",track:tracks.length===1?tracks[0]:null,minimum:null,cutoffDate:""}:{mode:"open"}})}>
              <option value="open">Open entry</option><option value="ranking">WPU ranking points</option>
            </select></label>
            {entry.mode==="ranking" && <>
              <div className="es-comp-edit-row es-comp-ranking-row">
                <label>WPU leaderboard<select value={entry.track??""} onChange={e=>update(d,{entry:{...entry,track:(e.target.value||null) as RankingTrack|null}})}>
                  <option value="">Choose a leaderboard</option>{tracks.map(track=><option key={track} value={track}>{rankingTracks[track]}</option>)}
                </select></label>
                <label>Minimum WPU points<input type="number" inputMode="numeric" min={1} step={1} value={entry.minimum??""} onChange={e=>{const n=e.target.valueAsNumber;update(d,{entry:{...entry,minimum:Number.isSafeInteger(n)&&n>=0?n:null}});}}/></label>
                <label>Ranking cutoff date<input type="date" max={draft.date||undefined} value={entry.cutoffDate} onChange={e=>update(d,{entry:{...entry,cutoffDate:e.target.value}})}/></label>
              </div>
              <p className="es-comp-help">{isDoublesKind(d.kind)?"Both partners must meet the minimum on their own. ":""}This shows the entry rule only. Eligibility checks begin with registration.</p>
            </>}
            {d.kind==="doubles" && <StartingScoreSettings plan={d.startingScore} change={startingScore=>update(d,{startingScore})}/>}
            <div className="es-comp-edit-actions">
              <button className="es-secondary" disabled={atLimit} onClick={()=>duplicate(d)}>Duplicate division</button>
              <button className="es-back" onClick={()=>{change("divisions",draft.divisions.filter(other=>other.id!==d.id));setEditing(null);setAnnouncement(title+" removed.");}}>Remove division</button>
            </div>
          </div>}
        </article>;
      })}
    </section>}
    {!!draft.divisions.length && <Sanctions key={event?.id??"new"} draft={draft} event={event} ready={ready} workspace={workspace} update={updateSanction}
      refresh={refreshSanction} loadError={sanctionError}/>}
    <section className="es-comp-next">
      <div><h2>See it as a player</h2><p>Check the event details and entry rules. A preview doesn’t publish the page or open registration.</p></div>
      <button className="es-primary" onClick={preview}>Preview as a player</button>
    </section>
  </div>;
}
