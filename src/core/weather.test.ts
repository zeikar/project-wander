import { describe, expect, it } from "vitest";
import { signalAt, weatherAt } from "./weather";
import { journey } from "../content/journey";
import {
  WEATHER_MAX_LEGS,
  WEATHER_MIN_LEGS,
  weatherProse,
} from "../content/weather";
import type { Weather } from "../content/weather";

const LEG_COUNT = journey.legs.length;
const FINAL_LEG = LEG_COUNT - 1;
const SEED_COUNT = 500;

// Groups a seed's script into maximal same-weather runs, in order. Used both
// to check run lengths and to check that adjacent runs never share a
// weather — the two properties the block walk is supposed to guarantee.
function weatherRuns(seed: number): Array<{ weather: Weather; length: number }> {
  const runs: Array<{ weather: Weather; length: number }> = [];
  for (let leg = 0; leg < LEG_COUNT; leg++) {
    const weather = weatherAt(seed, leg);
    const last = runs.at(-1);
    if (last && last.weather === weather) {
      last.length += 1;
    } else {
      runs.push({ weather, length: 1 });
    }
  }
  return runs;
}

// A leg is eligible for a signal exactly under the semantics in
// core/weather.ts, derived here independently of `blockAt` — by comparing a
// leg's weather to the one before it — so these tests do not simply restate
// the implementation they are meant to check.
function isEligible(seed: number, legIndex: number): boolean {
  const weather = weatherAt(seed, legIndex);
  const isBlockFirst =
    legIndex === 0 || weatherAt(seed, legIndex - 1) !== weather;
  return (
    (weather === "rain" || weather === "wind") &&
    !isBlockFirst &&
    legIndex < FINAL_LEG
  );
}

describe("weatherAt", () => {
  it("is deterministic: the same seed produces the same script", () => {
    for (const seed of [1, 2, 42, 1000, 7654321]) {
      const first = Array.from({ length: LEG_COUNT }, (_, leg) =>
        weatherAt(seed, leg),
      );
      const second = Array.from({ length: LEG_COUNT }, (_, leg) =>
        weatherAt(seed, leg),
      );
      expect(second).toEqual(first);
    }
  });

  // Block length in {2,3,4}, and a boundary always changes the sky — except
  // the LAST run inside the observed window, which the window can truncate
  // before its true length is ever seen.
  it("keeps every full run 2-4 legs long, with adjacent runs always differing", () => {
    for (let seed = 1; seed <= SEED_COUNT; seed++) {
      const runs = weatherRuns(seed);
      runs.forEach((run, index) => {
        if (index > 0) {
          expect(run.weather).not.toBe(runs[index - 1]!.weather);
        }
        const isLastObserved = index === runs.length - 1;
        if (!isLastObserved) {
          expect(run.length).toBeGreaterThanOrEqual(WEATHER_MIN_LEGS);
          expect(run.length).toBeLessThanOrEqual(WEATHER_MAX_LEGS);
        } else {
          // Truncated by the edge of the window: its true length could be
          // anywhere at or above what was actually observed.
          expect(run.length).toBeGreaterThanOrEqual(1);
          expect(run.length).toBeLessThanOrEqual(WEATHER_MAX_LEGS);
        }
      });
    }
  });

  it("uses all three weathers across enough seeds", () => {
    const seen = new Set<Weather>();
    for (let seed = 1; seed <= SEED_COUNT; seed++) {
      seen.add(weatherAt(seed, 0));
    }
    expect([...seen].sort()).toEqual(["clear", "rain", "wind"]);
  });
});

describe("signalAt", () => {
  it("never fires on a clear leg, a block's first leg, or the journey's final leg", () => {
    let ineligibleChecked = 0;
    for (let seed = 1; seed <= SEED_COUNT; seed++) {
      for (let leg = 0; leg < LEG_COUNT; leg++) {
        if (isEligible(seed, leg)) {
          continue;
        }
        ineligibleChecked += 1;
        // hit=1, falseAlarm=1: if the eligibility gate were not enforced,
        // this would show on every one of these legs regardless of truth.
        expect(signalAt(seed, leg, 1, 1)).toBe(false);
      }
    }
    expect(ineligibleChecked).toBeGreaterThan(0);
  });

  it("at hit=1, falseAlarm=0, shows exactly when eligible and the next leg clears", () => {
    let eligibleChecked = 0;
    for (let seed = 1; seed <= SEED_COUNT; seed++) {
      for (let leg = 0; leg < LEG_COUNT; leg++) {
        const eligible = isEligible(seed, leg);
        if (eligible) {
          eligibleChecked += 1;
        }
        const clears = eligible && weatherAt(seed, leg + 1) === "clear";
        expect(signalAt(seed, leg, 1, 0)).toBe(clears);
      }
    }
    expect(eligibleChecked).toBeGreaterThan(0);
  });

  it("at hit=0, never shows a signal before a clearing", () => {
    let checked = 0;
    for (let seed = 1; seed <= SEED_COUNT; seed++) {
      for (let leg = 0; leg < LEG_COUNT; leg++) {
        if (isEligible(seed, leg) && weatherAt(seed, leg + 1) === "clear") {
          checked += 1;
          expect(signalAt(seed, leg, 0, 1)).toBe(false);
        }
      }
    }
    expect(checked).toBeGreaterThan(0);
  });

  it("at falseAlarm=0, never shows a signal before a non-clearing", () => {
    let checked = 0;
    for (let seed = 1; seed <= SEED_COUNT; seed++) {
      for (let leg = 0; leg < LEG_COUNT; leg++) {
        if (isEligible(seed, leg) && weatherAt(seed, leg + 1) !== "clear") {
          checked += 1;
          expect(signalAt(seed, leg, 1, 0)).toBe(false);
        }
      }
    }
    expect(checked).toBeGreaterThan(0);
  });
});

describe("weatherProse", () => {
  it("gives every sky a non-empty line", () => {
    for (const weather of ["clear", "rain", "wind"] as const) {
      expect(weatherProse[weather].line.length).toBeGreaterThan(0);
    }
  });

  it("carries a signal line for rain and wind only", () => {
    expect(weatherProse.rain.signal).toBeDefined();
    expect(weatherProse.wind.signal).toBeDefined();
    expect(weatherProse.clear.signal).toBeUndefined();
  });

  // The cue's rates are discovered by living under the sky, not read off the
  // screen — the same contract the HP bands and traffic hints keep.
  it("never states a digit or a percentage", () => {
    for (const weather of ["clear", "rain", "wind"] as const) {
      const prose = weatherProse[weather];
      expect(prose.line).not.toMatch(/\d/);
      if (prose.signal) {
        expect(prose.signal).not.toMatch(/\d/);
      }
    }
  });
});
