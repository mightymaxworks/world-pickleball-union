"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Passport, PassportProfile } from "@/lib/passport/profile";
import { regionLabel, residenceCountries } from "@/lib/passport/regions";

import AffiliationInvitations from "./affiliation-invitations";

const fields = ["name", "givenName", "familyName", "residenceCountry", "locality", "gender"] as const;
type Draft = Record<(typeof fields)[number], string>;
type State =
  | { kind: "loading" | "signed-out" | "error" | "unavailable" }
  | { kind: "ready"; passport: Passport };
type IconName = "id" | "lock" | "arrow" | "trophy" | "network" | "check" | "copy" | "close" | "logout";

function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    id: <><rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="8.5" cy="11" r="1.5"/><path d="M6 16c0-2.4 5-2.4 5 0m3-6h4m-4 4h4"/></>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3"/></>,
    arrow: <path d="M4 12h15m-6-6 6 6-6 6"/>,
    trophy: <><path d="M8 21h8m-4-5v5M7 4h10v6a5 5 0 0 1-10 0zM7 6H4v3a3 3 0 0 0 3 3m10-6h3v3a3 3 0 0 1-3 3"/></>,
    network: <><circle cx="12" cy="5" r="2"/><circle cx="5" cy="18" r="2"/><circle cx="19" cy="18" r="2"/><path d="M11 7 6 16m7-9 5 9M7 18h10"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    copy: <><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></>,
    close: <path d="m6 6 12 12M18 6 6 18"/>,
    logout: <path d="M11 5H5v14h6m3-11 4 4-4 4m-4-4h11"/>,
  };
  return <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function formatDate(value: string | null) {
  if (!value || !/^\d{4}-\d{2}-\d{2}/.test(value)) return "";
  const date = new Date(value.slice(0, 10) + "T00:00:00Z");
  return Number.isNaN(date.valueOf()) ? "" : new Intl.DateTimeFormat("en-GB", {
    year: "numeric", month: "short", day: "numeric", timeZone: "UTC",
  }).format(date);
}

function initialDraft(profile: PassportProfile): Draft {
  return Object.fromEntries(fields.map(key => [key, profile[key] ?? ""])) as Draft;
}

function makePatch(draft: Draft, initial: Draft) {
  const changes: Partial<Draft> = {};
  for (const field of fields) {
    if (draft[field].trim() !== initial[field]) changes[field] = draft[field].trim();
  }
  if (changes.residenceCountry !== undefined) changes.locality = draft.locality.trim();
  return changes;
}

function Brand() {
  return <Image src="/brand/wpu-logo-approved.png" alt="World Pickleball Union" width={156} height={52} unoptimized />;
}

function Credential({ passport, titleId }: { passport: Passport; titleId: string }) {
  const active = passport.membershipStatus === "active";
  const memberSince = formatDate(passport.memberSince);
  return (
    <div className="pp-credential">
      <div className="pp-court" aria-hidden="true"><span /></div>
      <div className="pp-credential-top">
        <Brand />
        <span className={active ? "pp-badge pp-badge-active" : "pp-badge"}>
          {active && <Icon name="check" />}{active ? "Active member" : "Membership inactive"}
        </span>
      </div>
      <div className="pp-credential-person">
        <p className="pp-eyebrow">Global player passport</p>
        <h2 id={titleId}>{passport.name}</h2>
      </div>
      <dl className="pp-credential-details">
        <div><dt>Permanent Player ID</dt><dd className="pp-player-code">{passport.playerCode}</dd></div>
        {memberSince && <div><dt>Member since</dt><dd>{memberSince}</dd></div>}
      </dl>
    </div>
  );
}

