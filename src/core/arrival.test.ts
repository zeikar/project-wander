import { describe, expect, it } from "vitest";
import type { GameState } from "./game-state";
import {
  LIMPED_HP_MAX,
  TRAVEL_ON_HP_MIN,
  TRAVEL_ON_SUPPLIES_MIN,
  arrivalEnding,
} from "./arrival";
import { journey } from "../content/journey";
import type { ArrivalEndingId } from "../content/journey";

// These tests prove SELECTOR BRANCH COVERAGE only: they hand `arrivalEnding` a
// fabricated state, which says nothing about whether a real journey can produce
// it. Reducer-level reachability of every ending is asserted in reducer.test.ts,
// alongside the journey harness that already exists there.
function arrived(overrides: Partial<GameState> = {}): GameState {
  return {
    phase: "arrived",
    hp: journey.start.hp,
    food: 0,
    preparation: 0,
    legIndex: journey.legs.length,
    rngState: 1,
    activeEncounterId: null,
    lastEncounterResult: null,
    lastRoadToll: null,
    log: [],
    ...overrides,
  };
}

describe("arrivalEnding", () => {
  // Load-bearing: travelOn is checked before limped, so a travelOn state must
  // never also satisfy the limped condition or the better ending is shadowed.
  it("keeps travelOn and limped disjoint", () => {
    expect(TRAVEL_ON_HP_MIN).toBeGreaterThan(LIMPED_HP_MAX);
  });

  it("travelOn: enough hp left AND enough supplies left", () => {
    const state = arrived({
      hp: TRAVEL_ON_HP_MIN,
      food: TRAVEL_ON_SUPPLIES_MIN,
      preparation: 0,
    });

    expect(arrivalEnding(state)).toBe("travelOn");
  });

  it("limped: hp at or under the threshold outranks anything else", () => {
    const state = arrived({
      hp: LIMPED_HP_MAX,
      food: TRAVEL_ON_SUPPLIES_MIN + 5,
      preparation: 5,
    });

    expect(arrivalEnding(state)).toBe("limped");
  });

  it("spent: upright but carrying nothing at all", () => {
    const state = arrived({ hp: TRAVEL_ON_HP_MIN, food: 0, preparation: 0 });

    expect(arrivalEnding(state)).toBe("spent");
  });

  it("arrived: still carrying something, but not enough to go on", () => {
    const state = arrived({
      hp: TRAVEL_ON_HP_MIN - 1,
      food: 1,
      preparation: 0,
    });

    expect(arrivalEnding(state)).toBe("arrived");
  });

  // Regression: an earlier design keyed the best ending on preparation alone and
  // ignored food entirely, so a traveler arriving well fed was scored as though
  // the pack were empty. Two states differing ONLY in food must not agree.
  it("counts food, not just preparation", () => {
    const fed = arrived({
      hp: TRAVEL_ON_HP_MIN,
      preparation: 0,
      food: TRAVEL_ON_SUPPLIES_MIN,
    });
    const empty = arrived({
      hp: TRAVEL_ON_HP_MIN,
      preparation: 0,
      food: 0,
    });

    expect(arrivalEnding(fed)).toBe("travelOn");
    expect(arrivalEnding(empty)).not.toBe("travelOn");
  });

  it("lets food and preparation substitute toward the supply bar", () => {
    const allFood = arrived({
      hp: TRAVEL_ON_HP_MIN,
      food: TRAVEL_ON_SUPPLIES_MIN,
      preparation: 0,
    });
    const allPrep = arrived({
      hp: TRAVEL_ON_HP_MIN,
      food: 0,
      preparation: TRAVEL_ON_SUPPLIES_MIN,
    });

    expect(arrivalEnding(allFood)).toBe("travelOn");
    expect(arrivalEnding(allPrep)).toBe("travelOn");
  });

  it("gives every authored ending a label and prose", () => {
    const ids: ArrivalEndingId[] = ["travelOn", "limped", "spent", "arrived"];

    for (const id of ids) {
      expect(journey.arrival.endings[id].label.length).toBeGreaterThan(0);
      expect(journey.arrival.endings[id].text.length).toBeGreaterThan(0);
    }
  });
});
