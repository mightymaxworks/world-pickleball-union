"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type FormEvent } from "react";
import { intakeDecisions, intakeOrganisationTypes, type IntakeCase, type IntakeDecision } from "@/lib/organisation-intake-types";

const endpoint = "/api/control/organisation-intake";
type Candidate = {id: string; name: string; status: string};
async function fetchJson(url: string, init: RequestInit = {}) {
  const response = await fetch(url, { ...init, cache: "no-store" });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data) throw new Error(data?.error ?? "Unable to reach the review queue. Please retry.");
  return data;
}
const problemText = (err: unknown) => err instanceof Error ? err.message : "Please retry.";

export default function RequestDetails({item}: {item:IntakeCase}) {
  const router = useRouter();
  const [refreshing,startTransition] = useTransition();
  const [saved,setSaved] = useState(false);
  const linkedId = item.review?.organisationId;
  const orgHref = linkedId ? "/control?" + new URLSearchParams({
    view:"organisations",id:linkedId,fromRequest:item.reference,
  }).toString() : null;
  const [decision,setDecision] = useState<IntakeDecision | "">("");
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
    if (busy || refreshing || !decision) return;
    setBusy(true); setProblem("");
    const reason = new FormData(event.currentTarget).get("reason");
    try {
      await fetchJson(endpoint, { method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ reference:item.reference, decision, reason, version:item.version, ...(existingId ? { existingId } : {}) }) });
      setSaved(true);
      startTransition(() => router.refresh());
    } catch (err) { setProblem(problemText(err)); }
    finally { setBusy(false); }
  }

  return <div>
    {saved && <p className="wc-notice" role="status">Review saved. No email was sent automatically.</p>}
    <p>{item.type ? intakeOrganisationTypes[item.type] : "Legacy enquiry · type not recorded"}</p>
    <p>{item.contact}{item.role && " · " + item.role} · {item.email}</p>
    {item.website && <p>{item.website}</p>}
    {item.message && <blockquote className="wc-intake-message">{item.message}</blockquote>}
    {item.review && <div className="wc-feedback">
      <h3>{intakeDecisions[item.review.decision]}</h3>
      <p>Recorded by {item.review.name} · {item.review.createdAt} UTC</p>
      <p>{item.review.reason}</p>
      {orgHref && <>
        <p>{item.review.decision==="approve_new" ? "An organisation record was created." : "The application was linked to an existing organisation."}
          {" "}This decision did not change public access or send an email to the applicant.</p>
        <Link prefetch={false} className="wc-link-button" href={orgHref}>Open organisation record →</Link>
        {item.type==="national_federation" && <p className="wc-portal-note">Check its portal status and continue federation setup from the record.</p>}
      </>}
    </div>}
    {item.closed && !item.review && <p>This legacy enquiry was already marked reviewed or closed.</p>}
    {!final && <>
      <h3>Review decision</h3>
      <div className="wc-form"><label>Decision<select value={decision} onChange={event => setDecision(event.target.value as IntakeDecision | "")}>
          <option value="">Choose a decision</option>
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
        <button type="submit" disabled={busy || refreshing || !decision || (decision === "approve_existing" && !existingId)}>{busy || refreshing ? "Saving…" : "Record review"}</button>
      </form>
    </>}
    <details className="wc-request-reference"><summary>Request reference</summary><code>{item.reference}</code><p>Received {item.createdAt} UTC</p></details>
  </div>;
}
