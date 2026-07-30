// Decides which ending a finished journey earned. Pure selection logic; the
// prose itself lives in content, per the dependency rule.

import type { GameState } from "./game-state";
import { journey } from "../content/journey";
import type { ArrivalEndingId } from "../content/journey";

const LIMPED_HP_THRESHOLD_RATIO = 0.35;
export const LIMPED_HP_MAX = Math.round(
  journey.start.hp * LIMPED_HP_THRESHOLD_RATIO,
); // ≈35% of starting hp

// The best ending is a conjunction over BOTH axes on purpose. Requiring only
// leftover supplies would make hoarding everything and eating the damage the new
// best line, since hp would cost nothing at the gate; requiring only hp would
// make spending every last thing free. Needing both at once is what forces a
// trade, and the trade is what the choices are for.
export const TRAVEL_ON_HP_MIN = 9;
export const TRAVEL_ON_SUPPLIES_MIN = 2;

export function arrivalEnding(state: GameState): ArrivalEndingId {
  const supplies = state.food + state.preparation;

  // First match wins. These conditions are NOT mutually exclusive and are not
  // meant to be: a traveler who arrives half-dead and empty-handed satisfies
  // both `limped` and `spent`, and priority decides it — nearly dying is the
  // louder fact, so it wins. The one pairing that must never overlap is
  // travelOn/limped, which holds because TRAVEL_ON_HP_MIN > LIMPED_HP_MAX
  // (asserted in arrival.test.ts).
  if (state.hp >= TRAVEL_ON_HP_MIN && supplies >= TRAVEL_ON_SUPPLIES_MIN) {
    return "travelOn";
  }
  if (state.hp <= LIMPED_HP_MAX) {
    return "limped";
  }
  if (state.food === 0 && state.preparation === 0) {
    return "spent";
  }
  return "arrived";
}
