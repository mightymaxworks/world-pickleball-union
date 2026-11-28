-- Entries are separate from event publication and sanctioning. No registration is opened by this migration.
CREATE TABLE wpu_event_registration (
  event_id TEXT NOT NULL REFERENCES wpu_studio_events(id),
  division_id TEXT NOT NULL,
  division_name TEXT NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN ('singles','doubles','mens-doubles','womens-doubles','mixed')),
  capacity INTEGER NOT NULL CHECK(capacity>=2),
  closes_at INTEGER NOT NULL,
  fee_minor INTEGER NOT NULL CHECK(fee_minor>=0),
  currency TEXT NOT NULL CHECK(currency IN ('SGD','USD')),
  terms TEXT NOT NULL,
  contact TEXT NOT NULL,
  division_json TEXT NOT NULL CHECK(json_valid(division_json)),
  event_date TEXT NOT NULL,
  venue TEXT NOT NULL,
  time_zone TEXT NOT NULL,
  paused INTEGER NOT NULL DEFAULT 0 CHECK(paused IN (0,1)),
  PRIMARY KEY(event_id,division_id)
);
CREATE TABLE wpu_event_entries (
  id TEXT PRIMARY KEY,
  event_id TEXT NOT NULL,
  division_id TEXT NOT NULL,
  lead_id TEXT NOT NULL REFERENCES wpu_persons(id),
  partner_id TEXT REFERENCES wpu_persons(id),
  invite TEXT UNIQUE,
  status TEXT NOT NULL CHECK(status IN ('invited','waitlisted','offered','ready','paying','confirmed','withdrawn','expired')),
  reserved INTEGER NOT NULL CHECK(reserved IN (0,1)),
  hold_until INTEGER,
  created_at INTEGER NOT NULL,
  queued_at INTEGER,
  payer_id TEXT REFERENCES wpu_persons(id),
  checkout_attempt TEXT UNIQUE,
  checkout_email TEXT,
  checkout_started INTEGER,
  stripe_session TEXT UNIQUE,
  payment_ref TEXT UNIQUE,
  FOREIGN KEY(event_id,division_id) REFERENCES wpu_event_registration(event_id,division_id),
  CHECK(lead_id IS NOT partner_id),
  CHECK(reserved=1 OR status NOT IN ('offered','ready','paying','confirmed')),
  CHECK(reserved=0 OR status IN ('invited','offered','ready','paying','confirmed')),
  CHECK(status<>'waitlisted' OR queued_at IS NOT NULL),
  CHECK(status<>'paying' OR (payer_id IS NOT NULL AND checkout_attempt IS NOT NULL AND checkout_started IS NOT NULL AND checkout_email IS NOT NULL)),
  CHECK(payment_ref IS NULL OR status='confirmed')
);
CREATE INDEX idx_wpu_event_entries_inventory ON wpu_event_entries(event_id,division_id,status,reserved,queued_at);
CREATE INDEX idx_wpu_event_entries_lead ON wpu_event_entries(lead_id);
CREATE INDEX idx_wpu_event_entries_partner ON wpu_event_entries(partner_id);

-- Prevent a second active spot in a draw even if someone enters once as lead and once as partner.
CREATE TRIGGER wpu_event_entry_unique_insert BEFORE INSERT ON wpu_event_entries
WHEN NEW.status NOT IN ('withdrawn','expired') AND EXISTS(
  SELECT 1 FROM wpu_event_entries t WHERE t.event_id=NEW.event_id AND t.division_id=NEW.division_id
  AND t.status NOT IN ('withdrawn','expired') AND
    (t.lead_id IN (NEW.lead_id,NEW.partner_id) OR t.partner_id IN (NEW.lead_id,NEW.partner_id))
) BEGIN SELECT RAISE(ABORT,'player already entered'); END;
CREATE TRIGGER wpu_event_entry_unique_partner BEFORE UPDATE OF partner_id ON wpu_event_entries
WHEN NEW.partner_id IS NOT NULL AND EXISTS(
  SELECT 1 FROM wpu_event_entries t WHERE t.id<>NEW.id AND t.event_id=NEW.event_id AND t.division_id=NEW.division_id
  AND t.status NOT IN ('withdrawn','expired') AND
    (t.lead_id=NEW.partner_id OR t.partner_id=NEW.partner_id)
) BEGIN SELECT RAISE(ABORT,'player already entered'); END;

-- Freeze the registered division, date, venue and timezone. Unrelated changes to a published
-- event can continue. A listing with active entrants or open entries cannot be taken offline.
CREATE TRIGGER wpu_event_registration_published_rules BEFORE UPDATE OF published_json ON wpu_studio_events
WHEN EXISTS(
 SELECT 1 FROM wpu_event_registration r WHERE r.event_id=OLD.id AND (
  (NEW.published_json IS NULL AND ((r.paused=0 AND r.closes_at>unixepoch()) OR EXISTS(
    SELECT 1 FROM wpu_event_entries t WHERE t.event_id=r.event_id AND t.division_id=r.division_id
      AND t.status NOT IN ('withdrawn','expired'))))
  OR (NEW.published_json IS NOT NULL AND (
    r.event_date IS NOT json_extract(NEW.published_json,'$.programme.date')
    OR r.venue IS NOT json_extract(NEW.published_json,'$.programme.venue')
    OR r.time_zone IS NOT json_extract(NEW.published_json,'$.programme.timezone')
    OR r.division_json
      IS NOT (SELECT json(d.value) FROM json_each(NEW.published_json,'$.programme.divisions') d
        WHERE json_extract(d.value,'$.id')=r.division_id)
  ))
 )
) BEGIN SELECT RAISE(ABORT,'registration locks published division rules'); END;
