// Browser checks for the family game. Usage: PLAYWRIGHT_MODULE=... node pieces/voyage/verify.mjs [check ...]
// Serves the repository on localhost, drives the page with real taps, drags and keys, and exits non-zero on failure.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, dirname, normalize, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
// Playwright is not a dependency of this site: point PLAYWRIGHT_MODULE at an installed copy's index.mjs.
if (!process.env.PLAYWRIGHT_MODULE) { console.error('Set PLAYWRIGHT_MODULE to the path of playwright/index.mjs'); process.exit(2); }
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE));
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..'), out = process.env.VERIFY_OUT;
const types = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css' };
const server = http.createServer(async (req, res) => {
  let p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)); if (p.endsWith('/')) p += 'index.html';
  try { const body = await readFile(join(root, p)); res.writeHead(200, { 'content-type': types[extname(p)] ?? 'application/octet-stream' }); res.end(body); } catch { res.writeHead(404); res.end(); }
}).listen(0, '127.0.0.1');
await new Promise(r => server.once('listening', r));
const url = `http://127.0.0.1:${server.address().port}/pieces/${basename(dirname(fileURLToPath(import.meta.url)))}/`;
const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const errors = [];
async function open(options = {}, query = '?chapter=founders') {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...options }), page = await context.newPage();
  page.on('pageerror', e => errors.push(e.message)); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('request', r => { if (!r.url().startsWith('http://127.0.0.1')) errors.push(`external request ${r.url()}`); });
  await page.goto(url + query, { timeout: 120000 }); await page.waitForFunction(() => window.__voyage && document.querySelector('#loading').classList.contains('done'), null, { timeout: 120000 }); await page.waitForTimeout(1500);
  await page.evaluate(() => { window.__voyage.speed = 14; });
  return page;
}
const state = page => page.evaluate(() => { const v = window.__voyage; return { at: v.model.at, mechs: { ...v.model.mechs }, won: v.model.won, items: [...v.model.items], busy: v.busy }; });
const idle = async page => { await page.waitForFunction(() => !window.__voyage.busy, null, { timeout: 60000 }); await page.waitForTimeout(250); };
const tap = async (page, id) => { const [x, y] = await page.evaluate(id => window.__voyage.screenOf(id), id); await page.mouse.click(x, y); await page.waitForTimeout(150); await idle(page); };
const shot = async (page, name) => { if (out) await page.screenshot({ path: join(out, `${name}.png`) }); };

