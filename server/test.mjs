#!/usr/bin/env node
/* Server tests. `npm run test:server`.
 *
 * These check the things that only matter once there is a server: that the
 * ledger cannot be rewritten, that permissions are decided by stored settings
 * rather than by whatever the caller claims, and that money needs both people.
 */

import { open } from './db.mjs';
import { createExecutor, readFacts } from './actions.mjs';
import { trust } from './model.mjs';

let passed = 0;
const failures = [];
let group = '';

const describe = (name) => { group = name; console.log(`\n${name}`); };

async function check(name, fn) {
  try {
    const detail = await fn();
    passed++;
    console.log(`  pass  ${name}${detail ? `  (${detail})` : ''}`);
  } catch (error) {
    failures.push({ group, name, message: error.message });
    console.log(`  FAIL  ${name}\n        ${error.message}`);
  }
}

const assert = (cond, msg) => { if (!cond) throw new Error(msg); };
const equal = (a, b, msg) => {
  if (a !== b) throw new Error(`${msg}\n        expected: ${b}\n        actual:   ${a}`);
};

/* ------------------------------------------------------------- fixtures */

function seed() {
  const db = open(':memory:');
  db.createHousehold({
    id: 'hh1', title: 'Maya and Alex', weddingDate: '2027-06-12',
    region: 'Hudson Valley, New York', guests: 110, budgetComfort: 85000,
    partners: [
      { id: 'maya', name: 'Maya', slot: 'a' },
      { id: 'alex', name: 'Alex', slot: 'b' },
    ],
    delegation: { level: 'standing', scopes: ['propose-tour-times', 'follow-up-once'] },
  });
  db.addPlace('hh1', { id: 'orchard', name: 'The Orchard House', location: 'Rhinebeck, New York', status: 'saved' });
  db.recordFact('hh1', 'orchard', {
    id: 'oh-fee', label: 'Site fee', value: 34200, state: 'confirmed',
    source: 'The Orchard House', asOf: '2026-08-04', category: 'pricing',
  });
  return db;
}

function recordingEffects() {
  const sent = [];
  const effect = (name) => async ({ payload }) => { sent.push({ name, payload }); return { name }; };
  return {
    sent,
    effects: Object.fromEntries(
      ['request-tour', 'follow-up', 'ask-question', 'send-inquiry-pack', 'hold-date',
       'approve-place', 'publish-website', 'reorder-plan', 'save-place'].map((id) => [id, effect(id)])),
  };
}

/* ================================================== THE FACT LEDGER ==== */

describe('The fact ledger is append only');

await check('a fact cannot be updated, even by raw SQL', () => {
  const db = seed();
  let blocked = false;
  try {
    db.raw.prepare("UPDATE facts SET value_json = '1' WHERE id = 'oh-fee'").run();
  } catch (e) {
    blocked = /append only/.test(e.message);
  }
  assert(blocked, 'an UPDATE against facts should be refused by the database itself');
  db.close();
});

await check('a fact cannot be deleted, even by raw SQL', () => {
  const db = seed();
  let blocked = false;
  try {
    db.raw.prepare("DELETE FROM facts WHERE id = 'oh-fee'").run();
  } catch (e) {
    blocked = /append only/.test(e.message);
  }
  assert(blocked, 'a DELETE against facts should be refused by the database itself');
  db.close();
});

await check('correcting a fact keeps both versions and the history is queryable', () => {
  const db = seed();
  db.recordFact('hh1', 'orchard', {
    id: 'oh-fee-v2', label: 'Site fee', value: 35900, state: 'confirmed',
    source: 'The Orchard House', asOf: '2026-08-20', category: 'pricing',
    supersedes: 'oh-fee', supersededBecause: 'they raised the 2027 rate',
    remedy: 'updated your comparison', bound: 'Nothing was committed at the old price.',
  });
  const all = db.factsFor('hh1', 'orchard');
  equal(all.length, 2, 'both versions should remain in the ledger');
  const live = trust.resolveAll(all).filter((f) => !f.superseded);
  equal(live.length, 1, 'only the newer fact should be live');
  equal(live[0].id, 'oh-fee-v2', 'the newer fact should be the live one');
  db.close();
  return 'old row retained, new row live';
});

await check('the audit log cannot be rewritten', () => {
  const db = seed();
  db.logAttempt({ householdId: 'hh1', actor: 'agent', actionId: 'follow-up', allowed: true, reason: 'ok', level: 'standing', scopes: [] });
  let blocked = false;
  try {
    db.raw.prepare("UPDATE action_log SET allowed = 0").run();
  } catch (e) {
    blocked = /append only/.test(e.message);
  }
  assert(blocked, 'the audit log should refuse an UPDATE');
  db.close();
});

