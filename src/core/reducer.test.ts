import { describe, expect, it } from "vitest";
import type { GameState } from "./game-state";
import { HUNGRY_TRAVEL_HP_LOSS, createInitialState } from "./game-state";
import {
  activeScenes,
  canChooseOption,
  findScene,
  offeredOptions,
  offeredRoutes,
  offeredVillageOptions,
  peekRoad,
  reduce,
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
    log: [],
    ...overrides,
  };
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
function playJourney(
  seed: number,
  pickOptionId: OptionPolicy,
  which: Which = "quiet",
): GameState[] {
  let state = reduce(createInitialState(), { type: "START_JOURNEY", seed });
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
    // choose between and the leg runs on one road.
    const animalOnBoth = makeTravelingState({ rngState: findRngState(true) });
    expect(offeredRoutes(animalOnBoth)).toHaveLength(1);
    expect(
      encounters.some(
        (e) =>
          e.id === reduce(animalOnBoth, travel(animalOnBoth)).activeEncounterId,
      ),
    ).toBe(true);

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
  // "place" is the one sign that does not say everything: a place-band leg may
  // hold an animal as well, and the sign does not mention it. That is the
  // deliberate under-report (see `RoadSign`), so this test can only demand the
  // place it named is there. The weakening is not left as the only record of
  // it — "the sign under-reports, on purpose" below asserts the pair case
  // directly, so a sign that stopped under-reporting would still be caught.
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
          // An animal and NOTHING else: the pair is carved out of the place
          // band, so an animal-band leg is always a lone animal.
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
  function makePairState(overrides: Partial<GameState> = {}): GameState {
    const before = makeTravelingState({
      rngState: findPlaceRngState("quiet", false, { paired: true }),
      seed: findSeedWith("clear", 0),
      ...overrides,
    });
    const next = reduce(before, {
      type: "TRAVEL",
      routeId: routeFor(before.legIndex, "quiet").id,
    });
    if (next.secondSceneId === null) {
      throw new Error("that state did not turn up a pair");
    }
    return next;
  }

  // The two things standing on this leg, resolved by KIND rather than by which
  // slot they are in. Which slot each sits in has its own test below; a fixture
  // that took the animal to BE the first slot would make every test using it
  // fail for that one reason, and stop saying anything about resolution or
  // about the codex gate.
  function animalAndPlace(state: GameState) {
    const scenes = activeScenes(state);
    const animal = encounters.find((candidate) =>
      scenes.some((scene) => scene.id === candidate.id),
    )!;
    const place = roadEvents.find((candidate) =>
      scenes.some((scene) => scene.id === candidate.id),
    )!;
    return { animal, place };
  }

  it("reads everything standing on the leg, animal first", () => {
    const animal = encounters[0]!;
    const place = roadEvents[0]!;

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

  // The order the screen shows a pair in: the animal first, the place beside
  // it. Rendering only — no rule reads the slot, and the codex gate resolves
  // the scene that owns each option rather than inheriting anything from this.
  it("always puts the animal in the first slot and the place in the second", () => {
    let pairs = 0;
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
        expect(
          roadEvents.some((candidate) => candidate.id === next.secondSceneId),
        ).toBe(true);
      }
    }

    expect(pairs).toBeGreaterThan(0);
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
    const state = makePairState({ food: 3, preparation: 3 });
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
    const state = makePairState({ food: 3, preparation: 3 });
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
    expect(next.known).not.toContain(animal.speciesId);
    expect(next.log).toEqual([
      ...state.log,
      `${place.title} — ${option.label}`,
    ]);
  });

  it("ignores an option belonging to neither thing on this leg, returning the same state reference", () => {
    const state = makePairState();
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
    const unknown = makePairState({ food: 3, preparation: 3 });
    const { animal, place } = animalAndPlace(unknown);
    const teaches = animal.options.find(
      (option) => option.codex === "teaches",
    )!;
    const requires = animal.options.find(
      (option) => option.codex === "requires",
    )!;
    const known = { ...unknown, known: [animal.speciesId] };

    expect(canChooseOption(unknown, teaches)).toBe(true);
    expect(canChooseOption(unknown, requires)).toBe(false);
    expect(canChooseOption(known, teaches)).toBe(false);
    expect(canChooseOption(known, requires)).toBe(true);

    // And the place is untouched by any of it: what you know about the animal
    // standing beside it cannot change what the place costs.
    for (const option of place.options) {
      expect(canChooseOption(known, option)).toBe(
        canChooseOption(unknown, option),
      );
    }
  });

  // Hand-built rather than walked, unlike everything else in this block: the
  // gate is pure in `(state, option)`, and no leg the reducer builds today
  // holds two ANIMALS — a pair is always a place and an animal. So this state
  // is unreachable until the task that puts two animals on one leg arrives, and
  // that task re-pins this on a walked leg. What it checks is exactly what
  // would break then: an option belonging to the second animal has to be gated
  // on the SECOND animal's species, not on the first slot's.
  it("reads the codex gate off the scene that owns the option, not off the first slot", () => {
    const first = encounters.find((scene) => scene.id === "ford-boar")!;
    const second = encounters.find((scene) => scene.id === "pine-shadows")!;
    const firstTeaches = first.options.find(
      (option) => option.codex === "teaches",
    )!;
    const firstRequires = first.options.find(
      (option) => option.codex === "requires",
    )!;
    const secondTeaches = second.options.find(
      (option) => option.codex === "teaches",
    )!;
    const secondRequires = second.options.find(
      (option) => option.codex === "requires",
    )!;

    // Clear sky and resources to spare, so the codex gate is the only thing
    // that can refuse any of these options.
    const base: Partial<GameState> = {
      phase: "encounter",
      activeEncounterId: first.id,
      secondSceneId: second.id,
      food: 3,
      preparation: 3,
      seed: findSeedWith("clear", 0),
    };
    const knowsFirst = makeTravelingState({
      ...base,
      known: [first.speciesId],
    });
    const knowsSecond = makeTravelingState({
      ...base,
      known: [second.speciesId],
    });

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
    for (const state of [knowsFirst, knowsSecond]) {
      for (const scene of [first, second]) {
        const shown = offeredOptions(state, scene);
        // Each scene hides exactly one option here — the spent observation in
        // the known one, the locked answer in the unknown one — so the
        // comparison below is not two all-true lists agreeing with each other.
        expect(shown.length).toBe(scene.options.length - 1);
        for (const option of scene.options) {
          expect(canChooseOption(state, option)).toBe(shown.includes(option));
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
  it("draws the paired animal off a real stream, not a constant", () => {
    const species = new Set<string>();
    const situations = new Map<string, Set<string>>();
    for (let rngState = 1; rngState <= 2000; rngState++) {
      const state = makeTravelingState({ rngState });
      for (const route of offeredRoutes(state)) {
        const next = reduce(state, { type: "TRAVEL", routeId: route.id });
        if (next.secondSceneId === null) {
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

    expect(taught.known).toEqual(["boar"]);

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
      known: ["wolves"],
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
      known: ["wolves"],
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
      known: ["wolves"],
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
    expect(canChooseOption({ ...base, known: ["wolves"] }, showYourKit)).toBe(
      true,
    );
  });

  it("closes the observation once there is nothing left to learn", () => {
    const readThePack = optionOf("pine-shadows", "read-the-pack");
    const base = makeTravelingState({
      phase: "encounter",
      activeEncounterId: "pine-shadows",
    });

    expect(canChooseOption(base, readThePack)).toBe(true);
    expect(canChooseOption({ ...base, known: ["wolves"] }, readThePack)).toBe(
      false,
    );
  });

  it("watching an animal costs the afternoon and teaches exactly one species", () => {
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

    expect(next.known).toEqual(["wolves"]);
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

  it("swaps the observation for what it unlocks, in both directions", () => {
    for (const encounter of encounters) {
      const teaches = encounter.options.find(
        (option) => option.codex === "teaches",
      )!;
      const requires = encounter.options.find(
        (option) => option.codex === "requires",
      )!;
      const base = makeTravelingState({
        phase: "encounter",
        activeEncounterId: encounter.id,
      });

      const unknown = offeredOptions(base, encounter).map(
        (option) => option.id,
      );
      const known = offeredOptions(
        { ...base, known: [encounter.speciesId] },
        encounter,
      ).map((option) => option.id);

      expect(unknown).toContain(teaches.id);
      expect(unknown).not.toContain(requires.id);
      expect(known).toContain(requires.id);
      expect(known).not.toContain(teaches.id);
      // One for one: learning swaps an answer in, it does not lengthen the menu.
      expect(known.length).toBe(unknown.length);
    }
  });

  // Reversed deliberately. This test used to assert the opposite — that a new
  // journey forgets — and that was the design until the reason behind it was
  // re-measured: knowledge collapsed the game because what it bought cost
  // nothing and beat everything, not because knowledge itself was too strong.
  // Priced, the knowledge answers run 20-60% of their offers and no situation
  // resolves to one option even when every animal is known.
  it("carries what was learned into the next journey", () => {
    const state = makeTravelingState({
      phase: "arrived",
      known: ["wolves", "bees"],
    });

    const next = reduce(state, { type: "START_JOURNEY", seed: 5 });

    expect(next.known).toEqual(["wolves", "bees"]);
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
        known: [speciesOf(encounterId)!],
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

    expect(options).toHaveLength(village.options.length);
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
    const state = makeVillageState({ known: [alreadyKnown] });
    const trapper = villager(state, (option) => option.teaches === true);

    expect(trapper.teachesSpecies).toBeDefined();
    expect(speciesList.map((species) => species.id)).toContain(
      trapper.teachesSpecies,
    );
    expect(state.known).not.toContain(trapper.teachesSpecies);

    const next = reduce(state, {
      type: "CHOOSE_VILLAGE_OPTION",
      optionId: trapper.id,
    });

    // Exactly the id the offer named, appended to what was already known.
    // This is the agreement itself under test: `trapper` is what a screen
    // rendering this state would show, and `next.known` is what the reducer
    // decided when handed only the id — one `offeredVillageOptions` away on
    // each side, and they land on the same animal.
    expect(next.known).toEqual([alreadyKnown, trapper.teachesSpecies]);
    expect(next.food).toBe(state.food);
    expect(next.preparation).toBe(state.preparation);
  });

  it("has only the animal still missing left to talk about", () => {
    const allButOne = speciesList.slice(0, -1).map((species) => species.id);
    const state = makeVillageState({ known: allButOne });

    expect(
      villager(state, (option) => option.teaches === true).teachesSpecies,
    ).toBe(speciesList.at(-1)!.id);
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

  // The recorded limitation, pinned as behaviour and deliberately left
  // uncompensated: with every animal known the trapper simply is not there.
  it("withdraws the trapper once there is nothing left to learn, and refuses him anyway", () => {
    const state = makeVillageState({
      known: speciesList.map((species) => species.id),
    });
    const options = offeredVillageOptions(state);
    const withheld = village.options.find(
      (option) => option.teaches === true,
    )!;

    expect(options).toHaveLength(village.options.length - 1);
    expect(options.some((option) => option.teaches === true)).toBe(false);
    expect(
      reduce(state, {
        type: "CHOOSE_VILLAGE_OPTION",
        optionId: withheld.id,
      }),
    ).toBe(state);
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
    expect(nextJourney.known).toEqual([taught]);

    const situation = encounters.find(
      (encounter) =>
        encounter.speciesId === taught &&
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
    // The floor stays 125 — deliberately well under the measured 164, because
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
        [...state.known].sort().join("+"),
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
    // The cap stays 0.4, and it is slack at 10.0% — this has been a collapse
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
