import { describe, expect, it } from "vitest";
import type { GameState, KnownSpecies } from "./game-state";
import { HUNGRY_TRAVEL_HP_LOSS, createInitialState } from "./game-state";
import {
  activeScenes,
  canChooseOption,
  codexLayerOf,
  findScene,
  offeredOptions,
  offeredRoutes,
  offeredVillageOptions,
  peekRoad,
  reduce,
  speciesDepth,
  speciesOf,
} from "./reducer";
import type { GameAction } from "./actions";
import { arrivalEnding } from "./arrival";
import { rollRandom } from "./rng";
import { effectiveOption, weatherAt } from "./weather";
import { journey } from "../content/journey";
import { encounters, speciesList } from "../content/encounters";
import { EVENT_CHANCE, roadEvents } from "../content/events";
import { village } from "../content/village";
import type { VillageOption } from "../content/village";
import type { EncounterOption } from "../content/encounters";
import type { Weather } from "../content/weather";

// hp defaults to the journey's own starting pool. It used to be a flat 20,
// left over from when the game started there; once resting could give hp back
// the reducer gained a ceiling at `journey.start.hp`, and a fixture above the
// ceiling made every choice clamp instead of applying its delta.
function makeTravelingState(overrides: Partial<GameState> = {}): GameState {
  return {
    phase: "traveling",
    hp: journey.start.hp,
    food: 2,
    preparation: 3,
    legIndex: 0,
    rngState: 1,
    seed: 1,
    activeEncounterId: null,
    secondSceneId: null,
    lastEncounterResult: null,
    lastRoadToll: null,
    known: [],
    // The road's default is a traveler who spent the morning on something else:
    // the craft is the trapper's saturated-codex option, so a fixture that
    // carries it says so.
    restCraft: false,
    log: [],
    ...overrides,
  };
}

// One species' entry in `known`, at the depth this fixture means. Local to this
// file, where its thirty-odd fixture sites are the repetition that earns a
// helper; spread two calls together for a traveler who knows two animals.
// Deliberately not exported and deliberately not a shared test-utils module:
// this repo has none, and a fixture in another file that needs a graded codex
// should state its own depth as a literal, where the reader can see it.
function knownToDepth(speciesId: string, depth: number): KnownSpecies[] {
  return [{ speciesId, depth }];
}

// Which of a leg's two ways is which. Every leg carries the same pair of odds
// (asserted below), so one lookup describes them all — but the ROUTE IDS differ
// per leg, so the id still has to be resolved against the leg being walked.
type Which = "quiet" | "busy";

function routeFor(legIndex: number, which: Which) {
  const routes = journey.legs[legIndex]!.routes;
  return routes.reduce((chosen, route) =>
    which === "quiet"
      ? route.encounterChance < chosen.encounterChance
        ? route
        : chosen
      : route.encounterChance > chosen.encounterChance
        ? route
        : chosen,
  );
}

// Tests that are not about the branch walk the quiet way where there IS a
// choice, and the only way where there is not — most legs no longer fork.
function travel(state: GameState, which: Which = "quiet"): GameAction {
  const routes = offeredRoutes(state);
  if (routes.length < 2) {
    return { type: "TRAVEL", routeId: routes[0]!.id };
  }
  const chosen = routes.reduce((best, route) =>
    which === "quiet"
      ? route.encounterChance < best.encounterChance
        ? route
        : best
      : route.encounterChance > best.encounterChance
        ? route
        : best,
  );
  return { type: "TRAVEL", routeId: chosen.id };
}

// One roll now decides three outcomes in bands — an animal below the route's
// own odds, a place in the next EVENT_CHANCE, an empty leg above that — so
// these three helpers find a state landing in each band. Derived rather than
// hardcoded, so retuning a route's odds or the event band does not silently
// invalidate every test that needs a particular kind of leg.
// `mustFork` matters because most legs no longer offer a choice: a test about
// what the two ways do needs a state where there ARE two ways.
function findRngStateIn(
  lo: number,
  hi: number,
  what: string,
  mustFork = false,
): number {
  for (let state = 1; state <= 100000; state++) {
    const value = rollRandom(state).value;
    if (value < lo || value >= hi) {
      continue;
    }
    if (
      mustFork &&
      offeredRoutes(makeTravelingState({ rngState: state })).length < 2
    ) {
      continue;
    }
    return state;
  }
  throw new Error(`no rng state in 1..100000 lands on ${what}`);
}

// An ANIMAL on the given way.
function findRngState(
  triggersEncounter: boolean,
  which: Which = "quiet",
  mustFork = false,
): number {
  const chance = routeFor(0, which).encounterChance;
  return triggersEncounter
    ? findRngStateIn(0, chance, `an animal on the ${which} way`, mustFork)
    : // An empty leg. Note the busy way plus the event band reaches 1.0, so a
      // bare leg only exists on the quiet way — callers wanting one must not
      // ask for "busy", and this throws loudly rather than quietly returning a
      // state that turns up a place instead.
      findRngStateIn(
        chance + EVENT_CHANCE,
        1,
        `an empty ${which} leg`,
        mustFork,
      );
}

// A journey seed whose weather at `legIndex` is `weather` — the weather
// equivalent of `findRngStateIn` above. A handful of tests below choose one of
// the options this milestone put behind the sky and were written before
// weather existed to pin against; those pin their seed to a clear leg with
// this, the same way tests about a specific rng band find one with
// `findRngStateIn`.
function findSeedWith(weather: Weather, legIndex: number): number {
  for (let seed = 1; seed <= 100000; seed++) {
    if (weatherAt(seed, legIndex) === weather) {
      return seed;
    }
  }
  throw new Error(`no seed in 1..100000 gives ${weather} at leg ${legIndex}`);
}

// A place on the given way of the SHAPE asked for: standing alone, or with an
// animal beside it. Whether a place-band leg also holds an animal is read off a
// salt on `state.rngState`, and this scans for the answer by WALKING the way
// and looking at what the leg held, rather than reimplementing the salt — the
// same relationship `findRngStateIn` has with `offeredRoutes`.
function findPlaceRngState(
  which: Which,
  mustFork: boolean,
  { paired }: { paired: boolean },
): number {
  const chance = routeFor(0, which).encounterChance;
  const wanted = routeFor(0, which).id;
  for (let rngState = 1; rngState <= 100000; rngState++) {
    const value = rollRandom(rngState).value;
    if (value < chance || value >= chance + EVENT_CHANCE) {
      continue;
    }
    const state = makeTravelingState({ rngState });
    const routes = offeredRoutes(state);
    if (mustFork && routes.length < 2) {
      continue;
    }
    // The way asked for has to be one this leg actually offers, or the walk
    // below would be down the other road and land in a different band.
    if (!routes.some((route) => route.id === wanted)) {
      continue;
    }
    const next = reduce(state, { type: "TRAVEL", routeId: wanted });
    if ((next.secondSceneId !== null) === paired) {
      return rngState;
    }
  }
  throw new Error(
    `no rng state in 1..100000 turns up ${
      paired ? "a pair" : "a lone place"
    } on the ${which} way`,
  );
}

// An ANIMAL on the given way of the shape asked for: standing alone, or with a
// SECOND animal beside it. Same relationship to the reducer that
// `findPlaceRngState` has — it walks the way and looks at what the leg held,
// rather than reimplementing the salt that decided it.
// No `mustFork` parameter, unlike its place-band twin, and that is a property
// of the bands rather than an omission: below the quiet way's odds BOTH ways
// read "animal", so they lead to the same leg and it does not fork at all. A
// forking animal leg is always a busy-way one, and nothing below needs one.
function findAnimalRngState(
  which: Which,
  { second }: { second: boolean },
): number {
  const chance = routeFor(0, which).encounterChance;
  const wanted = routeFor(0, which).id;
  for (let rngState = 1; rngState <= 100000; rngState++) {
    if (rollRandom(rngState).value >= chance) {
      continue;
    }
    const state = makeTravelingState({ rngState });
    // The way asked for has to be one this leg actually offers, or the walk
    // below would be down the other road.
    if (!offeredRoutes(state).some((route) => route.id === wanted)) {
      continue;
    }
    const next = reduce(state, { type: "TRAVEL", routeId: wanted });
    if ((next.secondSceneId !== null) === second) {
      return rngState;
    }
  }
  throw new Error(
    `no rng state in 1..100000 turns up ${
      second ? "two animals" : "a lone animal"
    } on the ${which} way`,
  );
}

// What the leg is actually holding, asked of BOTH slots: a leg can hold a place
// and an animal at once, so "is there a place here" stopped being a question
// about `activeEncounterId` alone.
function holdsAnimal(state: GameState): boolean {
  return activeScenes(state).some((scene) =>
    encounters.some((candidate) => candidate.id === scene.id),
  );
}

function holdsPlace(state: GameState): boolean {
  return activeScenes(state).some((scene) =>
    roadEvents.some((candidate) => candidate.id === scene.id),
  );
}

type OptionPolicy = (state: GameState) => string;

// Every option on the leg, across BOTH scenes when it holds two. A policy that
// could only see the first slot would never take the place's side of a pair,
// and every balance figure measured below would describe a game nobody plays.
function affordableOptions(state: GameState): readonly EncounterOption[] {
  const scenes = activeScenes(state);
  if (scenes.length === 0) {
    throw new Error(`no active scene: ${state.activeEncounterId}`);
  }
  const affordable = scenes
    .flatMap((scene) => scene.options)
    .filter((option) => canChooseOption(state, option));
  if (affordable.length === 0) {
    throw new Error(
      `no affordable option for ${scenes.map((scene) => scene.id).join(" + ")}`,
    );
  }
  return affordable;
}

const prudent: OptionPolicy = (state) =>
  affordableOptions(state).reduce((best, option) =>
    option.hpDelta > best.hpDelta ? option : best,
  ).id;

const reckless: OptionPolicy = (state) =>
  affordableOptions(state).reduce((worst, option) =>
    option.hpDelta < worst.hpDelta ? option : worst,
  ).id;

// Two more policies, needed only so the ending-reachability scan below can span
// the arrival outcomes: `prudent` and `reckless` alone never arrive stripped of
// everything while still on their feet.
const hoarding: OptionPolicy = (state) => {
  const options = affordableOptions(state);
  return (options.find((option) => option.preparationDelta >= 0) ?? options[0]!)
    .id;
};

const spendthrift: OptionPolicy = (state) => {
  const options = affordableOptions(state);
  return (
    options.find((option) => option.preparationDelta < 0) ??
    options.find((option) => option.foodDelta < 0) ??
    options[0]!
  ).id;
};

// "Careful" on an eight-leg road has to include eating. `prudent` above only
// avoids wounds and never seeks food, which was enough when three days of food
// covered most of a four-leg walk; on eight legs it starves, arriving alive on
// 125 of 200 seeds where it used to manage 200. This is the smallest policy
// that deserves the word careful now: fill the pack when it runs low, and
// otherwise take the option that costs the least blood.
// That 125 is the figure that made the case at the time and is left standing as
// the record; it is not current and nothing asserts it. Two milestones have
// moved it since — 158 of 200 before the village, 141 after the road stopped
// starting a food and a preparation richer. The argument holds either way: a
// careful line still has to eat.
const provisioned: OptionPolicy = (state) => {
  const options = affordableOptions(state);
  if (state.food <= 1) {
    const fed = options.reduce((best, option) =>
      option.foodDelta > best.foodDelta ? option : best,
    );
    if (fed.foodDelta > 0) {
      return fed.id;
    }
  }
  return options.reduce((best, option) =>
    option.hpDelta > best.hpDelta ? option : best,
  ).id;
};

// The morning always spends itself on the baker. Resolved by what she GIVES
// rather than by her id, so renaming the villager does not silently reroute
// every balance measurement below. One food giver, and she carries nothing
// else — both pinned by the currency-distinctness test in content.test.ts, so
// the delta alone identifies her and cannot hand this line a field note that
// would quietly change what the road offers it.
// This used to be the shepherd, chosen because he left every resource exactly
// where he found it, which kept these baselines measuring the game they
// measured before the village existed. He was cut (content/village.ts), and no
// resource-neutral villager remains. The baker is the closest thing left to
// that old starting line: `journey.start` now sets out a food and a
// preparation short, and her loaf puts the food back to 3 + 1 = 4, which is
// exactly what the road used to start with. So these journeys walk with the
// old food and one less preparation, and the assertions below moved by that
// much and no more. Villager variation is exercised by the exhaustive ending
// walk and by the village contract tests, deliberately not smuggled into these
// baselines.
function bakerMorning(state: GameState): GameAction {
  const baker = offeredVillageOptions(state).find(
    (option) => option.foodDelta > 0,
  )!;
  return { type: "CHOOSE_VILLAGE_OPTION", optionId: baker.id };
}

// Plays a whole journey from a seed and returns every state along the way. The
// step bound doubles as a proof that no state can leave the player stuck.
// `from` is what a CHAIN of journeys is played out of: START_JOURNEY keeps the
// codex and resets everything else, so handing it the end state of the last
// journey is how a traveler carries what they learned into the next one. It
// defaults to a fresh page load, which is what every single-journey caller
// wants.
function playJourney(
  seed: number,
  pickOptionId: OptionPolicy,
  which: Which = "quiet",
  from: GameState = createInitialState(),
): GameState[] {
  let state = reduce(from, { type: "START_JOURNEY", seed });
  const trace: GameState[] = [state];

  // Exhaustive on the phase, and only `arrived` and `defeated` end a journey.
  // A phase this loop does not know how to play is a broken harness, not a
  // finished walk: returning the trace for one would hand every balance
  // assertion downstream a truncated journey to pass against — a one-element
  // trace if START_JOURNEY ever stopped reaching the village, and silence for
  // any phase added later. So those throw, naming the phase. The 50-step bound
  // below still holds: the village adds one step to a walk that fit in 50 with
  // room.
  for (let step = 0; step < 50; step++) {
    switch (state.phase) {
      case "village":
        state = reduce(state, bakerMorning(state));
        break;
      case "traveling":
        state = reduce(state, travel(state, which));
        break;
      case "encounter":
        state = reduce(state, {
          type: "CHOOSE_ENCOUNTER_OPTION",
          optionId: pickOptionId(state),
        });
        break;
      case "arrived":
      case "defeated":
        return trace;
      // The title screen is where a journey has not begun, never where one
      // ends. Reaching it here means START_JOURNEY failed to leave it.
      case "title":
        throw new Error(
          `journey from seed ${seed} sat in phase "title" instead of setting out`,
        );
      // Stops compiling the day a phase is added without a way to play it,
      // and names the phase if one turns up here anyway.
      default: {
        const unplayable: never = state.phase;
        throw new Error(
          `journey from seed ${seed} reached a phase this harness cannot play: ${String(unplayable)}`,
        );
      }
    }
    trace.push(state);
  }

  throw new Error(`journey from seed ${seed} did not end within 50 steps`);
}

function project(state: GameState) {
  return {
    phase: state.phase,
    activeEncounterId: state.activeEncounterId,
    // Recorded so the trace can SEE a leg holding two things. Without it a leg
    // that gained a place beside its animal would be invisible here, and the
    // golden trace's job is to notice exactly that kind of quiet change.
    secondSceneId: state.secondSceneId,
    hp: state.hp,
    food: state.food,
    preparation: state.preparation,
    legIndex: state.legIndex,
  };
}

const SCANNED_SEEDS = Array.from({ length: 200 }, (_, seed) => seed);

describe("reduce", () => {
  // The toll lands when the leg is finished, not when it is begun: a quiet leg
  // completes inside TRAVEL, so the charge shows up in the same step.
  it("completing a leg fed: consumes food, leaves hp unchanged, advances the leg", () => {
    const state = makeTravelingState({
      food: 2,
      hp: journey.start.hp,
      legIndex: 0,
      rngState: findRngState(false),
    });
    const next = reduce(state, travel(state));

    expect(next.food).toBe(1);
    expect(next.hp).toBe(journey.start.hp);
    expect(next.legIndex).toBe(1);
  });

  it("completing a leg hungry: loses exactly HUNGRY_TRAVEL_HP_LOSS hp, food stays 0", () => {
    const state = makeTravelingState({
      food: 0,
      hp: journey.start.hp,
      legIndex: 0,
      rngState: findRngState(false),
    });
    const next = reduce(state, travel(state));

    expect(next.hp).toBe(journey.start.hp - HUNGRY_TRAVEL_HP_LOSS);
    expect(next.food).toBe(0);
    expect(next.legIndex).toBe(1);
  });

  it("ignores TRAVEL outside the traveling phase, returning the same state reference", () => {
    const state = createInitialState();
    const next = reduce(state, travel(state));

    expect(next).toBe(state);
  });

  it("ignores START_JOURNEY while already traveling, returning the same state reference", () => {
    const state = makeTravelingState();
    const next = reduce(state, { type: "START_JOURNEY", seed: 7 });

    expect(next).toBe(state);
  });

  it("START_JOURNEY stores the seed normalized to a uint32", () => {
    const positive = reduce(createInitialState(), {
      type: "START_JOURNEY",
      seed: 123,
    });
    const negative = reduce(createInitialState(), {
      type: "START_JOURNEY",
      seed: -1,
    });

    expect(positive.rngState).toBe(123);
    expect(negative.rngState).toBe(4294967295);
    // `seed` is normalized the same way as `rngState`, and independently of
    // it — this is the one action that sets both from the same input.
    expect(positive.seed).toBe(123);
    expect(negative.seed).toBe(4294967295);
  });

  it("START_JOURNEY after defeat restarts with full resources", () => {
    const state = makeTravelingState({
      phase: "defeated",
      hp: 0,
      food: 0,
      preparation: 0,
      legIndex: 2,
      lastEncounterResult: "a bad afternoon",
      log: [
        "Gray Shapes Between the Pines — Light one of your prepared pitch torches",
      ],
    });
    const next = reduce(state, { type: "START_JOURNEY", seed: 9 });

    // Into the village, not onto the road: a restart begins the morning again.
    expect(next.phase).toBe("village");
    expect(next.hp).toBe(journey.start.hp);
    expect(next.food).toBe(journey.start.food);
    expect(next.preparation).toBe(journey.start.preparation);
    expect(next.legIndex).toBe(0);
    expect(next.activeEncounterId).toBeNull();
    expect(next.lastEncounterResult).toBeNull();
    expect(next.log).toEqual([]);
  });

  it("is deterministic and does not mutate its input", () => {
    const state = makeTravelingState({ food: 1, hp: 15, legIndex: 2 });
    const snapshot = { ...state };

    const first = reduce(state, travel(state));
    const second = reduce(state, travel(state));

    expect(first).toEqual(second);
    expect(state).toEqual(snapshot);
  });
});

