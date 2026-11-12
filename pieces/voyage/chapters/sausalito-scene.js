import * as T from '../../tower/vendor/three.js';
import { boardTexture } from '../render/textures.js';
// Richardson Bay at Sausalito, under Mount Tamalpais, modelled from four photographs: the mountain's pointed east
// peak and long falling ridge; the hillside stacked with houses; the yacht club on its piles with a scalloped grey
// roof, glazed front and striped deck rail; and the club's little dinghies with orange and white sails. The pier of
// houseboats and the striped one with a stage on its roof are from description. Positions must agree with chapters/sausalito.mjs.
const SEA = -0.45;
export function createSausalitoScene(kit, data) {
  const { mats, add, box, cyl, cone, roof, windowAt, tree, mergeStatic } = kit, group = new T.Group(), hits = [], mechs = {};
  const ghost = () => new T.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
  const M = (color, extra = {}) => new T.MeshStandardMaterial({ color, roughness: 0.8, ...extra });
  const slab = (mat, a, b, near) => { const m = box(group, mat, a, b); if (near) { m.userData.near = near; hits.push(m); } return m; };
  const pile = (x, z) => cyl(group, mats.trunk, x, SEA - 1.5, -0.25, z, 0.08, { seg: 8 });

  // ---- shore, the hill town, Mount Tam and the fog ----
  box(group, mats.land, [-70, SEA - 1.5, -70], [-10.6, -0.2, 30]).castShadow = false; box(group, mats.rock, [-10.9, SEA - 1.5, -70], [-10.5, -0.3, 30]);
  // Mount Tam: a pointed east peak, with the ridge falling away along the shore; dark forest above, the town below.
  const mound = (x, z, rx, ry, rz, mat) => { const h = add(new T.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), mat, x, -0.2, z, group); h.scale.set(rx, ry, rz); return h; };
  mound(-21, -3, 9.5, 5.2, 9, mats.jungle); cone(group, mats.jungle, -21.5, 3.4, 8.2, -3.5, 4.2, 18); cone(group, mats.scrub, -21.5, 7.2, 8.35, -3.5, 0.9, 10);
  mound(-22, -13, 9, 5.6, 8, mats.jungle); mound(-24, -23, 10, 4.2, 9, mats.jungle); mound(-27, 9, 11, 4.4, 9, mats.jungle); mound(-38, -6, 16, 6.5, 14, mats.jungle);
  const walls = [mats.cream, mats.white, mats.pink, mats.yellow, mats.teal], lit = new T.MeshStandardMaterial({ color: '#ffe2a0', emissive: '#ffb648', emissiveIntensity: 1.6 });
  const slopes = [[-21, -3, 9.5, 5.2, 9], [-22, -13, 9, 5.6, 8], [-27, 9, 11, 4.4, 9]];
  for (let i = 0; i < 46; i++) { const [hx, hz, rx, ry, rz] = slopes[i % 3], a = -0.75 + (i * 0.618 % 1) * 1.7, d = 0.62 + (i * 0.37 % 0.36), x = hx + Math.cos(a) * rx * d, z = hz + Math.sin(a) * rz * d, y = -0.2 + ry * Math.sqrt(Math.max(0, 1 - d * d)) - 0.2;
    if (x > -11.4) continue; const w = 0.5 + (i % 3) * 0.12; box(group, walls[i % 5], [x - w, y, z - 0.45], [x + w, y + 0.85, z + 0.45]); roof(group, i % 4 ? mats.tile : mats.slate, [x - w - 0.1, z - 0.55], [x + w + 0.1, z + 0.55], y + 0.85, 0.34, { alongZ: false, hip: 0.5 });
    const win = box(group, lit, [x + w, y + 0.3, z - 0.25], [x + w + 0.015, y + 0.6, z + 0.25]); win.castShadow = false; if (i % 2) tree(group, x - 0.2, y + 0.1, z + 0.9, 0.7); }
  for (const [x, z, s] of [[-13, 5, 1.3], [-14.5, -6, 1.5], [-12.5, 9.5, 1.2], [-16, 13, 1.6], [-13.5, -11, 1.4], [-12.2, -4, 1.1]]) tree(group, x, -0.2, z, s);
  const fogMat = new T.MeshStandardMaterial({ color: '#f6efe4', transparent: true, opacity: 0.5, depthWrite: false, roughness: 1, emissive: '#b8a892', emissiveIntensity: 0.4 }), fog = new T.Group(); fog.userData.dynamic = true; group.add(fog);
  for (let i = 0; i < 10; i++) { const r = 3 + (i * 0.61 % 3), p = add(new T.IcosahedronGeometry(r, 2), fogMat, -34 + (i * 7.3 % 12), 3.6 + (i * 1.7 % 2.4), -34 + (i * 5.1 % 16), fog); p.scale.y = 0.35; p.castShadow = p.receiveShadow = false; }
  // ---- the yacht club: on piles over the water, scalloped grey roof, glazed front, striped deck rail ----
  for (const x of [-15.4, -13.4, -11.4]) for (const z of [-2, 0, 2]) cyl(group, mats.trunk, x, SEA - 1.5, 0.5, z, 0.09, { seg: 8 });
  box(group, mats.white, [-15.8, 0.5, -2.5], [-10.9, 0.65, 2.5]); box(group, mats.glass, [-15.6, 0.65, -2.2], [-12, 1.75, 2.2]); for (let z = -2.2; z <= 2.21; z += 0.88) box(group, mats.white, [-12.02, 0.65, z - 0.04], [-11.98, 1.75, z + 0.04]);
  for (let i = 0; i < 5; i++) { const v = add(new T.CylinderGeometry(0.46, 0.46, 3.9, 20), mats.lead, -13.8, 1.72, -1.76 + i * 0.88, group); v.rotation.z = Math.PI / 2; v.scale.y = 1; }
  for (let i = 0; i < 12; i++) box(group, [mats.red, mats.white, mats.blue][i % 3], [-10.95, 0.65, -2.5 + i * 0.4167], [-10.9, 1.0, -2.5 + (i + 1) * 0.4167]);
  box(group, mats.white, [-10.96, 1.0, -2.5], [-10.88, 1.04, 2.5]); for (const z of [-2.5, 2.5]) box(group, mats.white, [-12, 0.65, z - 0.02], [-10.9, 1.0, z + 0.02]);
  cyl(group, mats.white, -11.2, 0.65, 4.4, 2.1, 0.035, { seg: 6 }); box(group, mats.blue, [-11.2, 3.8, 2.09], [-10.4, 4.3, 2.11]); add(new T.SphereGeometry(0.09, 8, 6), mats.white, -10.85, 4.05, 2.12, group);
  slab(mats.deck, [-10.9, -0.25, -1.3], [-8.2, 0, 1.7], ['club']); for (const [x, z] of [[-8.5, 1.5], [-8.5, -1.1], [-10.2, 1.5]]) pile(x, z);
  { const g = add(new T.BoxGeometry(0.5, 0.06, 0.8), mats.deck, -10.9, 0.3, 0.2, group); g.rotation.z = -0.6; } // the gangway down from the club deck
  // The club's name over the dock.
  for (const z of [-1.25, 1.65]) cyl(group, mats.white, -8.3, 0, 3.0, z, 0.05, { seg: 8 });
  { const b = add(new T.PlaneGeometry(3.1, 0.62), new T.MeshStandardMaterial({ map: boardTexture('SAUSALITO YACHT CLUB', '#f7f3ea', '#1c2f55'), roughness: 0.6, side: T.DoubleSide }), -8.3, 3.1, 0.2, group); b.rotation.y = Math.PI / 2; b.castShadow = false; b.userData.dynamic = true; }
  // A float of spare dinghies beside it.
  box(group, mats.deck, [-10.6, SEA - 0.1, 2.6], [-8.6, SEA + 0.15, 5.6]); for (let i = 0; i < 5; i++) { const h = add(new T.SphereGeometry(1, 14, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mats.white, -9.6, SEA + 0.4, 3.0 + i * 0.55, group); h.scale.set(0.8, 0.26, 0.22); }
  // ---- the pier and its houseboats ----
  slab(mats.deck, [-8.2, -0.25, -0.5], [6.5, 0, 0.5], ['club', 'pier']); for (let x = -7; x <= 6.2; x += 2.2) for (const z of [-0.42, 0.42]) pile(x, z);
  const paints = [M('#6fa3a0'), M('#d98f5a'), M('#8c7bb0'), M('#e2c15a')];
  [-5.6, -2.1, 1.4, 4.9].forEach((x, i) => { box(group, mats.iron, [x - 1.5, SEA - 0.3, -3.5], [x + 1.5, -0.05, -0.75]); box(group, paints[i], [x - 1.25, -0.05, -3.3], [x + 1.25, 1.35, -1.1]);
    const r = box(group, mats.lead, [x - 1.4, 1.35, -3.45], [x + 1.4, 1.45, -0.95]); r.rotation.x = i % 2 ? 0.12 : -0.12; windowAt(group, 'z', x - 0.5, 0.7, -1.1, 0.4, 0.55); box(group, mats.trunk, [x + 0.25, -0.05, -1.11], [x + 0.75, 1.0, -1.08]);
    box(group, mats.deck, [x + 0.2, -0.1, -1.1], [x + 0.8, -0.02, -0.5]); add(new T.SphereGeometry(0.2, 10, 8), mats.leaf, x - 1.0, 0.1, -0.9, group); });
  // ---- the last houseboat: striped, with a stage on its roof deck and a davit ----
  box(group, mats.iron, [10.8, SEA - 0.3, 1], [15.2, -0.05, 5.2]);
  ['#c8402f', '#e08a2f', '#e9c64a', '#4f9a5f', '#3f78b5', '#7a55a5'].forEach((c, i) => box(group, M(c), [11.2, -0.05 + i * 0.47, 1.3], [14.8, -0.05 + (i + 1) * 0.47, 4.3]));
  windowAt(group, 'z', 12, 1.2, 4.3, 0.5, 0.7, true); windowAt(group, 'x', 14.8, 1.2, 2.8, 0.5, 0.7, true); { const rec = add(new T.CylinderGeometry(0.42, 0.42, 0.03, 32), mats.iron, 13.8, 1.5, 4.32, group); rec.rotation.x = Math.PI / 2; const lab = add(new T.CylinderGeometry(0.14, 0.14, 0.035, 20), mats.red, 13.8, 1.5, 4.325, group); lab.rotation.x = Math.PI / 2; }
  slab(mats.deck, [11, 2.75, 1], [15, 3.001, 4.6], ['roof']);
  box(group, mats.iron, [14.1, 3, 1.2], [14.8, 3.7, 1.75]); cyl(group, mats.iron, 14.45, 3.25, 3.55, 1.76, 0.2, { seg: 16 }).rotation.x = Math.PI / 2;
  { const g = new T.Group(); g.position.set(13.7, 3.45, 1.5); g.rotation.z = 0.25; group.add(g); const body = add(new T.SphereGeometry(0.24, 14, 10), mats.trunk, 0, 0, 0, g); body.scale.set(1, 1.25, 0.35); box(g, mats.trunk, [-0.035, 0.2, -0.03], [0.035, 0.85, 0.03]); g.userData.dynamic = true; }
  cyl(group, mats.iron, 12.1, 3, 4.2, 1.5, 0.015, { seg: 6 }); add(new T.SphereGeometry(0.06, 10, 8), mats.iron, 12.1, 4.22, 1.5, group);
  for (const [x, z] of [[11.1, 1.1], [14.9, 1.1], [14.9, 4.5]]) cyl(group, mats.white, x, 3, 4.5, z, 0.025, { seg: 6 });
  for (let i = 0; i <= 8; i++) { const b = add(new T.SphereGeometry(0.06, 8, 6), mats.glow, 11.1 + i * 0.475, 4.45 - Math.sin(i / 8 * Math.PI) * 0.25, 1.1, group); b.castShadow = false; const c = add(new T.SphereGeometry(0.06, 8, 6), mats.glow, 14.9, 4.45 - Math.sin(i / 8 * Math.PI) * 0.25, 1.1 + i * 0.425, group); c.castShadow = false; }
  slab(mats.deck, [12.5, -0.25, 5.2], [13.5, 0, 6.5], ['stern']); for (let i = 0; i < 9; i++) box(group, mats.trunk, [12.7, 0.25 + i * 0.3, 5.2 - i * 0.07], [13.3, 0.3 + i * 0.3, 5.3 - i * 0.07]);
  { const m = data.mechs.davit, g = new T.Group(); g.userData.dynamic = true; g.position.set(m.hub[0], 0, m.hub[2]); group.add(g);
    const disc = cyl(g, mats.walk, 0, 2.76, 3.006, 0, 0.8, { seg: 36 }); disc.userData = { near: ['roof'], mech: 'davit' }; hits.push(disc);
    const arm = box(g, mats.deck, [0.5, 2.75, -0.5], [3.5, 3, 0.5]); arm.userData = { near: ['boom', 'roof'], mech: 'davit' }; hits.push(arm);
    cyl(g, mats.white, -0.55, 3, 4.6, 0, 0.045, { seg: 8 }); const stay = add(new T.BoxGeometry(4.35, 0.025, 0.025), mats.iron, 1.45, 3.82, -0.47, g); stay.rotation.z = -0.385;
    const knob = add(new T.SphereGeometry(0.38, 12, 8), ghost(), -0.55, 3.5, 0, g); knob.castShadow = knob.receiveShadow = false; knob.userData = { mech: 'davit', handle: true }; hits.push(knob);
    mechs.davit = { group: g, hub: new T.Vector3(m.hub[0], 3, m.hub[2]) }; }
  // ---- the racing mark: a raft with a bell ----
  slab(mats.deck, [1.5, -0.25, 7.5], [2.5, 0, 8.5], ['mark']); for (const [x, z] of [[1.6, 7.6], [2.4, 7.6]]) cyl(group, mats.white, x, 0, 1.1, z, 0.025, { seg: 6 }); box(group, mats.white, [1.6, 1.08, 7.58], [2.4, 1.12, 7.62]); cone(group, mats.brass, 2, 0.75, 1.05, 7.6, 0.14, 12);
  cone(group, mats.red, 3.4, SEA, SEA + 0.9, 9.6, 0.3, 12); cone(group, mats.jungle, -3, SEA, SEA + 0.9, 6, 0.3, 12);
  // ---- the two dinghies ----
  function dinghy(id, sailMat, size) {
    const g = new T.Group(); g.userData.dynamic = true; group.add(g);
    const hull = add(new T.SphereGeometry(1, 20, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mats.white, 0, 0.02, 0, g); hull.scale.set(0.95 * size, 0.42, 0.55 * size);
    const f = box(g, mats.deck, [-0.6 * size, -0.12, -0.42 * size], [0.6 * size, 0.004, 0.42 * size]); f.userData.near = [id]; hits.push(f);
    cyl(g, mats.white, 0.35 * size, 0, 2.3 * size, 0, 0.022, { seg: 6 });
    const sg = new T.BufferGeometry(); sg.setAttribute('position', new T.Float32BufferAttribute([0.35 * size, 0.35, 0.02, 0.35 * size, 2.25 * size, 0.02, -0.75 * size, 0.42, 0.02], 3)); sg.setAttribute('uv', new T.Float32BufferAttribute([0, 0, 0, 1, 1, 0], 2)); sg.computeVertexNormals();
    const sail = add(sg, new T.MeshStandardMaterial({ color: sailMat, side: T.DoubleSide, roughness: 0.9 }), 0, 0, 0, g);
    const tg = new T.BufferGeometry(); tg.setAttribute('position', new T.Float32BufferAttribute([0.35 * size, 1.45 * size, 0.025, 0.35 * size, 2.25 * size, 0.025, -0.1 * size, 1.45 * size, 0.025], 3)); tg.setAttribute('uv', new T.Float32BufferAttribute([0, 0, 0, 1, 1, 0], 2)); tg.computeVertexNormals(); add(tg, new T.MeshStandardMaterial({ color: '#f6f1e6', side: T.DoubleSide, roughness: 0.9 }), 0, 0, 0, g);
    mechs[id] = { group: g, hub: new T.Vector3(...data.mechs[id].track[0]) }; return { g, last: new T.Vector3(), heading: 0 };
  }
  const boats = { pram: dinghy('pram', '#e8642c', 1), skiff: dinghy('skiff', '#f08a3c', 1.3) };
  // ---- the bay: a few yachts at their moorings ----
  for (const [x, z, a] of [[9, 12, 0.4], [16, 10.5, 1.3], [-2, 12.5, 2.2], [19, 0, 0.2]]) { const g = new T.Group(); g.position.set(x, SEA, z); g.rotation.y = a; group.add(g); const h = add(new T.SphereGeometry(1, 18, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mats.white, 0, 0.3, 0, g); h.scale.set(1.9, 0.6, 0.5); box(g, mats.cream, [-0.6, 0.3, -0.3], [0.5, 0.55, 0.3]); cyl(g, mats.white, 0.2, 0.3, 3.4, 0, 0.03, { seg: 6 }); }

  for (const [id, n] of Object.entries(data.nodes)) if (n.pos) { const h = add(new T.BoxGeometry(1, 0.06, 1), ghost(), n.pos[0], n.pos[1] + 0.03, n.pos[2], group); h.castShadow = h.receiveShadow = false; h.userData.near = [id]; hits.push(h); }
  mergeStatic(group, new Set(hits));
  const up = [new T.Vector3(13, 0, 5.3), new T.Vector3(13, 3, 4.7)], down = up.slice().reverse(); up.slow = down.slow = true;
  function update(time, model, still, state, live) {
    for (const [id, b] of Object.entries(boats)) { if (!live) continue; const p = live(id), d = p.clone().sub(b.last); if (d.lengthSq() > 1e-6) b.heading = Math.atan2(-d.z, d.x); b.last.copy(p); b.g.position.set(p.x, still ? 0 : Math.sin(time * 1.3 + p.x) * 0.02, p.z); b.g.rotation.y = b.heading; b.g.rotation.x = still ? 0 : Math.sin(time * 0.9 + p.z) * 0.03; }
    if (!still) fog.position.x = Math.sin(time * 0.05) * 3;
    mats.glow.emissiveIntensity = model.won ? 6 : 2.5;
  }
  const frame = [[-11.5, 0, 1.8], [-15.8, 2.4, -2.5], [-21.5, 8.5, -3.5], [6.4, 1.5, -3.6], [15.4, 0, 1], [15.2, 4.6, 4.6], [13.6, 0, 7.8], [2.5, 0, 9.2], [-9, SEA, 2.4]];
  return { group, hits, mechs, update, frame, routes: { 'stern>roof': up, 'roof>stern': down }, water: SEA, birds: { x: 3, z: 4, h: 6.5, color: '#f4f4f0' }, shadowSize: 34 };
}