const checks = {
  async loads() {
    const page = await open();
    assert.equal(await page.getAttribute('meta[name=robots]', 'content'), 'noindex');
    const png = await page.screenshot(), distinct = new Set(png.subarray(2000, 60000)).size; assert.ok(distinct > 100, 'canvas is drawn');
    assert.match(await page.textContent('#status'), /\w/); await shot(page, 'desktop'); await page.context().close();
  },
  async 'founders-scene'() {
    for (const [name, viewport, extra] of [['desktop', { width: 1440, height: 900 }, {}], ['phone', { width: 390, height: 844 }, { hasTouch: true, isMobile: true, deviceScaleFactor: 2 }]]) {
      const page = await open({ viewport, ...extra }), pts = await page.evaluate(() => window.__voyage.frame);
      for (const [x, y] of pts) assert.ok(x >= 0 && x <= viewport.width && y >= 0 && y <= viewport.height, `${name}: point ${x.toFixed(0)},${y.toFixed(0)} off screen`);
      const span = Math.max(...pts.map(p => p[0])) - Math.min(...pts.map(p => p[0]));
      if (name === 'phone') assert.ok(span / viewport.width >= 0.85, `phone: island spans ${(span / viewport.width * 100).toFixed(0)}%`);
      const nodes = await page.evaluate(() => Object.keys(window.__voyage.model.data.nodes).map(id => window.__voyage.screenOf(id)));
      for (const [x, y] of nodes) assert.ok(x > 0 && x < viewport.width && y > 0 && y < viewport.height, `${name}: node off screen`);
      await shot(page, name); await page.context().close();
    }
  },
  async walk() {
    const page = await open();
    const far = await page.evaluate(() => window.__voyage.turn('garden', 1)); assert.equal(far, false, 'a tower cannot be turned from far away');
    await tap(page, 'cloister'); assert.equal((await state(page)).at, 'cloister', 'walks a solid path');
    // Not aligned: the bridge is elsewhere, so tapping where it would be does nothing.
    const where = await page.evaluate(() => window.__voyage.screenAt([-3, 0, -6])); await page.mouse.click(...where); await idle(page);
    assert.equal((await state(page)).at, 'cloister', 'cannot cross when the walkways do not meet');
    const lever = await page.evaluate(() => window.__voyage.leverOf('cloister')); await page.mouse.click(...lever); await idle(page);
    const s = await state(page); assert.equal(s.mechs.garden, 2, 'tapping the lever advances one state'); assert.equal(s.mechs.clock, 2, 'the clock tower is geared to it');
    await page.mouse.click(...lever); await idle(page);
    // Aligned: the arm end and the cloister's next tile are the same place on screen.
    const [a, b] = await page.evaluate(() => [window.__voyage.screenOf('bridge'), window.__voyage.screenAt([-3, 0, -6])]);
    assert.ok(Math.hypot(a[0] - b[0], a[1] - b[1]) < 1, 'walkways meet on screen');
    await tap(page, 'bridge'); assert.equal((await state(page)).at, 'bridge', 'crosses the apparent edge'); await shot(page, 'crossed');
    await page.context().close();
  },
  async controls() {
    const page = await open();
    await tap(page, 'cloister');
    // Drag the garden bridge a quarter turn: from pointing south to pointing west.
    const from = await page.evaluate(() => window.__voyage.screenAt([0, 3, 2.4])), to = await page.evaluate(() => window.__voyage.screenAt([-2.4, 3, 0.3]));
    await page.mouse.move(...from); await page.mouse.down();
    for (let i = 1; i <= 12; i++) { const t = i / 12, a = Math.PI / 2 * t, p = await page.evaluate(a => window.__voyage.screenAt([-Math.sin(a) * 2.4, 3, Math.cos(a) * 2.4]), a); await page.mouse.move(...p); await page.waitForTimeout(40); }
    await page.mouse.move(...to); await page.mouse.up(); await idle(page);
    assert.equal((await state(page)).mechs.garden, 2, 'dragging past half a step snaps forward');
    await page.context().close();
    // Keyboard only, with reduced motion: follow the hints through the menu to the end.
    const still = await open({ reducedMotion: 'reduce' });
    await still.evaluate(() => window.__voyage.go('cloister')); await idle(still);
    const before = await still.evaluate(() => { const v = window.__voyage; return v.turn('garden', 1) && v.mechs.garden.angle === v.mechs.garden.target && v.mechs.clock.angle === v.mechs.clock.target; });
    assert.ok(before, 'reduced motion: a mechanism changes state at once'); await still.evaluate(() => window.__voyage.restart());
    for (let i = 0; i < 40; i++) {
      const s = await state(still); if (s.won) break;
      const move = await still.evaluate(() => { const m = window.__voyage.model.hint(); if (m?.who) window.__voyage.switchTo(m.who); return m; });
      const selector = move.type === 'walk' ? `[data-go="${move.to}"]` : `#turns button[data-turn="${move.id}"] >> nth=${move.dir > 0 ? 0 : 1}`;
      await still.evaluate(() => { document.querySelector('#menu').open = true; document.querySelector('.keys').open = true; });
      await still.locator(selector).focus(); await still.keyboard.press('Enter'); await idle(still);
    }
    const end = await state(still); assert.ok(end.won, 'the chapter completes with the keyboard alone'); assert.ok(end.items.includes('book'));
    assert.equal(await still.isVisible('#finish'), true); await shot(still, 'complete'); await still.context().close();
  },
  async sound() {
    const page = await open();
    assert.equal(await page.getAttribute('#sound', 'aria-pressed'), 'false', 'silent on load');
    await page.evaluate(() => { document.querySelector('#menu').open = true; }); await page.click('#sound');
    assert.equal(await page.getAttribute('#sound', 'aria-pressed'), 'true');
    await page.reload(); await page.waitForFunction(() => window.__voyage);
    assert.match(await page.textContent('#sound'), /Sound on/, 'the choice survives a reload'); await page.context().close();
  }
};
checks.pier = async () => {
  for (const [name, viewport, extra] of [['pier-desktop', { width: 1440, height: 900 }, {}], ['pier-phone', { width: 390, height: 844 }, { hasTouch: true, isMobile: true, deviceScaleFactor: 2 }]]) {
    const page = await open({ viewport, ...extra }, '?chapter=pier'), pts = await page.evaluate(() => window.__voyage.frame);
    for (const [x, y] of pts) assert.ok(x >= 0 && x <= viewport.width && y >= 0 && y <= viewport.height, `${name}: point ${x.toFixed(0)},${y.toFixed(0)} off screen`);
    await shot(page, name); await page.context().close();
  }
  const page = await open({}, '?chapter=pier');
  assert.match(await page.title(), /Brighton/);
  // Tapping the other traveller makes them the one who moves.
  const other = await page.evaluate(() => window.__voyage.walkerOf('two')); await page.mouse.click(...other); await page.waitForTimeout(200);
  assert.equal(await page.evaluate(() => window.__voyage.model.active), 'two', 'tap a traveller to switch');
  assert.equal(await page.evaluate(() => window.__voyage.turn('wheel', 1)), false, 'the wheel has no lever of its own');
  await page.evaluate(() => window.__voyage.restart());
  let sawJoin = false;
  for (let i = 0; i < 60; i++) {
    const s = await state(page); if (s.won) break;
    const move = await page.evaluate(() => { const m = window.__voyage.model.hint(); if (m?.who) window.__voyage.switchTo(m.who); return m; });
    if (move.type === 'walk' && /^car/.test(move.to) && ['gate', 'kiosk'].includes(await page.evaluate(() => window.__voyage.model.at))) {
      const [a, b] = await page.evaluate(to => [window.__voyage.screenOf(to), window.__voyage.screenAt([-5, 0, 0])], move.to);
      assert.ok(Math.hypot(a[0] - b[0], a[1] - b[1]) < 1, 'the gondola sits where the next plank would be'); sawJoin = true;
    }
    // The gondola crossing is made with a real tap; other walks go through the same code path without one,
    // because a tap on a spot where the other traveller stands selects that traveller instead.
    if (move.type === 'walk' && /^car/.test(move.to)) await tap(page, move.to); else if (move.type === 'walk') await page.evaluate(to => window.__voyage.go(to), move.to); else await page.evaluate(m => m.type === 'switch' ? window.__voyage.switchTo() : window.__voyage.turn(m.id, m.dir), move);
    await idle(page);
  }
  const end = await page.evaluate(() => ({ won: window.__voyage.model.won, where: window.__voyage.model.where }));
  assert.ok(sawJoin, 'the gondola crossing was used'); assert.ok(end.won, 'the two travellers meet'); assert.deepEqual(end.where, { one: 'plaza', two: 'plaza' });
  assert.equal(await page.isVisible('#finish'), true); await shot(page, 'pier-met'); await page.context().close();
};
checks.passage = async () => {
  const page = await open({}, '?chapter=founders');
  await page.evaluate(() => { window.__voyage.speed = 6; window.__voyage.solve(); });
  assert.equal(await page.isVisible('#next'), true, 'the finish card offers the next chapter');
  await page.click('#next'); await page.waitForTimeout(300);
  assert.equal(await page.evaluate(() => window.__voyage.travelling), 'leave');
  assert.match(await page.textContent('#passage'), /sea/);
  await page.waitForFunction(() => Number(getComputedStyle(document.querySelector('#passage')).opacity) > 0.9, null, { timeout: 90000, polling: 100 });
  await shot(page, 'passage');
  await page.waitForURL(/chapter=pier&arrive=1/, { timeout: 120000 }); await page.waitForFunction(() => window.__voyage, null, { timeout: 120000 });
  assert.equal(await page.evaluate(() => window.__voyage.travelling), 'arrive', 'the next chapter clears out of the mist'); await page.evaluate(() => { window.__voyage.speed = 14; });
  await page.waitForFunction(() => window.__voyage.travelling === null, null, { timeout: 120000 }); await shot(page, 'arrived');
  assert.match(await page.title(), /Brighton/); assert.match(await page.textContent('#goal'), /pier head/); await page.context().close();
  // Reduced motion: no animation, straight to the next chapter.
  const still = await open({ reducedMotion: 'reduce' }, '?chapter=founders');
  await still.evaluate(() => window.__voyage.solve()); await still.click('#next');
  await still.waitForURL(/chapter=pier/, { timeout: 30000 }); await still.waitForFunction(() => window.__voyage && window.__voyage.travelling === null, null, { timeout: 60000 }); await still.context().close();
};
checks.trinidad = async () => {
  for (const [name, viewport, extra] of [['trinidad-desktop', { width: 1440, height: 900 }, {}], ['trinidad-phone', { width: 390, height: 844 }, { hasTouch: true, isMobile: true, deviceScaleFactor: 2 }]]) {
    const page = await open({ viewport, ...extra }, '?chapter=trinidad'), pts = await page.evaluate(() => window.__voyage.frame);
    for (const [x, y] of pts) assert.ok(x >= 0 && x <= viewport.width && y >= 0 && y <= viewport.height, `${name}: point ${x.toFixed(0)},${y.toFixed(0)} off screen`);
    await shot(page, name); await page.context().close();
  }
  const page = await open({}, '?chapter=trinidad'); let sawJoin = false;
  assert.match(await page.title(), /Curphey Family Web Site/); assert.match(await page.textContent('#who'), /Cara/); assert.match(await page.textContent('#goal'), /oars and the rope/);
  for (let i = 0; i < 60; i++) {
    const s = await state(page); if (s.won) break;
    const move = await page.evaluate(() => { const m = window.__voyage.model.hint(); if (m?.who) window.__voyage.switchTo(m.who); return m; });
    if (move.type === 'walk' && move.to === 'plank2' && ['beach', 'fork', 'grove'].includes(s.at)) {
      const [a, b] = await page.evaluate(() => [window.__voyage.screenOf('plank2'), window.__voyage.screenAt([1, 0, -1])]);
      assert.ok(Math.hypot(a[0] - b[0], a[1] - b[1]) < 1, 'the stack plank lies where the boardwalk bends'); sawJoin = true; await shot(page, 'trinidad-seam');
    }
    if (move.type === 'walk') await tap(page, move.to); else await page.evaluate(m => window.__voyage.turn(m.id, m.dir), move);
    await idle(page);
  }
  const end = await state(page); assert.ok(sawJoin, 'the stack crossing was used'); assert.ok(end.won, 'she reaches the boat'); assert.ok(end.items.includes('oars') && end.items.includes('rope'));
  await shot(page, 'trinidad-away'); await page.context().close();
};
// Load a scene on desktop and phone, then play it to the end from the solver's moves.
async function playScene(id, { title, goal, players, seam }) {
  for (const [name, viewport, extra] of [[`${id}-desktop`, { width: 1440, height: 900 }, {}], [`${id}-phone`, { width: 390, height: 844 }, { hasTouch: true, isMobile: true, deviceScaleFactor: 2 }]]) {
    const page = await open({ viewport, ...extra }, `?chapter=${id}`), pts = await page.evaluate(() => window.__voyage.frame);
    for (const [x, y] of pts) assert.ok(x >= 0 && x <= viewport.width && y >= 0 && y <= viewport.height, `${name}: point ${x.toFixed(0)},${y.toFixed(0)} off screen`);
    await shot(page, name); await page.context().close();
  }
  const page = await open({}, `?chapter=${id}`); let sawJoin = false;
  assert.match(await page.title(), title); assert.match(await page.textContent('#goal'), goal);
  assert.equal(await page.evaluate(() => window.__voyage.model.travellers.length), players);
  for (let i = 0; i < 90; i++) {
    const s = await state(page); if (s.won) break;
    const move = await page.evaluate(() => { const m = window.__voyage.model.hint(); if (m?.who) window.__voyage.switchTo(m.who); return m; });
    if (move.type === 'walk' && seam) { // is this walk about to use the perspective crossing?
      const info = await page.evaluate(([to, from, onto]) => { const v = window.__voyage, p = v.model.path(to) ?? []; const k = p.indexOf(from); return k >= 0 && p[k + 1] === onto; }, [move.to, seam.from, seam.onto]);
      if (info) { const [a, b] = await page.evaluate(([onto, at]) => [window.__voyage.screenOf(onto), window.__voyage.screenAt(at)], [seam.onto, seam.at]); assert.ok(Math.hypot(a[0] - b[0], a[1] - b[1]) < 1, 'the two pieces meet on screen'); sawJoin = true; }
    }
    await page.evaluate(m => m.type === 'walk' ? window.__voyage.go(m.to) : window.__voyage.turn(m.id, m.dir), move); await idle(page);
  }
  const end = await page.evaluate(() => ({ won: window.__voyage.model.won, who: window.__voyage.model.travellers }));
  if (seam) assert.ok(sawJoin, 'the perspective crossing was used'); assert.ok(end.won, 'everyone gets through');
  await shot(page, `${id}-done`); await page.context().close();
}
checks.bridge = () => playScene('bridge', { title: /Mill Valley/, goal: /Mark, Cara and Jack/, players: 3, seam: { from: 'point', onto: 'boom', at: [-15, 0, -5] } });
checks.return = () => playScene('return', { title: /Mill Valley, by the Bay/, goal: /all five/, players: 5, seam: { from: 'pier', onto: 'boom', at: [7, 0, 0] } });
checks.monterey = () => playScene('monterey', { title: /Monterey/, goal: /all four/, players: 4, seam: { from: 'mezz', onto: 'tail', at: [2, 3, 3] } });
checks.needle = () => playScene('needle', { title: /Seattle/, goal: /all five/, players: 5, seam: { from: 'skyEnd', onto: 'rim', at: [-8, 5, -5] } });
checks.departure = async () => {
  const page = await open({}, '?chapter=departure');
  assert.match(await page.title(), /Brighton, and Away/);
  for (let i = 0; i < 12; i++) { const s = await state(page); if (s.won) break; const move = await page.evaluate(() => { const m = window.__voyage.model.hint(); if (m?.who) window.__voyage.switchTo(m.who); return m; }); await page.evaluate(m => m.type === 'switch' ? window.__voyage.switchTo() : window.__voyage.go(m.to), move); await page.waitForFunction(() => !window.__voyage.walking, null, { timeout: 60000 }); await page.waitForTimeout(200); }
  assert.ok((await state(page)).won, 'both travellers are aboard');
  const before = await page.evaluate(() => window.__voyage.screenOf('aboard'));
  await page.waitForFunction(() => !document.querySelector('#finish').hidden, null, { timeout: 120000 });
  const after = await page.evaluate(() => ({ at: window.__voyage.screenOf('aboard'), zoom: window.__voyage.zoom }));
  assert.ok(Math.hypot(after.at[0] - before[0], after.at[1] - before[1]) > 40, 'she has sailed from the pier'); assert.ok(after.zoom < 0.95, 'the camera has pulled back');
  assert.match(await page.textContent('#finish'), /Voyage complete/i); assert.doesNotMatch(await page.textContent('main'), /\d{4}/, 'no year on screen');
  await shot(page, 'departure-away'); await page.context().close();
};
checks.eggs = async () => {
  const ids = ['trinidad', 'founders', 'pier', 'bridge', 'monterey', 'needle', 'return', 'departure'];
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } }), page = await context.newPage(); // one context, so finds add up
  page.on('pageerror', e => errors.push(e.message));
  for (const [n, id] of ids.entries()) {
    await page.goto(`${url}?chapter=${id}`, { timeout: 120000 }); await page.waitForFunction(() => window.__voyage && document.querySelector('#loading').classList.contains('done'), null, { timeout: 120000 }); await page.waitForTimeout(1200);
    const marg = await page.evaluate(() => window.__voyage.margAt()); await page.mouse.click(...marg); await page.waitForTimeout(300);
    assert.match(await page.textContent('#status'), /Marg/, `${id}: Marg can be found and tapped`);
    const at = await page.evaluate(() => window.__voyage.eggAt()); await page.mouse.click(...at); await page.waitForTimeout(300);
    assert.equal(await page.isVisible('#term'), true, `${id}: the cursor can be found and tapped`);
    const text = await page.textContent('#term-out'); assert.match(text, /MESS WITH THE BEST, DIE LIKE THE REST\./); assert.match(text, new RegExp(`\\(${n + 1}/8\\)`), `${id}: finds are counted`);
    if (id === 'bridge') {
      await page.fill('#term-in', 'whoami'); await page.keyboard.press('Enter'); assert.match(await page.textContent('#term-out'), /007\nmark\. computer hacker/);
      await page.fill('#term-in', 'matrix'); await page.keyboard.press('Enter'); assert.match(await page.textContent('#term-out'), /access denied: 4\/8/);
      await page.fill('#term-in', 'root'); await page.keyboard.press('Enter'); await page.keyboard.press('Escape'); assert.equal(await page.isVisible('#term'), false);
      assert.match(await page.textContent('#who'), /Mark · 007/); assert.equal(await page.evaluate(() => window.__voyage.turn('derrick', 1)), true, 'with root, Mark works the derrick from the approach');
      await idle(page); assert.match(await page.textContent('#status'), /hacks/);
    }
    if (id === 'departure') {
      await page.keyboard.press('Escape'); await page.fill('#term-in', '').catch(() => {});
      await page.keyboard.type('hack'); assert.equal(await page.isVisible('#term'), true, 'typing hack opens the terminal');
      await page.fill('#term-in', 'matrix'); await page.keyboard.press('Enter'); assert.match(await page.textContent('#term-out'), /wake up/); assert.equal(await page.evaluate(() => document.body.classList.contains('matrix')), true);
      await shot(page, 'matrix'); await page.fill('#term-in', 'matrix'); await page.keyboard.press('Enter'); await page.keyboard.press('Escape');
      const flag = await page.evaluate(() => window.__voyage.flagAt()); await page.mouse.click(...flag); await page.waitForTimeout(300); assert.match(await page.textContent('#status'), /black flag/); await shot(page, 'flag');
    }
  }
  await context.close();
};
const wanted = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(checks); let failed = 0;
for (const name of wanted) {
  try { await checks[name](); console.log(`ok   ${name}`); } catch (e) { failed++; console.log(`FAIL ${name}: ${e.message}`); }
}
if (errors.length) { failed++; console.log(`FAIL console: ${[...new Set(errors)].slice(0, 5).join(' | ')}`); }
await browser.close(); server.close(); process.exit(failed ? 1 : 0);
