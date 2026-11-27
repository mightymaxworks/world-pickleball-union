# WPU Event Studio — release 1

The first production slice creates and publishes a one-day programme for a verified organisation. It does not open bookings, sanction events, generate rankings or connect the OurOwn prototype to production.

- Organisers sign in normally at `/event-studio`. WPU Control and its staff verification are unchanged.
- A verified active account needs an explicit active `organiser` role scoped to a verified organisation. A global role, membership, or federation administrator role alone does not grant access.
- Activity types are tournament, clinic, social and information. Activities without a start time stay in the private draft.
- Public pages at `/events/[slug]` read the last published snapshot only. Saved draft edits do not alter it. Taking the page offline retains the draft and URL.
- Release 1 provides a direct public URL, not a public discovery directory.
- Approval of an organisation and appointment of an organiser are separate decisions. The release migration grants neither and publishes nothing.

## Release and acceptance

The worker can be deployed before or after the additive D1 migration. Before schema readiness it shows an unavailable state to signed-in users. The production migration runs through the repository's existing Cloudflare D1 workflow pattern after merge. Validate the deploy and migration before testing the named organiser flow.

To enable a named organiser, a WPU operator with database access must first confirm the exact registered account ID and verified host organisation ID from approved onboarding records. Use a scoped role assignment in the existing `wpu_role_assignments` table, with role `organiser`, scope type `organisation`, scope ID set to that organisation, and the operator recorded in `granted_by_account_id`. Do not repurpose a staff role or automatically grant an entire federation access. Revoking the role removes access to drafts immediately. Take a public page offline separately if needed.

1. Confirm a signed-out visit leads to WPU sign-in and returns to Event Studio.
2. Confirm a member without an organiser grant sees no workspace. Confirm the scoped organiser sees only their host organisation.
3. As that organiser, create an event, schedule an activity, leave one activity unscheduled, then save and reopen the draft. If using production, obtain the host's approval before publishing any event. Use an isolated database for synthetic published fixtures.
4. Preview and publish an approved event. Open its public URL signed out. Check that the host name and scheduled activities appear and the unscheduled activity does not.
5. Save a different start time and confirm the public page still shows the prior time. Publish the change, then confirm the new time. Taking the page offline should remove the public view and retain the draft.
6. Run the SQLite integration test and verify Cloudflare build and migration checks.

Next: free doubles entries with partner confirmation and clinic capacity bookings, then a complete one-division event-day workflow. The first internal rehearsal can be synthetic; the real event can be hosted by any ready organisation.