describe("travel encounters", () => {
  it("enters an encounter on a triggering roll without advancing the leg", () => {
    const state = makeTravelingState({ rngState: findRngState(true) });
    const trigger = rollRandom(state.rngState);
    const selection = rollRandom(trigger.nextState);
    // Mirrors the reducer's pick: uniform over SPECIES, then over that
    // species' situations off a salt that consumes no roll.
    const species =
      speciesList[Math.floor(selection.value * speciesList.length)]!;
    const situations = encounters.filter(
      (candidate) => candidate.speciesId === species.id,
    );
    const situationRoll = rollRandom((selection.nextState ^ 0x165667b1) >>> 0);
    const expected =
      situations[Math.floor(situationRoll.value * situations.length)]!;

    const next = reduce(state, travel(state));

    expect(next.phase).toBe("encounter");
    expect(next.activeEncounterId).toBe(expected.id);
    expect(next.legIndex).toBe(state.legIndex);
    expect(next.food).toBe(state.food);
    expect(next.hp).toBe(state.hp);
    expect(next.rngState).toBe(selection.nextState);
  });

  it("spends exactly one roll on a quiet leg", () => {
    const state = makeTravelingState({ rngState: findRngState(false) });

    const next = reduce(state, travel(state));

    expect(next.phase).toBe("traveling");
    expect(next.activeEncounterId).toBeNull();
    expect(next.rngState).toBe(rollRandom(state.rngState).nextState);
  });

  it("leaves the log untouched on a quiet leg", () => {
    const inputLog = ["a stretch already behind you"];
    const state = makeTravelingState({
      rngState: findRngState(false),
      log: inputLog,
    });

    const next = reduce(state, travel(state));

    expect(next.log).toEqual(inputLog);
    expect(next.log).toBe(inputLog);
  });

  it("clears a stale encounter result when travel resumes", () => {
    const state = makeTravelingState({
      rngState: findRngState(false),
      lastEncounterResult: "the sounds that follow you are busy ones",
    });

    const next = reduce(state, travel(state));

    expect(next.lastEncounterResult).toBeNull();
  });

  it("starving at leg completion ends the journey after the roll", () => {
    const state = makeTravelingState({
      hp: HUNGRY_TRAVEL_HP_LOSS,
      food: 0,
      legIndex: 0,
      rngState: findRngState(false),
    });

    const next = reduce(state, travel(state));

    expect(next.hp).toBe(0);
    expect(next.phase).toBe("defeated");
    // The road is walked before it is paid for, so the trigger roll is spent.
    expect(next.rngState).toBe(rollRandom(state.rngState).nextState);
    expect(next.legIndex).toBe(1);
    expect(next.lastEncounterResult).toBeNull();
  });

  it("a starving traveler still reaches the encounter waiting on that leg", () => {
    const state = makeTravelingState({
      hp: HUNGRY_TRAVEL_HP_LOSS,
      food: 0,
      rngState: findRngState(true),
    });

    const next = reduce(state, travel(state));

    expect(next.phase).toBe("encounter");
    expect(next.hp).toBe(3);
    expect(next.food).toBe(0);
  });

  it("the final leg is charged like any other", () => {
    const state = makeTravelingState({
      legIndex: journey.legs.length - 1,
      food: 2,
      hp: journey.start.hp,
      rngState: findRngState(false),
    });

    const next = reduce(state, travel(state));

    expect(next.phase).toBe("arrived");
    expect(next.food).toBe(1);
    expect(next.hp).toBe(journey.start.hp);
    expect(next.legIndex).toBe(journey.legs.length);
  });

  it("starving on the last stretch dies within sight of the village", () => {
    const state = makeTravelingState({
      legIndex: journey.legs.length - 1,
      food: 0,
      hp: HUNGRY_TRAVEL_HP_LOSS,
      rngState: findRngState(false),
    });

    const next = reduce(state, travel(state));

    expect(next.phase).toBe("defeated");
    expect(next.hp).toBe(0);
    expect(next.legIndex).toBe(journey.legs.length);
    expect(next.lastEncounterResult).toBeNull();
  });

  it("arrives hungry but alive when the last toll leaves hp to spare", () => {
    const state = makeTravelingState({
      legIndex: journey.legs.length - 1,
      food: 0,
      hp: HUNGRY_TRAVEL_HP_LOSS + 2,
      rngState: findRngState(false),
    });

    const next = reduce(state, travel(state));

    expect(next.phase).toBe("arrived");
    expect(next.hp).toBe(HUNGRY_TRAVEL_HP_LOSS + 2 - HUNGRY_TRAVEL_HP_LOSS);
  });

  it("ignores TRAVEL during an encounter, returning the same state reference", () => {
    const state = makeTravelingState({
      phase: "encounter",
      activeEncounterId: "ford-boar",
    });

    expect(reduce(state, travel(state))).toBe(state);
  });
});

// An rng state whose next roll lands BETWEEN the two ways' odds. Both ways turn
// something up on it, but not the same kind of thing: it is inside the busy
// way's ANIMAL band and inside the quiet way's PLACE band.
function findSplittingRngState(): number {
  const quiet = routeFor(0, "quiet").encounterChance;
  const busy = routeFor(0, "busy").encounterChance;
  return findRngStateIn(quiet, busy, "between the two ways", true);
}

describe("route branches", () => {
  // Two things depend on this shape. `routeFor` resolves a way by its odds and
  // is used from leg 0 to describe every leg, so the legs have to agree; and
  // `trafficHint` is total only because the two odds always differ, which is
  // what lets it drop its equal-odds branch.
  it("offers exactly two ways per leg, distinctly named, with the same distinct pair of odds", () => {
    const pairs = new Set<string>();

    journey.legs.forEach((leg, legIndex) => {
      expect(leg.routes).toHaveLength(2);
      expect(new Set(leg.routes.map((route) => route.id)).size).toBe(2);
      // Labels too, not just ids: two ways sharing a label would leave the
      // player picking between identical buttons.
      expect(new Set(leg.routes.map((route) => route.label)).size).toBe(2);
      expect(routeFor(legIndex, "quiet").encounterChance).toBeLessThan(
        routeFor(legIndex, "busy").encounterChance,
      );
      pairs.add(
        leg.routes
          .map((route) => route.encounterChance)
          .sort()
          .join("/"),
      );
    });

    expect(pairs.size).toBe(1);
  });

  // The whole shape of a leg, band by band. Below a route's own odds an animal
  // turns up; the next EVENT_CHANCE is a place; above that the leg passes
  // uneventfully. Because the two routes sit at different odds, the same roll
  // means different things on each — and where it does NOT, the leg does not
  // fork at all.
  it("reads one roll as three bands, and only forks where the bands differ", () => {
    // Below both ways' odds: the same animal either way, so there is nothing to
    // choose between and the leg runs on one road. The animal is looked for
    // across BOTH slots, for the same reason the place clause below already is:
    // an animal-band leg may hold a second animal, which is a subdivision of
    // this band and not a fourth one.
    const animalOnBoth = makeTravelingState({ rngState: findRngState(true) });
    expect(offeredRoutes(animalOnBoth)).toHaveLength(1);
    expect(holdsAnimal(reduce(animalOnBoth, travel(animalOnBoth)))).toBe(true);

    // Between the two ways' odds: a place one way, an animal the other. The
    // place is looked for across BOTH slots, because a place-band leg may also
    // hold an animal — which is a subdivision of this band, not a fourth one.
    const split = makeTravelingState({ rngState: findSplittingRngState() });
    expect(holdsPlace(reduce(split, travel(split, "quiet")))).toBe(true);
    expect(holdsAnimal(reduce(split, travel(split, "busy")))).toBe(true);

    // Above the quiet way's event band: an empty leg one way, a place the other.
    const emptyOnQuiet = makeTravelingState({
      rngState: findRngState(false, "quiet", true),
    });
    expect(reduce(emptyOnQuiet, travel(emptyOnQuiet, "quiet")).phase).toBe(
      "traveling",
    );
    expect(holdsPlace(reduce(emptyOnQuiet, travel(emptyOnQuiet, "busy")))).toBe(
      true,
    );
  });

  // The promise a fork makes. Two buttons that land in the same state are the
  // fake choice this milestone removes, not one it may reintroduce: below both
  // roads' odds the SAME roll picks the scene, so both ways would turn up the
  // same animal. Roughly half of all rolls fall there.
  it("never offers two ways that lead to the same place", () => {
    let forks = 0;
    for (let rngState = 1; rngState <= 400; rngState++) {
      const state = makeTravelingState({ rngState });
      const routes = offeredRoutes(state);
      if (routes.length < 2) {
        continue;
      }
      forks += 1;
      const [first, second] = routes.map((route) =>
        reduce(state, { type: "TRAVEL", routeId: route.id }),
      );
      // The whole PAIR of slots, not one id. A place-band leg draws its animal
      // off a salt while the other road draws off `selection`, so the two ways
      // can now land on the same animal — and they are still different legs,
      // because only one of them has a place standing beside it. Comparing
      // `activeEncounterId` alone would call that a fake choice.
      // Two animals on one leg do not threaten this either, and the reason is
      // the same one the fork rule already turns on. Below both roads' odds the
      // two ways draw the same animal AND read the same salt, so a two-animal
      // leg would be identical down both — but that leg never forks, because
      // `peekRoad` agrees on the two ways there. Where a fork DOES exist the
      // signs differ, so one way is animal-band and the other is not.
      expect([first!.activeEncounterId, first!.secondSceneId]).not.toEqual([
        second!.activeEncounterId,
        second!.secondSceneId,
      ]);
      expect(peekRoad(state, routes[0]!)).not.toBe(peekRoad(state, routes[1]!));
    }

    expect(forks).toBeGreaterThan(0);
  });

  // Regression: caught by the golden trace, not by a reviewer, and then very
  // nearly lost — an unrelated edit swallowed this test whole and a reviewer
  // caught THAT. Before the reducer clamped hp at the top, an hp-greedy line
  // took the lean-to every time it appeared and arrived with 18 of a starting
  // 14, which also moves every arrival threshold, since those are fractions of
  // the starting pool. The harness missed it too, because the model shared the
  // same omission.
  it("never lets rest carry the traveler past the pool they set out with", () => {
    const state = makeTravelingState({
      phase: "encounter",
      activeEncounterId: "old-camp",
      hp: journey.start.hp,
      food: 2,
      legIndex: 1,
    });
    const rest = roadEvents
      .find((event) => event.id === "old-camp")!
      .options.find((option) => option.hpDelta > 0)!;

    expect(
      reduce(state, { type: "CHOOSE_ENCOUNTER_OPTION", optionId: rest.id }).hp,
    ).toBe(journey.start.hp);

    // And it still heals from below, by whatever the option is AUTHORED to
    // give — this file's job is that the reducer applies the delta, not what
    // the delta is. The figure itself is pinned by name in encounters.test.ts,
    // which is the only thing that pins it: the golden trace meets this place
    // and takes this option, but always at full hp, where the clamp above
    // swallows the number entirely.
    expect(
      reduce(
        { ...state, hp: journey.start.hp - 5 },
        { type: "CHOOSE_ENCOUNTER_OPTION", optionId: rest.id },
      ).hp,
    ).toBe(journey.start.hp - 5 + rest.hpDelta);
  });

  // A LONE place, deliberately: what this pins is that a place teaches nothing,
  // and on a paired leg the animal beside it would be the thing that could.
  it("turns up a place on the band above the animals", () => {
    const state = makeTravelingState({
      rngState: findPlaceRngState("quiet", true, { paired: false }),
    });
    const next = reduce(state, travel(state, "quiet"));

    expect(next.phase).toBe("encounter");
    expect(next.secondSceneId).toBeNull();
    const place = roadEvents.find((e) => e.id === next.activeEncounterId);
    expect(place).toBeDefined();
    // A place teaches nothing: the codex is per species.
    expect(
      reduce(next, {
        type: "CHOOSE_ENCOUNTER_OPTION",
        optionId: place!.options[0]!.id,
      }).known,
    ).toEqual([]);
  });

  // The promise the sign makes. A traveler reads the ground, picks a way on
  // what they read, and the road has to then do that — so the sign and the
  // transition are computed from one place. This walks a wide cohort and
  // demands they never disagree.
  // NEITHER sign says everything, and both weakenings are deliberate (see
  // `RoadSign`). A place-band leg may hold an animal beside the place, and an
  // animal-band leg may hold a second animal — each band has its own
  // subdivision now — so all this can demand is that the KIND named is there
  // and that the other kind is not. Neither weakening is left as the only
  // record of itself: the two "the sign under-reports, on purpose" tests below
  // assert both shapes directly, so a sign that stopped under-reporting would
  // still be caught.
  it("never shows a sign the road then contradicts", () => {
    const tally = { quiet: 0, animal: 0, place: 0 };
    for (let rngState = 1; rngState <= 400; rngState++) {
      const state = makeTravelingState({ rngState });
      for (const route of offeredRoutes(state)) {
        const sign = peekRoad(state, route);
        const next = reduce(state, { type: "TRAVEL", routeId: route.id });
        tally[sign] += 1;

        if (sign === "quiet") {
          expect(next.phase).not.toBe("encounter");
          continue;
        }

        expect(next.phase).toBe("encounter");
        if (sign === "animal") {
          // At least one animal, and never a place. It used to be "an animal
          // and NOTHING else"; the animal band's own subdivision is what
          // weakened it, and only that far — a second animal is still an
          // animal, and a place is still drawn out of the other band entirely.
          expect(holdsAnimal(next)).toBe(true);
          expect(holdsPlace(next)).toBe(false);
        } else {
          expect(holdsPlace(next)).toBe(true);
        }
      }
    }

    // Every branch above has to actually run, or a sign that stopped varying
    // would leave this walking one arm and passing.
    expect(tally.quiet).toBeGreaterThan(0);
    expect(tally.animal).toBeGreaterThan(0);
    expect(tally.place).toBeGreaterThan(0);
  });

  // A fork is meant to be an event rather than a rhythm. Both shapes have to
  // actually occur, or the constant is doing nothing.
  it("offers a fork on some legs and a single way on others", () => {
    const shapes = new Set<number>();
    for (let rngState = 1; rngState <= 400; rngState++) {
      shapes.add(offeredRoutes(makeTravelingState({ rngState })).length);
    }

    expect([...shapes].sort()).toEqual([1, 2]);
  });

  // Whether a leg forks is read off the seeded source WITHOUT consuming a
  // roll, so presentation cannot move a seed's encounter script.
  it("does not spend a roll deciding whether the leg forks", () => {
    const state = makeTravelingState({ rngState: findRngState(true) });
    const routes = offeredRoutes(state);

    expect(reduce(state, travel(state)).rngState).toBe(
      rollRandom(rollRandom(state.rngState).nextState).nextState,
    );
    // And asking twice is the same question.
    expect(offeredRoutes(state).map((r) => r.id)).toEqual(
      routes.map((r) => r.id),
    );
  });

  // Content and code have to agree about which signs exist. A road is authored
  // with exactly the outcomes it can show — the quieter way never shows an
  // animal, the busier way never shows an empty road, because a fork only
  // exists where the two read differently. Derived here from the shipped code
  // rather than restated, so retuning a route's odds or the event band fails
  // this test instead of blanking a button.
  it("authors exactly the signs the roads can actually show", () => {
    const reachable = new Map<string, Set<string>>();
    for (let rngState = 1; rngState <= 3000; rngState++) {
      for (let legIndex = 0; legIndex < journey.legs.length; legIndex++) {
        const state = makeTravelingState({ rngState, legIndex });
        const routes = offeredRoutes(state);
        if (routes.length < 2) {
          continue;
        }
        for (const route of routes) {
          const set = reachable.get(route.id) ?? new Set<string>();
          set.add(peekRoad(state, route));
          reachable.set(route.id, set);
        }
      }
    }

    expect(reachable.size).toBe(
      journey.legs.reduce((n, leg) => n + leg.routes.length, 0),
    );
    for (const leg of journey.legs) {
      for (const route of leg.routes) {
        expect([...reachable.get(route.id)!].sort()).toEqual(
          Object.keys(route.signs).sort(),
        );
      }
    }
  });

  it("ignores a routeId this leg does not offer, returning the same state reference", () => {
    const state = makeTravelingState();

    expect(reduce(state, { type: "TRAVEL", routeId: "no-such-way" })).toBe(
      state,
    );
  });

  // The load-bearing content invariant of this milestone. Every version that
  // ALSO priced the roads differently collapsed into one correct road, taken on
  // 74-93% of the nodes where the two disagreed; charging nothing is what keeps
  // both worth taking. Because they charge the same, the reducer also never has
  // to remember which was walked.
  // Which way was walked is deliberately NOT remembered, and it can afford not
  // to be: both ways charge the same toll, so nothing downstream needs to know.
  // It used to be shown by walking both ways onto the same animal and comparing
  // the states, which a fork can no longer produce — a leg only forks when the
  // ways lead somewhere DIFFERENT. What survives is the toll itself: the leg's
  // charge is the road's, identical whichever way carried the traveler into it.
  it("charges the leg's toll the same whichever way was walked", () => {
    const fed = makeTravelingState({
      rngState: findRngState(false, "quiet", true),
      food: 2,
      hp: 12,
    });
    const routes = offeredRoutes(fed);
    expect(routes).toHaveLength(2);

    // The quiet way passes empty and pays the toll on the spot.
    const viaQuiet = reduce(fed, travel(fed, "quiet"));
    expect(viaQuiet.food).toBe(fed.food - 1);
    expect(viaQuiet.hp).toBe(fed.hp);

    // The busy way turns up a place; answering it pays the same toll, and the
    // option's own deltas are the only other thing that moved.
    const atPlace = reduce(fed, travel(fed, "busy"));
    const option = findScene(atPlace.activeEncounterId)!.options.find((o) =>
      canChooseOption(atPlace, o),
    )!;
    const viaBusy = reduce(atPlace, {
      type: "CHOOSE_ENCOUNTER_OPTION",
      optionId: option.id,
    });
    expect(viaBusy.food).toBe(fed.food + option.foodDelta - 1);
    expect(viaBusy.lastRoadToll).toBe(viaQuiet.lastRoadToll);
  });

  it("reaches a different outcome down the two ways on most seeds", () => {
    const differed = SCANNED_SEEDS.filter(
      (seed) =>
        JSON.stringify(project(playJourney(seed, prudent).at(-1)!)) !==
        JSON.stringify(project(playJourney(seed, prudent, "busy").at(-1)!)),
    );

    // 205/300 over the wider scan when this was written. The floor sits well
    // below that: what it guards is that the branch is not decoration, which is
    // how the species-split version of this milestone failed.
    expect(differed.length / SCANNED_SEEDS.length).toBeGreaterThan(0.4);
  });
});

