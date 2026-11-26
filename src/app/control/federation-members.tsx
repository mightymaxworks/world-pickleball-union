"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { memberCategories, type MemberFilters, type MemberRecord, type MemberSummary } from "@/lib/federations/member-fields";

const endpoint = "/api/control/federation-members";
const empty: MemberFilters = { q: "", club: "", category: "", status: "" };
type Scope = { slug: string; name: string };
type Page = { members: MemberSummary[]; total: number; next: string | null };
const rosterLabel = (status: MemberSummary["rosterStatus"]) => status === "on_hold" ? "On hold" : "Listed";

class RequestError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

async function result(response: Response) {
  if (!response.ok) {
    const value = await response.json().catch(() => null);
    throw new RequestError(value?.error ?? "The request didn’t complete. Please retry.", response.status);
  }
  return response;
}

function download(blob: Blob, filename: string) {
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(href), 1000);
}

function Categories({ label }: { label: string }) {
  return <><option value="">{label}</option>{Object.entries(memberCategories).map(([value, title]) =>
    <option key={value} value={value}>{title}</option>)}</>;
}

export default function FederationMembers({ scopes }: { scopes: Scope[] }) {
  const [slug, setSlug] = useState(scopes[0]?.slug ?? "");
  const [filters, setFilters] = useState<MemberFilters>(empty);
  const [cursors, setCursors] = useState([""]);
  const [playerId, setPlayerId] = useState("");
  const [page, setPage] = useState<Page | null>(null);
  const [problem, setProblem] = useState("");
  const [signedOut, setSignedOut] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [csvBusy, setCsvBusy] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const openedFrom = useRef<HTMLButtonElement>(null);
  const query = new URLSearchParams({ federation: slug, ...filters }).toString();
  const after = cursors.at(-1) ?? "";

  useEffect(() => {
    const abort = new AbortController();
    void (async () => {
      try {
        const value: Page = await (await result(await fetch(endpoint + "?" + query + "&after=" +
          encodeURIComponent(after), { signal: abort.signal, cache: "no-store" }))).json();
        if (!abort.signal.aborted) { setPage(value); setProblem(""); setSignedOut(false); }
      } catch (error) {
        if (!abort.signal.aborted) {
          setPage(null);
          setProblem(error instanceof RequestError ? error.message : "Unable to load members. Please retry.");
          setSignedOut(error instanceof RequestError && error.status === 401);
        }
      }
    })();
    return () => abort.abort();
  }, [query, after, refresh]);

  function requery() {
    setPage(null);
    setProblem("");
    setRefresh(value => value + 1);
  }

  function apply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setFilters({
      q: String(form.get("q") ?? "").trim(), club: String(form.get("club") ?? "").trim(),
      category: String(form.get("category") ?? "") as MemberFilters["category"],
      status: String(form.get("status") ?? "") as MemberFilters["status"],
    });
    setCursors([""]);
    requery();
  }

  async function exportCsv() {
    setCsvBusy(true);
    setProblem("");
    try {
      const response = await result(await fetch(endpoint + "?" + query + "&format=csv", { cache: "no-store" }));
      if (!response.headers.get("content-type")?.startsWith("text/csv")) throw new Error();
      download(await response.blob(), slug + "-members.csv");
    } catch (error) {
      setProblem(error instanceof RequestError ? error.message : "Unable to download CSV. Please retry.");
    } finally { setCsvBusy(false); }
  }

  function closeRecord() {
    setPlayerId("");
    requestAnimationFrame(() => {
      if (openedFrom.current?.isConnected) openedFrom.current.focus();
      else heading.current?.focus();
    });
  }

  return <section className="wc-box" aria-labelledby="wc-fm">
    <p className="wc-label">Federation administration</p>
    <h2 id="wc-fm" tabIndex={-1} ref={heading}>Federation Members</h2>
    <p>Manage your local roster of WPU-approved affiliations.</p>
    {playerId && <MemberDetails key={slug + playerId} slug={slug} playerId={playerId} close={closeRecord}
      changed={() => { setCursors([""]); requery(); }} />}
    <div hidden={Boolean(playerId)}>
      <div className="wc-form"><label>Federation<select value={slug} disabled={csvBusy} onChange={event => {
        setSlug(event.target.value);
        setFilters(empty);
        setCursors([""]);
        requery();
      }}>{scopes.map(scope => <option key={scope.slug} value={scope.slug}>{scope.name}</option>)}</select></label></div>
      <form key={slug} className="wc-form" onSubmit={apply}>
        <div className="wc-member-grid">
          <label>Search members<input name="q" maxLength={100} placeholder="Name, WPU Player ID or local member number" /></label>
          <label>Primary club<input name="club" maxLength={100} placeholder="Any club" /></label>
          <label>Category<select name="category"><Categories label="All categories" /></select></label>
          <label>Roster status<select name="status"><option value="">All statuses</option><option value="listed">Listed</option>
            <option value="on_hold">On hold</option></select></label>
        </div>
        <div className="wc-actions">
          <button type="submit">Apply filters</button>
          <button type="reset" className="wc-secondary" onClick={() => {
            setFilters(empty);
            setCursors([""]);
            requery();
          }}>Clear filters</button>
        </div>
      </form>
      {problem && <p className="wc-feedback" role="alert">{problem} {signedOut ? <Link href="/join?mode=login">Sign in</Link> :
        !page && <button type="button" onClick={requery}>Retry</button>}</p>}
      {!page && !problem && <p role="status">Loading members…</p>}
      {page && <>
        <p role="status">{page.total.toLocaleString()} {page.total === 1 ? "member matches" : "members match"} the applied filters.
          {page.members.length > 0 && " Showing " + page.members.length + " on this page."}</p>
        {page.members.length > 0 && <ul className="wc-cases">
          {page.members.map(member => <li className="wc-case wc-casehead" key={member.playerId}>
            <div><h3>{member.displayName}</h3><p>{member.playerId}</p>
              <p>{[member.membershipNumber && "Member no. " + member.membershipNumber, member.club,
                member.category && memberCategories[member.category]].filter(Boolean).join(" · ") || "No local details recorded"}</p>
              <span className="wc-state">{rosterLabel(member.rosterStatus)}</span>
            </div>
            <button type="button" aria-label={"Open record for " + member.displayName} onClick={event => {
              openedFrom.current = event.currentTarget;
              setPlayerId(member.playerId);
            }}>Open member</button>
          </li>)}
        </ul>}
        {(cursors.length > 1 || page.next) && <div className="wc-actions wc-member-actions">
          <button type="button" className="wc-secondary" disabled={cursors.length < 2}
            onClick={() => { setCursors(value => value.slice(0, -1)); requery(); }}>Previous page</button>
          <button type="button" className="wc-secondary" disabled={!page.next}
            onClick={() => { if (page.next) { setCursors(value => [...value, page.next!]); requery(); } }}>Next page</button>
        </div>}
        {page.total > 0 && <div className="wc-actions wc-member-actions">
          <button type="button" disabled={csvBusy} onClick={() => void exportCsv()}>
            {csvBusy ? "Preparing CSV…" : "Download filtered CSV"}</button>
          <button type="button" className="wc-secondary" disabled={!page.members.length} onClick={() =>
            download(new Blob([JSON.stringify({ version: 1, federation: slug, players: page.members.map(
              ({ playerId, displayName, rosterStatus }) => ({ playerId, displayName, rosterStatus })) }, null, 2)],
            { type: "application/json" }), slug + "-roster.json")}>Export this page (JSON)</button>
        </div>}
        {page.total > 0 && <p className="wc-portal-note">Exports include player name, WPU Player ID and roster status. CSV includes all matches, up to 1,000.</p>}
      </>}
    </div>
  </section>;
}

