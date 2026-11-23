# WPU UX / Information Architecture v1
Status: PROPOSED UI/UX for review, not an approved production interface.
Source: current SiteHeader.tsx, brand-tokens.css, competitions/page.tsx, existing WPU product decisions.

## Brand contract
Use /brand/wpu-logo-approved.png and existing CSS tokens --wpu-navy #0B2A66, --wpu-lime #C6FF3D, --wpu-blue #2B6FFF, --wpu-grey #E6E9EF, --wpu-white #FFFFFF. Montserrat for headings, Inter for body. Never invent a new certification shield or logo.

## Primary user journeys
1. Visitor: Competition Network > filter/search events > event detail > join or sign in > eligible division > entry confirmation > schedule > results.
2. Member: Player Passport > membership state > entries > upcoming matches > results > ranking breakdown.
3. Organiser: workspace > create event > configure formats/divisions > open entries > draw > schedule > score > verify > finalise.
4. WPU reviewer: Control > exceptions > evidence > review > human decision > audit.
5. Public: Rankings > discipline/season/category > athlete profile > points breakdown > source event.

## Information architecture
Public: Home, About, Competitions, Rankings, Members, Standards, Development, Governance, Support.
Player (authenticated): Overview, Passport, My Tournaments, Schedule, Results, Rankings, Settings.
Organiser (scoped): Overview, Events, Entries, Draws, Courts & Schedule, Live Scoring, Results, Exceptions.
WPU Control (staff): Command Centre, Members & Organisations, Competitions, Rankings, Standards & Certification, Development, Governance & Appeals, Partners & Finance, AI Operations, Integrations & Audit.

## UX requirements
- Progressive disclosure, accessible forms, keyboard navigation, visible status and feedback.
- Mobile-first scoring and entry confirmation; desktop dense bracket/admin views.
- Show provisional versus official rankings explicitly.
- No fake operational buttons: demo-only controls must be labelled preview.
- Registration cannot complete until real authentication, eligibility and transactional entry APIs exist.
- Event statuses: draft, published, registration open, registration closed, in progress, results pending, finalised, cancelled.
- Avoid dark-pattern fees; WPU core ranking eligibility free, organiser fees disclosed separately.
- Accessibility: WCAG 2.2 AA target, responsive widths, meaningful labels and error states.
- Localisation readiness: language/country/timezone formatting and international names.

## Design sprint 01 acceptance
- Responsive player-journey prototype, matching brand tokens.
- Tournament discovery and event detail, Player Passport preview.
- All data clearly labelled sample.
- No live registration, ranking publication or changes to existing public navigation until reviewed.
- User review of hierarchy, content density, actions, and mobile ergonomics.
