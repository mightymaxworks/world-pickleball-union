import { useState } from "react";
import {
  describeEntry, divisionKinds, drawFormats, MAX_DIVISION_CAPACITY, MAX_DIVISION_NAME, MAX_DIVISIONS,
  newDivision, nextDivisionName, rankingTracks, tracksFor,
  type Division, type DivisionKind, type DrawFormat, type RankingTrack,
} from "@/lib/events/competition";
import { displayDate, type EventDraft } from "@/lib/events/model";

type Update = <K extends keyof EventDraft>(key:K,value:EventDraft[K])=>void;
const kinds=Object.keys(divisionKinds) as DivisionKind[];
const marks:Record<DivisionKind,string>={singles:"1",doubles:"2",mixed:"2",team:"+"};

export function CompetitionStatus({isPublic}:{isPublic:boolean}) {
  return <dl className="es-comp-status" aria-label="Competition status">
    <div><dt>Event page</dt><dd>{isPublic?"Public":"Private draft"}</dd></div>
    <div><dt>WPU sanction</dt><dd>Not sanctioned</dd></div>
    <div><dt>Registration</dt><dd>Not open</dd></div>
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
  draft, change, isPublic, preview,
}: {draft:EventDraft;change:Update;isPublic:boolean;preview:()=>void}) {
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
      <CompetitionStatus isPublic={isPublic}/>
    </header>
    <EventDetails draft={draft} change={change} compact/>
    <section className="es-comp-section" aria-labelledby="es-add-division">
      <div className="es-comp-section-head"><div><h2 id="es-add-division">Add a division</h2><p>Start with an open-entry preset. Change the rules only if you need to.</p></div></div>
      <div className="es-comp-presets">
        {kinds.map(kind=><button key={kind} className="es-comp-preset" disabled={atLimit} onClick={()=>add(kind)}>
          <span className="es-comp-mark" aria-hidden="true">{marks[kind]}</span><span><strong>{divisionKinds[kind].label}</strong><small>{divisionKinds[kind].description}</small></span>
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
        const tracks=tracksFor[d.kind];
        return <article className="es-comp-division" key={d.id}>
          <div className="es-comp-division-head">
            <div><p className="es-kicker">{meta.label}</p><h3>{title}</h3>
              <p>{drawFormats[d.format]}{d.capacity===null?"":" · "+d.capacity+" "+meta.units}</p>
              <p>{describeEntry(d,displayDate)}</p></div>
            <button className="es-secondary" aria-expanded={isEditing} aria-label={(isEditing?"Close ":"Edit ")+title} onClick={()=>setEditing(isEditing?null:d.id)}>{isEditing?"Done":"Edit"}</button>
          </div>
          {isEditing && <div className="es-fields es-comp-division-edit">
            <label>Division name<input maxLength={MAX_DIVISION_NAME} value={d.name} onChange={e=>update(d,{name:e.target.value})}/></label>
            <div className="es-comp-edit-row">
              <label>Format<select value={d.format} onChange={e=>update(d,{format:e.target.value as DrawFormat})}>
                {Object.entries(drawFormats).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
              <label>Capacity ({meta.units})<input type="number" inputMode="numeric" min={2} max={MAX_DIVISION_CAPACITY} step={1} value={d.capacity??""} onChange={e=>{const n=e.target.valueAsNumber;update(d,{capacity:Number.isSafeInteger(n)&&n>=0?n:null});}}/></label>
            </div>
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
              <p className="es-comp-help">{d.kind==="doubles"||d.kind==="mixed"?"Both partners must meet the minimum on their own. ":""}This shows the entry rule only. Eligibility checks begin with registration.</p>
            </>}
            <div className="es-comp-edit-actions">
              <button className="es-secondary" disabled={atLimit} onClick={()=>duplicate(d)}>Duplicate division</button>
              <button className="es-back" onClick={()=>{change("divisions",draft.divisions.filter(other=>other.id!==d.id));setEditing(null);setAnnouncement(title+" removed.");}}>Remove division</button>
            </div>
          </div>}
        </article>;
      })}
    </section>}
    <section className="es-comp-next">
      <div><h2>See it as a player</h2><p>Check the event details and entry rules. A preview doesn’t publish the page or open registration.</p></div>
      <button className="es-primary" onClick={preview}>Preview as a player</button>
    </section>
  </div>;
}
