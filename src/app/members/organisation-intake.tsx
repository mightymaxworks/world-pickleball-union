"use client";

import Link from "next/link";
import { useRef, useState, type FormEvent } from "react";
import { residenceCountries } from "@/lib/passport/regions";
import { intakeOrganisationTypes } from "@/lib/organisation-intake-types";

export default function OrganisationIntakeForm() {
  const requestId = useRef("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState("");
  const [reference, setReference] = useState("");
  const confirmation = useRef<HTMLDivElement>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || reference) return;
    setBusy(true);
    setProblem("");
    requestId.current ||= crypto.randomUUID();
    const form = event.currentTarget;
    try {
      const response = await fetch("/api/inquiries", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...Object.fromEntries(new FormData(form)), form_type: "organisation", reference: requestId.current }) });
      const data = await response.json();
      if (!response.ok || typeof data.reference !== "string") throw new Error(data.error || "Unable to submit. Please try again.");
      setReference(data.reference);
      requestAnimationFrame(() => confirmation.current?.focus());
    } catch (error) { setProblem(error instanceof Error ? error.message : "Unable to submit. Please try again."); }
    finally { setBusy(false); }
  }

  if (reference) return <div className="public-intake-feedback" role="status" tabIndex={-1} ref={confirmation}>
    <h3>Request received</h3>
    <p>Keep this reference for your records. WPU may contact you at the email you provided.</p>
    <code>{reference}</code>
  </div>;

  return <form className="public-intake-form" onSubmit={event => void submit(event)}>
    <label hidden style={{display:"none"}}>Leave blank<input name="company_fax" tabIndex={-1} autoComplete="off" /></label>
    <div className="public-intake-fields">
      <label>Organisation name<input name="organisation" autoComplete="organization" maxLength={160} required /></label>
      <label>Organisation type<select name="organisationType" defaultValue="" required><option value="" disabled>Select type</option>
        {Object.entries(intakeOrganisationTypes).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label>Country or territory where you operate<select name="country" defaultValue="" required><option value="" disabled>Select country or territory</option>
        {residenceCountries.map(country => <option key={country.code} value={country.code}>{country.name}</option>)}</select></label>
      <label>Contact name<input name="contactName" autoComplete="name" maxLength={160} required /></label>
      <label>Your role<input name="role" autoComplete="organization-title" maxLength={120} required /></label>
      <label>Contact email<input type="email" name="email" autoComplete="email" maxLength={254} required /></label>
    </div>
    <label>Website or social profile (optional)<input type="url" name="website" autoComplete="url" placeholder="https://" maxLength={500} /></label>
    <label>How would you like to participate?<textarea name="message" rows={4} maxLength={2000} required /></label>
    <label className="public-intake-consent"><input type="checkbox" name="consent" value="yes" required /><span>WPU may use these details to review and respond to this request. <Link href="/membership/privacy">Privacy notice</Link>.</span></label>
    {problem && <p role="alert">{problem}</p>}
    <button className="public-primary" type="submit" disabled={busy}>{busy ? "Sending…" : "Submit participation request"}</button>
  </form>;
}
