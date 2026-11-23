# WPU Control PRD — v1

## Objective
Task-oriented, AI-native administration of WPU, with human accountability. Distinguish public portal, organiser workspace and WPU Control.

## Navigation
Command Centre (assigned work, alerts, health); People & Organisations (supporters, memberships, identity); Tournaments (oversight, incidents, finalisation); Rankings (policy, calculations, corrections); Certification (paddles, testing, NFC); Development (coaches, youth, cross-sport); Governance & Justice (policies, ethics, appeals); Partners; Finance; AI Operations; Settings/Integrations.

## Release 1 operational screens
Secure login, Overview, My Work, Organisation/Supporter Review, Tournament Directory, Ranking Eligibility/Integrity Queue, Results Verification, Ranking Control, Audit History, Roles and Settings. Each case: subject, evidence, applicable policy/version, assigned authority, history, permitted actions and notification status.

## Permissions
Individual identities and MFA; least privilege; country, organisation, event and action scopes; separation of duties for financial, disciplinary, constitutional and institutional decisions. Technical superuser does not override constitutional authority.

## AI
Policy-bound recommendations, anomaly flags, drafting and triage. No autonomous sensitive approval, disciplinary sanction or appeal outcome. Audit actor, model/policy version, evidence and override.

## Acceptance
An individually authenticated administrator can process a valid application with independent evidence, review/approve under authorised rules, notify parties and publish only consented records; every transition audited. Event oversight and ranking correction workflows are scoped and testable.

## Existing system caveat
Current supporter admin API uses shared Bearer token; do not embed it in browser. Build secure session and CSRF protection and replace with per-user authorization before production dashboard.