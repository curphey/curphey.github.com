// Chapter 3: Brighton Pier. The pier runs along x, from the beach (negative x) out to the pier head. Deck level is y 0.
// Two travellers: one at the shore gate, one at the far rail. Nothing on the pier can be turned from the shore.
//  - The carousel has two boarding steps, opposite each other. Its engine also drives the big wheel.
//  - It is turned by riding it, or from the lever by the helter-skelter door.
//  - Two brass plates each hold something open only while a traveller stands on them.
export const pier = {
  id: 'pier', number: 3, word: 'three', title: 'Brighton', palette: 'pier', place: 'Mark and Cara',
  subtitle: ['The Palace Pier. Mark at one end, Cara at the other.', 'Everything between them turns.'],
  goalText: 'Bring Mark and Cara together at the pier head.', next: 'bridge', passage: 'Then a long flight west, to a city of hills and fog.',
  travellers: { one: 'gate', two: 'seaside' },
  nodes: {
    gate: { pos: [-16, 0, 0], label: 'the pier gate' },
    kiosk: { pos: [-6, 0, 0], label: 'the end of the planks' },
    car0: { arm: 'wheel', slot: 0, label: 'the red gondola' },
    car1: { arm: 'wheel', slot: 1, label: 'the blue gondola' },
    car2: { arm: 'wheel', slot: 2, label: 'the yellow gondola' },
    car3: { arm: 'wheel', slot: 3, label: 'the white gondola' },
    lookout: { pos: [7, 5, 5], label: 'the lookout' },
    wheelBase: { pos: [3, 2, 4], label: 'the wheel platform' },
    wheelFoot: { pos: [3, 0, 2], label: 'the foot of the wheel' },
    plaza: { pos: [5, 0, 0], label: 'the pier head' },
    step0: { arm: 'carousel', slot: 0, label: 'the gold step' },
    step2: { arm: 'carousel', slot: 2, label: 'the silver step' },
    skelter: { pos: [9, 0, -4], label: 'the helter-skelter door' },
    skelterTop: { pos: [9, 5.72, -4.4], label: 'the top of the helter-skelter' },
    seaside: { pos: [13, 0, 0], label: 'the far rail' }
  },
  mechs: {
    carousel: { hub: [9, 0, 0], length: 3, start: 0, label: 'the carousel', from: ['skelter'], gear: { wheel: 1 } },
    wheel: { hub: [3, 5, 5], length: 3, axis: 'z', start: 1, label: 'the big wheel', from: [], ride: false }
  },
  edges: [
    { a: 'gate', b: 'kiosk', kind: 'solid' },
    // A gondola at nine o'clock hangs far out over the water, yet on screen it is the next plank along.
    // The barrier there lifts only while someone holds the plate at the top of the helter-skelter.
    ...[0, 1, 2, 3].map(k => ({ a: 'kiosk', b: `car${k}`, kind: 'apparent', step: [1, 0, 0], when: { wheel: (2 - k + 4) % 4 }, plate: 'skelterTop' })),
    ...[0, 1, 2, 3].map(k => ({ a: `car${k}`, b: 'lookout', kind: 'solid', when: { wheel: (4 - k) % 4 } })),
    ...[0, 1, 2, 3].map(k => ({ a: `car${k}`, b: 'wheelBase', kind: 'solid', when: { wheel: (1 - k + 4) % 4 } })),
    // The gate at the head of the wheel steps wants the key, and opens only while the plate at the far rail is held.
    { a: 'wheelBase', b: 'wheelFoot', kind: 'solid', needs: 'key', plate: 'seaside' },
    { a: 'wheelFoot', b: 'plaza', kind: 'solid' },
    ...[0, 2].flatMap(s => [
      { a: 'plaza', b: `step${s}`, kind: 'solid', when: { carousel: (2 - s + 4) % 4 } },
      { a: `step${s}`, b: 'skelter', kind: 'solid', when: { carousel: (3 - s + 4) % 4 } },
      { a: `step${s}`, b: 'seaside', kind: 'solid', when: { carousel: (4 - s) % 4 } }
    ]),
    { a: 'skelter', b: 'skelterTop', kind: 'solid', hidden: true }
  ],
  items: { key: 'lookout' },
  motes: '#ff9db0',
  egg: [10.6, 1.42, -8], marg: [4.5, 0, -1.4],
  goal: { node: 'plaza', all: true },
  text: {
    start: 'Midday on the pier. Tap Mark or Cara to choose who moves.',
    won: 'Mark and Cara meet at the pier head, with the whole sea behind them.',
    turned: 'The organ wheezes into life. Across the deck, the big wheel turns with it.',
    carried: 'Round you go, and the big wheel turns in step.',
    geared: 'The carousel turns, and the big wheel turns with it.',
    'item:key': 'A key on a hook, high above the deck. You take it.',
    'at:skelterTop': 'Up the stairs inside. A brass plate sinks under your feet, and far down the pier a barrier lifts.',
    'at:skelter': 'Round and round, and out onto the mat.',
    'at:seaside': 'A brass plate sinks under your feet. By the wheel, a gate swings open.',
    'at:wheelBase': 'A gate bars the steps down.',
    'at:kiosk': 'The planks stop here. A barrier stands across the gap.',
    far: 'It will not move from here.',
    blocked: 'The way is shut, or does not join.'
  },
  finish: { title: 'Met on the pier.', body: 'MM, cut into the planks where they stand.' },
  scale: [261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25] // C major pentatonic, bright
};
