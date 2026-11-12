import * as T from '../../tower/vendor/three.js';
import { createBoat } from '../boat.js';
// The Golden Gate Bridge in fog, modelled from a photograph: two stepped towers in International Orange, the main
// cables and their suspenders, the deck on its truss, Fort Point under the city approach and the Marin hills beyond.
// The fog bank is real geometry that sinks onto the deck or lifts into the towers. The derrick on the near tower,
// the barrier and the lift are this chapter's liberties. Positions must agree with chapters/bridge.mjs.
const SEA = -4, TX = 7, LEG = 1.75, TOP = 8;
export function createBridgeScene(kit, data) {
  const { mats, add, box, cyl, cone, tree, mergeStatic } = kit, group = new T.Group(), hits = [], mechs = {};
  const ghost = () => new T.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
  const quiet = data.quiet === true, five = data.id === 'return'; // quiet: sailed under, nothing to solve (unused now)
  const slab = (mat, a, b, near) => { const m = box(group, mat, a, b); m.userData.near = near; hits.push(m); return m; };
  // Height of the main cables above the deck at x.
  const cableY = x => { const a = Math.abs(x); if (a <= TX) return 1.6 + (TOP + 0.05 - 1.6) * (a / TX) ** 2; const t = (a - TX) / 8; return (TOP + 0.05) * (1 - t) + 0.5 * t - Math.sin(t * Math.PI) * 0.5; };
  // A foghorn on a post. Tapping it sounds the horn.
  function horn(x, y, z, node) {
    cyl(group, mats.iron, x, y, y + 0.7, z, 0.035, { seg: 8 }); const h = cone(group, mats.brass, x + 0.18, y + 0.62, y + 0.98, z, 0.16, 16); h.rotation.z = Math.PI / 2; h.position.set(x + 0.16, y + 0.75, z);
    const grab = add(new T.SphereGeometry(0.42, 12, 8), ghost(), x + 0.08, y + 0.5, z, group); grab.castShadow = grab.receiveShadow = false; grab.userData = { lever: 'fog', near: [node] }; hits.push(grab);
  }

  // ---- deck, truss, rails ----
  slab(mats.road, [-20, -0.25, -1.2], [20, 0, 1.2], ['fort', 'mid', 'marin']);
  if (quiet) { const sea = add(new T.BoxGeometry(34, 0.05, 34), ghost(), 0, SEA + 0.02, 0, group); sea.castShadow = sea.receiveShadow = false; sea.userData.near = ['ocean', 'strait', 'bay']; hits.push(sea); }
  for (let x = -19.5; x < 20; x += 1) { const d = box(group, mats.yellow, [x, 0, -0.03], [x + 0.5, 0.004, 0.03]); d.castShadow = false; }
  for (const z of [-1.24, 1.24]) { box(group, mats.orange, [-15, 0, z - 0.04], [15, 0.28, z + 0.04]); box(group, mats.orange, [-15, -1.05, z - 0.05], [15, -0.93, z + 0.05]); box(group, mats.orange, [-15, -0.33, z - 0.05], [15, -0.25, z + 0.05]);
    for (let x = -15; x <= 15; x += 1) { box(group, mats.orange, [x - 0.03, -1.0, z - 0.04], [x + 0.03, -0.25, z + 0.04]); if (x < 15) { const d = add(new T.BoxGeometry(1.22, 0.05, 0.05), mats.orange, x + 0.5, -0.64, z, group); d.rotation.z = (Math.round(x) % 2 ? 1 : -1) * 0.61; } } }
  // ---- towers ----
  for (const tx of [-TX, TX]) {
    box(group, mats.stone, [tx - 1.5, SEA - 1, -3], [tx + 1.5, SEA + 0.7, 3]);
    for (const z of [-LEG, LEG]) for (const [y0, y1, w] of [[SEA + 0.7, 0, 0.52], [0, 2.4, 0.46], [2.4, 4.4, 0.41], [4.4, 6.1, 0.36], [6.1, 7.75, 0.31]]) box(group, mats.orange, [tx - w, y0, z - w * 1.05], [tx + w, y1, z + w * 1.05]);
    for (const [y0, y1, w] of [[-1.5, -1.0, 0.4], [2.15, 2.75, 0.36], [4.15, 4.65, 0.32], [5.85, 6.3, 0.28], [7.3, 7.75, 0.3]]) { box(group, mats.orange, [tx - w, y0, -LEG], [tx + w, y1, LEG]); box(group, mats.orange, [tx - w - 0.05, y1 - 0.08, -LEG - 0.2], [tx + w + 0.05, y1, LEG + 0.2]); }
    slab(mats.walk, [tx - 0.95, 7.75, -2.3], [tx + 0.95, 8, 2.3], [tx < 0 ? 'topW' : 'topE']);
    for (const z of [-LEG, LEG]) { cyl(group, mats.orange, tx, 8, 8.5, z, 0.16, { seg: 12 }); add(new T.SphereGeometry(0.08, 10, 8), mats.red, tx, 8.58, z, group); }
  }
  // ---- main cables, suspenders, anchorages ----
  for (const z of [-LEG, LEG]) {
    const pts = []; for (let x = -15; x <= 15.01; x += 0.5) pts.push(new T.Vector3(x, cableY(x), z));
    const c = add(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 240, 0.075, 8), mats.orange, 0, 0, 0, group); c.userData.dynamic = true;
    for (let x = -14.5; x <= 14.5; x += 0.5) { if (Math.abs(Math.abs(x) - TX) < 0.4) continue; const y = cableY(x); if (y > 0.45) cyl(group, mats.orange, x, 0.28, y, z > 0 ? 1.26 + (z - 1.26) * 1 : -1.26 + (z + 1.26) * 1, 0.012, { seg: 4 }); }
    for (const x of [-15.4, 15.4]) box(group, mats.stone, [x - 0.7, -0.3, z - 0.45], [x + 0.7, 0.75, z + 0.45]);
  }
  // ---- the derrick on the near tower: a turntable, a walkable boom, a mast and stay ----
  if (!quiet)  { const m = data.mechs.derrick, g = new T.Group(); g.userData.dynamic = true; g.position.set(m.hub[0], 0, m.hub[2]); group.add(g);
    const disc = cyl(g, mats.walk, 0, 7.76, 8.006, 0, 0.88, { seg: 40 }); disc.userData = { near: ['topW'], mech: 'derrick' }; hits.push(disc);
    const arm = box(g, mats.walk, [0.5, 7.75, -0.5], [3.5, 8, 0.5]); arm.userData = { near: ['boom', 'topW'], mech: 'derrick' }; hits.push(arm);
    for (const z of [-0.5, 0.5]) { box(g, mats.orange, [0.4, 7.6, z - 0.04], [3.5, 7.75, z + 0.04]); }
    cyl(g, mats.orange, -0.7, 8, 9.9, 0, 0.05, { seg: 8 }); const stay = add(new T.BoxGeometry(4.6, 0.03, 0.03), mats.iron, 1.4, 8.95, -0.48, g); stay.rotation.z = -0.43;
    const ring = add(new T.TorusGeometry(0.5, 0.03, 8, 40), mats.brass, 0, 8.012, 0, g); ring.rotation.x = Math.PI / 2; ring.castShadow = false;
    const knob = add(new T.SphereGeometry(0.4, 12, 8), ghost(), -0.7, 8.5, 0, g); knob.castShadow = knob.receiveShadow = false; knob.userData = { mech: 'derrick', handle: true }; hits.push(knob);
    mechs.derrick = { group: g, hub: new T.Vector3(m.hub[0], 8, m.hub[2]) }; }
  const fogAnchor = new T.Group(); group.add(fogAnchor); mechs.fog = { group: fogAnchor, hub: new T.Vector3(0, 4, 0) };
  // The lift on the far tower, the roadworks barriers and the foghorns.
  box(group, mats.iron, [TX - 0.3, 0, LEG - 0.5], [TX + 0.3, 1.25, LEG - 0.44]); box(group, mats.orange, [TX - 0.4, 8, -0.9], [TX + 0.4, 8.9, -0.4]);
  const plateNode = five ? 'marin' : 'mid', plate = add(new T.CylinderGeometry(0.36, 0.36, 0.04, 32), mats.brass, data.nodes[plateNode].pos[0], 0.02, 0, group); plate.userData.dynamic = true; plate.castShadow = false;
  // Roadworks barriers, each held open from a tower top.
  const barriers = (five ? [[-3.5, 'topW'], [3.5, 'topE']] : [[3.5, 'topW']]).map(([x, plateAt]) => { cyl(group, mats.white, x, 0, 0.62, 1.12, 0.05, { seg: 8 }); const b = new T.Group(); b.userData.dynamic = true; b.position.set(x, 0.55, 1.12); group.add(b);
    for (let i = 0; i < 5; i++) { const m = add(new T.CylinderGeometry(0.035, 0.035, 0.45, 8), i % 2 ? mats.white : mats.red, 0, 0, -(i + 0.5) * 0.45, b); m.rotation.x = Math.PI / 2; } return { group: b, plateAt, t: 0 }; });
  for (const tx of five ? [-TX, TX] : [-TX]) { const p = add(new T.CylinderGeometry(0.3, 0.3, 0.03, 28), mats.brass, tx, 8.02, 1.3, group); p.castShadow = false; }
  if (!quiet) { horn(-16.35, 0, -4.6, 'point'); horn(13.4, 0, -0.85, 'marin'); horn(TX + 0.55, 8, -1.2, 'topE'); }
  // The hatch in the sea wall: a low brick arch only a child fits, with the derrick's wheel inside.
  slab(mats.walk, [-18.5, -0.3, -5.5], [-16.5, 0, -4.5], ['hatch', 'point']); box(group, mats.brick, [-19.1, 0, -5.7], [-18.3, 0.75, -4.3]); box(group, mats.iron, [-18.31, 0, -5.25], [-18.29, 0.5, -4.75]); const wheelRim = add(new T.TorusGeometry(0.2, 0.03, 8, 20), mats.brass, -18.28, 0.52, -4.5, group); wheelRim.rotation.y = Math.PI / 2;
  { const grab = add(new T.SphereGeometry(0.42, 12, 8), ghost(), -18.1, 0.45, -5, group); grab.castShadow = grab.receiveShadow = false; grab.userData = { lever: 'derrick', near: ['hatch'] }; hits.push(grab); }

  // ---- the city shore: Fort Point under the approach, the sea wall, the Presidio trees, the skyline far off ----
  box(group, mats.land, [-60, SEA - 1, -3], [-12.2, -0.3, 40]).castShadow = false; box(group, mats.land, [-60, SEA - 1, -40], [-15.6, -0.3, -3]).castShadow = false;
  box(group, mats.rock, [-12.5, SEA - 1, -3], [-11.9, -0.45, 12]); box(group, mats.rock, [-15.9, SEA - 1, -14], [-15.3, -0.45, -3]);
  box(group, mats.brick, [-15.8, -0.3, 2.3], [-12.7, 1.5, 5.2]); box(group, mats.stone, [-15.86, 1.5, 2.24], [-12.64, 1.62, 5.26]); box(group, mats.iron, [-15.3, 1.5, 2.8], [-13.2, 1.63, 4.7]);
  for (let x = -19; x <= -13; x += 2) box(group, mats.stone, [x - 0.2, -0.3, -1.1], [x + 0.2, -0.25, 1.1]);
  { const len = Math.hypot(3, 5), p = add(new T.BoxGeometry(len, 0.3, 0.9), mats.walk, -14.5, -0.15, -2.5, group); p.rotation.y = -Math.atan2(-5, -3); p.userData.near = ['fort', 'point']; hits.push(p); }
  slab(mats.walk, [-16.5, -0.3, -5.5], [-15.5, 0, -4.5], ['point']);
  for (const [x, z, s] of [[-19, 4.5, 1.6], [-21.5, 2.6, 1.9], [-23, 6.4, 1.5], [-18.4, -6.2, 1.5], [-21, -4.2, 1.8], [-24.5, -7.5, 2.0], [-20.2, -10.5, 1.6], [-26, 0.5, 2.1], [-28, -4.5, 1.8], [-19.5, 9.5, 1.7], [-25, 11, 2.0]]) tree(group, x, -0.3, z, s);
  for (let i = 0; i < 16; i++) { const x = -78 + (i * 37 % 30), z = -18 + i * 3.6, h = 5 + (i * 53 % 11); const b = box(group, mats.city, [x, -0.3, z], [x + 2.6, h, z + 2.6]); b.castShadow = false; }
  { const p = cone(group, mats.city, -62, -0.3, 17, 6, 2.2, 4); p.rotation.y = Math.PI / 4; p.castShadow = false; }
  // ---- the Marin shore and its hills ----
  box(group, mats.scrub, [12.2, SEA - 1, -40], [60, -0.3, 14]).castShadow = false; box(group, mats.rock, [11.9, SEA - 1, -14], [12.5, -0.45, 9]);
  for (const [x, z, rx, ry, rz] of [[24, -13, 13, 7.5, 9], [16.5, -8.5, 5.5, 3.6, 4.2], [36, -2, 12, 6, 9], [14.8, -4.6, 2.6, 1.9, 2.2], [30, -30, 18, 10, 11]]) { const h = add(new T.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), mats.scrub, x, -0.3, z, group); h.scale.set(rx, ry, rz); }
  for (const [x, z, s] of [[15.5, -2.6, 1.1], [18, -5, 1.3], [14, 4.5, 1.0], [20.5, 3.5, 1.4]]) tree(group, x, -0.3, z, s);

  // ---- fog: one bank that sinks onto the deck or lifts into the towers, and still banks far off ----
  const fogMat = new T.MeshStandardMaterial({ color: '#f1efea', transparent: true, opacity: 0.46, depthWrite: false, roughness: 1, emissive: '#9c9c9c', emissiveIntensity: 0.35 });
  const fog = new T.Group(); fog.userData.dynamic = true; group.add(fog); const puffs = [];
  const rnd = (i, s) => { const n = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return n - Math.floor(n); };
  for (let i = 0; i < 60; i++) { const r = 1.2 + rnd(i, 1) * 1.7, p = add(new T.IcosahedronGeometry(r, 2), fogMat, -11.2 + rnd(i, 2) * 22.4, (rnd(i, 3) - 0.5) * 1.3, -4 + rnd(i, 4) * 8, fog); p.scale.y = 0.42; p.castShadow = p.receiveShadow = false; puffs.push({ mesh: p, x: p.position.x, phase: rnd(i, 5) * 6 }); }
  const far = new T.Group(); far.userData.dynamic = true; group.add(far);
  for (let i = 0; i < 16; i++) { const r = 6 + rnd(i, 6) * 7, p = add(new T.IcosahedronGeometry(r, 2), fogMat, -50 + rnd(i, 7) * 80, 1 + rnd(i, 8) * 3, -22 - rnd(i, 9) * 34, far); p.scale.y = 0.3; p.castShadow = p.receiveShadow = false; }

  for (const [id, n] of Object.entries(data.nodes)) if (n.pos) { const h = add(new T.BoxGeometry(1, 0.06, 1), ghost(), n.pos[0], n.pos[1] + 0.03, n.pos[2], group); h.castShadow = h.receiveShadow = false; h.userData.near = [id]; hits.push(h); }
  mergeStatic(group, new Set(hits));
  // The walk along the near main cable, tower top to tower top.
  const along = [new T.Vector3(-TX, 8, LEG)]; for (let x = -TX + 0.5; x < TX; x += 0.5) along.push(new T.Vector3(x, cableY(x) + 0.07, LEG)); along.push(new T.Vector3(TX, 8, LEG));
  const back = along.slice().reverse(); along.slow = back.slow = true;
  let fogY = quiet ? -2.4 : 0.5, open = 0, held = 0, boat = null;
  function update(time, model, still) {
    const want = quiet ? (model.mechs.fog ? 3 : -2.4) : model.mechs.fog ? 8.6 : 0.5; fogY = still ? want : fogY + (want - fogY) * 0.035; fog.position.y = fogY;
    if (quiet) { const o = model.mechs.fog ? 0.05 : 0.5; fogMat.opacity = still ? o : fogMat.opacity + (o - fogMat.opacity) * 0.03; boat?.setLanterns(2 + (model.items.has('lantern3') ? 1 : 0)); }
    if (!still) for (const p of puffs) p.mesh.position.x = p.x + Math.sin(time * 0.12 + p.phase) * 1.4;
    const h = model.pressed(plateNode) ? 1 : 0; held = still ? h : held + (h - held) * 0.12; plate.position.y = 0.02 - held * 0.03;
    for (const b of barriers) { const o = model.pressed(b.plateAt) ? 1 : 0; b.t = still ? o : b.t + (o - b.t) * 0.12; b.group.rotation.x = b.t * Math.PI / 2 * 0.95; }
  }
  const makeWalker = quiet ? () => (boat = createBoat({ figures: true })) : undefined;
  const frame = [...(quiet ? [[0, SEA, 12.5], [0, SEA, -12.5]] : []), [-19.3, 0, -5.8], [-19, 0, 1.6], [-TX, 10, -2.3], [-TX, 8, 3.7], [TX, 9.2, 2.3], [TX, 9.2, -2.3], [15.6, 0, 1.6], [14, SEA, 2.4], [-TX, SEA, 3]];
  return { group, hits, mechs, update, frame, makeWalker, tapSelf: quiet ? 'fog' : undefined, routes: { 'topW>topE': along, 'topE>topW': back }, water: SEA, birds: { x: 0, z: 3, h: 10.5, color: '#f4f4f0' }, shadowSize: 34 };
}