/* ============================================ SERVER-SIDE ENFORCEMENT == */

describe('Permissions are enforced on the server, not asserted by the caller');

await check('a granted scope lets the agent act, and the effect actually runs', async () => {
  const db = seed();
  const { sent, effects } = recordingEffects();
  const exec = createExecutor(db, effects);
  const out = await exec.attempt('hh1', 'request-tour', { placeId: 'orchard', time: '2026-08-20T17:00' });
  assert(out.ran === true, `expected the action to run: ${out.reason}`);
  equal(sent.length, 1, 'the effect should have fired exactly once');
  db.close();
});

await check('revoking the scope stops the same call, and no effect fires', async () => {
  const db = seed();
  const { sent, effects } = recordingEffects();
  const exec = createExecutor(db, effects);
  db.setDelegation('hh1', { level: 'standing', scopes: [] });
  const out = await exec.attempt('hh1', 'request-tour', { placeId: 'orchard' });
  assert(out.ran === false, 'the action should have been refused');
  equal(sent.length, 0, 'no effect may fire behind a refusal');
  db.close();
  return out.reason;
});

await check('the caller cannot assert its own permission', async () => {
  const db = seed();
  const { sent, effects } = recordingEffects();
  const exec = createExecutor(db, effects);
  db.setDelegation('hh1', { level: 'propose', scopes: [] });
  /* A hostile client sending everything it can think of to look authorised. */
  const out = await exec.attempt('hh1', 'send-inquiry-pack', {
    allowed: true, approved: true, delegation: { level: 'standing', scopes: ['send-inquiry-packs'] },
    scopes: ['send-inquiry-packs'], level: 'report', bypass: true,
  });
  assert(out.ran === false, 'permission must come from stored settings, never from the payload');
  equal(sent.length, 0, 'no effect may fire');
  db.close();
  return 'payload ignored';
});

await check('money is refused for the agent at every level and every scope', async () => {
  const db = seed();
  const { sent, effects } = recordingEffects();
  const exec = createExecutor(db, effects);
  const everyScope = ['follow-up-once', 'propose-tour-times', 'request-missing-facts', 'send-inquiry-packs'];
  let tried = 0;
  for (const level of ['propose', 'standing', 'report']) {
    db.setDelegation('hh1', { level, scopes: everyScope });
    for (const actionId of ['hold-date', 'approve-place']) {
      const out = await exec.attempt('hh1', actionId, {});
      tried++;
      assert(out.ran === false, `"${actionId}" ran at level "${level}"`);
    }
  }
  equal(sent.length, 0, 'no financial effect may fire on the agent path');
  db.close();
  return `${tried} combinations refused`;
});

await check('an undeclared action cannot reach an effect', async () => {
  const db = seed();
  const { sent, effects } = recordingEffects();
  const exec = createExecutor(db, effects);
  const out = await exec.attempt('hh1', 'wire-the-deposit', { amount: 5000 });
  assert(out.ran === false, 'an undeclared action must not run');
  equal(sent.length, 0, 'no effect may fire');
  db.close();
});

await check('a household with no stored settings gets the most restrictive level', async () => {
  const db = seed();
  db.raw.prepare('DELETE FROM delegation WHERE household_id = ?').run('hh1');
  const settings = db.getDelegation('hh1');
  equal(settings.level, 'propose', 'absence must never widen authority');
  db.close();
});

/* ============================================== DUAL APPROVAL PATH ===== */

describe('Money needs both partners, on the human path too');

await check('one partner approving a financial action is not enough', async () => {
  const db = seed();
  const { sent, effects } = recordingEffects();
  const exec = createExecutor(db, effects);
  const out = await exec.authorize('hh1', 'req-1', 'approve-place', 'maya', { placeId: 'orchard' });
  assert(out.ran === false, 'one approval must not be enough for a commitment');
  assert(out.waitingOn.includes('alex'), 'it should name who is still needed');
  equal(sent.length, 0, 'no effect may fire on a partial approval');
  db.close();
  return out.reason;
});

await check('both partners approving the same request lets it through', async () => {
  const db = seed();
  const { sent, effects } = recordingEffects();
  const exec = createExecutor(db, effects);
  await exec.authorize('hh1', 'req-1', 'approve-place', 'maya', { placeId: 'orchard' });
  const out = await exec.authorize('hh1', 'req-1', 'approve-place', 'alex', { placeId: 'orchard' });
  assert(out.ran === true, `expected it to run once both approved: ${out.reason}`);
  equal(sent.length, 1, 'the effect should fire exactly once');
  db.close();
});

