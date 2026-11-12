import test from 'node:test';
import assert from 'node:assert/strict';
import { Chapter } from './chapter.mjs';
import { aligned, lift, project } from './project.mjs';
import { founders } from './chapters/founders.mjs';
import { pier } from './chapters/pier.mjs';
import { chapters } from './chapters/index.mjs';
import { palettes, order, mix } from './palette.mjs';
import { createSave } from './save.mjs';
import { createSound } from './sound.mjs';
import { status, hintText } from './text.mjs';
import { leaving, arriving, LEAVE, HOLD, ARRIVE } from './passage.mjs';

const combos = data => {
  let out = [{}];
  for (const [id, m] of Object.entries(data.mechs)) out = out.flatMap(o => Array.from({ length: m.states ?? 4 }, (_, s) => ({ ...o, [id]: s })));
  return out;
};
// The part of an edge's condition that is about where things are, leaving out mechanisms with no arm (such as fog).
const spatial = (data, when = {}) => Object.fromEntries(Object.entries(when).filter(([id]) => data.mechs[id].length > 0 || data.mechs[id].track));

test('points one camera-diagonal apart share a screen position', () => {
  const a = project([-7, 0, -4]), b = project([-3, 4, 0]);
  assert.ok(Math.abs(a[0] - b[0]) < 1e-9 && Math.abs(a[1] - b[1]) < 1e-9);
  assert.equal(lift([-8, 0, -4], [-3, 4, 0], [1, 0, 0]), 4);
  assert.equal(aligned([-8, 0, -4], [3, 4, 0], [1, 0, 0]), false);
});

for (const data of Object.values(chapters)) test(`${data.id}: apparent edges join on screen exactly when their condition holds`, () => {
  const model = new Chapter(data); let apparent = 0;
  for (const mechs of combos(data)) {
    model.mechs = mechs;
    for (const e of data.edges) {
      const on = model.holds(spatial(data, e.when));
      if (e.kind === 'apparent') {
        apparent++;
        assert.equal(aligned(model.pos(e.a), model.pos(e.b), e.step), on, `${e.a}-${e.b} ${JSON.stringify(mechs)}`);
        // The nearer, higher piece must be on the camera side, so no end face shows at the seam.
        if (on) { assert.ok(lift(model.pos(e.a), model.pos(e.b), e.step) > 0); assert.ok(e.step[0] + e.step[2] > 0); }
      } else if (Object.keys(spatial(data, e.when)).length) {
        const d = model.pos(e.a).map((v, i) => Math.abs(v - model.pos(e.b)[i]));
        assert.equal(d[0] + d[1] + d[2] === 1, on, `${e.a}-${e.b} ${JSON.stringify(mechs)}`);
      }
    }
  }
  if (data.puzzle !== false) assert.ok(apparent > 0);
});

for (const data of Object.values(chapters)) test(`${data.id}: no reachable state is a dead end, and status text gives no move away`, () => {
  const start = new Chapter(data), queue = [start], index = new Map([[start.key(), 0]]), back = [[]], events = ['start', 'blocked', 'turned', 'carried', 'geared', 'far', 'switched', 'goal-empty', 'arrived', ...Object.keys(data.text)];
  for (let i = 0; i < queue.length; i++) {
    const s = queue[i];
    if (i % 7 === 0) for (const event of events) { const line = status(s, event); assert.doesNotMatch(line, /\d|clockwise|\b(north|south|east|west)\b|\bturn (it|the)\b/i, line); }
    if (s.won) continue;
    for (const m of s.moves()) { const n = s.clone(); if (!n.apply(m)) continue; const k = n.key(); if (!index.has(k)) { index.set(k, queue.length); queue.push(n); back.push([]); } back[index.get(k)].push(i); }
  }
  const ok = new Set(queue.map((s, i) => (s.won ? i : -1)).filter(i => i >= 0)), todo = [...ok];
  while (todo.length) for (const p of back[todo.pop()]) if (!ok.has(p)) { ok.add(p); todo.push(p); }
  assert.equal(ok.size, queue.length, `${queue.length - ok.size} dead ends`); if (data.puzzle !== false) assert.ok(queue.length > 50); assert.ok(start.hint());
});

