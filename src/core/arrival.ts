// Picks which arrival paragraph fits how the journey actually went. Pure
// selection logic; the prose itself lives in content, per the dependency rule.

import type { GameState } from "./game-state";
import { journey } from "../content/journey";

const LIMPED_HP_THRESHOLD_RATIO = 0.35;
export const LIMPED_HP_MAX = Math.round(
  journey.start.hp * LIMPED_HP_THRESHOLD_RATIO,
); // ≈35% of starting hp

export function arrivalText(state: GameState): string {
  const { variants } = journey.arrival;

  // Full hp is the strongest signal a run went cleanly (no wound, no hungry
  // night), so it's checked first. Hp itself is always visible via StatRow;
  // what's hidden is each option's hp cost until you choose it.
  if (state.hp === journey.start.hp) {
    return variants.unmarked;
  }
  // A serious wound outranks still having food: getting badly hurt says more
  // about how the run went than whether food happened to last.
  if (state.hp <= LIMPED_HP_MAX) {
    return variants.limped;
  }
  // Food remaining outranks a full preparation count: running out of food is
  // felt on the road, while unspent preparation may just mean it never came up.
  if (state.food > 0) {
    return variants.provisioned;
  }
  if (state.preparation === journey.start.preparation) {
    return variants.wellStocked;
  }
  return variants.default;
}
