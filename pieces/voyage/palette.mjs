// One palette per chapter, dawn to sunset. Colours are sRGB hex; sun is [azimuth, elevation] in degrees.
export const palettes = {
  trinidad:  { skyTop: '#5d86b8', skyLow: '#f6c9a6', haze: '#f1cfb5', sun: '#ffd2a0', sunDir: [112, 24], sunPower: 3.3, water: '#1b9a94', ambient: 0.85 },
  founders:  { skyTop: '#6f9fd0', skyLow: '#f3e3c8', haze: '#e9e2d2', sun: '#ffe6bf', sunDir: [101, 35], sunPower: 3.6, water: '#2a5560', ambient: 0.9 },
  pier:      { skyTop: '#4f8fd6', skyLow: '#dcecf5', haze: '#dfeaf0', sun: '#fff6e4', sunDir: [170, 58], sunPower: 4.2, water: '#17868a', ambient: 1.0 },
  bridge:    { skyTop: '#8fa6b8', skyLow: '#e6e3dc', haze: '#e3e1db', sun: '#ffedd2', sunDir: [215, 40], sunPower: 2.6, water: '#3c5f6b', ambient: 1.1 },
  needle:    { skyTop: '#6c7b88', skyLow: '#b9c2c6', haze: '#b4bdc1', sun: '#e6ecf0', sunDir: [235, 32], sunPower: 1.8, water: '#35505a', ambient: 1.15 },
  return:    { skyTop: '#5b7fb5', skyLow: '#ffc98a', haze: '#f5c79a', sun: '#ffc27a', sunDir: [262, 16], sunPower: 3.8, water: '#2d4f63', ambient: 0.8 },
  departure: { skyTop: '#3d4f8a', skyLow: '#ff9a5c', haze: '#f39a6b', sun: '#ff9d57', sunDir: [30, 10], sunPower: 4.2, water: '#27405c', ambient: 0.65 }
};
palettes.monterey = { skyTop: '#5a93c8', skyLow: '#dfeaf0', haze: '#d3e0e7', sun: '#fff2dc', sunDir: [150, 46], sunPower: 3.6, water: '#1d6a84', ambient: 1.0 };
export const order = ['trinidad', 'founders', 'pier', 'bridge', 'needle', 'return', 'departure'];
const rgb = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16));
const hex = c => '#' + c.map(v => Math.round(v).toString(16).padStart(2, '0')).join('');
const lerp = (a, b, t) => a + (b - a) * t;
export function mix(a, b, t) {
  t = Math.min(1, Math.max(0, t));
  if (t === 0) return { ...a, sunDir: [...a.sunDir] };
  if (t === 1) return { ...b, sunDir: [...b.sunDir] };
  const out = {};
  for (const k of Object.keys(a)) {
    if (typeof a[k] === 'string') out[k] = hex(rgb(a[k]).map((v, i) => lerp(v, rgb(b[k])[i], t)));
    else if (Array.isArray(a[k])) out[k] = a[k].map((v, i) => lerp(v, b[k][i], t));
    else out[k] = lerp(a[k], b[k], t);
  }
  return out;
}
