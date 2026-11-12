import * as T from '../../tower/vendor/three.js';
import { boardTexture } from '../render/textures.js';
// The Monterey Bay Aquarium as a cut-away: the old cannery's corrugated walls and three smokestacks at the back,
// the kelp forest tank three storeys high, a grey whale hanging from the roof, the jellies glowing in the dark,
// and outside a deck over the rocks with sea otters in the kelp. Built from memory, not from photographs.
// Positions must agree with chapters/monterey.mjs.
const SEA = -2;
export function createMontereyScene(kit, data) {
  const { mats, add, box, cyl, cone, mergeStatic } = kit, group = new T.Group(), hits = [], mechs = {};
  const ghost = () => new T.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
  const M = (color, extra = {}) => new T.MeshStandardMaterial({ color, roughness: 0.8, ...extra });
  const tin = M('#8fa3a6', { roughness: 0.5, metalness: 0.4 }), tinDark = M('#5f7478', { roughness: 0.5, metalness: 0.4 }), whaleGrey = M('#7c868c', { roughness: 0.7 }), kelp = M('#8a8a2c', { roughness: 0.9 }), kelpDark = M('#5d6b22'), otter = M('#6b4a34'), night = M('#12233f');
  const glassTank = new T.MeshStandardMaterial({ color: '#3f9bb5', transparent: true, opacity: 0.32, roughness: 0.05, metalness: 0.2, depthWrite: false });
  const jelly = new T.MeshStandardMaterial({ color: '#ffb066', emissive: '#ff8a2a', emissiveIntensity: 2.2, transparent: true, opacity: 0.9 });
  const slab = (mat, a, b, near) => { const m = box(group, mat, a, b); if (near) { m.userData.near = near; hits.push(m); } return m; };
  function lever(x, y, z, mech, node, mat = mats.red) {
    cyl(group, mats.iron, x, y, y + 0.14, z, 0.12, { seg: 14 }); const stick = cyl(group, mats.brass, x, y + 0.1, y + 0.62, z, 0.028, { seg: 8 }); stick.rotation.z = 0.3; stick.position.x += 0.08;
    add(new T.SphereGeometry(0.075, 14, 10), mat, x + 0.16, y + 0.64, z, group);
    const grab = add(new T.SphereGeometry(0.36, 12, 8), ghost(), x + 0.08, y + 0.4, z, group); grab.castShadow = grab.receiveShadow = false; grab.userData = { lever: mech, near: [node] }; hits.push(grab);
  }
  const tube = (pts, r, mat) => { const m = add(new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(p => new T.Vector3(...p))), 60, r, 8), mat, 0, 0, 0, group); m.userData.dynamic = true; return m; };

  // ---- the building: floor, the cannery's back and side walls, roof beams, smokestacks ----
  slab(mats.walk, [-8.5, -0.3, -5], [4.2, 0, 4.6], ['entry', 'hall']); box(group, mats.rock, [-9, SEA - 1, -6], [4.6, -0.3, 5]);
  for (let x = -8.5; x < 4.2; x += 0.5) box(group, (Math.round(x * 2) % 2 ? tin : tinDark), [x, 0, -5.2], [x + 0.5, 7.6, -5]);
  for (let z = -5; z < 1.5; z += 0.5) box(group, (Math.round(z * 2) % 2 ? tin : tinDark), [-8.7, 0, z], [-8.5, 7.6, z + 0.5]);
  for (const x of [-6.6, -4.2, 2.4]) { box(group, mats.glass, [x - 0.7, 3.4, -5.02], [x + 0.7, 6.2, -4.98]); box(group, mats.white, [x - 0.76, 6.2, -5.04], [x + 0.76, 6.3, -4.96]); }
  for (let i = 0; i < 4; i++) { const x0 = -8.5 + i * 3.18; const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute([x0, 7.6, -5, x0 + 3.18, 7.6, -5, x0, 9.1, -5, x0, 7.6, -7.4, x0 + 3.18, 7.6, -7.4, x0, 9.1, -7.4], 3)); g.setIndex([0, 1, 2, 3, 5, 4, 2, 1, 4, 2, 4, 5, 0, 2, 5, 0, 5, 3]); g.computeVertexNormals(); const uv = new Float32Array(12); g.setAttribute('uv', new T.BufferAttribute(uv, 2)); add(g, tinDark, 0, 0, 0, group); }
  for (const x of [-7, -5.2, -3.4]) { cyl(group, mats.rock, x, 7.6, 12.6, -6.4, 0.42, { rTop: 0.34, seg: 20 }); cyl(group, mats.iron, x, 12.6, 12.8, -6.4, 0.37, { seg: 20 }); }
  // Slim roof trusses, from which the whale hangs.
  for (const z of [3, -1]) { box(group, tinDark, [-8.5, 7.6, z - 0.05], [8.2, 7.72, z + 0.05]); box(group, tinDark, [-8.5, 7.25, z - 0.03], [8.2, 7.31, z + 0.03]); for (let x = -8; x < 8; x += 1) { const d = add(new T.BoxGeometry(1.07, 0.035, 0.035), tinDark, x + 0.5, 7.48, z, group); d.rotation.z = (Math.round(x) % 2 ? 1 : -1) * 0.36; } box(group, tinDark, [8.05, 0, z - 0.07], [8.2, 7.6, z + 0.07]); }
  { const b = add(new T.PlaneGeometry(4.6, 0.72), new T.MeshStandardMaterial({ map: boardTexture('MONTEREY BAY', '#12324a', '#f1e6cf'), roughness: 0.6 }), -5.4, 6.85, -4.97, group); b.castShadow = false; b.userData.dynamic = true; }
  // The touch pool, and the mouth of the children's crawl tunnel.
  cyl(group, mats.rock, -3.4, 0, 0.45, 0.6, 1.2, { seg: 9 }); cyl(group, mats.glass, -3.4, 0.45, 0.47, 0.6, 0.95, { seg: 24 }); box(group, mats.rock, [-2.3, 0, 0.9], [-1.5, 0.7, 1.7]); box(group, mats.iron, [-1.52, 0, 1.05], [-1.48, 0.5, 1.55]);
  // ---- the kelp forest tank ----
  box(group, mats.rock, [-1.5, 0, -1.2], [1.5, 0.35, 2.4]);
  const tank = add(new T.BoxGeometry(3, 5.65, 3.6), glassTank, 0, 3.17, 0.6, group); tank.userData.dynamic = true; tank.castShadow = false;
  for (const [x, z] of [[-1.5, -1.2], [1.5, -1.2], [-1.5, 2.4], [1.5, 2.4]]) box(group, mats.iron, [x - 0.06, 0, z - 0.06], [x + 0.06, 6, z + 0.06]); for (const z of [-1.2, 2.4]) box(group, mats.iron, [-1.5, 5.9, z - 0.06], [1.5, 6, z + 0.06]); for (const x of [-1.5, 1.5]) box(group, mats.iron, [x - 0.06, 5.9, -1.2], [x + 0.06, 6, 2.4]);
  const fronds = [];
  for (let i = 0; i < 9; i++) { const x = -1.1 + (i % 3) * 1.1 + (i * 0.37 % 0.3), z = -0.7 + Math.floor(i / 3) * 1.25, h = 4.2 + (i * 0.7 % 1.2), pts = []; for (let k = 0; k <= 6; k++) pts.push([x + Math.sin(k * 1.3 + i) * 0.18, 0.35 + h * k / 6, z + Math.cos(k * 1.1 + i) * 0.15]);
    tube(pts, 0.035, kelpDark); for (let k = 1; k < 6; k++) { const p = pts[k], f = add(new T.SphereGeometry(0.2, 8, 6), kelp, p[0] + (k % 2 ? 0.16 : -0.16), p[1], p[2], group); f.scale.set(1, 0.28, 0.5); f.userData.dynamic = true; fronds.push(f); } }
  const fish = []; for (let i = 0; i < 14; i++) { const f = add(new T.SphereGeometry(0.11, 10, 8), i % 4 ? M('#c9d3d8', { metalness: 0.6, roughness: 0.3 }) : M('#f08a2a'), 0, 0, 0, group); f.scale.set(1.9, 0.8, 0.5); f.userData.dynamic = true; f.castShadow = false; fish.push({ mesh: f, r: 0.5 + (i % 4) * 0.22, h: 1.2 + (i * 0.61 % 4), sp: 0.5 + (i % 5) * 0.12, ph: i * 1.9 }); }
  // The diver's cage, the mezzanine balcony, the walkway at the top of the tank.
  const cage = new T.Group(); cage.userData.dynamic = true; group.add(cage); { const f = box(cage, mats.yellow, [-0.45, -0.25, -0.45], [0.45, 0.004, 0.45]); f.userData.near = ['cage']; hits.push(f); for (const [x, z] of [[-0.42, -0.42], [0.42, -0.42]]) cyl(cage, mats.yellow, x, 0, 1.2, z, 0.025, { seg: 6 }); box(cage, mats.yellow, [-0.45, 1.2, -0.45], [0.45, 1.24, -0.39]); }
  mechs.cage = { group: cage, hub: new T.Vector3(0, 1.5, 3) }; box(group, mats.iron, [-0.04, 0, 2.46], [0.04, 4.4, 2.52]); lever(-1.4, 0, 3.7, 'cage', 'hall', mats.yellow);
  slab(mats.walk, [0.5, 2.75, 2.5], [1.5, 3, 3.5], ['mezz']); box(group, mats.iron, [0.5, 2.4, 2.5], [1.5, 2.75, 2.6]);
  slab(mats.walk, [0.5, 5.75, 2.5], [1.5, 6, 3.5], ['surface']); box(group, mats.iron, [0.5, 5.4, 2.5], [1.5, 5.75, 2.6]); const plate = add(new T.CylinderGeometry(0.3, 0.3, 0.03, 28), mats.brass, 1, 6.016, 3, group); plate.castShadow = false; plate.userData.dynamic = true;
  // ---- the grey whale, hanging from the roof: its back is the walkway ----
  { const m = data.mechs.whale, g = new T.Group(); g.userData.dynamic = true; g.position.set(m.hub[0], 0, m.hub[2]); group.add(g);
    const body = add(new T.SphereGeometry(1, 28, 16), whaleGrey, 1.2, 5.25, 0, g); body.scale.set(3.3, 0.62, 0.72);
    const deck = box(g, mats.walk, [-0.5, 5.75, -0.5], [3.5, 6, 0.5]); deck.userData = { near: ['tail', 'back'], mech: 'whale' }; hits.push(deck);
    for (const s of [-1, 1]) { const fl = add(new T.SphereGeometry(0.6, 12, 8), whaleGrey, 4.3, 5.5, s * 0.55, g); fl.scale.set(0.9, 0.16, 0.6); fl.rotation.y = s * 0.5; const fin = add(new T.SphereGeometry(0.5, 10, 8), whaleGrey, 0.2, 4.95, s * 0.75, g); fin.scale.set(0.8, 0.14, 0.45); fin.rotation.y = -s * 0.6; }
    for (let i = 0; i < 6; i++) { const b = add(new T.SphereGeometry(0.09, 8, 6), mats.cream, -1.2 + i * 0.3, 5.55 + (i % 2) * 0.1, (i % 3 - 1) * 0.3, g); b.castShadow = false; }
    for (const x of [0, 2.4]) cyl(g, mats.iron, x, 6, 7.6, -0.47, 0.012, { seg: 4 });
    mechs.whale = { group: g, hub: new T.Vector3(m.hub[0], 6, m.hub[2]) }; }
  // ---- the jellies: a dark room on the mezzanine, with the whale's lever ----
  slab(mats.walk, [4.2, 2.75, 0.2], [6, 3, 1.8], ['jellies']); box(group, night, [4.2, 3, 0], [6, 4.7, 0.2]); box(group, night, [5.8, 3, 0.2], [6, 4.7, 1.8]); box(group, night, [4.1, 4.7, 0], [6.1, 4.85, 1.9]); for (const [x, z] of [[4.3, 1.7], [5.9, 1.7], [4.3, 0.3]]) box(group, mats.iron, [x - 0.07, 0, z - 0.07], [x + 0.07, 2.75, z + 0.07]);
  const jellies = []; for (let i = 0; i < 7; i++) { const j = new T.Group(); j.userData.dynamic = true; j.position.set(4.5 + (i * 0.47 % 1.3), 3.5 + (i * 0.31 % 0.9), 0.32 + (i % 2) * 0.12); group.add(j); const bell = add(new T.SphereGeometry(0.13, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), jelly, 0, 0, 0, j); bell.castShadow = false; for (let k = 0; k < 3; k++) { const t = add(new T.CylinderGeometry(0.008, 0.008, 0.3, 4), jelly, (k - 1) * 0.05, -0.15, 0, j); t.castShadow = false; } jellies.push(j); }
  lever(4.5, 3, 1.5, 'whale', 'jellies', mats.blue);
  // ---- the sea door, the deck over the rocks, the slides ----
  box(group, mats.iron, [4.1, 0, 2.4], [4.3, 2.4, 2.6]); box(group, mats.iron, [4.1, 0, 4.4], [4.3, 2.4, 4.6]); box(group, mats.iron, [4.1, 2.4, 2.4], [4.3, 2.6, 4.6]);
  const door = box(group, mats.glass, [4.16, 0, 2.6], [4.24, 2.4, 4.4]); door.userData.dynamic = true;
  slab(mats.deck, [4.2, -0.25, 2.2], [8.4, 0, 8], ['deck', 'hall']); for (const [x, z] of [[4.6, 7.6], [8, 7.6], [8, 2.6], [6.3, 7.6], [8, 5]]) cyl(group, mats.trunk, x, SEA - 1, -0.25, z, 0.09, { seg: 8 });
  for (const [a, b] of [[[4.25, 7.95], [8.35, 7.95]], [[8.35, 2.25], [8.35, 7.95]]]) { const len = Math.hypot(b[0] - a[0], b[1] - a[1]), r = add(new T.BoxGeometry(len, 0.03, 0.03), mats.white, (a[0] + b[0]) / 2, 0.45, (a[1] + b[1]) / 2, group); r.rotation.y = -Math.atan2(b[1] - a[1], b[0] - a[0]); for (let i = 0; i <= 5; i++) cyl(group, mats.white, a[0] + (b[0] - a[0]) * i / 5, 0, 0.45, a[1] + (b[1] - a[1]) * i / 5, 0.022, { seg: 6 }); }
  cyl(group, mats.brass, 7.6, 0, 0.9, 7.3, 0.03, { seg: 8 }); const scope = cyl(group, mats.brass, 7.6, 0.9, 1.3, 7.3, 0.06, { seg: 10 }); scope.rotation.z = 1.1;
  const longSlide = [[1.4, 6.05, 3.6], [2.6, 5.2, 4.6], [3.9, 3.6, 5.6], [5, 1.8, 6.2], [5.8, 0.5, 6.2], [6, 0.1, 6]], shortSlide = [[5.2, 3.05, 1.9], [5.6, 2.2, 3.2], [5.9, 1.0, 4.6], [6, 0.2, 5.6], [6, 0.1, 6]];
  tube(longSlide, 0.16, mats.yellow); tube(shortSlide, 0.14, mats.teal);
  // ---- outside: rocks, kelp on the water, sea otters ----
  for (const [x, z, r, h] of [[10, 9.5, 1.3, 0.9], [3, 7.6, 1.6, 0.7], [-3.5, 7, 2.2, 0.6], [11.5, 4, 1.1, 1.1], [-8, 7.4, 1.8, 0.5], [7, 11.5, 1.0, 0.5], [10.5, -2, 2.4, 1.2]]) cyl(group, mats.rock, x, SEA - 1, SEA + h, z, r, { rTop: r * 0.6, seg: 8 });
  for (const [x, z, s] of [[1, 10.5, 1.6], [6, 13, 2.0], [12.5, 8, 1.4], [-5, 11, 1.8], [13, 12.5, 1.5]]) for (let i = 0; i < 5; i++) { const k = add(new T.SphereGeometry(0.5 * s, 8, 6), kelp, x + Math.cos(i * 2.2) * 0.8 * s, SEA + 0.02, z + Math.sin(i * 2.2) * 0.6 * s, group); k.scale.set(1, 0.05, 0.6); k.castShadow = false; }
  const otters = []; for (const [x, z, a] of [[1.6, 10.2, 0.4], [6.6, 12.6, 2.0], [-4.4, 10.6, 1.1]]) { const o = new T.Group(); o.userData.dynamic = true; o.position.set(x, SEA + 0.06, z); o.rotation.y = a; group.add(o); const b = add(new T.CapsuleGeometry(0.13, 0.5, 4, 10), otter, 0, 0, 0, o); b.rotation.z = Math.PI / 2; add(new T.SphereGeometry(0.11, 10, 8), mats.cream, 0.38, 0.04, 0, o); add(new T.SphereGeometry(0.06, 8, 6), otter, -0.42, 0.02, 0, o); otters.push(o); }
  // Cannery Row: the street behind, its pavements, and the crossover between the old canneries with its sign.
  box(group, mats.road, [-40, SEA - 1, -40], [-9, -0.3, 5]).castShadow = false; box(group, mats.road, [-9, SEA - 1, -40], [30, -0.3, -6]).castShadow = false;
  box(group, mats.walk, [-40, -0.3, -6.2], [30, -0.22, -5.2]).castShadow = false; box(group, mats.walk, [-40, -0.3, -9.6], [30, -0.22, -8.9]).castShadow = false; box(group, mats.walk, [-9.6, -0.3, -5.2], [-8.7, -0.22, 5]).castShadow = false;
  for (let x = -38; x < 29; x += 2.2) { const d = box(group, mats.yellow, [x, -0.3, -7.6], [x + 1.1, -0.29, -7.5]); d.castShadow = false; }
  box(group, mats.cream, [-13.4, 3.1, -9.5], [-11.6, 4.5, -5.2]); box(group, tinDark, [-13.5, 4.5, -9.5], [-11.5, 4.7, -5.2]); for (const z of [-8.6, -7.3, -6.1]) box(group, mats.glass, [-11.61, 3.5, z - 0.4], [-11.58, 4.1, z + 0.4]);
  { const c = add(new T.PlaneGeometry(3.6, 0.6), new T.MeshStandardMaterial({ map: boardTexture('CANNERY ROW', '#f1e6cf', '#12324a'), roughness: 0.6 }), -11.57, 2.75, -7.35, group); c.rotation.y = Math.PI / 2; c.castShadow = false; c.userData.dynamic = true; }
  for (const [x, z, col] of [[-16, -6.9, mats.red], [-22, -8.1, mats.teal], [4, -6.9, mats.cream], [12, -8.1, mats.blue]]) { box(group, col, [x, -0.18, z - 0.42], [x + 1.9, 0.32, z + 0.42]); box(group, mats.glass, [x + 0.4, 0.32, z - 0.36], [x + 1.4, 0.62, z + 0.36]); }
  for (let i = 0; i < 9; i++) { const x = -30 + i * 4.3, h = 2.4 + (i * 37 % 3) * 0.8; box(group, i % 2 ? tin : mats.cream, [x, -0.3, -13], [x + 3.6, h, -9.5]); box(group, tinDark, [x - 0.1, h, -13.1], [x + 3.7, h + 0.25, -9.4]); }

  for (const [id, n] of Object.entries(data.nodes)) if (n.pos) { const h = add(new T.BoxGeometry(1, 0.06, 1), ghost(), n.pos[0], n.pos[1] + 0.03, n.pos[2], group); h.castShadow = h.receiveShadow = false; h.userData.near = [id]; hits.push(h); }
  mergeStatic(group, new Set(hits));
  const V = pts => pts.map(p => new T.Vector3(...p));
  let open = 0;
  function update(time, model, still, state, live) {
    if (live) cage.position.copy(live('cage'));
    const o = model.pressed('surface') ? 1 : 0; open = still ? o : open + (o - open) * 0.1; door.position.z = 3.5 - open * 1.7; plate.position.y = 6.016 - open * 0.02;
    if (!still) { for (const f of fish) { const a = time * f.sp + f.ph; f.mesh.position.set(Math.cos(a) * f.r, f.h + Math.sin(a * 1.7) * 0.25, 0.6 + Math.sin(a) * f.r * 1.2); f.mesh.rotation.y = -a + Math.PI / 2; }
      fronds.forEach((f, i) => { f.rotation.z = Math.sin(time * 0.8 + i) * 0.25; }); jellies.forEach((j, i) => { j.position.y = 3.6 + ((time * 0.12 + i * 0.37) % 1) * 0.8; j.scale.setScalar(1 + Math.sin(time * 2 + i) * 0.12); });
      otters.forEach((o2, i) => { o2.position.y = SEA + 0.06 + Math.sin(time * 1.2 + i) * 0.03; o2.rotation.y += 0.002; }); }
  }
  const frame = [[-8.6, 0, 4.6], [-8.6, 7.6, -5], [-3.4, 10.6, -6.4], [8.4, 0, 2.2], [8.4, 0, 8], [8.6, 7, 3], [4.3, SEA, 8.2], [5, 6.6, 6.7]];
  return { group, hits, mechs, update, frame, routes: { 'surface>deck': V(longSlide), 'jellies>deck': V(shortSlide) }, water: SEA, birds: { x: 4, z: 8, h: 6, color: '#f4f4f0' }, shadowSize: 30 };
}
