-- Private organiser settings are not a public registration or part of the event snapshot.
CREATE TABLE wpu_event_registration_setup (
  event_id TEXT NOT NULL REFERENCES wpu_studio_events(id) ON DELETE CASCADE,
  division_id TEXT NOT NULL,
  setup_json TEXT NOT NULL CHECK(json_valid(setup_json)),
  revision INTEGER NOT NULL DEFAULT 1 CHECK(revision >= 1),
  PRIMARY KEY(event_id,division_id)
);
