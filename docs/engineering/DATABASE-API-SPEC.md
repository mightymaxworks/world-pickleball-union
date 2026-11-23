# WPU database and API contracts — PROPOSED v1

**No tables or endpoints below are implemented by this documentation change.** Keep existing supporter tables intact.

## Proposed logical tables
Identity: persons(id, display_name, country_code), user_accounts(id, person_id, auth_subject), memberships(id, person_id, type, status), player_profiles(person_id, wpu_player_number UNIQUE), organisations(id, name, country_code), organisation_roles(org_id, person_id, role, scope), role_grants(principal_id, role, scope).

Tournament: venues(id, timezone), courts(id, venue_id), tournaments(id, organiser_id, status, tier, timezone, start/end), divisions(id, tournament_id, format, discipline, rules_version), entries(id, division_id, status), entry_members(entry_id, player_id), teams(id), team_members(team_id, player_id), team_ties(id, division_id), team_tie_matches(tie_id, match_id), draw_versions(id, division_id, version), bracket_nodes(id, draw_id, source_refs, bracket_type), matches(id, division_id, status), match_participants(match_id, entry_id, side), match_games(match_id, game_number, score_a, score_b), match_events(id, match_id, actor, type), schedule_assignments(match_id, court_id, planned_start), result_packages(id, tournament_id, version, checksum, finalised_at).

Ranking: ranking_seasons(id, calendar_year UNIQUE, start/end), ranking_categories(id, discipline, age, geography), ranking_tiers(code T1..T5), ranking_policies(id, version, effective_at, approved_by), ranking_points_tables(policy_id, tier, placement, base_points), field_size_factors(policy_id, min/max, factor), ranking_calculations(id, source_package_id, policy_id, status), ranking_awards(id, recipient_id, category_id, season_id, source_result_id, points), ranking_adjustments(id, original_award_id, delta, reason), ranking_snapshots(id, season_id, category_id, generated_at), ranking_snapshot_rows(snapshot_id, recipient_id, points, position), team_ranking_awards(id, team_id, season_id, source_result_id, points).

Governance: integrity_cases, evidence, case_decisions, appeals, audit_events. Integration: providers, external_identity_links, import_batches, webhook_deliveries, idempotency_records. Operations: notification_outbox, background_jobs, job_attempts.

## Proposed versioned API (not live)
POST /api/v1/memberships; GET /api/v1/me; GET /api/v1/players/{id};
GET/POST /api/v1/tournaments; PATCH /api/v1/tournaments/{id}; POST /api/v1/tournaments/{id}/publish;
POST /api/v1/tournaments/{id}/divisions; POST /api/v1/divisions/{id}/entries; POST /api/v1/divisions/{id}/draws;
POST /api/v1/matches/{id}/scores; POST /api/v1/matches/{id}/confirm;
POST /api/v1/tournaments/{id}/finalise;
GET /api/v1/rankings?season=&discipline=&geography=;
GET /api/v1/rankings/players/{id}; GET /api/v1/rankings/teams/{id};
GET /api/v1/ranking-policies/{version};
POST /api/v1/admin/rankings/recalculate; POST /api/v1/admin/rankings/corrections.

## Contract requirements
Server-generated IDs and tier decisions; authenticated scoped writes; idempotency keys; optimistic version checks; pagination; validated errors; signed webhook retries/replay protection; import source mapping; asynchronous calculation job IDs; audit on every consequential transition. No result finalisation without verified inputs. No official points until ranking numerical policy approved.

## Migrations
Create new versioned migration files; test against local D1; never mutate production supporter schema destructively. Add indexes for organiser/status, division entries, matches, source result uniqueness and season/category leaderboards.