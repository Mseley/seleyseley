/* The HTTP layer.
 *
 * Bearer tokens rather than cookies, deliberately. A cookie is attached by the
 * browser to every request to this origin, including ones a different site
 * caused, which is what makes CSRF possible and what a synchroniser token or
 * SameSite policy then has to defend against. A bearer token is attached only
 * by code that means to attach it, so the class of attack does not arise.
 *
 * Every authenticated handler receives a SCOPED handle and never the database,
 * so no route can address a household other than the caller's. That is the
 * boundary; the routes below cannot cross it even incorrectly.
 */

import { createServer } from 'node:http';
import { authenticate, login, logout } from './auth.mjs';
import { createExecutor, readFacts } from './actions.mjs';
import { delegation } from './model.mjs';

const json = (res, status, body) => {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    /* A JSON API serves no markup and should never be framed or sniffed. */
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
    'referrer-policy': 'no-referrer',
  });
  res.end(payload);
};

async function readBody(req, limit = 64 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw new Error('request body too large');
    chunks.push(chunk);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new Error('body must be JSON');
  }
}

const bearer = (req) => {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
};

export function createApp(db, effects = {}) {
  const routes = [];
  const on = (method, pattern, handler, opts = {}) =>
    routes.push({ method, pattern, handler, auth: opts.auth !== false });

  /* ------------------------------------------------------------- public */

  on('POST', '/api/login', async ({ body }) => {
    const session = login(db, body.email, body.password);
    /* One message for a wrong address and a wrong password alike. Telling the
       caller which was wrong turns this endpoint into an account checker. */
    if (!session) return [401, { error: 'Those details do not match an account.' }];
    return [200, session];
  }, { auth: false });

  on('POST', '/api/logout', async ({ req }) => {
    logout(db, bearer(req));
    return [200, { ok: true }];
  }, { auth: false });

  /* --------------------------------------------------------- authenticated */

  on('GET', '/api/me', async ({ session }) => [200, {
    email: session.email,
    partnerId: session.partnerId,
    household: session.scope.household(),
  }]);

  on('GET', '/api/places', async ({ session }) => {
    const places = session.scope.places().map((place) => {
      const view = readFacts(session.scope, place.id);
      return Object.assign({}, place, {
        facts: view.facts,
        disputes: view.disputes,
        verified: view.summary.confirmed,
        unresolved: view.summary.unknown.length,
      });
    });
    return [200, { places }];
  });

  on('GET', '/api/corrections', async ({ session }) =>
    [200, { corrections: readFacts(session.scope, null).corrections }]);

  on('GET', '/api/delegation', async ({ session }) => {
    const settings = session.scope.getDelegation();
    return [200, {
      settings,
      levels: delegation.LEVELS,
      scopes: delegation.SCOPES,
      /* Every capability, evaluated live, so the interface never has to guess
         and can never describe a permission the server does not hold. */
      actions: Object.keys(delegation.ACTIONS).map((id) => Object.assign(
        { id, label: delegation.ACTIONS[id].label },
        createExecutor(session.scope, effects).preview(id))),
    }];
  });

  on('PUT', '/api/delegation', async ({ session, body }) => {
    const level = String(body.level || '');
    if (!delegation.LEVELS.some((l) => l.id === level)) return [400, { error: 'unknown level' }];
    const known = new Set(delegation.SCOPES.map((s) => s.id));
    const scopes = (Array.isArray(body.scopes) ? body.scopes : []).filter((s) => known.has(s));
    session.scope.setDelegation({ level, scopes });
    return [200, { settings: session.scope.getDelegation() }];
  });

  on('POST', '/api/actions/attempt', async ({ session, body }) => {
    const exec = createExecutor(session.scope, effects);
    const out = await exec.attempt(String(body.actionId || ''), body.payload || {});
    return [out.ran ? 200 : 403, out];
  });

  on('POST', '/api/actions/authorize', async ({ session, body }) => {
    const exec = createExecutor(session.scope, effects);
    /* The approving partner is taken from the session, never from the body.
       Otherwise one partner could approve as the other and defeat the rule
       that money needs them both. */
    const out = await exec.authorize(
      String(body.requestId || ''), String(body.actionId || ''),
      session.partnerId, body.payload || {});
    return [out.ran ? 200 : 202, out];
  });

  on('GET', '/api/audit', async ({ session }) => [200, { entries: session.scope.auditLog(50) }]);

  /* ------------------------------------------------------------ dispatch */

  const handler = async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const route = routes.find((r) => r.method === req.method && r.pattern === url.pathname);
    if (!route) return json(res, 404, { error: 'not found' });

    try {
      let session = null;
      if (route.auth) {
        session = authenticate(db, bearer(req));
        if (!session) return json(res, 401, { error: 'sign in first' });
      }
      const body = req.method === 'GET' ? {} : await readBody(req);
      const [status, payload] = await route.handler({ req, session, body, url });
      return json(res, status, payload);
    } catch (error) {
      /* Never return an internal message to a caller. It leaks structure and
         occasionally leaks data. */
      if (/too large|must be JSON/.test(error.message)) {
        return json(res, 400, { error: error.message });
      }
      console.error('[vowos]', error);
      return json(res, 500, { error: 'something went wrong' });
    }
  };

  return { handler, listen: (port) => createServer(handler).listen(port) };
}
