import * as T from '../../tower/vendor/three.js';
// The Monterey Bay Aquarium as a cut-away: the old cannery's corrugated walls and three smokestacks at the back,
// the kelp forest tank three storeys high, a grey whale hanging from the roof, the jellies glowing in the dark,
// and outside a deck over the rocks with sea otters in the kelp. Behind runs Cannery Row, with its sheds and a
// few cars; to the west the sand, the ice plant and the cypresses. Built from memory, not from photographs.
// Positions must agree with chapters/monterey.mjs.
const SEA = -2;
// The lettering over the hall, fitted to its board, and corrugated iron: both are drawn here, so nothing is loaded.
function signTexture(text) {
  const c = document.createElement('canvas'); c.width = 1792; c.height = 256; const g = c.getContext('2d'); let px = 176;
  g.fillStyle = '#12324a'; g.fillRect(0, 0, 1792, 256); g.strokeStyle = '#f1e6cf'; g.lineWidth = 10; g.strokeRect(14, 14, 1764, 228);
  do { px -= 4; g.font = `900 ${px}px Georgia, serif`; } while (g.measureText(text).width > 1560);
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#f1e6cf'; g.fillText(text, 896, 134);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; return t;
}
function ribTexture() {
  const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
  for (let x = 0; x < 256; x++) { const v = Math.round(196 + 56 * Math.sin(x / 32 * Math.PI * 2)); g.fillStyle = `rgb(${v},${v},${v})`; g.fillRect(x, 0, 1, 256); }
  g.fillStyle = 'rgba(0,0,0,0.14)'; for (const y of [0, 128]) g.fillRect(0, y, 256, 3); // where one sheet laps the next
  const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; return t;
}
// Several shapes baked into one, so a creature made of a dozen parts still draws once.
function fuse(geos) {
  const parts = geos.map(g => g.index ? g.toNonIndexed() : g), out = new T.BufferGeometry();
  for (const [k, n] of [['position', 3], ['normal', 3], ['uv', 2]]) { const a = new Float32Array(parts.reduce((s, p) => s + p.attributes[k].array.length, 0)); let at = 0; for (const p of parts) { a.set(p.attributes[k].array, at); at += p.attributes[k].array.length; } out.setAttribute(k, new T.BufferAttribute(a, n)); }
  return out;
}
const smooth = k => k <= 0 ? 0 : k >= 1 ? 1 : k * k * (3 - 2 * k), pulse = (v, a, b, w) => smooth((v - a) / w) * (1 - smooth((v - b) / w));
export function createMontereyScene(kit, data) {
  const { mats, add, box, cyl, cone, roof, mergeStatic } = kit, group = new T.Group(), hits = [], mechs = {};
  const ghost = () => new T.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
  const M = (color, extra = {}) => new T.MeshStandardMaterial({ color, roughness: 0.8, ...extra });
  const ribs = ribTexture(), iron = (color, extra = {}) => M(color, { map: ribs, roughness: 0.55, metalness: 0.3, ...extra });
  const tin = iron('#a9bfc2'), tinDark = M('#5f7478', { roughness: 0.5, metalness: 0.4 }), whaleGrey = M('#7c868c', { roughness: 0.7 }), kelp = M('#8a8a2c', { roughness: 0.9 }), kelpDark = M('#5d6b22'), otter = M('#6b4a34'), night = M('#12233f');
  const lit = M('#2f7896', { emissive: '#1f6f93', emissiveIntensity: 0.38, roughness: 0.25 }), silver = M('#c9d3d8', { metalness: 0.6, roughness: 0.3 }), dark = M('#2b2622'), foamA = new T.MeshBasicMaterial({ color: '#f4fbfb', transparent: true, opacity: 0.6, depthWrite: false }), foamB = foamA.clone();
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
  // One sheet of ribbed iron for each wall, with the shed itself standing behind it, a stone footing and a white cornice.
  box(group, tin, [-8.5, 0, -5.2], [4.2, 7.6, -5]); box(group, tin, [-8.7, 0, -5], [-8.5, 7.6, 1.5]); box(group, tinDark, [-8.5, -0.3, -7.4], [4.2, 7.6, -5.2]);
  box(group, mats.stone, [-8.5, 0, -5], [4.2, 0.4, -4.93]); box(group, mats.stone, [-8.5, 0, -5], [-8.43, 0.4, 1.5]); box(group, mats.white, [-8.7, 7.46, -5.2], [4.2, 7.6, -4.92]); box(group, mats.white, [-8.7, 7.46, -5], [-8.42, 7.6, 1.56]);
  // A factory window: a lit pane in a white frame, with glazing bars unless it is the front of a tank.
  function pane(face, x, y, z, w, h, bars = true) {
    const g = new T.Group(); g.position.set(x, y, z); if (face === 'x') g.rotation.y = Math.PI / 2; group.add(g);
    box(g, lit, [-w / 2, -h / 2, 0], [w / 2, h / 2, 0.03]).castShadow = false; box(g, mats.white, [-w / 2 - 0.08, h / 2, 0], [w / 2 + 0.08, h / 2 + 0.1, 0.1]); box(g, mats.white, [-w / 2 - 0.12, -h / 2 - 0.1, 0], [w / 2 + 0.12, -h / 2, 0.14]);
    for (const s of [-1, 1]) box(g, mats.white, [s * w / 2 - 0.04, -h / 2, 0], [s * w / 2 + 0.04, h / 2, 0.08]);
    if (bars) { for (const i of [1, 2]) box(g, mats.white, [-w / 2 + w * i / 3 - 0.018, -h / 2, 0.02], [-w / 2 + w * i / 3 + 0.018, h / 2, 0.06]); for (const i of [1, 2, 3]) box(g, mats.white, [-w / 2, -h / 2 + h * i / 4 - 0.018, 0.02], [w / 2, -h / 2 + h * i / 4 + 0.018, 0.06]); }
  }
  for (const x of [-6.6, -4.2, 2.4]) pane('z', x, 4.8, -5, 1.4, 2.8); pane('x', -8.5, 3.35, 0.5, 1.4, 2.1); pane('x', -8.5, 3.35, -3.3, 1.4, 2.1, false);
  for (let i = 0; i < 4; i++) { const x0 = -8.5 + i * 3.18; const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute([x0, 7.6, -5, x0 + 3.18, 7.6, -5, x0, 9.1, -5, x0, 7.6, -7.4, x0 + 3.18, 7.6, -7.4, x0, 9.1, -7.4], 3)); g.setIndex([0, 1, 2, 3, 5, 4, 2, 1, 4, 2, 4, 5, 0, 2, 5, 0, 5, 3]); g.computeVertexNormals(); const uv = new Float32Array(12); g.setAttribute('uv', new T.BufferAttribute(uv, 2)); add(g, tinDark, 0, 0, 0, group); }
  for (const x of [-7, -5.2, -3.4]) { cyl(group, mats.rock, x, 7.6, 12.6, -6.4, 0.42, { rTop: 0.34, seg: 20 }); cyl(group, mats.iron, x, 12.6, 12.8, -6.4, 0.37, { seg: 20 }); }
  // The roof beams rest on a column at each end; the far one stands in the water.
  box(group, mats.iron, [-8.5, 7.6, 2.9], [8.2, 7.85, 3.1]); box(group, mats.iron, [-8.5, 7.6, -1.1], [8.2, 7.85, -0.9]); for (const x of [8.1]) for (const z of [3, -1]) box(group, mats.iron, [x - 0.1, z < 2 ? SEA - 1 : 0, z - 0.1], [x + 0.1, 7.6, z + 0.1]); box(group, mats.iron, [-8.5, 0, 2.9], [-8.3, 7.6, 3.1]);
  { const b = add(new T.PlaneGeometry(6.9, 0.96), new T.MeshStandardMaterial({ map: signTexture('MONTEREY BAY AQUARIUM'), roughness: 0.6 }), -4.85, 6.93, -4.97, group); b.castShadow = false; b.userData.dynamic = true; }
  // The touch pool, and the mouth of the children's crawl tunnel.
  cyl(group, mats.rock, -3.4, 0, 0.45, 0.6, 1.2, { seg: 9 }); cyl(group, mats.glass, -3.4, 0.45, 0.47, 0.6, 0.95, { seg: 24 }); box(group, mats.rock, [-2.3, 0, 0.9], [-1.5, 0.7, 1.7]); box(group, mats.iron, [-1.52, 0, 1.05], [-1.48, 0.5, 1.55]);
  // Somebody lives in the touch pool, and comes up for a look round every so often.
  const octo = new T.Group(); octo.userData.dynamic = true; octo.position.set(-3.6, 0.47, 1.35); group.add(octo);
  { const arms = [0, 1, 2, 3, 4].map(i => new T.SphereGeometry(0.08, 8, 6).scale(1.9, 0.5, 0.7).translate(0.15, 0, 0).rotateY(i * 1.26 + 0.4)), eyes = (r, out) => [-1, 1].map(e => new T.SphereGeometry(r, 8, 6).translate(0.075 + e * 0.045 + out, 0.215 + out * 0.5, 0.075 - e * 0.045 + out));
    add(fuse([new T.SphereGeometry(0.15, 14, 10).scale(1, 1.15, 1).translate(0, 0.16, 0), ...arms]), M('#e0623f', { roughness: 0.6 }), 0, 0, 0, octo);
    add(fuse(eyes(0.042, 0)), mats.white, 0, 0, 0, octo).castShadow = false; add(fuse(eyes(0.021, 0.022)), dark, 0, 0, 0, octo).castShadow = false; }
  // ---- the kelp forest tank ----
  box(group, mats.rock, [-1.5, 0, -1.2], [1.5, 0.35, 2.4]);
  const tank = add(new T.BoxGeometry(3, 5.65, 3.6), glassTank, 0, 3.17, 0.6, group); tank.userData.dynamic = true; tank.castShadow = false;
  for (const [x, z] of [[-1.5, -1.2], [1.5, -1.2], [-1.5, 2.4], [1.5, 2.4]]) box(group, mats.iron, [x - 0.06, 0, z - 0.06], [x + 0.06, 6, z + 0.06]); for (const z of [-1.2, 2.4]) box(group, mats.iron, [-1.5, 5.9, z - 0.06], [1.5, 6, z + 0.06]); for (const x of [-1.5, 1.5]) box(group, mats.iron, [x - 0.06, 5.9, -1.2], [x + 0.06, 6, 2.4]);
  // Giant kelp: each stalk and its blades are one swaying piece, kept clear of the glass.
  const stalks = [];
  for (let i = 0; i < 9; i++) { const g = new T.Group(), h = 4.2 + (i * 0.7 % 1.2), pts = [], blades = []; g.userData.dynamic = true; g.position.set(-0.8 + (i % 3) * 0.72 + (i * 0.37 % 0.3) * 0.5, 0.35, -0.7 + Math.floor(i / 3) * 1.25); group.add(g);
    for (let k = 0; k <= 6; k++) pts.push(new T.Vector3(Math.sin(k * 1.3 + i) * 0.16, h * k / 6, Math.cos(k * 1.1 + i) * 0.15));
    add(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 40, 0.035, 6), kelpDark, 0, 0, 0, g);
    for (let k = 1; k < 6; k++) blades.push(new T.SphereGeometry(0.19, 8, 6).scale(1, 0.28, 0.5).rotateZ(k % 2 ? 0.45 : -0.45).translate(pts[k].x + (k % 2 ? 0.15 : -0.15), pts[k].y, pts[k].z));
    add(fuse(blades), kelp, 0, 0, 0, g); stalks.push(g); }
  // A shoal of sardines, drawn as one; three orange garibaldi among the kelp; and a leopard shark low down.
  const sardine = fuse([new T.SphereGeometry(0.065, 8, 6).scale(1.9, 0.75, 0.45), new T.ConeGeometry(0.05, 0.08, 4).rotateZ(-Math.PI / 2).scale(1, 1, 0.3).translate(-0.14, 0, 0)]);
  const shoal = new T.InstancedMesh(sardine, silver, 36), at = new T.Object3D(); shoal.userData.dynamic = true; shoal.castShadow = shoal.receiveShadow = false; shoal.frustumCulled = false; group.add(shoal);
  const fish = [], orange = M('#f08a2a'); for (let i = 0; i < 3; i++) { const f = add(sardine, orange, 0, 0, 0, group); f.scale.set(1.5, 2.1, 1.6); f.userData.dynamic = true; f.castShadow = false; fish.push({ mesh: f, r: 0.3 + i * 0.26, h: 1.7 + i * 1.15, sp: 0.2 + i * 0.05, ph: i * 1.9 }); }
  const shark = new T.Group(); shark.userData.dynamic = true; group.add(shark);
  { const fin = (r, h, x, y, z, rx, rz) => new T.ConeGeometry(r, h, 4).scale(1, 1, 0.22).rotateZ(rz).rotateX(rx).translate(x, y, z);
    add(fuse([new T.SphereGeometry(1, 16, 10).scale(0.55, 0.1, 0.11), fin(0.1, 0.34, -0.62, 0.08, 0, 0, 0.9), fin(0.07, 0.16, 0.08, 0.14, 0, 0, 0.5), fin(0.06, 0.12, -0.3, 0.1, 0, 0, 0.5), fin(0.08, 0.26, 0.2, -0.03, 0.14, 1.2, 0.5), fin(0.08, 0.26, 0.2, -0.03, -0.14, -1.2, 0.5)]), M('#b3a78c'), 0, 0, 0, shark).castShadow = false;
    add(fuse([0, 1, 2, 3, 4, 5, 6].map(i => new T.SphereGeometry(0.045, 8, 5).scale(1.3, 0.3, 1).translate(0.4 - i * 0.14, 0.094 - Math.abs(i - 2.5) * 0.006, (i % 2 - 0.5) * 0.07))), dark, 0, 0, 0, shark).castShadow = false; }
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
  const jellyGeo = fuse([new T.SphereGeometry(0.13, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), ...[-1, 0, 1].map(k => new T.CylinderGeometry(0.008, 0.008, 0.3, 4).translate(k * 0.05, -0.15, 0))]), moon = new T.MeshStandardMaterial({ color: '#d9efff', emissive: '#8fd0ff', emissiveIntensity: 1.3, transparent: true, opacity: 0.92 });
  const jellies = []; for (let i = 0; i < 7; i++) { const j = add(jellyGeo, jelly, 4.5 + (i * 0.47 % 1.3), 3.75 + (i * 0.31 % 0.5), 0.32 + (i % 2) * 0.12, group); j.userData = { dynamic: true, y: j.position.y }; j.castShadow = false; jellies.push(j); }
  // Two moon jellies drift behind the glass of the lit tank in the side wall.
  for (const [y, z, s] of [[3.0, -3.65, 1.5], [3.7, -3.0, 1.2]]) { const j = add(jellyGeo, moon, -8.4, y, z, group); j.userData = { dynamic: true, y, s }; j.castShadow = false; jellies.push(j); }
  lever(4.5, 3, 1.5, 'whale', 'jellies', mats.blue);
  // ---- the sea door, the deck over the rocks, the slides ----
  box(group, mats.iron, [4.1, 0, 2.4], [4.3, 2.4, 2.6]); box(group, mats.iron, [4.1, 0, 4.4], [4.3, 2.4, 4.6]); box(group, mats.iron, [4.1, 2.4, 2.4], [4.3, 2.6, 4.6]);
  const door = box(group, mats.glass, [4.16, 0, 2.6], [4.24, 2.4, 4.4]); door.userData.dynamic = true;
  slab(mats.deck, [4.2, -0.25, 2.2], [8.4, 0, 8], ['deck', 'hall']); for (const [x, z] of [[4.6, 7.6], [8, 7.6], [8, 2.6], [6.3, 7.6], [8, 5]]) cyl(group, mats.trunk, x, SEA - 1, -0.25, z, 0.09, { seg: 8 });
  for (const [a, b] of [[[4.25, 7.95], [8.35, 7.95]], [[8.35, 2.25], [8.35, 7.95]]]) { const len = Math.hypot(b[0] - a[0], b[1] - a[1]), r = add(new T.BoxGeometry(len, 0.03, 0.03), mats.white, (a[0] + b[0]) / 2, 0.45, (a[1] + b[1]) / 2, group); r.rotation.y = -Math.atan2(b[1] - a[1], b[0] - a[0]); for (let i = 0; i <= 5; i++) cyl(group, mats.white, a[0] + (b[0] - a[0]) * i / 5, 0, 0.45, a[1] + (b[1] - a[1]) * i / 5, 0.022, { seg: 6 }); }
  cyl(group, mats.brass, 7.6, 0, 0.9, 7.3, 0.03, { seg: 8 }); const scope = cyl(group, mats.brass, 7.6, 0.9, 1.3, 7.3, 0.06, { seg: 10 }); scope.rotation.z = 1.1;
  const longSlide = [[1.4, 6.05, 3.6], [2.6, 5.2, 4.6], [3.9, 3.6, 5.6], [5, 1.8, 6.2], [5.8, 0.5, 6.2], [6, 0.1, 6]], shortSlide = [[5.2, 3.05, 1.9], [5.6, 2.2, 3.2], [5.9, 1.0, 4.6], [6, 0.2, 5.6], [6, 0.1, 6]];
  tube(longSlide, 0.16, mats.yellow); tube(shortSlide, 0.14, mats.teal);
  // ---- outside: rocks, kelp on the water, sea otters, a seal ----
  // Boulders: a lumpy stone and two smaller ones against it, each ringed with foam where the swell breaks.
  const lump = (seed, sx, sy, sz) => { const g = new T.IcosahedronGeometry(1, 1), p = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = 1 + 0.2 * Math.sin(x * 3.1 + seed) * Math.cos(y * 2.7 + seed * 1.7) + 0.13 * Math.sin(z * 4.3 + seed * 2.3 + x * 2); p.setXYZ(i, x * k * sx, y * k * sy, z * k * sz); uv.setXY(i, x * k * sx / 2.5 + seed, (z * sz + y * sy) * k / 2.5); }
    g.computeVertexNormals(); return g; };
  const ringGeo = new T.RingGeometry(0.8, 1.13, 30).rotateX(-Math.PI / 2); { const p = ringGeo.attributes.position; for (let i = 0; i < p.count; i++) { const k = 1 + 0.035 * Math.sin(Math.atan2(p.getZ(i), p.getX(i)) * 7); p.setXYZ(i, p.getX(i) * k, 0, p.getZ(i) * k); } }
  const foam = [], rocks = [[10, 9.5, 1.3, 0.9], [3, 7.6, 1.6, 0.7], [-3.5, 7, 2.2, 0.6], [11.5, 4, 1.1, 1.1], [-8, 7.4, 1.8, 0.5], [7, 11.5, 1.0, 0.5], [10.5, -2, 2.4, 1.2]];
  rocks.forEach(([x, z, r, h], i) => { add(lump(i * 1.9 + 1, r, h + 0.25, r * 0.85), mats.rock, x, SEA - 0.25, z, group);
    for (const a of [i * 2.4 + 0.6, i * 2.4 + 2.9]) add(lump(i * 3.1 + a, r * 0.42, h * 0.5 + 0.2, r * 0.36), mats.rock, x + Math.cos(a) * r * 0.95, SEA - 0.15, z + Math.sin(a) * r * 0.8, group);
    const f = add(ringGeo, i % 2 ? foamA : foamB, x, SEA + 0.03, z, group); f.userData = { dynamic: true, r, ph: i * 1.3 }; f.castShadow = f.receiveShadow = false; f.scale.set(r, 1, r * 0.85); foam.push(f); });
  // The swell also breaks along the foot of the sea wall, as a ragged white edge that comes and goes.
  const surf = len => { const n = Math.round(len * 2), pos = [], uv = [], idx = []; for (let i = 0; i <= n; i++) { const x = -len / 2 + len * i / n; pos.push(x, 0, 0, x, 0, 0.14 + 0.09 * Math.sin(i * 1.9) + 0.05 * Math.sin(i * 0.7)); uv.push(i / n, 0, i / n, 1); if (i < n) idx.push(i * 2, i * 2 + 1, i * 2 + 2, i * 2 + 1, i * 2 + 3, i * 2 + 2); }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return g; };
  for (const [x0, x1, z, m] of [[-40, 4.6, 5, foamA], [4.6, 30, -6, foamB]]) { const f = add(surf(x1 - x0), m, (x0 + x1) / 2, SEA + 0.03, z, group); f.userData = { dynamic: true, ph: z }; f.castShadow = f.receiveShadow = false; foam.push(f); }
  // Kelp lying on the water: each bed is one raft of blades that turns a little on the swell.
  const beds = []; for (const [x, z, s] of [[1, 10.5, 1.6], [6, 13, 2.0], [12.5, 8, 1.4], [-5, 11, 1.8], [13, 12.5, 1.5]]) { const blades = []; for (let i = 0; i < 24; i++) { const a = i * 2.4, d = Math.sqrt((i + 0.5) / 24) * 1.2 * s; blades.push(new T.SphereGeometry(0.3 * s, 8, 5).scale(1, 0.05, 0.36).rotateY(0.4 + Math.sin(i * 1.7) * 0.5).translate(Math.cos(a) * d, 0, Math.sin(a) * d * 0.7)); }
    const b = add(fuse(blades), beds.length % 2 ? kelp : kelpDark, x, SEA + 0.02, z, group); b.userData = { dynamic: true, x }; b.castShadow = false; beds.push(b); }
  // Sea otters on their backs, paws on their chests. Two of them hold paws so as not to drift apart; the others roll over now and then.
  const otterBody = fuse([new T.CapsuleGeometry(0.13, 0.5, 4, 10).rotateZ(Math.PI / 2), new T.SphereGeometry(0.07, 8, 6).scale(2, 0.5, 0.8).translate(-0.47, 0.02, 0), ...[-1, 1].flatMap(s => [new T.SphereGeometry(0.045, 6, 5).translate(0.14, 0.13, s * 0.05), new T.SphereGeometry(0.055, 6, 5).scale(1.4, 0.6, 1).translate(-0.3, 0.11, s * 0.07)])]);
  const otterFace = fuse([new T.SphereGeometry(0.11, 10, 8).translate(0.38, 0.04, 0), new T.SphereGeometry(0.1, 8, 6).scale(1.5, 0.5, 0.9).translate(0.16, 0.09, 0)]);
  const otters = [], afloat = (parent, z) => { const o = new T.Group(); o.position.z = z; parent.add(o); add(otterBody, otter, 0, 0, 0, o); add(otterFace, mats.cream, 0, 0, 0, o); return o; };
  for (const [x, z, a, pair] of [[1.6, 10.2, 0.4, true], [6.6, 12.6, 2.0], [-4.4, 10.6, 1.1]]) { const o = new T.Group(); o.userData = { dynamic: true, a }; o.position.set(x, SEA + 0.06, z); o.rotation.y = a; group.add(o); o.userData.roll = pair ? (afloat(o, -0.16), afloat(o, 0.16), null) : afloat(o, 0); otters.push(o); }
  // A harbour seal hauled out on the widest rock, lifting its head to look about.
  const seal = new T.Group(), neck = new T.Group(), sealGrey = M('#8e969b', { roughness: 0.6 }); seal.userData.dynamic = true; seal.position.set(-3.6, SEA + 0.58, 6.9); seal.rotation.y = 0.5; group.add(seal); neck.position.set(0.3, 0.14, 0); seal.add(neck);
  add(fuse([new T.SphereGeometry(1, 14, 10).scale(0.45, 0.16, 0.19).translate(0, 0.14, 0), ...[-1, 1].map(s => new T.SphereGeometry(0.1, 8, 6).scale(1.5, 0.3, 0.8).rotateY(s * 0.5).translate(-0.5, 0.08, s * 0.07))]), sealGrey, 0, 0, 0, seal);
  add(fuse([new T.SphereGeometry(0.13, 10, 8).scale(1.3, 1, 1).translate(0.04, 0, 0), new T.SphereGeometry(0.105, 10, 8).scale(1.2, 1, 1).translate(0.19, 0.03, 0)]), sealGrey, 0, 0, 0, neck);
  add(fuse([new T.SphereGeometry(0.022, 6, 5).translate(0.315, 0.03, 0), ...[-1, 1].map(s => new T.SphereGeometry(0.02, 6, 5).translate(0.25, 0.08, s * 0.075))]), dark, 0, 0, 0, neck).castShadow = false;
  // ---- the town: Cannery Row behind the aquarium, its sheds, and a second street behind those ----
  box(group, mats.rock, [-40, SEA - 1, -40], [-9, -0.3, 5]).castShadow = false; box(group, mats.rock, [-9, SEA - 1, -40], [30, -0.3, -6]).castShadow = false;
  const lot = M('#cfc7b2', { roughness: 1 }), sheds = [iron('#b9cbcd'), iron('#efe4cc'), iron('#b5c4a8'), iron('#d9c79c')], rust = M('#8a6a58', { roughness: 0.7 }), glazing = M('#56788a', { roughness: 0.3 });
  box(group, lot, [-13, -0.31, -40], [30, -0.28, -7.6]).castShadow = false;
  for (const [z0, z1] of [[-10.2, -8], [-16.4, -14.3]]) { box(group, mats.road, [-13, -0.31, z0], [30, -0.26, z1]).castShadow = false; for (let x = -12.5; x < 30; x += 2) box(group, mats.cream, [x, -0.3, (z0 + z1) / 2 - 0.03], [x + 0.8, -0.25, (z0 + z1) / 2 + 0.03]).castShadow = false; }
  box(group, mats.walk, [-13, -0.31, -10.7], [30, -0.23, -10.2]); box(group, mats.walk, [-13, -0.31, -8], [-8.5, -0.23, -7.6]); box(group, mats.walk, [4.2, -0.31, -8], [30, -0.23, -6.3]);
  // The Row ends at the aquarium, as it does: the sheds stand only to the east of it.
  for (let r = 0; r < 2; r++) for (let i = 0; i < 9 - r; i++) { const x = -9.8 + i * 4.4 + r * 1.7, z1 = r ? -16.8 : -10.8, h = 2.2 + ((i * 37 + r * 5) % 4) * 0.7;
    box(group, sheds[(i * 3 + r) % 4], [x, -0.3, z1 - 3.2], [x + 3.9, h, z1]); roof(group, (i + r) % 3 ? tinDark : rust, [x - 0.12, z1 - 3.32], [x + 4.02, z1 + 0.12], h, 0.9, { alongZ: i % 2 === 0, hip: 0 });
    for (let k = 0; k < 3; k++) box(group, glazing, [x + 0.45 + k * 1.15, h * 0.42, z1], [x + 1.15 + k * 1.15, h * 0.42 + 0.62, z1 + 0.03]).castShadow = false; }
  // The promenade east of the aquarium, with a rail along the sea wall and three lamps.
  box(group, mats.white, [4.7, 0.18, -6.2], [30, 0.21, -6.17]); for (let x = 4.7; x <= 30; x += 1.4) cyl(group, mats.white, x, -0.23, 0.2, -6.185, 0.022, { seg: 6 });
  for (const x of [7, 13.5, 20]) { cyl(group, mats.iron, x, -0.23, 1.9, -7.2, 0.035, { seg: 8 }); add(new T.SphereGeometry(0.11, 10, 8), mats.white, x, 1.98, -7.2, group); }
  // Cars on Cannery Row: each is a painted body and a dark set of wheels and windows.
  const carBody = fuse([new T.BoxGeometry(0.95, 0.24, 0.44).translate(0, 0.2, 0), new T.BoxGeometry(0.5, 0.2, 0.4).translate(-0.06, 0.41, 0)]), carDark = fuse([new T.BoxGeometry(0.52, 0.11, 0.42).translate(-0.06, 0.4, 0), ...[-0.3, 0.3].flatMap(x => [-0.2, 0.2].map(z => new T.CylinderGeometry(0.09, 0.09, 0.06, 10).rotateX(Math.PI / 2).translate(x, 0.09, z)))]);
  const cars = [[mats.red, -8.55, 1.5, 26], [mats.teal, -8.55, 1.15, 53], [mats.yellow, -9.65, -1.35, 8]].map(([mat, z, sp, off]) => { const c = new T.Group(); c.userData = { dynamic: true, sp, off }; c.position.set(0, -0.26, z); if (sp < 0) c.rotation.y = Math.PI; group.add(c); add(carBody, mat, 0, 0, 0, c); add(carDark, dark, 0, 0, 0, c); return c; });
  // ---- west of the aquarium: a forecourt, then sand, the shore path, ice plant in flower and wind-bent cypresses ----
  // West of there the road runs on, pale and empty, between low dunes.
  box(group, mats.sand, [-40, -0.31, -40], [-13, -0.27, 4.7]).castShadow = false; box(group, mats.sand, [-13, -0.31, -7.6], [-9, -0.27, 4.7]).castShadow = false; box(group, M('#b9b4a6', { roughness: 1 }), [-40, -0.31, -10.2], [-13, -0.255, -8]).castShadow = false;
  box(group, mats.walk, [-13.4, -0.31, -2.6], [-8.5, -0.24, 4.5]); box(group, mats.walk, [-40, -0.31, 1.5], [-13.4, -0.25, 2.9]).castShadow = false;
  for (const [x, z, r] of [[-19, -14.5, 3], [-27, -13, 2.4], [-16.5, -19.5, 2.6], [-33, -16, 3.4], [-24.5, -21, 3], [-31, -5.5, 2.2]]) { const m = add(new T.SphereGeometry(r, 20, 8, 0, Math.PI * 2, 0, Math.PI / 2), mats.sand, x, -0.28, z, group); m.scale.set(1.3, 0.2, 0.8); }
  const ice = M('#7d9b62', { roughness: 1 }), bloom = M('#dc5fa0'), cypress = M('#3b5a41', { roughness: 1 });
  for (const [x, z, s] of [[-15.5, 3.9, 1.3], [-19.5, 4.0, 1.7], [-24.5, 3.8, 1.4], [-29, 4.0, 1.8], [-34, 3.9, 1.5], [-17, 0.2, 1.2], [-22, -2.5, 1.6], [-28, 0, 1.3], [-33, -3, 1.7], [-17, -5.8, 1.3], [-21.5, -12.2, 1.5], [-29.5, -11.6, 1.2]]) { const m = add(new T.SphereGeometry(s, 14, 8), ice, x, -0.28, z, group); m.scale.set(1, 0.09, 0.5); m.castShadow = false;
    for (let i = 0; i < 8; i++) add(new T.SphereGeometry(0.07, 6, 4), bloom, x + Math.cos(i * 2.4) * s * (0.25 + (i * 0.37 % 0.6)), -0.19 + s * 0.035, z + Math.sin(i * 2.4) * s * 0.3 * (0.4 + (i * 0.53 % 0.6)), group).castShadow = false; }
  for (const [x, z, s] of [[-14.6, -2.8, 1.15], [-16.5, 3.7, 0.9], [-20.5, -5.2, 1]]) { const t = cyl(group, mats.trunk, x, -0.3, -0.3 + 1.5 * s, z, 0.08 * s, { rTop: 0.05 * s, seg: 8 }); t.rotation.z = 0.22; t.position.x -= 0.16 * s;
    for (const [dx, dy, dz, r] of [[-0.45, 1.5, 0, 0.9], [-1.0, 1.72, 0.15, 0.62], [0.15, 1.75, -0.2, 0.55]]) { const m = add(new T.IcosahedronGeometry(r * s, 1), cypress, x + dx * s, -0.3 + dy * s, z + dz * s, group); m.scale.y = 0.34; } }

  for (const [id, n] of Object.entries(data.nodes)) if (n.pos) { const h = add(new T.BoxGeometry(1, 0.06, 1), ghost(), n.pos[0], n.pos[1] + 0.03, n.pos[2], group); h.castShadow = h.receiveShadow = false; h.userData.near = [id]; hits.push(h); }
  mergeStatic(group, new Set(hits));
  const V = pts => pts.map(p => new T.Vector3(...p));
  // Everything that moves by itself. It is posed once here, so that with reduced motion the scene is still but whole.
  function life(time) {
    stalks.forEach((g, i) => { g.rotation.z = Math.sin(time * 0.5 + i * 0.9) * 0.026; g.rotation.x = Math.sin(time * 0.37 + i * 1.7) * 0.018; });
    for (let i = 0; i < 36; i++) { const a = time * 0.3 - (i % 12) * 0.11 - Math.floor(i / 12) * 0.05, r = 0.74 + (i % 3) * 0.12; at.position.set(Math.cos(a) * 0.95 * r, 3.3 + Math.sin(time * 0.11) * 1.1 + ((i * 7) % 5 - 2) * 0.09 + Math.sin(a * 3 + i) * 0.04, 0.6 + Math.sin(a) * 1.25 * r); at.rotation.y = -a - Math.PI / 2; at.updateMatrix(); shoal.setMatrixAt(i, at.matrix); }
    shoal.instanceMatrix.needsUpdate = true;
    for (const f of fish) { const a = time * f.sp + f.ph; f.mesh.position.set(Math.cos(a) * f.r, f.h + Math.sin(a * 1.7) * 0.25, 0.6 + Math.sin(a) * f.r * 1.2); f.mesh.rotation.y = -a - Math.PI / 2; }
    { const b = -time * 0.2; shark.position.set(Math.cos(b) * 0.7, 1.2 + Math.sin(time * 0.23) * 0.2, 0.6 + Math.sin(b) * 1.15); shark.rotation.y = Math.PI / 2 - b + Math.sin(time * 2.2) * 0.07; }
    jellies.forEach((j, i) => { const u = j.userData, p = Math.sin(time * 1.6 + i * 1.1), s = u.s ?? 1; j.position.y = u.y + Math.sin(time * 0.4 + i * 1.3) * (u.s ? 0.3 : 0.2); j.scale.set((1 + p * 0.12) * (u.s ? 0.5 : 1) * s, (1 - p * 0.14) * s, (1 + p * 0.12) * s); });
    { const e = pulse((time / 12 + 0.2) % 1, 0.02, 0.5, 0.07); octo.position.y = 0.05 + e * 0.42; octo.rotation.y = Math.sin(time * 1.3) * 0.45 * e; }
    otters.forEach((o, i) => { const u = o.userData, s = (time + 7 + i * 5.3) % (13 + i * 4); o.position.y = SEA + 0.06 + Math.sin(time * 1.2 + i) * 0.03; o.rotation.y = u.a + Math.sin(time * 0.1 + i * 2) * 0.5; if (u.roll) u.roll.rotation.x = smooth(s / 1.8) * Math.PI * 2; });
    beds.forEach((b, i) => { b.rotation.y = Math.sin(time * 0.3 + i * 1.4) * 0.05; b.position.x = b.userData.x + Math.sin(time * 0.45 + i) * 0.06; });
    { const v = (time / 11 + 0.3) % 1; neck.rotation.z = 0.1 + pulse(v, 0.08, 0.55, 0.08) * 0.75; neck.rotation.y = Math.sin(time * 0.7) * 0.3 * pulse(v, 0.16, 0.5, 0.05); }
    foam.forEach(f => { const u = f.userData, k = 0.5 + 0.5 * Math.sin(time * 0.8 + u.ph); if (u.r) f.scale.set(u.r * (1 + k * 0.1), 1, u.r * 0.85 * (1 + k * 0.1)); else f.scale.z = 0.5 + k * 1.1; });
    foamA.opacity = 0.42 + 0.3 * Math.sin(time * 0.8 + 1.2); foamB.opacity = 0.42 + 0.3 * Math.sin(time * 0.8 + 2.9);
    for (const c of cars) { const u = c.userData, d = (time * Math.abs(u.sp) + u.off) % 70; c.position.x = u.sp > 0 ? -40 + d : 30 - d; }
  }
  life(0);
  let open = 0;
  function update(time, model, still, state, live) {
    if (live) cage.position.copy(live('cage'));
    const o = model.pressed('surface') ? 1 : 0; open = still ? o : open + (o - open) * 0.1; door.position.z = 3.5 - open * 1.7; plate.position.y = 6.016 - open * 0.02;
    if (!still) life(time);
  }
  const frame = [[-8.6, 0, 4.6], [-8.6, 7.6, -5], [-3.4, 12.8, -6.4], [8.4, 0, 2.2], [8.4, 0, 8], [8.6, 7, 3], [4.3, SEA, 8.2], [5, 6.6, 6.7]];
  return { group, hits, mechs, update, frame, routes: { 'surface>deck': V(longSlide), 'jellies>deck': V(shortSlide) }, water: SEA, birds: { x: 4, z: 8, h: 6, color: '#f4f4f0' }, shadowSize: 30 };
}
