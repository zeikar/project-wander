export type GameAction =
  | { type: "START_JOURNEY"; seed: number }
  // Which of the current leg's routes to walk. An id the leg does not offer is
  // ignored like any other invalid action.
  | { type: "TRAVEL"; routeId: string }
  | { type: "CHOOSE_ENCOUNTER_OPTION"; optionId: string };