// A leg can hold two things worth knowing, and the traveler resolves exactly
// one of them. What the other one costs is that it was standing right there.
describe("a leg that holds two things", () => {
  // Walked onto rather than fabricated: a pair is produced by TRAVEL off a
  // salt, so building one by hand would let these tests pass against a reducer
  // that never makes one. The sky is pinned clear because several of these
  // choose an option, and a rain-closed answer would make the assertion below
  // it vacuous.
  function makePlacePairState(overrides: Partial<GameState> = {}): GameState {
    const before = makeTravelingState({
      rngState: findPlaceRngState("quiet", false, { paired: true }),
      seed: findSeedWith("clear", 0),
      ...overrides,
    });
    const next = reduce(before, {
      type: "TRAVEL",
      routeId: routeFor(before.legIndex, "quiet").id,
    });
    if (!holdsAnimal(next) || !holdsPlace(next)) {
      throw new Error(
        `that state did not turn up a place and an animal: ${sceneIdsOf(next)}`,
      );
    }
    return next;
  }

  // The other shape a leg with two things on it can take, built exactly the
  // same way and for the same reason: walked onto off the animal band rather
  // than fabricated, so a reducer that never puts two animals on a leg cannot
  // keep the tests below green.
  function makeTwoAnimalState(overrides: Partial<GameState> = {}): GameState {
    const before = makeTravelingState({
      rngState: findAnimalRngState("quiet", { second: true }),
      seed: findSeedWith("clear", 0),
      ...overrides,
    });
    const next = reduce(before, {
      type: "TRAVEL",
      routeId: routeFor(before.legIndex, "quiet").id,
    });
    if (animalsOn(next).length !== 2) {
      throw new Error(
        `that state did not turn up two animals: ${sceneIdsOf(next)}`,
      );
    }
    return next;
  }

  function sceneIdsOf(state: GameState): string {
    return activeScenes(state)
      .map((scene) => scene.id)
      .join(" + ");
  }

  // Every animal standing on the leg, in slot order. Filtered out of the leg's
  // own scenes rather than found in `encounters`, because `encounters` order is
  // not slot order and a leg can now hold two of them.
  function animalsOn(state: GameState) {
    return activeScenes(state).flatMap((scene) =>
      encounters.filter((candidate) => candidate.id === scene.id),
    );
  }

  // The two things standing on this leg, resolved by KIND rather than by which
  // slot they are in. Which slot each sits in has its own test below; a fixture
  // that took the animal to BE the first slot would make every test using it
  // fail for that one reason, and stop saying anything about resolution or
  // about the codex gate.
  // It THROWS on any leg that is not one animal and one place, which is not
  // defensiveness: `find` over `encounters` returns the first match in
  // ENCOUNTERS order, so handed a two-animal leg it would silently name an
  // arbitrary one of the two "the animal" and the non-null assertion on the
  // place would hand back `undefined`. A caller that routes the wrong shape in
  // here has to fail loudly rather than measure the wrong thing.
  function animalAndPlace(state: GameState) {
    const scenes = activeScenes(state);
    const animals = encounters.filter((candidate) =>
      scenes.some((scene) => scene.id === candidate.id),
    );
    const places = roadEvents.filter((candidate) =>
      scenes.some((scene) => scene.id === candidate.id),
    );
    if (animals.length !== 1 || places.length !== 1) {
      throw new Error(
        `not one animal and one place on this leg: ${sceneIdsOf(state)}`,
      );
    }
    return { animal: animals[0]!, place: places[0]! };
  }

  it("reads everything standing on the leg, animal first", () => {
    const animal = encounters[0]!;
    const place = roadEvents[0]!;
    const otherAnimal = encounters.find(
      (candidate) => candidate.speciesId !== animal.speciesId,
    )!;

    expect(activeScenes(makeTravelingState())).toEqual([]);
    expect(
      activeScenes(makeTravelingState({ activeEncounterId: animal.id })),
    ).toEqual([animal]);
    expect(
      activeScenes(makeTravelingState({ activeEncounterId: place.id })),
    ).toEqual([place]);
    expect(
      activeScenes(
        makeTravelingState({
          activeEncounterId: animal.id,
          secondSceneId: place.id,
        }),
      ),
    ).toEqual([animal, place]);
    // Both shapes of a leg holding two things, so the contract is stated for
    // both in one place: the function reads the slots and does not care what
    // KIND stands in either of them.
    expect(
      activeScenes(
        makeTravelingState({
          activeEncounterId: animal.id,
          secondSceneId: otherAnimal.id,
        }),
      ),
    ).toEqual([animal, otherAnimal]);
  });

  // The only guard on PAIR_CHANCE's value, and deliberately the only one: a
  // bounds assertion on the constant would be a test that cannot fail, while
  // this one goes red at 0 and at 1.
  it("turns up both shapes: some place legs stand alone, some hold an animal too", () => {
    let lone = 0;
    let paired = 0;
    for (let rngState = 1; rngState <= 400; rngState++) {
      const state = makeTravelingState({ rngState });
      for (const route of offeredRoutes(state)) {
        const next = reduce(state, { type: "TRAVEL", routeId: route.id });
        if (!holdsPlace(next)) {
          continue;
        }
        if (next.secondSceneId === null) {
          lone += 1;
        } else {
          paired += 1;
        }
      }
    }

    expect(lone).toBeGreaterThan(0);
    expect(paired).toBeGreaterThan(0);
  });

  // What survives of "the animal goes first and the place goes second" now
  // that a leg can hold two animals: the FIRST slot is never a place. The other
  // half of that old claim — that slot 2 is always a place — is simply false
  // today, and is replaced below by tallying what actually turns up there.
  // Slot order is rendering order and no rule reads it, which is exactly what
  // makes this easy to lose by accident, so it keeps a test of its own.
  it("never puts a place in the first slot beside something else", () => {
    let pairs = 0;
    const secondSlot = { place: 0, animal: 0 };
    for (let rngState = 1; rngState <= 400; rngState++) {
      const state = makeTravelingState({ rngState });
      for (const route of offeredRoutes(state)) {
        const next = reduce(state, { type: "TRAVEL", routeId: route.id });
        if (next.secondSceneId === null) {
          continue;
        }
        pairs += 1;
        expect(
          encounters.some(
            (candidate) => candidate.id === next.activeEncounterId,
          ),
        ).toBe(true);
        if (roadEvents.some((c) => c.id === next.secondSceneId)) {
          secondSlot.place += 1;
        } else {
          secondSlot.animal += 1;
        }
      }
    }

    expect(pairs).toBeGreaterThan(0);
    // Both kinds have to actually stand in the second slot over this scan, or
    // the dead half of the old assertion was dropped rather than replaced.
    expect(secondSlot.place).toBeGreaterThan(0);
    expect(secondSlot.animal).toBeGreaterThan(0);
  });

  // Both questions a pair asks — whether there is an animal here as well, and
  // which one — are read off salts, so a leg holding two things spends exactly
  // the rolls a leg holding one spends. This is the same identity the fork test
  // asserts, and it is what keeps every existing seed's road script intact.
  it("spends no extra roll on the second thing", () => {
    const before = makeTravelingState({
      rngState: findPlaceRngState("quiet", false, { paired: true }),
    });
    const route = routeFor(before.legIndex, "quiet");
    const sign = peekRoad(before, route);
    const next = reduce(before, { type: "TRAVEL", routeId: route.id });

    expect(next.secondSceneId).not.toBeNull();
    expect(next.rngState).toBe(
      rollRandom(rollRandom(before.rngState).nextState).nextState,
    );
    // And asking twice is the same question.
    expect(peekRoad(before, route)).toBe(sign);
  });

  it("answering the animal ends the day and leaves the place standing", () => {
    const state = makePlacePairState({ food: 3, preparation: 3 });
    const { animal, place } = animalAndPlace(state);
    const option = animal.options.find(
      (candidate) =>
        canChooseOption(state, candidate) &&
        state.hp +
          effectiveOption(candidate, weatherAt(state.seed, state.legIndex))
            .hpDelta >
          0,
    )!;
    const effective = effectiveOption(
      option,
      weatherAt(state.seed, state.legIndex),
    );

    const next = reduce(state, {
      type: "CHOOSE_ENCOUNTER_OPTION",
      optionId: option.id,
    });

    expect(next.activeEncounterId).toBeNull();
    expect(next.secondSceneId).toBeNull();
    expect(next.legIndex).toBe(state.legIndex + 1);
    // The road charges for the leg once, not once per thing standing on it.
    expect(next.food).toBe(state.food + effective.foodDelta - 1);
    expect(next.lastRoadToll).toBe(journey.road.fed);
    expect(next.log).toEqual([
      ...state.log,
      `${animal.title} — ${option.label}`,
    ]);
    expect(next.log.at(-1)).not.toContain(place.title);
  });

  it("answering the place ends the day, leaves the animal standing, and teaches nothing", () => {
    const state = makePlacePairState({ food: 3, preparation: 3 });
    const { animal, place } = animalAndPlace(state);
    const option = place.options.find((candidate) =>
      canChooseOption(state, candidate),
    )!;

    const next = reduce(state, {
      type: "CHOOSE_ENCOUNTER_OPTION",
      optionId: option.id,
    });

    expect(next.activeEncounterId).toBeNull();
    expect(next.secondSceneId).toBeNull();
    expect(next.legIndex).toBe(state.legIndex + 1);
    // The animal was there and was not answered, so nothing was learned from
    // it: what the traveler gave up is exactly this.
    expect(next.known).toEqual(state.known);
    expect(next.known.map((entry) => entry.speciesId)).not.toContain(
      animal.speciesId,
    );
    expect(next.log).toEqual([
      ...state.log,
      `${place.title} — ${option.label}`,
    ]);
  });

  it("ignores an option belonging to neither thing on this leg, returning the same state reference", () => {
    const state = makePlacePairState();
    const elsewhere = [...encounters, ...roadEvents].find(
      (scene) =>
        scene.id !== state.activeEncounterId &&
        scene.id !== state.secondSceneId,
    )!;

    expect(
      reduce(state, {
        type: "CHOOSE_ENCOUNTER_OPTION",
        optionId: elsewhere.options[0]!.id,
      }),
    ).toBe(state);
  });

  // On a walked pair the codex gate resolves the animal's species for the
  // animal's options and no species at all for the place's, whichever slot each
  // sits in. Weather is a function of `seed`/`legIndex` and the pair a function
  // of `rngState`, so the two compose freely and this can be pinned to a clear
  // sky without disturbing the pair.
  it("reads the codex gate off the animal, and leaves the place's options alone", () => {
    const walked = makePlacePairState({ food: 3, preparation: 3 });
    const { animal, place } = animalAndPlace(walked);
    const teaches = animal.options.find(
      (option) => option.codex === "teaches",
    )!;
    const requires = animal.options.find(
      (option) => option.codex === "requires",
    )!;
    // Both states named against THIS SITUATION'S OWN RUNG rather than against a
    // flat known/unknown: one rung short is where its observation is live, and
    // at its rung is where what the observation buys opens. At rung 1 "one
    // short" is an empty notebook, which is the shape `known` has before an
    // animal has been studied at all.
    const layer = codexLayerOf(animal.id)!;
    const belowTheRung = {
      ...walked,
      known: layer > 1 ? knownToDepth(animal.speciesId, layer - 1) : [],
    };
    const atTheRung = {
      ...walked,
      known: knownToDepth(animal.speciesId, layer),
    };

    expect(canChooseOption(belowTheRung, teaches)).toBe(true);
    expect(canChooseOption(belowTheRung, requires)).toBe(false);
    expect(canChooseOption(atTheRung, teaches)).toBe(false);
    expect(canChooseOption(atTheRung, requires)).toBe(true);

    // And the place is untouched by any of it: what you know about the animal
    // standing beside it cannot change what the place costs.
    for (const option of place.options) {
      expect(canChooseOption(atTheRung, option)).toBe(
        canChooseOption(belowTheRung, option),
      );
    }
  });

  // WALKED, not hand-built. This was fabricated when it was written, because
  // no leg the reducer built then held two animals; the state it described is
  // now one TRAVEL produces, so it is produced that way and the test says
  // something about the game rather than about the gate in isolation. What it
  // checks is unchanged: an option belonging to the second animal has to be
  // gated on the SECOND animal's species, not on the first slot's.
  it("reads the codex gate off the scene that owns the option, not off the first slot", () => {
    // Clear sky and resources to spare, so the codex gate is the only thing
    // that can refuse any of these options.
    const state = makeTwoAnimalState({ food: 3, preparation: 3 });
    const [first, second] = animalsOn(state);
    const firstTeaches = first!.options.find(
      (option) => option.codex === "teaches",
    )!;
    const firstRequires = first!.options.find(
      (option) => option.codex === "requires",
    )!;
    const secondTeaches = second!.options.find(
      (option) => option.codex === "teaches",
    )!;
    const secondRequires = second!.options.find(
      (option) => option.codex === "requires",
    )!;

    // Each state knows ONE of the two to its own situation's rung and leaves
    // the other one rung short, where that other one's observation is still
    // live. Depths per situation rather than a flat known/unknown, because a
    // rung-2 situation met by an ignorant traveler has a LOCKED observation,
    // and this test is about which scene the gate reads — not about what a
    // locked rung does, which has its own test.
    // One rung short of a rung-1 situation is an empty notebook, which is
    // exactly what an unstudied animal looks like.
    const rungOf = (animal: (typeof encounters)[number]) =>
      codexLayerOf(animal.id)!;
    const liveObservation = (animal: (typeof encounters)[number]) =>
      rungOf(animal) > 1
        ? knownToDepth(animal.speciesId, rungOf(animal) - 1)
        : [];
    const atItsRung = (animal: (typeof encounters)[number]) =>
      knownToDepth(animal.speciesId, rungOf(animal));

    const knowsFirst = {
      ...state,
      known: [...atItsRung(first!), ...liveObservation(second!)],
    };
    const knowsSecond = {
      ...state,
      known: [...liveObservation(first!), ...atItsRung(second!)],
    };

    expect(canChooseOption(knowsFirst, firstTeaches)).toBe(false);
    expect(canChooseOption(knowsFirst, firstRequires)).toBe(true);
    expect(canChooseOption(knowsFirst, secondTeaches)).toBe(true);
    expect(canChooseOption(knowsFirst, secondRequires)).toBe(false);

    // The mirror. Knowing only the animal in the SECOND slot has to move that
    // animal's options and none of the first's.
    expect(canChooseOption(knowsSecond, firstTeaches)).toBe(true);
    expect(canChooseOption(knowsSecond, firstRequires)).toBe(false);
    expect(canChooseOption(knowsSecond, secondTeaches)).toBe(false);
    expect(canChooseOption(knowsSecond, secondRequires)).toBe(true);

    // And what the screen SHOWS agrees with the gate on every option of both
    // scenes. That agreement is the whole point: `offeredOptions` is handed the
    // scene and was always right, so a gate reading the first slot would show
    // the second animal's observation and then refuse the click.
    for (const knowing of [knowsFirst, knowsSecond]) {
      for (const scene of [first!, second!]) {
        const shown = offeredOptions(knowing, scene);
        // Each scene hides exactly one option here — the spent observation in
        // the one known to its rung, the not-yet-earned answer in the one a
        // rung short — so the comparison below is not two all-true lists
        // agreeing with each other.
        expect(shown.length).toBe(scene.options.length - 1);
        for (const option of scene.options) {
          expect(canChooseOption(knowing, option)).toBe(shown.includes(option));
        }
      }
    }
  });

  // The sign is read BEFORE the walk, deliberately: `peekRoad` is a function of
  // `state.rngState`, and TRAVEL has advanced it two rolls by the time the pair
  // exists, so asking the post-travel state would inspect the NEXT leg's draw
  // and pass or fail for no reason connected to this one.
  it("shows the sign of a place and says nothing about the animal — the sign under-reports, on purpose", () => {
    const before = makeTravelingState({
      rngState: findPlaceRngState("quiet", false, { paired: true }),
    });
    const route = routeFor(before.legIndex, "quiet");

    expect(peekRoad(before, route)).toBe("place");

    const next = reduce(before, { type: "TRAVEL", routeId: route.id });

    expect(holdsPlace(next)).toBe(true);
    expect(holdsAnimal(next)).toBe(true);
  });

  // The paired animal rides a salt rather than the journey's own stream, and a
  // salted stream that has gone constant looks exactly like a working one from
  // any single sample. Every species has to turn up, and at least one of them
  // in more than one of its situations.
  // Its subject is the PLACE pair's animal specifically, so the walk is guarded
  // on the leg holding a place: a two-animal leg has no "paired animal" to
  // speak of, and feeding one to `animalAndPlace` would tally an arbitrary one
  // of the two and quietly pollute the very figures this exists to check. The
  // second animal's own draw is measured by its own test below.
  it("draws the paired animal off a real stream, not a constant", () => {
    const species = new Set<string>();
    const situations = new Map<string, Set<string>>();
    for (let rngState = 1; rngState <= 2000; rngState++) {
      const state = makeTravelingState({ rngState });
      for (const route of offeredRoutes(state)) {
        const next = reduce(state, { type: "TRAVEL", routeId: route.id });
        if (next.secondSceneId === null || !holdsPlace(next)) {
          continue;
        }
        const { animal } = animalAndPlace(next);
        species.add(animal.speciesId);
        const seen = situations.get(animal.speciesId) ?? new Set<string>();
        seen.add(animal.id);
        situations.set(animal.speciesId, seen);
      }
    }

    expect([...species].sort()).toEqual(
      speciesList.map((candidate) => candidate.id).sort(),
    );
    expect([...situations.values()].some((seen) => seen.size > 1)).toBe(true);
  });

  // The other shape: two ANIMALS on one leg, where what the traveler gives up
  // by answering one of them is the other one's field note rather than a
  // resource. Everything above this line is the place pair.

  // The only guard on TWO_ANIMAL_CHANCE's value, and deliberately the only one,
  // for the reason its place-band twin gives: a bounds assertion on the
  // constant cannot fail, and this goes red at 0 and at 1.
  it("turns up both shapes on the animal band: some legs hold one animal, some hold two", () => {
    let lone = 0;
    let two = 0;
    for (let rngState = 1; rngState <= 400; rngState++) {
      const state = makeTravelingState({ rngState });
      for (const route of offeredRoutes(state)) {
        const next = reduce(state, { type: "TRAVEL", routeId: route.id });
        if (!holdsAnimal(next) || holdsPlace(next)) {
          continue;
        }
        if (animalsOn(next).length === 2) {
          two += 1;
        } else {
          lone += 1;
        }
      }
    }

    expect(lone).toBeGreaterThan(0);
    expect(two).toBeGreaterThan(0);
  });

  // Two of the same species would be one codex entry standing on the leg
  // twice, so answering either would cost the traveler no knowledge at all —
  // which is the entire thing this shape exists to charge them.
  it("never puts the same species twice on one leg", () => {
    let two = 0;
    for (let rngState = 1; rngState <= 400; rngState++) {
      const state = makeTravelingState({ rngState });
      for (const route of offeredRoutes(state)) {
        const animals = animalsOn(
          reduce(state, { type: "TRAVEL", routeId: route.id }),
        );
        if (animals.length < 2) {
          continue;
        }
        two += 1;
        expect(animals[0]!.speciesId).not.toBe(animals[1]!.speciesId);
      }
    }

    expect(two).toBeGreaterThan(0);
  });

  // The second animal rides a salt rather than the journey's own stream, and a
  // salted stream that has gone constant, or that has quietly correlated with
  // the band roll that decided there would be two, looks exactly like a working
  // one from any single sample. So: every species has to reach slot 2, at least
  // one of them in more than one situation, and every ORDERED pair of distinct
  // species has to occur — the last of those being what a correlation between
  // the two salts would break, since it would tie slot 2's draw to slot 1's.
  it("draws the second animal off a real stream, independent of the first", () => {
    const slotTwo = new Map<string, Set<string>>();
    const orderedPairs = new Set<string>();
    for (let rngState = 1; rngState <= 5000; rngState++) {
      const state = makeTravelingState({ rngState });
      for (const route of offeredRoutes(state)) {
        const animals = animalsOn(
          reduce(state, { type: "TRAVEL", routeId: route.id }),
        );
        if (animals.length < 2) {
          continue;
        }
        const [first, second] = animals;
        const seen = slotTwo.get(second!.speciesId) ?? new Set<string>();
        seen.add(second!.id);
        slotTwo.set(second!.speciesId, seen);
        orderedPairs.add(`${first!.speciesId} then ${second!.speciesId}`);
      }
    }

    expect([...slotTwo.keys()].sort()).toEqual(
      speciesList.map((candidate) => candidate.id).sort(),
    );
    expect([...slotTwo.values()].some((seen) => seen.size > 1)).toBe(true);
    // All twenty of them, measured: 20/20 at this scan size, and 20/20 at 400
    // states as well, so this is not sitting on the edge of its own cohort.
    const everyOrderedPair = speciesList.flatMap((first) =>
      speciesList
        .filter((second) => second.id !== first.id)
        .map((second) => `${first.id} then ${second.id}`),
    );
    expect([...orderedPairs].sort()).toEqual(everyOrderedPair.sort());
  });

  // Both questions — whether a second animal is here, and which one — are read
  // off salts, so a leg holding two animals spends exactly the rolls a leg
  // holding one spends. That is what keeps every existing seed's road script
  // intact, and the golden trace is the other half of the proof.
  it("spends no extra roll on the second animal", () => {
    const before = makeTravelingState({
      rngState: findAnimalRngState("quiet", { second: true }),
    });
    const route = routeFor(before.legIndex, "quiet");
    const sign = peekRoad(before, route);
    const next = reduce(before, { type: "TRAVEL", routeId: route.id });

    expect(animalsOn(next)).toHaveLength(2);
    expect(next.rngState).toBe(
      rollRandom(rollRandom(before.rngState).nextState).nextState,
    );
    // And asking twice is the same question.
    expect(peekRoad(before, route)).toBe(sign);
  });

  // The other half of "no seed's script moved", and the half the rolls above do
  // not cover: WHICH slot each animal stands in. The leg's own draw keeps slot
  // 1 and the second animal is added beside it — the rule the golden trace's
  // comment block reads a two-animal row by (may GAIN a second id, never change
  // its first), which until this test was prose nothing checked: seed 1's line
  // never holds two animals, so swapping the two slots left the whole suite
  // green.
  // Recorded ids rather than a derived expectation, because the counterfactual
  // — what this rngState draws when the salt says no second animal — is not
  // reachable from here without reimplementing the draw. The first id is not a
  // snapshot of whatever the current code happens to do: it is what the reducer
  // drew at this rngState BEFORE an animal leg could hold two, read off the
  // pre-change reducer at the same state (rngState 28, `thorn-hedge-flock`,
  // second slot empty). So this pins the claim rather than restating it.
  it("keeps the leg's own draw in the first slot and adds the second animal beside it", () => {
    const before = makeTravelingState({
      rngState: findAnimalRngState("quiet", { second: true }),
    });
    const route = routeFor(before.legIndex, "quiet");
    const next = reduce(before, { type: "TRAVEL", routeId: route.id });

    expect(next.activeEncounterId).toBe("thorn-hedge-flock");
    expect(next.secondSceneId).toBe("walled-lane-stag");
  });

  // Answering EITHER of them, in turn: the whole cost of the shape is that the
  // other one is left where it stands.
  it("answering one animal ends the day and leaves the other standing", () => {
    const state = makeTwoAnimalState({ food: 3, preparation: 3 });
    const animals = animalsOn(state);
    const weather = weatherAt(state.seed, state.legIndex);

    for (const [index, answered] of animals.entries()) {
      const other = animals[1 - index]!;
      const option = answered.options.find(
        (candidate) =>
          canChooseOption(state, candidate) &&
          state.hp + effectiveOption(candidate, weather).hpDelta > 0,
      )!;
      const effective = effectiveOption(option, weather);

      const next = reduce(state, {
        type: "CHOOSE_ENCOUNTER_OPTION",
        optionId: option.id,
      });

      expect(next.activeEncounterId).toBeNull();
      expect(next.secondSceneId).toBeNull();
      expect(next.legIndex).toBe(state.legIndex + 1);
      // The road charges for the leg once, not once per animal standing on it.
      expect(next.food).toBe(state.food + effective.foodDelta - 1);
      expect(next.lastRoadToll).toBe(journey.road.fed);
      expect(next.log).toEqual([
        ...state.log,
        `${answered.title} — ${option.label}`,
      ]);
      expect(next.log.at(-1)).not.toContain(other.title);
    }
  });

  // Knowledge against other knowledge, which is the reason this shape exists.
  // Watching the SECOND animal has to learn the second animal: a gate or a
  // reward resolved through `activeEncounterId` would learn the first one's
  // species here and leave the traveler with an entry they did not choose.
  it("watching one animal learns that one and not the other", () => {
    const [first, second] = animalsOn(makeTwoAnimalState());
    // Set out one rung short of the SECOND animal's situation, so the thing
    // being watched here is a live observation. A rung-2 situation met by an
    // ignorant traveler shows a LOCKED one instead, which is a different test.
    const layer = codexLayerOf(second!.id)!;
    const state = makeTwoAnimalState({
      food: 3,
      preparation: 3,
      known: layer > 1 ? knownToDepth(second!.speciesId, layer - 1) : [],
    });
    const watch = second!.options.find((option) => option.codex === "teaches")!;

    expect(canChooseOption(state, watch)).toBe(true);

    const next = reduce(state, {
      type: "CHOOSE_ENCOUNTER_OPTION",
      optionId: watch.id,
    });

    expect(next.known).toEqual([
      { speciesId: second!.speciesId, depth: layer },
    ]);
    expect(next.known.map((entry) => entry.speciesId)).not.toContain(
      first!.speciesId,
    );
  });

  // The sign is read BEFORE the walk, for the reason the place-band version of
  // this gives: `peekRoad` is a function of `state.rngState`, which TRAVEL has
  // advanced by two rolls by the time the leg exists.
  it("shows the sign of an animal and says nothing about the second — the sign under-reports, on purpose", () => {
    const before = makeTravelingState({
      rngState: findAnimalRngState("quiet", { second: true }),
    });
    const route = routeFor(before.legIndex, "quiet");

    expect(peekRoad(before, route)).toBe("animal");

    const next = reduce(before, { type: "TRAVEL", routeId: route.id });

    expect(animalsOn(next)).toHaveLength(2);
    expect(holdsPlace(next)).toBe(false);
  });
});

