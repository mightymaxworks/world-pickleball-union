# WPU Competition Network PRD — v1.0

## Product objective
A WPU-owned, globally usable tournament system and ranking ecosystem, free for registered WPU members. Public visitors can discover published events and rankings. Membership price policy remains pending.

## Users
Player, organiser, team captain, club operator, referee/scorekeeper, event director, rankings officer, WPU administrator, governance reviewer, scoped AI agent. One person may have multiple scoped roles.

## Functional scope (Release 1)
- Player identity/passport, member/organiser accounts, club affiliations.
- Tournament setup: name, organiser, country, venue, timezone, dates, branding, scoring and eligibility rules.
- Divisions: singles, doubles, mixed doubles and team events. WPU ranking points govern ranking-based entry. Age, roster and other published non-rating eligibility conditions are independent. WPU Skill Rating and external ratings never determine sanctioned entry, seeding or awards.
- Registration: entries, doubles partners, rosters, waitlists, withdrawals, check-in.
- Draw formats: round robin; single elimination; pool-to-knockout; double elimination including losers bracket and optional grand-final reset; configurable team ties with component matches.
- Seeding, byes, scheduling, courts, rest/conflict checks, manual overrides.
- Match calls, scoring, attestations, forfeits, suspensions, corrections, result versioning.
- Public tournament pages, match results and standings; finalisation and ranking ingestion.

## Event Studio first delivery
- **Programme** holds scheduled activities. **Competition** holds the entry divisions. Existing events, schedules and published links remain unchanged until their organiser intentionally publishes an update.
- A signed-in, first-time organiser should be able to enter the name, date and venue, add a division using editable open-entry defaults, and reach the same player-facing preview in under five minutes without coaching, on phone and desktop.
- The first Competition release supports open entry or a declared individual/team WPU points minimum on a named leaderboard at a stated cutoff. Publishing a previewable event page does not grant WPU sanction, open registrations, assess eligibility or calculate points.
- Follow with one end-to-end sanctioned rehearsal across singles, mixed doubles and teams, then prove that an individual can use points earned with one partner to enter with another, with both qualifying independently.

## Tournament state machine
draft → published → registration_open → registration_closed → draw_published → in_progress → completed → results_verified → finalised. Explicit exception transitions: cancelled, postponed, suspended, reopened, under_review. Each transition needs actor, precondition, timestamp and audit event.

## Integrity
Every WPU-sanctioned division can earn WPU ranking points from verified results without a paid ranking gate. WPU approves the division tier and points schedule, independent of prize pools and public page status. Unverified results are provisional, not official; only finalised, validated results post awards. Anti-abuse: duplicate identities, fake results, collusive small fields, invalid eligibility, suspicious score corrections. AI flags are advisory.

## Acceptance
A registered organiser creates a real event, two or more players enter, draws and schedules run, all required formats pass scenario tests, results finalise, ranking calculations use approved policy. No official publication under invented points.

## Nonfunctional
Mobile-first player and live-scoring flows; desktop draw/schedule workspaces; accessibility WCAG 2.2 AA target; international timezones; secure role-scoped writes; idempotent imports and ranking jobs; recovery and load tests.

See [Federation competition standard](FEDERATION-COMPETITION-STANDARD.md), [ranking policy](RANKING-POLICY.md), [Data/API](../engineering/DATABASE-API-SPEC.md).
