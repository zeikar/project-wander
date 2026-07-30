import { describe, expect, it } from "vitest";
import type { GameState } from "./game-state";
import {
  ENCOUNTER_CHANCE,
  HUNGRY_TRAVEL_HP_LOSS,
  createInitialState,
} from "./game-state";
import { canChooseOption, reduce } from "./reducer";
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
  it("fed travel: consumes food, leaves hp unchanged, advances the leg", () => {
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

  it("hungry travel: loses exactly HUNGRY_TRAVEL_HP_LOSS hp, food stays 0", () => {
    const state = makeTravelingState({
      food: 0,
      hp: 20,
      legIndex: 0,
      rngState: findRngState(false),
    });
    const next = reduce(state, { type: "TRAVEL" });

    expect(next.hp).toBe(20 - HUNGRY_TRAVEL_HP_LOSS);
    expect(next.food).toBe(0);
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
    });
    const next = reduce(state, { type: "START_JOURNEY", seed: 9 });

    expect(next.phase).toBe("traveling");
    expect(next.hp).toBe(journey.start.hp);
    expect(next.food).toBe(journey.start.food);
    expect(next.preparation).toBe(journey.start.preparation);
    expect(next.legIndex).toBe(0);
    expect(next.activeEncounterId).toBeNull();
    expect(next.lastEncounterResult).toBeNull();
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
    expect(next.food).toBe(state.food - 1);
    expect(next.rngState).toBe(selection.nextState);
  });

  it("spends exactly one roll on a quiet leg", () => {
    const state = makeTravelingState({ rngState: findRngState(false) });

    const next = reduce(state, { type: "TRAVEL" });

    expect(next.phase).toBe("traveling");
    expect(next.activeEncounterId).toBeNull();
    expect(next.rngState).toBe(rollRandom(state.rngState).nextState);
  });

  it("clears a stale encounter result when travel resumes", () => {
    const state = makeTravelingState({
      rngState: findRngState(false),
      lastEncounterResult: "the sounds that follow you are busy ones",
    });

    const next = reduce(state, { type: "TRAVEL" });

    expect(next.lastEncounterResult).toBeNull();
  });

  it("starving ends the journey without spending a roll", () => {
    const state = makeTravelingState({ hp: 3, food: 0 });

    const next = reduce(state, { type: "TRAVEL" });

    expect(next.hp).toBe(0);
    expect(next.phase).toBe("defeated");
    expect(next.rngState).toBe(state.rngState);
    expect(next.legIndex).toBe(state.legIndex);
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
    expect(next.food).toBe(2);
    expect(next.preparation).toBe(3);
    expect(next.phase).toBe("traveling");
    expect(next.legIndex).toBe(2);
    expect(next.activeEncounterId).toBeNull();
    expect(next.lastEncounterResult).toBe(reachIn?.resultText);
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

  // Golden trace: recorded by running this journey. It intentionally breaks on
  // any change to the PRNG, ENCOUNTER_CHANCE, content deltas, or the number of
  // authored encounters (which shifts what the selection roll picks) — update
  // it only when such a change is deliberate.
  it("matches the recorded trace for seed 1", () => {
    expect(playJourney(1, prudent).map(project)).toEqual([
      {
        phase: "traveling",
        activeEncounterId: null,
        hp: 20,
        food: 2,
        preparation: 3,
        legIndex: 0,
      },
      {
        phase: "traveling",
        activeEncounterId: null,
        hp: 20,
        food: 1,
        preparation: 3,
        legIndex: 1,
      },
      {
        phase: "encounter",
        activeEncounterId: "pine-shadows",
        hp: 20,
        food: 0,
        preparation: 3,
        legIndex: 1,
      },
      {
        phase: "traveling",
        activeEncounterId: null,
        hp: 20,
        food: 0,
        preparation: 2,
        legIndex: 2,
      },
      {
        phase: "traveling",
        activeEncounterId: null,
        hp: 17,
        food: 0,
        preparation: 2,
        legIndex: 3,
      },
      {
        phase: "arrived",
        activeEncounterId: null,
        hp: 14,
        food: 0,
        preparation: 2,
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
