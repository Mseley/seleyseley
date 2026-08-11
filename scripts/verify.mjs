#!/usr/bin/env node
/*
 * VowOS verification harness. `npm test`.
 *
 * Masterplan principle 2.9: a rule is executable or it is decoration. The
 * frameworks in sections 3 and 4 are the product's central claims, and the
 * editorial rules in UI Plan section 15 are the ones that rot quietest. This
 * file turns both into checks that run in a second, with no dependencies.
 *
 * The prototype's scripts attach to a global namespace rather than using ES
 * modules, which means the models can be loaded into a bare context here and
 * exercised directly, with no browser and no DOM.
 */

import { readFileSync, readdirSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const JS = join(ROOT, 'prototype', 'js');

/* ----------------------------------------------------------- test runner */

let passed = 0;
const failures = [];
let group = '';

const describe = (name) => { group = name; console.log(`\n${name}`); };

function check(name, fn) {
  try {
    const detail = fn();
    passed++;
    console.log(`  pass  ${name}${detail ? `  (${detail})` : ''}`);
  } catch (error) {
    failures.push({ group, name, message: error.message });
    console.log(`  FAIL  ${name}\n        ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function equal(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}\n        expected: ${expected}\n        actual:   ${actual}`);
  }
}

/* ------------------------------------------------- load the models bare */

const warnings = [];
const sandbox = {
  console: { warn: (m) => warnings.push(m), log: () => {}, error: (m) => warnings.push(m) },
};
sandbox.window = sandbox;
sandbox.globalThis = sandbox;
createContext(sandbox);

for (const file of ['util.js', 'imagery.js', 'model.js', 'data.js']) {
  runInContext(readFileSync(join(JS, file), 'utf8'), sandbox, { filename: file });
}

const V = sandbox.window.VowOS;
const D = V.data;
const factOf = (placeId, factId) =>
  V.byId(D.places, placeId).facts.find((f) => f.id === factId);

/* ================================================ 1. TRUST DATA MODEL == */

describe('Trust data model (Masterplan section 3)');

check('a confirmed fact past its freshness window downgrades to reported', () => {
  const r = V.trust.resolve(factOf('orchard-house', 'oh-date'));
  equal(r.originalState, 'confirmed', 'stored state should be confirmed');
  equal(r.state, 'reported', 'resolved state should have downgraded');
  assert(r.downgraded === true, 'downgraded flag should be set');
  assert(r.ageDays > r.window, `age ${r.ageDays} should exceed window ${r.window}`);
  return `${r.ageDays} days old against a ${r.window} day window`;
});

check('the downgrade explains itself in the evidence line', () => {
  const r = V.trust.resolve(factOf('orchard-house', 'oh-date'));
  assert(/age after 14 days/.test(r.line), `line did not explain the window: "${r.line}"`);
  assert(/re-check before you commit/.test(r.line), 'line did not say what happens next');
});

check('a confirmed fact inside its window does not downgrade', () => {
  const r = V.trust.resolve(factOf('maison-98', 'm98-date'));
  equal(r.state, 'confirmed', 'fresh availability should stay confirmed');
  assert(r.downgraded === false, 'downgraded flag should be clear');
  return `${r.ageDays} days old`;
});

check('a fact with no declared state resolves to unknown and reports itself', () => {
  warnings.length = 0;
  const r = V.trust.resolve({ id: 'ghost', label: 'Corkage', category: 'policy' });
  equal(r.state, 'unknown', 'an unstated fact must not render as anything else');
  assert(warnings.length === 1, 'it should have written exactly one warning');
  assert(/no resolved state/.test(warnings[0]), 'the warning should name the problem');
});

check('an unknown fact never renders a figure', () => {
  const r = V.trust.resolve({ label: 'Site fee', value: 24000, state: 'unknown', category: 'pricing' });
  equal(V.trust.displayValue(r), 'Not confirmed', 'a figure implies a source');
});

check('a missing fact never renders a figure either', () => {
  equal(V.trust.displayValue(null), 'Not confirmed', 'null must not fall through to a dash or a blank');
});

check('an inferred figure is marked as an estimate wherever it appears', () => {
  const r = V.trust.resolve(factOf('maison-98', 'm98-service'));
  equal(r.state, 'inferred', 'stored state should be inferred');
  assert(/^About /.test(V.trust.displayValue(r)), `estimate rendered bare: "${V.trust.displayValue(r)}"`);
  assert(/Our estimate based on/.test(r.line), 'the line should name the basis');
});

check('every state produces a sentence, never an empty caption', () => {
  for (const state of Object.keys(V.trust.STATES)) {
    const r = V.trust.resolve({ label: 'x', value: 'y', state, source: 's', asOf: '2026-08-10', category: 'policy' });
    assert(r.line && r.line.trim().length > 12, `state "${state}" produced a thin line: "${r.line}"`);
  }
  return `${Object.keys(V.trust.STATES).length} states`;
});

check('every fact in the product declares a known category', () => {
  const known = Object.keys(V.trust.FRESHNESS);
  for (const place of D.places) {
    for (const fact of place.facts) {
      assert(known.includes(fact.category),
        `${place.id}/${fact.id} has category "${fact.category}", which has no freshness window`);
    }
  }
  return `${D.places.reduce((n, p) => n + p.facts.length, 0)} facts`;
});

check('summarize reports incompleteness rather than rounding it away', () => {
  const s = V.trust.summarize(V.byId(D.places, 'orchard-house').facts);
  assert(s.complete === false, 'a place with unknowns must not summarize as complete');
  assert(s.unknown.length > 0, 'the unknowns should be enumerated, not counted away');
  return `${s.unknown.length} unknown, ${s.stale.length} stale`;
});

/* ============================================= 2. DELEGATION MODEL ==== */

describe('Agent permission model (Masterplan section 4)');

const LEVELS = V.delegation.LEVELS.map((l) => l.id);
const ALL_SCOPES = V.delegation.SCOPES.map((s) => s.id);

check('money and irreversible commitments are refused at every level and every scope', () => {
  const financial = Object.keys(V.delegation.ACTIONS)
    .filter((id) => V.delegation.ACTIONS[id].financial);
  assert(financial.length > 0, 'there should be financial actions to test');
  let combinations = 0;
  for (const id of financial) {
    for (const level of LEVELS) {
      /* Grant everything, including scopes that are off by default. */
      const result = V.delegation.evaluate(id, { level, scopes: ALL_SCOPES.slice() });
      combinations++;
      assert(result.allowed === false,
        `"${id}" was allowed at level "${level}" with every scope granted`);
      assert(result.requiresApproval === true, `"${id}" did not require approval at "${level}"`);
    }
  }
  return `${combinations} combinations refused`;
});

check('the financial refusal says so in plain language', () => {
  const r = V.delegation.evaluate('approve-venue', { level: 'standing', scopes: ALL_SCOPES.slice() });
  assert(/comes back to you both/.test(r.reason), `unclear reason: "${r.reason}"`);
  assert(/whatever your settings say/.test(r.reason), 'it should say the setting cannot override this');
});

check('a granted scope permits its action and names itself', () => {
  const r = V.delegation.evaluate('request-tour', { level: 'standing', scopes: ['propose-tour-times'] });
  assert(r.allowed === true, 'a granted scope should permit its action');
  assert(/standing approval you gave/.test(r.reason), 'the reason should cite the grant');
  assert(r.reason.includes('Propose tour times'), 'the reason should quote the scope itself');
});

check('revoking the scope re-gates the same action', () => {
  const r = V.delegation.evaluate('request-tour', { level: 'standing', scopes: [] });
  assert(r.allowed === false, 'the action should be gated once the scope is revoked');
  assert(r.requiresApproval === true, 'it should require approval');
});

check('propose-only gates everything that leaves the product', () => {
  const external = Object.keys(V.delegation.ACTIONS).filter((id) => V.delegation.ACTIONS[id].external);
  for (const id of external) {
    const r = V.delegation.evaluate(id, { level: 'propose', scopes: ALL_SCOPES.slice() });
    assert(r.allowed === false, `"${id}" escaped propose-only`);
  }
  return `${external.length} external actions gated`;
});

check('act-and-report never reaches a third party', () => {
  const external = Object.keys(V.delegation.ACTIONS).filter((id) => V.delegation.ACTIONS[id].external);
  for (const id of external) {
    const r = V.delegation.evaluate(id, { level: 'report', scopes: ALL_SCOPES.slice() });
    assert(r.allowed === false, `"${id}" reached a third party under act-and-report`);
  }
});

check('reversible internal work proceeds without asking', () => {
  const r = V.delegation.evaluate('reorder-plan', { level: 'standing', scopes: [] });
  assert(r.allowed === true, 'reversible internal work should not need approval');
  assert(/reversible/.test(r.reason), 'the reason should say why');
});

check('the action registry is closed', () => {
  const r = V.delegation.evaluate('wire-the-deposit', { level: 'standing', scopes: ALL_SCOPES.slice() });
  assert(r.allowed === false, 'an undeclared action must never be permitted');
  assert(/not a capability/.test(r.reason), `unclear refusal: "${r.reason}"`);
});

check('every declared action states all four of its properties', () => {
  for (const [id, a] of Object.entries(V.delegation.ACTIONS)) {
    for (const key of ['external', 'financial', 'reversible']) {
      assert(typeof a[key] === 'boolean', `action "${id}" leaves "${key}" undeclared`);
    }
    assert(typeof a.label === 'string' && a.label.length > 0, `action "${id}" has no label`);
    if (a.scope !== null) {
      assert(ALL_SCOPES.includes(a.scope), `action "${id}" cites unknown scope "${a.scope}"`);
    }
  }
  return `${Object.keys(V.delegation.ACTIONS).length} actions`;
});

check('every evaluation returns a reason the interface can show a user', () => {
  for (const id of Object.keys(V.delegation.ACTIONS)) {
    for (const level of LEVELS) {
      const r = V.delegation.evaluate(id, { level, scopes: ALL_SCOPES.slice() });
      assert(r.reason && r.reason.length > 20, `"${id}" at "${level}" produced no usable reason`);
    }
  }
});

/* ============================================ 3. SCENARIO ARITHMETIC == */

describe('Scenario coherence (the figures the copy quotes)');

const committed = D.budget.committed.reduce((n, i) => n + i.amount, 0);
const projected = D.budget.projected.reduce((n, i) => n + i.amount, 0);

check('the difference quoted in the Planning Pulse matches the two site fees', () => {
  const orchard = D.budget.scenarios.find((s) => s.placeId === 'orchard-house').siteFee;
  const maison = D.budget.scenarios.find((s) => s.placeId === 'maison-98').siteFee;
  equal(orchard - maison, 7400, 'the copy says Maison 98 keeps about $7,400 more available');
});

check('scenario site fees match the confirmed facts on each place', () => {
  for (const s of D.budget.scenarios) {
    const fee = V.byId(D.places, s.placeId).facts
      .find((f) => f.category === 'pricing' && typeof f.value === 'number');
    equal(s.siteFee, fee.value, `${s.placeId} scenario disagrees with its own site fee fact`);
  }
});

check('each scenario note agrees with the direction of its arithmetic', () => {
  for (const s of D.budget.scenarios) {
    const total = committed + projected + s.siteFee;
    const over = total > D.budget.comfort;
    const claimsOver = /over/.test(s.note) || /puts you over/.test(s.note);
    equal(claimsOver, over,
      `${s.placeId}: total ${total} against comfort ${D.budget.comfort}, but the note reads "${s.note}"`);
  }
  return `${V.fmtMoney(committed + projected)} before the place`;
});

check('the budget leaves room for the place rather than pretending to be a total', () => {
  assert(committed + projected < D.budget.comfort,
    'planned spending already exceeds comfort before a place is chosen');
});

check('every place offers two reasons and exactly one reality check', () => {
  for (const p of D.places) {
    equal(p.whyItFits.length, 2, `${p.id} should give two reasons, per UI Plan 9.1`);
    assert(typeof p.realityCheck === 'string' && p.realityCheck.length > 20,
      `${p.id} has no substantive reality check`);
  }
  return `${D.places.length} places`;
});

check('the shortlist stays a shortlist', () => {
  assert(D.places.length <= 5, `${D.places.length} places shown; UI Plan 9.1 caps the default view at five`);
  return `${D.places.length} places`;
});

check('the correction names what happened, what it touched, and its bound', () => {
  const body = D.correction.body;
  assert(/On August 6 I told you/.test(body), 'it should state what it said and when');
  assert(/taken the figure out/.test(body), 'it should state what it affected');
  assert(/Nothing was sent to anyone/.test(body), 'it should bound the damage, which is the clause teams forget');
});

/* ============================================== 4. EDITORIAL RULES ==== */

describe('Editorial rules (UI Plan section 15)');

/* Comments are the author talking to the next engineer, not product copy, so
   they are stripped before the copy rules are applied. */
function stripComments(source) {
  return source.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');
}

const copyFiles = readdirSync(JS).filter((f) => f.endsWith('.js'));
const copy = copyFiles.map((f) => ({ file: f, text: stripComments(readFileSync(join(JS, f), 'utf8')) }));

check('no em dashes in product copy', () => {
  for (const { file, text } of copy) {
    const at = text.indexOf('—');
    assert(at === -1, `${file} contains an em dash near: ${text.slice(Math.max(0, at - 40), at + 40).trim()}`);
  }
  return `${copyFiles.length} files`;
});

check('no doubled sentence periods', () => {
  for (const { file, text } of copy) {
    const hit = text.match(/[a-z]\.\.(?!\.)/);
    assert(!hit, `${file} contains a doubled period near "${hit && hit[0]}"`);
  }
});

check('no placeholder leakage', () => {
  for (const { file, text } of copy) {
    const hit = text.match(/lorem ipsum|\bTODO\b|\bFIXME\b|\bTBD\b|placeholder text/i);
    assert(!hit, `${file} leaks a placeholder: "${hit && hit[0]}"`);
  }
});

check('one approved term per concept: a time is proposed, held, or confirmed', () => {
  for (const { file, text } of copy) {
    const hit = text.match(/\breservations?\b/i);
    assert(!hit, `${file} uses "${hit && hit[0]}" where the glossary says "hold"`);
  }
});

check('the interface never defaults to bride, groom, husband, or wife', () => {
  for (const { file, text } of copy) {
    const hit = text.match(/\b(bride|groom|husband|wife)\b/i);
    assert(!hit, `${file} uses gendered default "${hit && hit[0]}", against UI Plan 13`);
  }
});

/* ===================================== 5. DESIGN SYSTEM ENFORCEMENT === */

describe('Design system enforcement (Masterplan section 5)');

const appCss = readFileSync(join(ROOT, 'prototype', 'styles', 'app.css'), 'utf8');

check('app.css holds no raw color literals', () => {
  const hits = appCss.match(/#[0-9A-Fa-f]{3,8}\b|\brgba?\(/g);
  assert(!hits, `every color must come from a token, found: ${hits && [...new Set(hits)].join(', ')}`);
});

check('the generated stylesheet warns against being edited', () => {
  const generated = readFileSync(join(ROOT, 'prototype', 'styles', 'tokens.css'), 'utf8');
  assert(/DO NOT EDIT/.test(generated), 'the generated file must say it is generated');
  assert(/tokens\.json/.test(generated), 'it must name its source');
});

check('every token carries a stated usage rule', () => {
  const tokens = JSON.parse(readFileSync(join(ROOT, 'design-system', 'tokens.json'), 'utf8'));
  const groups = ['color', 'state', 'space', 'radius', 'font', 'fontSize', 'motion', 'shadow', 'layout'];
  let counted = 0;
  for (const g of groups) {
    for (const [name, token] of Object.entries(tokens[g])) {
      if (name.startsWith('$')) continue;
      assert(typeof token.usage === 'string' && token.usage.length > 0,
        `${g}.${name} has no usage rule, so nobody knows when to reach for it`);
      counted++;
    }
  }
  return `${counted} tokens`;
});

check('the three fill-only colors are asserted to fail as text', () => {
  const tokens = JSON.parse(readFileSync(join(ROOT, 'design-system', 'tokens.json'), 'utf8'));
  for (const name of ['roseClay', 'mistBlue', 'softGold']) {
    const banned = tokens.contrastRequirements
      .find((r) => r.fg === name && r.expect === 'fail');
    assert(banned, `${name} has no assertion keeping it out of text, so the ban is only prose`);
  }
});

/* ------------------------------------------------------------- report */

const total = passed + failures.length;
console.log(`\n${'-'.repeat(60)}`);
if (failures.length) {
  console.log(`${passed}/${total} checks pass. ${failures.length} failed:\n`);
  for (const f of failures) console.log(`  ${f.group} > ${f.name}`);
  process.exit(1);
}
console.log(`${passed}/${total} checks pass.`);