await check('one partner cannot approve twice to stand in for the other', async () => {
  const db = seed();
  const { sent, effects } = recordingEffects();
  const exec = createExecutor(db, effects);
  await exec.authorize('hh1', 'req-1', 'approve-place', 'maya', {});
  const out = await exec.authorize('hh1', 'req-1', 'approve-place', 'maya', {});
  assert(out.ran === false, 'a duplicate approval must not satisfy the second partner');
  equal(sent.length, 0, 'no effect may fire');
  db.close();
});

await check('someone outside the household cannot approve anything', async () => {
  const db = seed();
  const { effects } = recordingEffects();
  const exec = createExecutor(db, effects);
  let threw = false;
  try {
    await exec.authorize('hh1', 'req-9', 'approve-place', 'a-stranger', {});
  } catch (e) {
    threw = /not a partner/.test(e.message);
  }
  assert(threw, 'an approval from a non-partner must be rejected');
  db.close();
});

/* ==================================================== THE AUDIT LOG ==== */

describe('Every attempt is recorded, refusals included');

await check('a refusal is logged with the reason and the settings in force', async () => {
  const db = seed();
  const { effects } = recordingEffects();
  const exec = createExecutor(db, effects);
  db.setDelegation('hh1', { level: 'propose', scopes: [] });
  await exec.attempt('hh1', 'send-inquiry-pack', { to: 5 });
  const log = db.auditLog('hh1');
  equal(log.length, 1, 'the refusal should be in the log');
  equal(log[0].allowed, false, 'it should be recorded as refused');
  equal(log[0].level, 'propose', 'the settings in force should be recorded alongside it');
  assert(log[0].reason.length > 10, 'the reason should be recorded, not just the outcome');
  db.close();
});

await check('preview does not log an attempt or cause an effect', async () => {
  const db = seed();
  const { sent, effects } = recordingEffects();
  const exec = createExecutor(db, effects);
  const p = exec.preview('hh1', 'request-tour');
  assert(typeof p.reason === 'string' && p.reason.length > 10, 'preview should explain itself');
  equal(db.auditLog('hh1').length, 0, 'a preview is not an attempt');
  equal(sent.length, 0, 'a preview must not cause an effect');
  db.close();
});

/* ============================================ MODEL SHARED, NOT COPIED = */

describe('The models are shared with the interface, not reimplemented');

await check('the server resolves facts through the same trust model', () => {
  const db = seed();
  db.recordFact('hh1', 'orchard', {
    id: 'oh-date', label: 'Your date', value: 'June 12, 2027 is open', state: 'confirmed',
    source: 'The Orchard House', asOf: '2026-07-20', category: 'availability',
  });
  const view = readFacts(db, 'hh1', 'orchard');
  const date = view.facts.find((f) => f.id === 'oh-date');
  /* Staleness is computed by the shared model against its fixed present, so the
     server and the interface cannot disagree about what is still Confirmed. */
  equal(date.state, 'reported', 'the stale availability fact should have downgraded');
  assert(date.downgraded === true, 'and it should say why');
  db.close();
  return date.line.slice(0, 46) + '...';
});

await check('a fact stored with no state resolves to Unknown rather than vanishing', () => {
  const db = seed();
  db.recordFact('hh1', 'orchard', {
    id: 'oh-corkage', label: 'Corkage', value: null, state: 'unknown', category: 'policy',
  });
  const view = readFacts(db, 'hh1', 'orchard');
  const f = view.facts.find((x) => x.id === 'oh-corkage');
  equal(trust.displayValue(f), 'Not confirmed', 'an unknown must never render a figure');
  db.close();
});

await check('households are isolated from each other', () => {
  const db = seed();
  db.createHousehold({ id: 'hh2', title: 'Other Couple', partners: [{ id: 'sam', name: 'Sam', slot: 'a' }] });
  db.addPlace('hh2', { id: 'other-place', name: 'Somewhere Else' });
  db.recordFact('hh2', 'other-place', { id: 'x', label: 'Fee', value: 1, state: 'confirmed', source: 's', asOf: '2026-08-01', category: 'pricing' });
  equal(db.factsFor('hh1').filter((f) => f.id === 'x').length, 0, 'one household must not see another household facts');
  equal(db.listPlaces('hh1').length, 1, 'nor its places');
  db.close();
});

/* ------------------------------------------------------------- report */

const total = passed + failures.length;
console.log(`\n${'-'.repeat(60)}`);
if (failures.length) {
  console.log(`${passed}/${total} server checks pass. ${failures.length} failed:\n`);
  for (const f of failures) console.log(`  ${f.group} > ${f.name}`);
  process.exit(1);
}
console.log(`${passed}/${total} server checks pass.`);
