import * as T from '../tower/vendor/three.js';
import { Chapter } from './chapter.mjs';
import { chapters } from './chapters/index.mjs';
import { scenes } from './chapters/scenes.js';
import { createKit } from './render/kit.js';
import { createWater, createSkyEnvironment } from './render/water.js';
import { createPipeline } from './render/pipeline.js';
import { createWalker } from './walker.js';
import { createSound } from './sound.mjs';
import { createSave } from './save.mjs';
import { palettes } from './palette.mjs';
import { status, hintText } from './text.mjs';
import { leaving, arriving } from './passage.mjs';
import { people, listNames } from './people.mjs';
import { createCursor, createMarg } from './eggs.js';
import { createTerminal } from './terminal.js';
const $ = s => document.querySelector(s), canvas = $('#view'), reduced = matchMedia('(prefers-reduced-motion: reduce)');
const params = new URLSearchParams(location.search);
let renderer;
try { renderer = new T.WebGLRenderer({ canvas, antialias: false, powerPreference: 'high-performance' }); }
catch (e) { $('#loading').textContent = 'This little world needs a browser with WebGL.'; throw e; }
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFSoftShadowMap; renderer.toneMapping = T.NoToneMapping;

const built = Object.values(chapters).filter(c => scenes[c.id]);
const data = built.find(c => c.id === params.get('chapter')) ?? built[0], model = new Chapter(data), palette = palettes[data.palette];
const scene = new T.Scene(), DIST = 70, TOWARD = new T.Vector3(1, 1, 1).normalize();
const RIGHT = new T.Vector3(1, 0, -1).normalize(), UP = new T.Vector3(-1, 2, -1).normalize();
const camera = new T.OrthographicCamera(-20, 20, 12, -12, 0.1, 300), focus = new T.Vector3();
const sun = new T.DirectionalLight('#fff', 1), fill = new T.HemisphereLight('#fff', '#fff', 0.3);
const kit = createKit(), view = scenes[data.id](kit, data); scene.add(view.group);
const shadowSize = view.shadowSize ?? 30;
sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); sun.shadow.bias = -0.0002; sun.shadow.normalBias = 0.03; sun.shadow.radius = 2.5;
Object.assign(sun.shadow.camera, { left: -shadowSize, right: shadowSize, top: shadowSize, bottom: -shadowSize, near: 1, far: 170 });
sun.shadow.camera.updateProjectionMatrix(); scene.add(sun, sun.target, fill);
const water = view.water === false ? null : createWater(view.water); if (water) scene.add(water.mesh);
const lite = params.has('lite');
// ?thin=N draws only every Nth frame while the game itself runs at full speed: for testing on machines with no
// graphics card, where drawing is the slow part.
const thin = Math.max(1, Number(params.get('thin')) || 1);
const pipeline = createPipeline(renderer, { lite }), sky = createSkyEnvironment(renderer);
const save = createSave((() => { try { return window.localStorage; } catch { return null; } })() ?? { getItem() { return null; }, setItem() {} });
const sound = createSound({ AudioContextCtor: window.AudioContext ?? window.webkitAudioContext, scale: data.scale, timbre: data.timbre, ambience: data.ambience ?? 'sea' });

// The travellers, each with an invisible tap target, and a brass ring under whoever is active.
const ghost = () => new T.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
const walkers = {}, walkerHits = [];
for (const id of model.travellers) {
  const w = view.makeWalker?.(id) ?? createWalker(id); scene.add(w.group); walkers[id] = w;
  const h = new T.Mesh(new T.SphereGeometry(0.36, 12, 8), ghost()); h.position.y = 0.48; h.userData.walker = id; w.group.add(h); walkerHits.push(h); // snug, so the ground beside someone stays tappable
}
const marker = new T.Mesh(new T.TorusGeometry(0.3, 0.022, 8, 40), kit.mats.brass); marker.rotation.x = Math.PI / 2; marker.visible = model.travellers.length > 1; scene.add(marker);

// Easter eggs: this scene's hidden cursor and Marg, and the terminal they lead to.
const cursor = createCursor(); cursor.group.position.set(...data.egg); scene.add(cursor.group);
const marg = createMarg(); marg.group.position.set(...data.marg); marg.group.userData.y0 = data.marg[1]; marg.group.rotation.y = 0.8; scene.add(marg.group);
const eggHits = [cursor.target, marg.target];
const terminal = createTerminal({ scenes: built, here: data, save, onRoot: on => { model.root = on; model.plan = model.asked = null; syncMenu(); }, onMatrix: on => document.body.classList.toggle('matrix', on) });
model.root = !!save.load().root; document.body.classList.toggle('matrix', !!save.load().matrix);
function foundCursor() { const s = save.load(), eggs = [...new Set([...s.eggs, data.id])]; save.store({ eggs }); sound.join(); terminal.open(`cursor found in ${data.title} (${eggs.length}/${built.length}).`); }

