"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import type { ActivationCandidate } from "@/lib/federations/activation-types";
import { regionLabel } from "@/lib/passport/regions";

const endpoint = "/api/control/federation-activation";
const labels = { open: "Open to new requests", paused: "New requests paused", unpublished: "Not published" } as const;
type Result = { items: ActivationCandidate[]; hasMore: boolean };

async function getJson(response: Response) {
  const data = await response.json().catch(() => null);
  if (!response.ok || !data) throw new Error(data?.error ?? "Federation activation is temporarily unavailable.");
  return data;
}
const suggestSlug = (value: string) => value.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase()
  .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0,63).replace(/-$/,"");

export default function FederationActivationWorkspace() {
  const [q,setQ] = useState("");
  const [offset,setOffset] = useState(0);
  const [refresh,setRefresh] = useState(0);
  const [result,setResult] = useState<Result | null>(null);
  const [problem,setProblem] = useState("");
  const [notice,setNotice] = useState("");
  function reload() { setResult(null); setProblem(""); setRefresh(n => n+1); }

  useEffect(() => {
    const controller = new AbortController();
    void (async () => {
      try {
        const params = new URLSearchParams({q,offset:String(offset)});
        const data = await getJson(await fetch(endpoint + "?" + params, {cache:"no-store",signal:controller.signal}));
        if (!controller.signal.aborted) setResult(data);
      } catch (e) {
        if (!controller.signal.aborted) setProblem(e instanceof Error ? e.message : "Unable to load federations.");
      }
    })();
    return () => controller.abort();
  },[q,offset,refresh]);

  return <section className="wc-box" aria-labelledby="wc-federation-activation">
    <p className="wc-label">WPU staff</p>
    <h2 id="wc-federation-activation">Federation activation</h2>
    <p>Publish or pause online Player Passport affiliation requests for a national federation. This does not grant formal WPU membership, national recognition, or competition eligibility.</p>
    <form className="wc-form" onSubmit={event => {
      event.preventDefault();
      setQ(String(new FormData(event.currentTarget).get("q") ?? "").trim());
      setOffset(0);
      reload();
    }}>
      <label>Find a federation<input name="q" maxLength={160} placeholder="Federation name, country code or URL name" /></label>
      <button type="submit" className="wc-secondary">Search</button>
    </form>
    {notice && <p role="status">{notice}</p>}
    {problem && <p role="alert">{problem} <button type="button" className="wc-secondary" onClick={reload}>Retry</button></p>}
    {!result && !problem && <p role="status">Loading federations…</p>}
    {result && (!result.items.length ? <p>No eligible federation matches. A new organisation needs a national federation record and an approved participation request before it can be published here.</p> :
      <ul className="wc-cases">
        {result.items.map(item => <li className="wc-case" key={item.id + item.revision}>
          <details>
            <summary>{item.name} · {labels[item.state]}</summary>
            <ActivationRecord item={item} onSaved={message => {setNotice(message);reload();}} />
          </details>
        </li>)}
      </ul>)}
    {result && (offset > 0 || result.hasMore) && <div className="wc-actions">
      <button type="button" className="wc-secondary" disabled={offset === 0} onClick={() => {setOffset(offset-25);reload();}}>Previous</button>
      <button type="button" className="wc-secondary" disabled={!result.hasMore} onClick={() => {setOffset(offset+25);reload();}}>Next</button>
    </div>}
  </section>;
}

export function InlineFederationActivation({item}: {item: ActivationCandidate}) {
  const router = useRouter();
  const [notice,setNotice] = useState("");
  return <>
    {notice && <p className="wc-notice" role="status">{notice}</p>}
    <ActivationRecord key={item.id + item.revision} item={item} onSaved={message => {setNotice(message); router.refresh();}} />
  </>;
}

function ActivationRecord({item,onSaved}: {item:ActivationCandidate;onSaved:(message:string)=>void}) {
  const [busy,setBusy] = useState(false);
  const [error,setError] = useState("");
  const opening = item.state !== "open";
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const values = new FormData(event.currentTarget);
    const slug = String(values.get("slug") ?? "").trim();
    const operatorEmail = String(values.get("operatorEmail") ?? "").trim();
    setBusy(true); setError("");
    try {
      const result = await getJson(await fetch(endpoint,{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          action:opening ? "open" : "paused", organisationId:item.id, revision:item.revision, reason:values.get("reason"),
          ...(opening ? {confirmed:values.get("confirmed")==="yes"} : {}),
          ...(opening && slug ? {slug} : {}), ...(opening && operatorEmail ? {operatorEmail} : {}),
        }),
      }));
      onSaved(result.state === "open" ? "Online requests are open for " + item.name + "." :
        "New online requests are paused for " + item.name + ". Existing affiliations and pending requests were kept.");
    } catch(e) { setError(e instanceof Error ? e.message : "Unable to change federation activation."); }
    finally { setBusy(false); }
  }

  return <div>
    {item.countryCode && <p>{regionLabel(item.countryCode) || item.countryCode}</p>}
    <p>Operator {item.hasOperator ? "assigned" : "not assigned"} · WPU reviewer {item.hasReviewer ? "assigned" : "not assigned"}</p>
    {item.slug && (item.state !== "unpublished" ? <p><Link href={"/federations/"+item.slug} target="_blank" rel="noreferrer">Open federation page</Link></p> :
      <p>Existing URL name <code>{item.slug}</code></p>)}
    {item.lastAction && <p>Last changed by {item.lastAction.actor} · {item.lastAction.at} UTC. {item.lastAction.reason}</p>}
    <form className="wc-form" onSubmit={event => void save(event)}>
      {!opening && <p>Pausing removes the federation from the player directory and stops new self-requests. The federation page, roster, pending requests and approved affiliations stay available.</p>}
      {opening && <>
        {!item.slug && <label>Public URL name<input name="slug" defaultValue={suggestSlug(item.name)} required maxLength={63} pattern="[a-z0-9]+(?:-[a-z0-9]+)*" /></label>}
        {!item.hasOperator && <>
          <label>Verified WPU email of the federation operator<input name="operatorEmail" type="email" autoComplete="off" maxLength={254} required /></label>
          <p>This grants access to this federation’s workspace only. The operator still uses the existing WPU staff sign-in.</p>
        </>}
        {!item.hasReviewer && <p>No active WPU reviewer is assigned. You’ll become the scoped reviewer for this federation when you publish.</p>}
        {!item.verified && <p>Publishing verifies this record for operating WPU tools only. It does not establish national recognition or formal membership.</p>}
        <label className="wc-inline-check"><input type="checkbox" name="confirmed" value="yes" required /> I confirm this federation is ready for public affiliation requests.</label>
      </>}
      <label>Reason for this change<input name="reason" required minLength={3} maxLength={500} /></label>
      {error && <p role="alert">{error}</p>}
      <button type="submit" disabled={busy}>{busy ? "Saving…" : opening ? item.state === "paused" ? "Resume new requests" : "Publish federation" : "Pause new requests"}</button>
    </form>
  </div>;
}
