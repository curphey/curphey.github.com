import * as T from '../tower/vendor/three.js';
// Easter eggs: a hidden green terminal cursor in every scene, Marg the chihuahua somewhere in each, and a black flag.
const ghost = () => new T.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false });
function hit(r, data) { const m = new T.Mesh(new T.SphereGeometry(r, 10, 8), ghost()); m.userData = data; return m; }
export function createCursor() {
  const c = document.createElement('canvas'); c.width = 128; c.height = 64; const g = c.getContext('2d');
  g.font = '700 46px ui-monospace, Menlo, Consolas, monospace'; g.textBaseline = 'middle'; g.shadowColor = '#39ff6a'; g.shadowBlur = 10; g.fillStyle = '#39ff6a'; g.fillText('>_', 22, 34);
  const tex = new T.CanvasTexture(c); tex.colorSpace = T.SRGBColorSpace;
  const sprite = new T.Sprite(new T.SpriteMaterial({ map: tex, transparent: true, depthWrite: false })); sprite.scale.set(0.56, 0.28, 1); sprite.position.y = 0.2;
  const group = new T.Group(), target = hit(0.34, { egg: true }); target.position.y = 0.2; group.add(sprite, target);
  return { group, target, update(time, still) { sprite.material.opacity = still ? 0.9 : 0.55 + 0.45 * (Math.sin(time * 4) > -0.2 ? 1 : 0.15); } };
}
export function createMarg() {
  const group = new T.Group(), M = c => new T.MeshStandardMaterial({ color: c, roughness: 0.85 }), tan = M('#c9a26b'), dark = M('#3a2c22'), pink = M('#e9a7a0');
  const part = (geo, m, x, y, z, parent = group) => { const o = new T.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; parent.add(o); return o; };
  const body = part(new T.CapsuleGeometry(0.075, 0.16, 4, 10), tan, 0, 0.16, 0); body.rotation.x = Math.PI / 2;
  const head = new T.Group(); head.position.set(0, 0.27, 0.13); group.add(head);
  part(new T.SphereGeometry(0.075, 14, 10), tan, 0, 0, 0, head); part(new T.SphereGeometry(0.035, 10, 8), tan, 0, -0.02, 0.07, head); part(new T.SphereGeometry(0.014, 8, 6), dark, 0, -0.015, 0.105, head);
  for (const s of [-1, 1]) { const ear = part(new T.ConeGeometry(0.045, 0.12, 8), tan, s * 0.055, 0.1, -0.01, head); ear.rotation.z = -s * 0.35; part(new T.ConeGeometry(0.025, 0.08, 8), pink, s * 0.055, 0.095, 0.004, head).rotation.z = -s * 0.35; part(new T.SphereGeometry(0.014, 8, 6), dark, s * 0.032, 0.02, 0.062, head); }
  for (const [x, z] of [[-0.045, 0.09], [0.045, 0.09], [-0.045, -0.09], [0.045, -0.09]]) part(new T.CylinderGeometry(0.016, 0.014, 0.1, 6), tan, x, 0.05, z);
  const tail = part(new T.CylinderGeometry(0.008, 0.014, 0.12, 6), tan, 0, 0.24, -0.14); tail.rotation.x = -0.7;
  const target = hit(0.3, { marg: true }); target.position.y = 0.18; group.add(target); group.scale.setScalar(1.35);
  let hop = 0;
  return { group, target, yap() { hop = 1; }, update(dt, time, still) { hop = Math.max(0, hop - dt * 1.6); group.position.y = group.userData.y0 + (still ? 0 : Math.abs(Math.sin(hop * Math.PI * 3)) * 0.18 * hop); tail.rotation.z = still ? 0 : Math.sin(time * (hop ? 22 : 7)) * 0.5; head.rotation.z = still ? 0 : Math.sin(time * 0.9) * 0.18; } };
}
// A black flag for the masthead.
export function jollyTexture() {
  const c = document.createElement('canvas'); c.width = 200; c.height = 130; const g = c.getContext('2d');
  g.fillStyle = '#0d0d10'; g.fillRect(0, 0, 200, 130); g.strokeStyle = '#f2efe6'; g.lineWidth = 11; g.lineCap = 'round';
  g.beginPath(); g.moveTo(52, 96); g.lineTo(148, 36); g.moveTo(52, 36); g.lineTo(148, 96); g.stroke();
  g.fillStyle = '#f2efe6'; g.beginPath(); g.arc(100, 56, 27, 0, 7); g.fill(); g.fillRect(84, 70, 32, 20);
  g.fillStyle = '#0d0d10'; g.beginPath(); g.arc(90, 56, 7, 0, 7); g.arc(110, 56, 7, 0, 7); g.fill(); g.fillRect(96, 68, 3, 9); g.fillRect(102, 68, 3, 9); for (let i = 0; i < 4; i++) g.fillRect(87 + i * 7.5, 82, 2, 8);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
}