// What can be tapped right now: a pale ring on every spot the active traveller can walk to, a brighter one on
// each lever or handle they can work from where they stand, and one under their feet when they can turn what they ride.
const markMat = new T.MeshBasicMaterial({ color: '#fff3c9', transparent: true, opacity: 0.7, depthWrite: false, side: T.DoubleSide });
const useMat = new T.MeshBasicMaterial({ color: '#ffd35c', transparent: true, opacity: 0.9, depthWrite: false, depthTest: false, side: T.DoubleSide });
const spotMarks = {}; for (const id of Object.keys(data.nodes)) { const m = new T.Mesh(new T.RingGeometry(0.15, 0.2, 28), markMat); m.rotation.x = -Math.PI / 2; m.visible = false; m.renderOrder = 5; scene.add(m); spotMarks[id] = m; }
const useMarks = view.hits.filter(h => h.userData.lever || h.userData.handle).map(h => { const m = new T.Mesh(new T.RingGeometry(0.24, 0.3, 32), useMat); m.visible = false; m.renderOrder = 6; scene.add(m); return { hit: h, mesh: m }; });
const rideMark = new T.Mesh(new T.RingGeometry(0.4, 0.46, 36), useMat); rideMark.rotation.x = -Math.PI / 2; rideMark.visible = false; rideMark.renderOrder = 6; scene.add(rideMark);
let reachable = new Set();
function updateMarks(time, still) {
  const idle = !walk && !model.won && !travel && !Object.values(mechs).some(m => m.moving), pulse = still ? 1 : 0.75 + 0.25 * Math.sin(time * 3.2), spot = new T.Vector3();
  markMat.opacity = 0.62 * pulse; useMat.opacity = 0.9 * pulse;
  for (const [id, m] of Object.entries(spotMarks)) { m.visible = idle && reachable.has(id); if (m.visible) { const p = live(id); m.position.set(p.x, p.y + 0.035, p.z); } }
  for (const u of useMarks) {
    const d = u.hit.userData, on = idle && (d.lever ? d.near[0] === model.at && model.canTurn(d.lever) : model.canTurn(d.mech));
    u.mesh.visible = on; if (on) { u.hit.getWorldPosition(spot); u.mesh.position.copy(spot); u.mesh.quaternion.copy(camera.quaternion); }
  }
  rideMark.visible = idle && rideable(); if (rideMark.visible) { const p = live(model.at); rideMark.position.set(p.x, p.y + 0.04, p.z); }
}

// A few birds circling.
const birds = [], flock = view.birds ?? { x: 0, z: 9, h: 11 };
{ const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute([0, 0, 0.09, -0.22, 0, -0.05, 0, 0, -0.02, 0, 0, 0.09, 0, 0, -0.02, 0.22, 0, -0.05], 3)); const mat = new T.MeshBasicMaterial({ color: flock.color ?? '#2a3238', side: T.DoubleSide });
  for (let i = 0; i < (flock.count ?? 7); i++) { const b = new T.Mesh(geo.clone(), mat); b.scale.setScalar(flock.count ? 1.5 : 1); b.userData = { r: 5 + (i % 3) * 1.6, speed: 0.22 + (i % 4) * 0.03, phase: i * 0.9, h: flock.h + (i % 5) * 0.7 }; scene.add(b); birds.push(b); } }

function applyPalette(p) {
  const az = p.sunDir[0] * Math.PI / 180, el = p.sunDir[1] * Math.PI / 180, dir = new T.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el));
  sun.color.set(p.sun); sun.intensity = p.sunPower; sun.userData.dir = dir;
  fill.color.set(p.skyTop); fill.groundColor.set(p.water); fill.intensity = 0.22 * p.ambient;
  scene.environment = sky.bake(p, dir); water?.setPalette(p, dir);
  pipeline.uniforms.haze.value.set(p.haze);
  for (const m of Object.values(kit.mats)) if ('envMapIntensity' in m && m !== kit.mats.glass) m.envMapIntensity = 0.45 * p.ambient;
}

// Frame the chapter: fit its extent on screen, leaving room for the title and the status line.
function resize() {
  const w = canvas.clientWidth, h = canvas.clientHeight; renderer.setSize(w, h, false); pipeline.resize();
  let u0 = Infinity, u1 = -Infinity, v0 = Infinity, v1 = -Infinity;
  for (const p of view.frame) { const q = new T.Vector3(...p), u = q.dot(RIGHT), v = q.dot(UP); u0 = Math.min(u0, u); u1 = Math.max(u1, u); v0 = Math.min(v0, v); v1 = Math.max(v1, v); }
  const aspect = w / h, portrait = aspect < 0.8, padTop = portrait ? 0.2 : 0.07, padBottom = portrait ? 0.14 : 0.17, padSide = portrait ? 0.03 : 0.06;
  const spanU = (u1 - u0) / (1 - padSide * 2), spanV = (v1 - v0) / (1 - padTop - padBottom), height = Math.max(spanV, spanU / aspect), width = height * aspect;
  const cv = (v0 + v1) / 2 + (padTop - padBottom) / 2 * height;
  focus.copy(RIGHT).multiplyScalar((u0 + u1) / 2).addScaledVector(UP, cv); baseFocus?.copy(focus);
  camera.left = -width / 2; camera.right = width / 2; camera.top = height / 2; camera.bottom = -height / 2; camera.updateProjectionMatrix();
  aim();
  pipeline.uniforms.hazeNear.value = DIST + 6; pipeline.uniforms.hazeFar.value = DIST + 55;
}
function aim() {
  camera.position.copy(focus).addScaledVector(TOWARD, DIST); camera.up.set(0, 1, 0); camera.lookAt(focus); camera.updateMatrixWorld();
  sun.target.position.copy(focus); sun.position.copy(focus).addScaledVector(sun.userData.dir, 70); sun.target.updateMatrixWorld();
}
addEventListener('resize', resize);
// Quality: 2 is everything; 1 drops resolution and shadow detail; 0 also drops reflections, contact shading and
// depth of field. It starts at 2 and steps down if the device cannot hold a steady frame rate. ?lite starts at 0.
let quality = 2, slowFrames = 0, sampled = 0, frameCount = 0;
function setQuality(q) {
  quality = q; renderer.setPixelRatio(q === 2 ? Math.min(devicePixelRatio, 2) : q === 1 ? Math.min(devicePixelRatio, 1.25) : 1);
  const size = 1024 << q;
  if (sun.shadow.mapSize.x !== size) { sun.shadow.mapSize.set(size, size); sun.shadow.map?.dispose(); sun.shadow.map = null; }
  pipeline.uniforms.detail.value = q === 0 ? 0 : 1; resize();
}
function watchFrameRate(ms) {
  if (quality === 0 || ms > 500) return; // a long gap is a hidden tab, not a slow device
  sampled++; if (ms > 40) slowFrames++;
  if (sampled >= 50) { if (slowFrames > 30) setQuality(quality - 1); sampled = slowFrames = 0; }
}

