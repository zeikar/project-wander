// Pure game state types and constants. No React, no DOM, no randomness, no dates.

export type GamePhase =
  | "title"
  // The departure-day morning, between START_JOURNEY and the first leg. A
  // phase of its own rather than an encounter standing on leg 0, because
  // CHOOSE_ENCOUNTER_OPTION always ends in `completeLeg` — and the road's toll
  // is a charge the village must not make. Nobody has walked anywhere yet.
  | "village"
  | "traveling"
  | "encounter"
  | "arrived"
  | "defeated";

// One species the traveler has studied, and how far down it they have got.
// `depth` counts RUNGS of that species' ladder, so 1 means the first field note
// and nothing else. The ceiling is the species' own `fieldNotes.length`.
export interface KnownSpecies {
  speciesId: string;
  depth: number;
}

export interface GameState {
  phase: GamePhase;
  hp: number;
  food: number;
  preparation: number;
  legIndex: number;
  rngState: number;
  // The journey's own seed, kept separate from `rngState`. `rngState`
  // advances a different number of rolls per leg depending on what that leg
  // turns up, so a function of the WEATHER — which has to answer the same
  // question about a given leg no matter how the road played out getting
  // there — is keyed on this instead. See core/weather.ts.
  seed: number;
  activeEncounterId: string | null;
  // The second thing standing on this leg, when the leg holds two. Null on
  // every other leg. A leg holding one of each shows the animal before the
  // place, and that is a RENDERING ORDER: nothing resolves through the slot any
  // more. The codex gate used to — it read the species off `activeEncounterId`
  // — and that dependency was removed before the shape that breaks it existed.
  // That shape exists now, and "watching one animal learns that one and not the
  // other" in reducer.test.ts walks it: on a leg holding two ANIMALS the first
  // slot would have gated the second animal's options on the wrong species.
  // What is load-bearing instead is that OPTION IDS ARE UNIQUE ACROSS SCENES
  // (pinned in content.test.ts): that is what lets `canChooseOption` and
  // CHOOSE_ENCOUNTER_OPTION both find the scene that owns an option from its id
  // alone, whichever slot that scene sits in.
  secondSceneId: string | null;
  lastEncounterResult: string | null;
  // What the ROAD just charged, kept separate from what an animal just did.
  // Both are applied by the same click, so merging them into one line made
  // players attribute the road's hunger damage to the animal — they read the
  // boar as costing 9 when it costs 6.
  lastRoadToll: string | null;
  // The one thing this journey walked past, and null until it has walked past
  // anything: which LEG it stood on, and whether it was an animal or a place.
  // Only a leg holding two writes here — answering one of them is what leaves
  // the other standing, and that is the whole cost of the shape.
  // ONE value, overwritten by each later pair, and deliberately never an array:
  // a list of everything missed is a ledger, and a ledger read at arrival is a
  // completion counter — what VISION.md § Success Metric refuses. That one
  // thing named reads as a regret where twelve read as a checklist is an
  // unmeasured prototype judgment, not a measured result: nothing here has
  // been put in front of a player.
  // A LEG and a KIND, never a species. `known` below SURVIVES the journey, so
  // naming the species would hand the next run a list of animals to go and
  // collect. docs/CONTENT.md § Forks reached the same answer on DIFFERENT
  // grounds — a sign names a kind because naming the species buys almost
  // nothing, and that section measured it as not hurting the codex at all — so
  // this borrows its shape and none of its evidence.
  // The leg stored is the PRE-CHOICE `legIndex`. `completeLeg` increments
  // before the phase becomes `arrived`, so anything reading this has to index
  // `journey.legs` with the number recorded here and never with
  // `state.legIndex`.
  leftStanding: { legIndex: number; kind: "animal" | "place" } | null;
  // One entry per SPECIES the traveler has studied, in the order the species
  // were FIRST learned, each carrying how many rungs of that species' ladder
  // are known. Species rather than situation: one animal can be met in more
  // than one place, and what was learned about it holds wherever it turns up.
  // Two invariants, both enforced in `reducer.ts` rather than by this type. At
  // most one entry per species: every learning transition goes through
  // `withRungLearned`, which deepens an existing entry instead of appending
  // beside it. And no entry deeper than its species' `fieldNotes.length`: a
  // `teaches` option is choosable only at exactly the depth below its own rung,
  // the trapper's pool excludes a species already at full depth, and no
  // situation may sit at a rung its species has no note for (content.test.ts).
  // Deepening in place is why order means FIRST learned rather than last: the
  // notebook does not reshuffle because a traveler went back for a second look.
  // Carried ACROSS journeys — `START_JOURNEY` keeps this while resetting
  // everything else, so the reset point is `createInitialState` and the first
  // journey after a page load still starts ignorant.
  // This was within-run only for a long time, on the measured grounds that
  // persistence collapsed every later run to one fixed table of answers
  // matching 300/300 seeds. That measurement was real; the conclusion drawn
  // from it was wider than it. What collapsed the game was that a known
  // animal's answer cost nothing and beat every alternative on every axis, so
  // knowing an animal ENDED its encounter rather than informing it. See the
  // note on `START_JOURNEY` in reducer.ts for what changed and what was
  // re-measured before this was turned on.
  // What making `depth` a COUNT rather than a boolean measured on this
  // structure (300 seeds, tie instrument `historical`, `11e5d97` → `1e97dcd`,
  // the `learner` policy — the only one of the five that prices knowledge, and
  // the only one either tree moves at all): the share of encounters still
  // offering a LIVE observation on a third journey went 0.0% → 16.1% — the old
  // shape left 299 of 300 seeds with nothing to learn by then — and rungs held
  // at journey end went 3.44 → 4.82 → 5.00 (the old ceiling) to 3.26 → 5.78 →
  // 7.63 of 9. The first journey pays for it, which was predicted before it was
  // run: species known at arrival 3.47 → 2.89, but rungs held 3.47 → 3.31.
  // Fewer animals, nearly as many facts. That is exhaustion moved from five
  // facts to nine and no further; the full figures, their instruments and what
  // the per-cell probe could NOT power are in docs/CONTENT.md § Animals.
  known: readonly KnownSpecies[];
  log: readonly string[];
}

export const HUNGRY_TRAVEL_HP_LOSS = 3;

// Real resources and the journey seed are set by START_JOURNEY; nothing here is
// rendered on the title screen, so these placeholder values are never shown.
export function createInitialState(): GameState {
  return {
    phase: "title",
    hp: 0,
    food: 0,
    preparation: 0,
    legIndex: 0,
    rngState: 0,
    seed: 0,
    activeEncounterId: null,
    secondSceneId: null,
    lastEncounterResult: null,
    lastRoadToll: null,
    leftStanding: null,
    known: [],
    log: [],
  };
}
