#!/usr/bin/env node
/* Authentication and HTTP boundary tests. `npm run test:http`.
 *
 * These exercise the things that only become possible once there is a network:
 * signing in, holding a session, and trying to reach a household that is not
 * yours. The last one is the point.
 */

import { open } from './db.mjs';
import { createApp } from './http.mjs';
import { createAccount, login, authenticate, logout, hashPassword, verifyPassword } from './auth.mjs';

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

const PASSWORD = 'a-long-enough-passphrase';

function seedTwoHouseholds() {
  const db = open(':memory:');
  db.createHousehold({
    id: 'hh1', title: 'Maya and Alex',
    partners: [{ id: 'maya', name: 'Maya', slot: 'a' }, { id: 'alex', name: 'Alex', slot: 'b' }],
    delegation: { level: 'standing', scopes: ['propose-tour-times'] },
  });
  db.addPlace('hh1', { id: 'orchard', name: 'The Orchard House' });
  db.recordFact('hh1', 'orchard', {
    id: 'oh-fee', label: 'Site fee', value: 34200, state: 'confirmed',
    source: 'The Orchard House', asOf: '2026-08-04', category: 'pricing',
  });

  db.createHousehold({
    id: 'hh2', title: 'Someone Else',
    partners: [{ id: 'sam', name: 'Sam', slot: 'a' }],
    delegation: { level: 'standing', scopes: [] },
  });
  db.addPlace('hh2', { id: 'private-place', name: 'A Private Barn' });
  db.recordFact('hh2', 'private-place', {
    id: 'secret-fee', label: 'Site fee', value: 99999, state: 'confirmed',
    source: 'them', asOf: '2026-08-04', category: 'pricing',
  });

  createAccount(db, { email: 'maya@example.com', password: PASSWORD, partnerId: 'maya' });
  createAccount(db, { email: 'alex@example.com', password: PASSWORD, partnerId: 'alex' });
  createAccount(db, { email: 'sam@example.com', password: PASSWORD, partnerId: 'sam' });
  return db;
}

/* A fetch-like caller against the handler, with no socket involved. */
function client(app) {
  return async (method, path, { token, body } = {}) => {
    const chunks = body ? [Buffer.from(JSON.stringify(body))] : [];
    const req = Object.assign(
      (async function* () { for (const c of chunks) yield c; })(),
      { method, url: path, headers: token ? { authorization: `Bearer ${token}` } : {} });

    let status = 0; let payload = '';
    const res = {
      writeHead(s) { status = s; return res; },
      end(p) { payload = p || ''; },
    };
    await app.handler(req, res);
    return { status, body: payload ? JSON.parse(payload) : null };
  };
}

/* ============================================================ PASSWORDS = */

describe('Passwords and sessions');

await check('a password is never stored in a recoverable form', () => {
  const db = seedTwoHouseholds();
  const row = db.raw.prepare("SELECT password_hash FROM accounts WHERE email = 'maya@example.com'").get();
  assert(!row.password_hash.includes(PASSWORD), 'the password must not appear in storage');
  assert(row.password_hash.startsWith('scrypt$'), 'the hash should record its own parameters');
  db.close();
  return row.password_hash.slice(0, 22) + '...';
});

await check('the same password hashes differently for two accounts', () => {
  const db = seedTwoHouseholds();
  const rows = db.raw.prepare('SELECT password_hash FROM accounts').all();
  const unique = new Set(rows.map((r) => r.password_hash));
  equal(unique.size, rows.length, 'each account needs its own salt');
  db.close();
});

await check('verification accepts the right password and rejects a near miss', () => {
  const stored = hashPassword(PASSWORD);
  assert(verifyPassword(PASSWORD, stored) === true, 'the correct password should verify');
  assert(verifyPassword(PASSWORD + 'x', stored) === false, 'a near miss must not verify');
  assert(verifyPassword('', stored) === false, 'an empty password must not verify');
});

await check('a short password is refused at creation', () => {
  const db = seedTwoHouseholds();
  let threw = false;
  try {
    createAccount(db, { email: 'new@example.com', password: 'short', partnerId: 'sam' });
  } catch (e) { threw = /at least 12/.test(e.message); }
  assert(threw, 'a short password should be refused');
  db.close();
});

await check('only the hash of a session token is stored', () => {
  const db = seedTwoHouseholds();
  const session = login(db, 'maya@example.com', PASSWORD);
  const rows = db.raw.prepare('SELECT token_hash FROM sessions').all();
  equal(rows.length, 1, 'the session should exist');
  assert(rows[0].token_hash !== session.token, 'the raw token must not be in the database');
  assert(!JSON.stringify(rows).includes(session.token), 'nor anywhere else in the row');
  db.close();
});

