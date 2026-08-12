/* The trust and delegation models, loaded once and shared.
 *
 * These models are the product's two load-bearing rules, and the repository's
 * central discipline is that a rule lives in exactly one place. Reimplementing
 * them server-side would create precisely the fork the token pipeline exists to
 * prevent, except in the layer where being wrong actually costs something.
 *
 * So the server loads the same files the browser does. They are pure logic with
 * no DOM, which is why this works at all, and `scripts/verify.mjs` already
 * proves the pattern by exercising them in a bare context.
 *
 * Production note: the honest next refactor turns prototype/js/{util,model}.js
 * into real ES modules imported by both surfaces. That is mechanical. What
 * matters is that it stays one implementation, not two that agree today.
 */

import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const JS = join(ROOT, 'prototype', 'js');

const warnings = [];
const sandbox = {
  console: {
    warn: (m) => warnings.push(String(m)),
    error: (m) => warnings.push(String(m)),
    log: () => {},
  },
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
createContext(sandbox);

for (const file of ['util.js', 'model.js']) {
  runInContext(readFileSync(join(JS, file), 'utf8'), sandbox, { filename: `shared:${file}` });
}

export const V = sandbox.window.VowOS;
export const trust = V.trust;
export const delegation = V.delegation;

/* Surfaced so the server can log a fact that arrived without a resolved state
   rather than letting the warning vanish into a sandbox nobody reads. */
export function drainModelWarnings() {
  return warnings.splice(0, warnings.length);
}
