import { describe, expect, it } from "vitest";
import type { GameState } from "../core/game-state";
import { encounters } from "../content/encounters";
import { canChooseOption } from "../core/reducer";
import { costHint, leavesNoFood } from "./App";

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
    lastRoadToll: null,
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
const pineShadows = encounters.find(
  (encounter) => encounter.id === "pine-shadows",
)!;
const showYourKit = pineShadows.options.find(
  (option) => option.id === "show-your-kit",
)!; // requiresPreparation 2, spends nothing
const lightTorch = pineShadows.options.find(
  (option) => option.id === "light-torch",
)!; // preparationDelta -1

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

describe("costHint", () => {
  it("names what an option spends", () => {
    expect(costHint(lightTorch)).toBe(" — costs 1 preparation");
    expect(costHint(waitItOut)).toBe(" — costs 1 food");
  });

  it("says nothing for an option that spends nothing", () => {
    expect(costHint(wadePast)).toBe("");
  });

  it("phrases a held-preparation requirement as a requirement, not a cost", () => {
    const hint = costHint(showYourKit);

    // The distinction is the point: this option takes no preparation, so calling
    // it a cost would be a lie about the resource the player is deciding over.
    expect(hint).toBe(" — needs 2 preparation in hand");
    expect(hint).not.toContain("costs");
  });

  it("still explains a gated option that is disabled, so the button is not a dead end", () => {
    const state = makeEncounterState({
      activeEncounterId: "pine-shadows",
      preparation: showYourKit.requiresPreparation! - 1,
    });

    // The reducer will refuse this choice at that preparation level, and the
    // hint is what tells the player why rather than leaving an inert button.
    expect(canChooseOption(state, showYourKit)).toBe(false);
    expect(costHint(showYourKit)).toContain("needs 2 preparation in hand");
  });

  it("keeps hp costs hidden, as intended", () => {
    // wade-past is hpDelta -6 and spends nothing else.
    expect(costHint(wadePast)).toBe("");
    expect(costHint(reachIn)).toBe("");
  });
});
