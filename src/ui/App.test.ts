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
)!; // hpDelta -3, foodDelta +2
const smokeThem = beeHollow.options.find(
  (option) => option.id === "smoke-them",
)!; // preparationDelta -1, foodDelta +2
const leaveIt = beeHollow.options.find(
  (option) => option.id === "leave-it",
)!; // preparationDelta +1
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
    const state = makeEncounterState({ preparation: 2, food: 2 });

    expect(costHint(state, lightTorch)).toBe(
      " — costs 1 preparation (leaves 1 in hand)",
    );
    expect(costHint(state, waitItOut)).toBe(" — costs 1 food");
  });

  // The measured failure this exists to fix: spending preparation can shut a
  // door at a later encounter, and nothing said so at the moment of spending.
  it("says what survives the spend, so the closing door is visible", () => {
    const rich = makeEncounterState({ preparation: 2 });
    const poor = makeEncounterState({ preparation: 1 });

    expect(costHint(rich, lightTorch)).toContain("(leaves 1 in hand)");
    expect(costHint(poor, lightTorch)).toContain("(leaves 0 in hand)");
  });

  // Regression: a cold reader saw "costs 1 preparation (-1 left in hand)" on an
  // option they could not afford. Same class of bug as the disabled-option HP
  // warning caught in an earlier milestone — a hint about a spend that cannot
  // happen is worse than no hint.
  it("shows no remainder on an option the player cannot afford", () => {
    const state = makeEncounterState({
      activeEncounterId: "pine-shadows",
      preparation: 0,
    });

    expect(canChooseOption(state, lightTorch)).toBe(false);
    expect(costHint(state, lightTorch)).toBe(" — costs 1 preparation");
    expect(costHint(state, lightTorch)).not.toContain("-1");
  });

  it("says nothing for an option that spends nothing", () => {
    const state = makeEncounterState();

    expect(costHint(state, wadePast)).toBe("");
  });

  it("states outright that a held requirement spends nothing", () => {
    const state = makeEncounterState({ preparation: 2 });
    const hint = costHint(state, showYourKit);

    // Playtest finding: the requirement/cost distinction was legible but not
    // TRUSTED — a hoarder read it correctly and still took a wound rather than
    // risk being billed. Saying "spends none" removes the inference.
    expect(hint).toBe(" — needs 2 preparation in hand, spends none");
    expect(hint).not.toContain("costs");
  });

  it("still explains a gated option that is disabled, so the button is not a dead end", () => {
    const state = makeEncounterState({
      activeEncounterId: "pine-shadows",
      preparation: showYourKit.requiresPreparation! - 1,
    });

    expect(canChooseOption(state, showYourKit)).toBe(false);
    expect(costHint(state, showYourKit)).toContain(
      "needs 2 preparation in hand",
    );
  });

  // The one deliberate secret, and the line it is drawn on: HP is hidden in BOTH
  // directions, while food and preparation are stated in both. Discovery of what
  // an animal does to you is the design; hiding a payout was never decided.
  it("keeps hp hidden while stating food and preparation", () => {
    const state = makeEncounterState();

    // wade-past is hpDelta -6 and spends nothing else, so it says nothing.
    expect(costHint(state, wadePast)).toBe("");
    // reach-in is hpDelta -3 AND foodDelta +2: the food shows, the blood does not.
    expect(costHint(state, reachIn)).toBe(" — gains 2 food");
    expect(costHint(state, reachIn)).not.toContain("3");
  });

  // Regression: a planning reader under-predicted the hollow twice in a row
  // because gains were unlabelled — "Costs are stated on the label; gains are
  // not stated anywhere."
  it("names what an option gives back", () => {
    const state = makeEncounterState({ preparation: 2 });

    expect(costHint(state, leaveIt)).toBe(" — gains 1 preparation");
    // smoke-them both spends and gives, so it carries one ledger clause.
    expect(costHint(state, smokeThem)).toBe(
      " — costs 1 preparation (leaves 1 in hand), gains 2 food",
    );
  });
});
