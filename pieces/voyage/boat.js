import * as T from '../tower/vendor/three.js';
import { createYacht } from './yacht.js';
import { createWalker } from './walker.js';
import { jollyTexture } from './eggs.js';
// Disco Volante, the Excess 14, scaled for these scenes: optionally with the two travellers aboard,
// and with up to three lanterns at the masthead. It can stand in for a traveller (see world.js).
export function createBoat({ scale = 0.62, figures = false } = {}) {
  const yacht = createYacht(), group = new T.Group(), inner = yacht.group; inner.scale.setScalar(scale); group.add(inner);
  // Find the masthead: the highest point of the model.
  inner.updateMatrixWorld(true); let top = new T.Vector3(0, 0, 0);
  inner.traverse(o => { if (!o.isMesh) return; const b = new T.Box3().setFromObject(o); if (b.max.y > top.y) top = new T.Vector3((b.min.x + b.max.x) / 2, b.max.y, (b.min.z + b.max.z) / 2); });
  const lamps = [];
  for (let i = 0; i < 3; i++) {
    const mat = new T.MeshStandardMaterial({ color: '#fff0c4', emissive: '#ffb84d', emissiveIntensity: 0 }), m = new T.Mesh(new T.SphereGeometry(0.085, 14, 10), mat);
    m.position.set(top.x + (i - 1) * 0.22, top.y - 0.25 - Math.abs(i - 1) * 0.12, top.z); m.castShadow = false; group.add(m);
    const bar = new T.Mesh(new T.BoxGeometry(0.5, 0.015, 0.015), new T.MeshStandardMaterial({ color: '#30383c' })); bar.position.set(top.x, top.y - 0.2, top.z); if (i === 0) group.add(bar);
    lamps.push(mat);
  }
  const glow = new T.PointLight('#ffc978', 0, 6, 1.8); glow.position.set(top.x, top.y - 0.3, top.z); group.add(glow);
  if (figures) for (const [id, x] of [['one', -0.28], ['two', 0.28]]) { const w = createWalker(id); w.group.scale.setScalar(0.6); w.group.position.set(x, 0.78 * scale, 1.25 * scale); w.group.rotation.y = Math.PI; w.update(0, 0, false, true); group.add(w.group); }
  const flag = new T.Mesh(new T.PlaneGeometry(0.8, 0.52), new T.MeshStandardMaterial({ map: jollyTexture(), side: T.DoubleSide, roughness: 0.9 })); flag.position.set(top.x + 0.45, top.y - 0.45, top.z); flag.visible = false; group.add(flag);
  const tap = new T.Mesh(new T.SphereGeometry(0.8, 12, 8), new T.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })); tap.position.set(top.x, top.y - 0.9, top.z); tap.userData = { yacht: true }; group.add(tap); // tap the rig, not the deck
  // Sails, in the yacht's own measure: a mainsail on the mast and boom, and a jib on the forestay. Each is two
  // panels with a little belly. They are furled (flat to nothing) until she sails, then hoist.
  const cloth = new T.MeshStandardMaterial({ color: '#fbf4e2', roughness: 0.9, side: T.DoubleSide, emissive: '#ffb070', emissiveIntensity: 0.12 });
  const sail = (tack, clew, head, belly) => {
    const mid = [(clew[0] + head[0]) / 2 + belly, (clew[1] + head[1]) / 2, (clew[2] + head[2]) / 2 + 0.25], lo = [(tack[0] + clew[0]) / 2 + belly * 0.8, tack[1], (tack[2] + clew[2]) / 2];
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute([...tack, ...lo, ...head, ...lo, ...mid, ...head, ...lo, ...clew, ...mid].map((v, i) => i % 3 === 1 ? v - tack[1] : v), 3)); g.computeVertexNormals();
    const m = new T.Mesh(g, cloth); m.position.y = tack[1]; m.scale.y = 0.001; m.visible = false; m.castShadow = true; inner.add(m); return m;
  };
  const sails = [sail([0, 2.16, -0.62], [0, 2.16, 1.15], [0, 5.9, -0.66], 0.3), sail([0, 0.8, -2.6], [0, 1.55, -0.9], [0, 5.4, -0.72], 0.26)];
  let heading = 0, want = 0, flying = 0, hoist = 0;
  return {
    group, deck: 0.78 * scale,
    face(dx, dz) { if (Math.abs(dx) + Math.abs(dz) > 1e-4) want = Math.atan2(-dx, -dz); },
    tap, blackFlag() { flying = 4; },
    setLanterns(n) { lamps.forEach((m, i) => { m.emissiveIntensity = i < n ? 6 : 0; }); glow.intensity = n ? 3 + n * 2 : 0; },
    update(dt, time, moving, still) {
      yacht.update(time, !still); flying = Math.max(0, flying - dt); flag.visible = flying > 0;
      hoist = still ? (moving ? 1 : 0) : Math.min(1, Math.max(0, hoist + (moving ? dt : -dt) / 5));
      sails.forEach((m, i) => { const k = Math.min(1, Math.max(0, hoist * 1.6 - i * 0.6)), e = k * k * (3 - 2 * k); m.visible = e > 0; m.scale.y = Math.max(0.001, e); });
      inner.rotation.z = (still ? 0 : Math.sin(time * 0.5) * 0.012) - 0.05 * hoist; // she heels a little under sail
      let d = want - heading; d = Math.atan2(Math.sin(d), Math.cos(d)); heading += d * Math.min(1, dt * (still ? 100 : 1.6)); group.rotation.y = heading;
    }
  };
}
