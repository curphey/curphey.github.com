import * as T from '../../tower/vendor/three.js';
import { letteringTexture, flagTexture } from '../render/textures.js';
import { createBoat } from '../boat.js';
// Brighton Palace Pier, modelled from two photographs: the cream Moorish pavilion with its flag towers and gold
// lettering; a long dark deck on iron piles; and a wide, chamfered pier head crowded with a shallow dome, striped
// tents, a helter-skelter, a yellow roller coaster and a blue log flume, over a turquoise sea and an orange
// shingle beach with its groynes, under the pale green railings of the promenade. The big wheel is this chapter's one
// liberty; the old West Pier stands nearer than it should. Positions must agree with chapters/pier.mjs.
const SEA = -3;
export function createPierScene(kit, data) {
  const { mats, add, box, cyl, cone, roof, windowAt, mergeStatic } = kit, group = new T.Group(), hits = [], mechs = {};
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
  const M = (color, extra = {}) => new T.MeshStandardMaterial({ color, roughness: 0.8, ...extra });
  const m4 = new T.Matrix4(), tint = new T.Color(), v3 = new T.Vector3();
  // Everything small that moves (gulls, boats, the bus, the dolphin) is painted from one strip of swatches, so that each
  // bakes down to a single mesh: a part picks its colour by where its UVs point. The last swatch glows once it is dusk.
  const swatches = ['#f3efe6', '#23282c', '#c8402f', '#f0c348', '#a3abb0', '#5d7f96', '#6a5240', '#2f6fa8', '#d9a87c', '#ffd9a0'];
  const [WHITE, DARK, RED, YELLOW, GREY, SLATE, WOOD, BLUE, SKIN, LAMP] = swatches.keys();
  const strip = lit => { const c = document.createElement('canvas'); c.width = swatches.length; c.height = 1; const g = c.getContext('2d'); swatches.forEach((s, i) => { g.fillStyle = lit ? (i === LAMP ? '#ffb648' : '#000000') : s; g.fillRect(i, 0, 1, 1); }); const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.magFilter = t.minFilter = T.NearestFilter; t.generateMipmaps = false; return t; };
  const paint = new T.MeshStandardMaterial({ map: strip(false), emissive: '#ffffff', emissiveMap: strip(true), emissiveIntensity: away ? 2.4 : 0, roughness: 0.8, side: T.DoubleSide });
  const dab = (parent, geo, c, x = 0, y = 0, z = 0) => { const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, (c + 0.5) / swatches.length, 0.5); return add(geo, paint, x, y, z, parent); };
  const ball = (parent, c, x, y, z, sx, sy = sx, sz = sx) => { const m = dab(parent, new T.SphereGeometry(1, 12, 8), c, x, y, z); m.scale.set(sx, sy, sz); return m; };
  const bar = (parent, c, [x0, y0, z0], [x1, y1, z1]) => dab(parent, new T.BoxGeometry(x1 - x0, y1 - y0, z1 - z0), c, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  const rod = (parent, c, x, y0, y1, z, r, rTop = r) => dab(parent, new T.CylinderGeometry(rTop, r, y1 - y0, 6), c, x, (y0 + y1) / 2, z);
  const tri = (parent, c, pts) => { const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pts, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(new Float32Array(pts.length / 3 * 2), 2)); g.computeVertexNormals(); return dab(parent, g, c); };
  const prop = (x, y, z, turn = 0) => { const g = new T.Group(); g.position.set(x, y, z); g.rotation.order = 'YXZ'; g.rotation.y = turn; group.add(g); return g; };
  const bake = (g, shadow = false) => { mergeStatic(g, new Set()); g.children[g.children.length - 1].castShadow = shadow; g.userData.dynamic = true; return g; };
  // Every bulb, lamp globe and seafront window is one instance of one small box, so that each can come on by itself:
  // a light is a place, a size, the second at which it is lit, and its kind (0 a bulb, 1 a window, 2 a lamp globe).
  const lights = [], light = (x, y, z, at, kind = 0, sx = 0.075, sy = sx, sz = sx) => lights.push([x, y, z, sx, sy, sz, at, kind]);
  // A string of bulbs between two points, lit one after another from the first second to the last.
  const string = (x0, y0, z0, x1, y1, z1, at0, at1 = at0, gap = 1.05) => { const n = Math.max(1, Math.round(Math.hypot(x1 - x0, y1 - y0, z1 - z0) / gap)); for (let i = 0; i < n; i++) { const t = i / n; light(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, z0 + (z1 - z0) * t, at0 + (at1 - at0) * t); } };
  // Bulbs that ride on something that turns (the wheel, the carousel): their own instanced mesh, with a chase running round it.
  const bulbGeo = new T.SphereGeometry(0.06, 8, 6);
  function chaser(parent, n, place) {
    const m = new T.InstancedMesh(bulbGeo, new T.MeshBasicMaterial(), n); m.userData.dynamic = true; m.frustumCulled = false; m.castShadow = m.receiveShadow = false;
    for (let i = 0; i < n; i++) { m.setMatrixAt(i, m4.makeTranslation(...place(i))); m.setColorAt(i, tint.setRGB(0.8, 0.76, 0.66)); } parent.add(m); return m;
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
  for (let x = -25; x <= -18; x += 3.3) { cyl(group, mats.white, x, 0, 1.7, -1.3, 0.035, { seg: 8 }); for (const dx of [-0.14, 0.14]) light(x + dx, 1.72, -1.3, 1.6, 2, 0.17); light(x, 1.87, -1.3, 1.6, 2, 0.17); box(group, mats.white, [x - 0.14, 1.6, -1.32], [x + 0.14, 1.63, -1.28]); }

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
  const carBulbs = chaser(car, 24, i => [Math.cos(i * Math.PI / 12) * 2.12, 2.68, Math.sin(i * Math.PI / 12) * 2.12]);
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
  const wheelBulbs = chaser(wheel, 32, i => i < 24 ? [Math.cos(i * Math.PI / 12) * R, Math.sin(i * Math.PI / 12) * R, 0.17] : [Math.cos((i - 24) * Math.PI / 4 + Math.PI / 8) * R * 0.55, Math.sin((i - 24) * Math.PI / 4 + Math.PI / 8) * R * 0.55, 0.16]);
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
  let ride = null;
  // The yellow roller coaster at the seaward end, kept to the far side so it never hides a traveller.
  { const pts = [], n = 44; for (let i = 0; i < n; i++) { const t = i / n * Math.PI * 2; pts.push(new T.Vector3(16.6 + Math.cos(t) * 2.3 + Math.cos(t * 3) * 0.35, 1.9 + Math.sin(t * 2) * 1.1 + Math.cos(t * 3) * 0.5, -5.4 + Math.sin(t) * 3.1 + Math.sin(t * 2) * 0.5)); }
    const curve = new T.CatmullRomCurve3(pts, true);
    for (const off of [-0.09, 0.09]) { const tr = add(new T.TubeGeometry(curve, 260, 0.035, 6, true), mats.yellow, off, 0, off, group); tr.userData.dynamic = true; }
    for (let i = 0; i < 30; i++) { const p = curve.getPointAt(i / 30); cyl(group, mats.yellow, p.x, 0, p.y, p.z, 0.03, { seg: 6 }); if (i % 2) { const q = curve.getPointAt(((i + 1) % 30) / 30); const b = add(new T.BoxGeometry(p.distanceTo(new T.Vector3(q.x, p.y, q.z)), 0.03, 0.03), mats.yellow, (p.x + q.x) / 2, Math.min(p.y, q.y) * 0.5, (p.z + q.z) / 2, group); b.rotation.y = -Math.atan2(q.z - p.z, q.x - p.x); } }
    // Its two red cars, with a rider in each, go round by day: slowly over the top and quickly through the dip. The
    // track is measured out once, so that following it costs nothing. At sunset the ride is shut and they stand still.
    const lap = new Float32Array(257 * 3), g = prop(0, 0, 0); for (let i = 0; i <= 256; i++) curve.getPointAt(i / 256 % 1, v3).toArray(lap, i * 3);
    for (const x of [-0.25, 0.25]) { bar(g, RED, [x - 0.2, 0.02, -0.15], [x + 0.2, 0.2, 0.15]); bar(g, YELLOW, [x + 0.16, 0.06, -0.16], [x + 0.21, 0.16, 0.16]); ball(g, SKIN, x - 0.03, 0.3, 0, 0.065); bar(g, x < 0 ? BLUE : WHITE, [x - 0.09, 0.18, -0.07], [x + 0.03, 0.26, 0.07]); }
    ride = { g: bake(g, true), lap, u: 0.12 };
    for (let i = 0; i < 22; i++) { const p = curve.getPointAt(i / 22, v3); light(p.x, p.y + 0.13, p.z, 11.5 + i * 0.07); } }
  // The log flume: a low blue trough looping round the south-east corner.
  { const pts = [[15.2, 1.2], [18.6, 1.2], [18.9, 3.4], [16.6, 5.2], [14.6, 4.9], [14.4, 2.6]].map(([x, z], i) => new T.Vector3(x, 0.32 + (i === 1 ? 0.5 : 0), z)), curve = new T.CatmullRomCurve3(pts, true);
    const tr = add(new T.TubeGeometry(curve, 120, 0.3, 10, true), mats.flume, 0, 0, 0, group); tr.scale.y = 0.6; tr.userData.dynamic = true; tr.castShadow = false;
    for (let i = 0; i < 12; i++) { const p = curve.getPointAt(i / 12); cyl(group, mats.white, p.x, 0, 0.2, p.z, 0.04, { seg: 6 }); } box(group, mats.trunk, [16.3, 0.3, 2.9], [16.9, 0.55, 3.3]); }
  // Small striped stalls and deckchairs on the landward side.
  tent(group, 3.4, 1.0, 1.7, -2.6, 0.9, mats.red, mats.white, 12); cyl(group, mats.white, 3.4, 0, 1.0, -2.6, 0.75, { seg: 24 });
  for (const [x, z, m] of [[4.4, 2.6, mats.red], [5.1, 3.1, mats.blue], [12, 3.9, mats.yellow]]) { const c = box(group, m, [x - 0.2, 0.12, z - 0.25], [x + 0.2, 0.16, z + 0.25]); c.rotation.z = 0.5; box(group, mats.white, [x - 0.22, 0, z - 0.27], [x - 0.18, 0.3, z + 0.27]); }
  { const c = document.createElement('canvas'); c.width = 256; c.height = 128; const g = c.getContext('2d'); g.font = '600 92px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(40,28,18,.75)'; g.fillText('MM', 128, 68);
    const m = add(new T.PlaneGeometry(0.9, 0.45), new T.MeshBasicMaterial({ map: new T.CanvasTexture(c), transparent: true, depthWrite: false }), 5, 0.004, 0.85, group); m.rotation.x = -Math.PI / 2; m.castShadow = false; m.userData.dynamic = true; }

  // ---- the beach: shingle falling to the sea, dark where the tide has wetted it, with a line of weed at high water ----
  const SLOPE = 2.9 / 11.2, TILT = Math.atan(SLOPE), shore = x => SEA - 0.4 + (-17 - x) * SLOPE; // how high the shingle lies at x
  { const g = new T.BufferGeometry(), x0 = -17, x1 = -28.2, zz = 130;
    g.setAttribute('position', new T.Float32BufferAttribute([x0, SEA - 0.4, -zz, x1, -0.5, zz, x0, SEA - 0.4, zz, x0, SEA - 0.4, -zz, x1, -0.5, -zz, x1, -0.5, zz], 3));
    g.setAttribute('uv', new T.Float32BufferAttribute([0, 0, 210, 9, 210, 0, 0, 0, 0, 9, 210, 9], 2)); g.computeVertexNormals();
    const beach = add(g, mats.shingle, 0, 0, 0, group); beach.castShadow = false; beach.userData.dynamic = true; }
  // A ribbon lying on the shingle the length of the shore, from a seaward edge to a landward one that wavers.
  function ribbon(mat, xa, xb, wob, lift, seed) {
    const pos = [], uv = [], at = [];
    for (let z = -130, i = 0; z <= 130; z += 1.5, i++) { const xs = [xa + wob * 0.3 * Math.sin(z * 0.57 + seed * 3), xb + wob * (Math.sin(z * 0.83 + seed) + 0.6 * Math.sin(z * 0.31 + seed * 2))];
      for (const x of xs) { pos.push(x, shore(x) + lift, z); uv.push(z / 1.2, x / 1.2); } if (i) { const k = i * 2; at.push(k - 2, k - 1, k, k - 1, k + 1, k); } }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(at); g.computeVertexNormals();
    const m = add(g, mat, 0, 0, 0, group); m.castShadow = false; return m;
  }
  const wet = mats.shingle.clone(); wet.color.set('#a59489'); wet.roughness = 0.4; ribbon(wet, -17.2, -19.9, 0.16, 0.012, 1); ribbon(M('#7d6a45', { roughness: 1 }), -21.3, -21.48, 0.12, 0.02, 4);
  // The surf: two ribbons of foam that run up the shingle one after the other, and thin away as they slide back.
  const surf = [0.4, 2.7].map(seed => { const m = ribbon(new T.MeshStandardMaterial({ color: '#ffffff', roughness: 1, transparent: true, opacity: 0.8, depthWrite: false }), -18.34, -18.62, 0.1, 0.03, seed); m.userData.dynamic = true; m.receiveShadow = false; m.renderOrder = 2; return m; });
  function swash(t) { surf.forEach((m, i) => { const p = (t * 0.085 + i * 0.47) % 1, up = p < 0.3, k = up ? p / 0.3 : 1 - (p - 0.3) / 0.7, d = (i ? 0.6 : 0.85) * k * (2 - k); m.position.set(-d, d * SLOPE, 0); m.material.opacity = up ? 0.7 : 0.12 + 0.58 * k; }); }
  swash(1.8);
  // Groynes: grey walls every eleven strides, running down the shingle and out under the water, each with a marker post.
  for (let i = -11; i <= 11; i++) if (i) { const z = i * 11 - 2, g = box(group, mats.rock, [-6.9, -0.45, -0.17], [6.9, 0.45, 0.17]); g.position.set(-21, shore(-21) + 0.04, z); g.rotation.z = -TILT;
    cyl(group, mats.iron, -15.3, SEA - 1.4, SEA + 1.2, z, 0.06, { seg: 6 }); cone(group, i % 2 ? mats.red : mats.leaf, -15.3, SEA + 1.2, SEA + 1.55, z, 0.17, 8); }
  // What people have left on the stones: deckchairs in pairs, striped windbreaks, towels, and a few boats hauled up.
  // Each lies in a little frame tilted to the beach, so that it can be built as if on the level.
  const stripes = [mats.red, mats.blue, mats.yellow, M('#3f9c8f'), M('#e98a3a')];
  const patch = (x, z, turn = 0) => { const g = new T.Group(); g.position.set(x, shore(x), z); g.rotation.set(0, turn, -TILT, 'ZYX'); group.add(g); return g; };
  function chair(g, x, z, m) { const c = box(g, m, [-0.3, -0.02, -0.25], [0.3, 0.02, 0.25]); c.position.set(x, 0.22, z); c.rotation.z = -0.6; box(g, mats.white, [x - 0.24, 0, z - 0.28], [x - 0.2, 0.42, z - 0.25]); box(g, mats.white, [x - 0.24, 0, z + 0.25], [x - 0.2, 0.42, z + 0.28]); }
  for (let i = 0; i < 30; i++) { const z = -62 + i * 2.6 + (i * 7 % 3) * 0.5, off = ((z + 2) % 11 + 11) % 11, x = -26.4 + (i * 5 % 4) * 1.05, m = stripes[i % 5], n = stripes[(i + 2) % 5];
    if (off < 1.3 || off > 9.7 || Math.abs(z) < 3) continue; const g = patch(x, z, ((i * 3 % 5) - 2) * 0.12);
    if (i % 5 < 2) { chair(g, 0, -0.4, m); chair(g, 0.1, 0.4, n); box(g, n, [0.9, 0, -0.5], [1.5, 0.015, 0.5]); }
    else if (i % 5 === 2) { for (let k = 0; k < 5; k++) box(g, k % 2 ? mats.white : m, [-0.5, 0, -1.25 + k * 0.5], [-0.46, 0.62, -0.75 + k * 0.5]); for (let k = 0; k <= 5; k += 5) cyl(g, mats.trunk, -0.48, 0, 0.75, -1.25 + k * 0.5, 0.025, { seg: 5 }); box(g, n, [0, 0, -0.6], [0.6, 0.015, 0.5]); chair(g, 0.5, 0.9, n); }
    else if (i % 5 === 3) { const b = add(new T.SphereGeometry(1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), i % 2 ? mats.white : m, 0, 0, 0, g); b.scale.set(0.5, 0.36, 1.25); box(g, mats.trunk, [-0.04, 0.3, -1.3], [0.04, 0.38, 1.3]); }
    else { box(g, m, [-0.5, 0, -0.3], [0.5, 0.015, 0.3]); box(g, n, [0.2, 0, 0.6], [1.1, 0.015, 1.2]); cyl(g, mats.white, -0.7, 0, 1.1, -0.5, 0.02, { seg: 5 }); const p = cone(g, n, -0.7, 0.95, 1.25, -0.5, 0.75, 10); p.castShadow = true; } }

  // ---- the promenade: sea wall, pale green railings and lamps, shelters, the coast road and the white seafront ----
  const mint = M('#a9dcc9', { roughness: 0.6 });
  box(group, mats.stone, [-80, SEA - 1, -130], [-28, 0, 130]).castShadow = false;
  for (const [z0, z1] of [[-130, -1.5], [1.5, 130]]) { rail(-28.1, z0, -28.1, z1, 0, 0.5, mint); box(group, mint, [-28.17, 0.46, z0], [-28.03, 0.54, z1]); box(group, mats.walk, [-28.3, -0.5, z0], [-28, 0.03, z1]); }
  // A lamp every eight strides: at dusk they come on one after another, outwards from the pier gate.
  for (let z = -124; z <= 124; z += 8) { cyl(group, mint, -28.75, 0, 2.35, z, 0.05, { seg: 6 }); box(group, mint, [-28.9, 2.3, z - 0.15], [-28.6, 2.36, z + 0.15]); light(-28.75, 2.52, z, 1 + Math.abs(z) * 0.11, 2, 0.32); }
  // Shelters with lead roofs, and by the gate a kiosk under a striped awning.
  for (const z of [-91, -58, -25, 14, 47, 80]) { for (const dx of [-0.75, 0.75]) for (const dz of [-1.5, 1.5]) cyl(group, mint, -30.4 + dx, 0, 1.5, z + dz, 0.045, { seg: 6 }); roof(group, mats.lead, [-31.4, z - 1.9], [-29.4, z + 1.9], 1.5, 0.6); box(group, mats.trunk, [-30.55, 0.3, z - 1.3], [-30.25, 0.38, z + 1.3]); box(group, mint, [-30.43, 0, z - 1.5], [-30.37, 1.5, z + 1.5]); }
  box(group, mats.cream, [-31.2, 0, 3.6], [-29.8, 1.5, 5.4]); box(group, mats.white, [-31.3, 1.5, 3.5], [-29.7, 1.62, 5.5]); for (let k = 0; k < 6; k++) { const a = box(group, k % 2 ? mats.white : mats.red, [-0.45, -0.02, -0.15], [0.45, 0.02, 0.15]); a.position.set(-29.45, 1.3, 3.75 + k * 0.3); a.rotation.z = -0.5; } box(group, mats.iron, [-29.79, 0.7, 3.9], [-29.77, 1.15, 5.1]);
  // The seafront: tall cream and white houses with bow fronts and iron balconies. Only the stretch that can be seen
  // has windows that light: each is lit at its own moment through the dusk, and a few stay dark.
  for (let z = -120, i = 0; z < 120; z += 6.4, i++) { const h = 4.2 + (i * 7 % 4) * 0.7, m = i % 3 === 1 ? mats.white : mats.cream, bow = i % 3 === 0, seen = z > -84 && z < 26;
    box(group, m, [-45, 0, z], [-38, h, z + 6.2]); box(group, mats.slate, [-45.1, h, z - 0.05], [-37.9, h + 0.3, z + 6.25]); box(group, mats.iron, [-37.95, 1.72, z + 0.3], [-37.72, 1.78, z + 5.9]);
    if (bow) { cyl(group, m, -38, 0, h - 0.25, z + 3.1, 1.0, { seg: 16 }); cyl(group, mats.slate, -38, h - 0.25, h - 0.1, z + 3.1, 1.06, { seg: 16 }); }
    for (let y = 1, f = 0; y < h - 0.6; y += 1.3, f++) { if (!seen) { box(group, mats.glass, [-37.99, y - 0.4, z + 0.5], [-37.96, y + 0.4, z + 5.7]); continue; }
      for (let k = 0; k < 3; k++) { const r = Math.sin(i * 12.9898 + f * 78.233 + k * 37.719) * 43758.5453, q = r - Math.floor(r); light(bow && k === 1 ? -36.98 : -37.96, y, z + 1.1 + k * 2, q < 0.22 ? 1e9 : 2 + q * 40, 1, 0.05, 0.8, 1.2); } } }
  box(group, mats.road, [-37.5, 0.005, -130], [-32, 0.02, 130]).castShadow = false;
  // Two buses on the coast road, one each way, their windows lit at dusk.
  const buses = [-34.9, -33.3].map(x => { const g = prop(x, 0.02, 0, Math.PI / 2); bar(g, RED, [-1.3, 0.14, -0.42], [1.3, 1.5, 0.42]); bar(g, WHITE, [-1.31, 0.78, -0.425], [1.31, 0.9, 0.425]); for (const y of [0.56, 1.14]) bar(g, LAMP, [-1.2, y - 0.12, -0.43], [1.2, y + 0.12, 0.43]);
    for (const wx of [-0.85, 0.85]) for (const wz of [-0.4, 0.4]) dab(g, new T.CylinderGeometry(0.17, 0.17, 0.08, 8), DARK, wx, 0.17, wz).rotation.x = Math.PI / 2; return bake(g, true); });
  buses[0].position.z = -30; buses[1].position.z = -12;

  // ---- out in the water ----
  // The old West Pier, a little way down the coast: what the fires left of it, a black iron cage standing in the sea
  // on its piles, with a few lone piles trailing back towards the beach. The starlings roost here.
  { const wx = 0.4, wz = 17.2, top = SEA + 1.25;
    for (let i = 0; i < 7; i++) { for (let j = 0; j < 4; j++) if ((i * 3 + j) % 11 !== 5) cyl(group, mats.iron, wx + i * 1.2, SEA - 1, top, wz + j * 1.1, 0.05, { seg: 5 });
      box(group, mats.iron, [wx + i * 1.2 - 0.035, top - 0.05, wz - 0.15], [wx + i * 1.2 + 0.035, top + 0.05, wz + 3.45]);
      if (i !== 4) { const rib = add(new T.TorusGeometry(1.65, 0.04, 5, 14, Math.PI), mats.iron, wx + i * 1.2, top, wz + 1.65, group); rib.rotation.y = Math.PI / 2; rib.scale.y = 0.72; } }
    for (const [dz, y] of [[0, 0], [3.3, 0], [1.65, 1.19], [0.5, 0.84], [2.8, 0.84]]) box(group, mats.iron, [wx - 0.2, top + y - 0.04, wz + dz - 0.035], [wx + (dz === 0.5 ? 5 : 7.4), top + y + 0.04, wz + dz + 0.035]);
    for (const j of [0, 3]) for (let i = 0; i < 6; i += 2) { const b = box(group, mats.iron, [-0.85, -0.025, -0.025], [0.85, 0.025, 0.025]); b.position.set(wx + i * 1.2 + 0.6, SEA + 0.62, wz + j * 1.1); b.rotation.z = i % 4 ? 0.78 : -0.78; }
    { const b = box(group, mats.iron, [-1.3, -0.04, -0.04], [1.3, 0.04, 0.04]); b.position.set(wx + 5.4, top - 0.45, wz + 1.1); b.rotation.set(0.2, 0.5, -0.4); }
    for (const [dx, dz, h, lean] of [[-1.6, 0.9, 0.9, 0.05], [-2.9, 2.3, 0.5, -0.08], [-4.4, 1.2, 0.75, 0.04], [-6.1, 2.0, 0.3, 0.1], [-7.9, 1.4, 0.55, -0.05]]) cyl(group, mats.iron, wx + dx, SEA - 1, SEA + h, wz + dz, 0.05, { seg: 5 }).rotation.z = lean; }
  // Yellow buoys in a line off the beach, to keep boats away from the bathers.
  for (let z = -62; z <= 26; z += 8) if (Math.abs(z) > 4) add(new T.SphereGeometry(0.17, 10, 8), mats.yellow, -11.5, SEA + 0.04, z, group);
  // A red channel buoy well out to the south-west, rocking, with a lamp on top that shows at dusk.
  const buoy = prop(19, SEA, 19); dab(buoy, new T.CylinderGeometry(0.2, 0.34, 0.5, 8), RED, 0, 0.2, 0); rod(buoy, DARK, 0, 0.45, 1.0, 0, 0.025); bar(buoy, RED, [-0.11, 0.7, -0.11], [0.11, 0.9, 0.11]); ball(buoy, LAMP, 0, 1.04, 0, 0.07); bake(buoy);
  // By day: a red-sailed dinghy tacking about off the beach, a paddle steamer on her round far out, a dolphin that
  // leaps now and then where nobody is looking, and gulls. By evening they have all gone home.
  let dinghy = null, steamer = null, dolphin = null, splash = null; const gulls = [], haunts = [[4, -16.5, 0.3], [-3, -19, -0.5], [9, -15, 1.1]];
  if (!away) {
    dinghy = prop(-5, SEA, 11); ball(dinghy, WHITE, 0, 0.06, 0, 0.85, 0.24, 0.3); bar(dinghy, WOOD, [-0.6, 0.2, -0.22], [0.55, 0.26, 0.22]); rod(dinghy, WOOD, 0.2, 0.2, 2.1, 0, 0.022); bar(dinghy, WOOD, [-0.75, 0.42, -0.02], [0.2, 0.46, 0.02]);
      tri(dinghy, RED, [0.17, 0.5, 0.03, 0.17, 2.05, 0.03, -0.75, 0.5, 0.2]); tri(dinghy, RED, [0.24, 0.4, 0, 0.24, 1.7, 0, 0.85, 0.3, 0.12]); bar(dinghy, BLUE, [-0.5, 0.26, -0.1], [-0.34, 0.52, 0.1]); ball(dinghy, SKIN, -0.42, 0.6, 0, 0.075); bake(dinghy, true);
    steamer = prop(3, SEA - 0.02, -23); ball(steamer, DARK, 0, 0.1, 0, 2.3, 0.32, 0.42); ball(steamer, WOOD, 0, 0.33, 0, 2.1, 0.04, 0.36); bar(steamer, WHITE, [-1.2, 0.36, -0.27], [0.9, 0.68, 0.27]); bar(steamer, LAMP, [-1.1, 0.46, -0.28], [0.8, 0.58, 0.28]); bar(steamer, WHITE, [-0.5, 0.68, -0.22], [0.5, 0.92, 0.22]);
    for (const s of [-1, 1]) { ball(steamer, WHITE, 0, 0.3, s * 0.42, 0.5, 0.42, 0.1); ball(steamer, RED, 0, 0.3, s * 0.5, 0.2, 0.17, 0.04); } rod(steamer, RED, -0.15, 0.9, 1.6, 0, 0.14); rod(steamer, DARK, -0.15, 1.6, 1.75, 0, 0.145); for (const x of [-1.5, 1.4]) rod(steamer, WOOD, x, 0.36, 1.7, 0, 0.02); bake(steamer);
    dolphin = prop(0, SEA, 0); ball(dolphin, SLATE, 0, 0, 0, 0.55, 0.15, 0.13); ball(dolphin, SLATE, 0.52, -0.03, 0, 0.16, 0.06, 0.06); ball(dolphin, WHITE, 0.08, -0.06, 0, 0.42, 0.1, 0.1); dab(dolphin, new T.ConeGeometry(0.08, 0.22, 4), SLATE, -0.05, 0.2, 0).rotation.z = 0.5; bar(dolphin, SLATE, [-0.72, -0.02, -0.17], [-0.54, 0.02, 0.17]); bake(dolphin); dolphin.visible = false;
    splash = add(new T.RingGeometry(0.55, 0.7, 20), new T.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false }), 0, SEA + 0.03, 0, group); splash.rotation.x = -Math.PI / 2; splash.castShadow = splash.receiveShadow = false; splash.userData.dynamic = true; splash.visible = false;
    // A herring gull: white, with grey wings that only show when it flies. Each has a perch and a turn of its own
    // out over the water and back, always on the side away from the paths.
    for (const [x, y, z, turn, r] of [[-10.5, 0.45, 1.45, Math.PI, 3.2], [14.5, 0.45, 6, Math.PI, 3.2], [4.9, 2.82, -6.6, 0, 3], [-21, 3.47, 0, 0, 3.2]]) {
      const g = prop(x, y, z, turn); ball(g, WHITE, 0, 0.11, 0, 0.14, 0.075, 0.07); ball(g, GREY, -0.05, 0.135, 0, 0.12, 0.05, 0.074); ball(g, WHITE, 0.12, 0.2, 0, 0.052); dab(g, new T.ConeGeometry(0.02, 0.09, 5), YELLOW, 0.2, 0.195, 0).rotation.z = -Math.PI / 2;
      bar(g, DARK, [-0.22, 0.1, -0.025], [-0.13, 0.12, 0.025]); for (const s of [-0.025, 0.025]) rod(g, YELLOW, 0.01, 0, 0.06, s, 0.008); bake(g);
      const wings = [-1, 1].map(s => { const w = new T.Group(); w.position.set(0, 0.15, s * 0.05); w.visible = false; g.add(w); bar(w, GREY, [-0.08, -0.008, s > 0 ? 0 : -0.34], [0.08, 0.008, s > 0 ? 0.34 : 0]).castShadow = false; return w; });
      gulls.push({ g, wings, x, y, z, turn, r, k: gulls.length });
    }
  }
  // By evening: the starlings. Two hundred and sixty of them as one instanced mesh, wheeling over the old pier as a
  // single cloud that stretches into a ribbon, folds, and gathers again, with a ripple running through it. And one
  // red balloon that has got away from somebody, going up from behind the dodgems.
  let flock = null, balloon = null; const FLOCK = 260;
  if (away) {
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute([0, 0, 0.1, -0.24, 0, -0.06, 0, 0, -0.025, 0, 0, 0.1, 0, 0, -0.025, 0.24, 0, -0.06], 3));
    flock = new T.InstancedMesh(g, new T.MeshBasicMaterial({ color: '#1b1e24', side: T.DoubleSide }), FLOCK); flock.userData.dynamic = true; flock.frustumCulled = false; flock.castShadow = flock.receiveShadow = false; group.add(flock);
    balloon = prop(12.5, 1, -8.8); ball(balloon, RED, 0, 0, 0, 0.2, 0.24, 0.2); dab(balloon, new T.ConeGeometry(0.04, 0.07, 5), RED, 0, -0.25, 0); rod(balloon, WHITE, 0, -0.85, -0.27, 0, 0.006); bake(balloon);
  }
  function murmur(t) {
    const cx = 2.6 + 3.2 * Math.sin(t * 0.11), cy = 3.6 + 1.1 * Math.sin(t * 0.19), cz = 18.6 + 2.4 * Math.sin(t * 0.16 + 1), e = 0.55 * Math.sin(t * 0.13), lie = t * 0.07, cl = Math.cos(lie), sl = Math.sin(lie), deep = 0.8 + 0.45 * Math.sin(t * 0.17 + 1), shear = 1.5 * Math.sin(t * 0.21), way = t * 0.25 + 1.2 * Math.sin(t * 0.13);
    // Each bird keeps its own place in the cloud (scattered evenly, by two numbers that never fall into step), weaves
    // a little about it, and flies the way the whole flock is heading.
    for (let i = 0; i < FLOCK; i++) { const r = Math.sqrt(i * 0.7548776662 % 1), a = (i * 0.569840291 % 1) * Math.PI * 2 + t * 0.16 + r * shear + 0.25 * Math.sin(t * 0.9 + i), u = Math.cos(a) * r * 2.9 * (1 + e), w = Math.sin(a) * r * 2.9 * (1 - e), h = (i * 0.618034 % 1) * 2 - 1;
      m4.makeRotationY(way + 0.45 * Math.sin(t * 0.8 + i * 1.7)).scale(v3.set(0.55 + 0.45 * Math.abs(Math.sin(t * 7 + i * 1.3)), 1, 1)).setPosition(cx + u * cl - w * sl, cy + h * deep * (1 - r * 0.5) + 0.6 * Math.sin(u * 0.8 - t * 1.1), cz + u * sl + w * cl); flock.setMatrixAt(i, m4); }
    flock.instanceMatrix.needsUpdate = true;
  }
  if (flock) murmur(0);

  // ---- the lights: the pier picked out in bulbs, as it is every night ----
  // They come on in order: the gate arch, then along both rails to the pier head and round it, the pavilion, the
  // great dome, the rides, and last the lamp at the top of the helter-skelter.
  const along = x => 2.6 + (x + 27) * 0.2;
  for (const z of [-1.42, 1.42]) string(-20.66, 0.3, z, -20.66, 2.5, z, 2, 2.4, 0.37); string(-20.84, 2.74, -1.3, -20.84, 2.74, 1.35, 2.4, 2.6, 0.33);
  for (const [x0, x1, z] of [[-19.5, -5.6, 1.45], [-19.5, -16.4, -1.45], [-7.4, -5.6, -1.45], [-0.4, 0.8, 1.45], [-0.4, 2, -1.45], ...(away ? [[-5.6, -0.4, 1.45], [-5.6, -0.4, -1.45]] : [])]) string(x0, 0.5, z, x1, 0.5, z, along(x0), along(x1));
  string(-16.35, 0.5, -1.5, -16.35, 0.5, -4.95, 4.7, 5); string(-16.35, 0.5, -4.95, -7.45, 0.5, -4.95, 5, 6); string(-7.45, 0.5, -4.95, -7.45, 0.5, -1.5, 6, 6.3);
  { let at = 8.4; const edge = (x0, z0, x1, z1) => { const d = Math.hypot(x1 - x0, z1 - z0) * 0.045; string(x0, 0.5, z0, x1, 0.5, z1, at, at + d); at += d; };
    edge(2, -1.5, 2, -9.6); HEAD.slice(0, 4).forEach(([x, z], i) => { const [nx, nz] = HEAD[i + 1]; if (away && i === 2) { edge(x, z, nx, -1.4); edge(nx, 1.4, nx, nz); } else edge(x, z, nx, nz); }); edge(16.6, 6, 5.6, 6); edge(5.6, 6.65, 0.8, 6.65); edge(0.8, 6.65, 0.8, 1.5); }
  string(-13.25, 2.36, -1.86, -7.75, 2.36, -1.86, 5.2, 5.8, 0.42); string(-7.66, 2.36, -1.9, -7.66, 2.36, -4.75, 5.8, 6.1, 0.42);
  for (const x of [-13.25, -7.75]) { for (const dx of [-0.43, 0.43]) string(x + dx, 0.25, -1.62, x + dx, 3.5, -1.62, 5.4, 6.2, 0.4); for (const dx of [-0.47, 0.47]) for (const dz of [-0.47, 0.47]) light(x + dx, 3.64, -2.05 + dz, 6.3); }
  for (let i = 0; i < 14; i++) light(-10.5 + Math.cos(i * Math.PI / 7) * 1.23, 2.56, -3.75 + Math.sin(i * Math.PI / 7) * 1.23, 6.4);
  for (let i = 0; i < 24; i++) light(4.9 + Math.cos(i * Math.PI / 12) * 2.64, 1.27, -6.6 + Math.sin(i * Math.PI / 12) * 2.64, 9.6 + i * 0.03);
  string(7.6, 1.45, -6.68, 13.9, 1.45, -6.68, 10.6, 11.2, 0.6);
  // The helter-skelter: a ring of bulbs under the gallery and another under the cap (none where a traveller stands),
  // and its lamp: eight panes round the top, with the brightness going round them as in a lighthouse.
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; if (Math.sin(a) < 0.5) light(9 + Math.cos(a) * 0.9, 5.52, -5.25 + Math.sin(a) * 0.9, 12); light(9 + Math.cos(a) * 0.66, 6.47, -5.25 + Math.sin(a) * 0.66, 12.4); }
  const lampAt = lights.length; for (let i = 0; i < 8; i++) light(9 + Math.cos(i * Math.PI / 4) * 0.43, 6.1, -5.25 + Math.sin(i * Math.PI / 4) * 0.43, 13, 2, 0.15, 0.32, 0.15);
  const lamps = new T.InstancedMesh(new T.BoxGeometry(1, 1, 1), new T.MeshBasicMaterial(), lights.length); lamps.userData.dynamic = true; lamps.frustumCulled = false; lamps.castShadow = lamps.receiveShadow = false; group.add(lamps);
  lights.forEach(([x, y, z, sx, sy, sz], i) => { lamps.setMatrixAt(i, m4.makeScale(sx, sy, sz).setPosition(x, y, z)); lamps.setColorAt(i, tint.setRGB(0, 0, 0)); });
  const OFF = [[0.8, 0.76, 0.66], [0.05, 0.07, 0.1], [0.93, 0.91, 0.86]], ON = [[2.7, 1.75, 0.8], [2.1, 1.3, 0.5], [2.9, 2.2, 1.15]], dim = away ? 0.4 : 1, warm = [[1, 0.72, 0.35], [1, 0.5, 0.36], [1, 0.86, 0.6]];
  // t is how long ago the lights began to come on. Bulbs twinkle a little once lit; windows and lamp globes burn steadily.
  function glow(t, on, still) {
    const c = lamps.instanceColor.array;
    for (let i = 0; i < lights.length; i++) { const L = lights[i], kind = L[7], off = OFF[kind], lit = ON[kind], k = !on ? 0 : still ? (L[6] < 1e6 ? 1 : 0) : Math.min(1, Math.max(0, (t - L[6]) / 0.6)), w = k * (kind || still ? 1 : 0.86 + 0.14 * Math.sin(t * 2.3 + i * 2.4)), d = (kind === 1 ? 1 : dim) * (1 - k);
      c[i * 3] = off[0] * d + lit[0] * w; c[i * 3 + 1] = off[1] * d + lit[1] * w; c[i * 3 + 2] = off[2] * d + lit[2] * w; }
    if (on && !still) for (let j = 0; j < 8; j++) { const s = Math.max(0, Math.cos(j * Math.PI / 4 - t * 0.9)), b = Math.min(1, Math.max(0, (t - 13) / 0.6)) * (0.35 + 2.6 * s * s * s * s); c[(lampAt + j) * 3] = 2.9 * b; c[(lampAt + j) * 3 + 1] = 2.1 * b; c[(lampAt + j) * 3 + 2] = 1.0 * b; }
    lamps.instanceColor.needsUpdate = true;
  }
  // Three bright places run round a ring of bulbs: faintly by day, and at night over bulbs that are all alight.
  function chase(m, t, k, still, speed) {
    const c = m.instanceColor.array, n = m.count;
    for (let i = 0; i < n; i++) { const s = still ? 0.5 : 0.5 + 0.5 * Math.cos((i / n * 3 - t * speed) * Math.PI * 2), run = s * s * s, a = (1 - k) * dim * (0.7 + 0.3 * run), b = k * (0.9 + 2.4 * run), h = warm[i % 3];
      c[i * 3] = 0.95 * a + h[0] * b; c[i * 3 + 1] = 0.9 * a + h[1] * b; c[i * 3 + 2] = 0.78 * a + h[2] * b; }
    m.instanceColor.needsUpdate = true;
  }
  glow(0, false, true); chase(carBulbs, 0, 0, true, 0); chase(wheelBulbs, 0, 0, true, 0);

  for (const [id, n] of Object.entries(data.nodes)) if (n.pos) { const h = add(new T.BoxGeometry(1, 0.06, 1), ghost(), n.pos[0], n.pos[1] + 0.03, n.pos[2], group); h.castShadow = h.receiveShadow = false; h.userData.near = [id]; hits.push(h); }
  mergeStatic(group, new Set(hits));
  // Where the coaster's cars are, a fraction u of the way round the track.
  function coast(u) { const L = ride.lap, i = u * 256, a = Math.floor(i) * 3, f = i - Math.floor(i), dx = L[a + 3] - L[a], dy = L[a + 4] - L[a + 1], dz = L[a + 5] - L[a + 2], y = L[a + 1] + dy * f;
    ride.g.position.set(L[a] + dx * f, y + 0.06, L[a + 2] + dz * f); ride.g.rotation.y = Math.atan2(-dz, dx); ride.g.rotation.z = Math.atan2(dy, Math.hypot(dx, dz)); return y; }
  coast(ride.u);
  let last = 0, wonAt = -1, alight = false;
  function update(time, model, still, state, live) {
    const spin = state?.wheel.angle ?? 0; for (const g of gondolas) g.rotation.z = -spin;
    if (!still) { horses.forEach((h, i) => { h.position.y = 0.7 + Math.sin(time * 2.2 + i * 1.7) * 0.16; });
      for (const f of flags) { const p = f.geometry.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, Math.sin(time * 5 + p.getX(i) * 7) * 0.05 * (p.getX(i) + 0.35)); p.needsUpdate = true; } key.rotation.y = time * 1.4; }
    key.visible = !away && !model.items.has('key');
    for (const [id, p] of Object.entries(plates)) { const want = model.pressed(id) ? 1 : 0; p.t = still ? want : p.t + (want - p.t) * 0.12; p.mesh.position.y = p.y - p.t * 0.035; }
    if (!away) { barrier.rotation.x = plates.skelterTop.t * Math.PI / 2 * 0.95; wicket.rotation.x = plates.seaside.t * Math.PI / 2 * 0.95; }
    // The lights: at sunset they come on by themselves; at midday, all at once and quickly when the two have met.
    if (model.won && wonAt < 0) wonAt = time; else if (!model.won) wonAt = -1;
    const on = away || model.won, lt = away ? time - 1 : (time - wonAt) * 4, up = on ? (still ? 1 : Math.min(1, Math.max(0, (lt - 9) / 1.5))) : 0;
    if (on || alight) { glow(lt, on, still); alight = on; }
    chase(carBulbs, time, up, still, 0.3); chase(wheelBulbs, time, up, still, -0.22);
    signMat.emissiveIntensity = on ? 0.25 + 1.05 * (still ? 1 : Math.min(1, Math.max(0, (lt - 5) / 1.5))) : 0.25;
    if (boat && live) { const p = live('aboard'); if (model.won) boat.face(p.x - boat.group.position.x, p.z - boat.group.position.z); boat.group.position.set(p.x, p.y - boat.deck, p.z); boat.update(0.016, time, model.won, still); }
    // With motion reduced, everything else stays where it was built.
    if (still) return;
    const dt = Math.min(0.05, Math.max(0, time - last)); last = time;
    swash(time); buoy.rotation.z = Math.sin(time * 0.8) * 0.09; buoy.rotation.x = Math.sin(time * 0.57) * 0.06;
    buses[0].position.z = -95 + (time * 1.5 + 65) % 150; buses[1].position.z = 55 - (time * 1.3 + 67) % 150;
    if (flock) { murmur(time);
      const c = (time + 14) % 52, s = c / 44; balloon.visible = s < 1; balloon.position.set(12.5 - 2.5 * s + Math.sin(time * 0.7) * 0.25, 1 + 15 * s, -8.8 - 3 * s + Math.cos(time * 0.5) * 0.25); balloon.rotation.z = Math.sin(time * 1.1) * 0.14; balloon.scale.setScalar(Math.min(1, (1 - s) * 12)); }
    if (away) return;
    // By day. The coaster: quicker the lower it is.
    ride.u = (ride.u + dt * (0.032 + 0.034 * (3.6 - coast(ride.u)))) % 1;
    { const a = time * 0.06; dinghy.position.set(-5 + 4.5 * Math.cos(a), SEA + Math.sin(time * 1.3) * 0.02, 11 + 2.5 * Math.sin(a)); dinghy.rotation.y = Math.atan2(-2.5 * Math.cos(a), -4.5 * Math.sin(a)); dinghy.rotation.x = 0.1 + Math.sin(time * 0.9) * 0.04; }
    { const a = time * 0.03 + 2.2; steamer.position.set(3 + 9 * Math.cos(a), SEA - 0.02 + Math.sin(time * 0.6) * 0.012, -23 + 2.5 * Math.sin(a)); steamer.rotation.y = Math.atan2(-2.5 * Math.cos(a), -9 * Math.sin(a)); }
    // The dolphin: every so often, at one of three places, up and over in a curve; then a ring spreads where it went in.
    { const c = (time + 12) % 17, at = haunts[Math.floor((time + 12) / 17) % 3], s = c / 1.9, cs = Math.cos(at[2]), sn = Math.sin(at[2]);
      dolphin.visible = s < 1; if (s < 1) { dolphin.position.set(at[0] + cs * 2.4 * s, SEA - 0.2 + 1.25 * Math.sin(Math.PI * s), at[1] - sn * 2.4 * s); dolphin.rotation.y = at[2]; dolphin.rotation.z = 1.05 * Math.cos(Math.PI * s); }
      const r = (c - 1.7) / 1.6; splash.visible = r > 0 && r < 1; if (splash.visible) { splash.position.set(at[0] + cs * 2.3, SEA + 0.03, at[1] - sn * 2.3); splash.scale.setScalar(0.4 + 1.3 * r); splash.material.opacity = 0.7 * (1 - r); } }
    // The gulls: each sits, looking about, and every half minute or so takes a turn out over the water and back.
    for (const b of gulls) { const c = (time + b.k * 7.3) % 29, s = c / 6.5, fly = s < 1; b.wings[0].visible = b.wings[1].visible = fly;
      if (!fly) { b.g.position.set(b.x, b.y, b.z); b.g.rotation.set(0, b.turn + Math.sin(time * 0.4 + b.k * 2) * 0.3, 0); continue; }
      const a = Math.PI * 2 * s * s * (3 - 2 * s), fx = Math.cos(b.turn), fz = -Math.sin(b.turn), out = b.r * (1 - Math.cos(a)), on2 = b.r * Math.sin(a), lift = Math.sin(Math.PI * s), flap = 0.2 + 0.6 * Math.sin(time * 11 + b.k);
      b.g.position.set(b.x + fz * out + fx * on2, b.y + 1.7 * lift * lift, b.z - fx * out + fz * on2); b.g.rotation.set(-0.4 * lift, b.turn + a, 0); b.wings[0].rotation.x = flap; b.wings[1].rotation.x = -flap; }
  }
  const frame = [...(away ? [[24.5, 0, 0]] : []), [-22, 0, 1.5], [-13.5, 6, -2], [9, 8.6, -5.25], [16.4, 0, -9.6], [19.6, 0, 3], [7.6, 6.5, 5], [3, 9.6, 5], [-0.6, 6.4, 5], [2, SEA, 6.7], [16.6, SEA, 6]];
  return { group, hits, mechs, update, frame, blackFlag: () => boat?.blackFlag(), flagPoint: () => boat?.tap.getWorldPosition(new T.Vector3()), routes: { 'skelterTop>skelter': slideRoute }, water: SEA, birds: away ? { x: 2.6, z: 18.6, h: 3.4, color: '#1f2428', count: 10 } : { x: 8, z: -3, h: 9.5, color: '#f4f4f0' }, shadowSize: 38 };
}