describe("encounter choices", () => {
  it("applies the chosen option's deltas and moves on down the road", () => {
    const state = makeTravelingState({
      phase: "encounter",
      activeEncounterId: "bee-hollow",
      hp: journey.start.hp,
      food: 0,
      preparation: 3,
      legIndex: 1,
      // reach-in is repriced under rain; pinned clear so this test still pins
      // the CLEAR-sky figures it was written to check. weather.test.ts covers
      // the rain reprice.
      seed: findSeedWith("clear", 1),
    });
    const reachIn = encounters
      .find((encounter) => encounter.id === "bee-hollow")
      ?.options.find((option) => option.id === "reach-in");

    const next = reduce(state, {
      type: "CHOOSE_ENCOUNTER_OPTION",
      optionId: "reach-in",
    });

    expect(next.hp).toBe(journey.start.hp - 3);
    // Two fists of comb, minus the leg's toll when the day finally ends.
    expect(next.food).toBe(1);
    expect(next.preparation).toBe(3);
    expect(next.phase).toBe("traveling");
    expect(next.legIndex).toBe(2);
    expect(next.activeEncounterId).toBeNull();
    expect(next.lastEncounterResult).toBe(reachIn?.resultText);
  });

  it("appends exactly one log entry for the chosen option, without mutating the input log", () => {
    const inputLog = ["an earlier stretch of road"];
    const state = makeTravelingState({
      phase: "encounter",
      activeEncounterId: "bee-hollow",
      hp: journey.start.hp,
      food: 0,
      preparation: 3,
      legIndex: 1,
      log: inputLog,
    });

    const next = reduce(state, {
      type: "CHOOSE_ENCOUNTER_OPTION",
      optionId: "reach-in",
    });

    expect(next.log).toEqual([
      "an earlier stretch of road",
      "A Humming Hollow — Reach in bare-handed for the comb",
    ]);
    expect(inputLog).toEqual(["an earlier stretch of road"]);
  });

  it("ignores an option the player cannot pay for, returning the same state reference", () => {
    const state = makeTravelingState({
      phase: "encounter",
      activeEncounterId: "ford-boar",
      preparation: 0,
    });

    expect(
      reduce(state, {
        type: "CHOOSE_ENCOUNTER_OPTION",
        optionId: "scatter-bait",
      }),
    ).toBe(state);
  });

  it("ignores an unknown option id, returning the same state reference", () => {
    const state = makeTravelingState({
      phase: "encounter",
      activeEncounterId: "ford-boar",
    });

    expect(
      reduce(state, { type: "CHOOSE_ENCOUNTER_OPTION", optionId: "fly-away" }),
    ).toBe(state);
  });

  it("ignores a choice while traveling, returning the same state reference", () => {
    const state = makeTravelingState();

    expect(
      reduce(state, { type: "CHOOSE_ENCOUNTER_OPTION", optionId: "wade-past" }),
    ).toBe(state);
  });

  it("a wound you cannot afford ends the journey where you stand", () => {
    const state = makeTravelingState({
      phase: "encounter",
      activeEncounterId: "ford-boar",
      hp: 4,
      legIndex: 1,
    });

    const next = reduce(state, {
      type: "CHOOSE_ENCOUNTER_OPTION",
      optionId: "wade-past",
    });

    expect(next.hp).toBe(0);
    expect(next.phase).toBe("defeated");
    expect(next.legIndex).toBe(1);
    // The leg was never finished, so the road never collected its toll.
    expect(next.food).toBe(state.food);
    // ...and so it has nothing to say. This is one of the reducer's exactly two
    // defeat transitions, and it must carry the ANIMAL's line alone. The other
    // is the starvation case below, which carries the road's line alone. The
    // defeat screen renders both slots with no fallback, so between them these
    // two assertions are what keep it from going blank or doubling up.
    expect(next.lastEncounterResult).not.toBeNull();
    expect(next.lastRoadToll).toBeNull();
  });

  it("spending an option's last food is the same click that can starve you at leg completion", () => {
    const state = makeTravelingState({
      phase: "encounter",
      activeEncounterId: "pine-shadows",
      hp: HUNGRY_TRAVEL_HP_LOSS,
      food: 1,
      preparation: 1,
      legIndex: 1,
    });

    const next = reduce(state, {
      type: "CHOOSE_ENCOUNTER_OPTION",
      optionId: "share-food",
    });

    expect(next.food).toBe(0);
    expect(next.hp).toBe(0);
    expect(next.phase).toBe("defeated");
    expect(next.legIndex).toBe(2);
  });

  // The whole point of giving one species several situations: what you learned
  // watching it in one place is knowledge about the ANIMAL, so it travels. Meet
  // the boar at the ford, study it there, and the wallow greets you with what
  // that knowledge buys rather than offering to teach it over again.
  it("carries what was learned in one situation into another of the same species", () => {
    const atTheFord = makeTravelingState({
      phase: "encounter",
      activeEncounterId: "ford-boar",
      hp: 10,
      food: 2,
      preparation: 1,
      legIndex: 1,
    });

    const taught = reduce(atTheFord, {
      type: "CHOOSE_ENCOUNTER_OPTION",
      optionId: "watch-from-the-reeds",
    });

    expect(taught.known).toEqual(knownToDepth("boar", 1));

    // Now the same animal, a different situation.
    const atTheWallow = {
      ...taught,
      phase: "encounter" as const,
      activeEncounterId: "wallow-boar",
    };
    const wallow = findScene("wallow-boar")!;
    const offered = offeredOptions(atTheWallow, wallow).map(
      (option) => option.id,
    );

    // The lesson is spent — this situation's observation is gone...
    expect(offered).not.toContain("watch-it-work-the-mud");
    // ...and what knowing the boar buys HERE is on the table instead.
    expect(offered).toContain("wait-downwind");

    // And it is a different situation, not the ford repainted: the ford's own
    // answers are not what the wallow offers.
    expect(offered).not.toContain("wade-past");
  });

  it("an option requiring preparation in hand is closed one short of the threshold", () => {
    const showYourKit = encounters
      .find((encounter) => encounter.id === "pine-shadows")!
      .options.find((option) => option.id === "show-your-kit")!;
    const threshold = showYourKit.requiresPreparation!;
    const base = makeTravelingState({
      phase: "encounter",
      activeEncounterId: "pine-shadows",
      // Milestone 5 put this option behind the codex too. Knowing the wolves
      // already keeps this test on the preparation gate it was written for.
      known: knownToDepth("wolves", 1),
    });

    expect(
      canChooseOption({ ...base, preparation: threshold - 1 }, showYourKit),
    ).toBe(false);
    expect(
      canChooseOption({ ...base, preparation: threshold }, showYourKit),
    ).toBe(true);
  });

  it("taking that option spends no preparation — it only asks what you carry", () => {
    const showYourKit = encounters
      .find((encounter) => encounter.id === "pine-shadows")!
      .options.find((option) => option.id === "show-your-kit")!;
    const carried = showYourKit.requiresPreparation!;
    const state = makeTravelingState({
      phase: "encounter",
      activeEncounterId: "pine-shadows",
      hp: 10,
      food: 1,
      preparation: carried,
      legIndex: 1,
      // As above: isolates the requirement from the codex gate.
      known: knownToDepth("wolves", 1),
    });

    const next = reduce(state, {
      type: "CHOOSE_ENCOUNTER_OPTION",
      optionId: "show-your-kit",
    });

    expect(next.preparation).toBe(carried);
    expect(next.hp).toBe(10);
    expect(next.phase).toBe("traveling");
    expect(next.legIndex).toBe(2);
  });

  it("ignores an option whose preparation requirement is unmet, returning the same state reference", () => {
    const showYourKit = encounters
      .find((encounter) => encounter.id === "pine-shadows")!
      .options.find((option) => option.id === "show-your-kit")!;
    const state = makeTravelingState({
      phase: "encounter",
      activeEncounterId: "pine-shadows",
      preparation: showYourKit.requiresPreparation! - 1,
      // As above: without this the option would be refused for being unknown,
      // and this test would stop saying anything about preparation.
      known: knownToDepth("wolves", 1),
    });

    expect(
      reduce(state, {
        type: "CHOOSE_ENCOUNTER_OPTION",
        optionId: "show-your-kit",
      }),
    ).toBe(state);
  });

  it("surviving the encounter but starving that evening still ends the journey", () => {
    const state = makeTravelingState({
      phase: "encounter",
      activeEncounterId: "pine-shadows",
      hp: HUNGRY_TRAVEL_HP_LOSS,
      food: 0,
      preparation: 1,
      legIndex: 1,
    });

    const next = reduce(state, {
      type: "CHOOSE_ENCOUNTER_OPTION",
      optionId: "light-torch",
    });

    expect(next.hp).toBe(0);
    expect(next.phase).toBe("defeated");
    expect(next.legIndex).toBe(2);
    expect(next.preparation).toBe(0);
    expect(next.lastEncounterResult).toBeNull();
  });
});

