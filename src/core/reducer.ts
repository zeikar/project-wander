import type { GameState, KnownSpecies } from "./game-state";
import type { GameAction } from "./actions";
import { HUNGRY_TRAVEL_HP_LOSS } from "./game-state";
import { rollRandom } from "./rng";
import type { RollResult } from "./rng";
import { FORK_CHANCE, journey } from "../content/journey";
import type { LegRoute } from "../content/journey";
import {
  TWO_ANIMAL_CHANCE,
  encounters,
  speciesList,
} from "../content/encounters";
import type { Encounter, EncounterOption } from "../content/encounters";
import { EVENT_CHANCE, PAIR_CHANCE, roadEvents } from "../content/events";
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

// Everything standing on this leg, in the order the screen shows it: the
// animal first, then whatever stands beside it — a place, or a second animal.
// DISPLAY ORDER and nothing else. The codex gate used to inherit the slot
// order from here — it resolved the species through `activeEncounterId`, the
// first slot — and no longer does: it reads the scene that OWNS the option
// instead, so reordering this moves what the screen shows and nothing the
// rules decide.
// Non-null asserted rather than filtered: an id in state that resolves to no
// scene is a broken invariant, and the screen already crashes loudly on one.
export function activeScenes(state: GameState): readonly Scene[] {
  return [state.activeEncounterId, state.secondSceneId]
    .filter((id): id is string => id !== null)
    .map((id) => findScene(id)!);
}

// Which of the leg's scenes an option belongs to, by its id alone. Sound only
// because option ids are unique across every animal and every place — pinned
// by "gives no two options anywhere the same id" in content.test.ts. Undefined
// for an option standing on no scene of this leg.
// One definition, read by both the codex gate and CHOOSE_ENCOUNTER_OPTION, so
// the scene an option is CHECKED against is always the scene it is RESOLVED
// against.
function owningScene(state: GameState, optionId: string): Scene | undefined {
  return activeScenes(state).find((scene) =>
    scene.options.some((option) => option.id === optionId),
  );
}

// Which animal a situation is, or undefined for a place. The codex is keyed on
// the SPECIES rather than the situation: one animal can be met in more than one
// place, and meeting it somewhere new must not offer to teach it over again.
export function speciesOf(sceneId: string | null): string | undefined {
  return encounters.find((candidate) => candidate.id === sceneId)?.speciesId;
}

// How deep the traveler's knowledge of one species goes: that species' entry in
// `known`, or 0 when it has no entry. Undefined in — a place, or a scene that
// does not exist — is 0 as well, which is right: a place has no species to
// learn and carries no `codex` option to ask.
// The ceiling is the species' own `fieldNotes.length`, and it is unreachable
// past that because a `teaches` option is choosable only at exactly the depth
// below its rung.
export function speciesDepth(
  state: GameState,
  speciesId: string | undefined,
): number {
  if (speciesId === undefined) {
    return 0;
  }
  return state.known.find((entry) => entry.speciesId === speciesId)?.depth ?? 0;
}

// Which rung of its species' ladder a situation sits at, or undefined for a
// place — the same lookup shape as `speciesOf` above, for the same reason: a
// place is not a species and has no rung to be at.
export function codexLayerOf(sceneId: string | null): number | undefined {
  return encounters.find((candidate) => candidate.id === sceneId)?.codexLayer;
}

