import * as T from '../../tower/vendor/three.js';
import { clockTexture } from '../render/textures.js';
// The Founder's Building, Royal Holloway, modelled on its real plan: two quadrangles enclosed by long east and
// west ranges, short end ranges each with a central tower, a low cross range with a domed lantern between the
// quads, and a pavilion at every corner. Positions must agree with chapters/founders.mjs; the unit tests there
// are what keep the two illusions true.
export const WATER_LEVEL = -3.2;
export const GROUND = -0.25; // lawns sit a kerb below the stone paths
export function createFoundersScene(kit, data) {
  const { mats, add, box, cyl, cone, roof, windowAt, tree, mergeStatic } = kit, group = new T.Group(), hits = [], G = GROUND, B = G - 0.3;
  const slab = (parent, a, b, near) => { const m = box(parent, mats.walk, a, b); m.userData.near = near; hits.push(m); return m; };
  const band = (a, b) => box(group, mats.stone, a, b);
  const ghost = () => new T.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
  // Tall striped stacks: the building's signature skyline.
  const chimney = (x, z, y0, y1, alongX = false) => { const a = alongX ? 0.3 : 0.2, b = alongX ? 0.2 : 0.3; box(group, mats.brick, [x - a, y0, z - b], [x + a, y1, z + b]); for (const f of [0.35, 0.7]) box(group, mats.stone, [x - a - 0.03, y0 + (y1 - y0) * f, z - b - 0.03], [x + a + 0.03, y0 + (y1 - y0) * f + 0.09, z + b + 0.03]); box(group, mats.stone, [x - a - 0.06, y1, z - b - 0.06], [x + a + 0.06, y1 + 0.14, z + b + 0.06]); for (const d of [-0.13, 0.13]) cyl(group, mats.brick, x + (alongX ? d : 0), y1 + 0.14, y1 + 0.34, z + (alongX ? 0 : d), 0.07, { seg: 10 }); };
  const turret = (x, z, top, r = 0.5) => { cyl(group, mats.brick, x, B, top, z, r, { seg: 24 }); for (const f of [0.3, 0.62]) cyl(group, mats.stone, x, top * f, top * f + 0.1, z, r + 0.03, { seg: 24 }); cyl(group, mats.stone, x, top, top + 0.14, z, r + 0.08, { seg: 24 }); cone(group, mats.tile, x, top + 0.14, top + 1.9, z, r + 0.1, 24); add(new T.SphereGeometry(0.06, 12, 8), mats.lead, x, top + 1.93, z, group); };
  const dormer = (x, y, z, face) => { const dx = face === 'x' ? 1 : 0, dz = 1 - dx; box(group, mats.stone, [x - 0.24 - dx * 0.3, y, z - 0.24 - dz * 0.3], [x + 0.24, y + 0.62, z + 0.24]); windowAt(group, face, x + dx * 0.24, y + 0.3, z + dz * 0.24, 0.22, 0.34); roof(group, mats.tile, [x - 0.32 - dx * 0.3, z - 0.32 - dz * 0.3], [x + 0.3, z + 0.3], y + 0.62, 0.3, { alongZ: !dx, hip: 0.3 }); };

  // ---- long east and west ranges: four storeys, tiled roofs, dormers and chimneys ----
  for (const s of [-1, 1]) {
    const x0 = s * 8 - 1.5, x1 = s * 8 + 1.5;
    box(group, mats.brick, [x0, B, -13.5], [x1, 3.2, 13.5]);
    for (const y of [0.95, 2.05]) band([x0 - 0.04, y, -13.54], [x1 + 0.04, y + 0.09, 13.54]);
    band([x0 - 0.1, 3.2, -13.6], [x1 + 0.1, 3.42, 13.6]);
    roof(group, mats.tile, [x0 - 0.08, -13.58], [x1 + 0.08, 13.58], 3.42, 1.5, { alongZ: true, hip: 0.5 });
    for (let z = -12.6; z <= 12.7; z += 1.05) { if (Math.abs(z) < 1.9 || Math.abs(Math.abs(z) - 12) < 1.9) continue; for (const [y, h, arch] of [[0.45, 0.55, false], [1.5, 0.55, false], [2.6, 0.5, true]]) windowAt(group, 'x', x1, y, z, 0.3, h, arch); }
    for (let z = -9.6; z <= 9.7; z += 1.6) { if (Math.abs(z) < 2) continue; dormer(x1 - 0.45, 3.5, z, 'x'); }
    for (let z = -10.4; z <= 10.5; z += 2.08) { if (Math.abs(z) < 1.8) continue; chimney(s * 8, z, 4.5, 6.1); }
    // Mid-range pavilion with a curved pediment.
    box(group, mats.brick, [x0 - 0.3, B, -1.6], [x1 + 0.3, 4, 1.6]); band([x0 - 0.36, 4, -1.66], [x1 + 0.36, 4.2, 1.66]);
    roof(group, mats.tile, [x0 - 0.34, -1.64], [x1 + 0.34, 1.64], 4.2, 1.9, { alongZ: false, hip: 0.75 });
    const ped = add(new T.CylinderGeometry(1.05, 1.05, 0.16, 40), mats.stone, x1 + 0.2, 4.2, 0, group); ped.rotation.z = Math.PI / 2;
    for (const z of [-0.8, 0, 0.8]) for (const [y, arch] of [[0.5, false], [1.6, false], [2.75, true]]) windowAt(group, 'x', x1 + 0.3, y, z, 0.34, 0.62, arch);
    for (const z of [-1.6, 1.6]) turret(x1 + 0.3, z, 4.3, 0.36);
  }
  // ---- short end ranges under slate, each with a central tower ----
  for (const s of [-1, 1]) {
    const z0 = s * 12 - 1.5, z1 = s * 12 + 1.5;
    box(group, mats.brick, [-6.5, B, z0], [6.5, 2.8, z1]); band([-6.5, 1.3, z0 - 0.04], [6.5, 1.39, z1 + 0.04]); band([-6.5, 2.8, z0 - 0.1], [6.5, 3.0, z1 + 0.1]);
    roof(group, mats.slate, [-6.5, z0 - 0.08], [6.5, z1 + 0.08], 3.0, 1.3, { alongZ: false, hip: 0 });
    for (let x = -5.7; x <= 5.8; x += 1.14) { if (Math.abs(x) < 1.6) continue; windowAt(group, 'z', x, 0.55, z1, 0.34, 0.7); windowAt(group, 'z', x, 2.0, z1, 0.34, 0.75, true); }
  }
  // ---- corner pavilions: steep roof, a round turret on each corner ----
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const cx = sx * 8, cz = sz * 12;
    box(group, mats.brick, [cx - 1.9, B, cz - 1.9], [cx + 1.9, 3.9, cz + 1.9]); for (const y of [0.95, 2.05, 3.1]) band([cx - 1.94, y, cz - 1.94], [cx + 1.94, y + 0.09, cz + 1.94]);
    band([cx - 2, 3.9, cz - 2], [cx + 2, 4.12, cz + 2]);
    roof(group, mats.tile, [cx - 1.95, cz - 1.95], [cx + 1.95, cz + 1.95], 4.12, 2.5, { alongZ: true, hip: 0.86 });
    cyl(group, mats.lead, cx, 6.5, 6.9, cz, 0.22, { seg: 12 }); cone(group, mats.lead, cx, 6.9, 7.4, cz, 0.3, 12);
    for (const ax of [-1, 1]) for (const az of [-1, 1]) turret(cx + ax * 1.9, cz + az * 1.9, 4.25, 0.52);
    for (const o of [-0.8, 0, 0.8]) for (const [y, arch] of [[0.45, false], [1.5, false], [2.6, true]]) { windowAt(group, 'x', cx + 1.9, y, cz + o, 0.3, 0.55, arch); windowAt(group, 'z', cx + o, y, cz + 1.9, 0.3, 0.55, arch); }
    chimney(cx - 0.9, cz, 5.2, 6.9); chimney(cx + 0.9, cz, 5.2, 6.9);
  }
  // ---- the low cross range between the quads: a glazed colonnade under a slate roof ----
  box(group, mats.stone, [-6.5, B, -1], [6.5, 0.35, 1]); box(group, mats.glass, [-6.5, 0.35, -0.94], [6.5, 1.45, 0.94]); box(group, mats.stone, [-6.5, 1.45, -1.06], [6.5, 1.72, 1.06]);
  for (let x = -6.2; x <= 6.3; x += 0.62) for (const z of [-0.98, 0.98]) cyl(group, mats.stone, x, 0.35, 1.45, z, 0.055, { seg: 10 });
  roof(group, mats.slate, [-6.5, -1.1], [6.5, 1.1], 1.72, 0.85, { alongZ: false, hip: 0 });
  // Ridge walk, the head of the steps, and the steps down into the south quad.
  box(group, mats.stone, [-4.5, 1.72, -0.5], [-3.5, 2.75, 1.5]); slab(group, [-4.5, 2.75, -0.5], [-3.5, 3, 1.5], ['roof', 'steps']);
  for (let i = 0; i < 9; i++) { const top = 3 - (i + 1) * 0.3; slab(group, [-4.5, G - 0.05, 1.5 + i * 0.28], [-3.5, top, 1.78 + i * 0.28], ['steps', 'roofEnd']); }
  slab(group, [-4.5, G, 3.5], [-3.5, 0, 4.5], ['roofEnd']);
  // The library door on the ridge, east of the lantern.
  box(group, mats.stone, [3.5, 1.72, -0.5], [5.4, 2.75, 0.5]); slab(group, [3.5, 2.75, -0.5], [4.5, 3, 0.5], ['balcony']);
  box(group, mats.brick, [4.7, 2.75, -0.6], [6.5, 4.2, 0.6]); roof(group, mats.slate, [4.6, -0.7], [6.5, 0.7], 4.2, 0.6, { alongZ: false, hip: 0 });
  const door = windowAt(group, 'x', 4.7, 3.55, 0, 0.5, 1.0, true); door.rotation.y = -Math.PI / 2;

  // ---- the quadrangles: lawns, paths, a statue in each ----
  for (const s of [-1, 1]) {
    const zc = s * 5.75;
    box(group, mats.lawn, [-6.5, G - 0.05, s > 0 ? 1 : -10.5], [6.5, G, s > 0 ? 10.5 : -1]);
    const path = (a, b) => { const m = box(group, mats.walk, a, b); m.castShadow = false; };
    path([-6.5, G, zc - 0.35], [6.5, G + 0.03, zc + 0.35]); path([-0.35, G, s > 0 ? 1 : -10.5], [0.35, G + 0.03, s > 0 ? 10.5 : -1]);
    cyl(group, mats.walk, 0, G, G + 0.05, zc, 1.15, { seg: 40 }); box(group, mats.marble, [-0.4, G, zc - 0.4], [0.4, 0.45, zc + 0.4]); box(group, mats.marble, [-0.3, 0.45, zc - 0.3], [0.3, 0.6, zc + 0.3]);
    for (const dx of [-0.12, 0.12]) { cyl(group, mats.marble, dx, 0.6, 1.25, zc, 0.1, { rTop: 0.07, seg: 12 }); add(new T.SphereGeometry(0.085, 12, 10), mats.marble, dx, 1.33, zc, group); }
    // Colonnade along the end range.
    for (let x = -6; x <= 6.1; x += 0.75) { if (Math.abs(x) < 1.4) continue; cyl(group, mats.stone, x, G, 1.15, s * 10.2, 0.06, { seg: 10 }); } band([-6.5, 1.15, s > 0 ? 10.1 : -10.5], [6.5, 1.3, s > 0 ? 10.5 : -10.1]);
  }
  // The chequered path in the north quad, where the journey starts.
  slab(group, [-3.5, G, -10.5], [-2.5, 0, -6.5], ['gate', 'cloister']);

  // ---- towers ----
  function tower(z, withMech) {
    box(group, mats.stone, [-1.25, B, z - 1.25], [1.25, 0.5, z + 1.25]); box(group, mats.brick, [-1.1, 0.5, z - 1.1], [1.1, 6.3, z + 1.1]);
    for (const y of [1.6, 3.0, 4.4]) band([-1.14, y, z - 1.14], [1.14, y + 0.1, z + 1.14]);
    for (const [qx, qz] of [[1.1, 1.1], [-1.1, 1.1], [1.1, -1.1]]) for (let y = 0.5, i = 0; y < 6.2; y += 0.42, i++) { const l = i % 2 ? 0.32 : 0.18; box(group, mats.stone, [qx - (qx > 0 ? l : 0.03), y, z + qz - (qz > 0 ? l : 0.03)], [qx + (qx > 0 ? 0.03 : l), y + 0.36, z + qz + (qz > 0 ? 0.03 : l)]); }
    box(group, mats.stone, [-1.2, 6.3, z - 1.2], [1.2, 6.5, z + 1.2]); box(group, mats.stone, [-1.3, 6.5, z - 1.3], [1.3, 6.75, z + 1.3]);
    for (const y of [2.3, 3.7]) { windowAt(group, 'x', 1.1, y, z, 0.3, 0.7, true); windowAt(group, 'z', 0, y, z + 1.1, 0.3, 0.7, true); }
    const arch = windowAt(group, 'z', 0, 0.75, z + 1.1, 0.8, 1.3, true); arch.traverse(o => { if (o.isMesh && o.material === mats.glass) o.material = mats.iron; });
    const crown = withMech ? mechanism('clock', 7, 1.08) : (() => { const g = new T.Group(); g.position.set(0, 0, z); group.add(g); cyl(g, mats.walk, 0, 6.75, 7, 0, 1.08); return g; })();
    for (const [x, zz] of [[0.74, 0.74], [-0.74, 0.74], [0.74, -0.74], [-0.74, -0.74]]) { cyl(crown, mats.stone, x, 7, 8.9, zz, 0.06, { seg: 12 }); cone(crown, mats.stone, x * 1.2, 9.1, 9.9, zz * 1.2, 0.14, 8); }
    box(crown, mats.stone, [-0.98, 8.9, -0.98], [0.98, 9.1, 0.98]);
    const spire = cone(crown, mats.stone, 0, 9.1, 10.6, 0, 1.25, 4); spire.rotation.y = Math.PI / 4; cyl(crown, mats.stone, 0, 10.2, 11.0, 0, 0.3, { seg: 8 }); cone(crown, mats.lead, 0, 11.0, 11.7, 0, 0.4, 8);
    cyl(crown, mats.brass, 0, 11.6, 12.2, 0, 0.025, { seg: 8 }); add(new T.SphereGeometry(0.08, 12, 10), mats.brass, 0, 12.2, 0, crown);
    return crown;
  }
  // Turning mechanisms: a turntable, a bridge arm and a brass handle.
  const mechs = {};
  function mechanism(id, y, discR) {
    const m = data.mechs[id], g = new T.Group(); g.userData.dynamic = true; g.position.set(m.hub[0], 0, m.hub[2]); group.add(g);
    const node = Object.keys(data.nodes).find(n => data.nodes[n].arm === id), hubNode = Object.keys(data.nodes).find(n => data.nodes[n].pos && data.nodes[n].pos.every((v, i) => v === m.hub[i]));
    const disc = cyl(g, mats.walk, 0, y - 0.25, y, 0, discR); disc.userData = { near: [hubNode], mech: id }; hits.push(disc);
    const arm = box(g, mats.walk, [0.5, y - 0.25, -0.5], [m.length + 0.5, y, 0.5]); arm.userData = { near: [node, hubNode], mech: id }; hits.push(arm);
    box(g, mats.stone, [discR - 0.1, y - 0.55, -0.3], [1.9, y - 0.25, 0.3]);
    const ring = add(new T.TorusGeometry(0.6, 0.03, 8, 48), mats.brass, 0, y + 0.004, 0, g); ring.rotation.x = Math.PI / 2; ring.castShadow = false;
    cyl(g, mats.brass, -discR + 0.2, y, y + 0.5, 0, 0.035, { seg: 12 });
    const knob = add(new T.SphereGeometry(0.1, 20, 16), mats.brass, -discR + 0.2, y + 0.56, 0, g); knob.userData = { mech: id, handle: true }; hits.push(knob);
    const grab = add(new T.SphereGeometry(0.42, 12, 8), ghost(), -discR + 0.2, y + 0.45, 0, g); grab.castShadow = grab.receiveShadow = false; grab.userData = { mech: id, handle: true }; hits.push(grab);
    mechs[id] = { group: g, hub: new T.Vector3(m.hub[0], y, m.hub[2]) };
    return g;
  }
  function lever(x, y, z, mech, node) {
    cyl(group, mats.stone, x, y, y + 0.12, z, 0.13, { seg: 16 }); const stick = cyl(group, mats.brass, x, y + 0.1, y + 0.62, z, 0.028, { seg: 10 }); stick.rotation.z = 0.28; stick.position.x += 0.07;
    add(new T.SphereGeometry(0.075, 16, 12), mats.brass, x + 0.15, y + 0.64, z, group);
    const grab = add(new T.SphereGeometry(0.4, 12, 8), ghost(), x + 0.08, y + 0.4, z, group); grab.castShadow = grab.receiveShadow = false; grab.userData = { lever: mech, near: [node] }; hits.push(grab);
  }
  lever(-3.32, 0, -6.72, 'garden', 'cloister'); lever(4.3, 3, 0.32, 'clock', 'balcony');
  tower(-12, false);
  const clock = tower(12, true);
  const face = clockTexture(), hands = [];
  for (const side of ['x', 'z']) {
    const g = new T.Group(); g.position.set(side === 'x' ? 1.11 : 0, 5.4, side === 'x' ? 12 : 13.11); if (side === 'x') g.rotation.y = Math.PI / 2; group.add(g);
    const ring = add(new T.CylinderGeometry(0.66, 0.66, 0.06, 48), mats.stone, 0, 0, 0.02, g); ring.rotation.x = Math.PI / 2;
    const dial = add(new T.CircleGeometry(0.58, 48), new T.MeshStandardMaterial({ map: face, roughness: 0.6 }), 0, 0, 0.056, g); dial.castShadow = false;
    const hour = new T.Group(), minute = new T.Group(); hour.userData.dynamic = minute.userData.dynamic = true; hour.position.z = minute.position.z = 0.07; g.add(hour, minute);
    add(new T.BoxGeometry(0.05, 0.32, 0.012), mats.iron, 0, 0.14, 0, hour); add(new T.BoxGeometry(0.035, 0.5, 0.012), mats.iron, 0, 0.22, 0.012, minute); hands.push({ hour, minute });
  }
  const bell = new T.Group(); bell.position.set(0, 8.86, 0); clock.add(bell);
  const bellBody = add(new T.LatheGeometry([[0.02, 0], [0.1, -0.04], [0.16, -0.2], [0.2, -0.38], [0.27, -0.46], [0.24, -0.47]].map(p => new T.Vector2(...p)), 32), mats.brass.clone(), 0, 0, 0, bell); bellBody.material.side = T.DoubleSide;
  cyl(clock, mats.stone, -0.5, 7, 7.5, -0.5, 0.045, { seg: 12 }); box(clock, mats.stone, [-0.66, 7.5, -0.62], [-0.34, 7.54, -0.38]);
  const lantern = add(new T.SphereGeometry(0.16, 24, 16), mats.glow, 0, 9.5, 0, clock); lantern.castShadow = false; lantern.visible = false;
  const lamp = new T.PointLight('#ffc978', 0, 9, 1.6); lamp.position.set(0, 8.2, 0); clock.add(lamp);
  // The lantern: an octagonal drum on the cross range, a turntable, and an open domed cupola that turns with it.
  cyl(group, mats.brick, 0, B, 2.3, 0, 1.3, { seg: 8 }); cyl(group, mats.stone, 0, 1.2, 1.32, 0, 1.35, { seg: 8 }); cyl(group, mats.stone, 0, 2.3, 2.75, 0, 1.3, { rTop: 1.12, seg: 8 });
  const cupola = mechanism('garden', 3, 1.04);
  for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + i * Math.PI / 2; cyl(cupola, mats.stone, Math.cos(a) * 0.95, 3, 4.7, Math.sin(a) * 0.95, 0.06, { seg: 12 }); }
  cyl(cupola, mats.stone, 0, 4.7, 4.9, 0, 1.1, { seg: 32 });
  const dome = add(new T.SphereGeometry(1.02, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), mats.lead, 0, 4.9, 0, cupola); dome.scale.y = 1.15;
  for (let i = 0; i < 8; i++) { const rib = add(new T.TorusGeometry(1.03, 0.03, 6, 24, Math.PI / 2), mats.stone, 0, 4.9, 0, cupola); rib.rotation.y = i * Math.PI / 4; rib.scale.y = 1.15; }
  cyl(cupola, mats.stone, 0, 6.0, 6.7, 0, 0.3, { seg: 8 }); cone(cupola, mats.lead, 0, 6.7, 7.3, 0, 0.36, 8); cyl(cupola, mats.brass, 0, 7.25, 7.8, 0, 0.022, { seg: 8 }); add(new T.SphereGeometry(0.07, 12, 10), mats.brass, 0, 7.8, 0, cupola);

  // The key at the foot of the steps; the book behind the library door.
  const key = new T.Group(); key.userData.dynamic = true; key.position.set(-3.62, 0.72, 4.35); group.add(key);
  add(new T.TorusGeometry(0.07, 0.018, 8, 24), mats.brass, 0, 0.07, 0, key); add(new T.BoxGeometry(0.03, 0.2, 0.02), mats.brass, 0, -0.1, 0, key); add(new T.BoxGeometry(0.08, 0.03, 0.02), mats.brass, 0.04, -0.17, 0, key); add(new T.BoxGeometry(0.06, 0.03, 0.02), mats.brass, 0.03, -0.11, 0, key);
  cyl(group, mats.iron, -3.62, 0, 0.95, 4.35, 0.02, { seg: 8 }); box(group, mats.iron, [-3.64, 0.93, 4.33], [-3.44, 0.96, 4.37]);
  function makeBook() { const g = new T.Group(), page = new T.MeshStandardMaterial({ color: '#f4ecd8', roughness: 0.8 }); for (const s of [-1, 1]) { const p = add(new T.BoxGeometry(0.13, 0.02, 0.19), page, s * 0.065, 0, 0, g); p.rotation.z = s * 0.16; } add(new T.BoxGeometry(0.27, 0.012, 0.2), new T.MeshStandardMaterial({ color: '#7a2e2a', roughness: 0.6 }), 0, -0.016, 0, g); return g; }
  cyl(group, mats.stone, 4.32, 3, 3.5, -0.34, 0.045, { seg: 12 }); box(group, mats.stone, [4.17, 3.5, -0.47], [4.47, 3.54, -0.21]);
  const book = makeBook(); book.userData.dynamic = true; book.position.set(4.32, 3.57, -0.34); group.add(book);
  const spark = add(new T.TorusGeometry(0.2, 0.012, 8, 40), mats.brass, 4.32, 3.95, -0.34, group); spark.castShadow = false; spark.userData.dynamic = true;
  const placed = makeBook(); placed.position.set(-0.5, 7.57, -0.5); placed.visible = false; clock.add(placed);

  // Things that move on their own: crowns that stir, cloud shadows, chimney smoke, a flag, and two rabbits.
  const crowns = [], clouds = [], m4 = new T.Matrix4();
  // ---- the grounds: lawn, a drive round the building, parkland trees thinning into the haze ----
  {
    const rnd = (i, s) => { const n = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return n - Math.floor(n); };
    const soft = (x, z) => 0.5 + 0.25 * Math.sin(x * 0.11 + 1.3) * Math.cos(z * 0.09) + 0.15 * Math.sin(x * 0.31 + z * 0.27) + 0.1 * Math.sin(z * 0.53 - x * 0.2);
    const geo = new T.PlaneGeometry(320, 320, 160, 160); geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position, colors = new Float32Array(pos.count * 3);
    for (let i = 0; i < pos.count; i++) { const k = soft(pos.getX(i), pos.getZ(i)); colors[i * 3] = 0.62 + k * 0.5; colors[i * 3 + 1] = 0.7 + k * 0.32; colors[i * 3 + 2] = 0.58 + k * 0.3; }
    geo.setAttribute('color', new T.BufferAttribute(colors, 3));
    for (const k of ['map', 'normalMap']) mats.meadow[k].repeat.set(64, 64);
    const ground = add(geo, mats.meadow, 0, G - 0.06, 0, group); ground.castShadow = false; ground.userData.dynamic = true;
    const gravel = mats.walk.clone(); gravel.color.set('#b9ab8e');
    const road = (x0, z0, x1, z1) => { const m = box(group, gravel, [x0, G - 0.1, z0], [x1, G - 0.03, z1]); m.castShadow = false; };
    road(11.3, -17, 13.2, 17); road(-13.2, -17, -11.3, 17); road(-13.2, 15.4, 13.2, 17); road(-13.2, -17, 13.2, -15.4); road(-0.9, 15.4, 0.9, 70);
    const conifer = (x, z, s) => { cyl(group, mats.trunk, x, G, G + 0.8 * s, z, 0.07 * s, { seg: 8 }); for (let i = 0; i < 3; i++) cone(group, mats.leaf, x, G + (0.5 + i * 0.62) * s, G + (1.7 + i * 0.62) * s, z, (0.62 - i * 0.14) * s, 12); };
    let placedTrees = 0;
    for (let i = 0; placedTrees < 160 && i < 900; i++) {
      const x = (rnd(i, 1) - 0.5) * 170, z = (rnd(i, 2) - 0.5) * 170, s = 1.6 + rnd(i, 3) * 2.4;
      // Keep the building and its drive clear. Towards the camera a tree may stand only where its top stays below
      // the foot of the building on screen, so the foreground is parkland but nothing ever hides a wall or a path.
      if (Math.abs(x) < 16 && Math.abs(z) < 20) continue; if (x + z > 8 && x + z < 30 + s * 4.8 && Math.abs(x - z) < 38) continue; if (Math.abs(x) < 3.4 && z > 15) continue;
      if (i % 3 === 0) conifer(x, z, s * 0.9); else tree(group, x, G, z, s); placedTrees++;
    }
    // Specimen trees near the building, some in blossom. Each crown is baked into one mesh that stirs in the breeze.
    const blossom = new T.MeshStandardMaterial({ color: '#d58f9d', roughness: 1 }), may = new T.MeshStandardMaterial({ color: '#c8c3ac', roughness: 1 }), spring = new T.MeshStandardMaterial({ color: '#5d853c', roughness: 1 });
    for (const [x, z, s, mat] of [[-17, 6, 2.6, mats.leaf], [-16, -12, 2.2, blossom], [-6, -20, 2.4, mats.leaf], [8, -21, 2.8, spring], [17, -16, 2.3, may], [-19, 16, 2.4, spring], [26, 9.5, 2.2, blossom], [10, 27, 2.3, may]]) {
      cyl(group, mats.trunk, x, G, G + 0.8 * s, z, 0.06 * s, { seg: 8 });
      const c = new T.Group(); c.position.set(x, G + 0.7 * s, z); c.rotation.y = crowns.length * 1.9; group.add(c);
      for (const [dx, dy, dz, r] of [[0, 0.3, 0, 0.5], [0.28, 0.12, 0.1, 0.36], [-0.25, 0.16, -0.12, 0.38], [0.05, 0.62, -0.05, 0.36], [-0.05, 0.2, 0.3, 0.33]]) { const m = add(new T.IcosahedronGeometry(r * s, 2), mat, dx * s, dy * s, dz * s, c); m.scale.y = 0.9; }
      mergeStatic(c, new Set()); c.userData.dynamic = true; crowns.push(c);
    }
    // Formal lawns, mown in stripes, either side of the main drive and along the east front.
    for (const [x0, z0, x1, z1] of [[2.4, 18.2, 12.6, 24.5], [-12.6, 18.2, -2.4, 24.5], [14.6, -9, 22, 13]]) { const m = box(group, mats.lawn, [x0, G - 0.1, z0], [x1, G - 0.045, z1]); m.castShadow = false; }
    // Daffodils in drifts: along the verges of the drive and under the trees. One instanced mesh.
    const drifts = [[1.65, 27, 0.4, 8, 70], [-1.65, 27, 0.4, 8, 70], [26, 9.5, 2, 2, 70], [10, 27, 1.8, 1.8, 60], [-17, 6, 2, 2, 50], [17, -16, 1.8, 1.8, 40], [-19, 16, 2, 2, 40], [23, 25, 3, 2, 60], [31, 20, 2.5, 3, 50]];
    const daffs = new T.InstancedMesh(new T.IcosahedronGeometry(0.075, 0), new T.MeshStandardMaterial({ roughness: 0.8 }), drifts.reduce((n, d) => n + d[4], 0)), tint = new T.Color();
    daffs.userData.dynamic = true; daffs.frustumCulled = false; daffs.receiveShadow = true; group.add(daffs);
    let d = 0; for (const [cx, cz, rx, rz, n] of drifts) for (let i = 0; i < n; i++, d++) { m4.makeScale(1, 0.7, 1).setPosition(cx + (rnd(d, 5) + rnd(d, 6) - 1) * rx, G + 0.02, cz + (rnd(d, 7) + rnd(d, 8) - 1) * rz); daffs.setMatrixAt(d, m4); daffs.setColorAt(d, tint.set(rnd(d, 9) < 0.25 ? '#f6efcf' : rnd(d, 9) < 0.6 ? '#f2c230' : '#f7d64a')); }
    // A bench under the blossom, and a bicycle left leaning against the east wall.
    box(group, mats.trunk, [24.5, G + 0.2, 8.9], [24.86, G + 0.25, 10.1]); box(group, mats.trunk, [24.82, G + 0.25, 8.9], [24.87, G + 0.55, 10.1]); for (const z of [9, 10]) box(group, mats.iron, [24.52, G - 0.06, z - 0.03], [24.86, G + 0.2, z + 0.03]);
    { const bike = new T.Group(); bike.position.set(9.66, G - 0.06, 6.85); bike.rotation.y = Math.PI / 2; group.add(bike); const lean = new T.Group(); lean.rotation.x = -0.2; bike.add(lean);
      for (const x of [-0.3, 0.3]) add(new T.TorusGeometry(0.2, 0.014, 6, 24), mats.iron, x, 0.21, 0, lean);
      for (const [x, y, len, a] of [[-0.14, 0.33, 0.4, 0.75], [0.08, 0.33, 0.38, -0.8], [-0.04, 0.47, 0.42, 0.06], [0.26, 0.4, 0.42, 1.25], [-0.16, 0.2, 0.3, 0.05]]) { const bar = add(new T.BoxGeometry(len, 0.022, 0.022), mats.red, x, y, 0, lean); bar.rotation.z = a; }
      add(new T.BoxGeometry(0.13, 0.03, 0.06), mats.iron, -0.19, 0.52, 0, lean); add(new T.BoxGeometry(0.03, 0.03, 0.3), mats.iron, 0.21, 0.6, 0, lean); }
    // Cloud shadows: soft dark patches that drift slowly over the lawns with the wind.
    const cc = document.createElement('canvas'); cc.width = cc.height = 128; const cg = cc.getContext('2d');
    for (const [x, y, r] of [[64, 64, 44], [44, 58, 34], [84, 70, 36], [62, 44, 30], [70, 84, 30]]) { const g = cg.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)'); cg.fillStyle = g; cg.fillRect(0, 0, 128, 128); }
    const shade = new T.MeshBasicMaterial({ map: new T.CanvasTexture(cc), color: '#1b2c22', transparent: true, opacity: 0.34, depthWrite: false }), sg = new T.PlaneGeometry(1, 1); sg.rotateX(-Math.PI / 2);
    for (const [z, w, l] of [[-22, 40, 26], [26, 30, 22], [6, 50, 30], [46, 36, 24]]) { const m = add(sg, shade, 0, G - 0.02, z, group); m.scale.set(w, 1, l); m.castShadow = m.receiveShadow = false; m.userData.dynamic = true; clouds.push(m); }
  }

  // Smoke from three chimneys on the far side, so it rises clear of every path: one instanced mesh of soft puffs.
  const stacks = [[-8, 6.5, -6.24], [-8, 6.5, 2.08], [-8.9, 7.3, -12]], PUFFS = 9;
  const smoke = new T.InstancedMesh(new T.IcosahedronGeometry(1, 2), new T.MeshStandardMaterial({ color: '#d6d1c8', roughness: 1, transparent: true, opacity: 0.4, depthWrite: false }), stacks.length * PUFFS);
  smoke.userData.dynamic = true; smoke.frustumCulled = false; smoke.castShadow = smoke.receiveShadow = false; group.add(smoke);
  // The flag on the north tower streams downwind; its vertices are rippled in place.
  const flag = add(new T.PlaneGeometry(0.78, 0.42, 8, 1), new T.MeshStandardMaterial({ color: '#34508c', roughness: 0.8, side: T.DoubleSide }), -0.42, 11.95, -12, group); flag.userData.dynamic = true; flag.castShadow = false;
  // Two rabbits on the east lawn: one grazes and now and then sits up, the other hops round the blossom tree.
  const fur = new T.MeshStandardMaterial({ color: '#8d745c', roughness: 1 });
  const rabbit = () => { const g = new T.Group(); g.userData.dynamic = true; g.scale.setScalar(1.3); group.add(g);
    const body = add(new T.SphereGeometry(0.13, 12, 8), fur, 0, 0.11, 0, g); body.scale.set(1.35, 0.95, 0.9); add(new T.SphereGeometry(0.075, 10, 8), fur, 0.17, 0.2, 0, g);
    for (const z of [-0.03, 0.03]) { const ear = add(new T.BoxGeometry(0.03, 0.15, 0.03), fur, 0.15, 0.32, z, g); ear.rotation.z = 0.25; }
    add(new T.SphereGeometry(0.045, 8, 6), mats.white, -0.18, 0.13, 0, g); return g; };
  const grazer = rabbit(), hopper = rabbit(); grazer.position.set(21.2, G - 0.045, 7.2); grazer.rotation.y = 2.2;
  // Everything that drifts is placed by one function of time, called once here so a still scene is still composed.
  function ambient(t) {
    for (let i = 0; i < crowns.length; i++) { crowns[i].rotation.x = Math.sin(t * 0.7 + i * 1.7) * 0.03; crowns[i].rotation.z = Math.sin(t * 0.53 + i * 2.3) * 0.04; }
    for (let i = 0; i < clouds.length; i++) clouds[i].position.x = 85 - (t * 0.45 + i * 42.5 + 20) % 170;
    for (let i = 0; i < stacks.length * PUFFS; i++) { const s = stacks[i / PUFFS | 0], k = (t * 0.07 + (i % PUFFS) / PUFFS + i * 0.031) % 1, r = (0.1 + 0.42 * k) * Math.min(1, k * 8) * (1 - k * k); m4.makeScale(r, r, r).setPosition(s[0] - 1.8 * k * Math.sqrt(k) + Math.sin(k * 9 + i) * 0.06, s[1] + 2.4 * k, s[2] + Math.sin(k * 5 + i * 2) * 0.12 * k); smoke.setMatrixAt(i, m4); }
    smoke.instanceMatrix.needsUpdate = true;
    const p = flag.geometry.attributes.position; for (let i = 0; i < p.count; i++) { const x = 0.39 - p.getX(i); p.setZ(i, Math.sin(x * 8 - t * 5) * 0.09 * x / 0.78); } p.needsUpdate = true;
    const n = Math.floor(t * 0.3), f = t * 0.3 - n, h = Math.min(1, f / 0.3), a = (n + h * h * (3 - 2 * h)) * 0.45;
    hopper.position.set(26 + Math.cos(a) * 1.5, G - 0.06 + Math.sin(Math.PI * h) * 0.16, 9.5 + Math.sin(a) * 1.5); hopper.rotation.y = -a - Math.PI / 2;
    const up = Math.max(0, Math.min(1, Math.sin(t * 0.8) * 4 - 2.6)); grazer.rotation.z = up * 0.7 + (1 - up) * Math.sin(t * 7) * 0.03;
  }
  ambient(0);
  // Invisible tap targets at every fixed node.
  for (const [id, n] of Object.entries(data.nodes)) if (n.pos) { const h = add(new T.BoxGeometry(1, 0.06, 1), ghost(), n.pos[0], n.pos[1] + 0.03, n.pos[2], group); h.castShadow = h.receiveShadow = false; h.userData.near = [id]; hits.push(h); }
  mergeStatic(group, new Set(hits));
  function update(time, model, still) {
    const now = new Date(), minutes = now.getMinutes() + now.getSeconds() / 60, hours = now.getHours() % 12 + minutes / 60;
    for (const h of hands) { h.minute.rotation.z = -minutes / 60 * Math.PI * 2; h.hour.rotation.z = -hours / 12 * Math.PI * 2; }
    book.visible = !model.items.has('book'); spark.visible = model.items.has('key') && !model.items.has('book'); placed.visible = model.won; key.visible = !model.items.has('key');
    if (!still) { ambient(time); key.rotation.y = time * 1.4; spark.rotation.y = time * 1.2; spark.position.y = 3.95 + Math.sin(time * 1.6) * 0.04; }
    bell.rotation.z = model.won && !still ? Math.sin(time * 5.5) * 0.3 * Math.exp(-((time - (update.wonAt ??= time)) % 6) * 0.5) : 0;
    lantern.visible = model.won; mats.glow.emissiveIntensity = model.won ? 6 : 0; lamp.intensity = model.won ? 14 : 0;
  }
  // Extent used to frame the camera.
  const frame = [[-10, 0, 14.2], [10, 0, -14.2], [10, 0, 14.2], [-10, 6.5, -14], [0, 12.2, -12], [0, 7, 15.7], [3.7, 7, 12], [-10, 7.4, 12]];
  return { group, hits, mechs, update, frame, water: false, birds: { x: 0, z: 9, h: 11 } };
}
