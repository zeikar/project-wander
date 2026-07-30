import { describe, expect, it } from "vitest";
import type { GameState } from "./game-state";
import { arrivalText, LIMPED_HP_MAX } from "./arrival";
import { journey } from "../content/journey";

function makeArrivedState(overrides: Partial<GameState> = {}): GameState {
  return {
    phase: "arrived",
    hp: journey.start.hp,
    food: 0,
    preparation: journey.start.preparation,
    legIndex: journey.legs.length,
    rngState: 1,
    activeEncounterId: null,
    lastEncounterResult: null,
    log: [],
    ...overrides,
  };
}

describe("arrivalText", () => {
  it("selects unmarked when hp is exactly full", () => {
    const state = makeArrivedState();

    expect(arrivalText(state)).toBe(journey.arrival.variants.unmarked);
  });

  it("selects limped when hp is at or below the limped threshold", () => {
    const state = makeArrivedState({ hp: LIMPED_HP_MAX });

    expect(arrivalText(state)).toBe(journey.arrival.variants.limped);
  });

  it("selects provisioned when food remains", () => {
    const state = makeArrivedState({ hp: 14, food: 1 });

    expect(arrivalText(state)).toBe(journey.arrival.variants.provisioned);
  });

  it("selects wellStocked when preparation matches the starting amount", () => {
    const state = makeArrivedState({
      hp: 14,
      food: 0,
      preparation: journey.start.preparation,
    });

    expect(arrivalText(state)).toBe(journey.arrival.variants.wellStocked);
  });

  it("selects wellStocked when preparation was spent and later restored to the starting count", () => {
    // scatter-bait spends 1, leave-it regains 1: the count matches, even
    // though preparation was genuinely touched along the way.
    const state = makeArrivedState({
      hp: 14,
      food: 0,
      preparation: journey.start.preparation,
      log: [
        "A Boar in the Ford — Scatter some of your prepared bait downstream",
        "A Humming Hollow — Leave the tree its honey",
      ],
    });

    expect(arrivalText(state)).toBe(journey.arrival.variants.wellStocked);
  });

  it("selects default when none of the other facts hold", () => {
    const state = makeArrivedState({
      hp: 14,
      food: 0,
      preparation: journey.start.preparation - 1,
    });

    expect(arrivalText(state)).toBe(journey.arrival.variants.default);
  });

  it("prefers limped over provisioned when both would match", () => {
    const state = makeArrivedState({
      hp: LIMPED_HP_MAX,
      food: 1,
    });

    expect(arrivalText(state)).toBe(journey.arrival.variants.limped);
  });
});
