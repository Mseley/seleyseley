#!/usr/bin/env node
/*
 * Inlines the prototype into single self-contained files.
 *
 *   dist/vowos-prototype.html   a complete page, openable by double-click
 *   dist/artifact.html          the same content as a body fragment, for hosts
 *                               that supply their own document skeleton
 *
 * The source stays modular; only the distributed artifact is flattened. There
 * are no external requests in either output: no CDN, no web fonts, no remote
 * images. Every place composition is inline SVG.
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'prototype');
const OUT = join(ROOT, 'dist');

const page = readFileSync(join(SRC, 'index.html'), 'utf8');

const read = (rel) => readFileSync(join(SRC, rel), 'utf8');

const styles = [...page.matchAll(/<link rel="stylesheet" href="([^"]+)"\/>/g)].map((m) => m[1]);
const scripts = [...page.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);

if (!styles.length || !scripts.length) {
  console.error('bundle: found no stylesheets or scripts in prototype/index.html');
  process.exit(1);
}

const css = styles.map((rel) => `/* ${rel} */\n${read(rel)}`).join('\n');

/* A closing script tag inside a string literal would end the inline block. */
const js = scripts
  .map((rel) => `/* ${rel} */\n${read(rel)}`)
  .join('\n')
  .replace(/<\/script>/gi, '<\\/script>');

/* The favicon is an inline data URI, so it travels with the bundle. */
const favicon = (page.match(/<link rel="icon"[^>]*\/>/) || [''])[0];

const title = 'VowOS';
const description = 'A working prototype of the VowOS wedding planning agent: calm enough to trust, warm enough to love.';

const body = `<div id="app"></div>
<style>
${css}
</style>
<script>
${js}
</script>`;

const full = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/>
<meta name="color-scheme" content="light"/>
<title>${title}</title>
<meta name="description" content="${description}"/>
${favicon}
</head>
<body>
${body}
</body>
</html>
`;

const fragment = `<title>${title}</title>
${body}
`;

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, 'vowos-prototype.html'), full);
writeFileSync(join(OUT, 'artifact.html'), fragment);

const kb = (s) => `${(Buffer.byteLength(s) / 1024).toFixed(0)} KB`;
console.log(`  wrote dist/vowos-prototype.html  ${kb(full)}`);
console.log(`  wrote dist/artifact.html         ${kb(fragment)}`);
console.log(`  inlined ${styles.length} stylesheets and ${scripts.length} scripts, 0 external requests`);
