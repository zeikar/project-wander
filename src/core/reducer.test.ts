import { describe, expect, it } from "vitest";
import type { GameState } from "./game-state";
import {
  ENCOUNTER_CHANCE,
  HUNGRY_TRAVEL_HP_LOSS,
  createInitialState,
} from "./game-state";
import { canChooseOption, reduce } from "./reducer";
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
    log: [],
    ...overrides,
  };
}

// Finds an rng state whose next roll does (or does not) trigger an encounter.
// Derived rather than hardcoded, so retuning ENCOUNTER_CHANCE does not silently
// invalidate every test that needs a quiet or a busy leg.
function findRngState(triggersEncounter: boolean): number {
  for (let state = 1; state <= 1000; state++) {
    if ((rollRandom(state).value < ENCOUNTER_CHANCE) === triggersEncounter) {
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
function playJourney(seed: number, pickOptionId: OptionPolicy): GameState[] {
  let state = reduce(createInitialState(), { type: "START_JOURNEY", seed });
  const trace: GameState[] = [state];

  for (let step = 0; step < 50; step++) {
    if (state.phase !== "traveling" && state.phase !== "encounter") {
      return trace;
    }
    state =
      state.phase === "traveling"
        ? reduce(state, { type: "TRAVEL" })
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
    const next = reduce(state, { type: "TRAVEL" });

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
    const next = reduce(state, { type: "TRAVEL" });

    expect(next.hp).toBe(20 - HUNGRY_TRAVEL_HP_LOSS);
    expect(next.food).toBe(0);
    expect(next.legIndex).toBe(1);
  });

  it("ignores TRAVEL outside the traveling phase, returning the same state reference", () => {
    const state = createInitialState();
    const next = reduce(state, { type: "TRAVEL" });

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

    const first = reduce(state, { type: "TRAVEL" });
    const second = reduce(state, { type: "TRAVEL" });

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

    const next = reduce(state, { type: "TRAVEL" });

    expect(next.phase).toBe("encounter");
    expect(next.activeEncounterId).toBe(expected.id);
    expect(next.legIndex).toBe(state.legIndex);
    expect(next.food).toBe(state.food);
    expect(next.hp).toBe(state.hp);
    expect(next.rngState).toBe(selection.nextState);
  });

  it("spends exactly one roll on a quiet leg", () => {
    const state = makeTravelingState({ rngState: findRngState(false) });

    const next = reduce(state, { type: "TRAVEL" });

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

    const next = reduce(state, { type: "TRAVEL" });

    expect(next.log).toEqual(inputLog);
    expect(next.log).toBe(inputLog);
  });

  it("clears a stale encounter result when travel resumes", () => {
    const state = makeTravelingState({
      rngState: findRngState(false),
      lastEncounterResult: "the sounds that follow you are busy ones",
    });

    const next = reduce(state, { type: "TRAVEL" });

    expect(next.lastEncounterResult).toBeNull();
  });

  it("starving at leg completion ends the journey after the roll", () => {
    const state = makeTravelingState({
      hp: HUNGRY_TRAVEL_HP_LOSS,
      food: 0,
      legIndex: 0,
      rngState: findRngState(false),
    });

    const next = reduce(state, { type: "TRAVEL" });

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

    const next = reduce(state, { type: "TRAVEL" });

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

    const next = reduce(state, { type: "TRAVEL" });

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

    const next = reduce(state, { type: "TRAVEL" });

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

    const next = reduce(state, { type: "TRAVEL" });

    expect(next.phase).toBe("arrived");
    expect(next.hp).toBe(HUNGRY_TRAVEL_HP_LOSS + 2 - HUNGRY_TRAVEL_HP_LOSS);
  });

  it("ignores TRAVEL during an encounter, returning the same state reference", () => {
    const state = makeTravelingState({
      phase: "encounter",
      activeEncounterId: "ford-boar",
    });

    expect(reduce(state, { type: "TRAVEL" })).toBe(state);
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

    const next = reduce(state, { type: "TRAVEL" });

    expect(next.lastRoadToll).toBe(journey.road.fed);
    expect(next.food).toBe(1);
  });

  it("names the miles instead when there is nothing left to eat", () => {
    const state = makeTravelingState({
      food: 0,
      hp: 14,
      rngState: findRngState(false),
    });

    const next = reduce(state, { type: "TRAVEL" });

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

    const next = reduce(state, { type: "TRAVEL" });

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
        const end = playJourney(seed, policy).at(-1)!;
        if (end.phase === "arrived") {
          reached.add(arrivalEnding(end));
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

  // Golden trace: recorded by running this journey. It intentionally breaks on
  // any change to the PRNG, ENCOUNTER_CHANCE, content deltas, or the number of
  // authored encounters (which shifts what the selection roll picks) — update
  // it only when such a change is deliberate.
  // Re-recorded when the travel toll moved from the start of a leg to its
  // completion: the encounter row now carries the food that leg will spend
  // later, so only that row's food column changed.
  // Re-recorded again for milestone 4, deliberately: `journey.start.hp` dropped
  // from 20 to 14 so the arrival thresholds could bind, which shifts every hp
  // column by six. The choices along this line did not change — `show-your-kit`
  // is appended after `light-torch`, and prudent keeps the first of equal
  // hpDeltas, so this trace still spends a torch at the pines.
  it("matches the recorded trace for seed 1", () => {
    expect(playJourney(1, prudent).map(project)).toEqual([
      {
        phase: "traveling",
        activeEncounterId: null,
        hp: 14,
        food: 2,
        preparation: 2,
        legIndex: 0,
      },
      {
        phase: "traveling",
        activeEncounterId: null,
        hp: 14,
        food: 1,
        preparation: 2,
        legIndex: 1,
      },
      {
        phase: "encounter",
        activeEncounterId: "pine-shadows",
        hp: 14,
        food: 1,
        preparation: 2,
        legIndex: 1,
      },
      {
        phase: "traveling",
        activeEncounterId: null,
        hp: 14,
        food: 0,
        preparation: 1,
        legIndex: 2,
      },
      {
        phase: "traveling",
        activeEncounterId: null,
        hp: 11,
        food: 0,
        preparation: 1,
        legIndex: 3,
      },
      {
        phase: "arrived",
        activeEncounterId: null,
        hp: 8,
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

    expect(reduce(busy, { type: "TRAVEL" }).phase).toBe("encounter");
    expect(reduce(quiet, { type: "TRAVEL" }).phase).not.toBe("encounter");
  });
});
