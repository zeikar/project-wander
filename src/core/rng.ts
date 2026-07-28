// Seeded random source (mulberry32). Pure: the same state in always yields the
// same result out, and the caller threads `nextState` forward by hand. No
// module-level state, so tests and journeys stay reproducible.

export interface RollResult {
  value: number; // in [0, 1)
  nextState: number; // pass to the next roll
}

export function rollRandom(state: number): RollResult {
  const nextState = (state + 0x6d2b79f5) >>> 0;
  let t = nextState;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return { value: ((t ^ (t >>> 14)) >>> 0) / 0x100000000, nextState };
}
