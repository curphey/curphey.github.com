// Scene 4: Mill Valley, at the Golden Gate. The bridge runs along x, city shore at negative x, the Marin
// shore (and Mill Valley beyond it) at positive x. Deck is y 0, tower tops y 8. The fog decides where anyone can walk:
//   fog 0, lying low: the deck is lost in it, but the tower tops and the cables stand clear above;
//   fog 1, lifted:    the deck is clear, and the tops are in cloud.
// Only a child fits the hatch in the sea wall, where the derrick is worked from; only an adult may ride its boom.
// In scene 4 a child can also scurry along the painters' catwalk under the deck, which no fog reaches.
function build({ id, number, word, palette, travellers, liftPlate, five = false, next, passage, subtitle, goalText, start, won, finish }) {
  return {
    id, number, word, title: 'Mill Valley', palette, next, passage, subtitle, goalText, travellers,
    nodes: {
      fort: { pos: [-13, 0, 0], label: 'the bridge approach' },
      point: { pos: [-16, 0, -5], label: 'the sea wall' },
      hatch: { pos: [-18, 0, -5], label: 'the hatch in the sea wall' },
      boom: { arm: 'derrick', label: 'the derrick boom' },
      topW: { pos: [-7, 8, 0], label: 'the top of the near tower' },
      topE: { pos: [7, 8, 0], label: 'the top of the far tower' },
      mid: { pos: [0, 0, 0], label: 'the middle of the span' },
      marin: { pos: [13, 0, 0], label: 'the far shore' }
    },
    mechs: {
      derrick: { hub: [-7, 8, 0], length: 3, start: 0, label: 'the derrick', from: ['hatch'] },
      fog: { hub: [0, 4, 0], length: 0, states: 2, start: 0, label: 'the foghorn', verb: 'Sound', from: ['point', 'marin', 'topE'], ride: false }
    },
    edges: [
      { a: 'fort', b: 'point', kind: 'solid' },
      { a: 'point', b: 'hatch', kind: 'solid', only: 'child' },
      // From the sea wall the derrick's boom, eight storeys up and far out over the water, lies like the next flagstone.
      { a: 'point', b: 'boom', kind: 'apparent', step: [1, 0, 0], when: { derrick: 1, fog: 0 }, only: 'adult' },
      { a: 'boom', b: 'topW', kind: 'solid' },
      { a: 'topW', b: 'topE', kind: 'solid', when: { fog: 0 } },            // along the main cable
      { a: 'topE', b: 'marin', kind: 'solid', hidden: true, plate: liftPlate }, // the lift, held by someone below
      ...(five ? [
        // Two barriers on the deck, each held open from the top of a tower.
        { a: 'fort', b: 'mid', kind: 'solid', when: { fog: 1 }, plate: 'topW' },
        { a: 'mid', b: 'marin', kind: 'solid', when: { fog: 1 }, plate: 'topE' }
      ] : [
        { a: 'fort', b: 'mid', kind: 'solid', when: { fog: 1 } },
        { a: 'mid', b: 'marin', kind: 'solid', when: { fog: 1 }, plate: 'topW' }, // the roadworks barrier
        { a: 'fort', b: 'marin', kind: 'solid', hidden: true, only: 'child' }      // the catwalk under the deck
      ])
    ],
    egg: [7, 8.9, -0.65], marg: [-14.2, 1.63, 3.7],
  goal: { node: 'marin', all: true },
    text: {
      start, won,
      'turned:derrick': 'The derrick swings round, high above the strait.',
      carried: 'The derrick carries you round, high above the strait.',
      'turned:fog': 'The horn sounds, long and low, and the fog begins to move.',
      'at:hatch': 'A hatch only a child could fit through. Inside, the wheel that works the derrick.',
      'at:topW': 'A brass plate sinks underfoot. Far below, a barrier lifts.',
      'at:topE': five ? 'Another brass plate, and the lift. Far below, a second barrier lifts.' : 'The lift is here. Someone must hold it from below.',
      far: 'It will not work from here.',
      blocked: 'Nobody walks where they cannot see, and some ways are shut or too small.'
    },
    finish,
    scale: [196, 220, 246.94, 293.66, 329.63, 392, 440, 493.88]
  };
}
export const bridge = build({
  id: 'bridge', number: 4, word: 'four', palette: 'bridge', travellers: { one: 'fort', two: 'fort', three: 'fort' }, liftPlate: 'mid',
  next: 'monterey', passage: 'South down the coast, to the aquarium on the bay.',
  subtitle: ['California, just over the Golden Gate.', 'Now there are three, and the fog decides who can go where.'],
  goalText: 'Get Mark, Cara and Jack across the Golden Gate to the far shore.',
  start: 'Fog lies on the water, and the deck is lost in it. The towers stand clear above.',
  won: 'All three across. The fog lets them go.',
  finish: { title: 'Three, across the Gate.', body: 'Home is just over the hill.' }
});