// ---- mechanisms -------------------------------------------------------------
const angleOf = state => -state * Math.PI / 2;
const mechs = {}; for (const id of Object.keys(data.mechs)) mechs[id] = { angle: angleOf(model.mechs[id]), target: angleOf(model.mechs[id]), moving: false };
const nearest = (angle, from) => angle + Math.round((from - angle) / (Math.PI * 2)) * Math.PI * 2;
function say(event) { $('#status').textContent = event ? status(model, event) : ''; }
const joined = () => model.edges().filter(e => e.kind === 'apparent').length;
function turn(id, steps, dragged = false) {
  if (walk || model.won || !steps) return false;
  if (!model.canTurn(id)) { say('far'); started(); return false; }
  const rooted = model.root; model.root = false; const hacked = !model.canTurn(id); model.root = rooted;
  const riding = model.riding(id), before = joined(), was = { ...model.mechs };
  for (let i = 0; i < Math.abs(steps); i++) model.turn(id, Math.sign(steps));
  let geared = false;
  for (const [k, m] of Object.entries(mechs)) {
    if (model.mechs[k] === was[k]) continue;
    // Turn the way the model turned, rather than the short way round.
    const by = k === id ? steps : steps * (data.mechs[id].gear?.[k] ?? 0);
    m.target = k === id && dragged ? nearest(angleOf(model.mechs[k]), m.angle) : m.target - by * Math.PI / 2;
    m.moving = true; m.after = joined() > before; if (k !== id) geared = true; if (reduced.matches) m.angle = m.target;
  }
  sound.note(model.mechs[id]); say(hacked ? 'hacked' : data.text[`turned:${id}`] ? `turned:${id}` : riding ? 'carried' : geared ? 'geared' : 'turned'); started(); syncMenu(); return true;
}

