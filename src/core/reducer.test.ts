import { describe, expect, it } from "vitest";
import type { GameState } from "./game-state";
import { HUNGRY_TRAVEL_HP_LOSS, createInitialState } from "./game-state";
import { reduce } from "./reducer";
import { journey } from "../content/journey";

function makeTravelingState(overrides: Partial<GameState> = {}): GameState {
  return {
    phase: "traveling",
    hp: 20,
    food: 2,
    preparation: 3,
    legIndex: 0,
    ...overrides,
  };
}

describe("reduce", () => {
  it("fed travel: consumes food, leaves hp unchanged, advances the leg", () => {
    const state = makeTravelingState({ food: 2, hp: 20, legIndex: 0 });
    const next = reduce(state, { type: "TRAVEL" });

    expect(next.food).toBe(1);
    expect(next.hp).toBe(20);
    expect(next.legIndex).toBe(1);
  });

  it("hungry travel: loses exactly HUNGRY_TRAVEL_HP_LOSS hp, food stays 0", () => {
    const state = makeTravelingState({ food: 0, hp: 20, legIndex: 0 });
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
    const next = reduce(state, { type: "START_JOURNEY" });

    expect(next).toBe(state);
  });

  it("completes the full journey with hp remaining above 0", () => {
    let state = reduce(createInitialState(), { type: "START_JOURNEY" });

    for (let i = 0; i < journey.legs.length; i++) {
      state = reduce(state, { type: "TRAVEL" });
    }

    expect(state.phase).toBe("arrived");
    expect(state.hp).toBeGreaterThan(0);
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
