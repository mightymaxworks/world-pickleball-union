"use client";

import { useEffect, useState, type FormEvent } from "react";
import { intakeDecisions, intakeOrganisationTypes, type IntakeCase, type IntakeDecision } from "@/lib/organisation-intake-types";
import { regionLabel } from "@/lib/passport/regions";

const endpoint = "/api/control/organisation-intake";
type Candidate = {id: string; name: string; status: string};
async function fetchJson(url: string, init: RequestInit = {}) {
  const response = await fetch(url, { ...init, cache: "no-store" });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data) throw new Error(data?.error ?? "Unable to reach the review queue. Please retry.");
  return data;
}
const problemText = (err: unknown) => err instanceof Error ? err.message : "Please retry.";

export default function OrganisationIntakeWorkspace() {
  const [filter,setFilter] = useState<"open" | "completed">("open");
  const [offset,setOffset] = useState(0);
  const [reference,setReference] = useState("");
  const [reload,setReload] = useState(0);
  const [result,setResult] = useState<{cases: IntakeCase[]; hasMore: boolean} | null>(null);
  const [problem,setProblem] = useState("");
  const [notice,setNotice] = useState("");
  useEffect(() => {
    const abort = new AbortController();
    const params = new URLSearchParams({ filter, offset: String(offset), ...(reference ? {reference} : {}) });
    void fetchJson(endpoint + "?" + params, {signal:abort.signal}).then(data => {
      if (!abort.signal.aborted) { setResult(data); setProblem(""); }
    }).catch(error => {
      if (!abort.signal.aborted) { setResult(null); setProblem(problemText(error)); }
    });
    return () => abort.abort();
  }, [filter,offset,reference,reload]);

  function refresh() { setResult(null); setProblem(""); setReload(value => value+1); }
  return <section className="wc-box" aria-labelledby="intake-queue-title">
    <p className="wc-label">WPU staff</p>
    <h2 id="intake-queue-title">Organisation participation requests</h2>
    <p>Review interest from federations, associations, and clubs. A decision here does not admit a formal WPU member or give anyone access to a portal or player data.</p>
    <div className="wc-actions">
      <button type="button" className={filter === "open" && !reference ? "" : "wc-secondary"} onClick={() => {
        setFilter("open"); setReference(""); setOffset(0); refresh();
      }}>Open</button>
      <button type="button" className={filter === "completed" && !reference ? "" : "wc-secondary"} onClick={() => {
        setFilter("completed"); setReference(""); setOffset(0); refresh();
      }}>Completed</button>
    </div>
    <form className="wc-form" onSubmit={event => {
      event.preventDefault(); setReference(String(new FormData(event.currentTarget).get("reference") ?? "").trim().toLowerCase()); refresh();
    }}>
      <label>Find by request reference<input name="reference" maxLength={36} required /></label>
      <button type="submit" className="wc-secondary">Find request</button>
    </form>
    {notice && <p role="status">{notice}</p>}
    {problem && <p role="alert">{problem} <button type="button" onClick={refresh}>Retry</button></p>}
    {!result && !problem && <p role="status">Loading requests…</p>}
    {result && !result.cases.length && <p>No {reference ? "matching" : filter} requests.</p>}
    {result && <ul className="wc-cases">
      {result.cases.map(item => <li className="wc-case" key={item.reference + item.version}>
        <details open={Boolean(reference)}>
          <summary>{item.name} · {regionLabel(item.country) || item.country}</summary>
          <RequestDetails item={item} changed={() => {
            setNotice("Review recorded. Contact the applicant at the email shown with their next step. No email was sent automatically.");
            setReference(item.reference); refresh();
          }} />
        </details>
      </li>)}
    </ul>}
    {!reference && result && (offset > 0 || result.hasMore) && <div className="wc-actions">
      <button type="button" className="wc-secondary" disabled={offset === 0} onClick={() => {setOffset(offset-25);refresh();}}>Previous</button>
      <button type="button" className="wc-secondary" disabled={!result.hasMore} onClick={() => {setOffset(offset+25);refresh();}}>Next</button>
    </div>}
  </section>;
}
function RequestDetails({item,changed}: {item:IntakeCase;changed:()=>void}) {
  const [decision,setDecision] = useState<IntakeDecision>("follow_up");
  const [problem,setProblem] = useState("");
  const [busy,setBusy] = useState(false);
  const [candidates,setCandidates] = useState<Candidate[] | null>(null);
  const [existingId,setExistingId] = useState("");
  const final = item.closed || Boolean(item.review && item.review.decision !== "follow_up");
  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setProblem(""); setExistingId("");
    try {
      const query = new URLSearchParams({ reference:item.reference, findOrganisation:String(new FormData(event.currentTarget).get("q") ?? "") });
      setCandidates((await fetchJson(endpoint + "?" + query)).matches);
    } catch (err) { setProblem(problemText(err)); }
    finally { setBusy(false); }
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setProblem("");
    const reason = new FormData(event.currentTarget).get("reason");
    try {
      await fetchJson(endpoint, { method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ reference:item.reference, decision, reason, version:item.version, ...(existingId ? { existingId } : {}) }) });
      changed();
    } catch (err) { setProblem(problemText(err)); }
    finally { setBusy(false); }
  }

  return <div>
    <p>Reference <code>{item.reference}</code> · Received {item.createdAt} UTC</p>
    <p>{item.type ? intakeOrganisationTypes[item.type] : "Legacy enquiry · type not recorded"}</p>
    <p>{item.contact}{item.role && " · " + item.role} · {item.email}</p>
    {item.website && <p>{item.website}</p>}
    {item.message && <p className="wc-intake-message">{item.message}</p>}
    {item.review && <div className="wc-feedback">
      <h3>{intakeDecisions[item.review.decision]}</h3>
      <p>Recorded by {item.review.name} · {item.review.createdAt} UTC</p>
      <p>{item.review.reason}</p>
      {item.review.organisationId && <p>Linked organisation <code>{item.review.organisationId}</code></p>}
    </div>}
    {item.closed && !item.review && <p>This legacy enquiry was already marked reviewed or closed.</p>}
    {!final && <>
      <div className="wc-form"><label>Decision<select value={decision} onChange={event => setDecision(event.target.value as IntakeDecision)}>
        {Object.entries(intakeDecisions).filter(([key]) => key !== "approve_new" || item.type).map(([key,label]) =>
          <option key={key} value={key}>{label}</option>)}
      </select></label></div>
      {decision === "approve_existing" && <form className="wc-form" onSubmit={event => void search(event)}>
        <label>Find an existing organisation<input name="q" maxLength={160} placeholder="Search by name or ID" /></label>
        <button className="wc-secondary" type="submit" disabled={busy}>Search organisation records</button>
        {candidates?.length === 0 && <p>No eligible matching record.</p>}
        {Boolean(candidates?.length) && <label>Link to organisation<select value={existingId} onChange={event => setExistingId(event.target.value)}>
          <option value="">Select a record</option>
          {candidates?.map(org => <option key={org.id} value={org.id}>{org.name} · {org.status}</option>)}
        </select></label>}
      </form>}
      {decision === "approve_new" && <p>Creates a pending organisation record. No portal, access role or recognition is granted.</p>}
      <form className="wc-form" onSubmit={event => void save(event)}>
        {problem && <p role="alert">{problem}</p>}
        <label>Internal decision reason<input name="reason" required minLength={3} maxLength={500} /></label>
        <button type="submit" disabled={busy || (decision === "approve_existing" && !existingId)}>Record review</button>
      </form>
    </>}
  </div>;
}
