/* Accounts and sessions.
 *
 * No dependencies. Everything here uses node:crypto, and the choices are the
 * conservative ones rather than the clever ones, because this is the layer
 * where being clever is how people get hurt.
 *
 * What is deliberate:
 *
 *   Passwords are hashed with scrypt, which is memory-hard, so a leaked
 *   database is expensive to attack offline. The salt is per-account and stored
 *   alongside the hash. Parameters are recorded in the stored string so they can
 *   be raised later without invalidating existing accounts.
 *
 *   Only the HASH of a session token is stored. A dump of the sessions table
 *   does not let the reader sign in as anyone. The token itself exists once, in
 *   the response to the login that created it.
 *
 *   Comparisons are timing-safe. Password verification also runs the full hash
 *   for an unknown email, so a wrong address and a wrong password take the same
 *   time and the endpoint does not become an account enumerator.
 *
 * What is NOT here, and would be needed before real users: rate limiting and
 * lockout, password reset, email verification, second factors, session
 * revocation on password change, and a real secret store. See server/README.md.
 */

import {
  randomBytes, scryptSync, timingSafeEqual, createHash, randomUUID,
} from 'node:crypto';

const SCRYPT = { N: 16384, r: 8, p: 1, keylen: 64 };
const SESSION_DAYS = 30;

/* --------------------------------------------------------------- passwords */

export function hashPassword(password, salt = randomBytes(16)) {
  const derived = scryptSync(password, salt, SCRYPT.keylen,
    { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p, maxmem: 256 * 1024 * 1024 });
  return ['scrypt', SCRYPT.N, SCRYPT.r, SCRYPT.p, salt.toString('base64'), derived.toString('base64')].join('$');
}

export function verifyPassword(password, stored) {
  const parts = String(stored).split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, N, r, p, saltB64, hashB64] = parts;
  const salt = Buffer.from(saltB64, 'base64');
  const expected = Buffer.from(hashB64, 'base64');
  const actual = scryptSync(password, salt, expected.length,
    { N: Number(N), r: Number(r), p: Number(p), maxmem: 256 * 1024 * 1024 });
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

/* A hash of a password nobody has, used to keep the timing of an unknown email
   indistinguishable from a wrong password. */
const DECOY = hashPassword(randomBytes(32).toString('hex'));

/* ---------------------------------------------------------------- sessions */

const hashToken = (token) => createHash('sha256').update(token).digest('hex');

/* ---------------------------------------------------------------- accounts */

export function createAccount(db, { email, password, partnerId }) {
  if (!email || !/^[^@\s]+@[^@\s]+$/.test(email)) throw new Error('a valid email is required');
  if (!password || password.length < 12) {
    /* Length beats composition rules. A short password with a symbol in it is
       still short. */
    throw new Error('password must be at least 12 characters');
  }
  const partner = db.raw.prepare('SELECT id, household_id FROM partners WHERE id = ?').get(partnerId);
  if (!partner) throw new Error('that partner does not exist');

  const id = randomUUID();
  db.raw.prepare('INSERT INTO accounts (id, email, password_hash, partner_id, created_at) VALUES (?,?,?,?,?)')
    .run(id, email, hashPassword(password), partnerId, new Date().toISOString());
  return { id, email, partnerId, householdId: partner.household_id };
}

export function login(db, email, password) {
  const account = db.raw.prepare('SELECT * FROM accounts WHERE email = ?').get(String(email || ''));

  /* Run a hash either way, so an unknown address costs the same as a wrong
     password and the response time reveals nothing. */
  const ok = account ? verifyPassword(password, account.password_hash) : verifyPassword(password, DECOY);
  if (!account || !ok) return null;

  const token = randomBytes(32).toString('base64url');
  const expires = new Date(Date.now() + SESSION_DAYS * 86400_000).toISOString();
  db.raw.prepare('INSERT INTO sessions (token_hash, account_id, created_at, expires_at) VALUES (?,?,?,?)')
    .run(hashToken(token), account.id, new Date().toISOString(), expires);
  return { token, expiresAt: expires };
}

/* Resolves a token to the one household it may touch. Returns null for anything
   unrecognised or expired, and never explains which. */
export function authenticate(db, token) {
  if (!token) return null;
  const row = db.raw.prepare(`
    SELECT s.expires_at, a.id AS account_id, a.email, a.partner_id, p.household_id
    FROM sessions s
    JOIN accounts a ON a.id = s.account_id
    JOIN partners p ON p.id = a.partner_id
    WHERE s.token_hash = ?`).get(hashToken(token));
  if (!row) return null;
  if (new Date(row.expires_at) <= new Date()) {
    db.raw.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token));
    return null;
  }
  return {
    accountId: row.account_id,
    email: row.email,
    partnerId: row.partner_id,
    householdId: row.household_id,
    /* The only handle a request handler ever receives. */
    scope: db.scopedTo(row.household_id),
  };
}

export function logout(db, token) {
  if (!token) return false;
  const result = db.raw.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token));
  return result.changes > 0;
}

export function logoutEverywhere(db, accountId) {
  return db.raw.prepare('DELETE FROM sessions WHERE account_id = ?').run(accountId).changes;
}
