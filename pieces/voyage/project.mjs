// The camera looks along (-1,-1,-1). Two points share a screen position exactly
// when they differ by a multiple of (1,1,1). Everything about the illusion rests on this.
export const TOWARD_CAMERA = [1, 1, 1];
export const project = ([x, y, z]) => [(x - z) / Math.SQRT2, (2 * y - x - z) / Math.sqrt(6)];
export const depth = ([x, y, z]) => (x + y + z) / Math.sqrt(3);
// If b sits one walkway step beyond a on screen, returns how far b is lifted towards the camera; otherwise null.
export function lift(a, b, step) {
  const d = b.map((v, i) => v - a[i] - step[i]);
  return Math.abs(d[0] - d[1]) < 1e-9 && Math.abs(d[1] - d[2]) < 1e-9 ? d[0] : null;
}
export const aligned = (a, b, step) => lift(a, b, step) !== null;
