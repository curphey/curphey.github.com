import * as T from '../../tower/vendor/three.js';
import { letteringTexture, flagTexture } from '../render/textures.js';
import { createBoat } from '../boat.js';
// Brighton Palace Pier, modelled from two photographs: the cream Moorish pavilion with its flag towers and gold
// lettering; a long dark deck on iron piles; and a wide, chamfered pier head crowded with a shallow dome, striped
// tents, a helter-skelter, a yellow roller coaster and a blue log flume, over a turquoise sea and an orange
// shingle beach. The big wheel is this chapter's one liberty. Positions must agree with chapters/pier.mjs.
const SEA = -3;
export function createPierScene(kit, data) {
  const { mats, add, box, cyl, cone, windowAt, mergeStatic } = kit, group = new T.Group(), hits = [], mechs = {};
  const ghost = () => new T.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
  const away = data.id === 'departure'; // chapter 7: the pier mended, at sunset, with the yacht at its end
  const deck = (a, b, near) => { const m = box(group, mats.deck, a, b); if (near) { m.userData.near = near; hits.push(m); } return m; };
  const pile = (x, z, top = -0.25) => cyl(group, mats.iron, x, SEA - 1.2, top, z, 0.09, { seg: 10 });
  // White railing between any two points, with a post every unit.
  function rail(x0, z0, x1, z1, y = 0, h = 0.45, mat = mats.white) {
    const len = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(len));
    for (let i = 0; i <= n; i++) { const t = i / n; cyl(group, mat, x0 + (x1 - x0) * t, y, y + h, z0 + (z1 - z0) * t, 0.025, { seg: 6 }); }
    for (const yy of [h, h * 0.55]) { const b = add(new T.BoxGeometry(len, 0.02, 0.03), mat, (x0 + x1) / 2, y + yy - 0.01, (z0 + z1) / 2, group); b.rotation.y = -Math.atan2(z1 - z0, x1 - x0); }
  }
  function lever(x, y, z, mech, node) {
    cyl(group, mats.white, x, y, y + 0.12, z, 0.13, { seg: 16 }); const stick = cyl(group, mats.brass, x, y + 0.1, y + 0.62, z, 0.028, { seg: 10 }); stick.rotation.z = 0.28; stick.position.x += 0.07;
    add(new T.SphereGeometry(0.075, 16, 12), mats.red, x + 0.15, y + 0.64, z, group);
    const grab = add(new T.SphereGeometry(0.4, 12, 8), ghost(), x + 0.08, y + 0.4, z, group); grab.castShadow = grab.receiveShadow = false; grab.userData = { lever: mech, near: [node] }; hits.push(grab);
  }
  // A shallow ribbed dome on a drum, as on the pavilion and the pier head.
  function dome(x, y, z, r, { drum = 0.5, squash = 0.5, mat = mats.domeGrey, parent = group } = {}) {
    cyl(parent, mats.cream, x, y, y + drum, z, r, { seg: 40 }); cyl(parent, mats.white, x, y + drum, y + drum + 0.08, z, r + 0.06, { seg: 40 });
    const d = add(new T.SphereGeometry(r, 40, 16, 0, Math.PI * 2, 0, Math.PI / 2), mat, x, y + drum + 0.08, z, parent); d.scale.y = squash;
    for (let i = 0; i < 12; i++) { const rib = add(new T.TorusGeometry(r * 1.005, 0.025, 6, 20, Math.PI / 2), mats.white, x, y + drum + 0.08, z, parent); rib.rotation.y = i * Math.PI / 6; rib.scale.y = squash; }
    cyl(parent, mats.white, x, y + drum + r * squash, y + drum + r * squash + 0.3, z, r * 0.12, { seg: 12 }); cone(parent, mat, x, y + drum + r * squash + 0.3, y + drum + r * squash + 0.6, z, r * 0.16, 12);
  }
  const flagMat = new T.MeshStandardMaterial({ map: flagTexture(), side: T.DoubleSide, roughness: 0.8 }), flags = [];
  function flagpole(x, y, z, h = 1.6) { cyl(group, mats.white, x, y, y + h, z, 0.02, { seg: 6 }); const f = add(new T.PlaneGeometry(0.7, 0.35, 8, 1), flagMat, x + 0.36, y + h - 0.2, z, group); f.userData.dynamic = true; f.castShadow = false; flags.push(f); }
  // Striped tent roof: alternating sectors.
  function tent(parent, x, y0, y1, z, r, a = mats.red, b = mats.yellow, n = 16) {
    for (let i = 0; i < n; i++) { const m = add(new T.ConeGeometry(r, y1 - y0, 3, 1, false, i * Math.PI * 2 / n, Math.PI * 2 / n), i % 2 ? a : b, x, (y0 + y1) / 2, z, parent); }
  }

  // ---- decks and piles ----
  deck([-28, -0.25, -1.5], [-5.5, 0, 1.5], ['gate', 'kiosk']); deck([-0.5, -0.25, -1.5], [2, 0, 1.5]);
  if (away) { deck([-5.5, -0.25, -1.5], [-0.5, 0, 1.5], ['gate', 'plaza']); rail(-5.6, -1.45, -0.4, -1.45); rail(-5.6, 1.45, -0.4, 1.45); } deck([0.8, -0.25, 6], [5.6, 0, 6.7]);
  deck([-16.4, -0.25, -5], [-7.4, 0, -1.5]);
  // The pier head: wide, with its seaward corners cut off.
  const HEAD = [[2, -9.6], [16.4, -9.6], [19.6, -6.4], [19.6, 3], [16.6, 6], [2, 6]];
  { const s = new T.Shape(); HEAD.forEach(([x, z], i) => (i ? s.lineTo(x, -z) : s.moveTo(x, -z))); s.closePath();
    const g = new T.ExtrudeGeometry(s, { depth: 0.25, bevelEnabled: false }); g.rotateX(-Math.PI / 2); g.translate(0, -0.25, 0);
    const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 3, uv.getY(i) / 3);
    const m = add(g, mats.deck, 0, 0, 0, group); m.userData.near = away ? ['plaza', 'round', 'seaside', 'berth'] : ['plaza', 'wheelFoot', 'skelter', 'seaside']; hits.push(m); }
  HEAD.forEach(([x, z], i) => { const [nx, nz] = HEAD[(i + 1) % HEAD.length]; if (i === 5) { rail(2, 6, 2, 1.5); rail(2, -1.5, 2, -9.6); } else if (i === 4) rail(x, z, 5.6, 6); else rail(x, z, nx, nz); });
  const inHead = (x, z) => x >= 2 && x <= 19.6 && z >= -9.6 && z <= 6 && (x - 16.4) + (-6.4 - z) <= 3.3 && (x - 16.6) + (z - 3) <= 3.1;
  for (let x = -27; x <= 19; x += 2) {
    const zs = x > 2 ? [-9, -6.6, -4.2, -1.8, 0.6, 3, 5.4].filter(z => inHead(x, z)) : x > -0.6 || x < -5.4 ? [-1.25, 1.25] : [];
    for (const z of zs) pile(x, z); if (zs.length) box(group, mats.iron, [x - 0.07, -0.5, zs[0] - 0.2], [x + 0.07, -0.25, zs.at(-1) + 0.2]);
  }
  // The broken stretch: bare piles and two rusting girders where the planks have gone.
  for (const x of [-4.5, -2.5]) for (const z of [-1.25, 1.25]) pile(x, z, -0.3); for (const z of [-1.25, 1.25]) box(group, mats.iron, [-5.5, -0.42, z - 0.06], [-0.5, -0.3, z + 0.06]);
  for (const x of [-15.5, -12.5, -9.5]) for (const z of [-4.6, -2.8]) pile(x, z);
  rail(-27, -1.45, -16.4, -1.45); rail(-7.4, -1.45, -5.6, -1.45); rail(-27, 1.45, -5.6, 1.45); rail(-0.4, -1.45, 2, -1.45); rail(-0.4, 1.45, 0.8, 1.45); rail(0.8, 1.5, 0.8, 6.65); rail(0.8, 6.65, 5.6, 6.65);
  rail(-16.35, -4.95, -7.45, -4.95); rail(-16.35, -4.95, -16.35, -1.5); rail(-7.45, -4.95, -7.45, -1.5);
  // Fences that pen each part of the pier head, so the only way through is the carousel.
  if (!away) { rail(7.6, -6.6, 7.6, -3.3); rail(10.4, -6.6, 10.4, -3.3); rail(9, 3.5, 9, 5.95); }
  for (let x = -25; x <= -18; x += 3.3) { cyl(group, mats.white, x, 0, 1.7, -1.3, 0.035, { seg: 8 }); for (const dx of [-0.14, 0.14]) add(new T.SphereGeometry(0.1, 16, 12), mats.white, x + dx, 1.72, -1.3, group); add(new T.SphereGeometry(0.1, 16, 12), mats.white, x, 1.86, -1.3, group); }

  // ---- shore end: the clock arch ----
  for (const z of [-1.42, 1.42]) { box(group, mats.cream, [-21.3, 0, z - 0.16], [-20.7, 2.4, z + 0.16]); cone(group, mats.domeGrey, -21, 2.4, 2.9, z, 0.42, 4).rotation.y = Math.PI / 4; }
  box(group, mats.cream, [-21.2, 2.2, -1.42], [-20.8, 2.7, 1.42]); const cl = add(new T.CylinderGeometry(0.42, 0.42, 0.5, 32), mats.cream, -21, 3.05, 0, group); cl.rotation.z = Math.PI / 2;
  const dial = add(new T.CircleGeometry(0.34, 32), mats.iron, -20.74, 3.05, 0, group); dial.rotation.y = Math.PI / 2; dial.castShadow = false;
  // ---- the pavilion: cream Moorish front, two flag towers, gold lettering, a shallow dome behind ----
  box(group, mats.cream, [-13.2, 0, -4.7], [-7.8, 2.15, -2]); box(group, mats.white, [-13.3, 2.15, -4.8], [-7.7, 2.3, -1.9]);
  for (let x = -12.35; x <= -8.6; x += 0.75) { windowAt(group, 'z', x, 0.75, -2, 0.42, 1.2, true); const port = add(new T.CircleGeometry(0.13, 20), mats.iron, x, 1.82, -1.985, group); port.castShadow = false; }
  for (const z of [-4.1, -3.35, -2.6]) windowAt(group, 'x', -7.8, 0.85, z, 0.4, 1.2, true);
  for (const x of [-13.25, -7.75]) {
    box(group, mats.cream, [x - 0.4, 0, -2.45], [x + 0.4, 3.5, -1.65]); box(group, mats.white, [x - 0.46, 3.5, -2.51], [x + 0.46, 3.6, -1.59]);
    for (const y of [1.2, 2.5]) { const w = windowAt(group, 'z', x, y, -1.65, 0.22, 0.6, true); const w2 = windowAt(group, 'x', x + 0.4, y, -2.05, 0.22, 0.6, true); }
    const cap = cone(group, mats.domeGrey, x, 3.6, 4.15, -2.05, 0.82, 4); cap.rotation.y = Math.PI / 4; cyl(group, mats.cream, x, 4.1, 4.3, -2.05, 0.12, { seg: 8 }); flagpole(x, 4.3, -2.05);
  }
  dome(-10.5, 2.3, -3.75, 1.15, { drum: 0.2, squash: 0.5 });
  const signMat = new T.MeshStandardMaterial({ map: letteringTexture(['BRIGHTON', 'PALACE PIER']), transparent: true, alphaTest: 0.35, roughness: 0.5 }); signMat.emissiveMap = signMat.map; signMat.emissive = new T.Color('#ffffff'); signMat.emissiveIntensity = 0.25;
  const sign = add(new T.PlaneGeometry(4.4, 1.46), signMat, -10.5, 3.08, -1.88, group); sign.castShadow = false; sign.userData.dynamic = true;
  for (const x of [-12.2, -8.8]) cyl(group, mats.iron, x, 2.3, 2.5, -1.9, 0.03, { seg: 6 });
  // A little shell-and-gift kiosk with a scalloped roof.
  box(group, mats.cream, [-15.9, 0, -4.4], [-14.7, 1.2, -3.2]); const kr = cone(group, mats.flume, -15.3, 1.2, 2.15, -3.8, 1.1, 4); kr.rotation.y = Math.PI / 4; box(group, mats.red, [-15.95, 1.0, -3.2], [-14.65, 1.2, -3.14]);

  // ---- the carousel, under a red and yellow striped top ----
  const ringInlay = add(new T.RingGeometry(3.4, 3.55, 64), mats.brass, 9, 0.006, 0, group); ringInlay.rotation.x = -Math.PI / 2; ringInlay.castShadow = false;
  const car = new T.Group(); car.userData.dynamic = true; car.position.set(9, 0, 0); group.add(car);
  const floor = cyl(car, mats.red, 0, 0, 0.02, 0, 3.4, { seg: 64 }); floor.userData = { near: ['step0', 'step2'], mech: 'carousel' }; hits.push(floor);
  cyl(car, mats.cream, 0, 0.02, 0.035, 0, 2.6, { seg: 64 }); cyl(car, mats.yellow, 0, 0.02, 0.2, 0, 0.5, { seg: 24 }); cyl(car, mats.brass, 0, 0.2, 3.1, 0, 0.26, { seg: 16 });
  tent(car, 0, 2.75, 3.95, 0, 2.1); const scallop = add(new T.TorusGeometry(2.08, 0.07, 8, 48), mats.yellow, 0, 2.75, 0, car); scallop.rotation.x = Math.PI / 2;
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6, s = add(new T.SphereGeometry(0.06, 8, 6), mats.glow, Math.cos(a) * 2.1, 2.68, Math.sin(a) * 2.1, car); s.castShadow = false; }
  add(new T.SphereGeometry(0.13, 16, 12), mats.brass, 0, 4.05, 0, car);
  const horses = [];
  for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + 0.5, h = new T.Group(); h.position.set(Math.cos(a) * 1.45, 0.7, Math.sin(a) * 1.45); h.rotation.y = -a + Math.PI; car.add(h);
    const m = [mats.white, mats.yellow, mats.blue][i % 3]; box(h, m, [-0.1, 0, -0.3], [0.1, 0.24, 0.3]); box(h, m, [-0.07, 0.2, 0.2], [0.07, 0.52, 0.34]); box(h, m, [-0.06, 0.4, 0.3], [0.06, 0.52, 0.5]);
    for (const z of [-0.22, 0.22]) box(h, m, [-0.08, -0.3, z - 0.04], [0.08, 0, z + 0.04]); cyl(h, mats.brass, 0, -0.7, 2.1, 0, 0.022, { seg: 6 }); horses.push(h); }
  // Two boarding steps, opposite each other: one marked in gold, one in silver.
  for (const [x, m] of [[3, mats.brass], [-3, mats.lead]]) {
    const ring = add(new T.TorusGeometry(0.34, 0.03, 8, 32), m, x, 0.03, 0, car); ring.rotation.x = Math.PI / 2; ring.castShadow = false;
    const pad = cyl(car, m, x, 0.02, 0.03, 0, 0.3, { seg: 24 }); pad.castShadow = false;
    for (const z of [-0.5, 0.5]) { cyl(car, m, x * 1.085, 0.02, 0.5, z, 0.03, { seg: 8 }); add(new T.SphereGeometry(0.06, 10, 8), m, x * 1.085, 0.53, z, car); }
  }
  mechs.carousel = { group: car, hub: new T.Vector3(9, 0, 0) };
  if (!away) lever(9.5, 0, -3.7, 'carousel', 'skelter');

  // ---- the big wheel, in ride yellow: its gondola floors trace a circle round the hub in the data ----
  const HANG = 1.45, hub = data.mechs.wheel.hub, R = data.mechs.wheel.length;
  for (const x of [1.2, 4.8]) { const leg = box(group, mats.yellow, [-0.07, 0, -0.07], [0.07, Math.hypot(hub[0] - x, hub[1] + HANG), 0.07]); leg.position.set((x + hub[0]) / 2, (hub[1] + HANG) / 2, 4.35); leg.rotation.z = Math.atan2(x - hub[0], hub[1] + HANG); }
  const axle = add(new T.CylinderGeometry(0.1, 0.1, 0.9, 12), mats.iron, hub[0], hub[1] + HANG, 4.7, group); axle.rotation.x = Math.PI / 2;
  const wheel = new T.Group(); wheel.userData.dynamic = true; wheel.position.set(hub[0], hub[1] + HANG, hub[2]); group.add(wheel);
  for (const z of [-0.12, 0.12]) { add(new T.TorusGeometry(R, 0.045, 8, 72), mats.yellow, 0, 0, z, wheel); add(new T.TorusGeometry(R * 0.55, 0.03, 8, 48), mats.yellow, 0, 0, z, wheel); }
  for (let i = 0; i < 8; i++) { const s = box(wheel, i % 2 ? mats.red : mats.yellow, [0, -0.025, -0.025], [R, 0.025, 0.025]); s.position.set(Math.cos(i * Math.PI / 4) * R / 2, Math.sin(i * Math.PI / 4) * R / 2, 0); s.rotation.z = i * Math.PI / 4; }
  const hubCap = add(new T.CylinderGeometry(0.32, 0.32, 0.34, 24), mats.red, 0, 0, 0, wheel); hubCap.rotation.x = Math.PI / 2;
  for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, b = add(new T.SphereGeometry(0.055, 8, 6), mats.glow, Math.cos(a) * R, Math.sin(a) * R, 0.16, wheel); b.castShadow = false; }
  const gondolas = [], carColours = [mats.red, mats.blue, mats.yellow, mats.white];
  for (let k = 0; k < 4; k++) {
    const g = new T.Group(), a = -k * Math.PI / 2; g.position.set(Math.cos(a) * R, Math.sin(a) * R, 0); wheel.add(g); gondolas.push(g);
    const f = box(g, mats.deck, [-0.5, -HANG - 0.25, -0.5], [0.5, -HANG, 0.5]); f.userData.near = [`car${k}`]; hits.push(f);
    for (const x of [-0.46, 0.46]) cyl(g, mats.white, x, -HANG, 0, -0.46, 0.02, { seg: 6 });
    box(g, mats.white, [-0.48, -0.03, -0.48], [0.48, 0, -0.44]); box(g, carColours[k], [-0.5, -HANG, -0.5], [0.5, -HANG + 0.32, -0.46]); cyl(g, carColours[k], 0, 0.02, 0.1, -0.2, 0.34, { seg: 20 });
  }
  mechs.wheel = { group: wheel, hub: new T.Vector3(hub[0], hub[1] + HANG, hub[2]) };
  deck([2.5, 1.75, 3.5], [3.5, 2, 4.5], ['wheelBase']); for (const [x, z] of [[2.55, 3.55], [3.45, 3.55], [2.55, 4.45], [3.45, 4.45]]) cyl(group, mats.white, x, 0, 1.75, z, 0.04, { seg: 8 });
  for (let i = 0; i < 6; i++) { const z0 = 3.5 - (i + 1) * 0.25, m = box(group, mats.deck, [2.5, 0, z0], [3.5, 2 - (i + 1) * 0.3, z0 + 0.25]); m.userData.near = ['wheelBase', 'wheelFoot']; hits.push(m); }
  // The lookout: a crow's nest beside the wheel, level with its three o'clock gondola. The key hangs here.
  cyl(group, mats.yellow, 7, 0, 4.75, 5, 0.07, { seg: 10 }); deck([6.5, 4.75, 4.5], [7.5, 5, 5.5], ['lookout']); for (const [x, z] of [[7.45, 4.55], [7.45, 5.45], [6.55, 4.55]]) cyl(group, mats.white, x, 5, 5.45, z, 0.02, { seg: 6 });
  box(group, mats.white, [7.43, 5.43, 4.55], [7.47, 5.45, 5.45]); cyl(group, mats.brass, 7.3, 5, 6.4, 4.7, 0.02, { seg: 6 }); box(group, mats.red, [7.3, 6.1, 4.69], [7.75, 6.4, 4.71]);
  const key = new T.Group(); key.userData.dynamic = true; key.position.set(7.2, 5.75, 5.2); group.add(key);
  add(new T.TorusGeometry(0.07, 0.018, 8, 24), mats.brass, 0, 0.07, 0, key); add(new T.BoxGeometry(0.03, 0.2, 0.02), mats.brass, 0, -0.1, 0, key); add(new T.BoxGeometry(0.08, 0.03, 0.02), mats.brass, 0.04, -0.17, 0, key);

  // ---- the helter-skelter ----
  const slideRoute = [];
  for (let i = 0; i < 9; i++) { const y0 = i * 0.62, r0 = 1.05 - i * 0.055; cyl(group, i % 2 ? mats.red : mats.white, 9, y0, y0 + 0.62, -5.25, r0, { rTop: r0 - 0.055, seg: 32 }); }
  cyl(group, mats.white, 9, 5.58, 5.72, -5.25, 0.85, { seg: 32 }); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; cyl(group, mats.white, 9 + Math.cos(a) * 0.8, 5.72, 6.1, -5.25 + Math.sin(a) * 0.8, 0.02, { seg: 6 }); }
  cyl(group, mats.white, 9, 5.72, 6.5, -5.25, 0.42, { seg: 16 }); cone(group, mats.red, 9, 6.5, 7.5, -5.25, 0.62, 24); flagpole(9, 7.4, -5.25, 1.1);
  { const pts = []; for (let i = 0; i <= 60; i++) { const t = i / 60, a = t * Math.PI * 5 + Math.PI / 2, r = 1.28 - t * 0.5; pts.push(new T.Vector3(9 + Math.cos(a) * r, 0.25 + t * 5.3, -5.25 + Math.sin(a) * r)); }
    const slide = add(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 160, 0.13, 8), mats.yellow, 0, 0, 0, group); slide.userData.dynamic = true;
    // The way down: round the gallery to the head of the slide, then all the way round and down it.
    slideRoute.push(new T.Vector3(9.8, 5.72, -4.9), new T.Vector3(9.75, 5.72, -5.8), ...pts.slice().reverse().filter((_, i) => i % 2 === 0).map(p => p.clone().setY(p.y + 0.02))); }
  box(group, mats.blue, [8.6, 0, -4.5], [9.4, 0.03, -3.6]); deck([8.5, 5.47, -4.9], [9.5, 5.72, -3.9], ['skelterTop']);
  windowAt(group, 'z', 9, 0.6, -4.2, 0.4, 0.9, true).traverse(o => { if (o.isMesh && o.material === mats.glass) o.material = mats.iron; });
  // Brass plates, and the barrier and gate they hold open.
  const plates = {}; for (const [id, p] of away ? [] : [['skelterTop', [9, 5.72, -4.4]], ['seaside', [13, 0, 0]]]) { const m = add(new T.CylinderGeometry(0.36, 0.36, 0.05, 32), mats.brass, p[0], p[1] + 0.03, p[2], group); m.userData.dynamic = true; m.castShadow = false; plates[id] = { mesh: m, y: p[1] + 0.03, t: 0 }; }
  const pole = (len, parent) => { for (let i = 0; i < 5; i++) { const m = add(new T.CylinderGeometry(0.035, 0.035, len / 5, 8), i % 2 ? mats.white : mats.red, 0, 0, 0, parent); m.rotation.x = Math.PI / 2; m.position.z = -(i + 0.5) * len / 5; } };
  const barrier = new T.Group(); barrier.userData.dynamic = true; barrier.position.set(-5.62, 0.55, 1.32); group.add(barrier); pole(2.6, barrier); barrier.visible = !away;
  const wicket = new T.Group(); wicket.userData.dynamic = true; wicket.position.set(2.56, 2.5, 3.46); wicket.rotation.y = -Math.PI / 2; group.add(wicket); pole(0.9, wicket); wicket.visible = !away;
  // Disco Volante at the end of the pier, with a gangway down to her deck.
  let boat = null;
  if (away) { boat = createBoat({ scale: 0.75 }); boat.group.userData.dynamic = true; group.add(boat.group); boat.setLanterns(3); boat.face(1, 0); hits.push(boat.tap);
    // Her whole deck is the way aboard.
    const deckTap = add(new T.BoxGeometry(2.4, 0.7, 3.6), ghost(), 0, boat.deck + 0.2, 0, boat.group); deckTap.castShadow = deckTap.receiveShadow = false; deckTap.userData.near = ['aboard']; hits.push(deckTap);
    const gw = add(new T.BoxGeometry(2.9, 0.08, 0.7), mats.deck, 20.4, -1.2, 0, group); gw.rotation.z = -1.0; gw.userData.near = ['berth', 'aboard']; hits.push(gw); }

  // ---- the rest of the pier head, as in the aerial photograph ----
  // The great shallow dome, and the red-and-white striped dodgems behind the helter-skelter.
  dome(4.9, 0, -6.6, 2.55, { drum: 1.15, squash: 0.42 }); for (let i = 0; i < 14; i++) { const a = i * Math.PI / 7 + 0.2; const p = add(new T.CircleGeometry(0.16, 16), mats.iron, 4.9 + Math.cos(a) * 2.56, 0.62, -6.6 + Math.sin(a) * 2.56, group); p.rotation.y = Math.PI / 2 - a; p.castShadow = false; }
  box(group, mats.white, [7.55, 0, -9.4], [13.9, 1.25, -6.75]); for (let i = 0; i < 9; i++) box(group, i % 2 ? mats.white : mats.red, [7.5 + i * 0.72, 1.25, -9.45], [7.5 + (i + 1) * 0.72, 1.4, -6.7]); box(group, mats.iron, [7.9, 0.2, -6.74], [13.5, 1.0, -6.73]);
  // The yellow roller coaster at the seaward end, kept to the far side so it never hides a traveller.
  { const pts = [], n = 44; for (let i = 0; i < n; i++) { const t = i / n * Math.PI * 2; pts.push(new T.Vector3(16.6 + Math.cos(t) * 2.3 + Math.cos(t * 3) * 0.35, 1.9 + Math.sin(t * 2) * 1.1 + Math.cos(t * 3) * 0.5, -5.4 + Math.sin(t) * 3.1 + Math.sin(t * 2) * 0.5)); }
    const curve = new T.CatmullRomCurve3(pts, true);
    for (const off of [-0.09, 0.09]) { const tr = add(new T.TubeGeometry(curve, 260, 0.035, 6, true), mats.yellow, off, 0, off, group); tr.userData.dynamic = true; }
    for (let i = 0; i < 30; i++) { const p = curve.getPointAt(i / 30); cyl(group, mats.yellow, p.x, 0, p.y, p.z, 0.03, { seg: 6 }); if (i % 2) { const q = curve.getPointAt(((i + 1) % 30) / 30); const b = add(new T.BoxGeometry(p.distanceTo(new T.Vector3(q.x, p.y, q.z)), 0.03, 0.03), mats.yellow, (p.x + q.x) / 2, Math.min(p.y, q.y) * 0.5, (p.z + q.z) / 2, group); b.rotation.y = -Math.atan2(q.z - p.z, q.x - p.x); } }
    for (const [dx, dz] of [[0, 0], [0.5, 0.2]]) { const c = curve.getPointAt(0.12); box(group, mats.red, [c.x + dx - 0.2, c.y + 0.03, c.z + dz - 0.14], [c.x + dx + 0.2, c.y + 0.25, c.z + dz + 0.14]); } }
  // The log flume: a low blue trough looping round the south-east corner.
  { const pts = [[15.2, 1.2], [18.6, 1.2], [18.9, 3.4], [16.6, 5.2], [14.6, 4.9], [14.4, 2.6]].map(([x, z], i) => new T.Vector3(x, 0.32 + (i === 1 ? 0.5 : 0), z)), curve = new T.CatmullRomCurve3(pts, true);
    const tr = add(new T.TubeGeometry(curve, 120, 0.3, 10, true), mats.flume, 0, 0, 0, group); tr.scale.y = 0.6; tr.userData.dynamic = true; tr.castShadow = false;
    for (let i = 0; i < 12; i++) { const p = curve.getPointAt(i / 12); cyl(group, mats.white, p.x, 0, 0.2, p.z, 0.04, { seg: 6 }); } box(group, mats.trunk, [16.3, 0.3, 2.9], [16.9, 0.55, 3.3]); }
  // Small striped stalls and deckchairs on the landward side.
  tent(group, 3.4, 1.0, 1.7, -2.6, 0.9, mats.red, mats.white, 12); cyl(group, mats.white, 3.4, 0, 1.0, -2.6, 0.75, { seg: 24 });
  for (const [x, z, m] of [[4.4, 2.6, mats.red], [5.1, 3.1, mats.blue], [12, 3.9, mats.yellow]]) { const c = box(group, m, [x - 0.2, 0.12, z - 0.25], [x + 0.2, 0.16, z + 0.25]); c.rotation.z = 0.5; box(group, mats.white, [x - 0.22, 0, z - 0.27], [x - 0.18, 0.3, z + 0.27]); }
  { const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d'); g.font = '600 92px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(40,28,18,.75)'; g.fillText('MM', 128, 68);
    const m = add(new T.PlaneGeometry(0.9, 0.45), new T.MeshBasicMaterial({ map: new T.CanvasTexture(c), transparent: true, depthWrite: false }), 5, 0.004, 0.85, group); m.rotation.x = -Math.PI / 2; m.castShadow = false; m.userData.dynamic = true; }

  // ---- beach, promenade and seafront, and the old pier's skeleton far off ----
  { const g = new T.BufferGeometry(), x0 = -17, x1 = -28.2, zz = 130;
    g.setAttribute('position', new T.Float32BufferAttribute([x0, SEA - 0.4, -zz, x1, -0.5, zz, x0, SEA - 0.4, zz, x0, SEA - 0.4, -zz, x1, -0.5, -zz, x1, -0.5, zz], 3));
    g.setAttribute('uv', new T.Float32BufferAttribute([0, 0, 210, 9, 210, 0, 0, 0, 0, 9, 210, 9], 2)); g.computeVertexNormals();
    const beach = add(g, mats.shingle, 0, 0, 0, group); beach.castShadow = false; beach.userData.dynamic = true; }
  
  box(group, mats.stone, [-80, SEA - 1, -130], [-28, 0, 130]).castShadow = false; rail(-28.1, -130, -28.1, -1.5, 0, 0.5, mats.flume); rail(-28.1, 1.5, -28.1, 130, 0, 0.5, mats.flume);
  for (let z = -120, i = 0; z < 120; z += 6.4, i++) { const h = 4.2 + (i * 7 % 4) * 0.7, m = i % 3 === 1 ? mats.white : mats.cream; box(group, m, [-45, 0, z], [-38, h, z + 6.2]); box(group, mats.slate, [-45.1, h, z - 0.05], [-37.9, h + 0.3, z + 6.25]); for (let y = 1; y < h - 0.6; y += 1.3) box(group, mats.glass, [-37.99, y - 0.4, z + 0.5], [-37.96, y + 0.4, z + 5.7]); }
  box(group, mats.iron, [-37.5, 0.005, -130], [-32, 0.02, 130]).castShadow = false;
  for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) { const x = -30 + i * 2, z = -62 + j * 2.2; cyl(group, mats.iron, x, SEA - 1, 1.6, z, 0.07, { seg: 6 }); if (j < 2) box(group, mats.iron, [x - 0.04, 1.5, z], [x + 0.04, 1.6, z + 2.2]); if (i < 5) box(group, mats.iron, [x, 1.5, z - 0.04], [x + 2, 1.6, z + 0.04]); }

  for (const [id, n] of Object.entries(data.nodes)) if (n.pos) { const h = add(new T.BoxGeometry(1, 0.06, 1), ghost(), n.pos[0], n.pos[1] + 0.03, n.pos[2], group); h.castShadow = h.receiveShadow = false; h.userData.near = [id]; hits.push(h); }
  mergeStatic(group, new Set(hits));
  function update(time, model, still, state, live) {
    const spin = state?.wheel.angle ?? 0; for (const g of gondolas) g.rotation.z = -spin;
    if (!still) { horses.forEach((h, i) => { h.position.y = 0.7 + Math.sin(time * 2.2 + i * 1.7) * 0.16; });
      for (const f of flags) { const p = f.geometry.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(time * 5 + p.getX(i) * 7) * 0.05 * (p.getX(i) + 0.35)); p.needsUpdate = true; } key.rotation.y = time * 1.4; }
    key.visible = !away && !model.items.has('key');
    for (const [id, p] of Object.entries(plates)) { const want = model.pressed(id) ? 1 : 0; p.t = still ? want : p.t + (want - p.t) * 0.12; p.mesh.position.y = p.y - p.t * 0.035; }
    if (!away) { barrier.rotation.x = plates.skelterTop.t * Math.PI / 2 * 0.95; wicket.rotation.x = plates.seaside.t * Math.PI / 2 * 0.95; }
    mats.glow.emissiveIntensity = away ? 5 : model.won ? 5 : 0.6; signMat.emissiveIntensity = away ? 1.3 : model.won ? 1.2 : 0.25;
    if (boat && live) { const p = live('aboard'); if (model.won) boat.face(p.x - boat.group.position.x, p.z - boat.group.position.z); boat.group.position.set(p.x, p.y - boat.deck, p.z); boat.update(0.016, time, model.won, still); }
  }
  const frame = [...(away ? [[24.5, 0, 0]] : []), [-22, 0, 1.5], [-13.5, 6, -2], [9, 8.6, -5.25], [16.4, 0, -9.6], [19.6, 0, 3], [7.6, 6.5, 5], [3, 9.6, 5], [-0.6, 6.4, 5], [2, SEA, 6.7], [16.6, SEA, 6]];
  return { group, hits, mechs, update, frame, blackFlag: () => boat?.blackFlag(), flagPoint: () => boat?.tap.getWorldPosition(new T.Vector3()), routes: { 'skelterTop>skelter': slideRoute }, water: SEA, birds: away ? { x: -4, z: -6, h: 7.5, color: '#1f2428', count: 34 } : { x: 8, z: -3, h: 9.5, color: '#f4f4f0' }, shadowSize: 38 };
}
