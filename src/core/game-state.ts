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
  // Encounter ids the traveler has studied on THIS journey, in the order they
  // were learned. Deliberately within-run only: with just three facts in the
  // game, carrying knowledge between journeys collapses every later run to one
  // fixed 100%-matching table of answers. Of the ten answers that predate the
  // codex, nine fall to zero optimal picks once knowledge persists —
  // `show-your-kit` is the sole exception, because it is now the wolves'
  // knowledge-gated answer. Starting over ignorant is what keeps a first
  // meeting worth anything.
  known: readonly string[];
  log: readonly string[];
}

export const HUNGRY_TRAVEL_HP_LOSS = 3;

// Chance that a leg of travel turns up an encounter.
export const ENCOUNTER_CHANCE = 0.6;

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
