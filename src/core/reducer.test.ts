import { describe, expect, it } from "vitest";
import type { GameState } from "./game-state";
import { HUNGRY_TRAVEL_HP_LOSS, createInitialState } from "./game-state";
import { canChooseOption, offeredOptions, reduce } from "./reducer";
import type { GameAction } from "./actions";
import { arrivalEnding } from "./arrival";
import { rollRandom } from "./rng";
import { journey } from "../content/journey";
import { encounters } from "../content/encounters";
import type { EncounterOption } from "../content/encounters";

function makeTravelingState(overrides: Partial<GameState> = {}): GameState {
  return {
    phase: "traveling",
    hp: 20,
    food: 2,
    preparation: 3,
    legIndex: 0,
    rngState: 1,
    activeEncounterId: null,
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

// Tests that are not about the branch walk the quiet way; the branch's own
// tests name both.
function travel(state: GameState, which: Which = "quiet"): GameAction {
  return { type: "TRAVEL", routeId: routeFor(state.legIndex, which).id };
}

// Finds an rng state whose next roll does (or does not) trigger an encounter on
// the given way. Derived rather than hardcoded, so retuning a route's odds does
// not silently invalidate every test that needs a quiet or a busy leg.
function findRngState(triggersEncounter: boolean, which: Which = "quiet"): number {
  const chance = routeFor(0, which).encounterChance;
  for (let state = 1; state <= 1000; state++) {
    if ((rollRandom(state).value < chance) === triggersEncounter) {
      return state;
    }
  }
  throw new Error(
    `no rng state in 1..1000 ${triggersEncounter ? "triggers" : "avoids"} an encounter`,
  );
}

type OptionPolicy = (state: GameState) => string;

function affordableOptions(state: GameState): readonly EncounterOption[] {
  const encounter = encounters.find(
    (candidate) => candidate.id === state.activeEncounterId,
  );
  if (!encounter) {
    throw new Error(`no active encounter: ${state.activeEncounterId}`);
  }
  const affordable = encounter.options.filter((option) =>
    canChooseOption(state, option),
  );
  if (affordable.length === 0) {
    throw new Error(`no affordable option for ${encounter.id}`);
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

// Plays a whole journey from a seed and returns every state along the way. The
// step bound doubles as a proof that no state can leave the player stuck.
function playJourney(
  seed: number,
  pickOptionId: OptionPolicy,
  which: Which = "quiet",
): GameState[] {
  let state = reduce(createInitialState(), { type: "START_JOURNEY", seed });
  const trace: GameState[] = [state];

  for (let step = 0; step < 50; step++) {
    if (state.phase !== "traveling" && state.phase !== "encounter") {
      return trace;
    }
    state =
      state.phase === "traveling"
        ? reduce(state, travel(state, which))
        : reduce(state, {
            type: "CHOOSE_ENCOUNTER_OPTION",
            optionId: pickOptionId(state),
          });
    trace.push(state);
  }

  throw new Error(`journey from seed ${seed} did not end within 50 steps`);
}

function project(state: GameState) {
  return {
    phase: state.phase,
    activeEncounterId: state.activeEncounterId,
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
      hp: 20,
      legIndex: 0,
      rngState: findRngState(false),
    });
    const next = reduce(state, travel(state));

    expect(next.food).toBe(1);
    expect(next.hp).toBe(20);
    expect(next.legIndex).toBe(1);
  });

  it("completing a leg hungry: loses exactly HUNGRY_TRAVEL_HP_LOSS hp, food stays 0", () => {
    const state = makeTravelingState({
      food: 0,
      hp: 20,
      legIndex: 0,
      rngState: findRngState(false),
    });
    const next = reduce(state, travel(state));

    expect(next.hp).toBe(20 - HUNGRY_TRAVEL_HP_LOSS);
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

    expect(next.phase).toBe("traveling");
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
    // Mirrors the reducer's uniform pick over the non-empty authored list.
    const expected =
      encounters[Math.floor(selection.value * encounters.length)]!;

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
      hp: 20,
      rngState: findRngState(false),
    });

    const next = reduce(state, travel(state));

    expect(next.phase).toBe("arrived");
    expect(next.food).toBe(1);
    expect(next.hp).toBe(20);
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

// An rng state whose next roll lands BETWEEN the two ways' odds: the busy way
// turns something up on it, the quiet way walks straight through.
function findSplittingRngState(): number {
  const quiet = routeFor(0, "quiet").encounterChance;
  const busy = routeFor(0, "busy").encounterChance;
  for (let state = 1; state <= 10000; state++) {
    const value = rollRandom(state).value;
    if (value >= quiet && value < busy) {
      return state;
    }
  }
  throw new Error("no rng state in 1..10000 falls between the two ways");
}

describe("route branches", () => {
  // `routeFor` resolves a way by its odds and is used from leg 0 to describe
  // every leg, so the legs really do have to agree.
  it("offers two distinctly-named ways with the same pair of odds on every leg", () => {
    const pairs = new Set<string>();

    for (const leg of journey.legs) {
      expect(leg.routes).toHaveLength(2);
      expect(new Set(leg.routes.map((route) => route.id)).size).toBe(2);
      pairs.add(
        leg.routes
          .map((route) => route.encounterChance)
          .sort()
          .join("/"),
      );
    }

    expect(pairs.size).toBe(1);
  });

  it("turns something up on a roll the quiet way walks straight through", () => {
    const state = makeTravelingState({ rngState: findSplittingRngState() });

    expect(reduce(state, travel(state, "busy")).phase).toBe("encounter");
    expect(reduce(state, travel(state, "quiet")).phase).toBe("traveling");
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
  it("charges the same toll whichever way is walked", () => {
    // A roll high enough that neither way turns anything up, so what is left in
    // the difference is only the road's own charge.
    const state = makeTravelingState({
      rngState: findRngState(false, "busy"),
      food: 2,
      hp: 12,
    });

    const viaQuiet = reduce(state, travel(state, "quiet"));
    const viaBusy = reduce(state, travel(state, "busy"));

    expect(viaQuiet.phase).toBe("traveling");
    expect(viaBusy).toEqual(viaQuiet);
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

describe("encounter choices", () => {
  it("applies the chosen option's deltas and moves on down the road", () => {
    const state = makeTravelingState({
      phase: "encounter",
      activeEncounterId: "bee-hollow",
      hp: 20,
      food: 0,
      preparation: 3,
      legIndex: 1,
    });
    const reachIn = encounters
      .find((encounter) => encounter.id === "bee-hollow")
      ?.options.find((option) => option.id === "reach-in");

    const next = reduce(state, {
      type: "CHOOSE_ENCOUNTER_OPTION",
      optionId: "reach-in",
    });

    expect(next.hp).toBe(17);
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
      hp: 20,
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
      known: ["pine-shadows"],
    });

    expect(
      canChooseOption({ ...base, preparation: threshold - 1 }, showYourKit),
    ).toBe(false);
    expect(canChooseOption({ ...base, preparation: threshold }, showYourKit)).toBe(
      true,
    );
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
      known: ["pine-shadows"],
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
      known: ["pine-shadows"],
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
      canChooseOption({ ...base, known: ["pine-shadows"] }, showYourKit),
    ).toBe(true);
  });

  it("closes the observation once there is nothing left to learn", () => {
    const readThePack = optionOf("pine-shadows", "read-the-pack");
    const base = makeTravelingState({
      phase: "encounter",
      activeEncounterId: "pine-shadows",
    });

    expect(canChooseOption(base, readThePack)).toBe(true);
    expect(
      canChooseOption({ ...base, known: ["pine-shadows"] }, readThePack),
    ).toBe(false);
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

    expect(next.known).toEqual(["pine-shadows"]);
    expect(next.hp).toBe(10 - 2);
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
        { ...base, known: [encounter.id] },
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

  it("a new journey starts ignorant", () => {
    const state = makeTravelingState({
      phase: "arrived",
      known: ["pine-shadows", "bee-hollow"],
    });

    expect(reduce(state, { type: "START_JOURNEY", seed: 5 }).known).toEqual([]);
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
        known: [encounterId],
        legIndex: 1,
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

describe("full journeys", () => {
  it("can be lost: reckless play is defeated on at least one seed", () => {
    const lost = SCANNED_SEEDS.filter(
      (seed) => playJourney(seed, reckless).at(-1)?.phase === "defeated",
    );

    expect(lost.length).toBeGreaterThan(0);
  });

  it("can be won: prudent play arrives alive on nearly every seed", () => {
    const won = SCANNED_SEEDS.filter((seed) => {
      const end = playJourney(seed, prudent).at(-1);
      return end?.phase === "arrived" && end.hp > 0;
    });

    // 200 of 200 when this was written. The floor sits deliberately below that
    // so small retuning does not fail the suite, while a collapse in how
    // survivable careful play is still does.
    expect(won.length).toBeGreaterThanOrEqual(180);
  });

  it("replays identically from the same seed", () => {
    expect(playJourney(3, prudent)).toEqual(playJourney(3, prudent));
  });

  // Every authored arrival ending has to be something a real journey can end in.
  // arrival.test.ts proves the selector branches from fabricated states, which
  // cannot show that the reducer ever produces them — an ending stranded by
  // retuning would leave that suite green while the prose went dead. Defeat is
  // not included here; the reckless-loss test above already covers it.
  it("can end in every authored arrival ending", () => {
    const reached = new Set<string>();

    for (const seed of SCANNED_SEEDS) {
      for (const policy of [prudent, reckless, hoarding, spendthrift]) {
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
    function canReachTravelOn(state: GameState): boolean {
      switch (state.phase) {
        case "defeated":
          return false;
        case "arrived":
          return arrivalEnding(state) === "travelOn";
        case "traveling":
          // Every line of play now includes which way was walked, so both have
          // to be tried before a seed can be called locked out.
          return journey.legs[state.legIndex]!.routes.some((route) =>
            canReachTravelOn(
              reduce(state, { type: "TRAVEL", routeId: route.id }),
            ),
          );
        default: {
          const encounter = encounters.find(
            (candidate) => candidate.id === state.activeEncounterId,
          )!;
          return encounter.options.some(
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
    // The cap keeps roughly the same headroom over the measured figure as the
    // 0.4/32.5% pairing it replaces.
    expect(lockedOut.length / SCANNED_SEEDS.length).toBeLessThanOrEqual(0.4);
  });

  // Golden trace: recorded by running this journey down the QUIET way, which is
  // what `playJourney` walks by default. It intentionally breaks on any change
  // to the PRNG, a route's odds, content deltas, or the number of authored
  // encounters (which shifts what the selection roll picks) — update it only
  // when such a change is deliberate.
  // NOT re-recorded for route branches, and that is not an oversight: seed 1's
  // four trigger rolls all happen to miss the band between the old flat 0.6 and
  // the quiet way's 0.5, so this one line of play is genuinely unchanged. The
  // branch is pinned by the tests above it instead — the two ways reach a
  // different outcome on 205 of 300 seeds under a fixed option policy.
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
  // NOT re-recorded for milestone 5's codex, and that is the point: this line
  // meets `pine-shadows` knowing nothing, so its menu is
  // walk-on / light-torch / share-food / read-the-pack — `show-your-kit` is now
  // hidden and `read-the-pack` (-2 hp) takes its slot. `prudent` still keeps the
  // first of equal maximal hpDeltas, which is still `light-torch` at 0. Adding
  // content that swaps a menu slot must not move a journey that never learns
  // anything, and this trace is what proves it.
  it("matches the recorded trace for seed 1", () => {
    expect(playJourney(1, prudent).map(project)).toEqual([
      {
        phase: "traveling",
        activeEncounterId: null,
        hp: 14,
        food: 3,
        preparation: 2,
        legIndex: 0,
      },
      {
        phase: "traveling",
        activeEncounterId: null,
        hp: 14,
        food: 2,
        preparation: 2,
        legIndex: 1,
      },
      {
        phase: "encounter",
        activeEncounterId: "pine-shadows",
        hp: 14,
        food: 2,
        preparation: 2,
        legIndex: 1,
      },
      {
        phase: "traveling",
        activeEncounterId: null,
        hp: 14,
        food: 1,
        preparation: 1,
        legIndex: 2,
      },
      {
        phase: "traveling",
        activeEncounterId: null,
        hp: 14,
        food: 0,
        preparation: 1,
        legIndex: 3,
      },
      {
        phase: "arrived",
        activeEncounterId: null,
        hp: 11,
        food: 0,
        preparation: 1,
        legIndex: 4,
      },
    ]);
  });

  it("diverges between seeds", () => {
    // A seed lands in rngState directly, so these two pick opposite first legs.
    const busy = reduce(createInitialState(), {
      type: "START_JOURNEY",
      seed: findRngState(true),
    });
    const quiet = reduce(createInitialState(), {
      type: "START_JOURNEY",
      seed: findRngState(false),
    });

    expect(reduce(busy, travel(busy)).phase).toBe("encounter");
    expect(reduce(quiet, travel(quiet)).phase).not.toBe("encounter");
  });
});
