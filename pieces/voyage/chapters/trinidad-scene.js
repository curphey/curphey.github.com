import * as T from '../../tower/vendor/three.js';
import { panTexture, trinidadFlagTexture, boardTexture } from '../render/textures.js';
// Trinidad, as a small Caribbean island at first light: a pink house on stilts, palms, a shallow lagoon,
// a sea stack, a headland with a lighthouse, a jetty and a pirogue. Not modelled on any one real place.
// Positions must agree with chapters/trinidad.mjs.
const SEA = -0.55;
export function createTrinidadScene(kit, data) {
  const { mats, add, box, cyl, cone, roof, windowAt, mergeStatic } = kit, group = new T.Group(), hits = [], mechs = {};
  const ghost = () => new T.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
  const boards = (a, b, near) => { const m = box(group, mats.deck, a, b); m.userData.near = near; hits.push(m); return m; };
  // A low island of sand, shelving into the water.
  const isle = (x, z, rx, rz, top = -0.25) => { const m = add(new T.CylinderGeometry(1, 1.22, 1.5, 56), mats.sand, x, top - 0.75, z, group); m.scale.set(rx, 1, rz); const uv = m.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * rx, uv.getY(i) * rz); return m; };
  const crag = (x, z, r, y0, y1, rTop = r * 0.8) => { cyl(group, mats.rock, x, y0, y1, z, r, { rTop, seg: 9 }); cyl(group, mats.rock, x + r * 0.45, y0, y0 + (y1 - y0) * 0.45, z + r * 0.4, r * 0.6, { rTop: r * 0.4, seg: 7 }); cyl(group, mats.rock, x - r * 0.5, y0, y0 + (y1 - y0) * 0.3, z - r * 0.3, r * 0.5, { rTop: r * 0.3, seg: 7 }); };
  function palm(x, y, z, h = 3, lean = 0.5, dir = 0) {
    const dx = Math.cos(dir), dz = Math.sin(dir), pts = [0, 0.33, 0.66, 1].map(t => new T.Vector3(x + dx * lean * t * t * h * 0.5, y + h * t, z + dz * lean * t * t * h * 0.5));
    const trunk = add(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 10, 0.09, 7), mats.trunk, 0, 0, 0, group), top = pts[3];
    for (let i = 0; i < 9; i++) { const a = i * Math.PI * 2 / 9 + dir, f = add(new T.ConeGeometry(0.2, 1.9, 4), mats.palm, 0, 0, 0, group); f.scale.z = 0.22; f.position.set(top.x + Math.cos(a) * 0.75, top.y - 0.12, top.z + Math.sin(a) * 0.75); f.rotation.set(0, -a, -Math.PI / 2 - 0.42, 'YXZ'); }
    for (let i = 0; i < 3; i++) add(new T.SphereGeometry(0.1, 10, 8), mats.trunk, top.x + Math.cos(i * 2.1) * 0.14, top.y - 0.16, top.z + Math.sin(i * 2.1) * 0.14, group);
  }
  const bush = (x, y, z, s = 1) => { for (const [ax, ay, az, r] of [[0, 0.3, 0, 0.55], [0.45, 0.22, 0.2, 0.4], [-0.4, 0.25, -0.2, 0.42]]) add(new T.IcosahedronGeometry(r * s, 2), mats.jungle, x + ax * s, y + ay * s, z + az * s, group); };
  function lever(x, y, z, mech, node) {
    cyl(group, mats.trunk, x, y, y + 0.5, z, 0.035, { seg: 8 }); const stick = cyl(group, mats.brass, x, y + 0.42, y + 0.8, z, 0.022, { seg: 8 }); stick.rotation.z = 0.5; stick.position.x += 0.1;
    add(new T.SphereGeometry(0.07, 14, 10), mats.red, x + 0.2, y + 0.78, z, group);
    const grab = add(new T.SphereGeometry(0.4, 12, 8), ghost(), x + 0.08, y + 0.5, z, group); grab.castShadow = grab.receiveShadow = false; grab.userData = { lever: mech, near: [node] }; hits.push(grab);
  }
  // A steel pan as a turntable: a chrome drum whose plank swings round with it.
  const panTop = new T.MeshStandardMaterial({ map: panTexture(), roughness: 0.3, metalness: 0.85 });
  function pan(id, r, double = false) {
    const m = data.mechs[id], y = m.hub[1], g = new T.Group(); g.userData.dynamic = true; g.position.set(m.hub[0], 0, m.hub[2]); group.add(g);
    const arms = Object.keys(data.nodes).filter(n => data.nodes[n].arm === id), hubNode = Object.keys(data.nodes).find(n => data.nodes[n].pos && data.nodes[n].pos.every((v, i) => v === m.hub[i]));
    cyl(g, mats.lead, 0, y - 0.55, y - 0.02, 0, r, { seg: 40 }); const rim = add(new T.TorusGeometry(r, 0.035, 8, 48), mats.brass, 0, y - 0.02, 0, g); rim.rotation.x = Math.PI / 2;
    const top = add(new T.CylinderGeometry(r - 0.02, r - 0.02, 0.02, 40), panTop, 0, y - 0.01, 0, g); top.userData = { near: [hubNode], mech: id }; hits.push(top);
    const arm = box(g, mats.deck, [double ? -m.length - 0.5 : 0.5, y - 0.25, -0.5], [m.length + 0.5, y, 0.5]); arm.userData = { near: [...arms, hubNode], mech: id }; hits.push(arm);
    if (!double) box(g, mats.trunk, [r - 0.1, y - 0.5, -0.12], [m.length * 0.6, y - 0.25, 0.12]);
    mechs[id] = { group: g, hub: new T.Vector3(m.hub[0], y, m.hub[2]) };
  }

  // The national flag, flying.
  const flagMat = new T.MeshStandardMaterial({ map: trinidadFlagTexture(), side: T.DoubleSide, roughness: 0.8 }), flags = [];
  function flag(x, y, z, h = 2.2, s = 1) { cyl(group, mats.white, x, y, y + h, z, 0.025, { seg: 6 }); const f = add(new T.PlaneGeometry(0.9 * s, 0.54 * s, 10, 1), flagMat, x + 0.47 * s, y + h - 0.3 * s, z, group); f.userData.dynamic = true; f.userData.w = 0.9 * s; f.castShadow = false; flags.push(f); }
  // Carnival bunting in the national colours, strung between two points.
  function bunting(a, b, n = 12) { const cols = [mats.red, mats.white, mats.iron]; for (let i = 0; i <= n; i++) { const t = i / n, sag = Math.sin(t * Math.PI) * 0.35, p = add(new T.ConeGeometry(0.1, 0.24, 3), cols[i % 3], a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - sag - 0.1, a[2] + (b[2] - a[2]) * t, group); p.rotation.x = Math.PI; p.castShadow = false; } }
  // A small fisherman's house on stilts, painted bright, with a tin roof.
  function hut(x, z, wall, w = 2.2, d = 1.7) {
    for (const [ax, az] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) cyl(group, mats.trunk, x + ax * (w / 2 - 0.12), -0.3, 0.5, z + az * (d / 2 - 0.12), 0.06, { seg: 6 });
    box(group, mats.deck, [x - w / 2 - 0.1, 0.5, z - d / 2 - 0.1], [x + w / 2 + 0.1, 0.6, z + d / 2 + 0.45]); box(group, wall, [x - w / 2, 0.6, z - d / 2], [x + w / 2, 1.85, z + d / 2]);
    roof(group, mats.tin, [x - w / 2 - 0.25, z - d / 2 - 0.25], [x + w / 2 + 0.25, z + d / 2 + 0.5], 1.85, 0.8, { alongZ: false, hip: 0.7 });
    box(group, mats.iron, [x - 0.2, 0.6, z + d / 2], [x + 0.2, 1.4, z + d / 2 + 0.02]); windowAt(group, 'z', x + w * 0.3, 1.25, z + d / 2, 0.3, 0.45); windowAt(group, 'x', x + w / 2, 1.25, z, 0.3, 0.45);
  }
  // ---- the house islet ----
  isle(-9.9, -2.9, 3.6, 3.3); boards([-10.5, -0.25, -2.5], [-6.5, 0, -1.5], ['porch', 'westShore']);
  for (const [x, z] of [[-12.4, -5.5], [-9.9, -5.5], [-12.4, -3.3], [-9.9, -3.3], [-12.4, -2.7], [-9.9, -2.7]]) cyl(group, mats.trunk, x, -0.3, 0.7, z, 0.07, { seg: 8 });
  box(group, mats.deck, [-12.7, 0.7, -5.8], [-9.6, 0.82, -2.5]); box(group, mats.pink, [-12.5, 0.82, -5.6], [-9.8, 2.35, -3.4]);
  box(group, mats.white, [-12.56, 2.25, -5.66], [-9.74, 2.4, -3.34]); roof(group, mats.tin, [-12.95, -6.05], [-9.35, -2.35], 2.4, 1.15, { alongZ: false, hip: 0.8 });
  for (const x of [-11.9, -10.4]) windowAt(group, 'z', x, 1.55, -3.4, 0.4, 0.75); windowAt(group, 'x', -9.8, 1.55, -4.5, 0.4, 0.75);
  box(group, mats.teal, [-11.4, 0.82, -3.41], [-10.9, 1.9, -3.37]);
  for (const x of [-12.55, -11.15, -9.75]) cyl(group, mats.white, x, 0.82, 2.25, -2.62, 0.04, { seg: 8 }); box(group, mats.white, [-12.6, 2.05, -2.66], [-9.7, 2.25, -2.58]);
  for (let x = -12.5; x < -9.8; x += 0.28) box(group, mats.white, [x, 1.9, -2.64], [x + 0.14, 2.05, -2.6]); box(group, mats.white, [-12.6, 1.2, -2.64], [-10.5, 1.24, -2.6]);
  for (let i = 0; i < 3; i++) box(group, mats.deck, [-10.4, -0.25, -2.5 + i * 0.0], [-9.6, 0.6 - i * 0.24, -2.5 + (i + 1) * 0.0 + 0.001]).visible = false;
  for (let i = 0; i < 3; i++) box(group, mats.deck, [-10.45, 0, -2.55 - (3 - i) * 0.02], [-9.55, 0.62 - i * 0.2, -2.5 + i * 0.16]);
  palm(-8.1, -0.25, -4.6, 3.4, 0.5, 0.4); palm(-12.2, -0.25, -1.3, 2.8, 0.6, 2.4); bush(-8.6, -0.25, -1.0, 0.8); bush(-12.8, -0.25, -3.9, 0.9);
  lever(-6.8, 0, -1.35, 'channel', 'westShore'); flag(-9.5, 2.9, -2.6, 1.9); bunting([-12.55, 2.2, -2.62], [-12.2, 2.6, -1.3], 6);
  // ---- the channel pan on its rock, and the sandbar where the oars are ----
  crag(-4, -2, 1.25, -1.9, -0.55); pan('channel', 1.0);
  isle(-4, 1.8, 1.7, 1.4); boards([-4.5, -0.25, 0.5], [-3.5, 0, 1.5], ['sandbar']);
  const oars = new T.Group(); oars.userData.dynamic = true; oars.position.set(-3.4, -0.25, 2.1); group.add(oars);
  for (const tilt of [-0.28, 0.28]) { const o = new T.Group(); o.rotation.z = tilt; oars.add(o); add(new T.CylinderGeometry(0.025, 0.025, 1.5, 8), mats.trunk, 0, 0.75, 0, o); add(new T.BoxGeometry(0.16, 0.5, 0.03), mats.teal, 0, 1.5, 0, o); }
  // ---- the main island ----
  isle(2, -3.4, 6.8, 5.4); boards([-1.5, -0.25, -2.5], [2.5, 0, -1.5], ['beach', 'fork', 'grove']);
  const hill = add(new T.SphereGeometry(1, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2), mats.jungle, 2.6, -0.25, -6, group); hill.scale.set(4.6, 2.9, 2.3);
  for (const [x, y, z, s] of [[-0.6, 0.6, -5.6, 1.5], [1.4, 1.9, -5.9, 1.6], [3.6, 2.2, -6.2, 1.7], [5.6, 1.0, -5.7, 1.5], [6.6, -0.1, -4.6, 1.2], [-2.2, -0.2, -4.9, 1.2]]) bush(x, y, z, s);
  palm(3.3, -0.25, -3.7, 3.6, 0.5, 3.4); palm(8.6, -0.25, -2.4, 3.2, 0.5, 0.3); palm(7.8, -0.25, -5.6, 3.9, 0.4, 5.2); palm(-2.6, -0.25, -4.2, 3.3, 0.6, 3.6); palm(0.3, 0.9, -5.2, 3.4, 0.4, 4.4); palm(4.2, 1.9, -6.4, 3.2, 0.5, 1.2);
  lever(-1.3, 0, -1.3, 'channel', 'beach'); lever(2.3, 0, -1.3, 'jetty', 'grove');
  // The pan yard: an open shed with a row of steel pans on their stands, and its board.
  for (const [x, z] of [[4.3, -4.9], [7.3, -4.9], [4.3, -3.5], [7.3, -3.5]]) cyl(group, mats.trunk, x, -0.25, 1.6, z, 0.06, { seg: 6 });
  roof(group, mats.tin, [4.0, -5.2], [7.6, -3.2], 1.6, 0.55, { alongZ: false, hip: 0.5 });
  for (let i = 0; i < 4; i++) { const x = 4.75 + i * 0.72; cyl(group, mats.iron, x, -0.25, 0.55, -4.1, 0.02, { seg: 6 }); const p = add(new T.CylinderGeometry(0.26, 0.26, 0.2, 24), mats.lead, x, 0.62, -4.1, group); p.rotation.x = 0.5; const top = add(new T.CylinderGeometry(0.25, 0.25, 0.012, 24), panTop, x, 0.72, -4.05, group); top.rotation.x = 0.5; top.castShadow = false; }
  { const b = add(new T.PlaneGeometry(1.9, 0.48), new T.MeshStandardMaterial({ map: boardTexture('PAN YARD'), roughness: 0.7 }), 5.8, 1.42, -3.17, group); b.castShadow = false; b.userData.dynamic = true; }
  bunting([4.3, 1.6, -3.5], [3.3, 3.2, -3.7], 7); bunting([7.3, 1.6, -3.5], [8.6, 2.9, -2.4], 7);
  // A fishing boat pulled up on the sand.
  { const b = add(new T.SphereGeometry(1, 20, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mats.yellow, 6.2, 0.12, -1.6, group); b.scale.set(1.5, 0.45, 0.5); b.rotation.y = 0.5; box(group, mats.teal, [5.3, 0.06, -1.9], [7.1, 0.1, -1.3]).rotation.y = 0.5; }
  // ---- the sea stack and its pan, and the nest rock beside it ----
  crag(5, 5, 1.35, -1.9, 3.45, 1.02); pan('stack', 1.0);
  cyl(group, mats.rock, 2, -1.9, 3.75, 5, 0.8, { rTop: 0.62, seg: 8 }); boards([1.5, 3.75, 4.5], [2.5, 4, 5.5], ['nest']);
  const nestRing = add(new T.TorusGeometry(0.22, 0.07, 6, 14), mats.trunk, 1.75, 4.05, 4.75, group); nestRing.rotation.x = Math.PI / 2;
  const rope = new T.Group(); rope.userData.dynamic = true; rope.position.set(2.25, 4.03, 5.25); group.add(rope);
  for (let i = 0; i < 3; i++) { const c = add(new T.TorusGeometry(0.16 - i * 0.02, 0.03, 6, 20), mats.cream, 0, i * 0.05, 0, rope); c.rotation.x = Math.PI / 2; }
  // ---- the headland, the lighthouse, the cliff steps and the jetty ----
  box(group, mats.rock, [7.4, -1.9, 3.2], [11.6, 3.75, 7.2]); crag(11.2, 7.4, 1.1, -1.9, 2.4); crag(7.2, 3.4, 0.9, -1.9, 2.9); cyl(group, mats.rock, 11.9, -1.9, 3.1, 4.6, 1.0, { rTop: 0.6, seg: 7 });
  box(group, mats.lawn, [7.4, 3.75, 3.2], [11.6, 3.8, 7.2]); boards([7.5, 3.75, 4.5], [8.5, 4.001, 5.5], ['head']); bush(10.9, 3.8, 6.5, 0.8); palm(11.0, 3.8, 3.7, 2.4, 0.7, 5.6); flag(8.9, 3.8, 3.6, 2.4, 1.2);
  cyl(group, mats.white, 10.2, 3.8, 5.1, 4.5, 0.62, { rTop: 0.52, seg: 24 }); cyl(group, mats.red, 10.2, 5.1, 6.0, 4.5, 0.52, { rTop: 0.46, seg: 24 }); cyl(group, mats.white, 10.2, 6.0, 6.9, 4.5, 0.46, { rTop: 0.4, seg: 24 });
  cyl(group, mats.iron, 10.2, 6.9, 7.0, 4.5, 0.6, { seg: 24 }); const lampGlass = cyl(group, mats.glass, 10.2, 7.0, 7.5, 4.5, 0.32, { seg: 16 }); cone(group, mats.red, 10.2, 7.5, 8.0, 4.5, 0.46, 16);
  const lamp = add(new T.SphereGeometry(0.2, 16, 12), mats.glow, 10.2, 7.25, 4.5, group); lamp.userData.dynamic = true; lamp.castShadow = false;
  for (let i = 0; i < 11; i++) { const z0 = 5.5 + i * 0.3, m = box(group, mats.rock, [7.5, -1.9, z0], [8.5, 4 - (i + 1) * 0.364, z0 + 0.3]); m.userData.near = ['head', 'jettyRoot']; hits.push(m); }
  boards([7.5, -0.25, 8.5], [8.5, 0, 9.5], ['jettyRoot']); for (const [x, z] of [[7.6, 9.4], [8.4, 9.4], [7.75, 10.8], [8.25, 11.2]]) cyl(group, mats.trunk, x, -1.9, z > 10 ? -0.55 : -0.25, z, 0.07, { seg: 8 });
  pan('jetty', 0.5, true);
  // The pirogue, moored beyond the jetty.
  const boat = new T.Group(); boat.userData.dynamic = true; boat.position.set(8, 0, 13); group.add(boat);
  { const hull = add(new T.SphereGeometry(1, 28, 14, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mats.yellow, 0.5, 0.06, 0, boat); hull.scale.set(2.3, 0.55, 0.62);
    const stripe = add(new T.TorusGeometry(1, 0.03, 6, 48), mats.teal, 0.5, 0.05, 0, boat); stripe.rotation.x = Math.PI / 2; stripe.scale.set(2.3, 0.62, 1);
    const f = box(boat, mats.deck, [-1.2, -0.12, -0.5], [2.2, 0, 0.5]); f.userData.near = ['boat']; hits.push(f); for (const x of [-0.6, 1.5]) box(boat, mats.teal, [x - 0.08, 0, -0.52], [x + 0.08, 0.1, 0.52]);
    cyl(boat, mats.trunk, 2.3, 0, 0.5, 0, 0.03, { seg: 6 }); }
  flag(5.75, 0.1, 13, 1.1, 0.7);
  // ---- the bay: a long beach on the main island, a fishing village along it, and the Northern Range behind ----
  box(group, mats.sand, [-46, -1.6, -13.5], [46, -0.25, -7.6]).castShadow = false; const shelf = box(group, mats.sand, [-46, -1.9, -7.6], [46, -0.62, -6.4]); shelf.castShadow = false;
  box(group, mats.jungle, [-60, -1.6, -70], [60, -0.1, -13.5]).castShadow = false;
  hut(-7.2, -10.2, mats.yellow); hut(-2.6, -10.9, mats.teal); hut(9.6, -10.3, mats.cream); hut(13.6, -10.9, mats.pink); hut(-12.4, -10.7, mats.blue);
  for (const [x, z, h, l, d] of [[-9.6, -9.2, 3.4, 0.5, 0.6], [-4.9, -9.4, 3.9, 0.4, 2.2], [0.2, -9.0, 3.2, 0.6, 5.0], [11.6, -9.1, 3.8, 0.5, 1.0], [15.8, -9.6, 3.3, 0.6, 4.0], [-15, -9.5, 3.7, 0.5, 5.6], [18.5, -8.9, 3.0, 0.7, 2.8], [-18.6, -9.0, 3.5, 0.5, 0.9]]) palm(x, -0.25, z, h, l, d);
  for (const [x, z] of [[-10.6, -8.3], [2.4, -8.9], [12.6, -8.4]]) { const b = add(new T.SphereGeometry(1, 18, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), [mats.red, mats.blue, mats.yellow][Math.abs(Math.round(x)) % 3], x, -0.05, z, group); b.scale.set(1.3, 0.4, 0.45); b.rotation.y = x * 0.3; }
  for (let i = 0; i < 26; i++) { const r = (a, b) => { const n = Math.sin(i * 91.7 + a * 47.3) * 9973; return b * (n - Math.floor(n)); }; bush(-30 + i * 2.4 + r(1, 1.2), -0.1, -13.8 - r(2, 2.5), 1.5 + r(3, 1.3)); }
  for (const [x, z, rx, ry, rz, m] of [[-24, -27, 17, 12, 10, mats.jungle], [0, -31, 20, 15.5, 11, mats.jungle], [24, -27, 18, 11.5, 10, mats.jungle], [-44, -22, 15, 9, 9, mats.palm], [44, -20, 14, 8, 8, mats.palm], [-10, -21, 9, 6.5, 6, mats.palm], [12, -20, 8, 6, 5.5, mats.palm]]) { const h = add(new T.SphereGeometry(1, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2), m, x, -0.2, z, group); h.scale.set(rx, ry, rz); h.castShadow = false; }
  for (const [x, z, r] of [[-20, 5, 1.4], [16, 9, 1.3]]) { isle(x, z, r, r * 0.8); palm(x, -0.25, z, 2.6, 0.6, x); bush(x + 0.7, -0.25, z - 0.3, 0.7); }

  for (const [id, n] of Object.entries(data.nodes)) if (n.pos) { const h = add(new T.BoxGeometry(1, 0.06, 1), ghost(), n.pos[0], n.pos[1] + 0.03, n.pos[2], group); h.castShadow = h.receiveShadow = false; h.userData.near = [id]; hits.push(h); }
  mergeStatic(group, new Set(hits));
  function update(time, model, still) {
    oars.visible = !model.items.has('oars'); rope.visible = !model.items.has('rope');
    if (!still) { boat.position.y = Math.sin(time * 1.1) * 0.03; boat.rotation.x = Math.sin(time * 0.9) * 0.025; }
    mats.glow.emissiveIntensity = model.won ? 7 : 1.2;
    if (!still) for (const fl of flags) { const p = fl.geometry.attributes.position, w = fl.userData.w; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(time * 4.5 + p.getX(i) * 6) * 0.06 * (p.getX(i) / w + 0.5)); p.needsUpdate = true; }
  }
  const frame = [[-13.2, 0, -1.2], [-13, 3.6, -6], [2.6, 2.4, -7], [10.2, 8, 4.5], [12.4, 0, 3.4], [10.6, 0, 13.6], [7.2, SEA, 14], [5, 4, 7.6], [-4, SEA, 3.6]];
  return { group, hits, mechs, update, frame, water: SEA, birds: { x: 0, z: 2, h: 7.5, color: '#e3262c', count: 13 }, shadowSize: 32 };
}
