import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
// The game may show places, and nothing more personal. Names to refuse are passed in at run time
// (VOYAGE_DENY=name,name) so that they are never written into the repository.
const root = dirname(fileURLToPath(import.meta.url));
const files = (dir => { const out = []; (function walk(d) { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (/\.(m?js|html|css)$/.test(f) && !/\.test\.mjs$|verify\.mjs$/.test(f)) out.push(p); } })(dir); return out; })(root);
test('no four-digit year appears in any shipped file', () => {
  for (const f of files) {
    const text = readFileSync(f, 'utf8').replace(/#[0-9a-fA-F]{6,8}\b/g, '');
    const years = text.match(/(?<![\d.#\w])(1[89]\d\d|20\d\d)(?![\d.\w])/g);
    assert.equal(years, null, `${f}: ${years}`);
  }
});
test('no name on the deny-list appears in any shipped file', { skip: !process.env.VOYAGE_DENY && 'set VOYAGE_DENY to run' }, () => {
  const names = process.env.VOYAGE_DENY.split(',').map(s => s.trim()).filter(Boolean);
  for (const f of files) { const text = readFileSync(f, 'utf8'); for (const n of names) assert.doesNotMatch(text.replace(/curphey/gi, ''), new RegExp(`\\b${n}\\b`, 'i'), `${f}: ${n}`); }
});
