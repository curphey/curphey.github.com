import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
// The browser scripts are not loaded by the other unit tests, so a broken edit to one of them would only show up
// minutes later as every page failing to load. This parses each of them.
const root = dirname(fileURLToPath(import.meta.url)), files = [];
(function walk(d) { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (/\.m?js$/.test(f)) files.push(p); } })(root);
test('every script parses', () => {
  for (const f of files) { try { execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' }); } catch (e) { assert.fail(`${f}\n${e.stderr}`); } }
  assert.ok(files.length > 20);
});