// ---- travellers and walking -------------------------------------------------
let walk = null, stepTimer = 0;
const P = id => new T.Vector3(...model.pos(id));
// Where a node is right now, following a mechanism while it is still turning.
function live(nodeId) {
  const node = data.nodes[nodeId];
  if (!node.arm) return P(nodeId);
  if (data.mechs[node.arm].track) { // a car on a track: glide between its stops
    const tr = data.mechs[node.arm].track, n = tr.length, u = ((-mechs[node.arm].angle / (Math.PI / 2)) % n + n) % n, i = Math.floor(u) % n;
    return new T.Vector3(...tr[i]).lerp(new T.Vector3(...tr[(i + 1) % n]), u - Math.floor(u));
  }
  const m = data.mechs[node.arm], a = mechs[node.arm].angle - (node.slot ?? 0) * Math.PI / 2, c = Math.cos(a) * m.length, s = Math.sin(a) * m.length;
  return m.axis === 'z' ? new T.Vector3(m.hub[0] + c, m.hub[1] + s, m.hub[2]) : new T.Vector3(m.hub[0] + c, m.hub[1], m.hub[2] - s);
}
function placeWalkers() {
  // Travellers sharing a spot stand in a little cluster rather than inside one another.
  const at = {}; for (const id of model.travellers) if (walk?.who !== id) (at[model.where[id]] ??= []).push(id);
  for (const [node, ids] of Object.entries(at)) ids.forEach((id, i) => { const p = live(node), n = ids.length; if (model.won && view.afterWin && node === data.goal.node) p.add(view.afterWin()); if (n > 1) { const a = i / n * Math.PI * 2 + 0.6, r = n > 3 ? 0.46 : n > 2 ? 0.38 : 0.24; p.x += Math.cos(a) * r; p.z += Math.sin(a) * r; } walkers[id].group.position.copy(p); });
}
function go(to) {
  if (walk || model.won || Object.values(mechs).some(m => m.moving) || drag?.active) return false;
  if (to === model.at) return false;
  const path = model.path(to); started();
  if (!path) { say('blocked'); return false; }
  const points = [];
  for (let i = 1; i < path.length; i++) {
    const cross = model.crossing(path[i - 1], path[i]);
    if (cross) points.push({ pos: P(path[i - 1]).add(new T.Vector3(...cross.step).multiplyScalar(0.5)), jump: cross.lift });
    // A scene may give a set route for one direction of an edge, such as the way down a slide.
    const route = view.routes?.[`${path[i - 1]}>${path[i]}`];
    if (route) { for (const p of route) points.push({ pos: p.clone(), slide: !route.slow }); points.push({ pos: P(path[i]), node: path[i] }); continue; }
    points.push({ pos: P(path[i]), node: path[i], hidden: !!model.edge(path[i - 1], path[i]).hidden });
  }
  walkers[model.active].group.position.copy(P(model.at));
  walk = { who: model.active, points, to, had: new Set(model.items) }; say(''); syncMenu(); return true;
}
function updateWalk(dt) {
  placeWalkers();
  if (!walk) return;
  const body = walkers[walk.who]; let travel = dt * (walk.points[0]?.slide ? 6.5 : 2.7);
  while (walk && travel > 0) {
    const next = walk.points[0], d = body.group.position.distanceTo(next.pos); body.group.visible = !next.hidden; if (next.hidden) travel *= 3; // out of sight, so quicker
    body.face(next.pos.x - body.group.position.x, next.pos.z - body.group.position.z);
    if (d > travel) { body.group.position.addScaledVector(next.pos.clone().sub(body.group.position).normalize(), travel); break; }
    body.group.position.copy(next.pos); travel -= d; walk.points.shift(); body.group.visible = true;
    if (next.jump) { body.group.position.addScaledVector(new T.Vector3(1, 1, 1), next.jump); sound.join(); }
    if (next.node) model.visit(next.node);
    if (!walk.points.length) {
      const to = walk.to, had = walk.had; walk = null; model.arrive(to);
      const gained = [...model.items].find(i => !had.has(i)), locked = Object.entries(data.items ?? {}).some(([i, s]) => s.at === to && !model.items.has(i));
      if (model.won) finish(); else say(gained ? `item:${gained}` : data.text[`at:${to}`] ? `at:${to}` : locked ? `locked:${to}` : to === data.goal.node && data.text['goal-empty'] ? 'goal-empty' : 'arrived');
      if (!model.won && rideable()) $('#status').textContent += data.mechs[data.nodes[model.at].arm].track ? ' Tap it under your feet to set off.' : ' Tap it under your feet to swing it round.';
      syncMenu();
    }
  }
  stepTimer -= dt; if (walk && stepTimer <= 0) { sound.step(); stepTimer = 0.3; }
}
function switchTo(id) {
  if (walk || model.won || model.travellers.length < 2) return false;
  if (id && id === model.active) return false;
  if (id) model.select(id); else model.switch(); $('#status').textContent = `Now moving ${people[model.active].name}.`; started(); syncMenu(); return true;
}
let finale = null;
// Is the active traveller standing on something they can turn from where they are?
function rideable() { const arm = data.nodes[model.at].arm; return !!arm && model.riding(arm) && model.canTurn(arm); }
function finish() {
  say('arrived'); sound.chord();
  // The last chapter: cast off, let her sail, and only then show the card.
  if (data.finale) { const id = data.finale; model.rotate(id, 1); mechs[id].target -= Math.PI / 2; mechs[id].moving = true; if (reduced.matches) mechs[id].angle = mechs[id].target; finale = { t: 0 }; }
  else showFinish();
  wantCard = true; celebrate();
  const s = save.load(); save.store({ furthest: Math.max(s.furthest, data.number + 1), done: [...new Set([...s.done, data.id])] });
  if (!reduced.matches) setTimeout(() => (nextChapter ? $('#next') : $('#again')).focus({ preventScroll: true }), 1500);
}
// The end card. On the last scene it carries a postcard from every place played.
function showFinish() {
  const last = !nextChapter, cards = save.load().cards, have = built.filter(c => cards[c.id]);
  if (last && have.length) {
    const box = $('#cards'); box.replaceChildren();
    have.forEach((c, i) => { const f = document.createElement('figure'), img = document.createElement('img'), cap = document.createElement('figcaption'); img.src = cards[c.id]; img.alt = `A postcard from ${c.title}`; cap.textContent = c.title.replace(/,.*/, ''); f.style.animationDelay = `${0.25 + i * 0.22}s`; f.append(img, cap); box.append(f); });
    box.hidden = false; $('#finish').classList.add('wide');
  }
  $('#over').hidden = !last; $('#finish').hidden = false;
}
// A postcard: a small picture of the scene as it stands when it is completed, kept in the browser.
let wantCard = false;
function takeCard() {
  wantCard = false;
  try {
    const c = document.createElement('canvas'); c.width = 320; c.height = 200; const g = c.getContext('2d'), w = canvas.width, h = canvas.height, sw = Math.min(w, h * 1.6), sh = sw / 1.6;
    g.drawImage(canvas, (w - sw) / 2, (h - sh) / 2, sw, sh, 0, 0, 320, 200);
    save.store({ cards: { ...save.load().cards, [data.id]: c.toDataURL('image/jpeg', 0.62) } });
  } catch { /* no postcard, no harm */ }
}
// Completion: a rise of golden motes from where the scene was won.
const motes = new T.Points(new T.BufferGeometry(), new T.PointsMaterial({ color: data.motes ?? '#ffd978', size: 5, sizeAttenuation: false, transparent: true, opacity: 0, depthWrite: false, depthTest: false }));
motes.geometry.setAttribute('position', new T.BufferAttribute(new Float32Array(90 * 3), 3)); motes.frustumCulled = false; motes.renderOrder = 8; scene.add(motes);
let party = null;
function celebrate() {
  if (reduced.matches) return;
  const at = live(data.goal.node), seeds = Array.from({ length: 90 }, (_, i) => ({ a: i * 2.4, r: 0.2 + (i * 0.37 % 1) * 1.5, v: 1 + (i * 0.61 % 1) * 1.8, d: (i * 0.23 % 1) * 1.2 }));
  party = { t: 0, at, seeds };
}
function updateParty(dt) {
  if (!party) return;
  party.t += dt; const p = motes.geometry.attributes.position, t = party.t;
  party.seeds.forEach((s, i) => { const k = Math.max(0, t - s.d); p.setXYZ(i, party.at.x + Math.cos(s.a + k) * s.r * Math.min(1, k), party.at.y + 0.3 + k * s.v, party.at.z + Math.sin(s.a + k) * s.r * Math.min(1, k)); });
  p.needsUpdate = true; motes.material.opacity = Math.max(0, Math.min(1, t * 2) * (1 - t / 4.5));
  if (t > 4.5) { party = null; motes.material.opacity = 0; }
}
function restart() {
  model.reset(); model.root = !!save.load().root; walk = null; drag = null; finale = null; party = null; motes.material.opacity = 0; $('#cards').hidden = true; $('#finish').classList.remove('wide'); camera.zoom = 1; camera.updateProjectionMatrix(); $('#finish').hidden = true; $('#menu').open = false;
  for (const id of Object.keys(mechs)) { mechs[id].angle = mechs[id].target = angleOf(model.mechs[id]); mechs[id].moving = false; }
  placeWalkers(); for (const w of Object.values(walkers)) w.face(1, 1); view.update.wonAt = undefined; say('start'); syncMenu();
}
// A nudge for anyone who has not moved for a while: once per scene, and never over other text that matters.
let lastInput = performance.now(), nudged = false;
function nudge(now) { if (nudged || begun && model.won || travel || now - lastInput < 30000) return; nudged = true; $('#status').textContent = 'Stuck? The three dots, top right, have a hint.'; }
let begun = false; function started() { lastInput = performance.now(); if (!begun) { begun = true; $('#title').classList.add('away'); document.querySelector('main').classList.add('playing'); } }

