import type { GameState } from "./game-state";
import type { GameAction } from "./actions";
import { HUNGRY_TRAVEL_HP_LOSS } from "./game-state";
import { journey } from "../content/journey";

export function reduce(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "START_JOURNEY": {
      if (state.phase !== "title" && state.phase !== "arrived") {
        return state;
      }
      return {
        phase: "traveling",
        hp: journey.start.hp,
        food: journey.start.food,
        preparation: journey.start.preparation,
        legIndex: 0,
      };
    }

    case "TRAVEL": {
      if (state.phase !== "traveling") {
        return state;
      }
      const fed = state.food > 0;
      const nextLegIndex = state.legIndex + 1;
      return {
        ...state,
        food: fed ? state.food - 1 : state.food,
        hp: fed ? state.hp : Math.max(0, state.hp - HUNGRY_TRAVEL_HP_LOSS),
        legIndex: nextLegIndex,
        phase: nextLegIndex >= journey.legs.length ? "arrived" : "traveling",
      };
    }
  }
}
