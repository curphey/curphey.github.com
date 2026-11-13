// Chapter 1: Trinidad. A small island at dawn; one traveller. Boardwalks are y 0; the sea stack and headland are y 4.
// Three steel pans turn like turntables, and each one's turning is passed on:
//   the channel pan drives the stack pan; the jetty pan and the stack pan drive each other.
// So the jetty plank can only be set right by thinking about what the ride on the stack pan will do to it.
export const trinidad = {
  id: 'trinidad', number: 1, word: 'one', title: 'Trinidad', palette: 'trinidad', place: 'Cara', banner: 'Curphey Family Web Site', next: 'founders', timbre: 'pan', passage: 'An ocean away, the same morning.',
  subtitle: ['First light on the bay, and scarlet ibis crossing the lagoon.', 'Down in the pan yard, the steel pans are still asleep.'],
  goalText: 'Get Cara to the boat at the end of the jetty, with the oars and the rope.',
  travellers: { two: 'porch' },
  nodes: {
    porch: { pos: [-10, 0, -2], label: 'the porch steps' },
    westShore: { pos: [-7, 0, -2], label: 'the edge of the channel' },
    plank1: { arm: 'channel', label: 'the channel plank' },
    pan1: { pos: [-4, 0, -2], label: 'the channel pan' },
    sandbar: { pos: [-4, 0, 1], label: 'the sandbar' },
    beach: { pos: [-1, 0, -2], label: 'the beach' },
    fork: { pos: [1, 0, -2], label: 'the bend in the boardwalk' },
    grove: { pos: [2, 0, -2], label: 'the palm grove' },
    plank2: { arm: 'stack', label: 'the stack plank' },
    pan2: { pos: [5, 4, 5], label: 'the stack pan' },
    nest: { pos: [2, 4, 5], label: 'the nest rock' },
    head: { pos: [8, 4, 5], label: 'the headland' },
    jettyRoot: { pos: [8, 0, 9], label: 'the foot of the cliff steps' },
    plank3a: { arm: 'jetty', slot: 0, label: 'one end of the jetty plank' },
    plank3b: { arm: 'jetty', slot: 2, label: 'the other end of the jetty plank' },
    pan3: { pos: [8, 0, 11], label: 'the jetty pan' },
    boat: { pos: [8, 0, 13], label: 'the boat' }
  },
  mechs: {
    channel: { hub: [-4, 0, -2], length: 2, start: 2, label: 'the channel pan', from: ['westShore', 'beach'], gear: { stack: 1 } },
    stack: { hub: [5, 4, 5], length: 2, start: 1, label: 'the stack pan', from: [], gear: { jetty: 1 } },
    jetty: { hub: [8, 0, 11], length: 1, start: 1, label: 'the jetty pan', from: ['grove'], ride: false, gear: { stack: 1 } }
  },
  edges: [
    { a: 'porch', b: 'westShore', kind: 'solid' },
    { a: 'westShore', b: 'plank1', kind: 'solid', when: { channel: 2 } },
    { a: 'plank1', b: 'pan1', kind: 'solid' },
    { a: 'plank1', b: 'sandbar', kind: 'solid', when: { channel: 1 } },
    { a: 'plank1', b: 'beach', kind: 'solid', when: { channel: 0 } },
    { a: 'beach', b: 'fork', kind: 'solid' },
    { a: 'fork', b: 'grove', kind: 'solid' },
    // The stack stands far out in the lagoon and four storeys up, yet its plank can lie where the boardwalk bends.
    { a: 'fork', b: 'plank2', kind: 'apparent', step: [0, 0, 1], when: { stack: 3 } },
    { a: 'plank2', b: 'pan2', kind: 'solid' },
    { a: 'plank2', b: 'nest', kind: 'solid', when: { stack: 2 } },
    { a: 'plank2', b: 'head', kind: 'solid', when: { stack: 0 } },
    { a: 'head', b: 'jettyRoot', kind: 'solid' },
    ...[['plank3a', 0], ['plank3b', 2]].flatMap(([id, k]) => [
      { a: 'jettyRoot', b: id, kind: 'solid', when: { jetty: (3 - k + 4) % 4 } },
      { a: id, b: 'pan3', kind: 'solid' },
      { a: id, b: 'boat', kind: 'solid', when: { jetty: (1 - k + 4) % 4 } }
    ])
  ],
  items: { oars: 'sandbar', rope: 'nest' },
  egg: [7.6, -0.25, -0.9], marg: [-12.1, 0.82, -2.95],
  goal: { node: 'boat', needs: ['oars', 'rope'] },
  text: {
    start: 'Dawn on the lagoon. Tap a plank to walk to it, and tap a lever to work it.',
    won: 'Cara pushes off. The island grows small behind her.',
    turned: 'The pan rings as it turns, and another answers it.',
    carried: 'The pan rings as it carries you round, and another answers it.',
    geared: 'The pan rings as it turns, and another answers it.',
    'item:oars': 'A pair of oars, stuck upright in the sand. You shoulder them.',
    'item:rope': 'A coil of rope, tucked beside an old nest. You take it.',
    'goal-empty': 'The boat rocks at its mooring. Something is still missing.',
    'at:jettyRoot': 'The jetty runs out to a pan on its piles, and the boat beyond.',
    far: 'It rings, but will not turn from here.',
    blocked: 'The boards do not meet.'
  },
  finish: { title: 'Away at first light.', body: 'Across an ocean, someone else is setting out too.' },
  music: { pace: 0.8, warmth: 1.3 }, // the score: how slow, how open
  scale: [261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25]
};
