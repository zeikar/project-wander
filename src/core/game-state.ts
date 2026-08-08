// Pure game state types and constants. No React, no DOM, no randomness, no dates.

export type GamePhase =
  | "title"
  | "traveling"
  | "encounter"
  | "arrived"
  | "defeated";

export interface GameState {
  phase: GamePhase;
  hp: number;
  food: number;
  preparation: number;
  legIndex: number;
  rngState: number;
  activeEncounterId: string | null;
  lastEncounterResult: string | null;
  // What the ROAD just charged, kept separate from what an animal just did.
  // Both are applied by the same click, so merging them into one line made
  // players attribute the road's hunger damage to the animal — they read the
  // boar as costing 9 when it costs 6.
  lastRoadToll: string | null;
  // SPECIES ids the traveler has studied, in the order they were learned.
  // Species rather than situation: one animal can be met in more than one
  // place, and what was learned about it holds wherever it turns up.
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
  known: readonly string[];
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
    activeEncounterId: null,
    lastEncounterResult: null,
    lastRoadToll: null,
    known: [],
    log: [],
  };
}
