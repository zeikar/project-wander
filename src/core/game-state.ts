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
  // SPECIES ids the traveler has studied on THIS journey, in the order they
  // were learned. Species rather than situation: one animal can be met in more
  // than one place, and what was learned about it holds wherever it turns up.
  // Deliberately within-run only: carrying knowledge between journeys collapses
  // every later run to one fixed 100%-matching table of answers, because what a
  // known animal's answer buys costs nothing and beats every alternative.
  // Starting over ignorant is what keeps a first meeting worth anything.
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