function MemberDetails({ slug, playerId, close, changed }: {
  slug: string; playerId: string; close: () => void; changed: () => void;
}) {
  const [record, setRecord] = useState<MemberRecord | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [busy, setBusy] = useState(false);
  const [signedOut, setSignedOut] = useState(false);
  const title = useRef<HTMLHeadingElement>(null);
  useEffect(() => { title.current?.focus(); }, []);
  useEffect(() => {
    const abort = new AbortController();
    const query = new URLSearchParams({ federation: slug, playerId });
    void (async () => {
      try {
        const value = await (await result(await fetch(endpoint + "?" + query, { signal: abort.signal, cache: "no-store" }))).json();
        if (!abort.signal.aborted) { setRecord(value.member); setError(""); setSignedOut(false); }
      } catch (error) {
        if (!abort.signal.aborted) {
          setRecord(null);
          setError(error instanceof RequestError ? error.message : "Unable to open the member record.");
          setSignedOut(error instanceof RequestError && error.status === 401);
        }
      }
    })();
    return () => abort.abort();
  }, [slug, playerId, refresh]);

  async function submit(event: FormEvent<HTMLFormElement>, action: "save_details" | "set_roster_status") {
    event.preventDefault();
    if (!record || busy) return;
    const form = event.currentTarget;
    const fields = Object.fromEntries(new FormData(form));
    const update = action === "save_details" ? { ...fields, revision: record.revision } : {
      reason: fields.reason, status: record.rosterStatus === "listed" ? "on_hold" : "listed", revision: record.rosterRevision,
    };
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await result(await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ federation: slug, playerId, action, ...update }) }));
      if (action === "set_roster_status") form.reset();
      setNotice(action === "save_details" ? "Federation details saved." : "Roster status updated and recorded in history.");
      setRecord(null);
      setRefresh(value => value + 1);
      changed();
    } catch (error) {
      setError(error instanceof RequestError ? error.message : "Unable to save the member record. Please retry.");
      if (error instanceof RequestError && (error.status === 401 || error.status === 403)) {
        setRecord(null);
        setSignedOut(error.status === 401);
      }
    } finally { setBusy(false); }
  }

  return <div className="wc-member-details">
    <button type="button" className="wc-secondary" onClick={close} disabled={busy}>Back to members</button>
    <h3 ref={title} tabIndex={-1}>{record?.displayName ?? "Member record"}</h3>
    {error && <p role="alert">{error} {signedOut ? <Link href="/join?mode=login">Sign in</Link> :
      <button type="button" className="wc-secondary" onClick={() => {
        setRecord(null); setError(""); setRefresh(value => value + 1);
      }}>Refresh record</button>}</p>}
    {notice && <p role="status">{notice}</p>}
    {!record && !error && <p role="status">Loading member record…</p>}
    {record && <>
      <dl className="wc-member-grid wc-member-facts">
        <div><dt>Permanent WPU Player ID</dt><dd>{record.playerId}</dd></div>
        <div><dt>WPU affiliation</dt><dd>Approved</dd></div>
        <div><dt>Local roster status</dt><dd><span className="wc-state">{rosterLabel(record.rosterStatus)}</span></dd></div>
      </dl>
      <form className="wc-form" onSubmit={event => void submit(event, "save_details")}>
        <h3>Federation details</h3>
        <div className="wc-member-grid">
          <label>Local member number<input name="membershipNumber" maxLength={40} defaultValue={record.membershipNumber ?? ""} /></label>
          <label>Primary club<input name="club" maxLength={100} defaultValue={record.club ?? ""} /></label>
          <label>Member category<select name="category" defaultValue={record.category ?? ""}><Categories label="Not recorded" /></select></label>
          <label>Local join date<input name="joinedOn" type="date" defaultValue={record.joinedOn ?? ""} /></label>
          <label>Membership renewal date<input name="renewalOn" type="date" defaultValue={record.renewalOn ?? ""} /></label>
        </div>
        <button type="submit" disabled={busy}>Save local details</button>
      </form>
      <form className="wc-form wc-case" onSubmit={event => void submit(event, "set_roster_status")}>
        <h3>{record.rosterStatus === "listed" ? "Put member on hold" : "Restore member to roster"}</h3>
        <p>This changes the local roster only. The player’s WPU affiliation, ID and competition eligibility stay the same.</p>
        <label>Reason<input name="reason" maxLength={240} required placeholder="Avoid private or sensitive information" /></label>
        <button type="submit" disabled={busy}>{record.rosterStatus === "listed" ? "Put on hold" : "Restore to roster"}</button>
      </form>
      <details className="wc-case" open>
        <summary>Roster history</summary>
        {record.history.length ? <><p>Up to 30 recent changes</p><ol>{record.history.map((event, index) => {
          const at = new Date(event.changedAt.replace(" ", "T") + "Z");
          return <li key={event.changedAt + index}><strong>{rosterLabel(event.status)}</strong> · {event.actor} ·{" "}
            <time dateTime={at.toISOString()}>{at.toLocaleString()}</time><p>{event.reason ?? "No reason recorded."}</p></li>;
        })}</ol></> : <p>No holds or restorations recorded.</p>}
      </details>
    </>}
  </div>;
}
