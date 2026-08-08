import type { GameState } from "./game-state";
import type { GameAction } from "./actions";
import { HUNGRY_TRAVEL_HP_LOSS } from "./game-state";
import { rollRandom } from "./rng";
import { FORK_CHANCE, journey } from "../content/journey";
import type { LegRoute } from "../content/journey";
import { encounters } from "../content/encounters";
import type { EncounterOption } from "../content/encounters";
import { EVENT_CHANCE, roadEvents } from "../content/events";

// What the core needs from whatever the road just put in front of the traveler,
// whether that is an animal or a place. `EventOption` carries every required
// field of `EncounterOption` and none of its optional ones, so a place's options
// read here as encounter options whose `codex` and `requiresPreparation` are
// simply absent — which is exactly what a place is: nothing to learn, nothing to
// require.
export interface Scene {
  id: string;
  title: string;
  description: string;
  options: readonly EncounterOption[];
}

// Animals and places share one id space, pinned unique in encounters.test.ts.
export function findScene(id: string | null): Scene | undefined {
  return (
    encounters.find((candidate) => candidate.id === id) ??
    roadEvents.find((candidate) => candidate.id === id)
  );
}

// Salts that let a leg's SHAPE be read off the same seeded source WITHOUT
// consuming a roll. That restraint is the point: whether a leg forks is a
// question about how the journey is presented, and a seed's encounter script
// must not move because the answer changed.
const FORK_SALT = 0x5bf03635;
const LONE_ROUTE_SALT = 0x27d4eb2f;

// Which ways out of this leg the traveler actually has. Most legs have one:
// every leg forking was a rhythm rather than an event, and a playtester
// stopped reading the road by their eighth turn because of it.
export function offeredRoutes(state: GameState): readonly LegRoute[] {
  const leg = journey.legs[state.legIndex];
  if (!leg) {
    return [];
  }

  // Two ways are only two ways if they lead somewhere different. Below both
  // roads' odds the SAME roll picks the scene, so both would turn up the same
  // animal, charge the same toll, and land in an identical state — two buttons
  // doing one thing, which is the fake choice this milestone exists to remove
  // rather than reproduce. Roughly half of all rolls fall there, so this is not
  // an edge case.
  const distinct =
    new Set(leg.routes.map((route) => peekRoad(state, route))).size > 1;

  if (
    distinct &&
    rollRandom((state.rngState ^ FORK_SALT) >>> 0).value < FORK_CHANCE
  ) {
    return leg.routes;
  }

  // No fork: the road simply runs on one way, and which of the two it is is
  // still the leg's own character rather than a coin the player flips.
  const index = Math.floor(
    rollRandom((state.rngState ^ LONE_ROUTE_SALT) >>> 0).value * leg.routes.length,
  );
  return [leg.routes[index]!];
}

// What a traveler standing at the fork can read off the ground about one of
// the ways. A CATEGORY and never a species: naming the kind recovers almost all
// the value of naming the creature (48.3% of seeds against 51.7%), and a print
// in the mud tells you something came through, not what to call it. Dodging a
// species was the feared cost of going further and it was measured away — the
// codex repeat rate did not move — so this is a trade, not a guard.
export type RoadSign = "animal" | "place" | "quiet";

export function peekRoad(state: GameState, route: LegRoute): RoadSign {
  const trigger = rollRandom(state.rngState);
  if (trigger.value < route.encounterChance) {
    return "animal";
  }
  if (trigger.value < route.encounterChance + EVENT_CHANCE) {
    return "place";
  }
  return "quiet";
}

// Which options this encounter puts on the table right now. A "teaches" option
// is the observation itself and vanishes once the species is known; a "requires"
// option is what that knowledge buys and only appears once it is. They share a
// menu slot, so learning swaps an answer in rather than lengthening the list.
// This filters VISIBILITY, not affordability — canChooseOption still decides
// whether a shown option can be paid for.
export function offeredOptions(
  state: GameState,
  encounter: Scene,
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
      // Checked against what this leg actually OFFERS, not against its whole
      // route list: on a leg that does not fork, the way not taken is not a way
      // at all, and naming it must be ignored like any other invalid action.
      const route = offeredRoutes(state).find(
        (candidate) => candidate.id === action.routeId,
      );
      if (!route) {
        return state;
      }

      // Setting out costs nothing: the leg is only paid for once it is
      // finished, whether that happens here or after an encounter.
      // One roll decides all three outcomes, in bands: below the route's own
      // odds is an animal, the next EVENT_CHANCE is a place, and whatever is
      // left is an uneventful day. Places fill the stretch that used to turn up
      // nothing rather than sharing the animals' band, which is what keeps the
      // species repeat rate the codex depends on.
      // The bands are read through `peekRoad` rather than computed again here,
      // so the sign shown at the fork and the thing that actually happens can
      // never drift apart. That is the whole promise the sign makes.
      const sign = peekRoad(state, route);
      const trigger = rollRandom(state.rngState);
      if (sign === "quiet") {
        return completeLeg({
          ...state,
          lastEncounterResult: null,
          rngState: trigger.nextState,
        });
      }

      // Uniform pick over whichever authored list the band selected. `value` is
      // in [0, 1) and both lists are non-empty (asserted in encounters.test.ts),
      // so the index is always in range. Repeats within one journey are
      // allowed; the road does not promise you something new every time.
      const selection = rollRandom(trigger.nextState);
      const scene =
        sign === "animal"
          ? encounters[Math.floor(selection.value * encounters.length)]!
          : roadEvents[Math.floor(selection.value * roadEvents.length)]!;

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
        activeEncounterId: scene.id,
      };
    }

    case "CHOOSE_ENCOUNTER_OPTION": {
      if (state.phase !== "encounter") {
        return state;
      }

      const scene = findScene(state.activeEncounterId);
      const option = scene?.options.find(
        (candidate) => candidate.id === action.optionId,
      );
      if (!scene || !option || !canChooseOption(state, option)) {
        return state;
      }

      const resolved: GameState = {
        ...state,
        // Clamped at both ends. The floor has always been here; the ceiling
        // arrived with the first option that GIVES hp back — sleeping under a
        // found lean-to. Without it, resting is not recovery but accumulation:
        // an hp-greedy line took that option every time it appeared and walked
        // into the village with more of itself than it set out with, which also
        // quietly moves every arrival threshold, since those are fractions of
        // the starting pool.
        hp: Math.min(
          journey.start.hp,
          Math.max(0, state.hp + option.hpDelta),
        ),
        food: state.food + option.foodDelta,
        preparation: state.preparation + option.preparationDelta,
        activeEncounterId: null,
        lastEncounterResult: option.resultText,
        // Watching the animal is what teaches you about it. No dedupe is needed:
        // a "teaches" option stops being choosable the moment its encounter is
        // known, so this can never append the same id twice. A place carries no
        // `codex` on any option, so this branch never fires for one.
        known:
          option.codex === "teaches"
            ? [...state.known, scene.id]
            : state.known,
        log: [...state.log, `${scene.title} — ${option.label}`],
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