// ---- pointer ----------------------------------------------------------------
const ray = new T.Raycaster(), ndc = new T.Vector2(), plane = new T.Plane(), hitPoint = new T.Vector3(); let drag = null;
function cast(e) { const r = canvas.getBoundingClientRect(); ndc.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); ray.setFromCamera(ndc, camera); }
function pick(e) {
  // The active traveller never blocks a tap: whatever is behind them (a lever, the deck) gets it instead.
  scene.updateMatrixWorld(); // positions are otherwise only brought up to date when a frame is drawn
  cast(e); const all = ray.intersectObjects([...eggHits, ...walkerHits, ...view.hits], false);
  if (view.tapSelf && all[0]?.object.userData.walker === model.active) return { data: { handle: true, mech: view.tapSelf }, point: all[0].point };
  let hit = all.find(h => h.object.userData.walker !== model.active) ?? null;
  // In a huddle the tap targets overlap, so take whoever's body is nearest the tap rather than whoever is in front.
  // A person is always selectable where you can see them, even standing against a lever or inside a doorway;
  // only the hidden cursor and Marg take precedence.
  const others = all.filter(h => h.object.userData.walker && h.object.userData.walker !== model.active);
  if (others.length && !hit?.object.userData.egg && !hit?.object.userData.marg) {
    const centre = h => screenOf(walkers[h.object.userData.walker].group.position.clone().setY(walkers[h.object.userData.walker].group.position.y + 0.45 * (people[h.object.userData.walker].size ?? 1)));
    const gap = h => { const c = centre(h); return Math.hypot(c[0] - e.clientX, c[1] - e.clientY); };
    hit = others.sort((a, b) => gap(a) - gap(b))[0];
  }
  return hit ? { data: hit.object.userData, point: hit.point } : null;
}
function pointerAngle(e, id) {
  const hub = view.mechs[id].hub; cast(e);
  if (data.mechs[id].axis === 'z') { plane.set(new T.Vector3(0, 0, 1), -hub.z); return ray.ray.intersectPlane(plane, hitPoint) ? Math.atan2(hitPoint.y - hub.y, hitPoint.x - hub.x) : null; }
  plane.set(new T.Vector3(0, 1, 0), -hub.y);
  return ray.ray.intersectPlane(plane, hitPoint) ? Math.atan2(-(hitPoint.z - hub.z), hitPoint.x - hub.x) : null;
}
function screenOf(v) { const r = canvas.getBoundingClientRect(), p = v.clone().project(camera); return [r.left + (p.x + 1) / 2 * r.width, r.top + (1 - p.y) / 2 * r.height]; }
canvas.addEventListener('pointerdown', e => {
  if (travel) return; if (terminal.isOpen) terminal.close();
  $('#menu').open = false; const hit = pick(e);
  drag = { x: e.clientX, y: e.clientY, pointer: e.pointerId, hit, active: false };
  if (hit?.data.mech && !walk && !model.won && !model.canTurn(hit.data.mech)) drag.deny = true;
  if (hit?.data.mech && !walk && !model.won && model.canTurn(hit.data.mech)) { drag.id = hit.data.mech; drag.from = pointerAngle(e, drag.id); drag.base = mechs[drag.id].angle; }
  canvas.setPointerCapture?.(e.pointerId);
});
canvas.addEventListener('pointermove', e => {
  if (!drag || drag.pointer !== e.pointerId) { canvas.style.cursor = pick(e) ? 'pointer' : 'default'; return; }
  if (drag.deny && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 14) { drag.deny = false; say('far'); started(); }
  if (!drag.id || drag.from === null) return;
  if (!drag.active && Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 7) { drag.active = true; started(); canvas.style.cursor = 'grabbing'; }
  if (!drag.active) return;
  const a = pointerAngle(e, drag.id); if (a === null) return;
  let delta = a - drag.from; delta = Math.atan2(Math.sin(delta), Math.cos(delta));
  const m = mechs[drag.id]; m.target = nearest(drag.base + delta, m.angle); m.dragging = true; sound.grind(0.25);
});
function release(e) {
  if (!drag || drag.pointer !== e.pointerId) return;
  const d = drag; drag = null; sound.grind(0); canvas.style.cursor = 'default';
  if (d.active) {
    const m = mechs[d.id]; m.dragging = false;
    const steps = Math.round((angleOf(model.mechs[d.id]) - m.target) / (Math.PI / 2));
    if (!turn(d.id, steps, true)) { m.target = nearest(angleOf(model.mechs[d.id]), m.angle); m.moving = true; }
    return;
  }
  if (!d.hit || Math.hypot(e.clientX - d.x, e.clientY - d.y) > 12) return;
  act(intentOf(d.hit, e.clientX, e.clientY, e.pointerType === 'touch'));
}
// A finger is blunter than a pointer. When a touch would otherwise do nothing (it missed, or it asks to walk to
// where you already are, or to somewhere you cannot go), a lever, handle, person or hidden thing just beside it counts.
function nearSmall(x, y) {
  let best = null, bestGap = 26; const at = new T.Vector3();
  for (const o of [...eggHits, ...walkerHits, ...view.hits]) {
    const d = o.userData; if (!(d.lever || d.handle || d.walker || d.egg || d.marg) || d.walker === model.active || (d.lever && d.near[0] !== model.at)) continue;
    const [sx, sy] = screenOf(o.getWorldPosition(at)), gap = Math.hypot(sx - x, sy - y);
    if (gap < bestGap) { bestGap = gap; best = o; }
  }
  return best && { data: best.userData, point: best.getWorldPosition(new T.Vector3()) };
}
// What a tap on this spot means. The game and the tap-only check both go through here.
function intentOf(hit, x, y, touch = false) {
  const direct = meaning(hit, x, y);
  if (!touch || (direct && !(direct.type === 'walk' && (direct.to === model.at || !model.path(direct.to))))) return direct;
  return meaning(nearSmall(x, y), x, y) ?? direct;
}
function meaning(hit, x, y) {
  if (!hit) return null;
  const h = hit.data;
  if (h.egg) return { type: 'egg' }; if (h.marg) return { type: 'marg' }; if (h.yacht) return { type: 'flag' };
  if (h.walker) return { type: 'select', who: h.walker };
  if (h.handle) return { type: 'turn', id: h.mech };
  if (h.lever && model.at === h.near[0]) return { type: 'turn', id: h.lever };
  const near = h.near?.filter(n => data.nodes[n]); if (!near?.length) return null;
  const best = [...near].sort((a, b) => { const pa = screenOf(live(a)), pb = screenOf(live(b)); return Math.hypot(pa[0] - x, pa[1] - y) - Math.hypot(pb[0] - x, pb[1] - y); })[0];
  // Standing on something that turns: a tap on it, under your own feet, turns it.
  if (best === model.at && h.mech && model.riding(h.mech) && model.canTurn(h.mech)) return { type: 'turn', id: h.mech };
  return { type: 'walk', to: best };
}
function act(intent) {
  if (!intent) return;
  try { navigator.vibrate?.(8); } catch { /* not available */ }
  if (intent.type === 'egg') foundCursor(); else if (intent.type === 'marg') { marg.yap(); sound.note(7); say('marg'); }
  else if (intent.type === 'flag') { view.blackFlag?.(); say('flag'); } else if (intent.type === 'select') switchTo(intent.who);
  else if (intent.type === 'turn') turn(intent.id, 1); else go(intent.to);
}
// For the tap-only check: a screen point where a real tap would make this move, or null if there is none.
function tapFor(move, touch = false) {
  const r = canvas.getBoundingClientRect(), want = move.type === 'switch' ? { type: 'select', who: move.who } : move.type === 'walk' ? { type: 'walk', to: move.to } : { type: 'turn', id: move.id };
  const same = i => i && i.type === want.type && (i.who ?? i.to ?? i.id) === (want.who ?? want.to ?? want.id), spots = [];
  const around = (p, reach = 0.4) => { for (const [dx, dz] of [[0, 0], [reach, 0], [-reach, 0], [0, reach], [0, -reach], [reach, reach], [-reach, -reach], [reach, -reach], [-reach, reach]]) spots.push(new T.Vector3(p.x + dx, p.y + 0.02, p.z + dz)); };
  if (want.type === 'select') { const p = walkers[want.who].group.position; for (const dy of [0.45, 0.3, 0.7, 0.15, 0.9]) spots.push(new T.Vector3(p.x, p.y + dy * (people[want.who].size ?? 1), p.z)); }
  else if (want.type === 'walk') { around(live(want.to)); around(live(want.to), 0.8); }
  else { for (const h of view.hits) if ((h.userData.lever === want.id) || (h.userData.handle && h.userData.mech === want.id)) spots.push(h.getWorldPosition(new T.Vector3())); around(live(model.at)); }
  for (const p of spots) {
    const [x, y] = screenOf(p); if (x < r.left || x > r.right || y < r.top || y > r.bottom) continue;
    if (same(intentOf(pick({ clientX: x, clientY: y }), x, y, touch))) return [x, y];
  }
  return null;
}
canvas.addEventListener('pointerup', release); canvas.addEventListener('pointercancel', release);

