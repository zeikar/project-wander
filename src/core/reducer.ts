import type { GameState } from "./game-state";
import type { GameAction } from "./actions";
import { ENCOUNTER_CHANCE, HUNGRY_TRAVEL_HP_LOSS } from "./game-state";
import { rollRandom } from "./rng";
import { journey } from "../content/journey";
import { encounters } from "../content/encounters";
import type { EncounterOption } from "../content/encounters";

// An option is only offered when the player can actually pay for it. HP is not
// gated: taking a wound you cannot afford is a real way to lose the journey.
export function canChooseOption(
  state: GameState,
  option: EncounterOption,
): boolean {
  return (
    state.food + option.foodDelta >= 0 &&
    state.preparation + option.preparationDelta >= 0
  );
}

function advanceAfterLeg(state: GameState): GameState {
  const nextLegIndex = state.legIndex + 1;
  return {
    ...state,
    legIndex: nextLegIndex,
    phase: nextLegIndex >= journey.legs.length ? "arrived" : "traveling",
  };
}

export function reduce(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "START_JOURNEY": {
      if (
        state.phase !== "title" &&
        state.phase !== "arrived" &&
        state.phase !== "defeated"
      ) {
        return state;
      }
      return {
        phase: "traveling",
        hp: journey.start.hp,
        food: journey.start.food,
        preparation: journey.start.preparation,
        legIndex: 0,
        rngState: action.seed >>> 0,
        activeEncounterId: null,
        lastEncounterResult: null,
      };
    }

    case "TRAVEL": {
      if (state.phase !== "traveling") {
        return state;
      }

      const fed = state.food > 0;
      const traveled: GameState = {
        ...state,
        food: fed ? state.food - 1 : state.food,
        hp: fed ? state.hp : Math.max(0, state.hp - HUNGRY_TRAVEL_HP_LOSS),
        lastEncounterResult: null,
      };

      // Starving on the road ends the journey where it stands, without
      // consuming a roll.
      if (traveled.hp === 0) {
        return { ...traveled, phase: "defeated" };
      }

      const trigger = rollRandom(traveled.rngState);
      if (trigger.value >= ENCOUNTER_CHANCE) {
        return advanceAfterLeg({ ...traveled, rngState: trigger.nextState });
      }

      // Uniform pick over the authored list. `value` is in [0, 1) and the list
      // is non-empty (asserted in encounters.test.ts), so the index is always
      // in range. Repeats within one journey are allowed; the road does not
      // promise you a new animal every time.
      const selection = rollRandom(trigger.nextState);
      const encounter =
        encounters[Math.floor(selection.value * encounters.length)]!;

      return {
        ...traveled,
        rngState: selection.nextState,
        phase: "encounter",
        activeEncounterId: encounter.id,
      };
    }

    case "CHOOSE_ENCOUNTER_OPTION": {
      if (state.phase !== "encounter") {
        return state;
      }

      const encounter = encounters.find(
        (candidate) => candidate.id === state.activeEncounterId,
      );
      const option = encounter?.options.find(
        (candidate) => candidate.id === action.optionId,
      );
      if (!option || !canChooseOption(state, option)) {
        return state;
      }

      const resolved: GameState = {
        ...state,
        hp: Math.max(0, state.hp + option.hpDelta),
        food: state.food + option.foodDelta,
        preparation: state.preparation + option.preparationDelta,
        activeEncounterId: null,
        lastEncounterResult: option.resultText,
      };

      if (resolved.hp === 0) {
        return { ...resolved, phase: "defeated" };
      }

      return advanceAfterLeg(resolved);
    }
  }
}
