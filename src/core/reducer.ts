import type { GameState } from "./game-state";
import type { GameAction } from "./actions";
import { ENCOUNTER_CHANCE, HUNGRY_TRAVEL_HP_LOSS } from "./game-state";
import { rollRandom } from "./rng";
import { journey } from "../content/journey";
import { encounters } from "../content/encounters";
import type { EncounterOption } from "../content/encounters";

// An option is only offered when the player can actually pay for it. HP is not
// gated: taking a wound you cannot afford is a real way to lose the journey —
// and neither is the leg's toll, so spending your last food here can still
// starve you when the leg completes.
export function canChooseOption(
  state: GameState,
  option: EncounterOption,
): boolean {
  return (
    state.food + option.foodDelta >= 0 &&
    state.preparation + option.preparationDelta >= 0
  );
}

// The road's toll is paid at the end of every leg — food if you have it, flesh
// if you don't — so an encounter that hands you food can still pay for the day
// it interrupted. The final leg is charged like any other; a traveler who
// starves on the last stretch never sees Alderbrook.
// Precondition: state.hp > 0. Every path that empties the hp bar sets
// `defeated` on the spot, so traveling and encounter states always have hp left.
function completeLeg(state: GameState): GameState {
  const nextLegIndex = state.legIndex + 1;
  const fed = state.food > 0;
  const tolled: GameState = {
    ...state,
    food: fed ? state.food - 1 : state.food,
    hp: fed ? state.hp : Math.max(0, state.hp - HUNGRY_TRAVEL_HP_LOSS),
    legIndex: nextLegIndex,
  };

  // Checked before the arrival transition, so arriving and starving are
  // mutually exclusive. The stale result line is cleared so the defeat screen
  // speaks of hunger rather than the afternoon's encounter.
  if (tolled.hp === 0) {
    return { ...tolled, phase: "defeated", lastEncounterResult: null };
  }

  return {
    ...tolled,
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

      // Setting out costs nothing: the leg is only paid for once it is
      // finished, whether that happens here or after an encounter.
      const trigger = rollRandom(state.rngState);
      if (trigger.value >= ENCOUNTER_CHANCE) {
        return completeLeg({
          ...state,
          lastEncounterResult: null,
          rngState: trigger.nextState,
        });
      }

      // Uniform pick over the authored list. `value` is in [0, 1) and the list
      // is non-empty (asserted in encounters.test.ts), so the index is always
      // in range. Repeats within one journey are allowed; the road does not
      // promise you a new animal every time.
      const selection = rollRandom(trigger.nextState);
      const encounter =
        encounters[Math.floor(selection.value * encounters.length)]!;

      return {
        ...state,
        lastEncounterResult: null,
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

      // Dying at the encounter site: the leg was never completed, so no toll is
      // charged, and the result line stays to say how it ended.
      if (resolved.hp === 0) {
        return { ...resolved, phase: "defeated" };
      }

      return completeLeg(resolved);
    }
  }
}
