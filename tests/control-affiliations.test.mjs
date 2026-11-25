import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";

test("affiliation migration enforces scoped, append-only and atomic transitions", () => {
  const db = new DatabaseSync(":memory:");
  for (const migration of [
    "wpu-identity-foundation-v1", "wpu-identity-invariants-v1", "wpu-passwordless-auth-v1",
    "wpu-passwordless-auth-v2", "wpu-passwordless-auth-v3", "wpu-organisation-foundation-v2",
    "wpu-control-affiliations-v1",
  ]) db.exec(readFileSync(new URL(`../database/${migration}.sql`, import.meta.url), "utf8"));
  try {
    const people = ["player","operator","reviewer","outsider","unscoped","other-reviewer"];
    for (const id of people) {
      db.prepare("INSERT INTO wpu_persons(id,display_name) VALUES(?,?)").run(id, id);
      db.prepare("INSERT INTO wpu_accounts(id,person_id,auth_subject) VALUES(?,?,?)").run(id, id, id);
      db.prepare("INSERT INTO wpu_player_profiles(person_id,public_player_code) VALUES(?,?)").run(id, "WPU-"+id);
    }
    db.exec(`INSERT INTO wpu_accounts(id,person_id,auth_subject) VALUES('second-operator','operator','second-operator');
      INSERT INTO wpu_organisations(id,name,status) VALUES('org','Isolated club','verified'),('other','Other isolated club','verified');
      INSERT INTO wpu_role_assignments(id,account_id,role,scope_type,scope_id) VALUES
        ('p','operator','organisation_admin','organisation','org'),
        ('p2','operator','wpu_reviewer','organisation','org'),
        ('r','reviewer','wpu_reviewer','organisation','org'),
        ('r2','second-operator','wpu_reviewer','organisation','org'),
        ('r3','unscoped','wpu_reviewer','global',NULL),
        ('r4','other-reviewer','wpu_reviewer','organisation','other'),
        ('r5','player','wpu_reviewer','organisation','org');`);
    const propose = db.prepare(`INSERT INTO wpu_affiliation_requests(id,person_id,organisation_id,proposed_by,last_actor,last_reason)
      VALUES(?,'player',?,?,?,'Club roster reviewed')`);
    assert.throws(() => propose.run("x","other","operator","operator"), /proposal invalid/);
    assert.throws(() => propose.run("x","org","operator","outsider"), /proposal invalid/);
    assert.throws(() => propose.run("x","org","outsider","outsider"), /proposal invalid/);
    propose.run("one","org","operator","operator");
    assert.throws(() => propose.run("other","org","operator","operator"), /UNIQUE/);
    const state = name => db.prepare("SELECT state FROM wpu_affiliation_requests WHERE id=?").get(name).state;
    const transition = db.prepare("UPDATE wpu_affiliation_requests SET state=?,last_actor=?,last_reason='Reason for test' WHERE id=?");
    const history = id => db.prepare("SELECT actor_account_id,state FROM wpu_affiliation_audit WHERE request_id=? ORDER BY sequence").all(id).map(row => [row.actor_account_id, row.state]);
    assert.throws(() => transition.run("approved","reviewer","one"), /transition invalid/);
    assert.throws(() => transition.run("awaiting_review","outsider","one"), /transition invalid/);
    assert.equal(db.prepare("SELECT count(*) AS total FROM wpu_memberships").get().total, 0);
    transition.run("awaiting_review","player","one");
    for (const invalidReviewer of ["operator","second-operator","player","unscoped","other-reviewer"]) {
      assert.throws(() => transition.run("approved",invalidReviewer,"one"), /transition invalid/);
    }
    db.exec("UPDATE wpu_role_assignments SET revoked_at=datetime('now') WHERE id='r'");
    assert.throws(() => transition.run("approved","reviewer","one"), /transition invalid/);
    db.exec("UPDATE wpu_role_assignments SET revoked_at=NULL WHERE id='r'");
    db.exec("UPDATE wpu_organisations SET status='suspended' WHERE id='org'");
    assert.throws(() => transition.run("approved","reviewer","one"), /transition invalid/);
    db.exec("UPDATE wpu_organisations SET status='verified' WHERE id='org'");
    db.exec(`INSERT INTO wpu_memberships(id,person_id,organisation_id,membership_type,status)
      VALUES('legacy','player','org','organisation','active')`);
    assert.throws(() => transition.run("approved","reviewer","one"), /UNIQUE/);
    assert.equal(state("one"), "awaiting_review");
    assert.deepEqual(history("one"), [["operator","awaiting_player"],["player","awaiting_review"]]);
    db.exec("UPDATE wpu_memberships SET status='revoked' WHERE id='legacy'");
    transition.run("approved","reviewer","one");
    assert.equal(db.prepare("SELECT status FROM wpu_memberships WHERE id='affiliation:one'").get().status, "active");
    assert.equal(db.prepare("SELECT public_player_code FROM wpu_player_profiles WHERE person_id='player'").get().public_player_code, "WPU-player");
    assert.throws(() => db.exec("UPDATE wpu_affiliation_audit SET reason='changed'"), /append only/);
    assert.throws(() => db.exec("DELETE FROM wpu_affiliation_audit"), /append only/);
    assert.throws(() => db.exec("DELETE FROM wpu_affiliation_requests"), /retained/);
    assert.throws(() => transition.run("approved","reviewer","one"), /transition invalid/);
    transition.run("revoked","reviewer","one");
    assert.equal(db.prepare("SELECT status FROM wpu_memberships WHERE id='affiliation:one'").get().status, "revoked");
    assert.deepEqual(history("one"), [
      ["operator","awaiting_player"],["player","awaiting_review"],["reviewer","approved"],["reviewer","revoked"],
    ]);
    propose.run("two","org","operator","operator");
    transition.run("declined","player","two");
    assert.throws(() => transition.run("approved","reviewer","two"), /transition invalid/);
    propose.run("three","org","operator","operator");
    transition.run("rejected","reviewer","three");
    assert.equal(db.prepare("PRAGMA foreign_key_check").all().length, 0);
  } finally { db.close(); }
});

