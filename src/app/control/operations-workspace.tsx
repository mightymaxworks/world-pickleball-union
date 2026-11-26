import Link from "next/link";
import type { ReactNode } from "react";
import { caseIdPattern } from "@/lib/control/http";
import { organisationIntakeQueue, type IntakeQueueFilter } from "@/lib/control/organisation-intake";
import {
  activityActions, activityKinds, labelFor, operationsActivity, operationsDirectory, operationsOverview, operationsRecord,
  organisationStates, organisationTypes, PAGE_SIZE, portalStates, type Activity, type Organisation,
} from "@/lib/control/operations";
import { federationActivationCandidates } from "@/lib/federations/activation";
import { intakeOrganisationTypes, type IntakeCase } from "@/lib/organisation-intake-types";
import { regionLabel, residenceCountries } from "@/lib/passport/regions";
import { InlineFederationActivation } from "./federation-activation-workspace";
import RequestDetails from "./organisation-intake-workspace";

export type ControlQuery = Record<string, string | string[] | undefined>;
export const controlHref = (view: string, fields: Record<string, string | number> = {}) => {
  const query = new URLSearchParams({view});
  for (const [name,value] of Object.entries(fields)) if (value !== "") query.set(name,String(value));
  return "/control?" + query.toString();
};
const value = (query: ControlQuery, key: string, max: number) => typeof query[key] === "string" ? query[key].trim().slice(0,max) : "";
const entry = (options: object, key: string) => Object.hasOwn(options,key) ? key : "";
const pageOffset = (query: ControlQuery) => /^\d{1,5}$/.test(value(query,"offset",6)) ? Number(query.offset) : 0;
const countryFilter = (query: ControlQuery) => /^[a-z]{2}$/i.test(value(query,"country",3)) ? value(query,"country",2).toUpperCase() : "";
const day = (query: ControlQuery, key: string) => {
  const input = value(query,key,11);
  return /^\d{4}-\d{2}-\d{2}$/.test(input) && Number.isFinite(Date.parse(input))
    && new Date(input).toISOString().slice(0,10) === input ? input : "";
};
const country = (code: string | null) => code ? regionLabel(code) || code : "Country not recorded";
const timeLabel = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" });
const displayTime = (value: string) => {
  const timestamp = Date.parse(value.replace(" ","T") + "Z");
  return Number.isFinite(timestamp) ? timeLabel.format(timestamp) + " UTC" : value;
};
type Staff = { account: string; email: string };

function SelectFilter({label, name, by, selected}: {label: string; name: string; by: Record<string,string>; selected: string}) {
  return <label>{label}<select name={name} defaultValue={selected}><option value="">All</option>
    {Object.entries(by).map(([key,label]) => <option key={key} value={key}>{label}</option>)}
  </select></label>;
}

function CountryFilter({selected}: {selected: string}) {
  return <label>Country or territory<select name="country" defaultValue={selected}>
    <option value="">All countries and territories</option>
    {selected && !residenceCountries.some(({code}) => code===selected) && <option value={selected}>{country(selected)}</option>}
    {residenceCountries.map(({code,name}) => <option key={code} value={code}>{name}</option>)}
  </select></label>;
}

function PageNav({view, filters, offset, hasMore}: {view: string; filters: Record<string,string>; offset: number; hasMore: boolean}) {
  if (!offset && !hasMore) return null;
  return <nav className="wc-actions wc-page-nav" aria-label="Results pages">
    {offset>0 && <Link prefetch={false} href={controlHref(view,{...filters,offset:Math.max(0,offset-PAGE_SIZE)})}>Previous page</Link>}
    {hasMore && <Link prefetch={false} href={controlHref(view,{...filters,offset:offset+PAGE_SIZE})}>Next page</Link>}
  </nav>;
}

function ActivityList({items, inRecord = false}: {items: Activity[]; inRecord?: boolean}) {
  return !items.length ? <p>No matching activity.</p> : <ol className="wc-event-list">
    {items.map(item => {
      const href = item.organisationId && item.kind!=="submission" && !inRecord
        ? controlHref("organisations",{id:item.organisationId,...(item.reference ? {fromRequest:item.reference} : {})})
        : item.reference ? controlHref("requests",{request:item.reference}) : null;
      return <li key={item.key}>
        <div><strong>{labelFor(activityActions,item.action)}</strong><br />
          {href ? <Link prefetch={false} href={href}>{item.name}</Link> : <span>{item.name}</span>}
          {item.actor && <span className="wc-meta"> · {item.actor}</span>}</div>
        <span className="wc-meta">{displayTime(item.at)}</span>
      </li>;
    })}
  </ol>;
}

