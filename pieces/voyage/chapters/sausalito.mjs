// Scene 7: Mill Valley again, down on Richardson Bay at Sausalito, under Mount Tamalpais, where the children
// learned to sail. All five are trying to reach the roof deck of the last houseboat on the pier, where the bands
// used to play. Docks are y 0; the roof deck is y 3.
//  - Two sailing dinghies. Only children fit, and only a child aboard can sail one. The little one seats two and
//    runs between the club dock and the racing mark; the bigger one seats three and runs from the mark to the houseboat.
//  - The adults walk the pier; the children are sent to sail. It stops short of the houseboat; the houseboat's davit, worked from the roof deck,
//    can lie like the next plank of the pier although it hangs three storeys up and well off to one side.
export const sausalito = {
  id: 'return', number: 7, word: 'seven', title: 'Mill Valley, by the Bay', palette: 'return',
  next: 'departure', passage: 'Years on, and home across the ocean, to where it began.',
  subtitle: ['Richardson Bay, under Mount Tam, where the children learned to sail.', 'At the end of the pier, the houseboat where the bands used to play.'],
  goalText: 'Get all five to the roof deck of the last houseboat: Mark, Cara, Jack, [REDACTED] and Gabe.',
  travellers: { one: 'club', two: 'club', three: 'club', four: 'club', five: 'club' },
  nodes: {
    club: { pos: [-9, 0, 0], label: 'the yacht club dock' },
    pram: { arm: 'pram', cap: 2, label: 'the little dinghy' },
    mark: { pos: [2, 0, 8], label: 'the racing mark' },
    skiff: { arm: 'skiff', cap: 3, label: 'the bigger dinghy' },
    stern: { pos: [13, 0, 6], label: "the houseboat's stern" },
    roof: { pos: [13, 3, 3], label: 'the roof deck' },
    boom: { arm: 'davit', label: 'the davit' },
    pier: { pos: [6, 0, 0], label: 'the end of the pier' }
  },
  mechs: {
    pram: { track: [[-9, 0, 1], [1, 0, 8]], states: 2, start: 0, label: 'the little dinghy', verb: 'Sail', from: [], only: 'child', glide: 5 },
    skiff: { track: [[3, 0, 8], [13, 0, 7]], states: 2, start: 0, label: 'the bigger dinghy', verb: 'Sail', from: [], only: 'child', glide: 5 },
    davit: { hub: [13, 3, 3], length: 3, start: 0, label: 'the davit', from: ['roof'] }
  },
  edges: [
    { a: 'club', b: 'pier', kind: 'solid' },
    { a: 'club', b: 'pram', kind: 'solid', when: { pram: 0 }, only: 'child' },
    { a: 'pram', b: 'mark', kind: 'solid', when: { pram: 1 }, only: 'child' },
    { a: 'mark', b: 'skiff', kind: 'solid', when: { skiff: 0 }, only: 'child' },
    { a: 'skiff', b: 'stern', kind: 'solid', when: { skiff: 1 }, only: 'child' },
    { a: 'stern', b: 'roof', kind: 'solid' },
    { a: 'roof', b: 'boom', kind: 'solid' },
    { a: 'pier', b: 'boom', kind: 'apparent', step: [1, 0, 0], when: { davit: 2 }, only: 'adult' } // the children are to sail, not walk
  ],
  egg: [14.45, 3.7, 1.45], marg: [-11.4, 0.65, -1.7],
  goal: { node: 'roof', all: true },
  text: {
    start: 'Evening light on the bay, and Mount Tam dark above the town. Five of them on the yacht club dock.',
    won: 'All five on the roof deck, with the sun going down behind the mountain.',
    marg: 'Marg. Mill Valley is where she joined the family, and she yaps once to say so.', // Mark: Marg came in San Francisco, not Seattle
    'turned:pram': 'The little dinghy heels and goes.', 'turned:skiff': 'The bigger dinghy fills her sail and goes.',
    'turned:davit': 'The davit swings out over the water.',
    carried: 'The davit carries you round, high over the water.',
    'at:mark': 'The racing mark: a raft and a bell, a long way from anywhere.',
    'at:roof': 'The roof deck. A guitar, an old amplifier, and a wheel that works the davit.',
    'at:pier': 'The pier stops short. The houseboat lies off its end.',
    far: 'It will not work from here, or not for you.',
    blocked: 'No way there: the boat is full, or too small, or the planks stop.'
  },
  finish: { title: 'Five, on the roof deck.', body: 'One last passage, and then home waters.' },
  music: { pace: 1.1, warmth: 1 }, // the score: how slow, how open
  scale: [196, 220, 246.94, 293.66, 329.63, 369.99, 440, 493.88]
};