await check('an expired session stops authenticating', () => {
  const db = seedTwoHouseholds();
  const session = login(db, 'maya@example.com', PASSWORD);
  assert(authenticate(db, session.token), 'it should work before expiry');
  db.raw.prepare("UPDATE sessions SET expires_at = '2020-01-01T00:00:00.000Z'").run();
  equal(authenticate(db, session.token), null, 'an expired session must not authenticate');
  db.close();
});

await check('logging out invalidates the token immediately', () => {
  const db = seedTwoHouseholds();
  const session = login(db, 'maya@example.com', PASSWORD);
  logout(db, session.token);
  equal(authenticate(db, session.token), null, 'the token should be dead after logout');
  db.close();
});

await check('a wrong password and an unknown address are indistinguishable', () => {
  const db = seedTwoHouseholds();
  equal(login(db, 'maya@example.com', 'wrong-password-here'), null, 'a wrong password fails');
  equal(login(db, 'nobody@example.com', PASSWORD), null, 'an unknown address fails the same way');
  db.close();
});

/* ====================================================== THE BOUNDARY ==== */

describe('The household boundary holds over HTTP');

await check('an unauthenticated request is refused', async () => {
  const db = seedTwoHouseholds();
  const call = client(createApp(db, {}));
  const res = await call('GET', '/api/places');
  equal(res.status, 401, 'no session means no data');
  db.close();
});

await check('a made-up token is refused', async () => {
  const db = seedTwoHouseholds();
  const call = client(createApp(db, {}));
  const res = await call('GET', '/api/places', { token: 'not-a-real-token' });
  equal(res.status, 401, 'an invented token must not authenticate');
  db.close();
});

await check('a signed-in partner sees their own household', async () => {
  const db = seedTwoHouseholds();
  const call = client(createApp(db, {}));
  const { token } = login(db, 'maya@example.com', PASSWORD);
  const res = await call('GET', '/api/places', { token });
  equal(res.status, 200, 'the request should succeed');
  equal(res.body.places.length, 1, 'one place');
  equal(res.body.places[0].name, 'The Orchard House', 'and it should be theirs');
  db.close();
});

await check('one household never sees another over the API', async () => {
  const db = seedTwoHouseholds();
  const call = client(createApp(db, {}));
  const { token } = login(db, 'sam@example.com', PASSWORD);
  const res = await call('GET', '/api/places', { token });
  const serialised = JSON.stringify(res.body);
  assert(!serialised.includes('Orchard'), 'another household place leaked');
  assert(!serialised.includes('34200'), 'another household fact leaked');
  equal(res.body.places.length, 1, 'only their own place');
  db.close();
});

await check('a scoped handle cannot be pointed at another household', () => {
  const db = seedTwoHouseholds();
  const scope = db.scopedTo('hh1');
  /* There is no method that takes a household id, so the only way to try is to
     mutate the handle, and even that changes nothing about what it reads. */
  scope.householdId = 'hh2';
  const places = scope.places();
  equal(places.length, 1, 'still one place');
  equal(places[0].id, 'orchard', 'still the original household, because the query was bound at creation');
  db.close();
});

await check('the approving partner comes from the session, not the request body', async () => {
  const db = seedTwoHouseholds();
  const { effects, sent } = (() => {
    const sent = [];
    return { sent, effects: { 'approve-place': async () => { sent.push(1); return {}; } } };
  })();
  const call = client(createApp(db, effects));
  const { token } = login(db, 'maya@example.com', PASSWORD);

  /* Maya approves twice, the second time claiming to be Alex. If the body were
     trusted, this would commit the couple to a place on one person's say-so. */
  await call('POST', '/api/actions/authorize', { token,
    body: { requestId: 'r1', actionId: 'approve-place', partnerId: 'maya', payload: {} } });
  const res = await call('POST', '/api/actions/authorize', { token,
    body: { requestId: 'r1', actionId: 'approve-place', partnerId: 'alex', payload: {} } });

  equal(res.status, 202, 'it should still be waiting');
  assert(res.body.waitingOn.includes('alex'), 'and still waiting on Alex specifically');
  equal(sent.length, 0, 'nothing may have fired');
  db.close();
  return 'impersonation ignored';
});

