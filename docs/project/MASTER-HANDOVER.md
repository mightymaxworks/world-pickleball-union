# WPU master project handover — v1

## Mission
Build WPU as an AI-native global pickleball organisation and free competition network for registered WPU members. Human authority remains over constitutional, ethical, appeal and consequential decisions. WPU's legal/governing status is not assumed.

## Systems
1. WPU Public: website, discovery, player passport, tournament pages, published rankings.
2. WPU Competition Network: free tournament operations and authoritative ranking engine.
3. WPU Control: authenticated administrative work queues, decisions, policy and audit.
4. Integrations: Waypoint is an initial operational provider, never a mandatory dependency; approved third-party providers exchange data through contracts.

## Authoritative sources
[Decision register](DECISION-REGISTER.md) controls locked product choices. [Ranking policy](../product/RANKING-POLICY.md) documents mathematical gaps. [Implementation status](IMPLEMENTATION-STATUS.md) describes verified repository baseline. Existing brand assets and standards are not to be recreated.

## Immediate delivery
Read repository and test workflows; resolve ranking research provenance; implement identity/member/organiser permissions; then a real tournament-registration-match-results-to-provisional-points vertical slice, behind feature flags. Preserve existing supporter functionality.

## Constraints
Free core tournament/ranking use for registered members; membership fee policy not yet formally locked. Every tournament eligible for points subject to integrity, no paid sanctioning gate. Five formats including double elimination and team ties. Calendar-year best 10 results per discipline. WPU owns authoritative records. No official points before policy approval.

## Continuity
Maintain a decision log, status distinctions, reviewed PRs and automated acceptance tests. Do not interpret design documents as deployed features. Do not deploy migrations or alter secrets as part of this handover.