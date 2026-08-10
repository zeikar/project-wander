import type { GameState } from "./game-state";
import type { GameAction } from "./actions";
import { HUNGRY_TRAVEL_HP_LOSS } from "./game-state";
import { rollRandom } from "./rng";
import { FORK_CHANCE, journey } from "../content/journey";
import type { LegRoute } from "../content/journey";
import { encounters, speciesList } from "../content/encounters";
import type { EncounterOption } from "../content/encounters";
import { EVENT_CHANCE, roadEvents } from "../content/events";
import { village } from "../content/village";
import type { VillageOption } from "../content/village";
import { effectiveOption, weatherAt } from "./weather";

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

// Which animal a situation is, or undefined for a place. The codex is keyed on
// the SPECIES rather than the situation: one animal can be met in more than one
// place, and meeting it somewhere new must not offer to teach it over again.
export function speciesOf(sceneId: string | null): string | undefined {
  return encounters.find((candidate) => candidate.id === sceneId)?.speciesId;
}

// Places return undefined here and so are never "known" — which is right: a
// place has no species to learn, and carries no `codex` option to ask.
function isKnown(state: GameState, sceneId: string | null): boolean {
  const speciesId = speciesOf(sceneId);
  return speciesId !== undefined && state.known.includes(speciesId);
}

// Salts that let a leg's SHAPE be read off the same seeded source WITHOUT
// consuming a roll. That restraint is the point: whether a leg forks is a
// question about how the journey is presented, and a seed's encounter script
// must not move because the answer changed.
const FORK_SALT = 0x5bf03635;
const LONE_ROUTE_SALT = 0x27d4eb2f;
// Which SITUATION a drawn species turns up in, read off the same seeded source
// without consuming a roll — the same restraint the two salts above keep, and
// here it buys something specific: the species a seed draws on every leg is
// bit-for-bit what it drew before situations existed, so the tuning measured
// against the old content still describes this one.
const SITUATION_SALT = 0x165667b1;
// WHICH animal the trapper talks about, read off the same seeded source
// without consuming a roll — the same restraint the three salts above keep.
// Keyed on `state.seed` rather than `rngState`, for the reason weather is:
// the morning is a property of the JOURNEY, so the answer has to be the same
// however many times the screen asks it.
const VILLAGE_SALT = 0x85ebca6b;

// The authored ways one species can be met, in list order. Never empty: every
// species in `speciesList` has at least one situation, pinned in
// encounters.test.ts, so the caller's non-null assertion is sound.
function pickSituation(speciesId: string, rngState: number) {
  const situations = encounters.filter(
    (candidate) => candidate.speciesId === speciesId,
  );
  const roll = rollRandom((rngState ^ SITUATION_SALT) >>> 0);
  return situations[Math.floor(roll.value * situations.length)]!;
}

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
    rollRandom((state.rngState ^ LONE_ROUTE_SALT) >>> 0).value *
      leg.routes.length,
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
  const known = isKnown(state, encounter.id);
  return encounter.options.filter(
    (option) =>
      (option.codex !== "teaches" || !known) &&
      (option.codex !== "requires" || known),
  );
}

