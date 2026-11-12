import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
// The parts of the site outside the game folder that must stay in step with it.
const here = dirname(fileURLToPath(import.meta.url)), root = join(here, '..', '..'), read = p => readFileSync(join(root, p), 'utf8');
test('the homepage is the game page, with absolute paths', () => {
  const page = read('pieces/voyage/index.html').replace('href="style.css"', 'href="/pieces/voyage/style.css"').replace('src="world.js"', 'src="/pieces/voyage/world.js"');
  assert.equal(read('index.html'), page, 'index.html is out of step with pieces/voyage/index.html');
});
test('the offline list names every file the game ships, and nothing that is missing', () => {
  const listed = [...read('sw.js').match(/const ASSETS = \[([^\]]*)\]/)[1].matchAll(/'([^']+)'/g)].map(m => m[1]), shipped = [];
  (function walk(d) { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (!/\.test\.mjs$|verify\.mjs$|index\.html$/.test(f)) shipped.push('/' + relative(root, p)); } })(here);
  for (const f of shipped) assert.ok(listed.includes(f), `${f} is not in the offline list in sw.js`);
  for (const f of listed) if (f !== '/') assert.ok(existsSync(join(root, f)), `${f} is in the offline list but does not exist`);
});
test('the app manifest points at icons that exist', () => {
  const m = JSON.parse(read('manifest.webmanifest')); assert.equal(m.start_url, '/'); assert.ok(m.icons.length >= 3);
  for (const i of m.icons) assert.ok(existsSync(join(root, i.src)), i.src);
});
