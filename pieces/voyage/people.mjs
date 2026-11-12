// The family, as they appear in the game. First names only, at Mark's request; nothing else about anyone is recorded.
export const people = {
  one: { name: 'Mark', coat: '#2f4a63', trim: '#c9a35a', legs: '#2a2f38', hat: '#263845', size: 1 },
  two: { name: 'Cara', coat: '#c8553d', trim: '#f1e3c4', legs: '#3a3340', hat: '#f1e3c4', size: 1 },
  three: { name: 'Jack', coat: '#3f8f6a', trim: '#f0c348', legs: '#2f3a44', hat: '#2f6f55', size: 0.78 },
  four: { name: '[REDACTED]', coat: '#8a5fb0', trim: '#f4ecd6', legs: '#3a3340', hat: '#f0c348', size: 0.74 },
  five: { name: 'Gabe', coat: '#e0a030', trim: '#2f6fa8', legs: '#2a2f38', hat: '#2f6fa8', size: 0.7 },
  boat: { name: 'Disco Volante' }
};
// "Mark", "Mark and Cara", "Mark, Cara and Jack".
// Children can use some ways that adults cannot, and the solver treats travellers of one kind as interchangeable.
export const kind = id => ((people[id]?.size ?? 1) < 1 ? 'child' : 'adult');
export const listNames = ids => { const n = ids.map(id => people[id]?.name ?? id); return n.length < 2 ? n[0] : `${n.slice(0, -1).join(', ')} and ${n.at(-1)}`; };
