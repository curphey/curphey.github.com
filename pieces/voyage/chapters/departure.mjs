// Chapter 7: Brighton again, at sunset. The pier is mended and Disco Volante lies at its end.
// The two travellers walk out, go aboard, and she sails. The rides stand still; nothing needs solving.
export const departure = {
  id: 'departure', number: 8, word: 'eight', title: 'Brighton, and Away', palette: 'departure', place: 'Mark and Cara', puzzle: false,
  subtitle: ['The same pier, at the end of the day.', 'Disco Volante is waiting at the far rail.'],
  goalText: 'Walk Mark and Cara out along the pier and aboard Disco Volante.',
  travellers: { one: 'gate', two: 'gate' },
  nodes: {
    gate: { pos: [-16, 0, 0], label: 'the pier gate' },
    plaza: { pos: [5, 0, 0], label: 'the pier head' },
    round: { pos: [9, 0, 4.6], label: 'the rail by the carousel' },
    seaside: { pos: [13, 0, 0], label: 'the far rail' },
    berth: { pos: [19, 0, 0], label: 'the end of the pier' },
    aboard: { arm: 'voyage', label: 'Disco Volante' }
  },
  mechs: {
    carousel: { hub: [9, 0, 0], length: 3, start: 0, label: 'the carousel', from: [], ride: false },
    wheel: { hub: [3, 5, 5], length: 3, axis: 'z', start: 1, label: 'the big wheel', from: [], ride: false },
    voyage: { track: [[21.5, -2.52, 0], [50, -2.52, -36]], states: 2, start: 0, label: 'the mooring lines', from: [], ride: false, glide: 30 }
  },
  edges: [
    { a: 'gate', b: 'plaza', kind: 'solid' }, { a: 'plaza', b: 'round', kind: 'solid' }, { a: 'round', b: 'seaside', kind: 'solid' },
    { a: 'seaside', b: 'berth', kind: 'solid' }, { a: 'berth', b: 'aboard', kind: 'solid' }
  ],
  egg: [-21, 3.5, 0], marg: [18.1, 0, 0.9],
  goal: { node: 'aboard', all: true }, finale: 'voyage',
  text: {
    start: 'Sunset on the pier. The starlings are coming in to roost.',
    won: 'Lines off. She turns her bows to the sun.',
    'at:plaza': 'MM, still cut into the planks.',
    'at:berth': 'A gangway down to the deck.',
    'at:aboard': 'Aboard.',
    blocked: 'Not that way.'
  },
  finish: { eyebrow: 'Voyage complete', title: 'Fair winds.', body: 'Three lights at the masthead, and the whole sea ahead.' },
  music: { pace: 1.2, warmth: 1.15, level: 1.15 }, // the score: how slow, how open
  scale: [174.61, 220, 261.63, 293.66, 349.23, 392, 440, 523.25]
};
