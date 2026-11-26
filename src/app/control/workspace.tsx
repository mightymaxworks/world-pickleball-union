"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { affiliationStateLabels, type AffiliationCase, type AffiliationDecision } from "@/lib/control/types";

type Workspace = { organisations: {id: string; name: string}[]; cases: AffiliationCase[]; hasMore: boolean };
const decisionLabel: Record<AffiliationDecision, string> = { approve: "Approve", reject: "Reject", revoke: "Revoke" };

export default function ControlWorkspace({ hasFederationWorkspace = false }: { hasFederationWorkspace?: boolean }) {
  const [data, setData] = useState<Workspace | null>(null);
  const [problem, setProblem] = useState("");
  const [status, setStatus] = useState("");
  const [noAffiliationRole, setNoAffiliationRole] = useState(false);
  const [signedOut, setSignedOut] = useState(false);
  const [busy, setBusy] = useState(false);
  const [update, setUpdate] = useState(0);

  useEffect(() => {
    const abort = new AbortController();
    void (async () => {
      try {
        const response = await fetch("/api/control/affiliations", { cache: "no-store", signal: abort.signal });
        const value = await response.json();
        if (abort.signal.aborted) return;
        setNoAffiliationRole(response.status === 403 && value.code === "no_affiliation_role");
        if (response.ok) { setData(value); setProblem(""); setSignedOut(false); }
        else { setData(null); setProblem(value.error ?? "Unable to load cases."); setSignedOut(response.status === 401); }
      } catch {
        if (!abort.signal.aborted) { setData(null); setProblem("Unable to load cases. Please retry."); }
      }
    })();
    return () => abort.abort();
  }, [update]);

  async function submit(event: FormEvent<HTMLFormElement>, id?: string) {
    event.preventDefault();
    if (busy) return;
    const form = event.currentTarget;
    const button = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
    const fields = new FormData(form);
    const body = id ? { id, action: button?.value, reason: fields.get("reason") } : {
      action: "propose", organisationId: fields.get("organisationId"), playerCode: fields.get("playerCode"), reason: fields.get("reason"),
    };
    setBusy(true);
    setProblem("");
    setStatus("");
    try {
      const response = await fetch("/api/control/affiliations", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
      });
      const result = await response.json();
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setData(null);
          setSignedOut(response.status === 401);
        }
        throw new Error(result.error ?? "Unable to save this action.");
      }
      form.reset();
      setStatus(id ? "Decision saved and added to the audit record." : "Proposal sent to the player's private Passport.");
      setUpdate(value => value + 1);
    } catch (error) { setProblem(error instanceof Error ? error.message : "Unable to save this action."); }
    finally { setBusy(false); }
  }

  if (hasFederationWorkspace && noAffiliationRole) return null;
  return <>
    {problem && <p role="alert" className="wc-feedback">{problem} {signedOut
      ? <Link href="/join">Sign in</Link>
      : !data && <button type="button" onClick={() => { setProblem(""); setUpdate(value => value + 1); }}>Retry</button>}</p>}
    {status && <p role="status" className="wc-feedback">{status}</p>}
    {!data && !problem && <p role="status">Loading affiliation cases…</p>}
    {data && <>
      {data.organisations.length > 0 && <section className="wc-box">
        <h2>Propose an affiliation</h2>
        <p>Use the Player ID shared with you by the player. They’ll see the invitation in their private Passport.</p>
        <form className="wc-form" onSubmit={event => void submit(event)}>
          <label>Organisation<select name="organisationId" defaultValue="" required>
            <option value="" disabled>Select an organisation</option>
            {data.organisations.map(org => <option key={org.id} value={org.id}>{org.name}</option>)}
          </select></label>
          <label>Permanent Player ID<input name="playerCode" autoComplete="off" spellCheck={false} required maxLength={36} /></label>
          <label>Reason<input name="reason" required minLength={3} maxLength={500} placeholder="Avoid personal or sensitive details" /></label>
          <button type="submit" disabled={busy}>Send to player</button>
        </form>
      </section>}

      <section className="wc-box" aria-labelledby="wc-queue">
        <h2 id="wc-queue">Affiliation cases</h2>
        {data.hasMore && <p>Showing up to 50 cases, with open cases first.</p>}
        {data.cases.length === 0 && <p>No affiliation cases in your assigned organisations.</p>}
        <ul className="wc-cases">
          {data.cases.map(item => <li key={item.id} className="wc-case">
            <div className="wc-casehead">
              <div>
                <h3>{item.organisation}</h3>
                {item.playerName && <p>{item.playerName}</p>}
                <p>Player ID ends in {item.playerCodeEnding}</p>
                {item.source === "player" && <p>Requested from the player’s Passport</p>}
              </div>
              <span className="wc-state">{affiliationStateLabels[item.state]}</span>
            </div>
            {item.actions.length > 0 && <form className="wc-form" onSubmit={event => void submit(event, item.id)}>
              <label>Decision reason<input name="reason" required minLength={3} maxLength={500} placeholder="Avoid personal or sensitive details" /></label>
              <div className="wc-actions">{item.actions.map(action => <button type="submit" value={action} key={action} disabled={busy}>{decisionLabel[action]}</button>)}</div>
            </form>}
            <details>
              <summary>Audit history</summary>
              <ol>{item.history.map(entry => <li key={entry.sequence}>
                <strong>{affiliationStateLabels[entry.state]}</strong> · {entry.actor ?? "Player"} ({entry.kind}) · <time dateTime={entry.at}>{new Date(entry.at).toLocaleString()}</time>
                <p>{entry.reason}</p>
              </li>)}</ol>
            </details>
          </li>)}
        </ul>
      </section>
    </>}
  </>;
}
