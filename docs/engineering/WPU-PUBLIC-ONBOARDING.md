# Public onboarding and organisation participation

- `/get-involved` is the public Join WPU landing page. `/join` continues to create a Player Passport. `/join?mode=login` signs in. Valid federation links keep their original paths, modes and post-login return destinations.
- `/members` and its existing `#register` anchor are the organisation front door. `/federations` forwards there, without changing federation-specific paths. Pledges and competition-hosting enquiries keep their separate workflows.
- The new public form keeps the existing membership inquiry records in D1. Submission returns a request reference. A repeated attempt with the same reference does not overwrite the record. No applicant contact details are public. The site does not send automated decision email or offer public reference lookup.
- WPU Control shows the queue only with matching staff Access and an active verified WPU account that has a dedicated intake reviewer grant or global WPU admin role. The named operations reviewer gets an intake-only grant during initial preparation. Existing federation and affiliation permissions are unchanged.
- Staff members can find a request by reference, record follow-up, approve pilot participation linked to an existing organisation or a new pending record, or close it. The case stores the reviewer and the reason. A new record does not enable a federation portal, create a staff role, grant access to player data, establish national recognition or admit a formal WPU member. Staff contact applicants directly with their next step.
- Existing inquiries with no structured type can still be reviewed, linked where an eligible existing organisation can be found or followed up. They cannot automatically create a new organisation without a country code and type.
- The GitHub release workflow verifies and applies the additive intake schema in production. The existing inquiry table remains available before, during and after deployment. The initial reviewer grant is one-time and is not restored if revoked.

## Acceptance

- Use desktop and a narrow mobile viewport. Open the Join WPU landing page from the homepage and find both routes. Verify direct sign-in and the existing Bhutan-specific sign-in return.
- With the nominated reviewer, check the organisation request queue in WPU Control. For an agreed real applicant, use its receipt reference, confirm only one case exists, record the decision and contact the applicant. Do not file test applications into production.
- Then build a single WPU tournament system, with federation, association, club and organiser permissions. Bhutan is a first user of the shared system, not a separate system.
