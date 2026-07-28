// Pure game state types and constants. No React, no DOM, no randomness, no dates.

export type GamePhase = "title" | "traveling" | "arrived";

export interface GameState {
  phase: GamePhase;
  hp: number;
  food: number;
  // Tracked and displayed, not yet consumed — it becomes spendable when
  // encounters arrive. No fake mechanic before then.
  preparation: number;
  legIndex: number;
}

export const HUNGRY_TRAVEL_HP_LOSS = 3;

// Real resources are set by START_JOURNEY; stats are not rendered on the
// title screen, so their zero values here are never shown to the player.
export function createInitialState(): GameState {
  return {
    phase: "title",
    hp: 0,
    food: 0,
    preparation: 0,
    legIndex: 0,
  };
}
