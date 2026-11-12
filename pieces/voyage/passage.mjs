// The passage between two chapters: the world dissolves into coloured mist while the camera glides on,
// a line of travel appears, and the next chapter clears out of the mist. Pure timing; world.js draws it.
export const LEAVE = 2.6, HOLD = 3.4, ARRIVE = 2.8;
const clamp = v => Math.min(1, Math.max(0, v)), ease = t => { t = clamp(t); return t * t * (3 - 2 * t); };
// Leaving: veil 0 -> 1, the mist colour mixing from this chapter's towards the next, the line fading in and out.
export function leaving(t, still = false) {
  if (still) return { veil: 1, glide: 1, mix: 1, text: 0, done: true };
  const total = LEAVE + HOLD;
  return { veil: ease(t / LEAVE), glide: ease(t / total), mix: ease((t - LEAVE * 0.5) / HOLD), text: ease((t - LEAVE * 0.7) / 1.0) * (1 - ease((t - (total - 0.9)) / 0.9)), done: t >= total };
}
// Arriving: the reverse, with no line.
export function arriving(t, still = false) {
  if (still) return { veil: 0, glide: 0, done: true };
  return { veil: 1 - ease(t / ARRIVE), glide: 1 - ease(t / ARRIVE), done: t >= ARRIVE };
}
