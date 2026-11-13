import { people } from './people.mjs';
// Status lines describe what just happened. Only hintText names a move. Chapters supply their own lines.
const common = {
  blocked: 'The way does not join. Something here must move.',
  turned: 'It turns, and the view rearranges itself.',
  carried: 'It carries you round with it.',
  geared: 'Somewhere else, something moves too.',
  far: 'You cannot reach that from here.',
  hacked: 'Mark hacks it from where he stands.',
  marg: 'Marg. She yaps once, and looks very pleased with herself.',
  flag: 'Up goes the black flag, just for a moment.',
  switched: 'The other traveller looks up.'
};
export function status(model, event = 'start') {
  const text = model.data.text ?? {};
  if (model.won) return text.won ?? 'Done.';
  return text[event] ?? common[event] ?? `You reach ${model.data.nodes[model.at].label}.`;
}
const way = dir => (dir > 0 ? 'clockwise' : 'anticlockwise');
export function hintText(model, move) {
  if (!move) return 'There is nothing left to do here.';
  if (move.type === 'switch') return 'Switch to the other traveller.';
  const who = model.travellers.length > 1 && move.who ? `${people[move.who].name}: ` : '', m = model.data.mechs[move.id];
  // A tap only turns a thing one way, so the other way is said as a drag, or as so many taps.
  const taps = m && !m.verb && move.dir < 0 ? (m.states ?? 4) - 1 : 0, times = ['', 'once', 'twice', 'three times', 'four times', 'five times'][taps] ?? `${taps} times`;
  const what = move.type === 'walk' ? `walk to ${model.data.nodes[move.to].label}.` : m.verb ? `${m.verb.toLowerCase()} ${m.label}.` : taps ? `turn ${m.label} ${way(move.dir)}: drag it, or tap it ${times}.` : `turn ${m.label} ${way(move.dir)}.`;
  return who + (who ? what : what[0].toUpperCase() + what.slice(1));
}
