# WPU Ranking Policy — consolidated working specification v1.0

**Not an approved numerical rulebook.** This preserves locked choices and explicitly identifies the remaining policy and simulation work.

## LOCKED
- Calendar-year seasons, January 1 through December 31; prior seasons remain viewable.
- Best 10 results per discipline per season; preserve all awards in ledger even when not counted.
- Five tiers T1–T5 assigned to sanctioned divisions. Points follow the approved tier and placement schedule.
- Small-field point reductions.
- All WPU-sanctioned divisions award points from verified results, subject to the common integrity rules. There is no paid ranking gate.
- Each doubles or mixed doubles partner receives the full placement award on their own individual leaderboard record. The award survives partner changes. Both partners must independently meet any published points minimum.
- Team competitions have a separate team ranking ledger.
- Distinct MS, WS, MD, WD, XD and applicable age divisions; external skill ratings are not WPU rankings.
- Skill ratings only describe skill. WPU and external skill ratings do not determine sanctioned qualification, seeding or ranking awards. Ranking-based entry uses the relevant WPU leaderboard and a published cutoff snapshot. No points minimum is required for open entry, and an unranked player is not necessarily a beginner.
- No bonus points merely for travel, WPU affiliation or commercial status.

See the [Federation competition standard](FEDERATION-COMPETITION-STANDARD.md) for organiser-facing rules.

## Proposed mathematical skeleton — not final
For result placement p at tier t and field size n:
award = round(base_points[t,p] × field_factor[n]).
Annual leaderboard score = sum of up to ten highest eligible awards per player, discipline and calendar year.
Team awards are calculated and stored separately. Source result version, policy version and calculation run must accompany each award.

## PENDING approval
Exact base points; tier qualification and prevention of self-assigned tier inflation; field-size bands and factors; tie-breaks; ranking tie positions; minimum completion standards; withdrawal/walkover/disqualification handling; mixed/age/open crossover; year-end tournament cut-off; corrections and appeal procedure; team point formula; treatment of events from external providers.

## Earlier ranking research
Prior discussions reportedly evaluated rolling 52-week and best-eight approaches, field strength/progression/draw adjustments and weak-field manipulation simulations. These are **historical research leads**, not source-verified numerical results in this file. Retrieve original datasets and simulation methodology before claiming quantitative validation. Newly locked calendar-year/best-ten choices supersede earlier periods/counts, not necessarily integrity findings.

## Required simulations
Compare simple tier-placement × field-size model with documented earlier alternatives on the same verified datasets. Test weak fields, repeated opponents, player volume, small draws, age/discipline fairness, double elimination, team events, year-end boundaries and correction replay. Publish reproducible fixtures, expected rankings and policy sign-off before official rankings launch.

## Data controls
Immutable/append-only award history with compensating adjustments; deterministic best-ten selection; versioned seasonal snapshots; provisional, verified and under-review states. A result must not award twice.