// ---- page text and menu -----------------------------------------------------
const cap = s => s.replace(/^the /, '').replace(/^./, c => c.toUpperCase());
document.title = data.banner ?? `${data.title} — Curphey Family Web Site`;
if (data.banner) { const b = document.createElement('span'); b.className = 'banner'; b.textContent = data.banner; $('#title').prepend(b); }
document.querySelector('.title .eyebrow').textContent = `Scene ${data.word} · ${listNames(model.travellers)}`;
document.querySelector('.title h1').textContent = data.title.replace("'", '’'); $('#subtitle').innerHTML = data.subtitle.join('<br>');
document.querySelector('#goal b').textContent = data.goalText; canvas.setAttribute('aria-label', `${data.title}: ${data.subtitle.join(' ')} Goal: ${data.goalText} Every move can also be made from the menu.`); if (data.finish.eyebrow) document.querySelector('#finish .eyebrow').textContent = data.finish.eyebrow;
document.querySelector('#finish h2').textContent = data.finish.title; document.querySelector('#finish p').textContent = data.finish.body;
const nextChapter = built.find(c => c.id === data.next);
if (nextChapter) { $('#next').hidden = false; $('#next').onclick = () => startPassage(); }
for (const [id, n] of Object.entries(data.nodes)) { const b = document.createElement('button'); b.textContent = cap(n.label); b.dataset.go = id; b.onclick = () => go(id); $('#walks').append(b); }
for (const [id, m] of Object.entries(data.mechs)) for (const dir of [1, -1]) { const b = document.createElement('button'); b.textContent = `${cap(m.label)} ${dir > 0 ? '↻' : '↺'}`; b.setAttribute('aria-label', `Turn ${m.label} ${dir > 0 ? 'clockwise' : 'anticlockwise'}`); b.dataset.turn = id; b.onclick = () => turn(id, dir); $('#turns').append(b); }
for (const c of built) { const b = document.createElement('button'), card = save.load().cards[c.id]; b.textContent = `${c.number} · ${c.title}`; if (card) { b.classList.add('carded'); b.style.backgroundImage = `linear-gradient(90deg, rgba(250,246,236,.95) 45%, rgba(250,246,236,.35)), url(${card})`; } b.disabled = c === data; b.onclick = () => { location.search = `?chapter=${c.id}`; }; $('#chapters').append(b); }
$('#switch').hidden = model.travellers.length < 2; $('#switch').onclick = () => { switchTo(); $('#menu').open = false; };
function syncMenu() { const busy = !!walk || model.won; reachable = busy ? new Set() : model.reach(); $('#who b').textContent = (people[model.active]?.name ?? '') + (model.root && model.active === 'one' ? ' · 007' : ''); $('#who i').style.background = people[model.active]?.coat ?? '#888';
  if (model.travellers.length > 1) $('#switch').textContent = `Switch to ${people[model.travellers[(model.travellers.indexOf(model.active) + 1) % model.travellers.length]].name}`; document.querySelectorAll('[data-go]').forEach(b => b.disabled = busy || b.dataset.go === model.at); document.querySelectorAll('[data-turn]').forEach(b => b.disabled = busy || !model.canTurn(b.dataset.turn)); $('#switch').disabled = busy; }
