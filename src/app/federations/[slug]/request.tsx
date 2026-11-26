"use client";
import { useState } from "react";

export default function AffiliationRequest({ organisationId }: { organisationId: string }) {
  const [state, setState] = useState<"idle" | "pending" | "sent" | "error">("idle");
  async function submit() {
    setState("pending");
    try {
      const response = await fetch("/api/passport/affiliation-requests", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request", organisationId }),
      });
      setState(response.status === 201 ? "sent" : "error");
    } catch { setState("error"); }
  }
  return <>
    <p>Only request affiliation if you belong to this federation. Assigned WPU reviewers can see your Passport display name and the last eight characters of your Player ID, not your contact details.</p>
    {state === "sent" ? <p role="status">Request submitted. Awaiting WPU review.</p> :
      <button type="button" disabled={state === "pending"} onClick={() => void submit()}>Request affiliation</button>}
    {state === "error" && <p role="alert">No new request was submitted. Check your Passport for an existing request or try again.</p>}
  </>;
}