describe("weather closes and reprices encounter options", () => {
  const scatterBait = encounters
    .find((encounter) => encounter.id === "ford-boar")!
    .options.find((option) => option.id === "scatter-bait")!;
  const reachIn = encounters
    .find((encounter) => encounter.id === "bee-hollow")!
    .options.find((option) => option.id === "reach-in")!;
  const takeTheWindfall = encounters
    .find((encounter) => encounter.id === "rowan-flock")!
    .options.find((option) => option.id === "take-the-windfall")!;

  // effectiveOption is the one function both canChooseOption and
  // CHOOSE_ENCOUNTER_OPTION read to learn what the sky did to an option; pinned
  // here directly, separately from the reducer plumbing exercised below.
  it("exposes the closure reason exactly when the sky matches, and nothing otherwise", () => {
    expect(effectiveOption(scatterBait, "rain").closedReason).toBe(
      scatterBait.closedIn!.reason,
    );
    expect(effectiveOption(scatterBait, "clear").closedReason).toBeUndefined();
    expect(effectiveOption(scatterBait, "wind").closedReason).toBeUndefined();
  });

  it("refuses a closed option: choosing it is ignored, same state reference", () => {
    const state = makeTravelingState({
      phase: "encounter",
      activeEncounterId: "ford-boar",
      preparation: 3,
      legIndex: 1,
      seed: findSeedWith("rain", 1),
    });

    expect(canChooseOption(state, scatterBait)).toBe(false);
    expect(
      reduce(state, {
        type: "CHOOSE_ENCOUNTER_OPTION",
        optionId: "scatter-bait",
      }),
    ).toBe(state);
  });

  it("rain reprices reach-in to a single sting and carries the override text", () => {
    const state = makeTravelingState({
      phase: "encounter",
      activeEncounterId: "bee-hollow",
      hp: journey.start.hp,
      food: 0,
      preparation: 3,
      legIndex: 1,
      seed: findSeedWith("rain", 1),
    });

    const next = reduce(state, {
      type: "CHOOSE_ENCOUNTER_OPTION",
      optionId: "reach-in",
    });

    // -1 from the sting, not the clear-sky -3 — and food still went up 2, so
    // the traveler is fed and the leg's own toll takes a meal, not hp.
    expect(next.hp).toBe(journey.start.hp - 1);
    expect(next.lastEncounterResult).toBe(reachIn.weatherDeltas!.resultText);
    expect(next.lastEncounterResult).not.toBe(reachIn.resultText);
  });

  it("wind reprices take-the-windfall to 2 food instead of 1", () => {
    const state = makeTravelingState({
      phase: "encounter",
      activeEncounterId: "rowan-flock",
      hp: journey.start.hp,
      food: 0,
      preparation: 3,
      legIndex: 1,
      seed: findSeedWith("wind", 1),
    });

    const next = reduce(state, {
      type: "CHOOSE_ENCOUNTER_OPTION",
      optionId: "take-the-windfall",
    });

    // +2 from the option, then the leg's own toll of one meal since the
    // traveler is fed after gathering.
    expect(next.food).toBe(2 - 1);
    expect(next.lastEncounterResult).toBe(
      takeTheWindfall.weatherDeltas!.resultText,
    );
  });
});

describe("codex knowledge", () => {
  function optionOf(encounterId: string, optionId: string): EncounterOption {
    return encounters
      .find((encounter) => encounter.id === encounterId)!
      .options.find((option) => option.id === optionId)!;
  }

  // The load-bearing change of this milestone. `show-your-kit` used to answer the
  // wolves for free on almost every offer; now the first meeting has to be paid
  // for one way or another, and only a traveler who has watched them gets the
  // free answer. If this ever passes at `known: []`, the codex has stopped
  // mattering to the encounter it was built for.
  it("closes the free answer at the pines until the wolves have been watched", () => {
    const showYourKit = optionOf("pine-shadows", "show-your-kit");
    const base = makeTravelingState({
      phase: "encounter",
      activeEncounterId: "pine-shadows",
      preparation: showYourKit.requiresPreparation!,
    });

    expect(canChooseOption(base, showYourKit)).toBe(false);
    expect(
      canChooseOption(
        { ...base, known: knownToDepth("wolves", 1) },
        showYourKit,
      ),
    ).toBe(true);
  });

  it("closes the observation once there is nothing left to learn", () => {
    const readThePack = optionOf("pine-shadows", "read-the-pack");
    const base = makeTravelingState({
      phase: "encounter",
      activeEncounterId: "pine-shadows",
    });

    expect(canChooseOption(base, readThePack)).toBe(true);
    // The pines sit at the wolves' first rung, so one rung is all it takes to
    // spend this observation.
    expect(
      canChooseOption(
        { ...base, known: knownToDepth("wolves", 1) },
        readThePack,
      ),
    ).toBe(false);
  });

  it("watching an animal costs the afternoon and teaches exactly one rung", () => {
    const state = makeTravelingState({
      phase: "encounter",
      activeEncounterId: "pine-shadows",
      hp: 10,
      food: 2,
      legIndex: 1,
    });

    const next = reduce(state, {
      type: "CHOOSE_ENCOUNTER_OPTION",
      optionId: "read-the-pack",
    });

    expect(next.known).toEqual(knownToDepth("wolves", 1));
    // One hp, not two: `read-the-pack` was cheapened when the road went to
    // eight legs and five species made a second wolf meeting rarer. See the
    // note at the option itself.
    expect(next.hp).toBe(10 - 1);
    // One food to the wolves, and one more to the road when the leg completes.
    expect(next.food).toBe(2 - 1 - 1);
  });

  it("ignores an answer the traveler has not learned yet, returning the same state reference", () => {
    const state = makeTravelingState({
      phase: "encounter",
      activeEncounterId: "ford-boar",
      preparation: 2,
    });

    expect(
      reduce(state, {
        type: "CHOOSE_ENCOUNTER_OPTION",
        optionId: "bait-a-trace",
      }),
    ).toBe(state);
  });

  // Replaces the old known/unknown swap test rather than sitting beside it.
  // That one asserted the observation is shown to an ignorant traveler and the
  // unlocked answer to a knowing one, which is true of a rung-1 situation and
  // wrong by design for a rung-2 one: met ignorant, a rung-2 situation shows
  // its observation LOCKED. This generalizes the same guarantee to every depth.
  it("shows exactly one codex option at every depth, and never a longer menu", () => {
    let locked = 0;
    let live = 0;
    let unlocked = 0;

    for (const encounter of encounters) {
      const teaches = encounter.options.find(
        (option) => option.codex === "teaches",
      )!;
      const requires = encounter.options.find(
        (option) => option.codex === "requires",
      )!;
      const species = speciesList.find(
        (candidate) => candidate.id === encounter.speciesId,
      )!;
      const layer = codexLayerOf(encounter.id)!;

      for (let depth = 0; depth <= species.fieldNotes.length; depth++) {
        const state = makeTravelingState({
          phase: "encounter",
          activeEncounterId: encounter.id,
          known: depth > 0 ? knownToDepth(species.id, depth) : [],
        });
        const shown = offeredOptions(state, encounter).map(
          (option) => option.id,
        );

        // The same length at every depth: the codex slot holds exactly one of
        // its two options and never both, and never neither.
        expect(shown.length).toBe(encounter.options.length - 1);

        if (depth >= layer) {
          expect(shown).toContain(requires.id);
          expect(shown).not.toContain(teaches.id);
          unlocked += 1;
          continue;
        }

        expect(shown).toContain(teaches.id);
        expect(shown).not.toContain(requires.id);
        // Shown either way; whether it can be TAKEN is the whole difference
        // between a live observation and a locked door.
        expect(canChooseOption(state, teaches)).toBe(depth === layer - 1);
        if (depth === layer - 1) {
          live += 1;
        } else {
          locked += 1;
        }
      }
    }

    // All three faces have to have actually occurred, or this scan is checking
    // a road with no ladder on it.
    expect(locked).toBeGreaterThan(0);
    expect(live).toBeGreaterThan(0);
    expect(unlocked).toBeGreaterThan(0);
  });

  // Reversed deliberately. This test used to assert the opposite — that a new
  // journey forgets — and that was the design until the reason behind it was
  // re-measured: knowledge collapsed the game because what it bought cost
  // nothing and beat everything, not because knowledge itself was too strong.
  // Priced, the knowledge answers run 20-60% of their offers and no situation
  // resolves to one option even when every animal is known.
  it("carries what was learned into the next journey", () => {
    // Two species at two different depths, so a crossing that dropped the grade
    // and kept the ids would be caught as well as one that dropped an entry.
    const state = makeTravelingState({
      phase: "arrived",
      known: [...knownToDepth("wolves", 2), ...knownToDepth("bees", 1)],
    });

    const next = reduce(state, { type: "START_JOURNEY", seed: 5 });

    expect(next.known).toEqual([
      ...knownToDepth("wolves", 2),
      ...knownToDepth("bees", 1),
    ]);
    // Everything else still resets, which is what makes this a new journey
    // rather than a continued one.
    expect(next.hp).toBe(journey.start.hp);
    expect(next.food).toBe(journey.start.food);
    expect(next.preparation).toBe(journey.start.preparation);
    expect(next.legIndex).toBe(0);
    expect(next.log).toEqual([]);
  });

  // The reset point moved rather than disappearing: it is now the initial
  // state, so the first journey after the page loads still starts ignorant.
  it("still starts the first journey of all knowing nothing", () => {
    const first = reduce(createInitialState(), {
      type: "START_JOURNEY",
      seed: 5,
    });

    expect(first.known).toEqual([]);
  });

  // Knowledge opens a door; it does not pay for what is behind it. Both unlocked
  // answers that ask for preparation ask only what is still CARRIED.
  it("an unlocked answer spends no preparation", () => {
    for (const [encounterId, optionId] of [
      ["ford-boar", "bait-a-trace"],
      ["pine-shadows", "show-your-kit"],
    ] as const) {
      const carried = optionOf(encounterId, optionId).requiresPreparation!;
      const state = makeTravelingState({
        phase: "encounter",
        activeEncounterId: encounterId,
        hp: 10,
        food: 2,
        preparation: carried,
        // Known to this situation's own rung, which is what its unlocked answer
        // asks for — both of these sit at rung 1, and reading the rung off the
        // situation is what keeps that a fact about the content rather than an
        // assumption in the fixture.
        known: knownToDepth(
          speciesOf(encounterId)!,
          codexLayerOf(encounterId)!,
        ),
        legIndex: 1,
        // bait-a-trace is rain-closed; pinned clear so the reducer actually
        // applies it here rather than refusing it and passing vacuously.
        seed: findSeedWith("clear", 1),
      });

      const next = reduce(state, {
        type: "CHOOSE_ENCOUNTER_OPTION",
        optionId,
      });

      expect(next.preparation).toBe(carried);
      expect(next.hp).toBe(10);
    }
  });

  // The two readings every layered gate is built out of, pinned on their own
  // rather than only through the gates that call them.
  it("reads a species' depth off its own entry, and nothing off anyone else's", () => {
    const ignorant = makeTravelingState();
    const oneRung = makeTravelingState({ known: knownToDepth("boar", 1) });
    const twoRungs = makeTravelingState({ known: knownToDepth("boar", 2) });

    expect(speciesDepth(ignorant, "boar")).toBe(0);
    expect(speciesDepth(oneRung, "boar")).toBe(1);
    expect(speciesDepth(twoRungs, "boar")).toBe(2);
    // Another animal's entry says nothing about this one.
    expect(speciesDepth(twoRungs, "wolves")).toBe(0);
    // And a place resolves no species at all.
    expect(speciesDepth(twoRungs, undefined)).toBe(0);
  });

  it("reads a situation's rung off the content, and none for a place", () => {
    expect(codexLayerOf("ford-boar")).toBe(1);
    expect(codexLayerOf("sow-and-litter")).toBe(2);
    expect(codexLayerOf(roadEvents[0]!.id)).toBeUndefined();
    expect(codexLayerOf(null)).toBeUndefined();
  });

  // The locked door itself: a rung met too early stays on the menu — that is
  // what makes the ignorance visible — and cannot be taken.
  it("shows a rung met too early and refuses it", () => {
    const sow = findScene("sow-and-litter")!;
    const watch = sow.options.find((option) => option.codex === "teaches")!;
    const state = makeTravelingState({
      phase: "encounter",
      activeEncounterId: "sow-and-litter",
      hp: 10,
      food: 2,
      preparation: 2,
      legIndex: 1,
      seed: findSeedWith("clear", 1),
    });

    expect(offeredOptions(state, sow).map((option) => option.id)).toContain(
      watch.id,
    );
    expect(canChooseOption(state, watch)).toBe(false);
    expect(
      reduce(state, {
        type: "CHOOSE_ENCOUNTER_OPTION",
        optionId: watch.id,
      }),
    ).toBe(state);
  });

  // The whole ladder, walked on one animal with real states: locked, learned,
  // live, learned again, and what the second rung then opens.
  it("learns rungs in order, and each one opens the next door", () => {
    const wallow = findScene("wallow-boar")!;
    const sow = findScene("sow-and-litter")!;
    const sowWatch = sow.options.find((option) => option.codex === "teaches")!;
    const sowAnswer = sow.options.find((option) => option.codex === "requires")!;
    const atTheWallow = makeTravelingState({
      phase: "encounter",
      activeEncounterId: "wallow-boar",
      hp: 10,
      food: 2,
      preparation: 1,
      legIndex: 1,
      seed: findSeedWith("clear", 1),
    });

    // Rung 1, taken at the situation that teaches it.
    const oneRung = reduce(atTheWallow, {
      type: "CHOOSE_ENCOUNTER_OPTION",
      optionId: wallow.options.find((option) => option.codex === "teaches")!.id,
    });
    expect(oneRung.known).toEqual(knownToDepth("boar", 1));

    // The sow, with that one rung in hand: her observation has come live and
    // what it buys is still shut.
    const atTheSow: GameState = {
      ...oneRung,
      phase: "encounter",
      activeEncounterId: "sow-and-litter",
      hp: 10,
      food: 2,
      preparation: 1,
      legIndex: 1,
      seed: findSeedWith("clear", 1),
    };
    expect(canChooseOption(atTheSow, sowWatch)).toBe(true);
    expect(canChooseOption(atTheSow, sowAnswer)).toBe(false);

    // Rung 2 — one entry, deepened where it stood, not a second one beside it.
    const twoRungs = reduce(atTheSow, {
      type: "CHOOSE_ENCOUNTER_OPTION",
      optionId: sowWatch.id,
    });
    expect(twoRungs.known).toEqual([{ speciesId: "boar", depth: 2 }]);

    const deepened = { ...atTheSow, known: twoRungs.known };
    expect(canChooseOption(deepened, sowAnswer)).toBe(true);
    expect(canChooseOption(deepened, sowWatch)).toBe(false);
  });

  // The other branch of the same learning rule. A first lesson APPENDS, after
  // whatever is already in the notebook, and a deeper one deepens in place — so
  // the codex stays in the order the animals were first met however often the
  // traveler goes back for a second look.
  it("appends a newly met animal and deepens an old one where it stands", () => {
    const atTheWallow = makeTravelingState({
      phase: "encounter",
      activeEncounterId: "wallow-boar",
      hp: 10,
      food: 2,
      preparation: 1,
      legIndex: 1,
      seed: findSeedWith("clear", 1),
      known: knownToDepth("wolves", 1),
    });

    const oneRung = reduce(atTheWallow, {
      type: "CHOOSE_ENCOUNTER_OPTION",
      optionId: findScene("wallow-boar")!.options.find(
        (option) => option.codex === "teaches",
      )!.id,
    });
    expect(oneRung.known).toEqual([
      ...knownToDepth("wolves", 1),
      ...knownToDepth("boar", 1),
    ]);

    const twoRungs = reduce(
      {
        ...oneRung,
        phase: "encounter",
        activeEncounterId: "sow-and-litter",
        hp: 10,
        food: 2,
        legIndex: 1,
        seed: findSeedWith("clear", 1),
      },
      {
        type: "CHOOSE_ENCOUNTER_OPTION",
        optionId: findScene("sow-and-litter")!.options.find(
          (option) => option.codex === "teaches",
        )!.id,
      },
    );

    // Still wolves-then-boar: deepening does not move an entry to the end.
    expect(twoRungs.known).toEqual([
      ...knownToDepth("wolves", 1),
      ...knownToDepth("boar", 2),
    ]);
  });

  it("keeps depth per species: knowing the boar to the bottom moves no wolves gate", () => {
    const pines = findScene("pine-shadows")!;
    const ignorant = makeTravelingState({
      phase: "encounter",
      activeEncounterId: "pine-shadows",
      hp: 10,
      food: 2,
      preparation: 2,
      legIndex: 1,
      seed: findSeedWith("clear", 1),
    });
    const knowsTheBoar = { ...ignorant, known: knownToDepth("boar", 2) };
    const knowsTheWolves = { ...ignorant, known: knownToDepth("wolves", 1) };

    for (const option of pines.options) {
      expect(canChooseOption(knowsTheBoar, option)).toBe(
        canChooseOption(ignorant, option),
      );
      expect(offeredOptions(knowsTheBoar, pines)).toEqual(
        offeredOptions(ignorant, pines),
      );
    }

    // And not because nothing here moves: this animal's OWN knowledge moves it.
    expect(
      pines.options.some(
        (option) =>
          canChooseOption(knowsTheWolves, option) !==
          canChooseOption(ignorant, option),
      ),
    ).toBe(true);
  });

  // The ceiling, scanned rather than argued: at full depth a species has no
  // situation left that will teach anything.
  it("offers no choosable observation once a species is known to the bottom", () => {
    let scanned = 0;

    for (const species of speciesList) {
      const known = knownToDepth(species.id, species.fieldNotes.length);
      for (const situation of encounters.filter(
        (encounter) => encounter.speciesId === species.id,
      )) {
        const state = makeTravelingState({
          phase: "encounter",
          activeEncounterId: situation.id,
          hp: 10,
          food: 3,
          preparation: 3,
          legIndex: 1,
          seed: findSeedWith("clear", 1),
          known,
        });
        const teaches = situation.options.find(
          (option) => option.codex === "teaches",
        )!;

        expect(canChooseOption(state, teaches)).toBe(false);
        expect(
          offeredOptions(state, situation).map((option) => option.id),
        ).not.toContain(teaches.id);
        scanned += 1;
      }
    }

    expect(scanned).toBe(encounters.length);
  });

  // What the deeper rung actually buys, priced at the exact state binary
  // knowledge used to open it in: one rung down is no longer enough.
  it("keeps a deeper rung's answer shut to a traveler one rung short", () => {
    let checked = 0;

    for (const situation of encounters.filter(
      (encounter) => encounter.codexLayer > 1,
    )) {
      const requires = situation.options.find(
        (option) => option.codex === "requires",
      )!;
      const oneShort = makeTravelingState({
        phase: "encounter",
        activeEncounterId: situation.id,
        hp: 10,
        food: 3,
        preparation: 3,
        legIndex: 1,
        seed: findSeedWith("clear", 1),
        known: knownToDepth(situation.speciesId, situation.codexLayer - 1),
      });

      expect(canChooseOption(oneShort, requires)).toBe(false);
      expect(
        reduce(oneShort, {
          type: "CHOOSE_ENCOUNTER_OPTION",
          optionId: requires.id,
        }),
      ).toBe(oneShort);

      // And it is the RUNG refusing it, not the sky or the pack: one rung
      // deeper, on the same state, it opens.
      expect(
        canChooseOption(
          {
            ...oneShort,
            known: knownToDepth(situation.speciesId, situation.codexLayer),
          },
          requires,
        ),
      ).toBe(true);
      checked += 1;
    }

    expect(checked).toBeGreaterThan(0);
  });

  // Journeys chained through the codex, played by a traveler who watches
  // whatever is watchable. What it pins is the shape of `known` under a real
  // line of play: one entry per species, inside its own ceiling, deepening a
  // rung at a time and never two, and the ladder actually gets climbed.
  it("climbs the ladder across journeys and stops at the bottom of it", () => {
    const watchFirst: OptionPolicy = (state) => {
      const watching = affordableOptions(state).find(
        (option) => option.codex === "teaches",
      );
      return watching ? watching.id : prudent(state);
    };

    let carried = createInitialState();
    let deepest = 0;

    for (let seed = 1; seed <= 40; seed++) {
      const trace = playJourney(seed, watchFirst, "quiet", carried);

      for (let step = 1; step < trace.length; step++) {
        const before = trace[step - 1]!.known;
        const after = trace[step]!.known;

        // One entry per species, always.
        const ids = after.map((entry) => entry.speciesId);
        expect(new Set(ids).size).toBe(ids.length);

        for (const entry of after) {
          const ceiling = speciesList.find(
            (species) => species.id === entry.speciesId,
          )!.fieldNotes.length;
          expect(entry.depth).toBeGreaterThanOrEqual(1);
          expect(entry.depth).toBeLessThanOrEqual(ceiling);

          const earlier = before.find(
            (candidate) => candidate.speciesId === entry.speciesId,
          );
          // A species new to this step arrives at the first rung; one already
          // there gains at most one rung, so no step can skip one.
          if (earlier === undefined) {
            expect(entry.depth).toBe(1);
            continue;
          }
          expect(entry.depth - earlier.depth).toBeGreaterThanOrEqual(0);
          expect(entry.depth - earlier.depth).toBeLessThanOrEqual(1);
        }

        // Nothing is ever forgotten mid-chain either.
        for (const entry of before) {
          expect(
            after.some((candidate) => candidate.speciesId === entry.speciesId),
          ).toBe(true);
        }
      }

      carried = trace.at(-1)!;
      deepest = Math.max(
        deepest,
        ...carried.known.map((entry) => entry.depth),
        0,
      );
    }

    // The chain has to actually get somewhere, or every invariant above holds
    // vacuously on an empty notebook.
    expect(carried.known.length).toBeGreaterThan(0);
    expect(deepest).toBeGreaterThanOrEqual(2);
  });
});

