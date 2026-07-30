import { describe, expect, it } from "vitest";
import type { GameState } from "../core/game-state";
import { encounters } from "../content/encounters";
import { leavesNoFood } from "./App";

// No component test harness exists in this repo (App.tsx has no JSX-rendering
// tests), so this pins the predicate itself: a plain function of state and an
// option, tested the same way core's pure functions are.
function makeEncounterState(overrides: Partial<GameState> = {}): GameState {
  return {
    phase: "encounter",
    hp: 20,
    food: 1,
    preparation: 1,
    legIndex: 0,
    rngState: 1,
    activeEncounterId: "ford-boar",
    lastEncounterResult: null,
    log: [],
    ...overrides,
  };
}

const fordBoar = encounters.find((encounter) => encounter.id === "ford-boar")!;
const beeHollow = encounters.find(
  (encounter) => encounter.id === "bee-hollow",
)!;
const waitItOut = fordBoar.options.find(
  (option) => option.id === "wait-it-out",
)!; // foodDelta -1
const wadePast = fordBoar.options.find(
  (option) => option.id === "wade-past",
)!; // foodDelta 0
const reachIn = beeHollow.options.find(
  (option) => option.id === "reach-in",
)!; // foodDelta +2

describe("leavesNoFood", () => {
  it("warns when an affordable option would spend the last food", () => {
    const state = makeEncounterState({ food: 1 });

    expect(leavesNoFood(state, waitItOut)).toBe(true);
  });

  it("warns when food is already zero and the option does not replenish it", () => {
    const state = makeEncounterState({ food: 0 });

    expect(leavesNoFood(state, wadePast)).toBe(true);
  });

  it("does not warn when the option replenishes food", () => {
    const state = makeEncounterState({
      food: 0,
      activeEncounterId: "bee-hollow",
    });

    expect(leavesNoFood(state, reachIn)).toBe(false);
  });

  it("does not warn on an unaffordable option, even though the food math lands at or below zero", () => {
    const state = makeEncounterState({ food: 0 });

    // 0 + (-1) = -1: canChooseOption disables this button, so it must not
    // also claim finishing the leg will cost HP.
    expect(leavesNoFood(state, waitItOut)).toBe(false);
  });
});
