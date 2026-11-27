import { displayDate, kinds, publicProgramme, type PublicEvent } from "@/lib/events/model";

import { tierLabel } from "@/lib/events/sanction";
import { describeEntry, divisionKinds, drawFormats } from "@/lib/events/competition";

export default function PublicProgramme({event, spectator=false, preview=false}: {event:PublicEvent; spectator?:boolean;preview?:boolean}) {
  const {programme,organiser,tiers}=event;
  const scheduled=publicProgramme(programme);
  return <article className="es-public-view">
    <div className="es-poster">
      <div className="es-poster-copy"><p className="es-kicker">Hosted by {organiser}</p>
        <h1>{programme.title || "Untitled event"}</h1>{programme.description && <p>{programme.description}</p>}
        <div className="es-event-facts"><span>{displayDate(programme.date)}</span><span>{programme.venue || "Venue to be added"}</span></div>
      </div>
      <div className="es-poster-art" aria-hidden="true">
        <svg viewBox="0 0 600 310" preserveAspectRatio="xMidYMid slice">
          <rect width="600" height="310" fill="#20342e"/>
          <g transform="rotate(-24 300 155)" fill="none" stroke="#ecf5c1" strokeWidth="2">
            <rect x="-40" y="49" width="680" height="214" fill="#4c6c54"/>
            <path d="M0 67H600V245H0ZM210 67V245M395 67V245M0 156H210m185 0H600"/>
            <path strokeDasharray="6 6" d="M302 46V266"/>
          </g>
          <ellipse cx="419" cy="242" rx="101" ry="21" fill="#12251e" opacity=".48" transform="rotate(-15 419 242)"/>
          <circle cx="422" cy="146" r="92" fill="#dcfb77"/>
          <g fill="#263e32"><ellipse cx="391" cy="96" rx="12" ry="9"/><ellipse cx="445" cy="93" rx="12" ry="9"/><ellipse cx="480" cy="123" rx="12" ry="9"/>
            <ellipse cx="367" cy="143" rx="12" ry="10"/><ellipse cx="422" cy="145" rx="15" ry="13"/><ellipse cx="477" cy="170" rx="12" ry="11"/>
            <ellipse cx="384" cy="184" rx="11" ry="10"/><ellipse cx="435" cy="198" rx="12" ry="10"/></g>
          <path d="M142 111h38m-19-19v38m-12-31 24 24m0-24-24 24" stroke="#dcfb77" strokeWidth="2"/>
        </svg>
      </div>
    </div>
    {!!scheduled.divisions.length && <div className="es-lineup-preview es-public-divisions">
      <div className="es-preview-heading"><div><p className="es-kicker">Competition</p><h2>Divisions</h2></div><span>Registration not open</span></div>
      <div className="es-public-cards">{scheduled.divisions.map(division=><section key={division.id} className="es-kind-tournament">
        <p className="es-kicker">{divisionKinds[division.kind].label}</p>
        <h3>{division.name || "Unnamed division"}</h3>
        <p className="es-public-entry">{describeEntry(division,displayDate)}</p>
        <p className="es-division-sanction">{tiers?.[division.id] ?
          (preview?"On publish · ":"WPU-sanctioned · ")+tierLabel(tiers[division.id]) : "Not WPU-sanctioned"}</p>
        <p>{drawFormats[division.format]}{division.capacity===null?"":" · "+division.capacity+" "+divisionKinds[division.kind].units}</p>
      </section>)}</div>
      <p className="es-disclaimer">{preview?"This is a preview. Publishing does not open registration.":"Only the tiers shown as sanctioned are confirmed. This page does not accept entries."}</p>
    </div>}
    <div className="es-lineup-preview"><div className="es-preview-heading"><div><p className="es-kicker">{spectator ? "Plan your visit" : "One event · Different ways to join"}</p><h2>The lineup</h2></div><span>Local time · {programme.timezone}</span></div>
      {!scheduled.activities.length && <p>{scheduled.divisions.length?"The schedule has not been announced.":"Scheduled activities will appear here."}</p>}
      <div className="es-public-cards">{scheduled.activities.map(activity=><section key={activity.id} className={"es-kind-"+activity.kind}>
        <p className="es-kicker">{activity.time} · {kinds[activity.kind].label}</p>
        <h3>{activity.title}</h3>{activity.location && <p>{activity.location}</p>}{activity.description && <p>{activity.description}</p>}
        {spectator && activity.kind==="tournament" && <p>Check with the organiser for viewing details.</p>}
      </section>)}</div>
      <p className="es-disclaimer">Programme information only. Registration and bookings are not available on this page.{!scheduled.divisions.length?" This programme does not indicate WPU sanctioning.":""}</p>
    </div>
  </article>;
}