export async function OperationsOverview() {
  const data = await operationsOverview();
  const cards = [
    {title:"New applications",count:data.newRequests,note:"Not reviewed yet",href:controlHref("requests",{filter:"new"})},
    {title:"Follow-ups",count:data.followUp,note:"Waiting for more information",href:controlHref("requests",{filter:"follow_up"})},
    {title:"Federations to set up",count:data.setup,note:"Eligible to open a portal",href:controlHref("organisations",{portal:"unpublished"})},
    {title:"Organisations on record",count:data.organisations,note:"All types and countries",href:controlHref("organisations")},
    {title:"Open portals",count:data.open,note:"Taking affiliation requests",href:controlHref("organisations",{portal:"open"})},
    {title:"Paused portals",count:data.paused,note:"Not taking new requests",href:controlHref("organisations",{portal:"paused"})},
  ];
  return <>
    <section aria-labelledby="wc-operations-heading" className="wc-ops-intro">
      <h2 id="wc-operations-heading">Operations overview</h2>
      <p>Review what needs attention and find any organisation on record.</p>
      <div className="wc-stat-grid">
        {cards.map(card => <Link prefetch={false} key={card.title} href={card.href} className="wc-stat">
          <strong>{card.count}</strong><span>{card.title}</span><small>{card.note}</small>
        </Link>)}
      </div>
    </section>
    <section className="wc-box" aria-labelledby="wc-recent">
      <div className="wc-section-head"><h2 id="wc-recent">Recent activity</h2>
        <Link prefetch={false} href={controlHref("activity")}>View all activity</Link></div>
      <ActivityList items={data.recent} />
    </section>
  </>;
}

export async function OperationsActivity({query}: {query: ControlQuery}) {
  const filters = {
    q:value(query,"q",160), kind:entry(activityKinds,value(query,"kind",20)),
    from:day(query,"from"), to:day(query,"to"), id:value(query,"id",200),
  };
  const offset = pageOffset(query);
  const data = await operationsActivity({...filters,offset});
  return <section className="wc-box" aria-labelledby="wc-activity">
    <h2 id="wc-activity">Activity</h2>
    <p>Application submissions, review decisions and changes to federation portals.</p>
    <form method="get" action="/control" className="wc-filter-form">
      <input type="hidden" name="view" value="activity" /><input type="hidden" name="id" value={filters.id} />
      <label className="wc-wide-filter">Organisation<input name="q" defaultValue={filters.q} maxLength={160} placeholder="Search by name" /></label>
      <SelectFilter name="kind" label="Activity type" by={activityKinds} selected={filters.kind} />
      <label>From (UTC)<input type="date" name="from" defaultValue={filters.from} /></label>
      <label>Through (UTC)<input type="date" name="to" defaultValue={filters.to} /></label>
      <div className="wc-actions"><button>Apply filters</button><Link prefetch={false} className="wc-text-link" href={controlHref("activity")}>Clear filters</Link></div>
    </form>
    <ActivityList items={data.items} />
    <PageNav view="activity" filters={filters} offset={offset} hasMore={data.hasMore} />
  </section>;
}

function OrgState({item}: {item: Organisation}) {
  return <><span className="wc-state">{labelFor(organisationStates,item.status)}</span>
    {item.portal && <span className="wc-state" data-state={item.portal}>{portalStates[item.portal]}</span>}</>;
}

