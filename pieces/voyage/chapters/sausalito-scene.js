import * as T from '../../tower/vendor/three.js';
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
  // Everything small that moves is painted from one strip of swatches, so that each boat, bird or beast bakes down to
  // a single mesh: a part picks its colour by where its UVs point. The last swatch glows, for cabin lamps.
  const swatches = ['#f3efe6', '#f1e6cf', '#23282c', '#2f6fa8', '#c8402f', '#6a5240', '#f0c348', '#8b9296', '#2aa39a', '#e8642c', '#4a4f55', '#9fb0bd', '#8a7a68', '#d9a87c', '#35592f', '#ffd9a0'];
  const [WHITE, CREAM, DARK, BLUE, RED, WOOD, YELLOW, , TEAL, , SEAL, HERON, BROWN, SKIN, , LAMP] = swatches.keys();
  const strip = lit => { const c = document.createElement('canvas'); c.width = swatches.length; c.height = 1; const g = c.getContext('2d'); swatches.forEach((s, i) => { g.fillStyle = lit ? (i === LAMP ? '#ffb648' : '#000000') : s; g.fillRect(i, 0, 1, 1); }); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.magFilter = t.minFilter = T.NearestFilter; t.generateMipmaps = false; return t; };
  const paint = new T.MeshStandardMaterial({ map: strip(false), emissive: '#ffffff', emissiveMap: strip(true), emissiveIntensity: 2.2, roughness: 0.8, side: T.DoubleSide });
  const dab = (parent, geo, c, x = 0, y = 0, z = 0) => { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, (c + 0.5) / swatches.length, 0.5); return add(geo, paint, x, y, z, parent); };
  const ball = (parent, c, x, y, z, sx, sy = sx, sz = sx) => { const m = dab(parent, new T.SphereGeometry(1, 12, 8), c, x, y, z); m.scale.set(sx, sy, sz); return m; };
  const bar = (parent, c, [x0, y0, z0], [x1, y1, z1]) => dab(parent, new T.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), c, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  const rod = (parent, c, x, y0, y1, z, r, rTop = r) => dab(parent, new T.CylinderGeometry(rTop, r, y1 - y0, 6), c, x, (y0 + y1) / 2, z);
  const prop = (x, y, z, turn = 0) => { const g = new T.Group(); g.position.set(x, y, z); g.rotation.order = 'YXZ'; g.rotation.y = turn; group.add(g); return g; };
  const bake = (g, shadow = false) => { mergeStatic(g, new Set()); g.children[g.children.length - 1].castShadow = shadow; g.userData.dynamic = true; return g; };
  // Lit panes (house windows, the lamps along the shore path) are one instanced mesh, so that each can come on by
  // itself: a pane is a place, a size, and the second at which it is lit.
  const panes = [], pane = (x, y, z, sx, sy, sz, at) => panes.push([x, y, z, sx, sy, sz, at]);
  const m4 = new T.Matrix4(), tint = new T.Color(), was = new T.Vector3();

  // ---- shore, the hill town, Mount Tam and the fog ----
  box(group, mats.land, [-70, SEA - 1.5, -70], [-10.6, -0.2, 30]).castShadow = false; box(group, mats.rock, [-10.9, SEA - 1.5, -70], [-10.5, -0.3, 30]);
  // Mount Tam: a pointed east peak, with the ridge falling away along the shore; dark forest above, the town below.
  const mound = (x, z, rx, ry, rz, mat) => { const h = add(new T.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), mat, x, -0.2, z, group); h.scale.set(rx, ry, rz); return h; };
  mound(-21, -3, 9.5, 5.2, 9, mats.jungle); cone(group, mats.jungle, -21.5, 3.4, 8.2, -3.5, 4.2, 18); cone(group, mats.scrub, -21.5, 7.2, 8.35, -3.5, 0.9, 10);
  mound(-22, -13, 9, 5.6, 8, mats.jungle); mound(-24, -23, 10, 4.2, 9, mats.jungle); mound(-27, 9, 11, 4.4, 9, mats.jungle); mound(-38, -6, 16, 6.5, 14, mats.jungle);
  const walls = [mats.cream, mats.white, mats.pink, mats.yellow, mats.teal];
  // A hill house: on a green terrace cut into the slope, one storey or two, some with a chimney and some with a deck
  // on posts. Its windows face the bay, and the higher the house stands the later its lamps are lit.
  function house(x, y, z, i) {
    const w = 0.5 + (i % 3) * 0.12, d = 0.42 + (i % 4) * 0.05, floors = i % 3 === 1 ? 2 : 1, h = floors * 0.62 + 0.23;
    const late = k => { const n = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453, f = n - Math.floor(n); return f < 0.3 ? -1 : 6 + y * 14 + f * 30; };
    box(group, mats.jungle, [x - w - 0.12, y - 0.9, z - d - 0.12], [x + w + 0.12, y + 0.03, z + d + 0.12]); box(group, walls[i % 5], [x - w, y, z - d], [x + w, y + h, z + d]);
    roof(group, i % 4 ? mats.tile : mats.slate, [x - w - 0.1, z - d - 0.1], [x + w + 0.1, z + d + 0.1], y + h, 0.3 + (i % 3) * 0.06, { alongZ: i % 2 === 0, hip: i % 5 === 2 ? 0 : 0.5 });
    if (i % 3 === 0) box(group, mats.brick, [x - w * 0.5 - 0.08, y + h, z - 0.08], [x - w * 0.5 + 0.08, y + h + 0.55, z + 0.08]);
    if (i % 4 === 1) { box(group, mats.deck, [x + w, y - 0.04, z - d], [x + w + 0.45, y + 0.02, z + d]); box(group, mats.white, [x + w + 0.42, y + 0.26, z - d], [x + w + 0.45, y + 0.3, z + d]);
      for (const s of [-1, 1]) { cyl(group, mats.trunk, x + w + 0.4, y - 0.9, y, z + s * (d - 0.05), 0.03, { seg: 6 }); cyl(group, mats.white, x + w + 0.435, y, y + 0.28, z + s * (d - 0.02), 0.015, { seg: 6 }); } }
    for (let s = 0; s < floors; s++) { const up = y + 0.46 + s * 0.62;
      if (i % 2) for (const o of [-0.45, 0.45]) pane(x + w, up, z + o * d, 0.03, 0.3, 0.22, late(s + o)); else pane(x + w, up, z, 0.03, 0.3, 0.5, late(s));
      pane(x - w * 0.3, up, z + d, 0.26, 0.3, 0.03, late(s + 5)); }
    if (i % 2) tree(group, x - 0.2, y + 0.1, z + 0.9, 0.7);
  }
  const slopes = [[-21, -3, 9.5, 5.2, 9], [-22, -13, 9, 5.6, 8], [-27, 9, 11, 4.4, 9]];
  for (let i = 0; i < 46; i++) { const [hx, hz, rx, ry, rz] = slopes[i % 3], a = -0.75 + (i * 0.618 % 1) * 1.7, d = 0.62 + (i * 0.37 % 0.36), x = hx + Math.cos(a) * rx * d, z = hz + Math.sin(a) * rz * d, y = -0.2 + ry * Math.sqrt(Math.max(0, 1 - d * d)) - 0.2;
    if (x <= -11.4) house(x, y, z, i); }
  for (const [x, z, s] of [[-14.3, 4.6, 1.3], [-14.5, -6, 1.5], [-14.8, 9.6, 1.2], [-16, 13, 1.6], [-13.5, -11, 1.4], [-12.2, -4, 1.1]]) tree(group, x, -0.2, z, s);
  // The evening fog that pours over the ridge: one instanced bank of flattened puffs. Each rises behind the mountain,
  // swells as it crosses the ridge, and thins away as it slides down towards the town.
  const fogMat = new T.MeshStandardMaterial({ color: '#f6efe4', transparent: true, opacity: 0.36, depthWrite: false, roughness: 1, emissive: '#b8a892', emissiveIntensity: 0.4 });
  const fog = new T.InstancedMesh(new T.IcosahedronGeometry(1, 2), fogMat, 12); fog.userData.dynamic = true; fog.frustumCulled = false; fog.castShadow = fog.receiveShadow = false; group.add(fog);
  function pour(t) {
    for (let i = 0; i < 12; i++) { const s = (t * 0.012 + i * 0.618) % 1, r = (3 + (i * 0.61 % 1) * 2.4) * Math.sqrt(Math.sin(s * Math.PI)), fall = Math.max(0, s - 0.5) * 2;
      fog.setMatrixAt(i, m4.makeScale(r, r * 0.42, r * 1.15).setPosition(-45 + 22 * s, 7.6 - 2.2 * fall * fall + (i % 3) * 0.4, -31 + i * 2.4 + Math.sin(s * 5 + i) * 1.2)); }
    fog.instanceMatrix.needsUpdate = true;
  }
  pour(0);
  // ---- the yacht club: on piles over the water, scalloped grey roof, glazed front, striped deck rail ----
  for (const x of [-15.4, -13.4, -11.4]) for (const z of [-2, 0, 2]) cyl(group, mats.trunk, x, SEA - 1.5, 0.5, z, 0.09, { seg: 8 });
  box(group, mats.white, [-15.8, 0.5, -2.5], [-10.9, 0.65, 2.5]); box(group, mats.glass, [-15.6, 0.65, -2.2], [-12, 1.75, 2.2]); for (let z = -2.2; z <= 2.21; z += 0.88) box(group, mats.white, [-12.02, 0.65, z - 0.04], [-11.98, 1.75, z + 0.04]);
  for (let i = 0; i < 5; i++) { const v = add(new T.CylinderGeometry(0.46, 0.46, 3.9, 20), mats.lead, -13.8, 1.72, -1.76 + i * 0.88, group); v.rotation.z = Math.PI / 2; v.scale.y = 1; }
  for (let i = 0; i < 12; i++) box(group, [mats.red, mats.white, mats.blue][i % 3], [-10.95, 0.65, -2.5 + i * 0.4167], [-10.9, 1.0, -2.5 + (i + 1) * 0.4167]);
  box(group, mats.white, [-10.96, 1.0, -2.5], [-10.88, 1.04, 2.5]); for (const z of [-2.5, 2.5]) box(group, mats.white, [-12, 0.65, z - 0.02], [-10.9, 1.0, z + 0.02]);
  cyl(group, mats.white, -11.2, 0.65, 4.4, 2.1, 0.035, { seg: 6 }); // the flagstaff, and the club's burgee: a blue pennant that flutters
  const burgee = add(new T.PlaneGeometry(0.8, 0.5, 8, 1), M('#2f6fa8', { side: T.DoubleSide }), -10.8, 4.05, 2.1, group); burgee.userData.dynamic = true; burgee.castShadow = false;
  { const p = burgee.geometry.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, p.getY(i) * (1 - (p.getX(i) + 0.4) * 1.1)); }
  slab(mats.deck, [-10.9, -0.25, -1.3], [-8.2, 0, 1.7], ['club']); for (const [x, z] of [[-8.5, 1.5], [-8.5, -1.1], [-10.2, 1.5]]) pile(x, z);
  { const g = add(new T.BoxGeometry(0.5, 0.06, 0.8), mats.deck, -10.9, 0.3, 0.2, group); g.rotation.z = -0.6; } // the gangway down from the club deck
  // The club's name over the dock, in two lines so that it can be read from across the bay.
  for (const z of [-1.25, 1.65]) cyl(group, mats.white, -8.3, 0, 3.45, z, 0.05, { seg: 8 });
  { const c = document.createElement('canvas'); c.width = 512; c.height = 160; const g = c.getContext('2d'); g.fillStyle = '#f7f3ea'; g.fillRect(0, 0, 512, 160); g.strokeStyle = g.fillStyle = '#1c2f55'; g.lineWidth = 8; g.strokeRect(6, 6, 500, 148);
    g.font = '900 64px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('SAUSALITO', 256, 50, 450); g.fillText('YACHT CLUB', 256, 114, 450);
    const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8;
    const b = add(new T.PlaneGeometry(3.1, 0.97), new T.MeshStandardMaterial({ map: t, roughness: 0.6, side: T.DoubleSide }), -8.3, 2.96, 0.2, group); b.rotation.y = Math.PI / 2; b.castShadow = false; b.userData.dynamic = true; }
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
  // Two strings of coloured bulbs over the stage, as one instanced mesh: they come on one after another, then twinkle.
  const bulbs = new T.InstancedMesh(new T.SphereGeometry(0.06, 8, 6), new T.MeshBasicMaterial(), 18), hues = [[1, 0.62, 0.22], [1, 0.8, 0.5], [1, 0.45, 0.4], [0.55, 0.9, 0.8]]; bulbs.userData.dynamic = true; bulbs.castShadow = bulbs.receiveShadow = false; group.add(bulbs);
  for (let i = 0; i <= 8; i++) { const y = 4.45 - Math.sin(i / 8 * Math.PI) * 0.25; bulbs.setMatrixAt(i, m4.makeTranslation(11.1 + i * 0.475, y, 1.1)); bulbs.setMatrixAt(9 + i, m4.makeTranslation(14.9, y, 1.1 + i * 0.425)); bulbs.setColorAt(i, tint.setRGB(1, 1, 1)); bulbs.setColorAt(9 + i, tint); }
  function festoon(t, won, still) {
    const c = bulbs.instanceColor.array;
    for (let i = 0; i < 18; i++) { const on = still ? 1 : Math.min(1, Math.max(0, (t - 2 - i * 0.45) / 0.4)), b = 0.12 + on * (won ? 4.2 : 2.2) * (still ? 1 : 0.85 + 0.15 * Math.sin(t * (won ? 6 : 2.1) + i * 2.4)), h = hues[i % 4]; c[i * 3] = h[0] * b; c[i * 3 + 1] = h[1] * b; c[i * 3 + 2] = h[2] * b; }
    bulbs.instanceColor.needsUpdate = true;
  }
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
    const f = box(g, mats.deck, [-0.6 * size, -0.12, -0.42 * size], [0.6 * size, 0.004, 0.42 * size]); f.userData = { near: [id], mech: id }; hits.push(f); // tap the boat you are in to sail it
    // The boat bobs and lies against the dock, so give it a tap target that stands clear of the planks.
    const tapBox = add(new T.BoxGeometry(1.3 * size, 0.34, 0.9 * size), ghost(), 0, 0.2, 0, g); tapBox.castShadow = tapBox.receiveShadow = false; tapBox.userData = { near: [id], mech: id }; hits.push(tapBox);
    cyl(g, mats.white, 0.35 * size, 0, 2.3 * size, 0, 0.022, { seg: 6 });
    const sg = new T.BufferGeometry(); sg.setAttribute('position', new T.Float32BufferAttribute([0.35 * size, 0.35, 0.02, 0.35 * size, 2.25 * size, 0.02, -0.75 * size, 0.42, 0.02], 3)); sg.setAttribute('uv', new T.Float32BufferAttribute([0, 0, 0, 1, 1, 0], 2)); sg.computeVertexNormals();
    const sail = add(sg, new T.MeshStandardMaterial({ color: sailMat, side: T.DoubleSide, roughness: 0.9 }), 0, 0, 0, g);
    const tg = new T.BufferGeometry(); tg.setAttribute('position', new T.Float32BufferAttribute([0.35 * size, 1.45 * size, 0.025, 0.35 * size, 2.25 * size, 0.025, -0.1 * size, 1.45 * size, 0.025], 3)); tg.setAttribute('uv', new T.Float32BufferAttribute([0, 0, 0, 1, 1, 0], 2)); tg.computeVertexNormals(); add(tg, new T.MeshStandardMaterial({ color: '#f6f1e6', side: T.DoubleSide, roughness: 0.9 }), 0, 0, 0, g);
    mechs[id] = { group: g, hub: new T.Vector3(...data.mechs[id].track[0]) }; return { g, last: new T.Vector3(), heading: 0, size, sail: sg.attributes.position, top: tg.attributes.position };
  }
  const boats = { pram: dinghy('pram', '#e8642c', 1), skiff: dinghy('skiff', '#f08a3c', 1.3) };
  // ---- the bay: yachts at their moorings, each one mesh so that it can rock out of step with the rest ----
  const yachts = [];
  function yacht(x, z, turn, hull, lamp, shadow) {
    const g = prop(x, SEA, z, turn), h = dab(g, new T.SphereGeometry(1, 18, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), hull, 0, 0.3, 0); h.scale.set(1.9, 0.6, 0.5);
    const deck = dab(g, new T.CircleGeometry(1, 18), WOOD, 0, 0.3, 0); deck.rotation.x = -Math.PI / 2; deck.scale.set(1.88, 0.49, 1);
    bar(g, CREAM, [-0.6, 0.3, -0.3], [0.5, 0.58, 0.3]); bar(g, lamp ? LAMP : DARK, [-0.5, 0.39, -0.31], [0.4, 0.5, 0.31]); rod(g, WHITE, 0.2, 0.3, 3.4, 0, 0.03); bar(g, WHITE, [-1.25, 0.95, -0.025], [0.2, 1.0, 0.025]); bar(g, hull === BLUE ? RED : BLUE, [-1.2, 1.0, -0.06], [0.15, 1.12, 0.06]);
    add(new T.SphereGeometry(0.13, 10, 8), mats.orange, x + Math.cos(turn) * 2.5, SEA + 0.03, z - Math.sin(turn) * 2.5, group); // her mooring buoy, which stays put
    yachts.push(bake(g, shadow));
  }
  yacht(9, 12, 0.4, WHITE, true, true); yacht(16, 10.5, 1.3, BLUE, false, true); yacht(-2, 12.5, 2.2, WHITE, false, true); yacht(19, 0, 0.2, WHITE, true, true);
  yacht(12.5, -10.5, 2.6, WHITE, false, false); yacht(5.5, -17, 0.7, BLUE, true, false); yacht(19.5, -6, 1.1, CREAM, true, false);
  // Far out, the ferry: double-ended, so she goes out and comes back without turning, her saloon lit.
  const ferry = prop(0.5, SEA - 0.02, -24.5, Math.PI / 4);
  bar(ferry, BLUE, [-2.1, 0, -0.72], [2.1, 0.16, 0.72]); bar(ferry, WHITE, [-2.1, 0.16, -0.7], [2.1, 0.5, 0.7]); for (const x of [-2.1, 2.1]) dab(ferry, new T.CylinderGeometry(0.7, 0.7, 0.5, 12), WHITE, x, 0.25, 0);
  bar(ferry, WHITE, [-1.8, 0.5, -0.6], [1.8, 0.98, 0.6]); bar(ferry, LAMP, [-1.7, 0.64, -0.61], [1.7, 0.84, 0.61]); bar(ferry, WHITE, [-1.1, 0.98, -0.45], [1.1, 1.36, 0.45]); bar(ferry, LAMP, [-1.0, 1.08, -0.46], [1.0, 1.26, 0.46]);
  bar(ferry, WHITE, [-0.3, 1.36, -0.3], [0.3, 1.6, 0.3]); rod(ferry, RED, -0.7, 1.36, 1.9, 0, 0.16); bake(ferry);
  // Someone on a paddleboard, going slowly round the moored boats, with a small dog sitting up on the nose of the board.
  const paddler = prop(18, SEA + 0.03, -10.5, -Math.PI / 2);
  ball(paddler, YELLOW, 0, 0, 0, 0.85, 0.045, 0.2); bar(paddler, DARK, [-0.2, 0.04, -0.07], [-0.08, 0.48, 0.07]); bar(paddler, TEAL, [-0.22, 0.48, -0.1], [-0.06, 0.88, 0.1]); ball(paddler, SKIN, -0.14, 0.99, 0, 0.09);
  rod(paddler, WOOD, 0.02, 0.1, 1.2, 0.16, 0.014).rotation.z = 0.22; bar(paddler, WOOD, [0.1, -0.04, 0.13], [0.2, 0.2, 0.19]);
  ball(paddler, BROWN, 0.5, 0.14, 0, 0.14, 0.1, 0.08); ball(paddler, BROWN, 0.6, 0.27, 0, 0.075); ball(paddler, DARK, 0.67, 0.26, 0, 0.025); for (const z of [-0.05, 0.05]) dab(paddler, new T.ConeGeometry(0.03, 0.08, 4), BROWN, 0.58, 0.36, z); rod(paddler, BROWN, 0.37, 0.16, 0.32, 0, 0.015).rotation.z = 0.5; bake(paddler);
  // Five pelicans in line astern, low over the water, passing down the bay every minute or so.
  const pelicans = prop(22, 1, -25, -Math.PI / 2);
  for (let k = 0; k < 5; k++) { const x = -k * 0.95, y = (k % 2) * 0.12; ball(pelicans, BROWN, x, y, 0, 0.24, 0.075, 0.085); for (const s of [-1, 1]) bar(pelicans, s * (k % 2 - 0.5) > 0 ? BROWN : DARK, [x - 0.07, y + 0.01, s * 0.3 - 0.3], [x + 0.09, y + 0.035, s * 0.3 + 0.3]).rotation.y = s * 0.35; ball(pelicans, WHITE, x + 0.22, y + 0.05, 0, 0.06); dab(pelicans, new T.ConeGeometry(0.025, 0.26, 5), YELLOW, x + 0.4, y + 0.02, 0).rotation.z = -Math.PI / 2; }
  bake(pelicans);
  // A harbour seal, which puts its head up in one quiet spot after another, looks about, and sinks again.
  const haunts = [[-5.5, 8.6], [6.6, 4.4], [9.6, 9.8]], seal = prop(haunts[0][0], SEA + 0.06, haunts[0][1], 0.6);
  ball(seal, SEAL, 0, 0, 0, 0.2, 0.18, 0.17); ball(seal, SEAL, 0.15, -0.04, 0, 0.11, 0.08, 0.1); ball(seal, DARK, 0.25, -0.03, 0, 0.03); for (const z of [-0.08, 0.08]) ball(seal, DARK, 0.12, 0.07, z, 0.025); bake(seal);
  // Old piles off the beach, and a heron on the tallest, which now and then bows to look into the water.
  for (const [x, z, top, lean] of [[-7.4, 7.2, 0.75, 0], [-8.1, 6.5, 0.2, -0.06], [-6.8, 8.1, 0.4, 0.05], [-7.9, 8.4, 0.05, 0.08], [-6.9, 6.4, -0.1, -0.04]]) cyl(group, mats.trunk, x, SEA - 1.5, top, z, 0.09, { seg: 7 }).rotation.z = lean;
  const heron = prop(-7.4, 0.75, 7.2, 0.5);
  for (const z of [-0.03, 0.03]) rod(heron, YELLOW, 0, 0, 0.45, z, 0.012); ball(heron, HERON, -0.03, 0.55, 0, 0.21, 0.11, 0.1).rotation.z = 0.35; rod(heron, HERON, 0.15, 0.58, 1.0, 0, 0.03, 0.022).rotation.z = -0.2;
  ball(heron, WHITE, 0.25, 1.03, 0, 0.075, 0.05, 0.045); ball(heron, DARK, 0.2, 1.07, 0, 0.07, 0.02, 0.03); dab(heron, new T.ConeGeometry(0.022, 0.26, 5), YELLOW, 0.42, 1.02, 0).rotation.z = -Math.PI / 2; bake(heron, true);
  // ---- the foreshore south of the club: a shore path with lamps and benches, a small beach, and a boatyard ----
  box(group, mats.walk, [-12.4, -0.21, 2.7], [-11.4, -0.17, 30]).castShadow = false; box(group, mats.lawn, [-16.2, -0.21, 2.9], [-12.4, -0.185, 14.2]).castShadow = false;
  box(group, mats.sand, [-11.4, -0.21, 6.2], [-10.85, -0.14, 13.4]); box(group, mats.sand, [-10.9, -0.335, 6.2], [-9.1, -0.285, 13.4]).rotation.z = -0.19;
  const upturned = (x, y, z, mat, turn) => { const b = add(new T.SphereGeometry(1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat, x, y, z, group); b.scale.set(0.8, 0.27, 0.26); b.rotation.y = turn; return b; };
  upturned(-11.1, -0.14, 7.4, mats.red, 1.45); upturned(-11.12, -0.14, 9.1, mats.teal, 1.7); upturned(-11.1, -0.14, 12.3, mats.yellow, 1.5);
  for (const z of [4.3, 8.5, 12.7, 18.9, 23.2, 27.6]) { cyl(group, mats.iron, -12.6, -0.2, 1.25, z, 0.03, { seg: 6 }); pane(-12.6, 1.33, z, 0.16, 0.16, 0.16, -1); }
  for (const z of [5.4, 10.6]) { box(group, mats.deck, [-12.95, 0.02, z - 0.45], [-12.65, 0.07, z + 0.45]); box(group, mats.deck, [-13.0, 0.07, z - 0.45], [-12.95, 0.32, z + 0.45]); for (const s of [-0.38, 0.38]) box(group, mats.iron, [-12.93, -0.2, z + s - 0.03], [-12.68, 0.02, z + s + 0.03]); }
  function palm(x, z, h, lean) {
    cyl(group, mats.trunk, x + lean / 2, -0.2, -0.2 + h, z, 0.08, { rTop: 0.05, seg: 6 }).rotation.z = -Math.atan2(lean, h);
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + x, f = add(new T.ConeGeometry(0.16, 1.4, 4), mats.palm, x + lean + Math.cos(a) * 0.55, h - 0.3, z + Math.sin(a) * 0.55, group); f.scale.z = 0.22; f.rotation.set(0, -a, -Math.PI / 2 - 0.42, 'YXZ'); }
  }
  palm(-13.4, 7.6, 2.6, 0.3); palm(-13.6, 12.2, 3.0, -0.25); palm(-13.3, 25.4, 2.7, 0.3);
  // The boatyard: a tin-roofed shed, rails down a slip into the water with a skiff on it, and two yachts hauled out on stands.
  box(group, mats.cream, [-16.8, -0.2, 14.6], [-13.7, 1.5, 17.6]); roof(group, mats.tin, [-17, 14.4], [-13.5, 17.8], 1.5, 0.7, { alongZ: false, hip: 0 }); box(group, mats.iron, [-13.7, -0.2, 15.2], [-13.67, 1.1, 17.0]);
  box(group, mats.walk, [-11.5, -0.485, 15.2], [-8.3, -0.405, 17.0]).rotation.z = -0.16;
  for (const z of [15.6, 16.6]) { box(group, mats.iron, [-13.7, -0.2, z - 0.03], [-11.4, -0.15, z + 0.03]); box(group, mats.iron, [-11.5, -0.405, z - 0.03], [-8.3, -0.365, z + 0.03]).rotation.z = -0.16; }
  upturned(-10.3, -0.33, 16.1, mats.blue, 0).rotation.z = -0.16;
  const hauled = (x, z, turn, mat) => { const g = new T.Group(); g.position.set(x, -0.2, z); g.rotation.y = turn; group.add(g); const h = add(new T.SphereGeometry(1, 16, 10), mat, 0, 1.0, 0, g); h.scale.set(1.6, 0.42, 0.45);
    box(g, mats.iron, [-0.5, 0.15, -0.06], [0.45, 0.7, 0.06]); box(g, mats.white, [-0.5, 1.3, -0.26], [0.4, 1.55, 0.26]); cyl(g, mats.white, 0.15, 1.3, 4.2, 0, 0.03, { seg: 6 }); box(g, mats.trunk, [-0.3, 0, -0.3], [0.3, 0.15, 0.3]);
    for (const [sx, sz] of [[-0.8, -0.5], [0.8, -0.5], [-0.8, 0.5], [0.8, 0.5]]) cyl(g, mats.trunk, sx, 0, 0.85, sz, 0.03, { seg: 5 }).rotation.x = -sz * 0.6; };
  hauled(-14.7, 20.3, 0.3, mats.white); hauled(-14.1, 23.2, -0.25, mats.blue);
  house(-15.4, -0.2, 26.6, 7); house(-17.4, -0.2, 29.4, 4); for (const [x, z, s] of [[-16.6, 21.6, 1.5], [-18.4, 24.8, 1.8], [-16.2, 31.6, 1.5], [-19.5, 18.6, 1.7], [-14.6, 12.6, 1.1]]) tree(group, x, -0.2, z, s);
  // Every pane, sorted by when it is lit, so that lighting them is a walk along the list.
  panes.sort((a, b) => a[6] - b[6]);
  const glass = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), new T.MeshBasicMaterial(), panes.length); glass.userData.dynamic = true; glass.castShadow = glass.receiveShadow = false; group.add(glass);
  panes.forEach(([x, y, z, sx, sy, sz], i) => { glass.setMatrixAt(i, m4.makeScale(sx, sy, sz).setPosition(x, y, z)); glass.setColorAt(i, tint.setRGB(0.05, 0.07, 0.1)); });
  let lit = 0;
  function lamps(t) {
    const c = glass.instanceColor.array;
    for (let i = lit; i < panes.length && panes[i][6] < t; i++) { const k = Math.min(1, (t - panes[i][6]) / 1.5); c[i * 3] = 0.05 + 2.15 * k; c[i * 3 + 1] = 0.07 + 1.28 * k; c[i * 3 + 2] = 0.1 + 0.35 * k; if (k === 1 && i === lit) lit++; glass.instanceColor.needsUpdate = true; }
  }
  lamps(0);

  for (const [id, n] of Object.entries(data.nodes)) if (n.pos) { const h = add(new T.BoxGeometry(1, 0.06, 1), ghost(), n.pos[0], n.pos[1] + 0.03, n.pos[2], group); h.castShadow = h.receiveShadow = false; h.userData.near = [id]; hits.push(h); }
  mergeStatic(group, new Set(hits));
  const up = [new T.Vector3(13, 0, 5.3), new T.Vector3(13, 3, 4.7)], down = up.slice().reverse(); up.slow = down.slow = true;
  let posed = false;
  function update(time, model, still, state, live) {
    for (const [id, b] of Object.entries(boats)) { if (!live) continue; const p = live(id); if (was.copy(p).sub(b.last).lengthSq() > 1e-6) b.heading = Math.atan2(-was.z, was.x); b.last.copy(p); b.g.position.set(p.x, still ? 0 : Math.sin(time * 1.3 + p.x) * 0.02, p.z); b.g.rotation.y = b.heading; b.g.rotation.x = still ? 0 : Math.sin(time * 0.9 + p.z) * 0.03;
      // The sails luff: the clew of each swings a little either side of the boom's line.
      if (!still) { const k = Math.sin(time * 2.3 + b.size * 4) * 0.05 + Math.sin(time * 6.1 + b.size) * 0.012; b.sail.setZ(2, 0.02 + k); b.top.setZ(2, 0.025 + k * 0.42); b.sail.needsUpdate = b.top.needsUpdate = true; } }
    festoon(time, model.won, still);
    // With motion reduced, every lamp is simply lit and everything else stays where it was built.
    if (still) { if (!posed) { lamps(1e6); posed = true; } return; }
    lamps(time); pour(time);
    for (let i = 0; i < yachts.length; i++) { const g = yachts[i]; g.rotation.x = Math.sin(time * 0.7 + i * 1.7) * 0.05; g.rotation.z = Math.sin(time * 0.53 + i * 2.3) * 0.02; g.position.y = SEA + Math.sin(time * 0.9 + i) * 0.025; }
    { const p = burgee.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i) + 0.4; p.setZ(i, Math.sin(time * 5 - x * 7) * 0.06 * x); } p.needsUpdate = true; }
    // The ferry runs out along one line and back; the paddler goes round an ellipse; the pelicans pass and come again.
    { const u = 9 + 50 * (0.5 - 0.5 * Math.cos(time * 0.024 + 5.08)); ferry.position.set((u - 24) / 2, SEA - 0.02 + Math.sin(time * 0.6) * 0.012, (-u - 24) / 2); }
    { const a = time * 0.05; paddler.position.set(12 + 6 * Math.cos(a), SEA + 0.03 + Math.sin(time * 3.4) * 0.006, -10.5 + 3.5 * Math.sin(a)); paddler.rotation.y = Math.atan2(-3.5 * Math.cos(a), -6 * Math.sin(a)); paddler.rotation.x = Math.sin(time * 1.7) * 0.06; }
    pelicans.position.set(22, 0.95 + Math.sin(time * 0.6) * 0.2, -45 + (time * 1.5 + 20) % 110); pelicans.rotation.x = Math.sin(time * 0.6 + 1) * 0.08;
    { const c = (time + 3) % 26, at = haunts[Math.floor((time + 3) / 26) % 3], k = Math.max(0, Math.min(1, c / 1.5, (10.5 - c) / 1.5)); seal.visible = k > 0; seal.position.set(at[0], SEA - 0.34 + 0.4 * k * k * (3 - 2 * k), at[1]); seal.rotation.y = at[0] + Math.sin(time * 0.55); }
    { const c = time % 19; heron.rotation.z = c > 16 ? -0.6 * Math.sin((c - 16) / 3 * Math.PI) : 0; heron.rotation.y = 0.5 + Math.sin(time * 0.21) * 0.3; }
  }
  const frame = [[-11.5, 0, 1.8], [-15.8, 2.4, -2.5], [-21.5, 8.5, -3.5], [6.4, 1.5, -3.6], [15.4, 0, 1], [15.2, 4.6, 4.6], [13.6, 0, 7.8], [2.5, 0, 9.2], [-9, SEA, 2.4]];
  return { group, hits, mechs, update, frame, routes: { 'stern>roof': up, 'roof>stern': down }, water: SEA, birds: { x: 3, z: 4, h: 6.5, color: '#f4f4f0' }, shadowSize: 34 };
}
