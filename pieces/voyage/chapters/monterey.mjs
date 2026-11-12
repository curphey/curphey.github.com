// Scene 5: Monterey, at the aquarium, where the fourth of them joins. Ground floor is y 0, the mezzanine y 3,
// the top of the kelp tank and the back of the hanging whale y 6.
//  - The diver's cage on the front of the kelp tank is worked from the hall, never from inside.
//  - The grey whale hangs from the roof and turns. Its back is a walkway; from the mezzanine its tail can lie
//    like the next step, though it hangs far out and three storeys higher.
//  - The door to the sea deck stays open only while someone stands on the plate at the top of the tank.
//  - Children can take the crawl tunnel up to the jellies, and the slides down to the sea deck. Adults cannot.
export const monterey = {
  id: 'monterey', number: 5, word: 'five', title: 'Monterey', palette: 'monterey',
  next: 'needle', passage: 'North, a long way north, into the rain.',
  subtitle: ['The aquarium on Cannery Row, where the kelp forest stands three storeys high.', 'Now there are four.'],
  goalText: 'Get all four out to the sea deck: Mark, Cara, Jack and [REDACTED].',
  travellers: { one: 'entry', two: 'entry', three: 'entry', four: 'entry' },
  nodes: {
    entry: { pos: [-6, 0, 3], label: 'the way in' },
    hall: { pos: [-1, 0, 3], label: 'the hall by the kelp tank' },
    cage: { arm: 'cage', label: "the diver's cage" },
    mezz: { pos: [1, 3, 3], label: 'the mezzanine' },
    tail: { arm: 'whale', label: "the whale's tail" },
    back: { pos: [5, 6, 3], label: "the whale's back" },
    surface: { pos: [1, 6, 3], label: 'the top of the kelp tank' },
    jellies: { pos: [5, 3, 1], label: 'the jellies' },
    deck: { pos: [6, 0, 6], label: 'the sea deck' }
  },
  mechs: {
    cage: { track: [[0, 0, 3], [0, 3, 3]], states: 2, start: 0, label: "the diver's cage", verb: 'Send', from: ['hall'], ride: false },
    whale: { hub: [5, 6, 3], length: 3, start: 3, label: 'the whale', from: ['jellies'] }
  },
  edges: [
    { a: 'entry', b: 'hall', kind: 'solid' },
    { a: 'hall', b: 'cage', kind: 'solid', when: { cage: 0 } },
    { a: 'cage', b: 'mezz', kind: 'solid', when: { cage: 1 } },
    { a: 'mezz', b: 'tail', kind: 'apparent', step: [1, 0, 0], when: { whale: 1 } },
    { a: 'tail', b: 'back', kind: 'solid' },
    { a: 'tail', b: 'surface', kind: 'solid', when: { whale: 2 } },
    { a: 'hall', b: 'deck', kind: 'solid', plate: 'surface' },                     // the sea door
    { a: 'hall', b: 'jellies', kind: 'solid', hidden: true, only: 'child' },         // the crawl tunnel
    { a: 'jellies', b: 'deck', kind: 'solid', only: 'child', oneWay: true },         // a slide, down only
    { a: 'surface', b: 'deck', kind: 'solid', only: 'child', oneWay: true },         // the long slide, down only
    { a: 'deck', b: 'hall', kind: 'solid', hidden: true, only: 'child' }             // the otter flap, back inside
  ],
  egg: [7.9, 0, 7.5], marg: [-7.4, 0, 3.9],
  goal: { node: 'deck', all: true },
  text: {
    start: 'Blue light, and the kelp swaying behind three storeys of glass.',
    won: 'All four on the sea deck, with otters in the kelp below.',
    'turned:cage': 'The cage rattles along the front of the tank.',
    'turned:whale': 'High overhead, the grey whale swings slowly round.',
    carried: 'The whale carries you round, high above the hall.',
    'at:jellies': 'Up the crawl tunnel, into the dark, where the jellies glow. A lever here turns the whale.',
    'at:surface': 'A brass plate at the top of the tank. Below, the sea door slides open.',
    'at:mezz': 'The mezzanine. Out in the air beyond the rail, the whale hangs.',
    far: 'It will not work from here.',
    blocked: 'The door is shut, or the way is too small, or it is not there yet.'
  },
  finish: { title: 'Four, at the edge of the bay.', body: 'North next, and one more to come.' },
  scale: [220, 246.94, 277.18, 329.63, 369.99, 440, 493.88, 554.37]
};
