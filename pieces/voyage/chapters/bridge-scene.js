import * as T from '../../tower/vendor/three.js';
import { createBoat } from '../boat.js';
// The Golden Gate Bridge in fog, modelled from a photograph: two stepped towers in International Orange, the main
// cables and their suspenders, the deck on its truss, Fort Point under the city approach and the Marin hills beyond.
// The fog bank is real geometry that sinks onto the deck or lifts into the towers. The derrick on the near tower,
// the barrier and the lift are this chapter's liberties. Positions must agree with chapters/bridge.mjs.
// Around the puzzle the place goes about its afternoon: the fog breathes, the tower lamps blink, a container ship
// passes under the span, a sloop tacks off Lime Point, swell washes the tower footings and, while the fog lies on
// the deck, headlamps creep through it. None of that can be tapped, and all of it holds still for reduced motion.
const SEA = -4, TX = 7, LEG = 1.75, TOP = 8;
export function createBridgeScene(kit, data) {
  const { mats, add, box, cyl, cone, roof, tree, mergeStatic } = kit, group = new T.Group(), hits = [], mechs = {};
  const ghost = () => new T.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
  const quiet = data.quiet === true, five = data.id === 'return'; // quiet: sailed under, nothing to solve (unused now)
  const rnd = (i, s) => { const n = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return n - Math.floor(n); };
  const M = (color, extra = {}) => new T.MeshStandardMaterial({ color, roughness: 0.8, ...extra });
  const soft = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <opaque_fragment>', 'diffuseColor.a *= smoothstep(0.0, 0.62, abs(normal.z));\n#include <opaque_fragment>'); };
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
  // The road does not stop at the puzzle's edge: it runs on into the Presidio one way and into the Marin hill the other.
  box(group, mats.road, [-60, -0.25, -1.2], [-20, 0, 1.2]); box(group, mats.road, [20, -0.25, -1.2], [26, 0, 1.2]);
  for (let x = -44.5; x < 26; x += 1) if (x < -20 || x > 20) { const d = box(group, mats.yellow, [x, 0, -0.03], [x + 0.5, 0.004, 0.03]); d.castShadow = false; }
  for (const z of [-1.24, 1.24]) { box(group, mats.orange, [-15, 0, z - 0.04], [15, 0.28, z + 0.04]); box(group, mats.orange, [-15, -1.05, z - 0.05], [15, -0.93, z + 0.05]); box(group, mats.orange, [-15, -0.33, z - 0.05], [15, -0.25, z + 0.05]);
    for (let x = -15; x <= 15; x += 1) { box(group, mats.orange, [x - 0.03, -1.0, z - 0.04], [x + 0.03, -0.25, z + 0.04]); if (x < 15) { const d = add(new T.BoxGeometry(1.22, 0.05, 0.05), mats.orange, x + 0.5, -0.64, z, group); d.rotation.z = (Math.round(x) % 2 ? 1 : -1) * 0.61; } } }
  // ---- towers, each leg topped with a red aviation lamp that blinks slowly ----
  const lampMat = M('#c8402f', { emissive: '#ff3b24', emissiveIntensity: 1.2 });
  for (const tx of [-TX, TX]) {
    box(group, mats.stone, [tx - 1.5, SEA - 1, -3], [tx + 1.5, SEA + 0.7, 3]);
    for (const z of [-LEG, LEG]) for (const [y0, y1, w] of [[SEA + 0.7, 0, 0.52], [0, 2.4, 0.46], [2.4, 4.4, 0.41], [4.4, 6.1, 0.36], [6.1, 7.75, 0.31]]) box(group, mats.orange, [tx - w, y0, z - w * 1.05], [tx + w, y1, z + w * 1.05]);
    for (const [y0, y1, w] of [[-1.5, -1.0, 0.4], [2.15, 2.75, 0.36], [4.15, 4.65, 0.32], [5.85, 6.3, 0.28], [7.3, 7.75, 0.3]]) { box(group, mats.orange, [tx - w, y0, -LEG], [tx + w, y1, LEG]); box(group, mats.orange, [tx - w - 0.05, y1 - 0.08, -LEG - 0.2], [tx + w + 0.05, y1, LEG + 0.2]); }
    slab(mats.walk, [tx - 0.95, 7.75, -2.3], [tx + 0.95, 8, 2.3], [tx < 0 ? 'topW' : 'topE']);
    for (const z of [-LEG, LEG]) { cyl(group, mats.orange, tx, 8, 8.5, z, 0.16, { seg: 12 }); const l = add(new T.SphereGeometry(0.08, 10, 8), lampMat, tx, 8.58, z, group); l.userData.dynamic = true; l.castShadow = false; }
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
  for (const [x, z, s] of [[-19, 4.5, 1.6], [-21.5, 2.6, 1.9], [-23, 6.4, 1.5], [-18.4, -6.2, 1.5], [-21, -4.2, 1.8], [-24.5, -7.5, 2.0], [-20.2, -10.5, 1.6], [-26.5, 3.6, 2.1], [-28, -4.5, 1.8], [-19.5, 9.5, 1.7], [-25, 11, 2.0]]) tree(group, x, -0.3, z, s);
  for (let i = 0; i < 16; i++) { const x = -78 + (i * 37 % 30), z = -18 + i * 3.6, h = 5 + (i * 53 % 11); const b = box(group, mats.city, [x, -0.3, z], [x + 2.6, h, z + 2.6]); b.castShadow = false; }
  { const p = cone(group, mats.city, -62, -0.3, 17, 6, 2.2, 4); p.rotation.y = Math.PI / 4; p.castShadow = false; }
  // Fort Point's gun ports, two tiers on each face that shows.
  for (const y of [0.18, 0.86]) for (let i = 0; i < 5; i++) { box(group, mats.iron, [-15.4 + i * 0.58, y, 5.19], [-15.18 + i * 0.58, y + 0.32, 5.215]).castShadow = false; box(group, mats.iron, [-12.715, y, 2.64 + i * 0.58], [-12.69, y + 0.32, 2.86 + i * 0.58]).castShadow = false; }
  // Bluffs, not walls: crags of rock stand along both shores, tall against the cliff and low out in the water,
  // and all of them lower than anything anyone walks on. A strip of beach lies below the Presidio.
  const crag = (x, z, r, y1, seg = 7) => cyl(group, mats.rock, x, SEA - 1, y1, z, r, { rTop: r * 0.7, seg });
  for (let i = 0; i < 20; i++) { const z = 5.8 + i * 1.75 + rnd(i, 11) * 0.8; crag(-11.75 + rnd(i, 12) * 0.5, z, 0.85 + rnd(i, 13) * 0.6, -0.5 - rnd(i, 14) ** 2 * 1.6); if (i % 2) crag(-10.4 + rnd(i, 15) * 0.9, z + 0.7, 0.45 + rnd(i, 16) * 0.5, SEA + 0.25 + rnd(i, 17) * 1.3, 6); }
  for (const [z, y] of [[-2.4, -1.7], [-0.3, -2.3], [1.9, -1.6], [4, -1.2]]) crag(-11.6, z, 0.8, y);
  for (let i = 0; i < 15; i++) { const z = -7 - i * 2.3 - rnd(i, 18) * 0.8; crag(-15.15 + rnd(i, 19) * 0.5, z, 0.8 + rnd(i, 20) * 0.6, -0.5 - rnd(i, 21) ** 2 * 1.6); if (i % 2) crag(-13.8 + rnd(i, 22) * 0.8, z - 0.8, 0.45 + rnd(i, 23) * 0.4, SEA + 0.25 + rnd(i, 24) * 1.2, 6); }
  box(group, mats.sand, [-12.4, SEA - 1, 13], [-9.3, SEA + 0.07, 27]).castShadow = false; box(group, mats.sand, [-9.4, SEA - 1, 14.5], [-8.6, SEA + 0.04, 25.5]).castShadow = false;
  // The Presidio is rolling ground, not a lawn: low grassy rises, with more trees standing on them.
  const rise = (mat, list) => { for (const [x, z, rx, ry, rz] of list) { const h = add(new T.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), mat, x, -0.3, z, group); h.scale.set(rx, ry, rz); }
    return (x, z) => list.reduce((m, [hx, hz, rx, ry, rz]) => Math.max(m, ry * Math.sqrt(Math.max(0, 1 - ((x - hx) / rx) ** 2 - ((z - hz) / rz) ** 2))), 0) - 0.3; };
  const park = rise(mats.land, [[-34, 18, 8, 1.3, 7], [-35, -13, 10, 1.7, 8], [-22.5, 17, 4.5, 0.7, 3.5], [-46, 4, 9, 2.2, 8], [-27, -22, 7, 1.1, 6]]);
  for (let i = 0; i < 22; i++) { const x = -23 - rnd(i, 25) * 24, z = -26 + rnd(i, 26) * 52; if (Math.abs(z) > 2.6) tree(group, x, park(x, z) - 0.05, z, 1.3 + rnd(i, 27) * 0.9); }
  // ---- the Marin shore and its hills ----
  box(group, mats.scrub, [12.2, SEA - 1, -40], [60, -0.3, 14]).castShadow = false; box(group, mats.rock, [11.9, SEA - 1, -14], [12.5, -0.45, 9]);
  const hill = rise(mats.scrub, [[24, -13, 13, 7.5, 9], [16.5, -8.5, 5.5, 3.6, 4.2], [36, -2, 12, 6, 9], [14.8, -4.6, 2.6, 1.9, 2.2], [30, -30, 18, 10, 11], [22, 9.5, 5, 0.8, 3.6], [33, 10, 7, 1.5, 3.8]]);
  // The headlands are golden grass patched with dark coyote brush and a few outcrops; the brush keeps off the road.
  const sage = M('#4f5c3a', { roughness: 1 });
  for (let i = 0; i < 150; i++) { const x = 13.2 + rnd(i, 31) * 36, z = -36 + rnd(i, 32) * 49.5; if (Math.abs(z) < 2.7 && x < 26) continue;
    const r = 0.25 + rnd(i, 33) * 0.45, b = add(new T.IcosahedronGeometry(r, 1), i % 5 ? sage : mats.leaf, x, hill(x, z) + r * 0.15, z, group); b.scale.set(1 + rnd(i, 34) * 0.5, 0.72, 1 + rnd(i, 35) * 0.5); }
  for (let i = 0; i < 12; i++) { const x = 15 + rnd(i, 36) * 30, z = -30 + rnd(i, 37) * 26, y = hill(x, z), r = 0.4 + rnd(i, 38) * 0.5; cyl(group, mats.rock, x, y - 0.6, y + 0.25 + rnd(i, 39) * 0.4, z, r, { rTop: r * 0.6, seg: 6 }); }
  for (let i = 0; i < 24; i++) { const x = 12.5 + i * 1.9 + rnd(i, 41) * 0.8; crag(x, 14.15 + rnd(i, 42) * 0.4, 0.85 + rnd(i, 43) * 0.6, -0.5 - rnd(i, 44) ** 2 * 1.6); if (i % 2) crag(x + 0.8, 15.4 + rnd(i, 45) * 0.9, 0.45 + rnd(i, 46) * 0.5, SEA + 0.25 + rnd(i, 47) * 1.3, 6); }
  for (const [z, y] of [[13, -0.8], [11, -1.5], [8.6, -0.9], [6.3, -1.9], [4, -1.1], [1.6, -2.2], [-0.8, -1.8], [-3.2, -1], [-5.6, -1.7], [-8, -0.8], [-10.5, -1.4]]) crag(11.75, z, 0.8, y);
  // Lime Point light on the near corner of the shore: a white tower with a lit lamp room, and the keeper's hut.
  cyl(group, mats.white, 14.6, -0.3, 1.3, 11.6, 0.34, { rTop: 0.24, seg: 16 }); cyl(group, mats.iron, 14.6, 1.3, 1.36, 11.6, 0.36, { seg: 16 }); cyl(group, M('#fff0c4', { emissive: '#ffcf7a', emissiveIntensity: 1.3 }), 14.6, 1.36, 1.64, 11.6, 0.17, { seg: 12 }); cone(group, mats.red, 14.6, 1.64, 1.94, 11.6, 0.25, 12);
  box(group, mats.white, [15.3, -0.3, 11], [16.4, 0.3, 12]); roof(group, mats.tile, [15.2, 10.9], [16.5, 12.1], 0.3, 0.3);
  for (const [x, z, s] of [[15.5, -2.6, 1.1], [18, -5, 1.3], [14, 4.5, 1.0], [20.5, 3.5, 1.4]]) tree(group, x, -0.3, z, s);

  // ---- fog: one bank that sinks onto the deck or lifts into the towers, and still banks far off ----
  // Each puff thins away towards its rim, so the bank reads as one soft mass and not as a pile of balls.
  const fogMat = new T.MeshStandardMaterial({ color: '#f1efea', transparent: true, opacity: 0.66, depthWrite: false, roughness: 1, emissive: '#9c9c9c', emissiveIntensity: 0.35 });
  fogMat.onBeforeCompile = soft;
  const fog = new T.Group(); fog.userData.dynamic = true; group.add(fog); const puffs = [];
  for (let i = 0; i < 60; i++) { const r = 1.2 + rnd(i, 1) * 1.7, p = add(new T.IcosahedronGeometry(r, 2), fogMat, -11.2 + rnd(i, 2) * 22.4, (rnd(i, 3) - 0.5) * 1.3, -4 + rnd(i, 4) * 8, fog); p.scale.y = 0.42; p.castShadow = p.receiveShadow = false; puffs.push({ mesh: p, x: p.position.x, y: p.position.y, phase: rnd(i, 5) * 6 }); }
  const far = new T.Group(); far.userData.dynamic = true; group.add(far);
  for (let i = 0; i < 16; i++) { const r = 6 + rnd(i, 6) * 7, p = add(new T.IcosahedronGeometry(r, 2), fogMat, -50 + rnd(i, 7) * 80, 1 + rnd(i, 8) * 3, -22 - rnd(i, 9) * 34, far); p.scale.y = 0.3; p.castShadow = p.receiveShadow = false; }

  // ---- the afternoon's traffic: everything below only moves, and none of it is a tap target ----
  // A container ship, stern house aft and boxes stacked forward, low enough to pass under the truss. Bow towards +z.
  const ship = new T.Group(); group.add(ship); { const hull = M('#2b3440'), paints = [mats.red, mats.blue, mats.cream];
    box(ship, hull, [-0.5, -0.3, -2.1], [0.5, 0.42, 1.7]); const bow = add(new T.BoxGeometry(0.707, 0.72, 0.707), hull, 0, 0.06, 1.7, ship); bow.rotation.y = Math.PI / 4; box(ship, mats.red, [-0.51, -0.3, -2.11], [0.51, 0.03, 1.71]);
    for (let i = 0; i < 5; i++) for (const x of [-0.23, 0.23]) for (let k = 0; k < 1 + (i * 3 + (x > 0 ? 1 : 0)) % 3; k++) box(ship, paints[(i + k + (x > 0 ? 1 : 0)) % 3], [x - 0.2, 0.42 + k * 0.27, -1.15 + i * 0.56], [x + 0.2, 0.67 + k * 0.27, -0.63 + i * 0.56]);
    box(ship, mats.white, [-0.42, 0.42, -1.95], [0.42, 1.2, -1.35]); box(ship, hull, [-0.43, 0.95, -1.36], [0.43, 1.08, -1.34]); box(ship, mats.red, [-0.13, 1.2, -1.85], [0.13, 1.55, -1.6]);
    const wake = new T.BufferGeometry(); wake.setAttribute('position', new T.Float32BufferAttribute([0, 0.03, -2, 0.6, 0.03, -4.4, -0.6, 0.03, -4.4], 3)); wake.setAttribute('uv', new T.Float32BufferAttribute([0.5, 0, 1, 1, 0, 1], 2)); wake.computeVertexNormals();
    const w = add(wake, new T.MeshBasicMaterial({ color: '#f4f6f4', transparent: true, opacity: 0.16, depthWrite: false, side: T.DoubleSide }), 0, 0, 0, ship); w.castShadow = w.receiveShadow = false;
    mergeStatic(ship, new Set()); ship.userData.dynamic = true; ship.position.set(2.6, SEA, -15); }
  // A sloop tacking off Lime Point, heeled to the breeze. Its long axis is x; the inner group is what heels.
  const sloop = new T.Group(), heel = new T.Group(); sloop.add(heel); group.add(sloop); { const cloth = M('#f6f1e6', { side: T.DoubleSide, roughness: 0.9 });
    const h = add(new T.SphereGeometry(1, 16, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mats.white, 0, 0.16, 0, heel); h.scale.set(0.95, 0.4, 0.3); box(heel, mats.blue, [-0.7, 0.1, -0.2], [0.7, 0.17, 0.2]); cyl(heel, mats.white, 0.2, 0.1, 2.3, 0, 0.02, { seg: 6 });
    for (const pts of [[0.17, 0.4, 0, 0.17, 2.25, 0, -0.85, 0.4, 0], [0.24, 0.3, 0, 0.24, 1.9, 0, 0.92, 0.3, 0]]) { const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pts, 3)); g.setAttribute('uv', new T.Float32BufferAttribute([0, 0, 0, 1, 1, 0], 2)); g.computeVertexNormals(); add(g, cloth, 0, 0, 0, heel); }
    mergeStatic(heel, new Set()); sloop.userData.dynamic = true; }
  // Swell on the tower footings: two rings of foam round each pier that wash outwards and fade, turn about.
  const foams = [0, 1].map(k => new T.MeshBasicMaterial({ color: '#f6f8f6', transparent: true, opacity: 0.4, depthWrite: false })), wash = [];
  { const ring = new T.Shape([[-1.7, -3.2], [1.7, -3.2], [1.7, 3.2], [-1.7, 3.2]].map(([x, y]) => new T.Vector2(x, y))); ring.holes.push(new T.Path([[-1.5, -3], [-1.5, 3], [1.5, 3], [1.5, -3]].map(([x, y]) => new T.Vector2(x, y)))); const geo = new T.ShapeGeometry(ring); geo.rotateX(-Math.PI / 2);
    for (const tx of [-TX, TX]) for (const k of [0, 1]) { const f = add(geo, foams[k], tx, SEA + 0.03 + k * 0.01, 0, group); f.castShadow = f.receiveShadow = false; f.userData.dynamic = true; wash.push(f); } }
  // Headlamps and tail lamps creeping through the fog, drawn after it so they glow through. They keep to the two
  // outer lanes of the span, and they are only there while the fog lies on the deck and nobody can walk it.
  const CARS = 6, lamps = new T.InstancedMesh(new T.SphereGeometry(0.1, 10, 8), new T.MeshBasicMaterial({ transparent: true, opacity: 0.92, depthWrite: false }), CARS * 2), spot = new T.Object3D();
  lamps.userData.dynamic = true; lamps.frustumCulled = false; lamps.castShadow = lamps.receiveShadow = false; lamps.renderOrder = 2; group.add(lamps);
  for (let i = 0; i < CARS; i++) { lamps.setColorAt(i * 2, new T.Color(2.6, 1.55, 0.35)); lamps.setColorAt(i * 2 + 1, new T.Color(2.3, 0.12, 0.08)); }
  spot.scale.setScalar(0); spot.updateMatrix(); for (let i = 0; i < CARS * 2; i++) lamps.setMatrixAt(i, spot.matrix);
  // And for whoever looks twice: a grey whale in the strait, that blows, shows its back and lifts its tail.
  const whale = new T.Group(); whale.userData.dynamic = true; whale.position.set(-1.4, SEA, 12.2); whale.rotation.y = Math.PI / 4; whale.visible = false; group.add(whale);
  const hide = M('#3b454c', { roughness: 0.45, side: T.DoubleSide }), hump = add(new T.SphereGeometry(1, 16, 10), hide, 0, -0.4, 0, whale); hump.scale.set(0.8, 0.27, 0.3);
  const fluke = add(new T.ShapeGeometry(new T.Shape([[-0.06, 0], [0.06, 0], [0.05, 0.42], [0.52, 0.8], [0.2, 0.7], [0, 0.6], [-0.2, 0.7], [-0.52, 0.8], [-0.05, 0.42]].map(([x, y]) => new T.Vector2(x, y)))), hide, 0.7, -1.2, 0, whale);
  const blowMat = M('#f6f8f6', { transparent: true, opacity: 0, depthWrite: false, emissive: '#9c9c9c', emissiveIntensity: 0.4 }), blow = add(new T.SphereGeometry(0.22, 12, 8), blowMat, -0.55, 0.3, 0, whale); blowMat.onBeforeCompile = soft; blow.castShadow = blow.receiveShadow = false;
  const rippleMat = new T.MeshBasicMaterial({ color: '#f6f8f6', transparent: true, opacity: 0, depthWrite: false }), ripple = add(new T.RingGeometry(0.34, 0.42, 28), rippleMat, 0.7, 0.03, 0, whale); ripple.rotation.x = -Math.PI / 2; ripple.castShadow = ripple.receiveShadow = false;

  for (const [id, n] of Object.entries(data.nodes)) if (n.pos) { const h = add(new T.BoxGeometry(1, 0.06, 1), ghost(), n.pos[0], n.pos[1] + 0.03, n.pos[2], group); h.castShadow = h.receiveShadow = false; h.userData.near = [id]; hits.push(h); }
  mergeStatic(group, new Set(hits));
  // The walk along the near main cable, tower top to tower top.
  const along = [new T.Vector3(-TX, 8, LEG)]; for (let x = -TX + 0.5; x < TX; x += 0.5) along.push(new T.Vector3(x, cableY(x) + 0.07, LEG)); along.push(new T.Vector3(TX, 8, LEG));
  const back = along.slice().reverse(); along.slow = back.slow = true;
  let fogY = quiet ? -2.4 : 0.5, open = 0, held = 0, boat = null, lit = false;
  function update(time, model, still) {
    const want = quiet ? (model.mechs.fog ? 3 : -2.4) : model.mechs.fog ? 8.6 : 0.5; fogY = still ? want : fogY + (want - fogY) * 0.035; fog.position.y = fogY;
    if (quiet) { const o = model.mechs.fog ? 0.05 : 0.5; fogMat.opacity = still ? o : fogMat.opacity + (o - fogMat.opacity) * 0.03; boat?.setLanterns(2 + (model.items.has('lantern3') ? 1 : 0)); }
    // The bank breathes: each puff drifts along the span, rises and falls a little, and swells as it flattens.
    if (!still) { for (const p of puffs) { const b = 1 + Math.sin(time * 0.23 + p.phase * 2.3) * 0.07; p.mesh.position.x = p.x + Math.sin(time * 0.12 + p.phase) * 1.4; p.mesh.position.y = p.y + Math.sin(time * 0.17 + p.phase * 1.7) * 0.12; p.mesh.scale.set(b, 0.42 * (2 - b), b); } far.position.x = Math.sin(time * 0.04) * 3; }
    const t = still ? 0 : time;
    lampMat.emissiveIntensity = still ? 1.2 : 0.25 + 3.4 * Math.max(0, Math.sin(time * 1.5)) ** 4;
    // The ship takes about three minutes from the ocean to the bay and comes round again out of sight.
    ship.position.set(2.6, SEA + Math.sin(t * 0.5) * 0.025, (t * 0.42 + 21) % 78 - 36); ship.rotation.x = Math.sin(t * 0.37) * 0.012;
    { const a = t * 0.085 + 0.6; sloop.position.set(7.8 + Math.cos(a) * 1.3, SEA + Math.sin(t * 1.1) * 0.02, 9.6 + Math.sin(a) * 4.2); sloop.rotation.y = Math.atan2(-Math.cos(a) * 4.2, -Math.sin(a) * 1.3); heel.rotation.x = 0.2 + Math.sin(t * 0.6) * 0.05; }
    for (let i = 0; i < wash.length; i++) { const k = still ? 0.35 : (time * 0.16 + (i % 2) * 0.5) % 1; wash[i].scale.set(1 + k * 0.16, 1, 1 + k * 0.08); if (i < 2) foams[i].opacity = 0.7 * (1 - k) * Math.min(1, k * 6); }
    // Headlamps: gone when motion is reduced, as the fog lifts, and whenever someone is standing out on the span.
    let on = still ? 0 : Math.min(1, Math.max(0, 1 - (fogY - 0.5) * 0.8)); for (const who in model.where) if (model.where[who] === 'mid') on = 0;
    if (on > 0 || lit) { for (let i = 0; i < CARS; i++) { const dir = i % 2 ? -1 : 1, s = (time * 1.05 + i * 7.9) % 26 - 13, k = on * Math.min(1, Math.max(0, (11 - Math.abs(s)) / 2.5));
        spot.position.set(dir * (s + 0.17), 0.15, dir * 0.62); spot.scale.set(0.9 * k, 0.7 * k, 1.7 * k); spot.updateMatrix(); lamps.setMatrixAt(i * 2, spot.matrix);
        spot.position.x = dir * (s - 0.17); spot.scale.set(0.6 * k, 0.5 * k, 1.5 * k); spot.updateMatrix(); lamps.setMatrixAt(i * 2 + 1, spot.matrix); } lamps.instanceMatrix.needsUpdate = true; lit = on > 0; }
    // The whale, most of a minute apart: three seconds of blow and back, then the tail up and under, then a ripple.
    { const u = still ? -1 : (time + 31) % 41; whale.visible = u >= 0 && u < 12; if (whale.visible) {
        const up = u < 4.5 ? Math.sin(u / 4.5 * Math.PI) : 0; hump.position.set(-0.6 + u * 0.14, -0.42 + up * 0.3, 0);
        const puff = u > 0.7 && u < 2.9 ? (u - 0.7) / 2.2 : 0; blowMat.opacity = puff ? 0.9 * Math.sin(puff * Math.PI) : 0; blow.scale.set(0.6 + puff * 0.8, 0.8 + puff * 1.6, 0.6 + puff * 0.8); blow.position.set(hump.position.x - 0.35, 0.15 + puff * 0.55, 0);
        const lift = u > 4 && u < 9 ? Math.sin((u - 4) / 5 * Math.PI) : 0; fluke.position.y = -1.2 + lift * 1.25; fluke.rotation.z = 0.5 - (u - 4) / 5 * 0.9;
        const ring = u > 8 ? (u - 8) / 4 : 0; rippleMat.opacity = ring ? 0.4 * (1 - ring) : 0; ripple.scale.setScalar(1 + ring * 3.2); } }
    const h = model.pressed(plateNode) ? 1 : 0; held = still ? h : held + (h - held) * 0.12; plate.position.y = 0.02 - held * 0.03;
    for (const b of barriers) { const o = model.pressed(b.plateAt) ? 1 : 0; b.t = still ? o : b.t + (o - b.t) * 0.12; b.group.rotation.x = b.t * Math.PI / 2 * 0.95; }
  }
  const makeWalker = quiet ? () => (boat = createBoat({ figures: true })) : undefined;
  const frame = [...(quiet ? [[0, SEA, 12.5], [0, SEA, -12.5]] : []), [-19.3, 0, -5.8], [-19, 0, 1.6], [-TX, 10, -2.3], [-TX, 8, 3.7], [TX, 9.2, 2.3], [TX, 9.2, -2.3], [15.6, 0, 1.6], [14, SEA, 2.4], [-TX, SEA, 3]];
  return { group, hits, mechs, update, frame, makeWalker, tapSelf: quiet ? 'fog' : undefined, routes: { 'topW>topE': along, 'topE>topW': back }, water: SEA, birds: { x: 0, z: 3, h: 10.5, color: '#f4f4f0' }, shadowSize: 34 };
}
