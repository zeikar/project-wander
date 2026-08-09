// Derives the journey's weather script and its cue from the journey seed
// alone. Pure: `weatherAt` and `signalAt` take `(seed, legIndex)` and return
// a value, touching neither `rngState` nor any other field of `GameState` —
// weather is a property of the JOURNEY, not of the point the road's own
// random stream happens to be at, and the reducer's `rngState` advances a
// different number of rolls per leg depending on what that leg turns up. A
// function keyed on `rngState` would answer a different question on every
// call. `weatherAt` and `signalAt` are read by the reducer and the UI; see
// game-state.ts for where the seed this module reads is stored.
import { rollRandom } from "./rng";
import { journey } from "../content/journey";
import {
  SIGNAL_FALSE,
  SIGNAL_HIT,
  WEATHER_MAX_LEGS,
  WEATHER_MIN_LEGS,
} from "../content/weather";
import type { Weather } from "../content/weather";
import type { EncounterOption } from "../content/encounters";

const WEATHERS: readonly Weather[] = ["clear", "rain", "wind"];

// Salts in the same family as `FORK_SALT` / `LONE_ROUTE_SALT` / `SITUATION_
// SALT` in reducer.ts: each anchors a side-stream off the seed so that
// reading it never consumes a roll from the journey's own encounter script.
// Two different salts here rather than one, because the weather script and
// the signal noise are two INDEPENDENT streams (see `noiseAt` below) — if
// they shared an anchor, a leg's signal roll would collide with whatever the
// block walk was doing at that leg, and the two would not be independent.
const WEATHER_SALT = 0x9e3779b1;
const SIGNAL_SALT = 0x85ebca77;

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

// The signal's own noise, a SECOND stream independent of the block walk
// above: anchored at `(seed ^ SIGNAL_SALT)` rather than riding along inside
// `blockAt`, and threaded one roll per leg from leg 0, so leg L's noise is
// roll L+1 of this stream regardless of how many rolls the block walk spent
// getting there. That independence is the whole reason `SIGNAL_SALT` exists
// as its own constant rather than reusing `WEATHER_SALT`: sharing an anchor
// would make the noise a deterministic function of the weather roll it is
// supposed to be checked against, rather than a separate roll of its own.
function noiseAt(seed: number, legIndex: number): number {
  let state = (seed ^ SIGNAL_SALT) >>> 0;
  let value = 0;
  for (let leg = 0; leg <= legIndex; leg++) {
    const roll = rollRandom(state);
    value = roll.value;
    state = roll.nextState;
  }
  return value;
}

// Whether the road offers a cue about tomorrow's sky at the end of this leg.
// Eligible only when: this leg's weather is rain or wind (nothing to forecast
// out of a clear one); this is the 2nd-or-later leg of its block (the first
// leg of a block has no CHANGE behind it to have noticed yet); and this is
// not the journey's final leg (a forecast for a leg the traveler will never
// walk is not a forecast, it is noise).
// Shown iff eligible and the leg's own noise roll lands under `hit` when the
// next leg truly clears, or under `falseAlarm` when it does not.
//
// Two rates rather than one "accuracy" because the two are not symmetric in
// practice. Within a block, only its LAST leg can possibly see the next leg
// clear at all — every earlier eligible leg sits inside a run that
// structurally cannot clear on the very next step, because the block is not
// over yet. So most eligible legs have `clears` false, and a classifier that
// is merely "above 50% accurate" overall can still be shown MORE OFTEN WRONG
// than right on the very legs it fires on. `SIGNAL_FALSE` is what a
// precision target actually constrains; `SIGNAL_HIT` is free to be tuned for
// recall instead.
export function signalAt(
  seed: number,
  legIndex: number,
  hit: number = SIGNAL_HIT,
  falseAlarm: number = SIGNAL_FALSE,
): boolean {
  const seedU32 = seed >>> 0;
  const block = blockAt(seedU32, legIndex);
  const finalLeg = journey.legs.length - 1;

  const eligible =
    (block.weather === "rain" || block.weather === "wind") &&
    legIndex > block.start &&
    legIndex < finalLeg;
  if (!eligible) {
    return false;
  }

  const clears = weatherAt(seedU32, legIndex + 1) === "clear";
  const noise = noiseAt(seedU32, legIndex);
  return noise < (clears ? hit : falseAlarm);
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
