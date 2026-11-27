-- Additive release 1. No events or organiser permissions are granted by this migration.
CREATE TABLE wpu_studio_events (
  id TEXT PRIMARY KEY,
  organisation_id TEXT NOT NULL REFERENCES wpu_organisations(id),
  slug TEXT NOT NULL UNIQUE,
  draft_json TEXT NOT NULL CHECK(json_valid(draft_json)),
  revision INTEGER NOT NULL DEFAULT 1 CHECK(revision >= 1),
  published_json TEXT CHECK(published_json IS NULL OR json_valid(published_json)),
  published_revision INTEGER CHECK(published_revision IS NULL OR published_revision BETWEEN 1 AND revision),
  published_at TEXT,
  actor_account_id TEXT NOT NULL REFERENCES wpu_accounts(id),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  CHECK((published_json IS NULL) = (published_revision IS NULL)),
  CHECK((published_json IS NULL) = (published_at IS NULL))
);
CREATE INDEX idx_wpu_studio_events_organisation ON wpu_studio_events(organisation_id,updated_at DESC);
CREATE TABLE wpu_studio_event_audit (
  sequence INTEGER PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES wpu_studio_events(id),
  actor_account_id TEXT NOT NULL REFERENCES wpu_accounts(id),
  action TEXT NOT NULL CHECK(action IN ('created','draft_saved','published','unpublished')),
  revision INTEGER NOT NULL,
  occurred_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE TRIGGER wpu_studio_event_created AFTER INSERT ON wpu_studio_events
BEGIN
  INSERT INTO wpu_studio_event_audit(event_id,actor_account_id,action,revision)
  VALUES(NEW.id,NEW.actor_account_id,'created',NEW.revision);
END;
CREATE TRIGGER wpu_studio_event_changed AFTER UPDATE ON wpu_studio_events
BEGIN
  INSERT INTO wpu_studio_event_audit(event_id,actor_account_id,action,revision)
  VALUES(NEW.id,NEW.actor_account_id,
    CASE WHEN NEW.published_revision IS NULL AND OLD.published_revision IS NOT NULL THEN 'unpublished'
      WHEN NEW.published_revision IS NOT OLD.published_revision THEN 'published'
      ELSE 'draft_saved' END, NEW.revision);
END;