export async function Organisations({query,staff,networkAccess = false}: {
  query: ControlQuery; staff: Staff; networkAccess?: boolean;
}) {
  const id = value(query,"id",201);
  const filters = {
    q:value(query,"q",160), type:entry(organisationTypes,value(query,"type",32)), country:countryFilter(query),
    status:entry(organisationStates,value(query,"status",20)), portal:entry(portalStates,value(query,"portal",20)),
    source: value(query,"source",20)==="approved" ? "approved" : "",
  };
  const offset = pageOffset(query);
  if (id) {
    const fromApproval = value(query,"fromRequest",37);
    const back = caseIdPattern.test(fromApproval) ? controlHref("requests",{request:fromApproval})
      : networkAccess ? controlHref("organisations",{...filters,offset}) : controlHref("requests");
    const item = id.length <= 200 ? await operationsRecord(id,networkAccess) : null;
    if (!item) return <section className="wc-box"><h2>Organisation not available</h2><p>This record does not exist or is not available to your role.</p>
      <Link prefetch={false} className="wc-text-link" href={back}>Go back</Link></section>;
    const [activation, history] = await Promise.all([
      networkAccess && item.eligible ? federationActivationCandidates(staff,"",0,id) : null,
      networkAccess ? operationsActivity({id},10) : null,
    ]);
    const candidate = activation?.items[0];
    return <>
      <section className="wc-box">
        <Link prefetch={false} className="wc-text-link" href={back}>← {caseIdPattern.test(fromApproval) ? "Back to application" : networkAccess ? "Back to organisations" : "Back to requests"}</Link>
        <h2>{item.name}</h2>
        <p>{labelFor(organisationTypes,item.type)} · {country(item.country)}</p>
        <div className="wc-badges">{item.application && <span className="wc-state">Application approved</span>}<OrgState item={item} /></div>
        <p>Last organisation update {displayTime(item.latestAt)}</p>
        {item.application && <Link prefetch={false} className="wc-text-link" href={controlHref("requests",{request:item.application})}>View approved application →</Link>}
        {item.type!=="national_federation" && <p>No federation portal setup is needed for this organisation type.</p>}
      </section>
      {candidate ? <section className="wc-box" aria-labelledby="wc-portal-setup">
        <h2 id="wc-portal-setup">Federation activation</h2>
        <p>Open, pause or resume public Player Passport affiliation requests. This does not grant formal membership or national recognition.</p>
        <InlineFederationActivation item={candidate} />
      </section> : item.type==="national_federation" && <section className="wc-box"><h2>Federation portal</h2>
        <p>{networkAccess ? "This organisation isn’t eligible to open a portal yet." : "A WPU publisher manages portal setup separately."}</p></section>}
      {history && <section className="wc-box"><h2>Organisation activity</h2><ActivityList items={history.items} inRecord />
        {history.hasMore && <Link prefetch={false} className="wc-text-link" href={controlHref("activity",{id:item.id,q:item.name})}>Find more activity →</Link>}
      </section>}
    </>;
  }

  const data = await operationsDirectory({...filters,offset});
  return <section className="wc-box" aria-labelledby="wc-directory">
    <h2 id="wc-directory">Organisations</h2>
    <p>Find approved and existing organisation records. See record verification separately from whether a federation portal is open.</p>
    <nav className="wc-filters" aria-label="Organisation lists">
      <Link prefetch={false} aria-current={!filters.source ? "page" : undefined} href={controlHref("organisations",{...filters,source:""})}>All organisations</Link>
      <Link prefetch={false} aria-current={filters.source==="approved" ? "page" : undefined} href={controlHref("organisations",{...filters,source:"approved"})}>Approved organisations</Link>
    </nav>
    <form method="get" action="/control" className="wc-filter-form">
      <input type="hidden" name="view" value="organisations" /><input type="hidden" name="source" value={filters.source} />
      <label className="wc-wide-filter">Search<input name="q" defaultValue={filters.q} maxLength={160} placeholder="Organisation name or ID" /></label>
      <SelectFilter name="type" label="Organisation type" by={organisationTypes} selected={filters.type} />
      <CountryFilter selected={filters.country} />
      <SelectFilter name="status" label="Record status" by={organisationStates} selected={filters.status} />
      <SelectFilter name="portal" label="Federation portal" by={{...portalStates,unpublished:"Needs setup"}} selected={filters.portal} />
      <div className="wc-actions"><button>Apply filters</button><Link prefetch={false} className="wc-text-link" href={controlHref("organisations")}>Clear filters</Link></div>
    </form>
    {!data.items.length ? <p>No organisations match those filters.</p> : <ul className="wc-directory-list">
      {data.items.map(item => <li key={item.id}>
        <div>
          <Link prefetch={false} className="wc-row-title" href={controlHref("organisations",{...filters,offset,id:item.id})}>{item.name}</Link>
          <p>{labelFor(organisationTypes,item.type)} · {country(item.country)}</p>
        </div>
        <div className="wc-badges"><OrgState item={item} /></div>
        <div className="wc-row-next">
          <strong>{item.eligible && item.portal==="unpublished" ? "Continue setup" : "View record"}</strong>
          <span className="wc-meta">Updated {displayTime(item.latestAt)}</span>
        </div>
      </li>)}
    </ul>}
    <PageNav view="organisations" filters={filters} offset={offset} hasMore={data.hasMore} />
  </section>;
}

