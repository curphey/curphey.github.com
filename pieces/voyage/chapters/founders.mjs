// Chapter 2: the Founder's Building. Grid units; y is up; the camera sits towards +x +y +z.
// Mechanism states: 0 east, 1 south, 2 west, 3 north.
export const founders = {
  id: 'founders', number: 2, title: 'Egham', palette: 'founders',
  place: 'Mark', subtitle: ["The Founder's Building, Royal Holloway.", 'Two quadrangles and a hundred chimneys.'],
  start: 'gate',
  // Plan: long ranges run along z at x = +-8, short end ranges along x at z = +-12, the low cross range along x at z = 0.
  // Quad floors are y 0, the cross-range ridge walk y 3, the clock tower gallery y 7.
  nodes: {
    gate: { pos: [-3, 0, -10], label: 'the far door' },
    cloister: { pos: [-3, 0, -7], label: 'the end of the chequered path' },
    bridge: { arm: 'garden', label: 'the lantern bridge' },
    tower: { pos: [0, 3, 0], label: 'the lantern' },
    balcony: { pos: [4, 3, 0], label: 'the library door' },
    roof: { pos: [-4, 3, 0], label: 'the ridge walk' },
    steps: { pos: [-4, 3, 1], label: 'the head of the steps' },
    roofEnd: { pos: [-4, 0, 4], label: 'the foot of the steps' },
    gallery: { arm: 'clock', label: 'the clock gallery' },
    belfry: { pos: [0, 7, 12], label: 'the clock tower' }
  },
  mechs: {
    garden: { hub: [0, 3, 0], length: 3, start: 1, label: 'the lantern', from: ['cloister', 'tower'], gear: { clock: 1 } },
    clock: { hub: [0, 7, 12], length: 3, start: 1, label: 'the clock tower', from: ['balcony', 'belfry'] }
  },
  edges: [
    { a: 'gate', b: 'cloister', kind: 'solid' },
    { a: 'cloister', b: 'bridge', kind: 'apparent', step: [0, 0, 1], when: { garden: 3 } },
    { a: 'bridge', b: 'tower', kind: 'solid' },
    { a: 'bridge', b: 'balcony', kind: 'solid', when: { garden: 0 } },
    { a: 'bridge', b: 'roof', kind: 'solid', when: { garden: 2 } },
    { a: 'roof', b: 'steps', kind: 'solid' },
    { a: 'steps', b: 'roofEnd', kind: 'solid' },
    { a: 'roofEnd', b: 'gallery', kind: 'apparent', step: [0, 0, 1], when: { clock: 0 } },
    { a: 'gallery', b: 'belfry', kind: 'solid' }
  ],
  items: { key: 'roofEnd', book: { at: 'balcony', needs: 'key' } },
  egg: [-2.4, 0, 7.6], marg: [-2.1, 0, -9.4],
  goal: { node: 'belfry', needs: ['book'] },
  word: 'two', next: 'pier', passage: 'Years pass. Then a train south, to the sea.', goalText: 'Get Mark to the clock tower, with the book from the library.',
  text: {
    start: 'Morning in the quad. Tap a path to walk it, and tap a lever to work it.',
    won: 'The bells ring out across the quad.',
    turned: 'Stone grinds, and the view rearranges itself.',
    carried: 'The bridge carries you round with it.',
    geared: 'Somewhere across the roofs, something else moves too.',
    'item:key': 'A key, hanging at the foot of the steps. You pocket it.',
    'item:book': 'The door opens. A book lies waiting, and you take it with you.',
    'locked:balcony': 'The library door is locked.',
    'goal-empty': 'The lectern in the belfry is empty.'
  },
  finish: { title: 'The bells ring out.', body: 'Next, the sea, and someone coming the other way.' },
  scale: [196, 220, 261.63, 293.66, 329.63, 392, 440, 523.25] // G major pentatonic-ish, morning
};
