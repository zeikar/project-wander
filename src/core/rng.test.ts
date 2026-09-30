import { describe, expect, it } from "vitest";
import { rollRandom } from "./rng";

describe("rollRandom", () => {
  // Golden roll: pins the exact mulberry32 algorithm so an accidental change to
  // the arithmetic breaks here rather than silently re-rolling every journey.
  it("produces the pinned result for state 1", () => {
    expect(rollRandom(1)).toEqual({
      value: 0.6270739405881613,
      nextState: 1831565814,
    });
  });

  it("is pure: the same state always yields the same result", () => {
    expect(rollRandom(4242)).toEqual(rollRandom(4242));
  });

  it("chains: 100 rolls all stay in [0, 1) and keep moving the uint32 state", () => {
    let state = 1;

    for (let i = 0; i < 100; i++) {
      const roll = rollRandom(state);

      expect(roll.value).toBeGreaterThanOrEqual(0);
      expect(roll.value).toBeLessThan(1);
      expect(roll.nextState).not.toBe(state);
      expect(Number.isInteger(roll.nextState)).toBe(true);
      expect(roll.nextState).toBeGreaterThanOrEqual(0);
      expect(roll.nextState).toBeLessThanOrEqual(0xffffffff);

      state = roll.nextState;
    }
  });
});