test('the pier: both travellers are needed, the wheel is driven only by the carousel, and they meet', () => {
  const model = new Chapter(pier), movers = new Set(); let moves = 0, crossed = false;
  assert.equal(model.canTurn('wheel'), false); assert.deepEqual(model.travellers, ['one', 'two']);
  while (!model.won) {
    const move = model.hint(); assert.ok(move);
    model.active = move.who;
    if (move.type === 'walk') { movers.add(move.who ?? model.active); const p = model.path(move.to); for (let i = 1; i < p.length; i++) if (model.edge(p[i - 1], p[i]).kind === 'apparent') crossed = true; }
    if (move.type === 'turn') { const w = model.mechs.wheel; model.apply(move); assert.notEqual(model.mechs.wheel, w, 'the wheel turns with the carousel'); } else model.apply(move);
    assert.ok(++moves < 60);
  }
  assert.equal(movers.size, 2); assert.ok(crossed, 'the gondola crossing is on the solution'); assert.ok(moves >= 15, `shortest solution is ${moves} moves`);
  assert.equal(model.where.one, 'plaza'); assert.equal(model.where.two, 'plaza');
});

test('trinidad: the pans drive one another, and the boat needs the oars and real planning', () => {
  const model = new Chapter(chapters.trinidad); let moves = 0, crossed = false;
  model.arrive('westShore'); model.turn('channel', 1); assert.deepEqual(model.mechs, { channel: 3, stack: 2, jetty: 1 }, 'the channel pan drives the stack pan only');
  model.reset(); model.at = 'grove'; model.turn('jetty', 1); assert.deepEqual(model.mechs, { channel: 2, stack: 2, jetty: 2 }, 'the jetty pan drives the stack pan');
  model.reset();
  while (!model.won) { const move = model.hint(); if (move.type === 'walk') { const p = model.path(move.to); for (let i = 1; i < p.length; i++) if (model.edge(p[i - 1], p[i]).kind === 'apparent') crossed = true; } model.apply(move); assert.ok(++moves < 60); }
  assert.ok(crossed, 'the stack crossing is on the solution'); assert.ok(model.items.has('oars') && model.items.has('rope')); assert.ok(moves >= 15, `shortest solution is ${moves} moves`);
});

test('the passage: mist rises, a line shows, then the next chapter clears; reduced motion skips it', () => {
  assert.equal(leaving(0).veil, 0); assert.equal(leaving(LEAVE).veil, 1); assert.equal(leaving(0).done, false); assert.ok(leaving(LEAVE + HOLD).done);
  let last = -1; for (let t = 0; t <= LEAVE + HOLD; t += 0.1) { const v = leaving(t).veil; assert.ok(v >= last); last = v; }
  assert.ok(leaving(LEAVE + 1).text > 0.9); assert.equal(leaving(0).text, 0); assert.ok(leaving(LEAVE + HOLD).text < 0.01);
  assert.equal(arriving(0).veil, 1); assert.equal(arriving(ARRIVE).veil, 0); assert.ok(arriving(ARRIVE).done);
  assert.deepEqual(leaving(0, true), { veil: 1, glide: 1, mix: 1, text: 0, done: true }); assert.ok(arriving(0, true).done);
});

test('mill valley: nobody walks where they cannot see, and all three players are needed', () => {
  const model = new Chapter(chapters.bridge);
  assert.equal(model.path('mid'), null, 'the deck is lost in low fog'); assert.equal(model.path('hatch'), null, 'the hatch is too small for an adult');
  model.select('three'); assert.ok(model.arrive('hatch')); assert.ok(model.turn('derrick', 1)); assert.equal(model.path('boom'), null, 'the boom is not for children');
  for (const [id, players] of [['bridge', 3]]) {
    const g = new Chapter(chapters[id]), movers = new Set(); let moves = 0, crossed = false; assert.equal(g.travellers.length, players);
    while (!g.won) { const move = g.hint(); assert.ok(move); g.active = move.who; if (move.type === 'walk') { movers.add(move.who); const p = g.path(move.to); for (let i = 1; i < p.length; i++) if (g.edge(p[i - 1], p[i]).kind === 'apparent') crossed = true; } g.apply(move); assert.ok(++moves < 80); }
    assert.equal(movers.size, players, `${id}: everyone has to move`); assert.ok(crossed); assert.ok(moves >= (players === 3 ? 9 : 11), `${id}: shortest solution is ${moves} moves`);
  }
  assert.match(hintText(model, { type: 'turn', who: 'three', id: 'fog', dir: 1 }), /Jack: sound the foghorn\.$/);
});

