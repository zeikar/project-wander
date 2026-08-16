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

// Read off the SOURCE TEXT rather than off behaviour, which no other test in
// this repo does, so the departure needs its reasons written down. The salts
// are deliberately not exported: each is an implementation detail of the one
// module that reads it, and each sits directly under the comment naming the
// question it anchors. Exporting nine constants, or gathering them into a
// shared module away from those comments, is a larger change than this guard
// is worth — and two equal salts leave every behavioural assertion in this
// suite green, so there is nothing cheaper to observe.
//
// What it protects is not the declarations, it is the INDEPENDENCE of the
// questions they anchor. A salt opens a side-stream off `state.rngState` or off
// `state.seed`, and on leg 0 those are the same number — so two equal salts
// silently weld two unrelated questions into one answer. A leg's fork and the
// journey's opening sky would agree on every single seed, and each stream would
// still be uniform, still seeded, still reproducible, with nothing to fail.
//
// `src/core/` is the whole search scope, and that is correct today rather than
// by construction: `src/content/` imports nothing from core and calls
// `rollRandom` nowhere, so no salt exists outside this folder. A salt authored
// in content later is a KNOWN BLIND SPOT of this test, not an impossibility.
describe("core salts", () => {
  it("every seeded side-stream is anchored on a distinct salt", () => {
    // Read through Vite's raw glob rather than `node:fs`, for a boring reason:
    // this project carries no `@types/node` and its `tsconfig` types are
    // `["vite/client"]`, so the filesystem is the one thing a test here cannot
    // type. The glob is the same scan — every non-test source file in this
    // folder and any folder under it — with no dependency added for it.
    const sources = import.meta.glob<string>("./**/*.ts", {
      query: "?raw",
      import: "default",
      eager: true,
    });
    const declarations = Object.entries(sources)
      .filter(([path]) => !path.endsWith(".test.ts"))
      .flatMap(([, source]) => [
        // Decimal accepted as well as hex, and not for tidiness: a salt written
        // `2146121005` instead of `0x7feb352d` is the same number to the
        // reducer and invisible to a hex-only scan, so it would sit OUTSIDE the
        // collision check below — exactly the one thing this test exists to
        // catch. Hex is tried first, or `0x…` would match as a bare `0`.
        ...source.matchAll(/const (\w+SALT) = (0x[0-9a-fA-F]+|\d+)/g),
      ])
      .map((match) => ({ name: match[1]!, value: Number(match[2]) }));

    // The scan has to have FOUND something before its emptiness can mean
    // anything. A rename, a file moved into a shape this regex misses — either
    // would leave an empty set that satisfies "pairwise distinct" perfectly,
    // which is the shape of test this repo has already been bitten by three
    // times. Nine ship today, and the floor is nine rather than a comfortable
    // margin below it: slack here is not caution, it is the number of salts the
    // scan may silently lose before anything says so.
    expect(declarations.length).toBeGreaterThanOrEqual(9);

    // The floor above only guards the salts that ship TODAY, and that is not
    // enough on its own. Add a TENTH in a shape the strict pattern cannot read
    // — a type annotation, a numeric separator, a value built rather than
    // written — and nine are still found, nine still clears the floor, and the
    // new salt sits outside the collision check with nothing to say so. So the
    // strict scan is checked against a second, deliberately loose one that has
    // to recognise only that a salt is being DECLARED and never what it is
    // worth. Anything the loose scan sees and the strict scan could not parse
    // is reported by name, which is the failure the count alone cannot give.
    // This is what keeps the guard honest as the file grows, rather than
    // exporting the constants away from the comments that explain them.
    const declared = Object.entries(sources)
      .filter(([path]) => !path.endsWith(".test.ts"))
      .flatMap(([, source]) => [
        ...source.matchAll(/\b(\w*SALT)\b\s*(?::[^=;]+)?=(?!=)/g),
      ])
      .map((match) => match[1]!);
    expect(
      declared.filter(
        (name) => !declarations.some((parsed) => parsed.name === name),
      ),
    ).toEqual([]);

    const byValue = new Map<number, string[]>();
    for (const { name, value } of declarations) {
      byValue.set(value, [...(byValue.get(value) ?? []), name]);
    }
    // Reported as the colliding NAMES rather than as a count, because the count
    // does not say which two questions were welded together.
    expect([...byValue.values()].filter((names) => names.length > 1)).toEqual(
      [],
    );
  });
});
