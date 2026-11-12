// Scene 6: Seattle, where Gabe joins and there are five. The Space Needle stands at the origin; the ground is y 0,
// the mid ring y 5, the saucer y 10.
//  - The lift is worked only from the kiosk at the foot of the Needle, never from inside.
//  - The lift's cable also turns the saucer: every stop the lift moves, the saucer turns a quarter.
//  - The door at the top opens only while someone stands on the brass plate at the mid ring.
//  - From the mid ring you set the saucer, and open the sluice that lets the rain fill the pool.
//  - Once the pool is full, a child can cross it, climb inside the white arches and run out along the skybridge,
//    where the saucer's rim can lie like the next step. That way is too small for an adult.
export const needle = {
  id: 'needle', number: 6, word: 'six', title: 'Seattle', palette: 'needle',
  next: 'return', passage: 'South again, home to Mill Valley.',
  subtitle: ['Rain on the plaza, and the Space Needle gone soft in it.', 'Now there are five.'],
  goalText: 'Get all five to the top of the Needle: Mark, Cara, Jack, [REDACTED] and Gabe.',
  travellers: { one: 'lobby', two: 'lobby', three: 'lobby', four: 'lobby', five: 'lobby' },
  nodes: {
    lobby: { pos: [2, 0, 0], label: 'the foot of the Needle' },
    car: { arm: 'lift', label: 'the lift' },
    ring: { pos: [2, 5, 0], label: 'the mid ring' },
    crown: { pos: [0, 10, 0], label: 'the top of the Needle' },
    rim: { arm: 'saucer', label: 'the rim of the saucer' },
    skyEnd: { pos: [-9, 5, -5], label: 'the end of the skybridge' }
  },
  mechs: {
    lift: { track: [[1, 0, 0], [1, 5, 0], [1, 10, 0]], states: 3, start: 0, label: 'the lift', verb: 'Send on', from: ['lobby'], ride: false, gear: { saucer: 1 } },
    saucer: { hub: [0, 10, 0], length: 3, start: 1, label: 'the saucer', from: ['ring'] }
  },
  edges: [
    { a: 'lobby', b: 'car', kind: 'solid', when: { lift: 0 } },
    { a: 'car', b: 'ring', kind: 'solid', when: { lift: 1 } },
    { a: 'car', b: 'crown', kind: 'solid', when: { lift: 2 }, plate: 'ring' },
    { a: 'crown', b: 'rim', kind: 'solid' },
    { a: 'lobby', b: 'skyEnd', kind: 'solid', hidden: true, only: 'child', needs: 'sluice' },
    { a: 'skyEnd', b: 'rim', kind: 'apparent', step: [1, 0, 0], when: { saucer: 2 }, only: 'child' }
  ],
  items: { sluice: 'ring' },
  egg: [3.05, 1.2, 1.5], marg: [4.6, 0, 2.4],
  goal: { node: 'crown', all: true },
  text: {
    start: 'Rain. The Needle disappears upward into it.',
    won: 'Above the rain at last, all five, and the whole wet city shining below.',
    'turned:lift': 'The lift hums along the core, and high above, the saucer turns with it.',
    'turned:saucer': 'The saucer turns, slow and heavy, on its ring.',
    carried: 'The saucer carries you round above the city.',
    'item:sluice': 'A brass plate underfoot, a lever for the saucer, and a wheel. You spin it, and far below a sluice opens to the rain.',
    'at:ring': 'Halfway up. The plate here holds the top door open.',
    'at:skyEnd': 'Across the pool, up inside the arch, and out along the skybridge. It stops in mid-air.',
    far: 'It will not answer from here.',
    blocked: 'The door is shut, or the way is too small, or it is not there yet.'
  },
  finish: { title: 'Five, above the rain.', body: 'South again soon, to the bridge and the fog.' },
  scale: [174.61, 196, 220, 261.63, 293.66, 349.23, 392, 440]
};
