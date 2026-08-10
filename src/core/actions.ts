export type GameAction =
  | { type: "START_JOURNEY"; seed: number }
  // Which of the current leg's routes to walk. An id the leg does not offer is
  // ignored like any other invalid action.
  | { type: "TRAVEL"; routeId: string }
  | { type: "CHOOSE_ENCOUNTER_OPTION"; optionId: string }
  // Which villager to spend the departure morning with. An id the morning does
  // not offer — including the trapper once there is nothing left to learn — is
  // ignored like any other invalid action.
  | { type: "CHOOSE_VILLAGE_OPTION"; optionId: string };
