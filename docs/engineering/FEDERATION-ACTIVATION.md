# Federation activation in WPU Control

## Staff workflow

1. Accept the organisation's participation request in WPU Control if a new national federation record is needed. A verified existing national federation can be selected directly. Clubs and regional associations do not appear in this screen.
2. The WPU publication operator signs in to WPU Control with their approved staff identity and matching verified WPU account. In **Federation activation**, open the federation record.
3. Confirm the federation is ready for operational publication, choose the permanent public URL name if it has none, and provide the verified WPU email of the federation's operator if there is no active operator. Keep existing scoped staff. If there is no active reviewer, the publishing operator takes the WPU review role for that federation. A new operator must still be able to use the existing WPU staff sign-in.
4. Publish with a reason. Publication adds the federation to the player directory, opens online requests and creates the needed organisation-scoped grants in the same transaction. It is not formal WPU membership, recognition, representation, competition eligibility or an external-client grant. A pending organisation record is verified operationally, not recognised as a governing body.
5. For live acceptance, have the named federation operator open its roster. A consenting player uses their existing Passport or creates one once, submits a real request, and checks that the approved affiliation appears without changing their Player ID. Confirm the operator cannot see another federation's roster. Confirm the federation's support owner can answer requests.

## Pause and resume

Pause removes the federation from the player directory and blocks new self-requests both on the federation page and directly from the Passport. It leaves the canonical link, roster, existing approvals, staff scopes and pending requests intact. Reviewers can still decide pending cases. Resume reuses the same URL name and existing active grants. Every action records the actor, time, reason and any activation grants in append-only history. Stale or duplicate changes do not overwrite a more recent decision.

## Release boundaries

This is a separate publisher permission. Holding a federation administrator or affiliation reviewer role does not by itself grant publication. The release prepares the additive schema and grants initial publication access to the nominated WPU operations account, with existing global WPU administrator access also supported. It does not publish, pause or change any federation. No Cloudflare settings change. The second real federation needs a named organisation, an active operator and a consenting player before a production acceptance run.
