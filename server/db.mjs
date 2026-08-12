/* The system of record.
 *
 * Two decisions here carry most of the weight, and both come from the trust
 * model rather than from database habit.
 *
 * 1. FACTS ARE APPEND ONLY. A fact is never updated and never deleted.
 *    Correcting one means inserting a new row that supersedes it. The evidence
 *    line "Verified by The Orchard House on August 4" is a claim the product
 *    makes to a couple who may be about to spend fifty thousand dollars on it.
 *    A mutable row cannot support that claim, because after an UPDATE there is
 *    no way to show what was said before or prove nothing was quietly changed.
 *    The ledger is what makes the promise auditable.
 *
 * 2. EVERY ACTION ATTEMPT IS RECORDED, allowed or refused. A refused attempt is
 *    not noise; it is the evidence that the permission model did its job, and
 *    the only way to notice a client trying things it should not.
 */

import { DatabaseSync } from 'node:sqlite';

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS households (
  id             TEXT PRIMARY KEY,
  title          TEXT NOT NULL,
  wedding_date   TEXT,
  region         TEXT,
  guests         INTEGER,
  budget_comfort INTEGER,
  created_at     TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS partners (
  id           TEXT PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES households(id),
  name         TEXT NOT NULL,
  slot         TEXT NOT NULL CHECK (slot IN ('a','b'))
);

CREATE TABLE IF NOT EXISTS places (
  id           TEXT PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES households(id),
  name         TEXT NOT NULL,
  location     TEXT,
  travel       TEXT,
  scene        TEXT,
  status       TEXT NOT NULL DEFAULT 'suggested'
);

/* Append only. There is deliberately no UPDATE or DELETE path in this module
   for this table, and a trigger below enforces it at the storage layer so a
   future query cannot quietly acquire one. */
CREATE TABLE IF NOT EXISTS facts (
  row_id             INTEGER PRIMARY KEY AUTOINCREMENT,
  id                 TEXT NOT NULL,
  household_id       TEXT NOT NULL REFERENCES households(id),
  place_id           TEXT REFERENCES places(id),
  label              TEXT NOT NULL,
  value_json         TEXT,
  state              TEXT NOT NULL,
  category           TEXT NOT NULL,
  source             TEXT,
  as_of              TEXT,
  basis              TEXT,
  pending            TEXT,
  claim              TEXT,
  subject            TEXT,
  spread             INTEGER,
  resolved_by        TEXT,
  acted_on           TEXT,
  supersedes         TEXT,
  superseded_because TEXT,
  remedy             TEXT,
  bound              TEXT,
  recorded_at        TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS facts_by_place ON facts(household_id, place_id);

CREATE TRIGGER IF NOT EXISTS facts_are_append_only_update
BEFORE UPDATE ON facts
BEGIN
  SELECT RAISE(ABORT, 'facts are append only: supersede the row instead of updating it');
END;

CREATE TRIGGER IF NOT EXISTS facts_are_append_only_delete
BEFORE DELETE ON facts
BEGIN
  SELECT RAISE(ABORT, 'facts are append only: supersede the row instead of deleting it');
END;

CREATE TABLE IF NOT EXISTS delegation (
  household_id TEXT PRIMARY KEY REFERENCES households(id),
  level        TEXT NOT NULL,
  scopes_json  TEXT NOT NULL,
  updated_at   TEXT NOT NULL
);

/* A partner's explicit approval of one specific action. Money and irreversible
   commitments need one row here from EACH partner before the action can run,
   which is how "it always comes back to you both" stops being a sentence in a
   document and becomes a condition the executor checks. */
CREATE TABLE IF NOT EXISTS approvals (
  row_id       INTEGER PRIMARY KEY AUTOINCREMENT,
  household_id TEXT NOT NULL REFERENCES households(id),
  request_id   TEXT NOT NULL,
  action_id    TEXT NOT NULL,
  partner_id   TEXT NOT NULL REFERENCES partners(id),
  payload_json TEXT,
  approved_at  TEXT NOT NULL,
  UNIQUE (household_id, request_id, partner_id)
);

/* The audit log. Append only for the same reason as facts: its value is that
   it cannot be tidied after the fact. */
CREATE TABLE IF NOT EXISTS action_log (
  row_id       INTEGER PRIMARY KEY AUTOINCREMENT,
  household_id TEXT NOT NULL REFERENCES households(id),
  actor        TEXT NOT NULL,
  action_id    TEXT NOT NULL,
  allowed      INTEGER NOT NULL,
  reason       TEXT NOT NULL,
  level        TEXT NOT NULL,
  scopes_json  TEXT NOT NULL,
  payload_json TEXT,
  attempted_at TEXT NOT NULL
);

CREATE TRIGGER IF NOT EXISTS action_log_is_append_only
BEFORE UPDATE ON action_log
BEGIN
  SELECT RAISE(ABORT, 'the audit log is append only');
END;
`;

export function open(path = ':memory:') {
  const db = new DatabaseSync(path);
  db.exec(SCHEMA);
  return wrap(db);
}

const now = () => new Date().toISOString();

function wrap(db) {
  const api = {
    raw: db,
    close: () => db.close(),

    /* ------------------------------------------------------- households */

    createHousehold(h) {
      db.prepare(`INSERT INTO households (id, title, wedding_date, region, guests, budget_comfort, created_at)
                  VALUES (?,?,?,?,?,?,?)`)
        .run(h.id, h.title, h.weddingDate ?? null, h.region ?? null, h.guests ?? null, h.budgetComfort ?? null, now());
      for (const p of h.partners || []) {
        db.prepare('INSERT INTO partners (id, household_id, name, slot) VALUES (?,?,?,?)')
          .run(p.id, h.id, p.name, p.slot);
      }
      api.setDelegation(h.id, h.delegation || { level: 'standing', scopes: [] });
      return api.getHousehold(h.id);
    },

    getHousehold(id) {
      const row = db.prepare('SELECT * FROM households WHERE id = ?').get(id);
      if (!row) return null;
      row.partners = db.prepare('SELECT id, name, slot FROM partners WHERE household_id = ?').all(id);
      return row;
    },

    /* ------------------------------------------------------------ places */

    addPlace(householdId, place) {
      db.prepare(`INSERT INTO places (id, household_id, name, location, travel, scene, status)
                  VALUES (?,?,?,?,?,?,?)`)
        .run(place.id, householdId, place.name, place.location ?? null,
             place.travel ?? null, place.scene ?? null, place.status ?? 'suggested');
      return place.id;
    },

    setPlaceStatus(householdId, placeId, status) {
      db.prepare('UPDATE places SET status = ? WHERE id = ? AND household_id = ?')
        .run(status, placeId, householdId);
    },

    listPlaces(householdId) {
      return db.prepare('SELECT * FROM places WHERE household_id = ? ORDER BY rowid').all(householdId);
    },

    /* ------------------------------------------------------------- facts */

    /* The only write path for a fact. There is no update() by design. */
    recordFact(householdId, placeId, fact) {
      db.prepare(`INSERT INTO facts (
          id, household_id, place_id, label, value_json, state, category, source, as_of,
          basis, pending, claim, subject, spread, resolved_by, acted_on,
          supersedes, superseded_because, remedy, bound, recorded_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`)
        .run(
          fact.id, householdId, placeId ?? null, fact.label,
          fact.value === undefined ? null : JSON.stringify(fact.value),
          fact.state, fact.category, fact.source ?? null, fact.asOf ?? null,
          fact.basis ?? null, fact.pending ?? null, fact.claim ?? null, fact.subject ?? null,
          fact.spread ?? null, fact.resolvedBy ?? null, fact.actedOn ?? null,
          fact.supersedes ?? null, fact.supersededBecause ?? null,
          fact.remedy ?? null, fact.bound ?? null, now());
      return fact.id;
    },

    factsFor(householdId, placeId) {
      const rows = placeId
        ? db.prepare('SELECT * FROM facts WHERE household_id = ? AND place_id = ? ORDER BY row_id').all(householdId, placeId)
        : db.prepare('SELECT * FROM facts WHERE household_id = ? ORDER BY row_id').all(householdId);
      return rows.map(toFact);
    },

    /* The full history of one fact id, including every version it replaced.
       This is the query an append-only ledger exists to make possible. */
    historyOf(householdId, factId) {
      return db.prepare('SELECT * FROM facts WHERE household_id = ? AND id = ? ORDER BY row_id')
        .all(householdId, factId).map(toFact);
    },

    /* --------------------------------------------------------- delegation */

    setDelegation(householdId, settings) {
      db.prepare(`INSERT INTO delegation (household_id, level, scopes_json, updated_at)
                  VALUES (?,?,?,?)
                  ON CONFLICT(household_id) DO UPDATE SET
                    level = excluded.level, scopes_json = excluded.scopes_json,
                    updated_at = excluded.updated_at`)
        .run(householdId, settings.level, JSON.stringify(settings.scopes || []), now());
    },

    getDelegation(householdId) {
      const row = db.prepare('SELECT * FROM delegation WHERE household_id = ?').get(householdId);
      /* A household with no stored settings gets the most restrictive level,
         never a permissive default. Absence must never widen authority. */
      if (!row) return { level: 'propose', scopes: [] };
      return { level: row.level, scopes: JSON.parse(row.scopes_json) };
    },

    /* ---------------------------------------------------------- approvals */

    recordApproval(householdId, requestId, actionId, partnerId, payload) {
      const partner = db.prepare('SELECT id FROM partners WHERE id = ? AND household_id = ?')
        .get(partnerId, householdId);
      /* An approval from someone outside the household is not an approval. */
      if (!partner) throw new Error(`${partnerId} is not a partner in this household`);
      db.prepare(`INSERT OR IGNORE INTO approvals
          (household_id, request_id, action_id, partner_id, payload_json, approved_at)
          VALUES (?,?,?,?,?,?)`)
        .run(householdId, requestId, actionId, partnerId,
             payload ? JSON.stringify(payload) : null, now());
    },

    approvalsFor(householdId, requestId) {
      return db.prepare('SELECT partner_id, action_id, approved_at FROM approvals WHERE household_id = ? AND request_id = ?')
        .all(householdId, requestId);
    },

    partnerIds(householdId) {
      return db.prepare('SELECT id FROM partners WHERE household_id = ?').all(householdId).map((r) => r.id);
    },

    /* ---------------------------------------------------------- audit log */

    logAttempt(entry) {
      db.prepare(`INSERT INTO action_log
          (household_id, actor, action_id, allowed, reason, level, scopes_json, payload_json, attempted_at)
          VALUES (?,?,?,?,?,?,?,?,?)`)
        .run(entry.householdId, entry.actor, entry.actionId, entry.allowed ? 1 : 0,
             entry.reason, entry.level, JSON.stringify(entry.scopes || []),
             entry.payload ? JSON.stringify(entry.payload) : null, now());
    },

    auditLog(householdId, limit = 100) {
      return db.prepare('SELECT * FROM action_log WHERE household_id = ? ORDER BY row_id DESC LIMIT ?')
        .all(householdId, limit)
        .map((r) => Object.assign({}, r, {
          allowed: Boolean(r.allowed),
          scopes: JSON.parse(r.scopes_json),
          payload: r.payload_json ? JSON.parse(r.payload_json) : null,
        }));
    },
  };

  return api;
}

/* Rows come back shaped the way the shared model expects, so the model never
   learns anything about storage. */
function toFact(row) {
  const fact = {
    id: row.id,
    label: row.label,
    value: row.value_json === null ? null : JSON.parse(row.value_json),
    state: row.state,
    category: row.category,
    recordedAt: row.recorded_at,
  };
  const optional = {
    source: row.source, asOf: row.as_of, basis: row.basis, pending: row.pending,
    claim: row.claim, subject: row.subject, spread: row.spread, resolvedBy: row.resolved_by,
    actedOn: row.acted_on, supersedes: row.supersedes,
    supersededBecause: row.superseded_because, remedy: row.remedy, bound: row.bound,
  };
  for (const [key, value] of Object.entries(optional)) {
    if (value !== null && value !== undefined) fact[key] = value;
  }
  return fact;
}