await check('both partners signing in separately can complete an approval', async () => {
  const db = seedTwoHouseholds();
  const sent = [];
  const call = client(createApp(db, { 'approve-place': async () => { sent.push(1); return {}; } }));
  const maya = login(db, 'maya@example.com', PASSWORD);
  const alex = login(db, 'alex@example.com', PASSWORD);

  await call('POST', '/api/actions/authorize', { token: maya.token, body: { requestId: 'r1', actionId: 'approve-place' } });
  const res = await call('POST', '/api/actions/authorize', { token: alex.token, body: { requestId: 'r1', actionId: 'approve-place' } });
  equal(res.status, 200, 'the second approval should complete it');
  equal(sent.length, 1, 'the effect fires exactly once');
  db.close();
});

/* ====================================================== API BEHAVIOUR === */

describe('API behaviour');

await check('the delegation endpoint ignores unknown scopes', async () => {
  const db = seedTwoHouseholds();
  const call = client(createApp(db, {}));
  const { token } = login(db, 'maya@example.com', PASSWORD);
  const res = await call('PUT', '/api/delegation', { token,
    body: { level: 'standing', scopes: ['propose-tour-times', 'invent-a-power', 'wire-money'] } });
  equal(res.status, 200, 'the valid part should apply');
  equal(res.body.settings.scopes.length, 1, 'invented scopes must be dropped');
  equal(res.body.settings.scopes[0], 'propose-tour-times', 'and the real one kept');
  db.close();
});

await check('an unknown delegation level is rejected outright', async () => {
  const db = seedTwoHouseholds();
  const call = client(createApp(db, {}));
  const { token } = login(db, 'maya@example.com', PASSWORD);
  const res = await call('PUT', '/api/delegation', { token, body: { level: 'do-anything', scopes: [] } });
  equal(res.status, 400, 'an unknown level must be refused');
  equal(db.getDelegation('hh1').level, 'standing', 'and nothing should have changed');
  db.close();
});

await check('a refused action returns 403 and fires nothing', async () => {
  const db = seedTwoHouseholds();
  const sent = [];
  const call = client(createApp(db, { 'send-inquiry-pack': async () => { sent.push(1); return {}; } }));
  const { token } = login(db, 'maya@example.com', PASSWORD);
  const res = await call('POST', '/api/actions/attempt', { token,
    body: { actionId: 'send-inquiry-pack', payload: {} } });
  equal(res.status, 403, 'an ungranted action is forbidden');
  equal(sent.length, 0, 'and nothing fires');
  assert(res.body.reason.length > 10, 'the refusal explains itself');
  db.close();
});

await check('the login endpoint gives one message for both kinds of failure', async () => {
  const db = seedTwoHouseholds();
  const call = client(createApp(db, {}));
  const wrongPassword = await call('POST', '/api/login', { body: { email: 'maya@example.com', password: 'nope-not-this' } });
  const unknownEmail = await call('POST', '/api/login', { body: { email: 'ghost@example.com', password: PASSWORD } });
  equal(wrongPassword.status, 401, 'wrong password is 401');
  equal(unknownEmail.status, 401, 'unknown email is 401');
  equal(wrongPassword.body.error, unknownEmail.body.error, 'the messages must be identical');
  db.close();
});

await check('an oversized body is rejected rather than buffered', async () => {
  const db = seedTwoHouseholds();
  const call = client(createApp(db, {}));
  const { token } = login(db, 'maya@example.com', PASSWORD);
  const res = await call('POST', '/api/actions/attempt', { token,
    body: { actionId: 'reorder-plan', payload: { junk: 'x'.repeat(80 * 1024) } } });
  equal(res.status, 400, 'a body over the limit should be refused');
  db.close();
});

await check('responses carry the headers a JSON API should', async () => {
  const db = seedTwoHouseholds();
  const app = createApp(db, {});
  let headers = {};
  const req = Object.assign((async function* () {})(), { method: 'GET', url: '/api/places', headers: {} });
  await app.handler(req, { writeHead(s, h) { headers = h; return this; }, end() {} });
  equal(headers['x-content-type-options'], 'nosniff', 'no sniffing');
  equal(headers['x-frame-options'], 'DENY', 'no framing');
  equal(headers['cache-control'], 'no-store', 'no caching of account data');
  db.close();
});

/* ------------------------------------------------------------- report */

const total = passed + failures.length;
console.log(`\n${'-'.repeat(60)}`);
if (failures.length) {
  console.log(`${passed}/${total} auth and HTTP checks pass. ${failures.length} failed:\n`);
  for (const f of failures) console.log(`  ${f.group} > ${f.name}`);
  process.exit(1);
}
console.log(`${passed}/${total} auth and HTTP checks pass.`);
