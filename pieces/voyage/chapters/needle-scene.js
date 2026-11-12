import * as T from '../../tower/vendor/three.js';
// Seattle in the rain, modelled from two photographs of the Space Needle: three pairs of white legs pinching to
// an hourglass waist, the rust-orange lift core, the saucer with its halo and white roof, and the spire. Around
// it: the white arches of the Science Center standing in their pool, the monorail, evergreens, the downtown
// skyline and Mount Rainier. Heights are compressed. Positions must agree with chapters/needle.mjs.
const SEA = -1.6;
export function createNeedleScene(kit, data) {
  const { mats, add, box, cyl, cone, mergeStatic } = kit, group = new T.Group(), hits = [], mechs = {};
  const ghost = () => new T.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
  const wet = mats.walk.clone(); wet.color.set('#7f878d'); wet.roughness = 0.22; wet.metalness = 0.3; wet.envMapIntensity = 1.4;
  const rust = new T.MeshStandardMaterial({ color: '#a4582a', roughness: 0.7, metalness: 0.3 }), gold = new T.MeshStandardMaterial({ color: '#d9b25c', roughness: 0.35, metalness: 0.8 });
  const pond = new T.MeshStandardMaterial({ color: '#5f7c86', roughness: 0.05, metalness: 0.7, envMapIntensity: 1.6 });
  // Dusk in the rain: warm glass (lit from inside), lamps that breathe, a beacon, puddles, and paler bands of paving.
  const lit = new T.MeshStandardMaterial({ color: '#ffe6b8', emissive: '#ffb45a', emissiveIntensity: 1.1, roughness: 0.4 });
  const lamp = mats.glow.clone(), beaconMat = mats.glow.clone(); lamp.emissiveIntensity = beaconMat.emissiveIntensity = 2.5;
  const puddle = new T.MeshStandardMaterial({ color: '#63727a', roughness: 0.03, metalness: 0.85, envMapIntensity: 1.9 });
  const pale = wet.clone(); pale.color.set('#a9afb1'); pale.roughness = 0.35;
  const rnd = (i, s) => { const n = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return n - Math.floor(n); };
  const flat = geo => geo.rotateX(-Math.PI / 2), S = Math.SQRT1_2;
  // A sub-group whose fixed parts are baked to one mesh per material, and which is then free to move as a whole.
  const bake = g => { mergeStatic(g, new Set(hits)); g.userData.dynamic = true; return g; };
  const ground = (a, b, near) => { const m = box(group, wet, a, b); m.castShadow = false; if (near) { m.userData.near = near; hits.push(m); } return m; };
  function lever(x, y, z, mech, node, mat = mats.red) {
    cyl(group, mats.iron, x, y, y + 0.14, z, 0.12, { seg: 14 }); const stick = cyl(group, mats.brass, x, y + 0.1, y + 0.62, z, 0.028, { seg: 8 }); stick.rotation.z = 0.3; stick.position.x += 0.08;
    add(new T.SphereGeometry(0.075, 14, 10), mat, x + 0.16, y + 0.64, z, group);
    const grab = add(new T.SphereGeometry(0.34, 12, 8), ghost(), x + 0.08, y + 0.4, z, group); grab.castShadow = grab.receiveShadow = false; grab.userData = { lever: mech, near: [node] }; hits.push(grab);
  }
  const fir = (x, z, s) => { cyl(group, mats.trunk, x, 0, 0.8 * s, z, 0.07 * s, { seg: 8 }); for (let i = 0; i < 4; i++) cone(group, mats.jungle, x, (0.5 + i * 0.6) * s, (1.7 + i * 0.6) * s, z, (0.7 - i * 0.14) * s, 10); };

  // ---- the ground: wet paving, with the pool cut out of it ----
  const NEAR = ['lobby'];
  ground([-9.7, -1.6, -24], [24, 0, 16], NEAR); ground([-24, -1.6, -1.5], [-9.7, 0, 16], NEAR); ground([-24, -1.6, -24], [-15.5, 0, -1.5]); ground([-15.5, -1.6, -24], [-9.7, 0, -8]);
  box(group, mats.stone, [-15.5, -1.5, -8], [-9.7, -1.35, -1.5]).castShadow = false;
  for (const [a, b] of [[[9, 0, 7.5], [22, 0.04, 15]], [[-22, 0, 6], [-6, 0.04, 15]], [[12, 0, -22], [22, 0.04, -10]], [[-22, 0, -22], [-13, 0.04, -9]]]) box(group, mats.lawn, a, b).castShadow = false;
  // The plaza runs on towards the camera, so no edge of it shows; another lawn and a few firs stand down there.
  box(group, wet, [-60, -1.6, 16], [60, 0, 46]).castShadow = false; box(group, mats.lawn, [-21, 0, 18], [-3, 0.04, 30]).castShadow = false; box(group, mats.lawn, [4, 0, 19], [20, 0.04, 30]).castShadow = false;
  // Paving: two pale rings round the foot of the Needle with spokes between them, and puddles where the rain lies.
  for (const [r0, r1] of [[4.3, 4.5], [7, 7.2]]) add(flat(new T.RingGeometry(r0, r1, 72)), pale, 0, 0.006, 0, group).castShadow = false;
  for (let i = 0; i < 12; i++) { const a = (15 + i * 30) * Math.PI / 180, s = add(new T.BoxGeometry(2.5, 0.012, 0.1), pale, Math.cos(a) * 5.75, 0, Math.sin(a) * 5.75, group); s.rotation.y = -a; s.castShadow = false; }
  const PUDDLES = [[5.4, -2.3, 1.0, 0.6, 0.4], [-3.4, 2.6, 0.9, 0.55, 1.1], [-6.6, -2.8, 1.1, 0.6, 2.0], [3.4, 5.8, 0.8, 0.5, 0.2], [8.6, 1.4, 0.9, 0.5, 2.6], [-1.8, -6.4, 1.0, 0.55, 0.9], [1.6, 9.4, 0.7, 0.45, 1.7]];
  for (const [x, z, rx, rz, rot] of PUDDLES) for (const [dx, dz, k] of [[0, 0, 1], [rx * 0.6, rz * 0.5, 0.6]]) { const p = add(flat(new T.CircleGeometry(1, 28)), puddle, x + dx, 0.012, z + dz, group); p.scale.set(rx * k, 1, rz * k); p.rotation.y = rot; p.castShadow = false; }
  // ---- the Needle ----
  for (let y = 0; y < 9.4; y += 0.6) { box(group, rust, [-0.5, y, -0.5], [0.5, y + 0.06, 0.5]); for (const [x, z] of [[-0.46, -0.46], [0.46, -0.46], [-0.46, 0.46], [0.46, 0.46]]) box(group, rust, [x - 0.04, y, z - 0.04], [x + 0.04, y + 0.6, z + 0.04]); const d = add(new T.BoxGeometry(1.1, 0.04, 0.04), rust, 0, y + 0.3, 0.47, group); d.rotation.z = (Math.round(y / 0.6) % 2 ? 1 : -1) * 0.55; const e = add(new T.BoxGeometry(0.04, 0.04, 1.1), rust, 0.47, y + 0.3, 0, group); e.rotation.x = (Math.round(y / 0.6) % 2 ? 1 : -1) * 0.55; }
  box(group, mats.white, [-0.3, 0, -0.3], [0.3, 9.4, 0.3]);
  const waist = y => (y < 6.4 ? 2.75 - (2.75 - 0.95) * Math.pow(y / 6.4, 0.8) : 0.95 + (2.15 - 0.95) * Math.pow((y - 6.4) / 2.9, 1.5));
  for (const deg of [60, 180, 300]) for (const off of [-0.07, 0.07]) {
    const a = deg * Math.PI / 180 + off, pts = []; for (let y = 0; y <= 9.3; y += 0.62) pts.push(new T.Vector3(Math.cos(a) * waist(y), y, Math.sin(a) * waist(y)));
    const leg = add(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 40, 0.13, 8), mats.white, 0, 0, 0, group); leg.userData.dynamic = true;
    cyl(group, mats.stone, Math.cos(a) * 2.75, 0, 0.25, Math.sin(a) * 2.75, 0.3, { seg: 12 });
  }
  cyl(group, mats.white, 0, 4.82, 5, 0, 1.45, { seg: 48 }); box(group, mats.white, [0.6, 4.82, -0.62], [2.6, 5, 0.62]); const ringTile = box(group, mats.walk, [1.5, 4.8, -0.5], [2.5, 5.001, 0.5]); ringTile.userData.near = ['ring']; hits.push(ringTile);
  const halo5 = add(new T.TorusGeometry(1.45, 0.04, 8, 60), gold, 0, 4.92, 0, group); halo5.rotation.x = Math.PI / 2;
  add(new T.TorusGeometry(0.97, 0.05, 8, 40), mats.white, 0, 6.4, 0, group).rotation.x = Math.PI / 2; // the collar at the waist
  // The lobby at the foot is a drum of warm glass under a white lid.
  cyl(group, lit, 0, 0, 0.55, 0, 1.5, { seg: 40 }); cyl(group, mats.white, 0, 0.55, 0.68, 0, 1.7, { seg: 40 }); for (let i = 0; i < 20; i++) { const a = i * Math.PI / 10 + 0.16; box(group, mats.white, [Math.cos(a) * 1.5 - 0.025, 0, Math.sin(a) * 1.5 - 0.025], [Math.cos(a) * 1.5 + 0.025, 0.55, Math.sin(a) * 1.5 + 0.025]); }
  { const t = box(group, mats.walk, [1.5, -0.02, -0.5], [2.5, 0.004, 0.5]); t.userData.near = ['lobby']; hits.push(t); t.castShadow = false; }
  // The lift: a gold car on the outside of the core.
  const car = new T.Group(); car.userData.dynamic = true; group.add(car);
  { const f = box(car, gold, [-0.45, -0.25, -0.45], [0.45, 0.004, 0.45]); f.userData.near = ['car']; hits.push(f); for (const [x, z] of [[-0.42, -0.42], [-0.42, 0.42]]) cyl(car, gold, x, 0, 1.25, z, 0.025, { seg: 6 }); box(car, gold, [-0.45, 1.25, -0.45], [-0.2, 1.3, 0.45]); box(car, mats.glass, [-0.46, 0.1, -0.43], [-0.44, 1.2, 0.43]); }
  box(group, mats.iron, [0.52, 0, -0.06], [0.58, 9.6, 0.06]); mechs.lift = { group: car, hub: new T.Vector3(1, 5, 0) };
  // The saucer: a turning deck, its underside, a sloped band of lit windows under the lip, the halo on its spokes,
  // and the white roof on slim columns, with the spire and its beacon above. Its fixed parts are baked together.
  const saucer = new T.Group(); group.add(saucer);
  { const deck = cyl(saucer, mats.walk, 0, 9.75, 10, 0, 3.5, { seg: 64 }); deck.userData = { near: ['rim', 'crown'], mech: 'saucer' }; hits.push(deck);
    cyl(saucer, mats.white, 0, 8.9, 9.75, 0, 1.3, { rTop: 3.45, seg: 48 }); for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12, rib = add(new T.BoxGeometry(2.2, 0.05, 0.05), mats.white, Math.cos(a) * 2.35, 9.32, Math.sin(a) * 2.35, saucer); rib.rotation.set(0, -a, 0.37, 'YXZ'); }
    const halo = add(new T.TorusGeometry(3.95, 0.06, 8, 80), gold, 0, 9.62, 0, saucer); halo.rotation.x = Math.PI / 2; add(flat(new T.RingGeometry(3.74, 3.93, 80)), mats.white, 0, 9.63, 0, saucer);
    for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12 + 0.13, s = add(new T.BoxGeometry(0.34, 0.03, 0.03), mats.white, Math.cos(a) * 3.6, 9.64, Math.sin(a) * 3.6, saucer); s.rotation.y = -a; }
    cyl(saucer, lit, 0, 9.24, 9.74, 0, 3.08, { rTop: 3.46, seg: 64 }).castShadow = false;
    for (let i = 0; i < 36; i++) { const a = i * Math.PI / 18, m = add(new T.BoxGeometry(0.03, 0.6, 0.045), mats.white, Math.cos(a) * 3.285, 9.49, Math.sin(a) * 3.285, saucer); m.rotation.set(0, -a, -0.65, 'YXZ'); m.castShadow = false; }
    add(flat(new T.RingGeometry(1.9, 1.97, 64)), mats.brass, 0, 10.006, 0, saucer).castShadow = false; add(new T.TorusGeometry(3.46, 0.018, 6, 80), mats.white, 0, 10.3, 0, saucer).rotation.x = Math.PI / 2; for (let i = 0; i < 36; i++) { const a = i * Math.PI / 18 + 0.09; cyl(saucer, mats.white, Math.cos(a) * 3.46, 10, 10.3, Math.sin(a) * 3.46, 0.014, { seg: 5 }); } // an inlaid ring, and a rail round the edge
    const mark = add(new T.TorusGeometry(0.36, 0.03, 8, 32), mats.brass, 3, 10.012, 0, saucer); mark.rotation.x = Math.PI / 2; mark.castShadow = false;
    for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + i * Math.PI / 2; cyl(saucer, mats.white, Math.cos(a) * 1.25, 10, 12.1, Math.sin(a) * 1.25, 0.05, { seg: 8 }); }
    cyl(saucer, mats.white, 0, 12.1, 12.55, 0, 1.75, { rTop: 0.85, seg: 48 }); cyl(saucer, mats.white, 0, 12.55, 12.8, 0, 0.85, { rTop: 1.0, seg: 48 }); cyl(saucer, mats.iron, 0, 12.8, 13.1, 0, 0.7, { seg: 32 });
    cyl(saucer, gold, 0, 13.1, 15.4, 0, 0.09, { rTop: 0.03, seg: 8 }); for (const y of [13.6, 14.2]) cyl(saucer, gold, 0, y, y + 0.04, 0, 0.16, { seg: 8 }); const beacon = add(new T.SphereGeometry(0.1, 12, 10), beaconMat, 0, 15.45, 0, saucer); beacon.castShadow = false;
    const knob = add(new T.SphereGeometry(0.4, 12, 8), ghost(), -3, 10.4, 0, saucer); knob.castShadow = knob.receiveShadow = false; knob.userData = { mech: 'saucer', handle: true }; hits.push(knob); cyl(saucer, mats.brass, -3, 10, 10.5, 0, 0.03, { seg: 8 }); add(new T.SphereGeometry(0.08, 12, 10), mats.brass, -3, 10.55, 0, saucer); }
  bake(saucer); mechs.saucer = { group: saucer, hub: new T.Vector3(0, 10, 0) };
  // The kiosk that works the lift, and the two levers on the mid ring.
  box(group, mats.glass, [2.6, 0, 1.3], [3.5, 1.1, 1.7]); box(group, mats.white, [2.5, 1.1, 1.2], [3.6, 1.2, 1.8]); lever(2.5, 0, 0.75, 'lift', 'lobby', gold);
  lever(2.2, 5, -0.38, 'saucer', 'ring', mats.white); const sluiceWheel = add(new T.TorusGeometry(0.16, 0.03, 8, 20), mats.blue, 2.35, 5.3, 0.4, group); sluiceWheel.userData.dynamic = true; cyl(group, mats.iron, 2.35, 5, 5.3, 0.4, 0.025, { seg: 6 });
  { const p = add(new T.CylinderGeometry(0.3, 0.3, 0.03, 28), mats.brass, 2, 5.016, 0, group); p.castShadow = false; }
  // ---- the pool, its pontoon, the island and the white arches ----
  const water = add(new T.BoxGeometry(5.8, 0.1, 6.5), pond, -12.6, -1.2, -4.75, group); water.userData.dynamic = true; water.castShadow = false;
  const raft = new T.Group(); raft.userData.dynamic = true; group.add(raft); { const f = box(raft, mats.deck, [-0.5, -0.25, -0.5], [0.5, 0, 0.5]);  for (const z of [-0.42, 0.42]) cyl(raft, mats.lead, 0, -0.42, -0.2, z, 0.2, { seg: 12 }).rotation.z = Math.PI / 2; }
  let raftY = -1;
  box(group, mats.white, [-14.2, -1.5, -7.3], [-10.9, 0, -2.5]); { const t = box(group, mats.walk, [-12.5, -0.02, -3.5], [-11.5, 0.004, -2.5]); }
  for (const [z, h] of [[-3.9, 4.6], [-5, 5.0], [-6.1, 4.6]]) {
    for (const s of [-1, 1]) { const pts = []; for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push(new T.Vector3(-12 + s * 1.05 * (1 - t * t), t * (h - 0.25), z)); } const rib = add(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 24, 0.06, 6), mats.white, 0, 0, 0, group); rib.userData.dynamic = true;
      const inner = []; for (let i = 0; i <= 10; i++) { const t = i / 10; inner.push(new T.Vector3(-12 + s * 0.6 * (1 - t * t), t * (h - 0.9), z)); } const r2 = add(new T.TubeGeometry(new T.CatmullRomCurve3(inner), 24, 0.035, 6), mats.white, 0, 0, 0, group); r2.userData.dynamic = true; }
    for (let y = 0.6; y < h - 1; y += 0.6) box(group, mats.white, [-12 - 1.05 * (1 - (y / h) ** 2), y, z - 0.025], [-12 + 1.05 * (1 - (y / h) ** 2), y + 0.04, z + 0.025]);
  }
  // The skybridge: from the top of the middle arch out into mid-air.
  { const t = box(group, mats.walk, [-12.5, 4.75, -5.5], [-8.5, 5, -4.5]); t.userData.near = ['skyEnd']; hits.push(t); for (const x of [-11, -9.6]) { const st = add(new T.BoxGeometry(2.6, 0.05, 0.05), mats.white, x - 0.6, 3.9, -5, group); st.rotation.z = 0.75; } for (const z of [-5.48, -4.52]) box(group, mats.white, [-12.5, 5, z - 0.015], [-8.6, 5.03, z + 0.015]); }
  // ---- the rest of Seattle Center: a blob of coloured metal, the monorail, firs ----
  for (const [x, y, z, rx, ry, rz, c] of [[11, 0, -6.5, 2.6, 1.9, 2.0, '#8e3f8f'], [13.6, 0, -8.2, 2.4, 1.6, 2.2, '#b8bcc4'], [9.4, 0, -9, 2.2, 1.7, 1.8, '#c0392b'], [12.3, 0, -10.6, 2.6, 1.5, 1.8, '#3f6fb5']]) { const b = add(new T.SphereGeometry(1, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2), new T.MeshStandardMaterial({ color: c, roughness: 0.25, metalness: 0.75 }), x, y, z, group); b.scale.set(rx, ry, rz); }
  box(group, mats.stone, [-24, 2.3, -13.3], [24, 2.6, -12.7]); for (let x = -22; x <= 22; x += 4) box(group, mats.stone, [x - 0.2, 0, -13.2], [x + 0.2, 2.3, -12.8]);
  // The monorail: lit windows and a lamp at each end. It waits at a small station by the museum, glides off, and comes back.
  const STOP = 6, FAR = -19, train = new T.Group(); train.position.set(STOP, 2.6, -13); group.add(train); box(train, mats.white, [-2.2, 0, -0.42], [2.2, 0.75, 0.42]); box(train, mats.red, [-2.2, 0.08, -0.44], [2.2, 0.22, 0.44]); box(train, lit, [-2.0, 0.34, -0.44], [2.0, 0.62, 0.44]);
  for (let x = -1.5; x <= 1.5; x += 0.5) box(train, mats.white, [x - 0.03, 0.34, -0.45], [x + 0.03, 0.62, 0.45]); for (const x of [-2.2, 2.2]) add(new T.SphereGeometry(0.07, 10, 8), lamp, x, 0.2, 0, train).castShadow = false; bake(train);
  box(group, mats.stone, [STOP - 2.6, 2.42, -12.56], [STOP + 2.6, 2.58, -11.7]); for (const x of [STOP - 2.2, STOP + 2.2]) { box(group, mats.stone, [x - 0.12, 0, -12.25], [x + 0.12, 2.42, -12.01]); cyl(group, mats.white, x, 2.58, 3.75, -11.85, 0.035, { seg: 6 }); } box(group, mats.white, [STOP - 2.5, 3.75, -12.5], [STOP + 2.5, 3.81, -11.65]);
  for (let i = 0; i < 7; i++) box(group, mats.stone, [STOP + 2.6 + i * 0.3, 2.42 - (i + 1) * 0.345, -12.4], [STOP + 2.9 + i * 0.3, 2.58 - i * 0.345, -11.8]); // steps down to the plaza
  for (const [x, z, s] of [[10.5, 9, 1.5], [14, 11.5, 1.8], [18, 9.5, 1.6], [20, 13, 2.0], [-9, 8, 1.6], [-13, 10.5, 1.9], [-17, 8, 1.7], [-20, 12, 2.1], [14, -15, 1.9], [18, -12.5, 1.6], [21, -17, 2.2], [-15, -12, 1.8], [-19, -15, 2.1], [-16.5, -19, 1.7], [-21, -5, 1.9], [-14.5, 3.5, 1.4], [16.5, 3, 1.3], [-16, 21, 1.9], [-9, 24, 2.1], [-5, 20, 1.6], [9, 23, 2.0], [16, 21, 1.7]]) fir(x, z, s);
  // ---- lamps: a globe on a post, a pool of warm light on the wet paving, and its reflection drawn towards the eye ----
  const gp = [], gc = [], fan = (cx, cz, ux, uz, a, b, k) => { for (let i = 0; i < 18; i++) { gp.push(cx, 0.05, cz); gc.push(k, k * 0.6, k * 0.24); for (const t of [i * Math.PI / 9, (i + 1) * Math.PI / 9]) { gp.push(cx + Math.cos(t) * a * ux - Math.sin(t) * b * uz, 0.05, cz + Math.cos(t) * a * uz + Math.sin(t) * b * ux); gc.push(0, 0, 0); } } };
  for (const [x, z] of [[5.5, -3.5], [-4.5, -4.5], [-4.5, 3.5], [5.5, 8.5], [13, 2.5], [0.5, 12], [-9, -10], [3, -8.5]]) {
    cyl(group, mats.iron, x, 0, 0.12, z, 0.1, { seg: 10 }); cyl(group, mats.iron, x, 0.12, 1.66, z, 0.03, { seg: 6 }); add(new T.SphereGeometry(0.13, 12, 10), lamp, x, 1.76, z, group).castShadow = false;
    fan(x, z, 1, 0, 1.7, 1.7, 0.3); fan(x + 1.4, z + 1.4, S, S, 1.6, 0.26, 0.4);
  }
  fan(0, 0, 1, 0, 3.4, 3.4, 0.28); fan(1.9, 1.9, S, S, 1.9, 0.8, 0.2); // light spilling from the lobby
  const glowGeo = new T.BufferGeometry(); glowGeo.setAttribute('position', new T.Float32BufferAttribute(gp, 3)); glowGeo.setAttribute('color', new T.Float32BufferAttribute(gc, 3));
  const glowMat = new T.MeshBasicMaterial({ vertexColors: true, transparent: true, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide }), glow = new T.Mesh(glowGeo, glowMat); glow.userData.dynamic = true; group.add(glow);
  // ---- the fountain: a steel dome in a bowl, a ring of jets that rise and fall in a slow wave, and something yellow afloat ----
  const FX = -2.5, FZ = 9.5; cyl(group, mats.stone, FX, 0, 0.16, FZ, 1.75, { seg: 40 }); cyl(group, puddle, FX, 0.16, 0.2, FZ, 1.55, { seg: 40 }).castShadow = false;
  { const d = add(new T.SphereGeometry(0.55, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), mats.lead, FX, 0.2, FZ, group); d.scale.y = 0.75; }
  const JETS = 11, DROPS = 7, jetPos = new Float32Array(JETS * DROPS * 3), jetGeo = new T.BufferGeometry(); jetGeo.setAttribute('position', new T.BufferAttribute(jetPos, 3));
  const jets = new T.Points(jetGeo, new T.PointsMaterial({ color: '#f4f8fa', size: 1.7, transparent: true, opacity: 0.8, depthWrite: false })); jets.userData.dynamic = true; jets.frustumCulled = false; group.add(jets);
  function spray(time) {
    for (let j = 0; j < JETS; j++) for (let d = 0; d < DROPS; d++) {
      const u = (time * 0.55 + d / DROPS + j * 0.37) % 1, k = (j * DROPS + d) * 3, a = j * Math.PI * 0.2, mid = j === JETS - 1, h = mid ? 1.7 + Math.sin(time * 0.25) * 0.5 : 0.75 + Math.sin(time * 0.4 + j * 0.63) * 0.35, r = mid ? 0.04 * u : 0.32 + 0.85 * u;
      jetPos[k] = FX + Math.cos(a) * r; jetPos[k + 1] = (mid ? 0.6 : 0.5 - 0.3 * u) + 4 * h * u * (1 - u); jetPos[k + 2] = FZ + Math.sin(a) * r;
    }
    jetGeo.attributes.position.needsUpdate = true;
  }
  spray(0);
  const duck = new T.Group(); group.add(duck); { const b = add(new T.SphereGeometry(0.13, 12, 8), mats.yellow, 0, 0.06, 0, duck); b.scale.set(1.25, 0.8, 0.9); add(new T.SphereGeometry(0.08, 10, 8), mats.yellow, 0.12, 0.2, 0, duck); const beak = add(new T.ConeGeometry(0.035, 0.09, 8), mats.orange, 0.22, 0.19, 0, duck); beak.rotation.z = -Math.PI / 2; } bake(duck); duck.position.set(FX + 1.05, 0.2, FZ);
  // ---- people out in the rain, each under an umbrella; now and then one is shaken dry ----
  const brollies = []; for (const [x, z, coat, top] of [[-0.2, 7.9, mats.blue, '#c8402f'], [-4.9, 8.7, mats.iron, '#f0c348'], [6.6, 2.9, mats.lead, '#2aa39a']]) {
    cyl(group, coat, x, 0, 0.5, z, 0.11, { rTop: 0.07, seg: 10 }); add(new T.SphereGeometry(0.075, 10, 8), mats.cream, x, 0.57, z, group); cyl(group, mats.iron, x + 0.08, 0.3, 0.86, z, 0.012, { seg: 5 });
    const c = add(new T.ConeGeometry(0.36, 0.15, 8, 1, true), new T.MeshStandardMaterial({ color: top, roughness: 0.6, side: T.DoubleSide }), x + 0.08, 0.9, z, group); c.userData.dynamic = true; brollies.push(c);
  }
  // ---- the glass garden: reeds and globes of bright blown glass in a dark bed, under white hoops ----
  { const glassy = c => new T.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.45, roughness: 0.12, metalness: 0.2 }), tints = ['#ff7a1c', '#ffd23a', '#e2342c', '#3b7bff', '#7ad04a'].map(glassy);
    box(group, mats.trunk, [7.2, 0, 3.4], [10.4, 0.07, 6.4]);
    for (let i = 0; i < 26; i++) { const x = 7.45 + rnd(i, 11) * 2.7, z = 3.65 + rnd(i, 12) * 2.5, m = tints[i % 5]; if (i % 3) { const h = 0.5 + rnd(i, 13) * 0.9, r = cone(group, m, x, 0.07, 0.07 + h, z, 0.05, 6); r.rotation.set((rnd(i, 14) - 0.5) * 0.3, 0, (rnd(i, 15) - 0.5) * 0.3); } else add(new T.SphereGeometry(0.13 + rnd(i, 13) * 0.12, 12, 8), m, x, 0.2, z, group); }
    for (const x of [7.3, 8.8, 10.3]) { const pts = []; for (let i = 0; i <= 12; i++) { const t = i / 12 * Math.PI; pts.push(new T.Vector3(x, Math.sin(t) * 1.7, 4.9 - Math.cos(t) * 1.5)); } add(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 24, 0.03, 6), mats.white, 0, 0, 0, group); } }
  // ---- ripple rings, blinking where drops land in the puddles ----
  const RINGS = 16, ripples = new T.InstancedMesh(flat(new T.RingGeometry(0.82, 1, 20)), new T.MeshBasicMaterial({ transparent: true, blending: T.AdditiveBlending, depthWrite: false }), RINGS), rm = new T.Matrix4(), rc = new T.Color();
  ripples.userData.dynamic = true; ripples.frustumCulled = false; ripples.castShadow = ripples.receiveShadow = false; group.add(ripples);
  function drip(time) {
    for (let i = 0; i < RINGS; i++) { const p = PUDDLES[i % PUDDLES.length], u = time / (1.7 + rnd(i, 5) * 1.6) + rnd(i, 6), n = Math.floor(u), t = u - n, s = 0.04 + 0.22 * t, w = Math.min(p[2], p[3]) * 1.2;
      rm.makeScale(s, 1, s).setPosition(p[0] + (rnd(i + n * 7.3, 7) - 0.5) * w, 0.03, p[1] + (rnd(i + n * 7.3, 8) - 0.5) * w); ripples.setMatrixAt(i, rm); ripples.setColorAt(i, rc.setScalar((1 - t) * (1 - t) * 0.5)); }
    ripples.instanceMatrix.needsUpdate = true; ripples.instanceColor.needsUpdate = true;
  }
  drip(0);
  // ---- far off: downtown, the bay with a ferry, and the mountain ----
  for (let i = 0; i < 22; i++) { const x = 2 + (i * 37 % 34), z = -52 + (i * 13 % 16), h = 6 + (i * 53 % 13), w = 2.2 + (i % 3) * 0.6; const b = box(group, mats.city, [x, 0, z], [x + w, h, z + w]); b.castShadow = false; }
  box(group, wet, [-24, -1.6, -60], [60, 0, -24]).castShadow = false; box(group, wet, [24, -1.6, -24], [60, 0, 16]).castShadow = false;
  { const m = cone(group, mats.city, 46, 0, 30, -100, 34, 28); m.castShadow = false; const cap = cone(group, mats.white, 46, 17, 30.2, -100, 15, 28); cap.castShadow = false; }
  box(group, mats.white, [-40, SEA, -12], [-34, SEA + 0.9, -9.4]).castShadow = false; box(group, mats.jungle, [-40, SEA + 0.25, -12.02], [-34, SEA + 0.45, -9.38]).castShadow = false; box(group, mats.white, [-38.5, SEA + 0.9, -11.4], [-35.5, SEA + 1.5, -10]).castShadow = false;
  // ---- rain ----
  const N = 900, rainPos = new Float32Array(N * 6), seeds = [];
  for (let i = 0; i < N; i++) seeds.push([-26 + rnd(i, 1) * 52, rnd(i, 2) * 19, -26 + rnd(i, 3) * 44, 9 + rnd(i, 4) * 5]);
  const rainGeo = new T.BufferGeometry(); rainGeo.setAttribute('position', new T.BufferAttribute(rainPos, 3));
  const rain = new T.LineSegments(rainGeo, new T.LineBasicMaterial({ color: '#e6eef3', transparent: true, opacity: 0.32, depthWrite: false })); rain.userData.dynamic = true; rain.frustumCulled = false; group.add(rain);

  for (const [id, n] of Object.entries(data.nodes)) if (n.pos) { const h = add(new T.BoxGeometry(1, 0.06, 1), ghost(), n.pos[0], n.pos[1] + 0.03, n.pos[2], group); h.castShadow = h.receiveShadow = false; h.userData.near = [id]; hits.push(h); }
  mergeStatic(group, new Set(hits));
  function fall(time) {
    for (let i = 0; i < N; i++) { const s = seeds[i], y = 19 - ((time * s[3] + s[1]) % 19), k = i * 6; rainPos[k] = s[0]; rainPos[k + 1] = y; rainPos[k + 2] = s[2]; rainPos[k + 3] = s[0] - 0.12; rainPos[k + 4] = y - 0.6; rainPos[k + 5] = s[2] - 0.05; }
    rainGeo.attributes.position.needsUpdate = true;
  }
  fall(0); // so the rain still hangs in the air for anyone who has asked for no motion
  const ease = k => k * k * (3 - 2 * k);
  function update(time, model, still, state, live) {
    const full = model.items.has('sluice') ? 0 : -1; raftY = still ? full : raftY + (full - raftY) * 0.02;
    if (live) car.position.copy(live('car')); raft.position.set(-12, raftY, -2); water.position.y = raftY - 0.2; if (!still && model.items.has('sluice')) sluiceWheel.rotation.z = time * 2;
    const won = model.won; mats.glow.emissiveIntensity = won ? 8 : 2.5; lit.emissiveIntensity = won ? 2.2 : 1.1;
    if (still) { lamp.emissiveIntensity = beaconMat.emissiveIntensity = won ? 8 : 2.5; glowMat.opacity = 1; return; }
    // The monorail: six seconds at the station, a slow glide out past the arches, a pause, and back.
    const p = time % 46; train.position.x = p < 6 ? STOP : p < 21 ? STOP + (FAR - STOP) * ease((p - 6) / 15) : p < 25 ? FAR : p < 40 ? FAR + (STOP - FAR) * ease((p - 25) / 15) : STOP;
    fall(time); drip(time); spray(time);
    // The lamps breathe, and the beacon on the spire comes round slowly, like a lighthouse seen from far off.
    const breath = 0.85 + Math.sin(time * 0.7) * 0.15; glowMat.opacity = breath; lamp.emissiveIntensity = (won ? 6 : 2.6) * breath; beaconMat.emissiveIntensity = won ? 8 : 0.8 + 7 * Math.pow(Math.max(0, Math.sin(time * 0.8)), 8);
    // The duck paddles round the fountain, bobbing; each umbrella sways, and every so often one is spun dry.
    const a = time * 0.22; duck.position.set(FX + Math.cos(a) * 1.05, 0.2 + Math.sin(time * 2.1) * 0.012, FZ + Math.sin(a) * 1.05); duck.rotation.set(Math.sin(time * 1.7) * 0.08, -a - Math.PI / 2, 0);
    for (let i = 0; i < brollies.length; i++) { const w = (time * 0.07 + i * 0.37) % 1, k = w < 0.07 ? 1 - w / 0.07 : 0; brollies[i].rotation.set(Math.sin(time * 0.9 + i * 2) * 0.05, k * k * 14, Math.sin(time * 0.7 + i) * 0.05 + k * Math.sin(time * 28) * 0.12); }
  }
  const frame = [[5.5, 0, 4.5], [8.5, 0, -5], [-14, 5.6, -6.6], [-15.8, 0, -1.4], [0, 15.6, 0], [4, 10, 0], [0, 10, 4], [-4, 10, 0], [2, 0, 8]];
  return { group, hits, mechs, update, frame, water: SEA, birds: { x: 0, z: 0, h: 13, color: '#30363b', count: 3 }, shadowSize: 30 };
}