test('seattle: five players, the lift worked from below, the saucer geared to it, and children by the skybridge', () => {
  const model = new Chapter(chapters.needle), movers = new Set(); let moves = 0, crossed = false;
  assert.equal(model.travellers.length, 5); model.arrive('car'); assert.equal(model.canTurn('lift'), false, 'not from inside');
  model.select('two'); assert.ok(model.turn('lift', 1)); assert.deepEqual(model.pos('car'), [1, 5, 0]); assert.equal(model.mechs.saucer, 2, 'the saucer turns with the lift'); assert.equal(model.where.one, 'car', 'the rider is carried');
  model.turn('lift', 1); model.select('one'); assert.equal(model.path('crown'), null, 'the top door needs the plate at the mid ring');
  model.reset();
  while (!model.won) { const move = model.hint(); assert.ok(move); model.active = move.who; if (move.type === 'walk') { movers.add(move.who); const p = model.path(move.to); for (let i = 1; i < p.length; i++) if (model.edge(p[i - 1], p[i]).kind === 'apparent') crossed = true; } model.apply(move); assert.ok(++moves < 80); }
  assert.equal(movers.size, 5, 'everyone has to move'); assert.ok(crossed, 'the skybridge crossing is on the solution'); assert.ok(model.items.has('sluice')); assert.ok(moves >= 12, `shortest solution is ${moves} moves`);
});

test('monterey: four players; the whale, the cage and the sea door need adults and children both', () => {
  const model = new Chapter(chapters.monterey), movers = new Set(); let moves = 0, crossed = false;
  assert.equal(model.travellers.length, 4); model.arrive('hall'); assert.equal(model.path('jellies'), null, 'the crawl tunnel is too small for an adult'); assert.equal(model.path('deck'), null, 'the sea door is shut');
  while (!model.won) { const move = model.hint(); assert.ok(move); model.active = move.who; if (move.type === 'walk') { movers.add(move.who); const p = model.path(move.to); for (let i = 1; i < p.length; i++) if (model.edge(p[i - 1], p[i]).kind === 'apparent') crossed = true; } model.apply(move); assert.ok(++moves < 80); }
  assert.equal(movers.size, 4, 'everyone has to move'); assert.ok(crossed, 'the walk onto the whale is on the solution'); assert.ok(moves >= 11, `shortest solution is ${moves} moves`);
});

test('the bay: only children sail, the dinghies have so many seats, and all five are needed', () => {
  const model = new Chapter(chapters.return), movers = new Set(); let moves = 0, crossed = false, sails = 0;
  assert.equal(model.path('pram'), null, 'an adult does not fit the dinghy'); model.select('three'); model.arrive('pram'); model.select('four'); model.arrive('pram');
  model.select('five'); assert.equal(model.path('pram'), null, 'the little dinghy seats two'); model.select('one'); assert.equal(model.canTurn('pram'), false);
  model.select('three'); assert.ok(model.turn('pram', 1)); assert.equal(model.where.four, 'pram', 'the passenger is carried'); assert.deepEqual(model.pos('pram'), [1, 0, 8]);
  model.reset();
  while (!model.won) { const move = model.hint(); assert.ok(move); model.active = move.who; if (move.type === 'turn' && move.id !== 'davit') sails++; if (move.type === 'walk') { movers.add(move.who); const p = model.path(move.to); for (let i = 1; i < p.length; i++) if (model.edge(p[i - 1], p[i]).kind === 'apparent') crossed = true; } model.apply(move); assert.ok(++moves < 90); }
  assert.equal(movers.size, 5); assert.ok(crossed, 'the davit crossing is on the solution'); assert.ok(sails >= 4, 'the little dinghy has to come back for the third child'); assert.ok(moves >= 16, `shortest solution is ${moves} moves`);
});

