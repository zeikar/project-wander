// Derives the journey's weather script from the journey seed alone. Pure:
// `weatherAt` takes `(seed, legIndex)` and returns a value, touching neither
// `rngState` nor any other field of `GameState` — weather is a property of
// the JOURNEY, not of the point the road's own random stream happens to be
// at, and the reducer's `rngState` advances a different number of rolls per
// leg depending on what that leg turns up. A function keyed on `rngState`
// would answer a different question on every call. `weatherAt` is read by
// the reducer and the UI; see game-state.ts for where the seed this module
// reads is stored.
import { rollRandom } from "./rng";
import { WEATHER_MAX_LEGS, WEATHER_MIN_LEGS } from "../content/weather";
import type { Weather } from "../content/weather";
import type { EncounterOption } from "../content/encounters";

const WEATHERS: readonly Weather[] = ["clear", "rain", "wind"];

// Same family as `FORK_SALT` / `LONE_ROUTE_SALT` / `SITUATION_SALT` in
// reducer.ts: anchors a side-stream off the seed so that reading it never
// consumes a roll from the journey's own encounter script.
const WEATHER_SALT = 0x9e3779b1;

interface WeatherBlock {
  weather: Weather;
  start: number; // the block's first leg index
  length: number; // WEATHER_MIN_LEGS..WEATHER_MAX_LEGS
}

// Walks the block chain from leg 0 up to `legIndex`, threading one seeded
// stream anchored at `(seed ^ WEATHER_SALT)` the whole way: block 0's weather
// is uniform over all three skies, block 0's length is uniform over
// WEATHER_MIN_LEGS..WEATHER_MAX_LEGS, and every later block draws its weather
// uniform over the OTHER two — never repeating the block before it, so a
// boundary always changes the sky rather than silently extending a run past
// WEATHER_MAX_LEGS — plus a length of its own.
// Re-walked from leg 0 on every call rather than cached: the journey is 8
// legs long (journey.ts), so even the worst case (every block at the
// minimum length) is 4 blocks, and caching a walk that short would be the
// speculative abstraction this task was told not to add.
function blockAt(seed: number, legIndex: number): WeatherBlock {
  let roll = rollRandom((seed ^ WEATHER_SALT) >>> 0);
  let weather = WEATHERS[Math.floor(roll.value * WEATHERS.length)]!;
  let state = roll.nextState;

  roll = rollRandom(state);
  let length =
    WEATHER_MIN_LEGS +
    Math.floor(roll.value * (WEATHER_MAX_LEGS - WEATHER_MIN_LEGS + 1));
  state = roll.nextState;

  let start = 0;
  while (legIndex >= start + length) {
    start += length;

    const others = WEATHERS.filter((candidate) => candidate !== weather);
    roll = rollRandom(state);
    weather = others[Math.floor(roll.value * others.length)]!;
    state = roll.nextState;

    roll = rollRandom(state);
    length =
      WEATHER_MIN_LEGS +
      Math.floor(roll.value * (WEATHER_MAX_LEGS - WEATHER_MIN_LEGS + 1));
    state = roll.nextState;
  }

  return { weather, start, length };
}

export function weatherAt(seed: number, legIndex: number): Weather {
  return blockAt(seed >>> 0, legIndex).weather;
}

// What an option's `closedIn`/`weatherDeltas` actually mean under one sky —
// the ONE place either is read. `canChooseOption`, `CHOOSE_ENCOUNTER_OPTION`
// (both in reducer.ts) and the encounter button's label (App.tsx) all call
// this rather than inspecting the two fields themselves, because a second
// place that applied a reprice or a closure separately from this one could
// drift from it — a repriced label showing a number the reducer does not
// charge, or a closed button the reducer still accepts. Both were named as the
// failure mode this design exists to prevent.
export interface EffectiveOption {
  hpDelta: number;
  foodDelta: number;
  preparationDelta: number;
  resultText: string;
  // Set only when `option.closedIn` names THIS weather. undefined means the
  // option is open, however it prices out.
  closedReason: string | undefined;
}

export function effectiveOption(
  option: EncounterOption,
  weather: Weather,
): EffectiveOption {
  const reprice =
    option.weatherDeltas?.weather === weather ? option.weatherDeltas : undefined;

  return {
    hpDelta: reprice?.hpDelta ?? option.hpDelta,
    foodDelta: reprice?.foodDelta ?? option.foodDelta,
    // No weather reprices preparation, so this is always the authored figure —
    // included anyway so `canChooseOption`, `CHOOSE_ENCOUNTER_OPTION`, and
    // `costHint` can read one consistent record (`EffectiveOption` mirrors
    // `EncounterOption`'s shape) rather than some fields off `effective` and
    // this one off `option` at each call site.
    preparationDelta: option.preparationDelta,
    resultText: reprice?.resultText ?? option.resultText,
    closedReason:
      option.closedIn?.weather === weather ? option.closedIn.reason : undefined,
  };
}
