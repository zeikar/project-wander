// Authored encounter content, assembled from one file per species. Like
// journey.ts this imports nothing from the core: content is the bottom of the
// dependency chain.
//
// Split per species because that is the seam the work arrives on — a new way to
// meet the wolves touches wolves.ts and nothing else — and because `speciesId`
// is already the codex's key, so the code was gathered by species before the
// files were.
//
// ORDER IS LOAD-BEARING IN BOTH LISTS, and it is not cosmetic. The reducer picks
// a species by indexing `speciesList` with a seeded roll and then indexes that
// species' situations the same way, so reordering either list rewrites the
// encounter script of every seed that already exists. Add at the end.
import { boar, boarEncounters } from "./boar";
import { wolves, wolvesEncounters } from "./wolves";
import { bees, beesEncounters } from "./bees";
import { waxwings, waxwingsEncounters } from "./waxwings";
import { redDeer, redDeerEncounters } from "./red-deer";
import type { Encounter, Species } from "./types";

export type { Encounter, EncounterOption, Species } from "./types";

export const speciesList: readonly Species[] = [
  boar,
  wolves,
  bees,
  waxwings,
  redDeer,
];

// The animals are animals: they are hungry, territorial or busy, never
// villains, and every one of them can be answered without a fight.
export const encounters: readonly Encounter[] = [
  ...boarEncounters,
  ...wolvesEncounters,
  ...beesEncounters,
  ...waxwingsEncounters,
  ...redDeerEncounters,
];

// How much of the ANIMAL band puts a SECOND animal on the leg beside the
// first. It subdivides that band rather than adding to it: a leg that was
// going to hold an animal now sometimes holds two, so the share of legs
// holding an animal AT ALL does not move — 0.625 on the quiet way and 0.875 on
// the busy one, the closed-form figures recorded in events.ts. Only the COUNT
// met on such a leg changes.
//
// Carving it out of the PLACE band instead was refused, and the reason is not
// symmetry. That band already holds two shapes — a lone place and a
// place-with-animal — so a third would have to eat one of them, which makes
// places rarer and moves the road's food opportunity. That is a difficulty
// change wearing a knowledge change's name, and this task exists to price
// knowledge against other knowledge with nothing else moving.
//
// The two animals are always DIFFERENT SPECIES, which is the whole point
// rather than a tidiness rule: what the traveler gives up by answering one of
// them has to be the OTHER one's field note. Two situations of the same
// species offer one codex entry between them, so choosing would cost no
// knowledge at all and the leg would collapse back into the resource
// comparison a place beside an animal already makes.
//
// A lone animal stays three legs in four, deliberately. That is where a first
// meeting is FORCED — nothing else on the leg to weigh it against, so a
// traveler who wants the entry simply takes it — and the codex still has to
// fill for the choice above to ever be worth posing.
//
// 0.25 is a starting value, not a measured one: small enough that a two-animal
// leg stays an event rather than the road's rhythm, large enough that a
// journey meets one. Both shapes are pinned reachable by test, which is the
// only guard on it.
export const TWO_ANIMAL_CHANCE = 0.25;