// Playtest finding: three of four simulated players reported the boar costing
// 9 HP. It costs 6; the road's hunger toll supplied the other 3, applied by the
// same click and narrated nowhere. Players were learning a false fact about the
// animal, which defeats the deliberate choice to hide HP costs and let injury
// teach. The road now says what it took, in its own line.
describe("the road reports its own toll separately from the animal", () => {
  it("names the meal it took when the traveler is fed", () => {
    const state = makeTravelingState({
      food: 2,
      rngState: findRngState(false),
    });

    const next = reduce(state, travel(state));

    expect(next.lastRoadToll).toBe(journey.road.fed);
    expect(next.food).toBe(1);
  });

  it("names the miles instead when there is nothing left to eat", () => {
    const state = makeTravelingState({
      food: 0,
      hp: 14,
      rngState: findRngState(false),
    });

    const next = reduce(state, travel(state));

    expect(next.lastRoadToll).toBe(journey.road.hungry);
    expect(next.hp).toBe(14 - HUNGRY_TRAVEL_HP_LOSS);
  });

  // The whole point: after a wound AND a toll land on one click, the two causes
  // are separately attributable rather than summed into one unexplained number.
  it("reports the animal and the road as two distinct lines after one choice", () => {
    const state = makeTravelingState({
      phase: "encounter",
      activeEncounterId: "ford-boar",
      hp: 14,
      food: 0,
      legIndex: 1,
    });
    const wadePast = encounters
      .find((encounter) => encounter.id === "ford-boar")!
      .options.find((option) => option.id === "wade-past")!;

    const next = reduce(state, {
      type: "CHOOSE_ENCOUNTER_OPTION",
      optionId: "wade-past",
    });

    expect(next.lastEncounterResult).toBe(wadePast.resultText);
    expect(next.lastRoadToll).toBe(journey.road.hungry);
    // 6 from the boar, 3 from the road — and now each line owns its share.
    expect(next.hp).toBe(14 + wadePast.hpDelta - HUNGRY_TRAVEL_HP_LOSS);
  });

  it("does not carry a stale toll onto a new encounter screen", () => {
    const state = makeTravelingState({
      rngState: findRngState(true),
      lastRoadToll: journey.road.fed,
    });

    const next = reduce(state, travel(state));

    expect(next.phase).toBe("encounter");
    // Entering an encounter completes no leg, so nothing has been charged yet.
    expect(next.lastRoadToll).toBeNull();
  });

  it("keeps the road's line on a starvation defeat, and drops the animal's", () => {
    const state = makeTravelingState({
      phase: "encounter",
      activeEncounterId: "pine-shadows",
      hp: HUNGRY_TRAVEL_HP_LOSS,
      food: 0,
      preparation: 1,
      legIndex: 1,
    });

    const next = reduce(state, {
      type: "CHOOSE_ENCOUNTER_OPTION",
      optionId: "light-torch",
    });

    expect(next.phase).toBe("defeated");
    expect(next.lastEncounterResult).toBeNull();
    expect(next.lastRoadToll).toBe(journey.road.hungry);
  });

  it("clears the toll when a new journey starts", () => {
    const state = makeTravelingState({
      phase: "arrived",
      lastRoadToll: journey.road.fed,
    });

    const next = reduce(state, { type: "START_JOURNEY", seed: 4 });

    expect(next.lastRoadToll).toBeNull();
  });
});

// The departure morning. Half of what follows is about what the village must
// NOT do — spend a roll off the journey's script, charge the road's toll, or
// name an animal it then fails to teach — because those are the ways a phase
// wedged in front of leg 0 could quietly move a game that was tuned without it.
describe("the village morning", () => {
  function makeVillageState(overrides: Partial<GameState> = {}): GameState {
    const started = reduce(createInitialState(), {
      type: "START_JOURNEY",
      seed: 1,
    });
    return { ...started, ...overrides };
  }

  // One species with nothing left to learn about it — every rung of its own
  // ladder, read off the content rather than typed as a number, so a species
  // that gains a note does not leave these fixtures quietly saying "nearly
  // everything" while they claim to say "everything".
  function fullDepth(speciesId: string): KnownSpecies[] {
    return knownToDepth(
      speciesId,
      speciesList.find((species) => species.id === speciesId)!.fieldNotes
        .length,
    );
  }

  // Villagers are resolved by WHAT THEY GIVE, never by a hardcoded id, so
  // renaming one does not quietly point a test at a different person.
  function villager(
    state: GameState,
    matches: (option: VillageOption) => boolean,
  ): VillageOption {
    const found = offeredVillageOptions(state).find(matches);
    if (!found) {
      throw new Error("the morning offered no villager matching that");
    }
    return found;
  }

  it("starts the journey in the village, before the first leg", () => {
    const started = reduce(createInitialState(), {
      type: "START_JOURNEY",
      seed: 4,
    });

    expect(started.phase).toBe("village");
    expect(started.legIndex).toBe(0);
    expect(started.lastRoadToll).toBeNull();
  });

  it("the smith gives a point of preparation, and the road charges nothing for it", () => {
    const state = makeVillageState();
    const smith = villager(state, (option) => option.preparationDelta > 0);

    const next = reduce(state, {
      type: "CHOOSE_VILLAGE_OPTION",
      optionId: smith.id,
    });

    expect(next.preparation).toBe(state.preparation + 1);
    expect(next.food).toBe(state.food);
    expect(next.hp).toBe(state.hp);
    // A morning spent on the smith is a morning NOT spent on the trapper's
    // craft. The handler sets that flag from the chosen option's own marker, so
    // a villager who carries none must leave it where it was.
    expect(next.restCraft).toBe(false);
    expect(next.phase).toBe("traveling");
    expect(next.legIndex).toBe(0);
    // No leg was walked, so the road took nothing. This is the whole reason
    // the morning is a phase of its own rather than an encounter on leg 0.
    expect(next.lastRoadToll).toBeNull();
    expect(next.lastEncounterResult).toBe(smith.resultText);
    expect(next.log).toEqual([`${village.name} — ${smith.label}`]);
  });

  it("the baker gives a day's food, and the road charges nothing for that either", () => {
    const state = makeVillageState();
    const baker = villager(state, (option) => option.foodDelta > 0);

    const next = reduce(state, {
      type: "CHOOSE_VILLAGE_OPTION",
      optionId: baker.id,
    });

    expect(next.food).toBe(state.food + 1);
    expect(next.preparation).toBe(state.preparation);
    expect(next.hp).toBe(state.hp);
    expect(next.phase).toBe("traveling");
    expect(next.legIndex).toBe(0);
    expect(next.lastRoadToll).toBeNull();
    expect(next.log).toEqual([`${village.name} — ${baker.label}`]);
  });

  // The load-bearing one. Every seed's road script was tuned before the
  // village existed; if the morning drew from the journey's own stream, which
  // villager was met would rewrite what the road then turns up.
  it("spends no roll, whichever villager the morning is given to", () => {
    const state = makeVillageState();
    const options = offeredVillageOptions(state);

    // Three of the four authored: this traveler knows nothing, so the trapper
    // has a rung to give and his craft is not on the menu.
    expect(options).toHaveLength(3);
    for (const option of options) {
      const next = reduce(state, {
        type: "CHOOSE_VILLAGE_OPTION",
        optionId: option.id,
      });

      expect(next.rngState).toBe(state.rngState);
      expect(next.seed).toBe(state.seed);
    }
  });

  it("the trapper offers an animal the traveler lacks, and teaches exactly that one", () => {
    // Started from a traveler who already knows THE ANIMAL THIS SEED WOULD
    // OTHERWISE OFFER — taken from the offer itself on an empty notebook, not
    // guessed — so "an animal the traveler lacks" is a claim the fixture can
    // actually break. Against an empty notebook, or against any other animal
    // being the known one, an offer that never consulted `known` at all would
    // still satisfy the line below.
    const alreadyKnown = villager(
      makeVillageState(),
      (option) => option.teaches === true,
    ).teachesSpecies!;
    // Known to the BOTTOM of its ladder, which is what takes a species out of
    // the pool now — a species with a rung still to go is exactly the kind he
    // has something left to say about.
    const state = makeVillageState({ known: fullDepth(alreadyKnown) });
    const trapper = villager(state, (option) => option.teaches === true);

    expect(trapper.teachesSpecies).toBeDefined();
    expect(speciesList.map((species) => species.id)).toContain(
      trapper.teachesSpecies,
    );
    expect(state.known.map((entry) => entry.speciesId)).not.toContain(
      trapper.teachesSpecies,
    );

    const next = reduce(state, {
      type: "CHOOSE_VILLAGE_OPTION",
      optionId: trapper.id,
    });

    // Exactly the species the offer named, at its first rung, appended after
    // what was already known. This is the agreement itself under test:
    // `trapper` is what a screen rendering this state would show, and
    // `next.known` is what the reducer decided when handed only the id — one
    // `offeredVillageOptions` away on each side, and they land on the same
    // animal.
    expect(next.known).toEqual([
      ...fullDepth(alreadyKnown),
      ...knownToDepth(trapper.teachesSpecies!, 1),
    ]);
    expect(next.food).toBe(state.food);
    expect(next.preparation).toBe(state.preparation);
  });

  it("has only the animal still missing left to talk about", () => {
    // Full knowledge is full DEPTH: every rung of every species but the last.
    const allButOne = speciesList
      .slice(0, -1)
      .flatMap((species) => fullDepth(species.id));
    const state = makeVillageState({ known: allButOne });

    expect(
      villager(state, (option) => option.teaches === true).teachesSpecies,
    ).toBe(speciesList.at(-1)!.id);
  });

  // What he has left to say about an animal already in the notebook. The pool
  // is species below FULL depth, so a traveler one rung down is exactly the
  // kind he can still deepen — and the lesson lands on that species' entry
  // rather than beside it.
  it("teaches the next rung of an animal already in the notebook", () => {
    const deepening = speciesList.find(
      (species) => species.fieldNotes.length > 1,
    )!;
    const maxed = speciesList
      .filter((species) => species.id !== deepening.id)
      .flatMap((species) => fullDepth(species.id));
    const state = makeVillageState({
      known: [...knownToDepth(deepening.id, 1), ...maxed],
    });
    const trapper = villager(state, (option) => option.teaches === true);

    // He is there at all, and the only animal with a rung left is the one he
    // names.
    expect(trapper.teachesSpecies).toBe(deepening.id);

    const next = reduce(state, {
      type: "CHOOSE_VILLAGE_OPTION",
      optionId: trapper.id,
    });

    expect(next.known).toEqual([...knownToDepth(deepening.id, 2), ...maxed]);
    expect(next.known).toHaveLength(state.known.length);
  });

  it("picks the animal off the seed, so two journeys hear about different ones", () => {
    const taught = (seed: number) =>
      villager(
        makeVillageState({ seed }),
        (option) => option.teaches === true,
      ).teachesSpecies;
    const first = taught(1);

    // The `findSeedWith` pattern: scan for a seed that actually differs rather
    // than asserting a hardcoded pair, so retuning the salt cannot make this
    // pass by coincidence.
    let differing: number | undefined;
    for (let seed = 2; seed <= 100000; seed++) {
      if (taught(seed) !== first) {
        differing = seed;
        break;
      }
    }

    expect(differing).toBeDefined();
    expect(taught(differing!)).not.toBe(first);
    // And stable: asking the same seed twice cannot change the answer.
    expect(taught(1)).toBe(first);
  });

  // This used to pin the WITHDRAWAL — at a full codex the morning offered two —
  // and that half is the behaviour this change deletes. The refusal half stays
  // exactly as it was: the lesson is off the menu, so its id has to be ignored
  // like any other id the screen never showed.
  it("keeps three people at a full codex, with the craft where the lesson stood, and refuses the lesson anyway", () => {
    const state = makeVillageState({
      known: speciesList.flatMap((species) => fullDepth(species.id)),
    });
    const options = offeredVillageOptions(state);
    const withheld = village.options.find(
      (option) => option.teaches === true,
    )!;

    expect(options).toHaveLength(3);
    expect(options.some((option) => option.teaches === true)).toBe(false);
    // Third, which is where the trapper has always stood. Not decoration: the
    // morning is read top to bottom and a villager who moves position between
    // journeys is a different villager as far as the player is concerned.
    expect(options.at(-1)!.craft).toBe(true);
    expect(
      reduce(state, {
        type: "CHOOSE_VILLAGE_OPTION",
        optionId: withheld.id,
      }),
    ).toBe(state);
  });

  // The menu is three at BOTH ends of the codex, which is the whole of what this
  // change fixes. Read the two halves together: the saturated morning is not
  // short a person, and the ignorant one has not quietly gained a fourth.
  it("offers three whether the codex is full or empty, swapping which trapper turns up", () => {
    const saturated = offeredVillageOptions(
      makeVillageState({
        known: speciesList.flatMap((species) => fullDepth(species.id)),
      }),
    );
    const ignorant = offeredVillageOptions(makeVillageState());

    expect(saturated).toHaveLength(3);
    expect(saturated.filter((option) => option.craft === true)).toHaveLength(1);
    expect(saturated.some((option) => option.teaches === true)).toBe(false);

    expect(ignorant).toHaveLength(3);
    expect(ignorant.some((option) => option.craft === true)).toBe(false);
    expect(ignorant.filter((option) => option.teaches === true)).toHaveLength(1);
  });

  // The withheld-option idiom, pointed the other way: the craft is the one
  // authored villager option a traveler with something left to learn was never
  // shown, so naming its id is ignored exactly as naming the withdrawn lesson is
  // at the other end.
  it("refuses the craft on a morning that did not offer it", () => {
    const state = makeVillageState();
    const craft = village.options.find((option) => option.craft === true)!;
    const offered = offeredVillageOptions(state).map((option) => option.id);

    expect(offered).not.toContain(craft.id);
    expect(
      reduce(state, {
        type: "CHOOSE_VILLAGE_OPTION",
        optionId: craft.id,
      }),
    ).toBe(state);
  });

  // What taking it does at the morning, which is nothing the stat row can see:
  // the craft is a provision for the road, and every figure the traveler sets
  // out with is exactly what it was.
  it("takes the craft for the journey without moving the ledger", () => {
    const state = makeVillageState({
      known: speciesList.flatMap((species) => fullDepth(species.id)),
    });
    const craft = villager(state, (option) => option.craft === true);

    const next = reduce(state, {
      type: "CHOOSE_VILLAGE_OPTION",
      optionId: craft.id,
    });

    expect(state.restCraft).toBe(false);
    expect(next.restCraft).toBe(true);
    expect(next.hp).toBe(state.hp);
    expect(next.food).toBe(state.food);
    expect(next.preparation).toBe(state.preparation);
    expect(next.known).toEqual(state.known);
    expect(next.log).toEqual([`${village.name} — ${craft.label}`]);
    expect(next.lastEncounterResult).toBe(craft.resultText);
    expect(next.lastRoadToll).toBeNull();
    expect(next.phase).toBe("traveling");
  });

  // A provision, not knowledge: it dies with the journey that bought it, the
  // way the loaf and the strap do, and unlike the field note beside it.
  it("does not carry the craft into the next journey", () => {
    // Carrying a field note as well, so the second assertion below is a real
    // comparison rather than two empty lists agreeing with each other.
    const carried = makeVillageState({
      phase: "arrived",
      restCraft: true,
      known: knownToDepth(speciesList[0]!.id, 1),
    });
    const next = reduce(carried, { type: "START_JOURNEY", seed: 9 });

    expect(next.restCraft).toBe(false);
    // And what the journey DID learn still crosses, so this is a reset of the
    // provision and not of the notebook beside it.
    expect(next.known).toEqual(carried.known);
  });

  // Asserted on the initial state DIRECTLY, unlike `known` two tests up, which
  // can be read through START_JOURNEY because that action preserves it. This
  // one it overwrites, so every state a player can reach hides whatever
  // `createInitialState` says — the field is only visible here.
  it("holds no craft on a fresh page load", () => {
    expect(createInitialState().restCraft).toBe(false);
  });

  it("ignores the road's actions inside the village and the village's action outside it", () => {
    // The encounter is left ACTIVE on purpose. `wade-past` is a real option of
    // `ford-boar` and costs nothing the morning cannot pay, so every other
    // reason CHOOSE_ENCOUNTER_OPTION could bail — no scene, no such option, no
    // affording it — is satisfied here, and the phase guard is the only thing
    // left refusing it. Without this the action would die at `findScene(null)`
    // and the guard could be deleted with the suite still green.
    const state = makeVillageState({ activeEncounterId: "ford-boar" });
    const smith = villager(state, (option) => option.preparationDelta > 0);
    const onTheRoad = makeTravelingState();

    expect(
      reduce(onTheRoad, {
        type: "CHOOSE_VILLAGE_OPTION",
        optionId: smith.id,
      }),
    ).toBe(onTheRoad);
    expect(reduce(state, travel(state))).toBe(state);
    expect(
      reduce(state, {
        type: "CHOOSE_ENCOUNTER_OPTION",
        optionId: "wade-past",
      }),
    ).toBe(state);
    expect(
      reduce(state, {
        type: "CHOOSE_VILLAGE_OPTION",
        optionId: "no-such-villager",
      }),
    ).toBe(state);
  });

  // The same crossing the codex tests pin for a lesson learned on the road:
  // what the trapper gives is knowledge of the same kind, and it has to buy
  // the same thing in the journey after the one it was given in.
  it("carries the trapper's animal into the next journey, and opens what knowing it buys", () => {
    // Deliberately NOT a seed whose trapper teaches the first species in
    // `speciesList`: a handler that appended a hardcoded id instead of the
    // offered one would slip past this test on such a seed, which is how this
    // seed was chosen rather than taken as read.
    const started = reduce(createInitialState(), {
      type: "START_JOURNEY",
      seed: 2,
    });
    const trapper = villager(started, (option) => option.teaches === true);
    expect(trapper.teachesSpecies).not.toBe(speciesList[0]!.id);
    const taught = trapper.teachesSpecies!;
    const afterVillage = reduce(started, {
      type: "CHOOSE_VILLAGE_OPTION",
      optionId: trapper.id,
    });

    // Arrival fabricated rather than walked: what this pins is the crossing,
    // not the road in between.
    const nextJourney = reduce(
      { ...afterVillage, phase: "arrived" },
      { type: "START_JOURNEY", seed: 6 },
    );
    // One rung, which is what a morning with him is worth.
    expect(nextJourney.known).toEqual(knownToDepth(taught, 1));

    // A situation at the rung he actually taught. Any deeper one would still
    // refuse its unlocked answer here, correctly, and this test would then be
    // pinning the wrong thing.
    const situation = encounters.find(
      (encounter) =>
        encounter.speciesId === taught &&
        encounter.codexLayer === 1 &&
        encounter.options.some((option) => option.codex === "requires"),
    )!;
    const unlocked = situation.options.find(
      (option) => option.codex === "requires",
    )!;
    const atTheAnimal: GameState = {
      ...nextJourney,
      phase: "encounter",
      activeEncounterId: situation.id,
      legIndex: 1,
      food: 3,
      preparation: 3,
      // Pinned clear so a sky-closed answer cannot make this pass vacuously
      // on the "closed" side of the comparison.
      seed: findSeedWith("clear", 1),
    };

    expect(canChooseOption(atTheAnimal, unlocked)).toBe(true);
    // And shut to a traveler who never sat with him, which is what makes the
    // carry worth anything.
    expect(canChooseOption({ ...atTheAnimal, known: [] }, unlocked)).toBe(
      false,
    );
  });
});