test('root access: Mark, and only Mark, can work a lever from anywhere; every scene hides a cursor and Marg', () => {
  const model = new Chapter(chapters.bridge); assert.equal(model.canTurn('derrick'), false);
  model.root = true; assert.ok(model.canTurn('derrick'), 'Mark hacks the derrick without the hatch'); assert.ok(model.clone().root);
  model.select('two'); assert.equal(model.canTurn('derrick'), false, 'not Cara');
  const bay = new Chapter(chapters.return); bay.root = true; assert.equal(bay.canTurn('pram'), false, 'a dinghy has no lever to hack');
  for (const data of Object.values(chapters)) { assert.equal(data.egg?.length, 3, `${data.id} has a cursor`); assert.equal(data.marg?.length, 3, `${data.id} has Marg`); }
});

test('the last scene needs no solving', () => {
  const model = new Chapter(chapters.departure); let moves = 0; while (!model.won) { model.apply(model.hint()); moves++; } assert.ok(moves <= 4, `${moves} moves`);
});

test('pier plates: the barrier and the wheel gate open only while the other traveller stands on them', () => {
  const model = new Chapter(pier); model.mechs = { carousel: 3, wheel: 0 }; model.where = { one: 'kiosk', two: 'skelter' };
  assert.equal(model.path('car2'), null, 'barrier down'); model.where.two = 'skelterTop'; assert.ok(model.path('car2'), 'barrier up');
  model.arrive('car2'); assert.equal(model.canTurn('wheel'), false, 'a rider cannot turn the wheel');
  model.mechs = { carousel: 0, wheel: 3 }; model.items.add('key'); model.where.two = 'skelter';
  assert.deepEqual(model.pos('car2'), [3, 2, 5]); assert.equal(model.path('plaza'), null, 'gate shut');
  model.where.two = 'seaside'; assert.ok(model.arrive('plaza')); assert.equal(model.won, false);
});

test('the pier needs both carousel steps', () => {
  const model = new Chapter(pier), used = new Set();
  while (!model.won) { const move = model.hint(); if (move.type === 'walk' && /^step/.test(move.to)) used.add(move.to); model.apply(move); }
  assert.equal(used.size, 2);
});

test("Founder's: solvable, needs both illusions, and every reachable state has a hint", () => {
  const model = new Chapter(founders), used = new Set(); let moves = 0;
  while (!model.won) {
    const move = model.hint(); assert.ok(move, 'hint available');
    if (move.type === 'walk') { const p = model.path(move.to); for (let i = 1; i < p.length; i++) { const e = model.edge(p[i - 1], p[i]); if (e.kind === 'apparent') used.add(`${e.a}-${e.b}`); } }
    model.apply(move); assert.ok(++moves < 40);
  }
  assert.equal(used.size, 2);
  assert.ok(model.items.has('book'));
});

test('the belfry does not complete the chapter without the book', () => {
  const model = new Chapter(founders);
  model.mechs = { garden: 2, clock: 0 }; model.at = 'roof';
  model.arrive('belfry'); assert.equal(model.at, 'belfry'); assert.equal(model.won, false);
});

test('towers are worked by hand, gears link them, and the book needs the key', () => {
  const model = new Chapter(founders);
  assert.equal(model.canTurn('garden'), false, 'not from the gate'); assert.equal(model.turn('garden', 1), false);
  model.arrive('cloister'); assert.ok(model.canTurn('garden')); assert.equal(model.canTurn('clock'), false);
  model.turn('garden', 1); assert.deepEqual(model.mechs, { garden: 2, clock: 2 }, 'the clock is geared to the lantern');
  model.turn('garden', 1); model.arrive('bridge'); assert.ok(model.riding('garden')); model.turn('garden', 1); model.arrive('balcony');
  assert.equal(model.at, 'balcony'); assert.equal(model.items.has('book'), false, 'the library is locked without the key');
  assert.ok(model.canTurn('clock')); model.turn('clock', -1); assert.deepEqual(model.mechs, { garden: 0, clock: 3 }, 'the lever by the library turns the clock alone');
});