export default function PassportDashboard() {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [retry, setRetry] = useState(0);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState<"profile" | "privacy" | "logout" | null>(null);
  const [notice, setNotice] = useState<{ area: "profile" | "privacy" | "logout"; text: string; error?: boolean } | null>(null);
  const [copyMessage, setCopyMessage] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const editButton = useRef<HTMLButtonElement>(null);
  const firstField = useRef<HTMLInputElement>(null);
  const restoreEditFocus = useRef(false);
  const editing = draft !== null;

  useEffect(() => {
    if (editing) firstField.current?.focus();
    else if (restoreEditFocus.current) {
      editButton.current?.focus();
      restoreEditFocus.current = false;
    }
  }, [editing]);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch("/api/passport", { cache: "no-store", signal: controller.signal });
        let next: State;
        if (response.status === 401) next = { kind: "signed-out" };
        else if (response.status === 404) next = { kind: "unavailable" };
        else if (response.ok) next = { kind: "ready", passport: (await response.json()).passport as Passport };
        else next = { kind: "error" };
        if (!controller.signal.aborted) setState(next);
      } catch {
        if (!controller.signal.aborted) setState({ kind: "error" });
      }
    }
    void load();
    return () => controller.abort();
  }, [retry]);

  function signInRequired() {
    dialog.current?.close();
    setDraft(null);
    setState({ kind: "signed-out" });
  }

  async function update(area: "profile" | "privacy", changes: Partial<Draft> | { visibility: "private" }) {
    setBusy(area);
    setNotice(null);
    try {
      const response = await fetch("/api/passport", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });
      if (response.status === 401) { signInRequired(); return; }
      if (!response.ok) {
        const message = response.status === 400 ? (await response.json()).error : null;
        throw new Error(message || "Your changes could not be saved. Please try again.");
      }
      const result = await response.json() as { profile?: PassportProfile };
      setState(current => current.kind === "ready" ? {
        kind: "ready",
        passport: area === "privacy" ? { ...current.passport, visibility: "private" } : { ...current.passport, ...result.profile },
      } : current);
      if (area === "profile") setDraft(null);
      setNotice({ area, text: area === "privacy" ? "Your profile is now private." : "Your profile has been saved." });
    } catch (error) {
      setNotice({ area, text: error instanceof Error ? error.message : "Please try again.", error: true });
    } finally {
      setBusy(null);
    }
  }

  async function logout() {
    setBusy("logout");
    setNotice(null);
    try {
      const response = await fetch("/api/auth/logout", { method: "POST" });
      if (!response.ok && response.status !== 401) throw new Error();
      signInRequired();
      window.location.replace("/join");
    } catch {
      setNotice({ area: "logout", text: "Could not sign out. Please try again.", error: true });
    } finally {
      setBusy(null);
    }
  }

  async function copyCode(ownCode: string) {
    try {
      await navigator.clipboard.writeText(ownCode);
      setCopyMessage("Player ID copied.");
    } catch {
      setCopyMessage("Could not copy automatically. Select the ID on your card to copy it.");
    }
  }

  const passport = state.kind === "ready" ? state.passport : null;
  const editChanges = passport && draft ? makePatch(draft, initialDraft(passport)) : {};
  const setField = (field: keyof Draft, value: string) => setDraft(current => current ? {
    ...current, [field]: value,
    ...(field === "residenceCountry" && current.residenceCountry !== value ? { locality: "" } : {}),
  } : current);
  function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (Object.keys(editChanges).length && !busy) void update("profile", editChanges);
  }
  const fieldNotice = (area: "profile" | "privacy" | "logout") =>
    notice?.area === area ? <p className={notice.error ? "pp-feedback pp-feedback-error" : "pp-feedback"} role={notice.error ? "alert" : "status"}>{notice.text}</p> : null;

  return (
    <div className="pp-shell">
      <header className="pp-topbar">
        <div className="pp-container pp-topbar-inner">
          <Link href="/" className="pp-brand-link"><Brand /></Link>
          {passport && <button type="button" className="pp-signout" disabled={busy !== null} onClick={() => void logout()}><Icon name="logout" />{busy === "logout" ? "Signing out…" : "Sign out"}</button>}
        </div>
      </header>
      <main className="pp-container pp-main">
        <div className="pp-heading">
          <p className="pp-eyebrow"><span /> WPU membership</p>
          <h1>Player Passport</h1>
          <p className="pp-lede">Your permanent WPU identity and sporting record.</p>
        </div>
        {fieldNotice("logout")}
        {state.kind === "loading" && <div className="pp-panel"><p role="status">Loading your Passport…</p></div>}
        {state.kind === "signed-out" && <section className="pp-panel pp-entry"><Icon name="lock" /><h2>Your Passport is private</h2><p>Sign in with your WPU account to view your membership and manage your profile.</p><Link className="pp-button pp-primary" href="/join?mode=login">Sign in to your Passport <Icon name="arrow" /></Link></section>}
        {state.kind === "error" && <section className="pp-panel pp-entry"><p role="alert">Your Passport is temporarily unavailable.</p><button className="pp-button pp-primary" onClick={() => { setState({ kind: "loading" }); setRetry(count => count + 1); }}>Try again</button></section>}
        {state.kind === "unavailable" && <section className="pp-panel pp-entry"><h2>No Passport found</h2><p>You’re signed in, but we couldn’t find a Passport for this account.</p><a className="pp-link" href="mailto:support@worldpickleball.world">Contact WPU support</a></section>}
        {passport && <>
          <nav className="pp-nav" aria-label="Passport sections">
            <a href="#credential">Credential</a><a href="#profile">My profile</a><a href="#sporting-record">Sporting record</a>
          </nav>
          <div className="pp-grid">
            <div className="pp-stack">
              <section id="credential" className="pp-identity" aria-labelledby="pp-identity-title">
                <h2 id="pp-identity-title" className="pp-sr-only">Digital membership credential</h2>
                <Credential passport={passport} titleId="pp-card-name" />
                <div className="pp-card-actions">
                  <button type="button" className="pp-button pp-primary" onClick={() => { setCopyMessage(""); dialog.current?.showModal(); }}><Icon name="id" /> Show credential</button>
                  <button type="button" className="pp-button pp-secondary" onClick={() => void copyCode(passport.playerCode)}><Icon name="copy" /> Copy Player ID</button>
                  <p className="pp-copy pp-feedback" role="status">{copyMessage}</p>
                </div>
              </section>

              <section className="pp-panel" id="profile" aria-labelledby="pp-profile-title">
                <div className="pp-section-title">
                  <div><p className="pp-eyebrow">Private account details</p><h2 id="pp-profile-title">My profile</h2></div>
                  {!draft && <button type="button" className="pp-button pp-secondary" ref={editButton} disabled={busy !== null} onClick={() => { restoreEditFocus.current = true; setDraft(initialDraft(passport)); setNotice(null); }}>Edit profile</button>}
                </div>
                {draft ? (
                  <form className="pp-form" onSubmit={saveProfile}>
                    <fieldset disabled={busy !== null}>
                      <legend className="pp-sr-only">Edit profile details</legend>
                      <label className="pp-span">Display name<input ref={firstField} required maxLength={160} value={draft.name} onChange={e => setField("name", e.target.value)} /><span className="pp-help">Shown on your credential. Your Player ID stays the same.</span></label>
                      <label>Given name(s)<input autoComplete="given-name" maxLength={80} required={Boolean(passport.givenName || draft.givenName)} value={draft.givenName} onChange={e => setField("givenName", e.target.value)} /></label>
                      <label>Family name <span className="pp-help">(optional)</span><input autoComplete="family-name" maxLength={79} value={draft.familyName} onChange={e => setField("familyName", e.target.value)} /></label>
                      <label>Country or territory of residence<select autoComplete="country" required={Boolean(passport.residenceCountry || draft.residenceCountry)} value={draft.residenceCountry} onChange={e => setField("residenceCountry", e.target.value)}>
                        <option value="">Select a country or territory</option>
                        {passport.residenceCountry && !residenceCountries.some(c => c.code === passport.residenceCountry) && <option value={passport.residenceCountry}>{regionLabel(passport.residenceCountry) || "Not recorded"} (existing)</option>}
                        {residenceCountries.map(country => <option key={country.code} value={country.code}>{country.name}</option>)}
                      </select></label>
                      <label>City, town or locality<input autoComplete="address-level2" maxLength={120} required={Boolean(passport.locality || editChanges.residenceCountry || draft.locality)} value={draft.locality} onChange={e => setField("locality", e.target.value)} /></label>
                      <label>Gender<select required={Boolean(passport.gender || draft.gender)} value={draft.gender} onChange={e => setField("gender", e.target.value)}>
                        <option value="">Not recorded</option><option value="female">Female</option><option value="male">Male</option>
                      </select></label>
                    </fieldset>
                    {fieldNotice("profile")}
                    <div className="pp-actions">
                      <button type="submit" className="pp-button pp-primary" disabled={busy !== null || !Object.keys(editChanges).length}>{busy === "profile" ? "Saving…" : "Save changes"}</button>
                      <button type="button" className="pp-button pp-secondary" disabled={busy !== null} onClick={() => { setDraft(null); setNotice(null); }}>Cancel</button>
                    </div>
                  </form>
                ) : <>
                  <dl className="pp-profile-data">
                    <div><dt>Display name</dt><dd>{passport.name}</dd></div>
                    <div><dt>Given name(s)</dt><dd>{passport.givenName || "Not recorded"}</dd></div>
                    <div><dt>Family name</dt><dd>{passport.familyName || "Not recorded"}</dd></div>
                    <div><dt>Country or territory of residence</dt><dd>{regionLabel(passport.residenceCountry) || "Not recorded"}</dd></div>
                    <div><dt>City, town or locality</dt><dd>{passport.locality || "Not recorded"}</dd></div>
                    <div><dt>Gender</dt><dd>{passport.gender === "male" ? "Male" : passport.gender === "female" ? "Female" : "Not recorded"}</dd></div>
                  </dl>
                  {fieldNotice("profile")}
                </>}
              </section>
            </div>

            <div className="pp-stack">
              <section className="pp-panel" id="sporting-record" aria-labelledby="pp-sport-title">
                <div className="pp-section-title"><div><p className="pp-eyebrow">On court</p><h2 id="pp-sport-title">Sporting record</h2></div><span className="pp-tile-icon"><Icon name="trophy" /></span></div>
                <div className="pp-record">
                  <h3>Competition history</h3><p>Event registrations and results are not available in the Passport yet.</p>
                </div>
                <div className="pp-record">
                  <h3>Official rankings</h3><p>WPU has not published official rankings yet.</p>
                </div>
                <Link className="pp-link" href="/competitions">Explore WPU competitions <Icon name="arrow" /></Link>
              </section>

              <section className="pp-panel" aria-labelledby="pp-affiliation-title">
                <div className="pp-section-title"><div><p className="pp-eyebrow">Your connections</p><h2 id="pp-affiliation-title">Affiliations</h2></div><span className="pp-tile-icon"><Icon name="network" /></span></div>
                {!passport.affiliations.length ? <p>No organisation affiliations are recorded on your Passport.</p> : (
                  <ul className="pp-affiliation-list">{passport.affiliations.map((item, index) => <li key={item.organisationId + "-" + index}>
                    <h3>{item.name}</h3><p>{item.type.replaceAll("_", " ")} · Recorded status: {item.status}</p>
                    {formatDate(item.validUntil) && <p>Valid until {formatDate(item.validUntil)}</p>}
                  </li>)}</ul>
                )}
                <p className="pp-help">Affiliation does not establish national representation or competition eligibility.</p>
                {passport.affiliationRequestsEnabled && <AffiliationInvitations />}
              </section>

              <section className="pp-panel" aria-labelledby="pp-privacy-title">
                <div className="pp-section-title"><div><p className="pp-eyebrow">You control your details</p><h2 id="pp-privacy-title">Privacy &amp; account</h2></div><span className="pp-tile-icon"><Icon name="lock" /></span></div>
                {passport.emailVerified && <p className="pp-verified"><Icon name="check" /> Email verified</p>}
                <p>{passport.visibility === "private" ? "Your profile is private." : "Public sharing is not available. You can set your profile to private below."} Your contact details are never shown on the credential.</p>
                {passport.visibility !== "private" && <button type="button" className="pp-button pp-secondary" disabled={busy !== null} onClick={() => void update("privacy", { visibility: "private" })}>{busy === "privacy" ? "Saving…" : "Make my profile private"}</button>}
                {fieldNotice("privacy")}
                <Link className="pp-link" href="/membership/privacy">Read the privacy notice <Icon name="arrow" /></Link>
              </section>
            </div>
          </div>

          <dialog ref={dialog} className="pp-dialog" aria-labelledby="pp-dialog-title">
            <div className="pp-dialog-inner">
              <div className="pp-section-title"><h2 id="pp-dialog-title">Membership credential</h2><button type="button" className="pp-button pp-secondary" aria-label="Close credential" onClick={() => dialog.current?.close()}><Icon name="close" /></button></div>
              <Credential passport={passport} titleId="pp-dialog-name" />
              <p className="pp-help">Shows your WPU membership. This is not proof of identity or competition eligibility.</p>
            </div>
          </dialog>
        </>}
      </main>
    </div>
  );
}
