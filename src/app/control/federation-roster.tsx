"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { federationRosterCsv, type RosterExportPlayer } from "@/lib/federations/roster-export";

type Scope = { slug: string; name: string };
type Player = RosterExportPlayer;
type Roster = { players: Player[]; next: string | null };

const endpoint = "/api/control/federation-roster";
export default function FederationRosterPanel({ scopes }: { scopes: Scope[] }) {
  const router = useRouter();
  const [scope, setScope] = useState(scopes[0].slug);
  const [page, setPage] = useState<string[]>([""]);
  const [roster, setRoster] = useState<Roster | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [revision, refresh] = useState(0);
  const after = page.at(-1) ?? "";
  useEffect(() => {
    const controller = new AbortController();
    void fetch(endpoint + "?" + new URLSearchParams({ federation: scope, after }), { signal: controller.signal, cache: "no-store" })
      .then(async response => {
        if (!response.ok) throw Error("Unable to load this roster. Check your WPU staff session and try again.");
        const value: Roster = await response.json();
        if (!controller.signal.aborted) setRoster(value);
      }).catch((failure: Error) => { if (!controller.signal.aborted) setError(failure.message); });
    return () => controller.abort();
  }, [scope, after, revision]);

  async function update(player: Player) {
    setBusy(true); setError(""); setNotice("");
    const rosterStatus = player.rosterStatus === "listed" ? "on_hold" : "listed";
    try {
      const response = await fetch(endpoint, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ federation: scope, playerId: player.playerId, rosterStatus }),
      });
      if (!response.ok) throw Error("The roster wasn’t updated. Refresh and check the entry.");
      setNotice(rosterStatus === "listed" ? "Player listed." : "Player put on hold.");
      setRoster(null); refresh(n => n + 1);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Roster update unavailable.");
    } finally { setBusy(false); }
  }

  function switchScope(slug: string) {
    setScope(slug); setRoster(null); setPage([""]); setNotice(""); setError("");
  }

  function exportPage(format: "csv" | "json") {
    if (!roster) return;
    const content = format === "csv" ? federationRosterCsv(roster.players)
      : JSON.stringify({ version: 1, federation: scope, players: roster.players }, null, 2);
    const type = format === "csv" ? "text/csv;charset=utf-8" : "application/json";
    const url = URL.createObjectURL(new Blob([content], { type }));
    const link = document.createElement("a");
    link.href = url; link.download = scope + "-roster-page-" + page.length + "." + format; link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return <section className="wc-box">
    <p className="wc-label">Federation administration</p>
    <h2>Federation roster</h2>
    <p>Manage your local roster of WPU-approved affiliations. A roster hold does not change a player’s affiliation, Player ID or competition eligibility.</p>
    <div className="wc-form"><label>Federation<select value={scope} disabled={busy} onChange={e => switchScope(e.target.value)}>
      {scopes.map(option => <option key={option.slug} value={option.slug}>{option.name}</option>)}
    </select></label></div>
    {notice && <p role="status">{notice}</p>}
    {error && <div className="wc-actions"><p role="alert">{error}</p><button type="button" onClick={() => { setError(""); setRoster(null); refresh(n => n + 1); router.refresh(); }}>Refresh</button></div>}
    {!roster && !error && <p role="status">Loading roster…</p>}
    {roster && <>
      {!roster.players.length && <p>No approved affiliations on this page.</p>}
      <ul className="wc-cases">
        {roster.players.map(player => <li className="wc-case wc-casehead" key={player.playerId}>
          <div><h3>{player.displayName}</h3><p>{player.playerId}</p><span className="wc-state">{player.rosterStatus === "listed" ? "Listed" : "On hold"}</span></div>
          <button type="button" disabled={busy} onClick={() => void update(player)}>{player.rosterStatus === "listed" ? "Put on hold" : "Return to roster"}</button>
        </li>)}
      </ul>
      <div className="wc-actions">
        {page.length > 1 && <button type="button" disabled={busy} onClick={() => { setRoster(null); setPage(page.slice(0, -1)); }}>Previous page</button>}
        {roster.next && <button type="button" disabled={busy} onClick={() => { setRoster(null); setPage([...page, roster.next!]); }}>Next page</button>}
        {roster.players.length > 0 && <>
          <button type="button" disabled={busy} onClick={() => exportPage("csv")}>Download CSV (this page)</button>
          <button type="button" disabled={busy} onClick={() => exportPage("json")}>Export this page (JSON)</button>
        </>}
      </div>
    </>}
  </section>;
}
