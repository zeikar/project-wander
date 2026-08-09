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