// Learning, in one place: a first rung appends an entry at depth 1 after
// whatever is already there, and a deeper rung increments the species' existing
// entry where it stands. Both learning transitions — the road's observation and
// the trapper's morning — call this, so the two cannot disagree about what a
// lesson does, and neither can produce a second entry for a species that
// already has one.
function withRungLearned(
  known: readonly KnownSpecies[],
  speciesId: string,
): readonly KnownSpecies[] {
  return known.some((entry) => entry.speciesId === speciesId)
    ? known.map((entry) =>
        entry.speciesId === speciesId
          ? { ...entry, depth: entry.depth + 1 }
          : entry,
      )
    : [...known, { speciesId, depth: 1 }];
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
// Whether a place-band leg ALSO holds an animal, and which animal that is —
// both read off the same seeded source without consuming a roll, keyed on
// `state.rngState` because a pair is a question about THIS leg, the way a fork
// is, not about the journey. Riding a salt rather than a fresh roll is what
// SITUATION_SALT was added for and buys the same thing here: every existing
// seed's place draw, and every later leg on that seed, stay bit-for-bit what
// they were, so the tuning measured before pairs existed still describes this
// road.
const PAIR_SALT = 0xc2b2ae35; // does this place-band leg also hold an animal?
const PAIR_ANIMAL_SALT = 0x27d4eb2d; // and which animal is it
// The same two questions asked of the ANIMAL band, where the second thing on
// the leg is another animal rather than a place — so what the traveler gives
// up by answering one of them is a field note and not a resource. Keyed on
// `state.rngState` and riding a salt for the same reasons the pair above does:
// a two-animal leg spends exactly the rolls a one-animal leg spends, so every
// existing seed's road script is bit-for-bit what it was.
const TWO_ANIMAL_SALT = 0x7feb352d; // does this animal-band leg hold a second animal?
const SECOND_ANIMAL_SALT = 0x94d049bb; // and which animal is it

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

// Species first, then one of that species' situations — the pick that keeps a
// boar with three situations exactly as common as one with a single situation.
// One function so the leg's own draw and a paired draw stay the same rule.
// `exclude` is what makes the second animal on a two-animal leg a different
// one: the pool is `speciesList` with that species dropped, and `filter`
// PRESERVES LIST ORDER, which is load-bearing — the pick indexes the pool, so
// the pool's order is part of a seed's script exactly as `speciesList`'s own
// order is (encounters/index.ts). Without `exclude` the pool IS `speciesList`
// and the draw is bit-identical to what it has always been. With it the pool is
// never empty: five species ship, and at least two are pinned in
// content.test.ts.
function pickAnimal(roll: RollResult, exclude?: string): Encounter {
  const pool =
    exclude === undefined
      ? speciesList
      : speciesList.filter((species) => species.id !== exclude);
  const species = pool[Math.floor(roll.value * pool.length)]!;
  return pickSituation(species.id, roll.nextState);
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
//
// Three values, and a leg holding TWO things signs exactly as a leg holding
// one of them does. A place with an animal beside it signs "place"; an animal
// with a second animal beside it signs "animal" — one animal, and it delivers
// two. The sign still cannot lie — the thing it named is there — but it
// UNDER-REPORTS, deliberately and now in both bands: the second thing is found
// on arrival, so a leg with two of them is discovered rather than shopped for.
// A fourth sign would price it at the fork and turn the leg's whole point
// (that answering one thing gives up the other) into a route bonus to steer
// toward. Pinned by the two "the sign under-reports, on purpose" tests in
// reducer.test.ts, one per band.
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

// Which options this scene puts on the table right now. Its codex slot has
// three states and shows exactly one option in all of them: one rung short of
// this situation's rung the observation is live; shallower than that it is
// still VISIBLE and refused; at the rung or deeper the answer that rung buys
// stands in the observation's place. So the menu is the same length at every
// depth, and learning still swaps an answer in rather than lengthening the
// list.
// The locked state is deliberately visible. A traveler who cannot yet read this
// scene has to be able to SEE that there is something here to read, or the rung
// above is a door they were never shown — the same idiom a weather-closed
// answer keeps, which never leaves the menu either.
// This filters VISIBILITY, not affordability — canChooseOption still decides
// whether a shown option can be taken, and it is what refuses the locked one.
// A scene with no rung — a place — resolves to rung 1, and both clauses are
// vacuous for it anyway: a place carries no `codex` on any option.
export function offeredOptions(
  state: GameState,
  encounter: Scene,
): readonly EncounterOption[] {
  const depth = speciesDepth(state, speciesOf(encounter.id));
  const layer = codexLayerOf(encounter.id) ?? 1;
  return encounter.options.filter(
    (option) =>
      (option.codex !== "teaches" || depth < layer) &&
      (option.codex !== "requires" || depth >= layer),
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
  // Anything not yet at the bottom of its own ladder — so the trapper has the
  // NEXT rung of an animal the traveler has already met to talk about, and a
  // species at full depth is never in the pool.
  const teachable = speciesList.filter(
    (species) => speciesDepth(state, species.id) < species.fieldNotes.length,
  );

  // Nothing left to learn ANYWHERE: the trapper is simply not on the menu, the
  // same idiom a spent `teaches` option follows at an encounter. Withdrawing
  // the option is also what keeps the transition free of any dedupe code — the
  // button that would teach a species nothing is left to say about does not
  // exist.
  // The withdrawal is still a recorded limitation and still uncompensated: a
  // full codex makes the morning offer two choices instead of three, which is
  // strictly worse than ignorance. Layers moved the condition from five facts
  // to nine and no further; they did not answer it.
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
// The codex gates are repeated from `offeredOptions` rather than reused, and
// the reason is what each question is: that one answers VISIBILITY for a scene
// it is handed, this one answers CHOOSABILITY for an option alone — including
// an option standing on no scene of this leg, where there is no scene to filter
// against at all.
// Affordability is checked against the EFFECTIVE deltas, not the authored
// ones, and an option the sky has closed is refused outright regardless of
// what the traveler can pay — both read through `effectiveOption` so this can
// never disagree with what CHOOSE_ENCOUNTER_OPTION actually charges.
// The codex gates are the LAYERED ones: an observation can only be taken at
// exactly the depth below its situation's rung, and what it buys opens at that
// rung and stays open. The `===` is what keeps a ladder a ladder — met one rung
// too early the observation is shown (see `offeredOptions`) and refused here,
// so no rung can be skipped and no lesson learned out of order; and it is what
// makes `withRungLearned` land exactly on the rung, never past it.
// Both the species and the rung are resolved from the scene that OWNS the
// option, so on a leg holding two things this cannot be wrong about which scene
// it is reading: each option is gated on its own scene, not on whichever one
// the state happens to list first. That is what `offeredOptions` — which is
// handed a scene — has always done, and the two can no longer disagree about an
// option they are both looking at.
// The gate still fails OPEN for an option belonging to NO scene of this leg: it
// resolves no species and no rung, so it reads as depth 0 at rung 1 — `teaches`
// allowed, `requires` refused. Nothing can be bought on the strength of that —
// `CHOOSE_ENCOUNTER_OPTION` looks the option up in the same scenes and refuses
// it outright one line later.
// A place carries no `codex` on any option (pinned in content.test.ts), so both
// codex clauses are vacuous for a place's options either way — what the
// traveler knows about the animal standing beside it changes nothing about what
// the place costs.
export function canChooseOption(
  state: GameState,
  option: EncounterOption,
): boolean {
  const sceneId = owningScene(state, option.id)?.id ?? null;
  const depth = speciesDepth(state, speciesOf(sceneId));
  const layer = codexLayerOf(sceneId) ?? 1;
  const effective = effectiveOption(
    option,
    weatherAt(state.seed, state.legIndex),
  );
  return (
    effective.closedReason === undefined &&
    state.food + effective.foodDelta >= 0 &&
    state.preparation + effective.preparationDelta >= 0 &&
    state.preparation >= (option.requiresPreparation ?? 0) &&
    (option.codex !== "teaches" || depth === layer - 1) &&
    (option.codex !== "requires" || depth >= layer)
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
        secondSceneId: null,
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
        // One RUNG of exactly the species carried by the option resolved above
        // — the reducer's own copy of the offer, not the screen's. The button
        // named the same animal because it read the same function on the same
        // state. Through `withRungLearned` for the same reason the road's
        // observation is: a morning spent on an animal already in the notebook
        // deepens its entry rather than adding a second one, and no dedupe is
        // needed either way, since a species at full depth is never in the pool
        // `offeredVillageOptions` picks from.
        known:
          option.teachesSpecies !== undefined
            ? withRungLearned(state.known, option.teachesSpecies)
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
          secondSceneId: null,
          rngState: trigger.nextState,
        });
      }

      // One roll, read by both branches below as a uniform pick over whichever
      // authored list the band selected. `value` is in [0, 1) and both lists
      // are non-empty (asserted in encounters.test.ts), so the index is always
      // in range. Repeats within one journey are allowed; the road does not
      // promise you something new every time.
      const selection = rollRandom(trigger.nextState);
      if (sign === "animal") {
        // The pick is over SPECIES, not over situations (see `pickAnimal`).
        // That is what stops an animal becoming commoner just because it was
        // given more ways to be met: the boar has three situations and is still
        // drawn one time in five, exactly as it was when it had one.
        const first = pickAnimal(selection);

        // And on a quarter of these legs, a SECOND animal beside the first —
        // the one place in the game where the thing given up by answering
        // something is another animal's field note rather than a resource
        // (content/encounters/index.ts). Always a different species, so there
        // are genuinely two entries standing there.
        // The leg's own draw keeps slot 1, and that is worth being deliberate
        // about: the first animal is exactly the animal every existing seed
        // already drew here, so no seed's script moved, and the golden trace's
        // legality rule stays readable — a two-animal row may only GAIN a
        // second id, never change its first. Pinned by "keeps the leg's own
        // draw in the first slot" in reducer.test.ts, against the id the
        // reducer drew at that state before a leg could hold two animals: seed
        // 1's line never holds two, so the trace itself cannot see a swap.
        const second =
          rollRandom((state.rngState ^ TWO_ANIMAL_SALT) >>> 0).value <
          TWO_ANIMAL_CHANCE
            ? pickAnimal(
                rollRandom((state.rngState ^ SECOND_ANIMAL_SALT) >>> 0),
                first.speciesId,
              )
            : undefined;

        return {
          ...state,
          lastEncounterResult: null,
          // This path does NOT complete a leg, so nothing has been tolled yet.
          // Without clearing, the previous leg's toll would still be on screen
          // while the player reads a new encounter — attributing an old charge
          // to an animal they have not answered.
          lastRoadToll: null,
          rngState: selection.nextState,
          phase: "encounter",
          activeEncounterId: first.id,
          secondSceneId: second ? second.id : null,
        };
      }

      // The place band, and the one place a leg can hold TWO things. Both
      // questions — whether an animal is here as well, and which one — are read
      // off salts, so the place this band draws and every later leg on this
      // seed are exactly what they were before pairs existed.
      // This pair is carved out of the PLACE band and never the animal band: a
      // leg that already holds an animal must keep offering that animal, or the
      // species repeat rate the codex lives on is thinned (content/events.ts).
      // Which is a statement about THIS pair only — the animal band has a
      // subdivision of its own, above, and it adds a second animal rather than
      // replacing the first, so it thins nothing (`TWO_ANIMAL_CHANCE`).
      const place =
        roadEvents[Math.floor(selection.value * roadEvents.length)]!;
      const paired =
        rollRandom((state.rngState ^ PAIR_SALT) >>> 0).value < PAIR_CHANCE;
      const animal = paired
        ? pickAnimal(rollRandom((state.rngState ^ PAIR_ANIMAL_SALT) >>> 0))
        : undefined;

      return {
        ...state,
        lastEncounterResult: null,
        // Cleared for the reason the animal branch above gives: this path does
        // not complete a leg, so no toll of this leg's has been charged yet.
        lastRoadToll: null,
        rngState: selection.nextState,
        phase: "encounter",
        // The animal always takes the first slot; see `secondSceneId`.
        activeEncounterId: animal ? animal.id : place.id,
        secondSceneId: animal ? place.id : null,
      };
    }

    case "CHOOSE_ENCOUNTER_OPTION": {
      if (state.phase !== "encounter") {
        return state;
      }

      // Which of the leg's scenes the traveler answered, identified by the
      // option id ALONE — the same lookup `canChooseOption` makes below, so the
      // scene an option was checked against is the scene it is charged and
      // logged against. An id belonging to no scene of this leg resolves to
      // nothing and falls through to the same refusal an unknown id has always
      // got.
      const scene = owningScene(state, action.optionId);
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
        // BOTH slots, always. Answering one thing on a leg that held two is
        // what leaves the other where it stands — the whole cost of the pair —
        // so the scene not chosen is dropped here rather than carried on.
        activeEncounterId: null,
        secondSceneId: null,
        lastEncounterResult: effective.resultText,
        // Watching the animal is what teaches you about it — and what is
        // learned is one RUNG of the SPECIES, so meeting it in another
        // situation later offers what that rung buys, or the next rung, and
        // never the lesson just learned. No dedupe is needed: a "teaches"
        // option stops being choosable the moment depth reaches its rung, so
        // this can never record the same rung twice. A place carries no `codex`
        // on any option, so this branch never fires for one, which is why the
        // non-null assertion is sound.
        known:
          option.codex === "teaches"
            ? withRungLearned(state.known, speciesOf(scene.id)!)
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