// Which villagers the departure morning actually puts in front of the
// traveler, and — for the trapper — WHICH animal he talks about. The single
// DEFINITION of that pick: nowhere else in the codebase decides which species
// is taught, so there is one rule to change and one to read.
// The screen and the reducer each CALL this function rather than passing the
// answer between them, which is the same shape `offeredOptions`,
// `offeredRoutes` and `weatherAt` already have. They agree because it is pure
// and its two inputs — `state.seed` and `state.known` — cannot change between
// the render and the click that follows it.
// Never consumes a roll (VILLAGE_SALT), so the screen can ask as often as it
// likes without moving the seed's road script.
export function offeredVillageOptions(
  state: GameState,
): readonly VillageOption[] {
  const teachable = speciesList.filter(
    (species) => !state.known.includes(species.id),
  );

  // Nothing left to learn: the trapper is simply not on the menu, the same
  // idiom a spent `teaches` option follows at an encounter. Withdrawing the
  // option is also what keeps the transition free of any dedupe code — the
  // button that would teach a known species does not exist.
  if (teachable.length === 0) {
    return village.options.filter((option) => !option.teaches);
  }

  // The pool shrinks as `known` grows across journeys, so the same seed teaches
  // a different animal in a later run — variation driven by what the traveler
  // has done, not by a second source of randomness.
  const roll = rollRandom((state.seed ^ VILLAGE_SALT) >>> 0);
  const picked = teachable[Math.floor(roll.value * teachable.length)]!;

  return village.options.map((option) =>
    option.teaches ? { ...option, teachesSpecies: picked.id } : option,
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
// Affordability is checked against the EFFECTIVE deltas, not the authored
// ones, and an option the sky has closed is refused outright regardless of
// what the traveler can pay — both read through `effectiveOption` so this can
// never disagree with what CHOOSE_ENCOUNTER_OPTION actually charges.
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
  const known = isKnown(state, state.activeEncounterId);
  const effective = effectiveOption(
    option,
    weatherAt(state.seed, state.legIndex),
  );
  return (
    effective.closedReason === undefined &&
    state.food + effective.foodDelta >= 0 &&
    state.preparation + effective.preparationDelta >= 0 &&
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
        // The morning in Ashfold comes first; the road starts after it.
        phase: "village",
        hp: journey.start.hp,
        food: journey.start.food,
        preparation: journey.start.preparation,
        legIndex: 0,
        rngState: action.seed >>> 0,
        // Stored separately from `rngState`, and normalized the same way, for
        // the reason given on `GameState.seed`: weather is a function of the
        // JOURNEY, not of `rngState`, which advances a variable number of
        // rolls per leg depending on what each leg turns up.
        seed: action.seed >>> 0,
        activeEncounterId: null,
        lastEncounterResult: null,
        lastRoadToll: null,
        // Knowledge SURVIVES the journey that earned it. Everything else in
        // this object resets; a field note does not, because the traveler who
        // walks back out of Alderbrook is the same person who sat in the reeds.
        // This was refused for a long time on a measurement — carrying it made
        // one fixed table of answers match 300/300 seeds — and what actually
        // caused that has since been fixed: the answers knowledge bought cost
        // nothing and beat every alternative on every axis, so knowing an
        // animal ended its encounter rather than informing it. Priced, they run
        // 20-60% of their offers, and with every animal known no situation is
        // settled by one option (measured 0 of 10, modal share 34-68%).
        // Reset happens where it should: `createInitialState` is ignorant, so
        // the first journey after the page loads starts with nothing.
        known: state.known,
        log: [],
      };
    }

    case "CHOOSE_VILLAGE_OPTION": {
      if (state.phase !== "village") {
        return state;
      }

      // Resolved out of what the morning ACTUALLY offered, not out of
      // `village.options`: the withheld trapper has to be refused like any
      // other id the screen never showed.
      // Re-derived here rather than carried on the action, deliberately. The
      // action names an id and nothing else, so the species this morning
      // teaches is settled by the rule at the moment it is applied — an
      // action carrying a species would be the screen telling the reducer what
      // was earned, and a stale render could then teach an animal this state
      // never offered.
      const option = offeredVillageOptions(state).find(
        (candidate) => candidate.id === action.optionId,
      );
      if (!option) {
        return state;
      }

      // hp is deliberately not touched. No villager carries an hpDelta (pinned
      // on all three in content.test.ts), so there is no clamp here and no
      // branch that cannot fire. A villager who draws blood is a design change
      // that comes back through review, not through a latent code path.
      return {
        ...state,
        food: state.food + option.foodDelta,
        preparation: state.preparation + option.preparationDelta,
        // Exactly the field carried by the option resolved above — the
        // reducer's own copy of the offer, not the screen's. The button named
        // the same animal because it read the same function on the same
        // state. No dedupe is needed either way: a known species is never in
        // the pool `offeredVillageOptions` picks from.
        known:
          option.teachesSpecies !== undefined
            ? [...state.known, option.teachesSpecies]
            : state.known,
        // Whatever the villager says, and nothing composed on top of it. The
        // shepherd's forecast used to be appended here; he was measured and
        // cut (content/village.ts), so the morning's result line is now
        // exactly what the chosen option was authored to say.
        lastEncounterResult: option.resultText,
        // Clears nothing: `village` is only ever reached from START_JOURNEY,
        // which already left this null, so this line restates an invariant
        // rather than paying off a charge. Written out anyway because the
        // no-toll contract is the entire reason this phase exists instead of
        // the morning running through CHOOSE_ENCOUNTER_OPTION, which always
        // ends in `completeLeg` — the transition out of the village should say
        // out loud that no leg was walked here.
        lastRoadToll: null,
        log: [...state.log, `${village.name} — ${option.label}`],
        phase: "traveling",
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
      // For animals the pick is over SPECIES, not over situations. That is what
      // stops an animal becoming commoner just because it was given more ways
      // to be met: the boar has three situations and is still drawn one time in
      // five, exactly as it was when it had one.
      const selection = rollRandom(trigger.nextState);
      const scene =
        sign === "animal"
          ? pickSituation(
              speciesList[Math.floor(selection.value * speciesList.length)]!.id,
              selection.nextState,
            )
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

      // The same call `canChooseOption` just made, on the same weather: what
      // gets applied below is what the label the player just read promised,
      // never the authored clear-sky figure underneath it.
      const effective = effectiveOption(
        option,
        weatherAt(state.seed, state.legIndex),
      );

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
          Math.max(0, state.hp + effective.hpDelta),
        ),
        food: state.food + effective.foodDelta,
        preparation: state.preparation + effective.preparationDelta,
        activeEncounterId: null,
        lastEncounterResult: effective.resultText,
        // Watching the animal is what teaches you about it — and what is
        // learned is the SPECIES, so meeting it in another situation later
        // offers what the knowledge buys rather than the lesson again. No
        // dedupe is needed: a "teaches" option stops being choosable the moment
        // the species is known, so this can never append the same id twice. A
        // place carries no `codex` on any option, so this branch never fires for
        // one, which is why the non-null assertion is sound.
        known:
          option.codex === "teaches"
            ? [...state.known, speciesOf(scene.id)!]
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