// What the trapper's craft is actually worth, out where it is spent. The
// morning is where it is bought and the night is the only place it pays.
describe("the trapper's craft on the road", () => {
  // The best night on the road, and the same place's climb — one scene, so the
  // two halves below differ in the option taken and in nothing else. Both are
  // resolved by what they DO to the traveler rather than by id, so renaming an
  // option cannot quietly point this at a different trade. A place carries no
  // weather rule of any kind, so no sky can reprice either of them out from
  // under the comparison.
  const camp = roadEvents.find((event) => event.id === "old-camp")!;
  const night = camp.options.find((option) => option.hpDelta > 0)!;
  const wound = camp.options.find((option) => option.hpDelta < 0)!;
  const bloodless = camp.options.filter((option) => option.hpDelta === 0);

  // Wounded enough that the ceiling is nowhere near, and fed enough that the
  // leg's toll is paid in food on both sides of every comparison.
  function atTheCamp(overrides: Partial<GameState> = {}): GameState {
    return makeTravelingState({
      phase: "encounter",
      activeEncounterId: camp.id,
      hp: journey.start.hp - 6,
      food: 2,
      ...overrides,
    });
  }

  function choose(state: GameState, optionId: string): GameState {
    return reduce(state, { type: "CHOOSE_ENCOUNTER_OPTION", optionId });
  }

  it("gives one more hp back on a night, and nothing else", () => {
    const plain = atTheCamp();
    const crafted = atTheCamp({ restCraft: true });

    const slept = choose(plain, night.id);
    const sleptWithIt = choose(crafted, night.id);

    expect(slept.hp).toBe(plain.hp + night.hpDelta);
    expect(sleptWithIt.hp).toBe(slept.hp + 1);
    // The night is the axis; the meal it costs is not.
    expect(sleptWithIt.food).toBe(slept.food);
    expect(sleptWithIt.preparation).toBe(slept.preparation);
  });

  // EVERY night, which is the word the authored label uses and the one doing the
  // most work in it. The test above walks the camp alone — the best night on the
  // road at 3 — so a gate written `> 2` would keep it green while paying nothing
  // at the cart and the shieling, where a night is worth 2. That is two thirds
  // of the promise, silently broken, and the label would be lying about a road
  // the player cannot check.
  // Scanned off the content rather than listed: `content.test.ts` already pins
  // three places with exactly one hp-giving option each, so the count below is a
  // second reading of the same fact and goes red if a place is added without one.
  it("deepens every night on the road, not just the best one", () => {
    const nights = roadEvents.flatMap((event) =>
      event.options
        .filter((option) => option.hpDelta > 0)
        .map((option) => ({ event, option })),
    );

    expect(nights).toHaveLength(3);
    for (const { event, option } of nights) {
      const plain = makeTravelingState({
        phase: "encounter",
        activeEncounterId: event.id,
        hp: journey.start.hp - 6,
        food: 2,
      });

      expect(choose(plain, option.id).hp).toBe(plain.hp + option.hpDelta);
      expect(choose({ ...plain, restCraft: true }, option.id).hp).toBe(
        plain.hp + option.hpDelta + 1,
      );
    }
  });

  // It is bought for the JOURNEY, and the click that takes a night also finishes
  // the leg — so the flag has to survive `completeLeg`, and then every leg after
  // it. Clearing it there would leave the craft worth exactly one encounter
  // while every comment about it, and the label itself, promised a road.
  it("survives the leg it was spent on, and the ones after it", () => {
    const rested = choose(atTheCamp({ restCraft: true }), night.id);

    // The same click that applied the night also completed the leg, which is
    // what makes this a test of `completeLeg` and not of the option handler.
    expect(rested.legIndex).toBe(1);
    expect(rested.phase).toBe("traveling");
    expect(rested.restCraft).toBe(true);

    // And on down the road: whatever the next leg turns up, the craft is still
    // in hand when the traveler gets there.
    expect(reduce(rested, travel(rested)).restCraft).toBe(true);
  });

  // The rule that keeps this a craft for sleeping rough rather than a suit of
  // armour: a negative delta is charged in full whether the trapper spent the
  // morning on it or not.
  it("never softens a wound", () => {
    const plain = atTheCamp();
    const crafted = atTheCamp({ restCraft: true });

    const hurt = choose(plain, wound.id);
    const hurtWithIt = choose(crafted, wound.id);

    expect(hurt.hp).toBe(plain.hp + wound.hpDelta);
    expect(hurtWithIt.hp).toBe(hurt.hp);
  });

  // The other half of "only a positive delta", and the half that decides what
  // this thing IS. Loosened to `>= 0` the craft pays out on every option in the
  // game that leaves hp alone — a cache traded, a lean-to stripped, every
  // observation, every forage — which is not a night bonus at all but a flat
  // point per encounter, and it would quietly re-tune the whole road. The wound
  // test above cannot see that; nothing could, until this.
  it("pays nothing on an option that moves no hp at all", () => {
    const plain = atTheCamp();
    const crafted = atTheCamp({ restCraft: true });

    // Derived from the content, and asserted non-empty: if this place ever
    // stops carrying a bloodless trade, the loop below would pass by doing
    // nothing at all.
    expect(bloodless.length).toBeGreaterThan(0);
    for (const option of bloodless) {
      const without = choose(plain, option.id);
      const withIt = choose(crafted, option.id);

      expect(without.hp).toBe(plain.hp);
      expect(withIt.hp).toBe(without.hp);
    }
  });

  // The bonus sits INSIDE the ceiling, not beside it. A deeper night that could
  // push past the pool the traveler set out with would also move every arrival
  // threshold, since those are fractions of that pool.
  // Set exactly `night.hpDelta` below the ceiling, deliberately: the uncrafted
  // rest then lands ON the ceiling, so the only thing the clamp swallows is the
  // craft's own point. A shallower wound would have the plain rest overshoot
  // too, and the test would be pinning the pre-existing clamp rather than this
  // change's relationship to it.
  it("cannot carry anyone past the pool they set out with", () => {
    const nearlyWhole = atTheCamp({ hp: journey.start.hp - night.hpDelta });

    expect(choose(nearlyWhole, night.id).hp).toBe(journey.start.hp);
    expect(choose({ ...nearlyWhole, restCraft: true }, night.id).hp).toBe(
      journey.start.hp,
    );
  });
});

