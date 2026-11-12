// Progress and the sound preference, kept in the browser. Works when storage is missing or throws.
const KEY = 'voyage-next';
const defaults = () => ({ furthest: 1, done: [], sound: false, eggs: [], root: false, matrix: false, cards: {} });
export function createSave(storage) {
  function load() {
    try {
      const raw = storage.getItem(KEY);
      if (!raw) return defaults();
      const v = JSON.parse(raw);
      return { ...defaults(), ...v, done: Array.isArray(v.done) ? v.done : [], eggs: Array.isArray(v.eggs) ? v.eggs : [], cards: v.cards && typeof v.cards === 'object' ? v.cards : {} };
    } catch { return defaults(); }
  }
  function store(patch) {
    const next = { ...load(), ...patch };
    try { storage.setItem(KEY, JSON.stringify(next)); } catch { /* play on without saving */ }
    return next;
  }
  return { load, store };
}
