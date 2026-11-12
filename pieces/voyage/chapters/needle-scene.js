import * as T from '../../tower/vendor/three.js';
// Seattle in the rain, modelled from two photographs of the Space Needle: three pairs of white legs pinching to
// an hourglass waist, the rust-orange lift core, the saucer with its halo and white roof, and the spire. Around
// it: the white arches of the Science Center standing in their pool, the monorail, evergreens, the downtown
// skyline and Mount Rainier. Heights are compressed. Positions must agree with chapters/needle.mjs.
const SEA = -1.6;
export function createNeedleScene(kit, data) {
  const { mats, add, box, cyl, cone, mergeStatic } = kit, group = new T.Group(), hits = [], mechs = {};
  const ghost = () => new T.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
  const wet = mats.walk.clone(); wet.color.set('#8d9398'); wet.roughness = 0.22; wet.metalness = 0.3; wet.envMapIntensity = 1.4;
  const rust = new T.MeshStandardMaterial({ color: '#a4582a', roughness: 0.7, metalness: 0.3 }), gold = new T.MeshStandardMaterial({ color: '#d9b25c', roughness: 0.35, metalness: 0.8 });
  const pond = new T.MeshStandardMaterial({ color: '#5f7c86', roughness: 0.05, metalness: 0.7, envMapIntensity: 1.6 });
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
  cyl(group, mats.glass, 0, 0, 0.55, 0, 1.5, { seg: 40 }); cyl(group, mats.white, 0, 0.55, 0.68, 0, 1.7, { seg: 40 });
  { const t = box(group, mats.walk, [1.5, -0.02, -0.5], [2.5, 0.004, 0.5]); t.userData.near = ['lobby']; hits.push(t); t.castShadow = false; }
  // The lift: a gold car on the outside of the core.
  const car = new T.Group(); car.userData.dynamic = true; group.add(car);
  { const f = box(car, gold, [-0.45, -0.25, -0.45], [0.45, 0.004, 0.45]); f.userData.near = ['car']; hits.push(f); for (const [x, z] of [[-0.42, -0.42], [-0.42, 0.42]]) cyl(car, gold, x, 0, 1.25, z, 0.025, { seg: 6 }); box(car, gold, [-0.45, 1.25, -0.45], [-0.2, 1.3, 0.45]); box(car, mats.glass, [-0.46, 0.1, -0.43], [-0.44, 1.2, 0.43]); }
  box(group, mats.iron, [0.52, 0, -0.06], [0.58, 9.6, 0.06]); mechs.lift = { group: car, hub: new T.Vector3(1, 5, 0) };
  // The saucer: a turning deck, its underside, the halo, and the white roof on slim columns, with the spire above.
  const saucer = new T.Group(); saucer.userData.dynamic = true; group.add(saucer);
  { const deck = cyl(saucer, mats.walk, 0, 9.75, 10, 0, 3.5, { seg: 64 }); deck.userData = { near: ['rim', 'crown'], mech: 'saucer' }; hits.push(deck);
    cyl(saucer, mats.white, 0, 8.9, 9.75, 0, 1.3, { rTop: 3.45, seg: 48 }); for (let i = 0; i < 24; i++) { const a = i * Math.PI / 12, rib = add(new T.BoxGeometry(2.2, 0.05, 0.05), mats.white, Math.cos(a) * 2.35, 9.32, Math.sin(a) * 2.35, saucer); rib.rotation.set(0, -a, 0.37, 'YXZ'); }
    const halo = add(new T.TorusGeometry(3.95, 0.06, 8, 80), gold, 0, 9.62, 0, saucer); halo.rotation.x = Math.PI / 2; for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6 + 0.26, s = add(new T.BoxGeometry(0.5, 0.03, 0.03), gold, Math.cos(a) * 3.72, 9.66, Math.sin(a) * 3.72, saucer); s.rotation.y = -a; }
    cyl(saucer, mats.glass, 0, 9.3, 9.72, 0, 3.0, { rTop: 3.3, seg: 48 });
    const mark = add(new T.TorusGeometry(0.36, 0.03, 8, 32), mats.brass, 3, 10.012, 0, saucer); mark.rotation.x = Math.PI / 2; mark.castShadow = false;
    for (let i = 0; i < 4; i++) { const a = Math.PI / 4 + i * Math.PI / 2; cyl(saucer, mats.white, Math.cos(a) * 1.25, 10, 12.1, Math.sin(a) * 1.25, 0.05, { seg: 8 }); }
    cyl(saucer, mats.white, 0, 12.1, 12.55, 0, 1.75, { rTop: 0.85, seg: 48 }); cyl(saucer, mats.white, 0, 12.55, 12.8, 0, 0.85, { rTop: 1.0, seg: 48 }); cyl(saucer, mats.iron, 0, 12.8, 13.1, 0, 0.7, { seg: 32 });
    cyl(saucer, gold, 0, 13.1, 15.4, 0, 0.09, { rTop: 0.03, seg: 8 }); for (const y of [13.6, 14.2]) cyl(saucer, gold, 0, y, y + 0.04, 0, 0.16, { seg: 8 }); const beacon = add(new T.SphereGeometry(0.09, 12, 10), mats.glow, 0, 15.45, 0, saucer); beacon.castShadow = false;
    const knob = add(new T.SphereGeometry(0.4, 12, 8), ghost(), -3, 10.4, 0, saucer); knob.castShadow = knob.receiveShadow = false; knob.userData = { mech: 'saucer', handle: true }; hits.push(knob); cyl(saucer, mats.brass, -3, 10, 10.5, 0, 0.03, { seg: 8 }); add(new T.SphereGeometry(0.08, 12, 10), mats.brass, -3, 10.55, 0, saucer); }
  mechs.saucer = { group: saucer, hub: new T.Vector3(0, 10, 0) };
  // The kiosk that works the lift, and the two levers on the mid ring.
  box(group, mats.glass, [3.1, 0, -1.7], [4.0, 1.1, -1.3]); box(group, mats.white, [3.0, 1.1, -1.8], [4.1, 1.2, -1.2]); lever(2.5, 0, 0.75, 'lift', 'lobby', gold);
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
  const train = new T.Group(); train.userData.dynamic = true; train.position.set(-6, 2.6, -13); group.add(train); box(train, mats.white, [-2.2, 0, -0.42], [2.2, 0.75, 0.42]); box(train, mats.red, [-2.2, 0.08, -0.44], [2.2, 0.22, 0.44]); box(train, mats.glass, [-2.0, 0.34, -0.44], [2.0, 0.62, 0.44]);
  for (const [x, z, s] of [[10.5, 9, 1.5], [14, 11.5, 1.8], [18, 9.5, 1.6], [20, 13, 2.0], [-9, 8, 1.6], [-13, 10.5, 1.9], [-17, 8, 1.7], [-20, 12, 2.1], [14, -15, 1.9], [18, -12.5, 1.6], [21, -17, 2.2], [-15, -12, 1.8], [-19, -15, 2.1], [-16.5, -19, 1.7], [-21, -5, 1.9], [-14.5, 3.5, 1.4], [16.5, 3, 1.3]]) fir(x, z, s);
  // ---- life on the plaza: paving rings, puddles, cafe umbrellas, lamps and a garden of blown glass ----
  for (const [r0, r1, m] of [[4.6, 4.9, mats.walk], [6.6, 6.8, gold], [8.6, 9.0, mats.walk]]) { const ring = add(new T.RingGeometry(r0, r1, 96), m, 0, 0.012, 0, group); ring.rotation.x = -Math.PI / 2; ring.castShadow = false; }
  for (const [x, z, r] of [[5.5, 2.2, 0.9], [7.2, -1.5, 0.6], [3.2, 6.4, 1.1], [-1.5, 6.8, 0.7], [-5.5, 2.5, 1.0], [6.2, 5.6, 0.5], [9.5, 2.6, 0.8], [1.0, -6.5, 0.9], [-3.5, -4.2, 0.6], [-6.8, 5.6, 0.7]]) { const p = add(new T.CircleGeometry(r, 28), pond, x, 0.009, z, group); p.rotation.x = -Math.PI / 2; p.scale.y = 0.7; p.castShadow = false; }
  for (const [x, z, m] of [[6.4, 3.6, mats.red], [7.6, 4.6, mats.yellow], [5.4, 5.0, mats.teal], [8.0, 0.6, mats.orange], [-2.6, 7.4, mats.blue]]) { cyl(group, mats.white, x, 0, 0.45, z, 0.32, { seg: 16 }); cyl(group, mats.iron, x, 0.45, 1.5, z, 0.025, { seg: 6 }); cone(group, m, x, 1.3, 1.75, z, 0.85, 10); }
  for (const [x, z] of [[4.4, 4.4], [8.4, -3.2], [-2.2, 4.6], [1.2, 8.2], [-6.4, 0.8], [10.6, 5.6]]) { cyl(group, mats.iron, x, 0, 2.2, z, 0.035, { seg: 6 }); const bulb = add(new T.SphereGeometry(0.13, 12, 10), mats.glow, x, 2.3, z, group); bulb.castShadow = false; }
  { const glassMat = c => new T.MeshStandardMaterial({ color: c, roughness: 0.08, metalness: 0.2, emissive: c, emissiveIntensity: 0.35 });
    const cols = ['#e2452f', '#f08a2f', '#f2c744', '#d63a7a', '#3f8fd0'].map(glassMat);
    for (let i = 0; i < 26; i++) { const a = i * 2.4, r = 0.3 + (i * 0.37 % 1) * 1.5, h = 0.9 + (i * 0.61 % 1) * 1.6, s = cone(group, cols[i % 5], -5.2 + Math.cos(a) * r, 0, h, 6.6 + Math.sin(a) * r * 0.8, 0.07, 6); s.rotation.set(Math.cos(a) * 0.3, 0, Math.sin(a) * 0.3); }
    const globe = add(new T.SphereGeometry(0.42, 20, 14), cols[2], -5.2, 0.42, 6.6, group); }

  // ---- far off: downtown, the bay with a ferry, and the mountain ----
  for (let i = 0; i < 22; i++) { const x = 2 + (i * 37 % 34), z = -52 + (i * 13 % 16), h = 6 + (i * 53 % 13), w = 2.2 + (i % 3) * 0.6; const b = box(group, mats.city, [x, 0, z], [x + w, h, z + w]); b.castShadow = false; }
  box(group, wet, [-24, -1.6, -60], [60, 0, -24]).castShadow = false; box(group, wet, [24, -1.6, -24], [60, 0, 16]).castShadow = false;
  { const m = cone(group, mats.city, 46, 0, 30, -100, 34, 28); m.castShadow = false; const cap = cone(group, mats.white, 46, 17, 30.2, -100, 15, 28); cap.castShadow = false; }
  box(group, mats.white, [-40, SEA, -12], [-34, SEA + 0.9, -9.4]).castShadow = false; box(group, mats.jungle, [-40, SEA + 0.25, -12.02], [-34, SEA + 0.45, -9.38]).castShadow = false; box(group, mats.white, [-38.5, SEA + 0.9, -11.4], [-35.5, SEA + 1.5, -10]).castShadow = false;
  // ---- rain ----
  const N = 900, rainPos = new Float32Array(N * 6), seeds = []; const rnd = (i, s) => { const n = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return n - Math.floor(n); };
  for (let i = 0; i < N; i++) seeds.push([-26 + rnd(i, 1) * 52, rnd(i, 2) * 19, -26 + rnd(i, 3) * 44, 9 + rnd(i, 4) * 5]);
  const rainGeo = new T.BufferGeometry(); rainGeo.setAttribute('position', new T.BufferAttribute(rainPos, 3));
  const rain = new T.LineSegments(rainGeo, new T.LineBasicMaterial({ color: '#e6eef3', transparent: true, opacity: 0.32, depthWrite: false })); rain.userData.dynamic = true; rain.frustumCulled = false; group.add(rain);

  for (const [id, n] of Object.entries(data.nodes)) if (n.pos) { const h = add(new T.BoxGeometry(1, 0.06, 1), ghost(), n.pos[0], n.pos[1] + 0.03, n.pos[2], group); h.castShadow = h.receiveShadow = false; h.userData.near = [id]; hits.push(h); }
  mergeStatic(group, new Set(hits));
  function update(time, model, still, state, live) {
    const full = model.items.has('sluice') ? 0 : -1; raftY = still ? full : raftY + (full - raftY) * 0.02;
    if (live) car.position.copy(live('car')); raft.position.set(-12, raftY, -2); water.position.y = raftY - 0.2; if (!still && model.items.has('sluice')) sluiceWheel.rotation.z = time * 2;
    if (!still) { train.position.x = -6 + Math.sin(time * 0.12) * 14;
      for (let i = 0; i < N; i++) { const s = seeds[i], y = 19 - ((time * s[3] + s[1]) % 19), k = i * 6; rainPos[k] = s[0]; rainPos[k + 1] = y; rainPos[k + 2] = s[2]; rainPos[k + 3] = s[0] - 0.12; rainPos[k + 4] = y - 0.6; rainPos[k + 5] = s[2] - 0.05; }
      rainGeo.attributes.position.needsUpdate = true; }
    mats.glow.emissiveIntensity = model.won ? 8 : 2.5;
  }
  const frame = [[5.5, 0, 4.5], [8.5, 0, -5], [-14, 5.6, -6.6], [-15.8, 0, -1.4], [0, 15.6, 0], [4, 10, 0], [0, 10, 4], [-4, 10, 0], [2, 0, 8]];
  return { group, hits, mechs, update, frame, water: SEA, birds: { x: 0, z: 0, h: 13, color: '#30363b', count: 3 }, shadowSize: 30 };
}