describe("full journeys", () => {
  it("can be lost: reckless play is defeated on at least one seed", () => {
    const lost = SCANNED_SEEDS.filter(
      (seed) => playJourney(seed, reckless).at(-1)?.phase === "defeated",
    );

    expect(lost.length).toBeGreaterThan(0);
  });

  it("can be won: a simple careful line arrives alive on most seeds", () => {
    const won = SCANNED_SEEDS.filter((seed) => {
      const end = playJourney(seed, provisioned).at(-1);
      return end?.phase === "arrived" && end.hp > 0;
    });

    // "Most", not "nearly every", and the name changed with the number: this
    // guarantee genuinely weakened on an eight-leg road. It used to be 200 of
    // 200. Two things moved. The policy had to — `prudent` above only avoids
    // wounds and never eats, which was enough when three days of food covered
    // a four-leg walk and starves on eight, so this measures `provisioned`
    // instead. And the road is simply longer, so there is more of it to get
    // wrong. That the remaining losses are the LINE's fault and not the road's
    // is what the sweep pins: death is unavoidable on 0.3% of seeds.
    // Measured 167 of 200 before `journey.start` gave back what the village
    // hands out, and 143 of 200 after: this line walks with the same food it
    // always had (the baker's loaf restores it) and one less preparation, and
    // 24 seeds it used to survive it no longer does.
    // 164 of 200 once a leg could hold two things. It moved the easier way, as
    // it had to: a pair only ever ADDS options to a leg that already had some,
    // and this line takes the best hpDelta among them, so more to choose from
    // can only help. 21 seeds it used to lose it now survives.
    // 170 of 200 once an animal leg could hold a SECOND animal, and the easy
    // way again for exactly the same reason — six more seeds survive, and no
    // mechanism here can push the other way, since a second animal is a second
    // menu on a leg that already had one.
    // Re-run when the codex went to layers, and it did not move at all: still
    // 170 of 200. Four observations now sit a rung above an ignorant traveler
    // and are refused, which is the one mechanism here that could have pushed
    // the hard way — and this line never takes an observation anyway. It
    // reduces over `hpDelta` and every observation on the road is beaten there
    // by some always-offered answer (the domination rule in content.test.ts),
    // so what a locked rung removes from its menu is an option this policy was
    // never going to pick.
    // The floor stays 125 — deliberately well under the measured 170, because
    // a simple policy's exact score is brittle to content retuning. What it
    // guards is a collapse, not a wobble, and the headroom it keeps over the
    // measurement is the same headroom it kept at 145.
    expect(won.length).toBeGreaterThanOrEqual(125);
  });

  it("replays identically from the same seed", () => {
    expect(playJourney(3, prudent)).toEqual(playJourney(3, prudent));
  });

  // Every authored arrival ending has to be something a real journey can end in.
  // arrival.test.ts proves the selector branches from fabricated states, which
  // cannot show that the reducer ever produces them — an ending stranded by
  // retuning would leave that suite green while the prose went dead. Defeat is
  // not included here; the reckless-loss test above already covers it.
  // Re-run when `journey.start` gave back the food and the preparation the
  // village hands out: all four are still reached, so a road that starts a
  // resource short did not strand an ending. This is the one balance assertion
  // in this file the change did not move at all.
  it("can end in every authored arrival ending", () => {
    const reached = new Set<string>();

    for (const seed of SCANNED_SEEDS) {
      for (const policy of [
        prudent,
        reckless,
        hoarding,
        spendthrift,
        provisioned,
      ]) {
        for (const which of ["quiet", "busy"] as const) {
          const end = playJourney(seed, policy, which).at(-1)!;
          if (end.phase === "arrived") {
            reached.add(arrivalEnding(end));
          }
        }
      }
    }

    expect([...reached].sort()).toEqual([
      "arrived",
      "limped",
      "spent",
      "travelOn",
    ]);
  });

  // The balance property `journey.start.food` was raised to fix, guarded directly
  // rather than by proxy. Reaching an ending at all says nothing about whether the
  // BEST one was ever on offer: at start.food 2 the road charged two hungry legs
  // to any run that met no bee hollow, capping hp at 8 against a TRAVEL_ON_HP_MIN
  // of 9, so travelOn was unreachable by every line of play on most seeds — and
  // no screen distinguished a run you lost from one you were never allowed to
  // win. `some` short-circuits on the first line that gets there, so this walks
  // the full option tree only for the seeds that are genuinely locked out.
  it("leaves the best ending reachable on most seeds", () => {
    // Memoized: an eight-leg road with two ways out of every leg and five
    // options at every scene makes the naive walk exponential, and it timed out
    // at 5s. The key is every field the rest of the journey can depend on —
    // including `seed` now that `canChooseOption`/`reduce` branch on
    // `weatherAt(state.seed, ...)`: without it, two states colliding on every
    // OTHER keyed field but differing in seed (and so in weather) would share
    // one cached answer that is wrong for whichever of them it was not
    // computed from.
    // `secondSceneId` is keyed for exactly that class of reason, one step on:
    // the two ways out of a fork can now produce the same `activeEncounterId`
    // with a place standing beside it on one of them and not the other. Those
    // two states have different available options and different reachable
    // endings, and without the field they would share one cached answer, wrong
    // for whichever of them it was not computed from.
    const seen = new Map<string, boolean>();
    function canReachTravelOn(state: GameState): boolean {
      const key = [
        state.phase,
        state.hp,
        state.food,
        state.preparation,
        state.legIndex,
        state.rngState,
        state.seed,
        state.activeEncounterId,
        state.secondSceneId,
        // Keyed on the species AND the depth: sorting the entry objects
        // themselves would compare "[object Object]" against itself and collide
        // every codex state in the walk onto one cached answer.
        state.known
          .map((entry) => `${entry.speciesId}:${entry.depth}`)
          .sort()
          .join("+"),
      ].join(",");
      const hit = seen.get(key);
      if (hit !== undefined) {
        return hit;
      }
      const result = walk(state);
      seen.set(key, result);
      return result;
    }

    function walk(state: GameState): boolean {
      switch (state.phase) {
        case "defeated":
          return false;
        case "arrived":
          return arrivalEnding(state) === "travelOn";
        // The departure morning is a line of play like any other: which
        // villager was met changes the food, the gear and the knowledge the
        // journey starts with, so all of them have to be tried before a seed
        // can be called locked out. The memo key already carries phase,
        // resources and `known`, so nothing new needs keying.
        case "village":
          return offeredVillageOptions(state).some((option) =>
            canReachTravelOn(
              reduce(state, {
                type: "CHOOSE_VILLAGE_OPTION",
                optionId: option.id,
              }),
            ),
          );
        case "traveling":
          // Every line of play now includes which way was walked, so every way
          // ON OFFER has to be tried before a seed can be called locked out.
          // The leg's full route list would include ways this leg does not
          // fork into, and naming one of those returns the same state — which
          // recurses forever.
          return offeredRoutes(state).some((route) =>
            canReachTravelOn(
              reduce(state, { type: "TRAVEL", routeId: route.id }),
            ),
          );
        default: {
          // Every option on the leg, across both scenes when it holds two:
          // answering the place is a line of play like any other, and a walk
          // that could not take it would call a seed locked out that is not.
          return activeScenes(state)
            .flatMap((scene) => scene.options)
            .some(
              (option) =>
                canChooseOption(state, option) &&
                canReachTravelOn(
                  reduce(state, {
                    type: "CHOOSE_ENCOUNTER_OPTION",
                    optionId: option.id,
                  }),
                ),
            );
        }
      }
    }

    const lockedOut = SCANNED_SEEDS.filter(
      (seed) =>
        !canReachTravelOn(
          reduce(createInitialState(), { type: "START_JOURNEY", seed }),
        ),
    );

    // Re-baselined 0.5 -> 0.4 for route branches, and this time it TIGHTENS.
    // Choosing which way to walk can only add lines of play, so lockout could
    // only fall: 94/200 (47.0%) became 59/200 (29.5%) on this cohort, and
    // 134/300 became 89/300 (29.7%) over the wider scan. That happens to undo
    // the codex's difficulty spike almost exactly — 29.7% is where the game sat
    // before `show-your-kit` went behind knowledge — so the two changes read as
    // one trade rather than two: a first meeting with wolves still costs
    // something, and the road now offers a way to be somewhere else.
    // The departure morning then fell on the same side — a free resource, and
    // a walk that tries every villager — taking it to 16/200 (8.0%). Giving
    // that resource back in `journey.start` is the first change to push it the
    // other way: 29/200 (14.5%), still under half of what it was before the
    // village existed, because the morning is now a CHOICE of which resource
    // to set out strong in rather than a handout on top of a full pack.
    // A leg holding two things then pushed it back the easy way: 20/200
    // (10.0%). Same reason as every other change that could only widen the
    // walk — a pair adds a whole second scene's options to a leg that already
    // had one scene's worth, and the exhaustive walk tries all of them.
    // A second ANIMAL on an animal leg is the same widening on the other band:
    // 16/200 (8.0%).
    // Layers then pushed it the HARD way, and by almost nothing: 17/200
    // (8.5%), one seed worse. That direction was expected — four situations now
    // meet an ignorant traveler with their observation locked, so the exhaustive
    // walk has strictly fewer lines of play at depth 0 than it had — and the
    // size of it says how little of the walk those four options were carrying.
    // The cap stays 0.4, and it is slack at 8.5% — this has been a collapse
    // guard rather than a tuning target since the village halved the figure it
    // watches. Recorded rather than tightened to fit: a cap re-derived from
    // each measurement is a record of the measurement, not a bound on it.
    expect(lockedOut.length / SCANNED_SEEDS.length).toBeLessThanOrEqual(0.4);
  });

  // Golden trace: recorded by running this journey down the QUIET way, which is
  // what `playJourney` walks by default. It breaks on any change whose effect
  // reaches the six projected columns ALONG THIS ONE LINE — the PRNG, a route's
  // odds, the number of authored encounters (which shifts what the selection
  // roll picks), and the deltas this line actually spends. Update it only when
  // such a change is deliberate.
  // It is a snapshot of one line of play, not a fence around the content: a
  // delta this line never pays, or pays where a clamp swallows it, goes by
  // unseen. See the blind spot recorded below.
  // Re-recorded for the eight-leg road, and again when two more places were
  // authored. That second re-recording changed ONLY the two `activeEncounterId`
  // values, because the places offer identical trades — which is exactly the
  // evidence that adding them moved no balance, only fiction.
  // KNOWN BLIND SPOT: this line meets `old-camp` and takes its rest, but always
  // at full hp, where the ceiling clamps the result — so raising that rest from
  // 2 to 3 left this trace byte-identical. A trace that touches a value is not
  // the same as a trace that covers it. That figure is pinned by name in the
  // road-event content test in `encounters.test.ts`. This line also never
  // learns the wolves, so `show-your-kit` never appears and its requirement is
  // not covered here either; `App.test.ts` derives that one from the content.
  // Re-recorded when the travel toll moved from the start of a leg to its
  // completion: the encounter row now carries the food that leg will spend
  // later, so only that row's food column changed.
  // Re-recorded again for milestone 4, deliberately: `journey.start.hp` dropped
  // from 20 to 14 so the arrival thresholds could bind, which shifts every hp
  // column by six. The choices along this line did not change — `show-your-kit`
  // is appended after `light-torch`, and prudent keeps the first of equal
  // hpDeltas, so this trace still spends a torch at the pines.
  // Re-recorded once more, deliberately: `journey.start.food` rose from 2 to 3,
  // so this line eats through three legs instead of two and walks only the last
  // one hungry. The single 3 hp toll at the end is the whole difference; the
  // choices are again unchanged.
  // A line that never learns anything meets `pine-shadows` with `show-your-kit`
  // hidden and `read-the-pack` (-1 hp) in its slot. `prudent` keeps the first of
  // equal maximal hpDeltas, so it still spends a torch. Content that swaps a
  // menu slot must not move a journey that never opens it.
  // Re-recorded when weather arrived: seed 1 is rain on both legs this line
  // meets `bee-hollow` (legs 6 and 7), and rain closes `smoke-them`. That
  // option was the first 0-hpDelta answer in the list and so was what
  // `prudent`'s tie-break picked; with it closed, the tie goes to `leave-it`
  // instead — +1 preparation rather than +2 food and a smoked comb, both
  // times, so a leg that used to arrive fed now arrives hungry and pays the
  // toll in hp instead. Only the last three rows move. `reach-in`'s own rain
  // reprice (-3 to -1) plays no part in the divergence: repriced or not, it is
  // still the worst hpDelta on offer, so `prudent` never picks it either way.
  // Re-recorded when the waxwings gained a second situation: the species pick
  // on leg 3 is unchanged, but there are now two ways to meet it and this seed
  // draws the hedge. ONE FIELD MOVED — the `activeEncounterId` — and not a
  // single resource column, because the hedge's `beat-the-hedge-over-your-sheet`
  // carries the same deltas as the rowan's `net-the-fall`. That is the evidence
  // that the situation split changed which scene a seed meets and nothing about
  // what the leg costs. The bees gained two situations in the same change and
  // this line still draws `bee-hollow` on both of its bee legs, so their
  // re-recording is a no-op here — which is a coincidence of this seed, not a
  // guarantee about the split.
  // Re-recorded for the departure morning, and the check that matters is what
  // did NOT move: the whole change is ONE PREPENDED ROW — the village state
  // START_JOURNEY now lands in, at the starting resources and legIndex 0 —
  // and in every later row all six PROJECTED columns are unchanged from the
  // trace recorded before the village existed. (Verified by slicing the first
  // row off the played trace and matching it against the previous recording.)
  // That is evidence the morning charges no toll, and it was arranged to be:
  // the line spent that morning on a villager who gave neither food nor gear —
  // the sky-teller, since cut — so any moved resource column would have been
  // the village paying or charging something. No such villager remains, which
  // is why the entry below has a column to account for rather than none.
  // It says nothing DIRECT about rolls — `project` omits `rngState`
  // and `seed`, so a consumed roll is invisible to this comparison except
  // through its consequences: it would shift what the selection rolls draw and
  // surface as a changed `activeEncounterId` on the later legs. The direct
  // proof is "spends no roll, whichever villager the morning is given to",
  // which asserts `rngState` itself across all three villagers.
  // Re-recorded when `journey.start` dropped a food (4 -> 3) and the morning
  // began buying it back: the shepherd this line used to spend the morning on
  // is gone, so it spends it on the baker.
  // ONE COLUMN MOVED, on ONE ROW: `food` on the village row, 4 to 3. The loaf
  // puts it back before the first leg, so every later food figure — and
  // `preparation`, `hp`, `phase`, `legIndex` and all six `activeEncounterId`s —
  // is identical to the trace recorded before this change. That single cell is
  // the whole of what taking a meal off the start does to a line that then
  // spends its morning getting the meal back, which is exactly the shape the
  // change was aiming for: the baker returns the traveler to the old starting
  // line, and the other two villagers trade that meal for something else.
  // Expected, not a defect: no roll is consumed by any of this and the seed's
  // road script is bit-for-bit what it was.
  // An earlier draft of this change also cut preparation 2 -> 1, which put
  // `preparation` one lower on every row here and cost far more than one cell
  // out on the road — see the note on `journey.start`. That draft is not what
  // is recorded above.
  // Re-recorded when a leg gained the ability to hold TWO things, and diffed
  // against the previous recording before being accepted. Two kinds of change
  // are legal here and both, and only both, occurred: the added
  // `secondSceneId` column on all sixteen rows, and ONE row — leg 0, which
  // turned up `old-camp` — now turning up a pair, with `wolves-at-a-kill` in
  // the animal slot and the place it used to hold in the second. Every other
  // row is identical, including all five later `activeEncounterId`s: the pair
  // is read off salts, so no roll moved and the seed's road script is
  // bit-for-bit what it was. No resource column moved anywhere, on that row or
  // after it, because `prudent` still takes `sleep-under-it` — +3 hp is the
  // unique best hpDelta across BOTH scenes, so widening the menu did not change
  // what this line picked. A change on a leg that turned up an animal, or any
  // movement in `legIndex`/`phase`, would have meant the roll discipline broke,
  // and there is none.
  // Re-run when an ANIMAL leg gained the ability to hold a second animal, and
  // NOT re-recorded: not one cell moved. Two things had to hold for that and
  // both did. This line meets the animal band on legs 3, 6 and 7, and the salt
  // says no on all three — three quarters of animal legs hold one animal, so
  // three in a row is the common case rather than a surprise. And the pair on
  // leg 0 is a PLACE-band leg, which the animal band's subdivision does not
  // touch at all. An unmoved trace is the expected outcome here, not a
  // suspicious one: the two shapes are pinned reachable by their own tests, and
  // what this file's silence adds is that no roll was consumed anywhere — a
  // spent roll would have shifted the later legs' draws and shown up as a
  // changed `activeEncounterId` further down.
  // Re-run when the codex went to LAYERS, and again NOT re-recorded: not one
  // cell moved. Checked rather than assumed, and wider than this row: the same
  // line was replayed on 200 seeds against the tree before the change, printing
  // `rngState` as well as the six columns below, and all 3216 rows are
  // byte-identical. `rngState` matters most of the three things that could not
  // move here — this change reads `known` and content only, so it must consume
  // no randomness at all — and `project` cannot see it, which is why it was
  // compared out of band.
  // Nothing moved in the resource columns either, and the reason is `prudent`:
  // it reduces over `hpDelta`, and every observation is strictly dominated by
  // some always-offered answer (content.test.ts), so an observation this line
  // never picks is one a locked rung can remove without being noticed. A policy
  // that wanted entries would meet four newly locked doors on this road.
  // Re-run when the trapper stopped being withdrawn at a full codex and started
  // offering his craft instead, and NOT re-recorded: not one cell moved, and no
  // legal change existed for it to make. This line walks a FIRST journey from a
  // fresh page load, so `known` is empty, the trapper has rungs to give, and the
  // saturated branch of `offeredVillageOptions` is never reached; the morning it
  // spends is the baker's, exactly as before. The craft's own rule is gated on
  // `restCraft`, which is false on every row here, so the hp column cannot move
  // either. Checked the same way the layered codex was, and wider than this row:
  // the same line was replayed on 200 seeds against the tree before the change,
  // printing `rngState` and `known` as well as the six columns below, and all
  // 3214 rows are byte-identical.
  // `project()` deliberately did NOT gain a `restCraft` column. Seed 1's single
  // journey can never hold a true value, so the column would pin nothing — it
  // would read `false` on all sixteen rows whatever the reducer did with the
  // flag, which is the shape of a cell that cannot fail. What pins the flag is
  // the village-morning and craft tests above, where a state can actually carry
  // it.
  it("matches the recorded trace for seed 1", () => {
    expect(playJourney(1, prudent).map(project)).toEqual([
      {
        phase: "village",
        activeEncounterId: null,
        secondSceneId: null,
        hp: 14,
        food: 3,
        preparation: 2,
        legIndex: 0,
      },
      {
        phase: "traveling",
        activeEncounterId: null,
        secondSceneId: null,
        hp: 14,
        food: 4,
        preparation: 2,
        legIndex: 0,
      },
      {
        phase: "encounter",
        activeEncounterId: "wolves-at-a-kill",
        secondSceneId: "old-camp",
        hp: 14,
        food: 4,
        preparation: 2,
        legIndex: 0,
      },
      {
        phase: "traveling",
        activeEncounterId: null,
        secondSceneId: null,
        hp: 14,
        food: 2,
        preparation: 2,
        legIndex: 1,
      },
      {
        phase: "encounter",
        activeEncounterId: "out-of-season-shieling",
        secondSceneId: null,
        hp: 14,
        food: 2,
        preparation: 2,
        legIndex: 1,
      },
      {
        phase: "traveling",
        activeEncounterId: null,
        secondSceneId: null,
        hp: 14,
        food: 0,
        preparation: 2,
        legIndex: 2,
      },
      {
        phase: "traveling",
        activeEncounterId: null,
        secondSceneId: null,
        hp: 11,
        food: 0,
        preparation: 2,
        legIndex: 3,
      },
      {
        phase: "encounter",
        activeEncounterId: "thorn-hedge-flock",
        secondSceneId: null,
        hp: 11,
        food: 0,
        preparation: 2,
        legIndex: 3,
      },
      {
        phase: "traveling",
        activeEncounterId: null,
        secondSceneId: null,
        hp: 11,
        food: 1,
        preparation: 1,
        legIndex: 4,
      },
      {
        phase: "encounter",
        activeEncounterId: "wrecked-cart",
        secondSceneId: null,
        hp: 11,
        food: 1,
        preparation: 1,
        legIndex: 4,
      },
      {
        phase: "traveling",
        activeEncounterId: null,
        secondSceneId: null,
        hp: 10,
        food: 0,
        preparation: 1,
        legIndex: 5,
      },
      {
        phase: "traveling",
        activeEncounterId: null,
        secondSceneId: null,
        hp: 7,
        food: 0,
        preparation: 1,
        legIndex: 6,
      },
      {
        phase: "encounter",
        activeEncounterId: "bee-hollow",
        secondSceneId: null,
        hp: 7,
        food: 0,
        preparation: 1,
        legIndex: 6,
      },
      {
        phase: "traveling",
        activeEncounterId: null,
        secondSceneId: null,
        hp: 4,
        food: 0,
        preparation: 2,
        legIndex: 7,
      },
      {
        phase: "encounter",
        activeEncounterId: "bee-hollow",
        secondSceneId: null,
        hp: 4,
        food: 0,
        preparation: 2,
        legIndex: 7,
      },
      {
        phase: "arrived",
        activeEncounterId: null,
        secondSceneId: null,
        hp: 1,
        food: 0,
        preparation: 3,
        legIndex: 8,
      },
    ]);
  });

  it("diverges between seeds", () => {
    // A seed lands in rngState directly, so these two pick opposite first legs.
    // Each is stepped through the departure morning on the same villager, who
    // spends no roll and hands both of them the same loaf, so what differs at
    // the first leg is the seed and nothing else.
    const startedBusy = reduce(createInitialState(), {
      type: "START_JOURNEY",
      seed: findRngState(true),
    });
    const startedQuiet = reduce(createInitialState(), {
      type: "START_JOURNEY",
      seed: findRngState(false),
    });
    const busy = reduce(startedBusy, bakerMorning(startedBusy));
    const quiet = reduce(startedQuiet, bakerMorning(startedQuiet));

    expect(reduce(busy, travel(busy)).phase).toBe("encounter");
    expect(reduce(quiet, travel(quiet)).phase).not.toBe("encounter");
  });
});