test('the chapter takes real work: a long shortest solution with a return trip', () => {
  const model = new Chapter(founders), visits = []; let moves = 0;
  while (!model.won) { const move = model.hint(); model.apply(move); moves++; if (move.type === 'walk') visits.push(move.to); }
  assert.ok(moves >= 14, `shortest solution is ${moves} moves`);
  assert.ok(visits.indexOf('roofEnd') < visits.indexOf('balcony') && visits.at(-1) === 'belfry', 'out to the roof for the key, back to the library, then out again to the clock');
});

test('walking an apparent edge reports its step and lift in both directions', () => {
  const model = new Chapter(founders); model.mechs.garden = 3;
  assert.deepEqual(model.crossing('cloister', 'bridge'), { step: [0, 0, 1], lift: 3 });
  assert.deepEqual(model.crossing('bridge', 'cloister'), { step: [0, 0, -1], lift: -3 });
  assert.equal(model.crossing('gate', 'cloister'), null);
});

test('hint text names a move', () => { const m = new Chapter(founders); assert.match(hintText(m, m.hint()), /^(Walk to|Turn) /); assert.equal(hintText(m, { type: 'switch' }), 'Switch to the other traveller.'); assert.match(hintText(new Chapter(pier), new Chapter(pier).hint()), /^(Mark|Cara): (walk|turn) /); });

test('seven palettes; mixing returns the endpoints at 0 and 1', () => {
  assert.equal(order.length, 7);
  for (const id of order) assert.ok(palettes[id], id);
  assert.deepEqual(mix(palettes.trinidad, palettes.founders, 0), palettes.trinidad);
  assert.deepEqual(mix(palettes.trinidad, palettes.founders, 1), palettes.founders);
  const mid = mix(palettes.trinidad, palettes.founders, 0.5);
  assert.match(mid.skyTop, /^#[0-9a-f]{6}$/); assert.equal(mid.sunDir[0], 106.5);
});

test('saving round-trips and survives broken storage', () => {
  const map = new Map(), ok = createSave({ getItem: k => map.get(k) ?? null, setItem: (k, v) => map.set(k, v) });
  assert.deepEqual(ok.load(), { furthest: 1, done: [], sound: false, eggs: [], root: false, matrix: false, cards: {} });
  ok.store({ furthest: 4, sound: true });
  assert.equal(ok.load().furthest, 4); assert.equal(ok.load().sound, true);
  const broken = createSave({ getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } });
  assert.deepEqual(broken.load(), { furthest: 1, done: [], sound: false, eggs: [], root: false, matrix: false, cards: {} });
  assert.equal(broken.store({ furthest: 3 }).furthest, 3);
});

test('sound: silent until enabled, a note per step, a chord on completion', () => {
  let contexts = 0, oscillators = 0;
  const param = () => ({ setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, setTargetAtTime() {} });
  const node = () => new Proxy({}, { get: (t, k) => k === 'connect' || k === 'start' || k === 'stop' ? () => {} : (t[k] ??= param()), set: (t, k, v) => (t[k] = v, true) });
  class Ctx {
    constructor() { contexts++; this.currentTime = 0; this.sampleRate = 100; this.state = 'running'; this.destination = node(); }
    createOscillator() { oscillators++; return node(); }
    createGain() { return node(); } createBiquadFilter() { return node(); } createDelay() { return node(); } createBufferSource() { return node(); }
    createBuffer(c, n) { return { getChannelData: () => new Float32Array(n) }; }
    resume() { this.state = 'running'; } suspend() { this.state = 'suspended'; }
  }
  const sound = createSound({ AudioContextCtor: Ctx, scale: founders.scale });
  sound.note(1); sound.chord();
  assert.equal(contexts, 0); assert.equal(sound.enabled, false);
  sound.enable(); assert.equal(contexts, 1);
  const base = oscillators; sound.note(1); assert.equal(oscillators - base, 2);
  const before = oscillators; sound.chord(); assert.equal(oscillators - before, 10);
  sound.disable(); const off = oscillators; sound.note(2); assert.equal(oscillators, off);
});