test("player-request migration preserves existing cases and scopes the new path", () => {
  const db = new DatabaseSync(":memory:");
  const apply = migration => db.exec(readFileSync(new URL(`../database/${migration}.sql`, import.meta.url), "utf8"));
  for (const migration of ["wpu-identity-foundation-v1","wpu-identity-invariants-v1","wpu-passwordless-auth-v1",
    "wpu-passwordless-auth-v2","wpu-passwordless-auth-v3","wpu-organisation-foundation-v2","wpu-control-affiliations-v1"]) apply(migration);
  try {
    db.exec(`
      INSERT INTO wpu_persons(id,display_name) VALUES('player','Player'),('operator','Operator'),('reviewer','Reviewer');
      INSERT INTO wpu_accounts(id,person_id,auth_subject) VALUES
        ('player','player','player'),('alias','player','alias'),('operator','operator','operator'),('reviewer','reviewer','reviewer');
      INSERT INTO wpu_auth_emails(account_id,email_normalized,verified_at) VALUES('player','test@example.org',datetime('now'));
      INSERT INTO wpu_player_profiles(person_id,public_player_code) VALUES('player','WPU-existing');
      INSERT INTO wpu_organisations(id,name,status) VALUES('club','Original club','verified'),('pilot','Pilot','verified');
      INSERT INTO wpu_role_assignments(id,account_id,role,scope_type,scope_id) VALUES
        ('old-operator','operator','organisation_admin','organisation','club'),
        ('pilot-operator','operator','organisation_admin','organisation','pilot'),
        ('pilot-reviewer','reviewer','wpu_reviewer','organisation','pilot'),
        ('player-reviewer','player','wpu_reviewer','organisation','pilot'),
        ('alias-reviewer','alias','wpu_reviewer','organisation','pilot');
      INSERT INTO wpu_affiliation_requests(id,person_id,organisation_id,proposed_by,last_actor,last_reason)
        VALUES('old','player','club','operator','operator','Legacy proposal');
    `);
    apply("wpu-control-affiliations-v2");
    assert.equal(db.prepare("SELECT request_source FROM wpu_affiliation_requests WHERE id='old'").get().request_source, "operator");
    assert.equal(db.prepare("SELECT count(*) AS n FROM wpu_affiliation_self_request_orgs").get().n, 0);
    const create = db.prepare(`INSERT INTO wpu_affiliation_requests
      (id,person_id,organisation_id,proposed_by,last_actor,last_reason,state,request_source)
      VALUES('new','player','pilot',?,?,'Pilot request',?,?)`);
    assert.throws(() => create.run("player","player","awaiting_review","player"), /proposal invalid/);
    db.exec("INSERT INTO wpu_affiliation_self_request_orgs(organisation_id) VALUES('pilot')");
    assert.throws(() => create.run("alias","alias","awaiting_review","player"), /proposal invalid/);
    assert.throws(() => create.run("operator","operator","awaiting_review","player"), /proposal invalid/);
    assert.throws(() => create.run("operator","operator","awaiting_player","operator"), /proposal invalid/);
    assert.throws(() => create.run("player","player","approved","player"), /proposal invalid/);
    create.run("player","player","awaiting_review","player");
    const approve = db.prepare("UPDATE wpu_affiliation_requests SET state='approved',last_actor=? WHERE id='new'");
    assert.throws(() => approve.run("player"), /transition invalid/);
    assert.throws(() => approve.run("alias"), /transition invalid/);
    assert.throws(() => db.exec("UPDATE wpu_affiliation_requests SET request_source='operator',state='approved',last_actor='reviewer' WHERE id='new'"), /source is immutable/);
    approve.run("reviewer");
    assert.deepEqual(db.prepare("SELECT actor_kind FROM wpu_affiliation_audit WHERE request_id='new' ORDER BY sequence").all().map(row => row.actor_kind), ["player", "reviewer"]);
    assert.equal(db.prepare("SELECT status FROM wpu_memberships WHERE id='affiliation:new'").get().status, "active");
    assert.equal(db.prepare("SELECT public_player_code FROM wpu_player_profiles").get().public_player_code, "WPU-existing");
    assert.deepEqual(db.prepare("PRAGMA foreign_key_check").all(), []);
  } finally { db.close(); }
});
