import { lift } from './project.mjs';
import { kind } from './people.mjs';
export const DIRECTIONS = [[1, 0, 0], [0, 0, 1], [-1, 0, 0], [0, 0, -1]]; // turntable: east, south, west, north
export const WHEEL = [[1, 0, 0], [0, -1, 0], [-1, 0, 0], [0, 1, 0]];       // upright wheel: east, bottom, west, top

// A chapter is data: nodes, turning mechanisms that carry arm nodes, and edges that exist only in some
// mechanism states. "apparent" edges join only on screen. One or two travellers share the world.
export class Chapter {
  constructor(data) { this.data = data; this.reset(); }
  reset() {
    this.plan = null; this.asked = null;
    const t = this.data.travellers ?? { one: this.data.start };
    this.where = { ...t }; this.active = Object.keys(t)[0];
    this.mechs = Object.fromEntries(Object.entries(this.data.mechs).map(([id, m]) => [id, m.start]));
    this.items = new Set();
    this.won = false;
  }
  get at() { return this.where[this.active]; }
  set at(node) { this.where[this.active] = node; }
  get travellers() { return Object.keys(this.where); }
  pos(id, mechs = this.mechs) {
    const node = this.data.nodes[id];
    if (!node.arm) return node.pos;
    if (this.data.mechs[node.arm].track) return this.data.mechs[node.arm].track[mechs[node.arm]]; // a car on a track: one place per state
    const m = this.data.mechs[node.arm], d = (m.axis === 'z' ? WHEEL : DIRECTIONS)[(mechs[node.arm] + (node.slot ?? 0)) % 4];
    return m.hub.map((v, i) => v + d[i] * m.length);
  }
  holds(when) { return !when || Object.entries(when).every(([id, state]) => this.mechs[id] === state); }
  // A plate is held down only while some traveller stands on its node.
  pressed(node) { return this.travellers.some(t => this.where[t] === node); }
  // Edges open to the active traveller: `only` marks a way that just children, or just adults, can take.
  edges() { const k = kind(this.active); return this.data.edges.filter(e => this.holds(e.when) && (!e.needs || this.items.has(e.needs)) && (!e.plate || this.pressed(e.plate)) && (!e.only || e.only === k)); }
  edge(a, b) { return this.edges().find(e => (e.a === a && e.b === b) || (e.a === b && e.b === a)); }
  // The lift towards the camera when walking a -> b across an apparent edge; null for solid edges.
  crossing(a, b) {
    const e = this.edge(a, b);
    if (!e || e.kind !== 'apparent') return null;
    const forward = e.a === a, t = lift(this.pos(e.a), this.pos(e.b), e.step);
    return { step: forward ? e.step : e.step.map(v => -v || 0), lift: forward ? t : -t };
  }
  path(to) {
    if (!this.data.nodes[to]) return null;
    const queue = [[this.at]], seen = new Set([this.at]);
    while (queue.length) {
      const path = queue.shift(), at = path.at(-1);
      if (at === to) return path;
      for (const e of this.edges()) {
        const next = e.a === at ? e.b : e.b === at && !e.oneWay ? e.a : null; // a slide goes one way only
        if (next && !seen.has(next) && !this.full(next)) { seen.add(next); queue.push([...path, next]); }
      }
    }
    return null;
  }
  // A node with `cap` has only so many seats; the others aboard take them.
  full(node) { const cap = this.data.nodes[node].cap; return !!cap && this.travellers.filter(t => t !== this.active && this.where[t] === node).length >= cap; }
  // Every node the active traveller can walk to from here, found in one sweep.
  reach() {
    const edges = this.edges(), seen = new Set([this.at]), queue = [this.at];
    for (let i = 0; i < queue.length; i++) for (const e of edges) {
      const at = queue[i], next = e.a === at ? e.b : e.b === at && !e.oneWay ? e.a : null;
      if (next && !seen.has(next) && !this.full(next)) { seen.add(next); queue.push(next); }
    }
    seen.delete(this.at); return seen;
  }
  riding(id, who = this.active) { return this.data.nodes[this.where[who]].arm === id; }
  // A mechanism is worked by hand: from a node that holds one of its levers, or (unless it says otherwise) from its own arm.
  canTurn(id) {
    const m = this.data.mechs[id];
    if (!m || this.won) return false;
    // Root access: Mark can work anything that has a lever, from wherever he stands.
    if (this.root && this.active === 'one' && m.from?.length) return true;
    return (!m.only || m.only === kind(this.active)) && (!m.from || m.from.includes(this.at) || (m.ride !== false && this.riding(id)));
  }
  rotate(id, by) { const n = this.data.mechs[id].states ?? 4; this.mechs[id] = ((this.mechs[id] + by) % n + n) % n; }
  turn(id, dir = 1) {
    const m = this.data.mechs[id];
    if (!this.canTurn(id)) return false;
    this.rotate(id, dir);
    // Gears: turning this one drives the others it is geared to.
    for (const [other, ratio] of Object.entries(m.gear ?? {})) this.rotate(other, ratio * dir);
    return true;
  }
  switch() { const t = this.travellers; if (t.length < 2 || this.won) return false; this.active = t[(t.indexOf(this.active) + 1) % t.length]; return true; }
  select(id) { if (!(id in this.where) || id === this.active || this.won) return false; this.active = id; return true; }
  visit(node) {
    for (const [item, spec] of Object.entries(this.data.items ?? {})) {
      const at = typeof spec === 'string' ? spec : spec.at, needs = spec.needs;
      if (at === node && (!needs || this.items.has(needs))) this.items.add(item);
    }
  }
  arrive(to) {
    const path = this.path(to);
    if (!path) return false;
    path.forEach(n => this.visit(n));
    this.at = to;
    this.check();
    return true;
  }
  check() {
    const g = this.data.goal, there = g.all ? this.travellers.every(t => this.where[t] === g.node) : this.at === g.node;
    if (there && (g.needs ?? []).every(i => this.items.has(i))) this.won = true;
  }
  clone() {
    const c = new Chapter(this.data);
    c.where = { ...this.where }; c.active = this.active; c.mechs = { ...this.mechs }; c.items = new Set(this.items); c.won = this.won; c.root = this.root;
    return c;
  }
  // Who is selected does not matter to the puzzle, and two children (or two adults) are interchangeable,
  // so a state is its mechanisms, its items, and where the adults and the children stand.
  key() {
    const spots = k => this.travellers.filter(t => kind(t) === k).map(t => this.where[t]).sort();
    return JSON.stringify([spots('adult'), spots('child'), this.mechs, [...this.items].sort(), this.won]);
  }
  // Every move open to anyone. Each names who makes it; choosing a traveller costs nothing.
  moves() {
    const out = [], was = this.active, seen = new Set(), turned = new Set();
    for (const who of this.travellers) {
      const tag = `${kind(who)}@${this.where[who]}`; if (seen.has(tag)) continue; seen.add(tag);
      this.active = who;
      for (const to of this.reach()) out.push({ type: 'walk', who, to });
      for (const id of Object.keys(this.data.mechs)) if (!turned.has(id) && this.canTurn(id)) { turned.add(id); for (const dir of [1, -1]) out.push({ type: 'turn', who, id, dir }); }
    }
    this.active = was;
    return out;
  }
  apply(move) {
    if (move.type === 'switch') return this.switch();
    if (move.who) this.active = move.who;
    return move.type === 'walk' ? this.arrive(move.to) : this.turn(move.id, move.dir);
  }
  // A shortest solution from here, as a list of moves; empty when already complete, null if there is none.
  solve() {
    if (this.won) return [];
    const start = this.clone(), nodes = [{ state: start, parent: -1, move: null }], seen = new Set([start.key()]);
    for (let i = 0; i < nodes.length; i++) {
      const { state } = nodes[i];
      if (state.won) { const out = []; for (let k = i; nodes[k].parent >= 0; k = nodes[k].parent) out.unshift(nodes[k].move); return out; }
      for (const move of state.moves()) {
        const next = state.clone();
        if (!next.apply(move)) continue;
        const key = next.key(); if (seen.has(key)) continue;
        seen.add(key); nodes.push({ state: next, parent: i, move });
      }
    }
    return null;
  }
  // The first move of a shortest solution, or null when already complete. The plan is kept, so following the
  // hints one after another costs one search, not one search per move.
  hint() {
    if (this.won) return null;
    const key = this.key();
    if (this.asked?.key === key) return this.asked.move;
    if (this.plan?.key !== key || !this.plan.moves.length) { const moves = this.solve(); if (!moves) return null; this.plan = { key, moves }; }
    const move = this.plan.moves[0], after = this.clone(); after.apply(move);
    this.plan = { key: after.key(), moves: this.plan.moves.slice(1), from: key, first: move };
    // Remember this answer too, so asking twice before moving gives the same move without a new search.
    this.asked = { key, move };
    return move;
  }
}
