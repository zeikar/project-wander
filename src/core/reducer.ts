import type { GameState } from "./game-state";
import type { GameAction } from "./actions";
import { HUNGRY_TRAVEL_HP_LOSS } from "./game-state";
import { rollRandom } from "./rng";
import { journey } from "../content/journey";
import { encounters } from "../content/encounters";
import type { Encounter, EncounterOption } from "../content/encounters";

// Which options this encounter puts on the table right now. A "teaches" option
// is the observation itself and vanishes once the species is known; a "requires"
// option is what that knowledge buys and only appears once it is. They share a
// menu slot, so learning swaps an answer in rather than lengthening the list.
// This filters VISIBILITY, not affordability — canChooseOption still decides
// whether a shown option can be paid for.
export function offeredOptions(
  state: GameState,
  encounter: Encounter,
): readonly EncounterOption[] {
  const known = state.known.includes(encounter.id);
  return encounter.options.filter(
    (option) =>
      (option.codex !== "teaches" || !known) &&
      (option.codex !== "requires" || known),
  );
}

// An option is only offered when the player can actually pay for it. HP is not
// gated: taking a wound you cannot afford is a real way to lose the journey —
// and neither is the leg's toll, so spending your last food here can still
// starve you when the leg completes.
// `requiresPreparation` is a different thing from a cost: it asks what the
// traveler is still CARRYING and spends none of it, so an answer that depends on
// looking equipped closes as soon as the kit is spent elsewhere.
// The codex gates are repeated from `offeredOptions` rather than reused for one
// reason only: this function takes no `Encounter`, so it has to resolve the
// species through `state.activeEncounterId`.
// PRECONDITION: `option` belongs to the encounter named by
// `state.activeEncounterId`. Every caller satisfies it by construction — both
// the reducer and the encounter screen look the option up out of that same
// encounter — but the gate fails OPEN if it is ever violated, so a future caller
// that pairs an option with a different active encounter would silently allow a
// `teaches` option the player has already learned.
export function canChooseOption(
  state: GameState,
  option: EncounterOption,
): boolean {
  const known =
    state.activeEncounterId !== null &&
    state.known.includes(state.activeEncounterId);
  return (
    state.food + option.foodDelta >= 0 &&
    state.preparation + option.preparationDelta >= 0 &&
    state.preparation >= (option.requiresPreparation ?? 0) &&
    (option.codex !== "teaches" || !known) &&
    (option.codex !== "requires" || known)
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
    // Always reported, and always as the road's own line. An encounter and the
    // toll are applied by the same click, so leaving this silent made the
    // animal look responsible for damage the miles did.
    lastRoadToll: fed ? journey.road.fed : journey.road.hungry,
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
        lastRoadToll: null,
        // Every journey starts ignorant. See game-state.ts for why knowledge
        // deliberately does not survive a run.
        known: [],
        log: [],
      };
    }

    case "TRAVEL": {
      if (state.phase !== "traveling") {
        return state;
      }

      // The route decides one thing only: how likely this leg turns something
      // up. It is deliberately NOT remembered — because both ways charge the
      // same toll, nothing downstream needs to know which was walked, so the
      // branch costs the game state nothing.
      const route = journey.legs[state.legIndex]?.routes.find(
        (candidate) => candidate.id === action.routeId,
      );
      if (!route) {
        return state;
      }

      // Setting out costs nothing: the leg is only paid for once it is
      // finished, whether that happens here or after an encounter.
      const trigger = rollRandom(state.rngState);
      if (trigger.value >= route.encounterChance) {
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
        // This path does NOT complete a leg, so nothing has been tolled yet.
        // Without clearing, the previous leg's toll would still be on screen
        // while the player reads a new encounter — attributing an old charge to
        // an animal they have not answered.
        lastRoadToll: null,
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
      if (!encounter || !option || !canChooseOption(state, option)) {
        return state;
      }

      const resolved: GameState = {
        ...state,
        hp: Math.max(0, state.hp + option.hpDelta),
        food: state.food + option.foodDelta,
        preparation: state.preparation + option.preparationDelta,
        activeEncounterId: null,
        lastEncounterResult: option.resultText,
        // Watching the animal is what teaches you about it. No dedupe is needed:
        // a "teaches" option stops being choosable the moment its encounter is
        // known, so this can never append the same id twice.
        known:
          option.codex === "teaches"
            ? [...state.known, encounter.id]
            : state.known,
        log: [...state.log, `${encounter.title} — ${option.label}`],
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
