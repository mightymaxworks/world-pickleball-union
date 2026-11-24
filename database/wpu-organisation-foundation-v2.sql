-- Additive organisation foundation; apply after identity v1 and invariants.
ALTER TABLE wpu_organisations ADD COLUMN organisation_type TEXT NOT NULL DEFAULT 'other' CHECK(organisation_type IN ('international','national_federation','regional_association','district_association','club','school','academy','tournament_organiser','other'));
CREATE TABLE wpu_organisation_relationships (
 id TEXT PRIMARY KEY,
 subject_id TEXT NOT NULL REFERENCES wpu_organisations(id),
 object_id TEXT NOT NULL REFERENCES wpu_organisations(id),
 relationship_type TEXT NOT NULL CHECK(relationship_type IN ('affiliation','ownership','recognition','operational_authority')),
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','active','expired','revoked','rejected')),
 effective_from TEXT, effective_until TEXT, evidence_ref TEXT,
 CHECK(subject_id<>object_id),
 CHECK(effective_until IS NULL OR effective_from IS NULL OR effective_until>effective_from),
 CHECK(status<>'active' OR (evidence_ref IS NOT NULL AND length(trim(evidence_ref))>0 AND effective_from IS NOT NULL))
);
CREATE TABLE wpu_federation_status (
 organisation_id TEXT PRIMARY KEY REFERENCES wpu_organisations(id),
 establishment_status TEXT NOT NULL DEFAULT 'pending' CHECK(establishment_status IN ('pending','established','dissolved')),
 domestic_recognition_status TEXT NOT NULL DEFAULT 'pending' CHECK(domestic_recognition_status IN ('pending','recognised','rejected','withdrawn')),
 domestic_authority TEXT, domestic_evidence_ref TEXT,
 domestic_effective_from TEXT, domestic_effective_until TEXT,
 CHECK(domestic_recognition_status<>'recognised' OR (domestic_authority IS NOT NULL AND domestic_evidence_ref IS NOT NULL AND domestic_effective_from IS NOT NULL))
);
-- WPU affiliation is an independent organisation relationship, not domestic recognition.
CREATE TRIGGER wpu_global_membership_insert_guard BEFORE INSERT ON wpu_memberships
WHEN NEW.membership_type='individual' AND NEW.organisation_id IS NOT NULL
BEGIN SELECT RAISE(ABORT,'global membership must not have organisation'); END;
CREATE TRIGGER wpu_global_membership_update_guard BEFORE UPDATE ON wpu_memberships
WHEN NEW.membership_type='individual' AND NEW.organisation_id IS NOT NULL
BEGIN SELECT RAISE(ABORT,'global membership must not have organisation'); END;
CREATE TRIGGER wpu_organisation_id_immutable BEFORE UPDATE OF id ON wpu_organisations
WHEN OLD.id<>NEW.id BEGIN SELECT RAISE(ABORT,'immutable organisation ID'); END;
CREATE TRIGGER wpu_player_code_immutable BEFORE UPDATE OF public_player_code ON wpu_player_profiles
WHEN OLD.public_player_code<>NEW.public_player_code BEGIN SELECT RAISE(ABORT,'immutable player code'); END;
