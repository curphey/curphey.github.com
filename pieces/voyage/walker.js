import * as T from '../tower/vendor/three.js';
import { people } from './people.mjs';
// The traveller: a small, faceless figure. Two colourways for the two travellers.
const WAYS = people;
export function createWalker(way = 'one') {
  const c = WAYS[way] ?? WAYS.one, group = new T.Group(), mat = (color, roughness = 0.85) => new T.MeshStandardMaterial({ color, roughness });
  const coat = mat(c.coat), legsM = mat(c.legs), skin = mat('#d9ad8a', 0.7), trim = mat(c.trim, 0.6), hat = mat(c.hat);
  const part = (geo, m, x, y, z, parent = group) => { const mesh = new T.Mesh(geo, m); mesh.position.set(x, y, z); mesh.castShadow = mesh.receiveShadow = true; parent.add(mesh); return mesh; };
  const body = new T.Group(); group.add(body);
  part(new T.CapsuleGeometry(0.13, 0.22, 6, 16), coat, 0, 0.58, 0, body);
  const skirt = part(new T.CylinderGeometry(0.13, 0.19, 0.24, 16), coat, 0, 0.42, 0, body);
  part(new T.TorusGeometry(0.135, 0.018, 8, 24), trim, 0, 0.5, 0, body).rotation.x = Math.PI / 2;
  part(new T.CylinderGeometry(0.05, 0.06, 0.06, 12), skin, 0, 0.79, 0, body);
  const head = part(new T.SphereGeometry(0.115, 24, 18), skin, 0, 0.9, 0, body);
  part(new T.SphereGeometry(0.122, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), hat, 0, 0.925, -0.005, body);
  const brim = part(new T.CylinderGeometry(0.1, 0.1, 0.012, 20), hat, 0, 0.93, 0.1, body); brim.scale.z = 0.7;
  part(new T.BoxGeometry(0.17, 0.2, 0.08), trim, 0, 0.6, -0.15, body); // satchel
  const legs = [], arms = [];
  for (const s of [-1, 1]) {
    const leg = new T.Group(); leg.position.set(s * 0.07, 0.34, 0); group.add(leg);
    part(new T.CapsuleGeometry(0.045, 0.2, 4, 10), legsM, 0, -0.15, 0, leg); part(new T.BoxGeometry(0.085, 0.05, 0.15), legsM, 0, -0.315, 0.025, leg); legs.push(leg);
    const arm = new T.Group(); arm.position.set(s * 0.165, 0.7, 0); body.add(arm);
    part(new T.CapsuleGeometry(0.04, 0.18, 4, 10), coat, 0, -0.11, 0, arm); part(new T.SphereGeometry(0.038, 10, 8), skin, 0, -0.24, 0, arm); arms.push(arm);
  }
  group.scale.setScalar(c.size ?? 1);
  let amount = 0, phase = 0, facing = 0, hop = 0;
  return {
    group, head, hop() { hop = 1; },
    face(dx, dz) { if (Math.abs(dx) + Math.abs(dz) > 1e-4) facing = Math.atan2(dx, dz); },
    update(dt, time, moving, still) {
      amount += ((moving ? 1 : 0) - amount) * Math.min(1, dt * 10);
      phase += dt * 11 * amount;
      const swing = still ? 0 : Math.sin(phase) * 0.55 * amount;
      legs[0].rotation.x = swing; legs[1].rotation.x = -swing; arms[0].rotation.x = -swing * 0.7; arms[1].rotation.x = swing * 0.7;
      hop = Math.max(0, hop - dt * 2.6);
      body.position.y = still ? 0 : Math.abs(Math.cos(phase)) * 0.025 * amount + Math.sin(time * 1.7) * 0.006 * (1 - amount) + Math.sin(hop * Math.PI) * 0.22;
      head.rotation.y = still ? 0 : Math.sin(time * 0.45) * 0.35 * (1 - amount);
      let d = facing - group.rotation.y; d = Math.atan2(Math.sin(d), Math.cos(d)); group.rotation.y += d * Math.min(1, dt * 12);
    }
  };
}