// Hints. The search runs in a worker; the model keeps the plan, so following hints costs one search.
let hintWorker = null, ticket = 0; const waiting = new Map();
try { hintWorker = new Worker(new URL('./hint-worker.mjs', import.meta.url), { type: 'module' }); hintWorker.onmessage = ({ data: d }) => { waiting.get(d.ticket)?.(d); waiting.delete(d.ticket); }; hintWorker.onerror = () => { hintWorker = null; for (const done of waiting.values()) done(null); waiting.clear(); }; } catch { hintWorker = null; }
function planReady() {
  const key = model.key();
  if (model.won || !hintWorker || model.asked?.key === key || (model.plan?.key === key && model.plan.moves.length)) return Promise.resolve();
  return new Promise(done => { const t = ++ticket; waiting.set(t, d => { if (d?.moves && d.key === model.key()) model.plan = { key: d.key, moves: d.moves }; done(); });
    hintWorker.postMessage({ ticket: t, id: data.id, where: model.where, active: model.active, mechs: model.mechs, items: [...model.items], root: !!model.root }); });
}
$('#hint').onclick = async () => { started(); $('#menu').open = false; $('#status').textContent = 'Thinking…'; await planReady(); $('#status').textContent = hintText(model, model.hint()); };
$('#restart').onclick = restart; $('#again').onclick = restart;
function setSound(on) { if (on) on = sound.enable(); else sound.disable(); $('#sound').textContent = on ? 'Sound on' : 'Sound off'; $('#sound').setAttribute('aria-pressed', String(!!on)); save.store({ sound: !!on }); }
$('#sound').onclick = () => setSound($('#sound').getAttribute('aria-pressed') !== 'true');
if (save.load().sound) { $('#sound').textContent = 'Sound on (tap to start)'; addEventListener('pointerdown', () => setSound(true), { once: true }); }

// ---- watch it play: follows the solver's moves, one at a time, with a pause between ----
let auto = false, autoWait = 0, planning = false;
function setAuto(on) { auto = on; autoWait = 1.2; $('#auto').textContent = on ? 'Stop watching' : 'Watch it play'; $('#auto').setAttribute('aria-pressed', String(on)); $('#menu').open = false; if (on && model.won) restart(); }
$('#auto').onclick = () => setAuto(!auto);
function updateAuto(dt) {
  if (!auto || travel || walk || drag || Object.values(mechs).some(m => m.moving)) { if (!model.won) autoWait = Math.max(autoWait, 0.9); return; }
  if (model.won) { if (nextChapter && params.has('auto')) { autoWait -= dt; if (autoWait < -3) startPassage(); } else setAuto(false); return; }
  autoWait -= dt; if (autoWait > 0) return;
  if (planning) return; const key = model.key();
  if (hintWorker && model.asked?.key !== key && !(model.plan?.key === key && model.plan.moves.length)) { planning = true; planReady().then(() => { planning = false; }); return; }
  const move = model.hint(); if (!move) return;
  if (move.who && move.who !== model.active) { switchTo(move.who); autoWait = 0.5; return; }
  if (move.type === 'walk') go(move.to); else if (move.type === 'switch') switchTo(); else turn(move.id, move.dir);
  autoWait = 0.9;
}

// ---- the passage to the next chapter ------------------------------------------
const baseFocus = new T.Vector3(), hazeHere = new T.Color(palette.haze), hazeNext = new T.Color(nextChapter ? palettes[nextChapter.palette].haze : palette.haze), GLIDE = 14;
let travel = params.has('arrive') ? { kind: 'arrive', t: 0 } : null; if (travel) pipeline.uniforms.veil.value = 1;
function startPassage() {
  if (travel || !nextChapter) return;
  travel = { kind: 'leave', t: 0 }; $('#passage').replaceChildren(Object.assign(document.createElement('span'), { textContent: data.passage ?? '' }), Object.assign(document.createElement('small'), { textContent: `Scene ${nextChapter.word} · ${nextChapter.title}` })); document.querySelector('main').classList.add('travelling');
}
function leave() { const q = new URLSearchParams({ chapter: nextChapter.id, arrive: '1', mist: hazeNext.getHexString() }); if (auto) q.set('auto', '1'); if (lite) q.set('lite', '1'); if (thin > 1) q.set('thin', String(thin)); location.search = `?${q}`; }
function updatePassage(dt) {
  if (!travel || travel.left) return;
  travel.t += dt; const still = reduced.matches, p = travel.kind === 'leave' ? leaving(travel.t, still) : arriving(travel.t, still);
  pipeline.uniforms.veil.value = p.veil;
  // Glide on in the direction of travel while leaving; glide in from behind while arriving.
  focus.copy(baseFocus).addScaledVector(RIGHT, (travel.kind === 'leave' ? p.glide : -p.glide) * GLIDE); aim();
  if (travel.kind === 'leave') { pipeline.uniforms.haze.value.copy(hazeHere).lerp(hazeNext, p.mix); $('#passage').style.opacity = p.text; }
  if (p.done) { const kind = travel.kind; if (kind === 'leave') { if (!travel.left) { travel.left = true; leave(); } /* once only: asking twice aborts the first */ } else { travel = null; pipeline.uniforms.veil.value = 0; focus.copy(baseFocus); aim(); } }
}
canvas.addEventListener('pointerdown', () => { if (travel?.kind === 'leave' && travel.t > 0.4 && !travel.left) { travel.left = true; leave(); } });

// ---- arrival: the camera eases in from a little further out ---------------------
let intro = reduced.matches || lite || params.has('arrive') ? null : { from: 0 };
function updateIntro(now) {
  if (!intro || finale) return;
  intro.from ||= now; const k = Math.min(1, (now - intro.from) / 1400), e = 1 - Math.pow(1 - k, 3);
  camera.zoom = 1.1 - 0.1 * e; camera.updateProjectionMatrix(); if (k >= 1) intro = null;
}
// ---- the buttons under the title, before play starts ---------------------------
{ const s = save.load(), resume = built.find(c => c.number === Math.min(s.furthest, built.length));
  $('#starters').hidden = false; $('#with-sound').hidden = $('#sound').getAttribute('aria-pressed') === 'true' || !!s.sound;
  $('#with-sound').onclick = () => { setSound(true); $('#with-sound').hidden = true; };
  if (!params.has('chapter') && resume && resume.number > data.number) { $('#continue').hidden = false; $('#continue').textContent = `Continue at ${resume.title}`; $('#continue').onclick = () => { location.search = `?chapter=${resume.id}`; }; }
  $('#over').onclick = () => { location.search = `?chapter=${built[0].id}`; }; }