const requestFilters: Record<IntakeQueueFilter,string> = {
  open:"Needs review",new:"New",follow_up:"Follow-up",approved:"Approved",completed:"All completed",
};
const requestStatus = (item: IntakeCase) => item.review?.decision === "approve_new" || item.review?.decision === "approve_existing"
  ? "Approved" : item.closed || item.review?.decision === "close" ? "Closed"
  : item.review?.decision === "follow_up" ? "Follow-up" : "New";

export async function OrganisationRequests({query,staff}: {query: ControlQuery; staff: Staff}) {
  const search = value(query,"q",160);
  const raw = value(query,"request",37) || (caseIdPattern.test(search) ? search : "");
  const selected = caseIdPattern.test(raw) ? raw : "";
  const filter = (entry(requestFilters,value(query,"filter",20)) || "open") as IntakeQueueFilter;
  const filters = {filter, q:caseIdPattern.test(search) ? "" : search, type:entry(intakeOrganisationTypes,value(query,"type",32)),country:countryFilter(query)};
  const offset = pageOffset(query);
  const [queue,detail] = await Promise.all([
    organisationIntakeQueue(staff,null,filter,offset,filters.q,filters.type,filters.country),
    selected ? organisationIntakeQueue(staff,selected,filter,0) : null,
  ]);
  const item = detail?.cases[0];
  const queueHref = controlHref("requests",{...filters,offset});
  return <>
    <section className="wc-ops-intro">
      <h2>Organisation participation requests</h2>
      <p>Review new and existing applications. Approval does not open a portal or confer formal membership.</p>
    </section>
    <div className={selected ? "wc-request-grid has-selection" : "wc-request-grid"}>
      <section className="wc-box wc-request-queue" aria-labelledby="wc-queue-list">
        <h3 id="wc-queue-list">Review queue</h3>
        <nav className="wc-filters" aria-label="Request status">{Object.entries(requestFilters).map(([key,label]) =>
          <Link key={key} prefetch={false} aria-current={key===filter ? "page" : undefined}
            href={controlHref("requests",{...filters,filter:key})}>{label}</Link>)}</nav>
        <form method="get" action="/control" className="wc-filter-form">
          <input type="hidden" name="view" value="requests" /><input type="hidden" name="filter" value={filter} />
          <label className="wc-wide-filter">Search<input name="q" defaultValue={filters.q} maxLength={160} placeholder="Organisation name or reference" /></label>
          <SelectFilter name="type" label="Organisation type" by={intakeOrganisationTypes} selected={filters.type} />
          <CountryFilter selected={filters.country} />
          <div className="wc-actions"><button>Apply filters</button><Link prefetch={false} className="wc-text-link" href={controlHref("requests",{filter})}>Clear filters</Link></div>
        </form>
        {!queue.cases.length ? <p>No requests match this view.</p> : <ul className="wc-request-list">
          {queue.cases.map(request => <li key={request.reference}>
            <Link prefetch={false} aria-current={selected===request.reference ? "page" : undefined}
              href={controlHref("requests",{...filters,offset,request:request.reference})}>
              <span className="wc-row-title">{request.name}</span><span className="wc-state">{requestStatus(request)}</span>
              <span className="wc-meta">{country(request.country)} · {request.type ? intakeOrganisationTypes[request.type] : "Type not recorded"}</span>
              <small>{displayTime(request.createdAt)}</small>
            </Link>
          </li>)}
        </ul>}
        <PageNav view="requests" filters={filters} offset={offset} hasMore={queue.hasMore} />
      </section>
      <section className="wc-box wc-request-detail" aria-label="Selected request">
        {selected && <Link prefetch={false} className="wc-text-link" href={queueHref}>← Back to queue</Link>}
        {item ? <>
          <h2>{item.name}</h2><p>{country(item.country)}</p>
          <div className="wc-badges"><span className="wc-state">{requestStatus(item)}</span></div>
          <RequestDetails key={item.reference} item={item} />
        </> : selected ? <p>This request is no longer available.</p> : <><h3>Select a request</h3><p>Open an organisation from the queue to see the application and make a decision.</p></>}
      </section>
    </div>
  </>;
}

export function WorkspaceUnavailable({children}: {children: ReactNode}) {
  return <section className="wc-box" role="alert"><h2>Workspace unavailable</h2><p>{children}</p></section>;
}
