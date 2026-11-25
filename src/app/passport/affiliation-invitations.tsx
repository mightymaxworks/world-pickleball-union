"use client";

import { useEffect, useState, type FormEvent } from "react";
import { affiliationStateLabels, type AffiliationState, type PlayerAffiliationWorkspace } from "@/lib/control/types";

type Update = { action: "request"; organisationId: string } | { id: string; action: "accept" | "decline" };
const emptyWorkspace: PlayerAffiliationWorkspace = { invitations: [], options: [], requests: [] };
const playerState = (state: AffiliationState) => state === "awaiting_review" ? "Awaiting WPU review" : affiliationStateLabels[state];

export default function AffiliationInvitations() {
  const [workspace, setWorkspace] = useState(emptyWorkspace);
  const [selection, setSelection] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [problem, setProblem] = useState("");
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const abort = new AbortController();
    void (async () => {
      try {
        const response = await fetch("/api/passport/affiliation-requests", { signal: abort.signal, cache: "no-store" });
        if (!response.ok) throw new Error();
        const value = await response.json() as PlayerAffiliationWorkspace;
        if (!abort.signal.aborted) {
          setWorkspace(value);
          setSelection(current => value.options.some(option => option.id === current) ? current : "");
          setProblem("");
        }
      } catch {
        if (!abort.signal.aborted) setProblem("Affiliation requests could not be loaded.");
      }
    })();
    return () => abort.abort();
  }, [revision]);

  async function update(body: Update) {
    if (busy) return;
    setBusy(true);
    setMessage("");
    setProblem("");
    try {
      const response = await fetch("/api/passport/affiliation-requests", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.error ?? "This request could not be updated. Refresh requests to check its status.");
      }
      if (body.action === "request") {
        const { id } = await response.json() as { id: string };
        setWorkspace(current => {
          const organisation = current.options.find(option => option.id === body.organisationId);
          return {
            ...current,
            options: current.options.filter(option => option.id !== body.organisationId),
            requests: organisation ? [{ id, organisation: organisation.name, state: "awaiting_review" }, ...current.requests] : current.requests,
          };
        });
        setMessage("Request submitted. WPU will review it before it appears as an affiliation.");
      } else {
        setWorkspace(current => ({ ...current, invitations: current.invitations.filter(item => item.id !== body.id) }));
        setMessage(body.action === "accept" ? "Consent recorded. A reviewer will decide whether to add the affiliation." : "Affiliation declined.");
      }
    } catch (error) { setProblem(error instanceof Error ? error.message : "Could not update the request."); }
    finally { setBusy(false); }
  }

  const { invitations, options, requests } = workspace;
  const organisation = options.length === 1 ? options[0].id : selection;
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (organisation) void update({ action: "request", organisationId: organisation });
  }

  if (!invitations.length && !options.length && !requests.length && !message && !problem) return null;
  return <div className="pp-affiliation-workspace">
    {options.length > 0 && <form className="pp-form pp-affiliation-request" onSubmit={submit} aria-labelledby="pp-request-heading">
      <h3 id="pp-request-heading">Request an affiliation</h3>
      {options.length === 1 ? <p><strong>{options[0].name}</strong></p> : <label htmlFor="pp-affiliation-org">
        Organisation
        <select id="pp-affiliation-org" required value={selection} onChange={event => setSelection(event.target.value)}>
          <option value="">Choose an organisation</option>
          {options.map(option => <option key={option.id} value={option.id}>{option.name}</option>)}
        </select>
      </label>}
      <p className="pp-help">Request only if you belong to the organisation. Its assigned WPU reviewers will see your Passport display name and the last eight characters of your Player ID, not your email or contact details.</p>
      <button className="pp-button pp-primary" type="submit" disabled={!organisation || busy}>Submit request</button>
    </form>}
    {requests.length > 0 && <section aria-labelledby="pp-my-affiliation-requests">
      <h3 id="pp-my-affiliation-requests">My affiliation requests</h3>
      <ul className="pp-affiliation-list">{requests.map(item => <li key={item.id}>
        <h4>{item.organisation}</h4><p>{playerState(item.state)}</p>
      </li>)}</ul>
      <button className="pp-button pp-secondary" type="button" disabled={busy} onClick={() => setRevision(value => value + 1)}>Refresh request status</button>
    </section>}
    {invitations.length > 0 && <section aria-labelledby="pp-affiliation-invites">
      <h3 id="pp-affiliation-invites">Affiliation invitations</h3>
      <p>Accept only if you belong to the organisation. If approved, the affiliation appears on your private Passport.</p>
      <ul className="pp-affiliation-list">{invitations.map(item => <li key={item.id}>
        <h4>{item.organisation}</h4>
        <div className="pp-actions">
          <button className="pp-button pp-primary" type="button" disabled={busy} onClick={() => void update({ id: item.id, action: "accept" })}>Accept affiliation request</button>
          <button className="pp-button pp-secondary" type="button" disabled={busy} onClick={() => void update({ id: item.id, action: "decline" })}>Decline</button>
        </div>
      </li>)}</ul>
    </section>}
    {message && <p className="pp-feedback" role="status">{message}</p>}
    {problem && <><p className="pp-feedback pp-feedback-error" role="alert">{problem}</p>
      <button className="pp-button pp-secondary" type="button" disabled={busy} onClick={() => setRevision(value => value + 1)}>Refresh requests</button></>}
  </div>;
}