// ---- installable, and playable offline ------------------------------------------
if ('serviceWorker' in navigator && (location.protocol === 'https:' || params.has('sw'))) navigator.serviceWorker.register('/sw.js').catch(() => { /* the game works without it */ });
addEventListener('beforeinstallprompt', e => { e.preventDefault(); $('#install').hidden = false; $('#install').onclick = async () => { $('#menu').open = false; e.prompt(); await e.userChoice; $('#install').hidden = true; }; });
addEventListener('appinstalled', () => { $('#install').hidden = true; });

// ---- frame ------------------------------------------------------------------
let last = 0, time = 0, timeScale = 1;
function frame(now) {
  requestAnimationFrame(frame);
  const gap = now - last, dt = Math.min(gap / 1000 || 0, 0.05) * timeScale; last = now; if (document.hidden) return; time += dt;
  if (++frameCount > 20) watchFrameRate(gap); window.__frames = frameCount;
  const still = reduced.matches;
  for (const [id, m] of Object.entries(mechs)) {
    const diff = m.target - m.angle;
    if (Math.abs(diff) < 0.002 || still) { m.angle = m.target; if (m.moving && !m.dragging) { m.moving = false; sound.click(); if (m.after) { sound.join(); m.after = false; } } }
    else if (data.mechs[id].glide) m.angle += Math.sign(diff) * Math.min(Math.abs(diff), dt * (Math.PI / 2) / data.mechs[id].glide); // a slow, steady glide
    else m.angle += diff * Math.min(1, dt * (m.dragging ? 18 : 7));
    if (!data.mechs[id].track) view.mechs[id].group.rotation[data.mechs[id].axis ?? 'y'] = m.angle;
  }
  updatePassage(dt); updateAuto(dt); updateWalk(dt); updateParty(dt / timeScale); updateIntro(now); if (!auto && !model.won) nudge(now);
  if (finale) { // pull back and follow her out
    finale.t += dt; const k = still ? 1 : Math.min(1, finale.t / 18), e = k * k * (3 - 2 * k), boat = live(Object.keys(data.nodes).find(n => data.nodes[n].arm === data.finale));
    camera.zoom = 1 / (1 + 0.5 * e); camera.updateProjectionMatrix(); focus.copy(baseFocus).lerp(boat, 0.45 * e); aim();
    if ((finale.t > 9 || still) && $('#finish').hidden) showFinish();
  }
  for (const [id, w] of Object.entries(walkers)) w.update(dt, time, walk?.who === id, still);
  const lead = walkers[model.active].group.position; marker.position.set(lead.x, lead.y + 0.02, lead.z); marker.visible = model.travellers.length > 1 && walkers[model.active].group.visible && !walk?.points[0]?.slide; if (!still) marker.scale.setScalar(1 + Math.sin(time * 3) * 0.06);
  view.update(time, model, still, mechs, live); cursor.update(time, still); marg.update(dt, time, still); updateMarks(time, still);
  if (!still) for (const b of birds) { const u = b.userData, a = time * u.speed + u.phase; b.position.set(flock.x + Math.cos(a) * u.r, u.h + Math.sin(a * 2.3) * 0.5, flock.z + Math.sin(a) * u.r); b.rotation.y = -a; const flap = Math.sin(time * 9 + u.phase) * 0.12, p = b.geometry.attributes.position; p.setY(1, flap); p.setY(5, flap); p.needsUpdate = true; }
  if (water) water.uniforms.time.value = still ? 0 : time;
  pipeline.uniforms.focus.value = DIST - lead.clone().sub(focus).dot(TOWARD) * 0.3;
  if (frameCount % thin) return;
  if (water && quality > 0 && (quality === 2 || frameCount % 2 === 0)) water.renderReflection(renderer, scene, camera);
  pipeline.render(scene, camera, still ? 0 : time);
  if (wantCard) takeCard();
}

applyPalette(palette); resize(); if (lite) setQuality(0); restart();
// A small handle for automated checks; not used by the game itself.
window.__voyage = {
  set speed(v) { timeScale = v; }, model, go, turn, restart, switchTo, mechs, get travelling() { return travel?.kind ?? null; }, get walking() { return !!walk; }, get zoom() { return camera.zoom; },
  // For automated checks only: play the solver's moves through at once and show the finish card.
  solve() { for (let i = 0; i < 200 && !model.won; i++) model.apply(model.hint()); for (const id of Object.keys(mechs)) mechs[id].angle = mechs[id].target = angleOf(model.mechs[id]); walk = null; finish(); },
  screenOf: id => screenOf(live(id)), screenAt: p => screenOf(new T.Vector3(...p)), walkerOf: id => screenOf(walkers[id].group.position.clone().setY(walkers[id].group.position.y + 0.5)),
  get quality() { return quality; }, tapFor, whatAt: (x, y) => { const h = pick({ clientX: x, clientY: y }); return { intent: intentOf(h, x, y), data: h && Object.fromEntries(Object.entries(h.data).filter(([, v]) => typeof v !== 'object' || Array.isArray(v))) }; },
  leverOf: node => { const k = view.hits.find(h => h.userData.lever && h.userData.near[0] === node); return screenOf(k.getWorldPosition(new T.Vector3())); },
  hubOf: id => screenOf(view.mechs[id].hub), flagAt: () => (view.flagPoint ? screenOf(view.flagPoint()) : null), eggAt: () => screenOf(cursor.group.position.clone().setY(cursor.group.position.y + 0.2)), margAt: () => screenOf(marg.group.position.clone().setY(marg.group.position.y + 0.25)), get busy() { return !!walk || Object.values(mechs).some(m => m.moving); },
  frame: view.frame.map(p => screenOf(new T.Vector3(...p)))
};
if (params.has('auto')) setAuto(true);
requestAnimationFrame(t => { frame(t); $('#loading').classList.add('done'); });
