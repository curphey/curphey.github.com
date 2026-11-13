import * as T from '../../tower/vendor/three.js';
// Every surface is drawn in code: an albedo canvas plus a height canvas turned into a normal map.
// A pseudo-random number in [0, 1) for a lattice point. Whole numbers take an integer hash, which is many times
// quicker than the sine it replaced: this is the inner loop of every texture, and was most of the loading time.
const mix = (x, y, s) => { let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(s + 1, 1442695041); h = Math.imul(h ^ (h >>> 15), 0x85ebca6b); h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
const hash = (x, y, s = 0) => { if (x === (x | 0) && y === (y | 0) && s === (s | 0)) return mix(x, y, s); const n = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453; return n - Math.floor(n); };
function noise(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
// Tileable fractal noise over a period of `p` cells.
function fbm(x, y, p, s = 0) {
  let total = 0, amp = 0.5, f = 1;
  for (let o = 0; o < 4; o++) {
    const px = p * f, X = x * f, Y = y * f, xi = Math.floor(X), yi = Math.floor(Y), xf = X - xi, yf = Y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const x0 = (xi % px + px) % px, x1 = (x0 + 1) % px, y0 = (yi % px + px) % px, y1 = (y0 + 1) % px, k = s + o;
    const a = mix(x0, y0, k), b = mix(x1, y0, k), c = mix(x0, y1, k), d = mix(x1, y1, k);
    total += amp * (a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v);
    amp *= 0.5; f *= 2;
  }
  return total;
}
function canvas(size) { const c = document.createElement('canvas'); c.width = c.height = size; return c; }
function finish(color, height, { strength = 2, anisotropy = 8 } = {}) {
  const size = color.width, map = new T.CanvasTexture(color);
  map.colorSpace = T.SRGBColorSpace; map.wrapS = map.wrapT = T.RepeatWrapping; map.anisotropy = anisotropy;
  const h = height.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, size, size).data, out = canvas(size), ctx = out.getContext('2d', { willReadFrequently: true }), img = ctx.createImageData(size, size);
  const at = (x, y) => h[(((y + size) % size) * size + (x + size) % size) * 4] / 255;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const dx = (at(x + 1, y) - at(x - 1, y)) * strength, dy = (at(x, y + 1) - at(x, y - 1)) * strength, l = Math.hypot(dx, dy, 1), i = (y * size + x) * 4;
    img.data[i] = (-dx / l * 0.5 + 0.5) * 255; img.data[i + 1] = (dy / l * 0.5 + 0.5) * 255; img.data[i + 2] = (1 / l * 0.5 + 0.5) * 255; img.data[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  const normalMap = new T.CanvasTexture(out); normalMap.wrapS = normalMap.wrapT = T.RepeatWrapping; normalMap.anisotropy = anisotropy;
  return { map, normalMap };
}
function mottle(ctx, size, [r, g, b], amount, cells = 8, seed = 0) {
  const img = ctx.getImageData(0, 0, size, size), d = img.data;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const n = (fbm(x / size * cells, y / size * cells, cells, seed) - 0.5) * 2 * amount + (hash(x, y, seed) - 0.5) * amount * 0.5, i = (y * size + x) * 4;
    d[i] = Math.max(0, Math.min(255, d[i] + n * r)); d[i + 1] = Math.max(0, Math.min(255, d[i + 1] + n * g)); d[i + 2] = Math.max(0, Math.min(255, d[i + 2] + n * b));
  }
  ctx.putImageData(img, 0, 0);
}
export function brickTexture() {
  const size = 512, color = canvas(size), height = canvas(size), c = color.getContext('2d', { willReadFrequently: true }), h = height.getContext('2d', { willReadFrequently: true });
  const courses = 24, across = 8, ch = size / courses, bw = size / across, joint = 3;
  c.fillStyle = '#c9bca8'; c.fillRect(0, 0, size, size); h.fillStyle = '#303030'; h.fillRect(0, 0, size, size);
  for (let row = 0; row < courses; row++) for (let i = -1; i < across; i++) {
    const x = i * bw + (row % 2) * bw / 2, y = row * ch, r = hash(i + (row % 2) * 31, row, 1), k = hash(i, row, 2);
    const band = row % 8 === 3, base = band ? [222 + k * 10, 212 + k * 10, 192 + k * 10] : r < 0.1 ? [118, 52, 44] : r > 0.92 ? [176, 96, 66] : [150 + k * 22, 70 + k * 14, 52 + k * 10];
    c.fillStyle = `rgb(${base.map(Math.round).join(',')})`; c.fillRect(x + joint / 2, y + joint / 2, bw - joint, ch - joint);
    const v = 190 + hash(i, row, 3) * 60; h.fillStyle = `rgb(${v},${v},${v})`; h.fillRect(x + joint / 2, y + joint / 2, bw - joint, ch - joint);
  }
  mottle(c, size, [26, 20, 16], 1, 16, 4); mottle(h, size, [30, 30, 30], 1, 32, 5);
  return finish(color, height, { strength: 2.4 });
}
export function stoneTexture(tone = '#e2d8c4', block = 0) {
  const size = 512, color = canvas(size), height = canvas(size), c = color.getContext('2d', { willReadFrequently: true }), h = height.getContext('2d', { willReadFrequently: true });
  c.fillStyle = tone; c.fillRect(0, 0, size, size); h.fillStyle = '#c0c0c0'; h.fillRect(0, 0, size, size);
  mottle(c, size, [20, 19, 17], 1, 6, 6); mottle(c, size, [10, 10, 10], 1, 48, 7); mottle(h, size, [40, 40, 40], 1, 24, 8);
  if (block) {
    c.strokeStyle = 'rgba(96,84,66,.5)'; h.strokeStyle = '#404040'; c.lineWidth = h.lineWidth = 2.5;
    const rows = block, rh = size / rows;
    for (let r = 0; r < rows; r++) for (const ctx of [c, h]) {
      ctx.beginPath(); ctx.moveTo(0, r * rh); ctx.lineTo(size, r * rh);
      for (let i = 0; i < 2; i++) { const x = (i + (r % 2) * 0.5 + 0.25) * size / 2; ctx.moveTo(x, r * rh); ctx.lineTo(x, (r + 1) * rh); }
      ctx.stroke();
    }
  }
  return finish(color, height, { strength: 1.4 });
}
export function slateTexture(tint = [0.92, 1, 1.14], light = 62) {
  const size = 512, color = canvas(size), height = canvas(size), c = color.getContext('2d', { willReadFrequently: true }), h = height.getContext('2d', { willReadFrequently: true });
  const rows = 16, across = 12, rh = size / rows, sw = size / across;
  for (let row = 0; row < rows; row++) for (let i = -1; i < across; i++) {
    const x = i * sw + (row % 2) * sw / 2, y = row * rh, k = hash(i + (row % 2) * 17, row, 9), t = light + k * 26;
    c.fillStyle = `rgb(${t * tint[0] | 0},${t * tint[1] | 0},${t * tint[2] | 0})`; c.fillRect(x, y, sw - 1, rh);
    const g = h.createLinearGradient(0, y, 0, y + rh); g.addColorStop(0, '#606060'); g.addColorStop(1, '#f0f0f0'); h.fillStyle = g; h.fillRect(x, y, sw - 1.5, rh);
    h.fillStyle = '#202020'; h.fillRect(x + sw - 1.5, y, 1.5, rh);
  }
  mottle(c, size, [14, 14, 16], 1, 24, 10);
  return finish(color, height, { strength: 2 });
}
export function lawnTexture(striped = true) {
  const size = 512, color = canvas(size), height = canvas(size), c = color.getContext('2d', { willReadFrequently: true }), h = height.getContext('2d', { willReadFrequently: true });
  for (let i = 0; i < 8; i++) { c.fillStyle = !striped ? '#56794a' : i % 2 ? '#4d7443' : '#58804b'; c.fillRect(i * size / 8, 0, size / 8, size); }
  h.fillStyle = '#808080'; h.fillRect(0, 0, size, size);
  mottle(c, size, [18, 24, 14], 1, 64, 11); mottle(c, size, [10, 14, 8], 1, 8, 12); mottle(h, size, [90, 90, 90], 1, 128, 13);
  return finish(color, height, { strength: 1.2 });
}
export function plankTexture() {
  const size = 512, color = canvas(size), height = canvas(size), c = color.getContext('2d', { willReadFrequently: true }), h = height.getContext('2d', { willReadFrequently: true }), n = 12, w = size / n;
  for (let i = 0; i < n; i++) { const k = hash(i, 3, 21), t = 150 + k * 34; c.fillStyle = `rgb(${t | 0},${t * 0.9 | 0},${t * 0.76 | 0})`; c.fillRect(0, i * w, size, w - 2); c.fillStyle = '#5d5142'; c.fillRect(0, i * w + w - 2, size, 2);
    h.fillStyle = '#d0d0d0'; h.fillRect(0, i * w, size, w - 3); h.fillStyle = '#202020'; h.fillRect(0, i * w + w - 3, size, 3);
    for (let j = 0; j < 3; j++) { const x = hash(i, j, 22) * size; c.fillStyle = '#5d5142'; c.fillRect(x, i * w, 2, w - 2); h.fillStyle = '#202020'; h.fillRect(x, i * w, 2, w - 2); } }
  mottle(c, size, [16, 14, 11], 1, 32, 23); mottle(h, size, [30, 30, 30], 1, 64, 24);
  return finish(color, height, { strength: 1.6 });
}
export function signTexture(text) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 160; const g = c.getContext('2d', { willReadFrequently: true });
  g.fillStyle = '#1b2a3a'; g.fillRect(0, 0, 1024, 160); g.font = '700 112px "Helvetica Neue", Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = '#fff3c4'; g.fillText(text, 512, 86); g.strokeStyle = '#f2c14e'; g.lineWidth = 6; g.strokeRect(8, 8, 1008, 144);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; return t;
}
export function letteringTexture(lines) {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 340; const g = c.getContext('2d', { willReadFrequently: true });
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '900 150px Georgia, "Times New Roman", serif'; g.lineJoin = 'round';
  lines.forEach((t, i) => { const y = 90 + i * 160; g.strokeStyle = '#5a2f12'; g.lineWidth = 16; g.strokeText(t, 512, y); g.fillStyle = '#e9a93a'; g.fillText(t, 512, y); g.fillStyle = 'rgba(255,236,170,.55)'; g.fillText(t, 508, y - 5); });
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; return t;
}
export function flagTexture() {
  const c = document.createElement('canvas'); c.width = 240; c.height = 120; const g = c.getContext('2d', { willReadFrequently: true });
  g.fillStyle = '#1f3a7a'; g.fillRect(0, 0, 240, 120);
  const diag = (w, col) => { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(0, 0); g.lineTo(240, 120); g.moveTo(240, 0); g.lineTo(0, 120); g.stroke(); };
  diag(26, '#ffffff'); diag(9, '#c8202f'); g.fillStyle = '#ffffff'; g.fillRect(98, 0, 44, 120); g.fillRect(0, 40, 240, 40); g.fillStyle = '#c8202f'; g.fillRect(108, 0, 24, 120); g.fillRect(0, 48, 240, 24);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
}
export function panTexture() {
  const size = 256, c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d', { willReadFrequently: true }), r = size / 2;
  const grad = g.createRadialGradient(r, r, 8, r, r, r); grad.addColorStop(0, '#8d949a'); grad.addColorStop(0.75, '#c9ced2'); grad.addColorStop(1, '#eef0f1'); g.fillStyle = grad; g.fillRect(0, 0, size, size);
  g.strokeStyle = 'rgba(40,46,52,.55)'; g.lineWidth = 2.5;
  for (let i = 0; i < 9; i++) { const a = i * Math.PI * 2 / 9; g.beginPath(); g.ellipse(r + Math.cos(a) * r * 0.66, r + Math.sin(a) * r * 0.66, r * 0.2, r * 0.14, a, 0, 7); g.stroke(); }
  for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5 + 0.4; g.beginPath(); g.ellipse(r + Math.cos(a) * r * 0.3, r + Math.sin(a) * r * 0.3, r * 0.13, r * 0.1, a, 0, 7); g.stroke(); }
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; return t;
}
// The flag of Trinidad and Tobago: red, with a black diagonal band edged in white.
export function trinidadFlagTexture() {
  const c = document.createElement('canvas'); c.width = 300; c.height = 180; const g = c.getContext('2d', { willReadFrequently: true });
  g.fillStyle = '#da1a35'; g.fillRect(0, 0, 300, 180);
  const band = (w, col) => { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(40, -40); g.lineTo(260, 220); g.stroke(); };
  band(86, '#ffffff'); band(62, '#111111');
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; return t;
}
export function boardTexture(text, bg = '#f4ecd6', fg = '#b0221c') {
  const c = document.createElement('canvas'); c.width = 512; c.height = 128; const g = c.getContext('2d', { willReadFrequently: true });
  g.fillStyle = bg; g.fillRect(0, 0, 512, 128); g.strokeStyle = fg; g.lineWidth = 8; g.strokeRect(6, 6, 500, 116);
  g.font = '900 78px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = fg; g.fillText(text, 256, 68);
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; return t;
}
export function clockTexture() {
  const size = 256, c = canvas(size), g = c.getContext('2d', { willReadFrequently: true }), r = size / 2;
  g.fillStyle = '#efe6d2'; g.beginPath(); g.arc(r, r, r - 2, 0, 7); g.fill();
  g.strokeStyle = '#2b2b33'; g.lineWidth = 7; g.beginPath(); g.arc(r, r, r - 12, 0, 7); g.stroke();
  for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; g.lineWidth = i % 3 ? 4 : 8; g.beginPath(); g.moveTo(r + Math.sin(a) * (r - 22), r - Math.cos(a) * (r - 22)); g.lineTo(r + Math.sin(a) * (r - 40), r - Math.cos(a) * (r - 40)); g.stroke(); }
  const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; return t;
}
