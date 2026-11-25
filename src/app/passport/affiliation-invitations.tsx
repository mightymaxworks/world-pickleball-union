"use client";

import { useEffect, useState } from "react";
import type { AffiliationInvitation } from "@/lib/control/types";

export default function AffiliationInvitations() {
  const [invitations, setInvitations] = useState<AffiliationInvitation[]>([]);
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
        const value = await response.json() as {invitations: AffiliationInvitation[]};
        if (!abort.signal.aborted) { setInvitations(value.invitations); setProblem(""); }
      } catch {
        if (!abort.signal.aborted) setProblem("Affiliation requests could not be loaded.");
      }
    })();
    return () => abort.abort();
  }, [revision]);

  async function respond(id: string, action: "accept" | "decline") {
    if (busy) return;
    setBusy(true);
    setMessage("");
    setProblem("");
    try {
      const response = await fetch("/api/passport/affiliation-requests", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action }),
      });
      if (!response.ok) throw new Error("This request could not be updated. Refresh requests to check its status.");
      setInvitations(current => current.filter(item => item.id !== id));
      setMessage(action === "accept" ? "Consent recorded. A reviewer will decide whether to add the affiliation." : "Affiliation declined.");
    } catch (error) { setProblem(error instanceof Error ? error.message : "Could not update the request."); }
    finally { setBusy(false); }
  }

  if (!invitations.length && !message && !problem) return null;
  return <div>
    {invitations.length > 0 && <>
      <h3>Affiliation requests</h3>
      <p>Accept only if you belong to the organisation. If approved, the affiliation appears on your private Passport.</p>
      <ul className="pp-affiliation-list">{invitations.map(item => <li key={item.id}>
        <h3>{item.organisation}</h3>
        <div className="pp-actions">
          <button className="pp-button pp-primary" type="button" disabled={busy} onClick={() => void respond(item.id, "accept")}>Accept affiliation request</button>
          <button className="pp-button pp-secondary" type="button" disabled={busy} onClick={() => void respond(item.id, "decline")}>Decline</button>
        </div>
      </li>)}</ul>
    </>}
    {message && <p className="pp-feedback" role="status">{message}</p>}
    {problem && <><p className="pp-feedback pp-feedback-error" role="alert">{problem}</p>
      <button className="pp-button pp-secondary" type="button" disabled={busy} onClick={() => setRevision(value => value + 1)}>Refresh requests</button></>}
  </div>;
}
