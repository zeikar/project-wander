import { describe, expect, it } from "vitest";
import { skyAhead, weatherAt } from "./weather";
import { journey } from "../content/journey";
import { encounters } from "../content/encounters";
import {
  WEATHER_MAX_LEGS,
  WEATHER_MIN_LEGS,
  weatherProse,
} from "../content/weather";
import type { Weather } from "../content/weather";

const LEG_COUNT = journey.legs.length;
const SEED_COUNT = 500;

// Groups a seed's script into maximal same-weather runs, in order. Used both
// to check run lengths and to check that adjacent runs never share a
// weather — the two properties the block walk is supposed to guarantee.
function weatherRuns(
  seed: number,
): Array<{ weather: Weather; length: number }> {
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

// Every expectation here is derived by SCANNING `weatherAt` — never by calling
// `blockAt` a second time — because the whole value of `skyAhead` is that the
// forecast and the sky the road shows are the same walk. A version that
// computed its own blocks would agree with itself and still be wrong on the
// road; this is what would catch that.
describe("skyAhead", () => {
  const FORECAST_SEEDS = 300;

  // "at least", not "exactly": a `holds` too SMALL still walks a stretch of
  // road that is genuinely `first` and passes here. What forbids that is the
  // next test, where leg `holds` has to already be a DIFFERENT sky.
  it("names the sky the road actually opens with, and holds it for at least that many legs", () => {
    for (let seed = 1; seed <= FORECAST_SEEDS; seed++) {
      const { first, holds } = skyAhead(seed);

      for (let leg = 0; leg < holds; leg++) {
        expect(weatherAt(seed, leg)).toBe(first);
      }
    }
  });

  it("names what the road turns to at the boundary, and it is always a different sky", () => {
    for (let seed = 1; seed <= FORECAST_SEEDS; seed++) {
      const { first, holds, then } = skyAhead(seed);

      expect(weatherAt(seed, holds)).toBe(then);
      // A boundary always changes the sky — the block walk never repeats
      // itself — so a forecast promising the same weather twice would be
      // describing a road that does not exist.
      expect(then).not.toBe(first);
    }
  });

  // `then` is only meaningful if the road is long enough to reach it. Asserted
  // rather than clamped in `skyAhead`, so shortening the journey below the
  // longest weather block breaks here loudly.
  it("always turns inside the road it is describing", () => {
    for (let seed = 1; seed <= FORECAST_SEEDS; seed++) {
      const { holds } = skyAhead(seed);

      expect(holds).toBeGreaterThanOrEqual(WEATHER_MIN_LEGS);
      expect(holds).toBeLessThanOrEqual(WEATHER_MAX_LEGS);
      expect(holds).toBeLessThan(LEG_COUNT);
    }
  });
});

describe("weatherProse", () => {
  it("gives every sky a non-empty line", () => {
    for (const weather of ["clear", "rain", "wind"] as const) {
      expect(weatherProse[weather].line.length).toBeGreaterThan(0);
    }
  });

  // The same contract the HP bands and traffic hints keep.
  it("never states a digit or a percentage", () => {
    for (const weather of ["clear", "rain", "wind"] as const) {
      expect(weatherProse[weather].line).not.toMatch(/\d/);
    }
  });

  function optionAt(fullId: string) {
    const [encounterId, optionId] = fullId.split("/");
    return encounters
      .find((encounter) => encounter.id === encounterId)!
      .options.find((option) => option.id === optionId)!;
  }

  // The AUTHORING RULE comment above `weatherProse` names a claim in words —
  // "rain closes every SCENT option", "wind closes every SPREAD-CLOTH option"
  // — and Task 2's own history is that a line like this can claim a closure an
  // option quietly keeps open. This table is the check: each row states the
  // FULL SEMANTIC SCOPE of one clause word — every option whose OWN mechanic
  // is that physics, read from the content itself — independent of which
  // options `content/encounters.ts` currently marks `closedIn`. `light-torch`
  // is a pitch torch, not tinder, so it is correctly outside the "tinder" row
  // rather than a special case inside it; `count-the-litter-from-cover`
  // describes the SOW's own position, not a traveler's downwind tactic, so it
  // is outside the "downwind" row for the same reason the AUTHORING RULE
  // comment gives.
  //
  // A row changes ONLY when the WORDING changes what it claims to cover —
  // never to match whatever `closedIn` currently ships. Editing a row to fit
  // the content is exactly the failure this table exists to catch: it would
  // make the test pass while the prose stayed false.
  //
  // A LEXICAL TRIPWIRE, not a proof: it can only compare a claimed scope
  // against `closedIn`, and it trusts that the scope below was read correctly
  // from the content by a human. It cannot discover an option this table's
  // author failed to notice shares the same physics.
  const PROSE_CLAIMS: ReadonlyArray<{
    weather: Exclude<Weather, "clear">;
    clauseWord: string;
    // Every option the clause word's physics covers, as `encounterId/optionId`.
    closes: readonly string[];
  }> = [
    {
      weather: "rain",
      clauseWord: "scent",
      closes: ["ford-boar/scatter-bait", "ford-boar/bait-a-trace"],
    },
    {
      weather: "rain",
      clauseWord: "tinder",
      closes: [
        "bee-hollow/smoke-them",
        "wallow-boar/smoke-it-out-of-the-hollow",
        "wolves-at-a-kill/smoke-them-off-the-kill",
        "robbed-hollow/smoke-a-path",
        "old-skep/smoke-the-skep",
      ],
    },
    {
      weather: "wind",
      clauseWord: "downwind",
      closes: ["wallow-boar/wait-downwind"],
    },
    {
      weather: "wind",
      clauseWord: "spread out",
      closes: [
        "rowan-flock/net-the-fall",
        "rut-stag/wave-your-kit",
        "walled-lane-stag/sheet-over-the-coping",
        "thorn-hedge-flock/beat-the-hedge-over-your-sheet",
      ],
    },
  ];

  it.each(PROSE_CLAIMS)(
    "$weather's '$clauseWord' clause closes every option in its scope",
    ({ weather, closes }) => {
      for (const fullId of closes) {
        expect(optionAt(fullId).closedIn?.weather).toBe(weather);
      }
    },
  );

  it("states a clause word only when its full scope is actually closed", () => {
    for (const { weather, clauseWord, closes } of PROSE_CLAIMS) {
      const fullyClosed = closes.every(
        (fullId) => optionAt(fullId).closedIn?.weather === weather,
      );
      const line = weatherProse[weather].line.toLowerCase();

      if (fullyClosed) {
        expect(line).toContain(clauseWord);
      } else {
        expect(line).not.toContain(clauseWord);
      }
    }
  });
});
