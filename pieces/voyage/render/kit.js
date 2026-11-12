import * as T from '../../tower/vendor/three.js';
import { brickTexture, stoneTexture, slateTexture, lawnTexture, plankTexture } from './textures.js';
// Materials and geometry helpers. Textures repeat in world units so brick courses stay one size everywhere.
export function createKit() {
  const std = (tex, extra = {}) => new T.MeshStandardMaterial({ ...tex, roughness: 0.9, ...extra });
  const brickT = brickTexture(), stoneT = stoneTexture('#e2d8c4', 4), plainT = stoneTexture('#d9d0bd'), slateT = slateTexture(), tileT = slateTexture([1.42, 0.74, 0.58], 92), lawnT = lawnTexture(), meadowT = lawnTexture(false), plankT = plankTexture(), shingleT = stoneTexture('#c98556'), sandT = stoneTexture('#ecdcb4'), rockT = stoneTexture('#857b70', 3);
  const mats = {
    brick: std(brickT, { roughness: 0.94, normalScale: new T.Vector2(0.9, 0.9) }),
    stone: std(stoneT, { roughness: 0.82 }),
    walk: std(plainT, { roughness: 0.78, normalScale: new T.Vector2(0.5, 0.5) }),
    slate: std(slateT, { roughness: 0.55, metalness: 0.1 }),
    tile: std(tileT, { roughness: 0.8 }),
    marble: new T.MeshStandardMaterial({ color: '#f1eee6', roughness: 0.5 }),
    deck: std(plankT, { roughness: 0.85, color: '#9a8a7c' }),
    cream: new T.MeshStandardMaterial({ color: '#f1e6cf', roughness: 0.7 }),
    sand: std(sandT, { roughness: 1 }),
    rock: std(rockT, { roughness: 0.95, normalScale: new T.Vector2(2.2, 2.2) }),
    palm: new T.MeshStandardMaterial({ color: '#3f7d3c', roughness: 0.9, side: T.DoubleSide }),
    jungle: new T.MeshStandardMaterial({ color: '#2f6a39', roughness: 1 }),
    pink: new T.MeshStandardMaterial({ color: '#f0a7a0', roughness: 0.8 }),
    tin: new T.MeshStandardMaterial({ color: '#b5463a', roughness: 0.45, metalness: 0.4 }),
    teal: new T.MeshStandardMaterial({ color: '#2aa39a', roughness: 0.6 }),
    orange: new T.MeshStandardMaterial({ color: '#c5402c', roughness: 0.55, metalness: 0.15 }),
    road: new T.MeshStandardMaterial({ color: '#3b3f43', roughness: 0.9 }),
    land: new T.MeshStandardMaterial({ color: '#5f7a4c', roughness: 1 }),
    scrub: new T.MeshStandardMaterial({ color: '#8a7f58', roughness: 1 }),
    city: new T.MeshStandardMaterial({ color: '#aab4bd', roughness: 0.8 }),
    domeGrey: new T.MeshStandardMaterial({ color: '#b3ab9c', roughness: 0.5, metalness: 0.25 }),
    flume: new T.MeshStandardMaterial({ color: '#2f86c9', roughness: 0.35 }),
    shingle: std(shingleT, { roughness: 1, normalScale: new T.Vector2(2, 2) }),
    white: new T.MeshStandardMaterial({ color: '#f3efe6', roughness: 0.55 }),
    red: new T.MeshStandardMaterial({ color: '#c8402f', roughness: 0.6 }),
    blue: new T.MeshStandardMaterial({ color: '#2f6fa8', roughness: 0.6 }),
    yellow: new T.MeshStandardMaterial({ color: '#f0c348', roughness: 0.55 }),
    lawn: std(lawnT, { roughness: 1 }),
    meadow: std(meadowT, { roughness: 1, vertexColors: true }),
    lead: new T.MeshStandardMaterial({ color: '#8b9296', roughness: 0.55, metalness: 0.5 }),
    glass: new T.MeshStandardMaterial({ color: '#31454f', roughness: 0.06, metalness: 1, envMapIntensity: 0.55 }),
    brass: new T.MeshStandardMaterial({ color: '#d9a94e', roughness: 0.28, metalness: 1 }),
    iron: new T.MeshStandardMaterial({ color: '#23282c', roughness: 0.5, metalness: 0.7 }),
    leaf: new T.MeshStandardMaterial({ color: '#35592f', roughness: 1 }),
    trunk: new T.MeshStandardMaterial({ color: '#5a4636', roughness: 1 }),
    glow: new T.MeshStandardMaterial({ color: '#fff0c4', emissive: '#ffbf5a', emissiveIntensity: 0 })
  };
  const TILE = { brick: 3.2, stone: 2, walk: 3, slate: 2, tile: 2, lawn: 4, deck: 3, shingle: 1.2, sand: 2.5, rock: 2.5 };
  const tileOf = m => { for (const [k, v] of Object.entries(mats)) if (v === m) return TILE[k] ?? 2; return 2; };
  function add(geo, mat, x, y, z, parent) {
    const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; parent.add(m); return m;
  }
  // A box given by its minimum and maximum corners, with UVs scaled to world size.
  function box(parent, mat, [x0, y0, z0], [x1, y1, z1]) {
    const w = x1 - x0, h = y1 - y0, d = z1 - z0, geo = new T.BoxGeometry(w, h, d), uv = geo.attributes.uv, s = tileOf(mat);
    const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
    for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++) { const k = f * 4 + i; uv.setXY(k, uv.getX(k) * dims[f][0] / s + x0 * 0.37, uv.getY(k) * dims[f][1] / s + y0 / s); }
    return add(geo, mat, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2, parent);
  }
  function cyl(parent, mat, x, y0, y1, z, r, { rTop = r, seg = 48 } = {}) {
    const h = y1 - y0, geo = new T.CylinderGeometry(rTop, r, h, seg, 1), uv = geo.attributes.uv, s = tileOf(mat);
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * Math.PI * 2 * r / s, uv.getY(i) * h / s + y0 / s);
    return add(geo, mat, x, (y0 + y1) / 2, z, parent);
  }
  function cone(parent, mat, x, y0, y1, z, r, seg = 48) {
    const geo = new T.ConeGeometry(r, y1 - y0, seg, 1), uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 6 * r, uv.getY(i) * (y1 - y0) * 0.8);
    return add(geo, mat, x, (y0 + y1) / 2, z, parent);
  }
  // A pitched roof over a rectangle; the ridge runs along the longer side unless told otherwise.
  function roof(parent, mat, [x0, z0], [x1, z1], y, rise, { alongZ = (z1 - z0) > (x1 - x0), hip = 0.6 } = {}) {
    const w = x1 - x0, d = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, span = alongZ ? w : d, len = alongZ ? d : w;
    const half = span / 2, l = len / 2, r = l - hip * half;
    // Hipped roof: four slopes meeting on a shortened ridge.
    const p = [[-half, 0, -l], [half, 0, -l], [half, 0, l], [-half, 0, l], [0, rise, -r], [0, rise, r]];
    const faces = [[0, 3, 5, 4], [2, 1, 4, 5], [3, 2, 5], [1, 0, 4]], pos = [], uv = [];
    for (const f of faces) {
      const tri = f.length === 4 ? [f[0], f[1], f[2], f[0], f[2], f[3]] : f, side = f.length === 4;
      for (const i of tri) { const [x, y, z] = p[i]; pos.push(x, y, z); uv.push((side ? z : x) / 2, Math.hypot(y, side ? half - Math.abs(x) : l - Math.abs(z)) / 2); }
    }
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); geo.computeVertexNormals();
    const m = add(geo, mat, cx, y, cz, parent); if (!alongZ) m.rotation.y = Math.PI / 2; return m;
  }
  // A stone-framed window on a wall face. face: 'x' looks towards +x, 'z' towards +z.
  function windowAt(parent, face, x, y, z, w = 0.42, h = 0.8, arched = false) {
    const g = new T.Group(); g.position.set(x, y, z); if (face === 'x') g.rotation.y = Math.PI / 2; parent.add(g);
    box(g, mats.stone, [-w / 2 - 0.07, -h / 2 - 0.07, -0.02], [w / 2 + 0.07, h / 2 + 0.07, 0.05]);
    const pane = add(new T.PlaneGeometry(w, h), mats.glass, 0, 0, 0.056, g); pane.castShadow = false;
    box(g, mats.stone, [-0.022, -h / 2, 0.05], [0.022, h / 2, 0.07]); box(g, mats.stone, [-w / 2, h * 0.12, 0.05], [w / 2, h * 0.12 + 0.04, 0.07]);
    box(g, mats.stone, [-w / 2 - 0.12, -h / 2 - 0.13, -0.02], [w / 2 + 0.12, -h / 2 - 0.07, 0.1]);
    if (arched) { const a = add(new T.CylinderGeometry(w / 2 + 0.07, w / 2 + 0.07, 0.07, 24, 1, false, 0, Math.PI), mats.stone, 0, h / 2 + 0.07, 0.015, g); a.rotation.set(Math.PI / 2, Math.PI / 2, 0); }
    return g;
  }
  function tree(parent, x, y, z, s = 1) {
    cyl(parent, mats.trunk, x, y, y + 0.7 * s, z, 0.06 * s, { seg: 8 });
    for (const [dx, dy, dz, r] of [[0, 1.0, 0, 0.5], [0.28, 0.82, 0.1, 0.36], [-0.25, 0.86, -0.12, 0.38], [0.05, 1.32, -0.05, 0.36], [-0.05, 0.9, 0.3, 0.33]]) {
      const m = add(new T.IcosahedronGeometry(r * s, 2), mats.leaf, x + dx * s, y + dy * s, z + dz * s, parent); m.scale.y = 0.9;
    }
  }
  // Bake every static mesh into one mesh per material, so a chapter draws in a handful of calls.
  function mergeStatic(root, keep) {
    root.updateMatrixWorld(true);
    const inverse = new T.Matrix4().copy(root.matrixWorld).invert(), buckets = new Map(), gone = [];
    (function walk(o) {
      if (o.userData.dynamic) return;
      if (o.isMesh && !keep.has(o) && o.material.opacity !== 0 && o.geometry.attributes.uv) {
        const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone(); g.applyMatrix4(new T.Matrix4().multiplyMatrices(inverse, o.matrixWorld));
        if (!buckets.has(o.material)) buckets.set(o.material, { position: [], normal: [], uv: [], shadow: o.castShadow });
        const b = buckets.get(o.material); for (const k of ['position', 'normal', 'uv']) b[k].push(g.attributes[k].array); gone.push(o);
      }
      [...o.children].forEach(walk);
    })(root);
    for (const o of gone) { o.parent.remove(o); o.geometry.dispose(); }
    for (const [mat, b] of buckets) {
      const geo = new T.BufferGeometry();
      for (const [k, size] of [['position', 3], ['normal', 3], ['uv', 2]]) { const total = b[k].reduce((n, a) => n + a.length, 0), out = new Float32Array(total); let at = 0; for (const a of b[k]) { out.set(a, at); at += a.length; } geo.setAttribute(k, new T.BufferAttribute(out, size)); }
      const m = new T.Mesh(geo, mat); m.castShadow = b.shadow; m.receiveShadow = true; root.add(m);
    }
  }
  return { mats, add, box, cyl, cone, roof, windowAt, tree, mergeStatic };
}
