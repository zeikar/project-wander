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
    log: [],
  };
}
