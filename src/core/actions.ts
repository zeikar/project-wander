export type GameAction =
  | { type: "START_JOURNEY"; seed: number }
  | { type: "TRAVEL" }
  | { type: "CHOOSE_ENCOUNTER_OPTION"; optionId: string };
