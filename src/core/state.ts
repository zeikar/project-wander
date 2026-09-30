import type { FactId } from "../content/types";
import type { WorldMap } from "./map";

export type Phase = "title" | "map" | "scene" | "end";

// What just happened, as ids and numbers. The screen turns it into words; no
// prose is ever stored in state.
export type LastEvent =
  | {
      kind: "chose";
      sceneId: string;
      variant: string;
      optionId: string;
      hp: number;
      food: number;
      learned: FactId | null;
    }
  | { kind: "quiet" };

export type Ending =
  | { kind: "arrived"; destinationId: string; saw: boolean }
  | { kind: "died"; cause: "wounds" | "hunger" };

export interface GameState {
  phase: Phase;
  seed: number;
  map: WorldMap | null;
  at: string | null; // the node the traveler is standing on
  day: number;
  hp: number;
  food: number;
  // Whether today's walk went hungry — the road took blood instead of a meal.
  hungry: boolean;
  // The notebook. The only thing that survives a journey.
  known: readonly FactId[];
  learnedThisJourney: readonly FactId[];
  path: readonly string[];
  last: LastEvent | null;
  ending: Ending | null;
}

export type GameAction =
  | { type: "START"; seed: number }
  | { type: "MOVE"; nodeId: string }
  | { type: "CHOOSE"; optionId: string };

export function createInitialState(known: readonly FactId[] = []): GameState {
  return {
    phase: "title",
    seed: 0,
    map: null,
    at: null,
    day: 0,
    hp: 0,
    food: 0,
    hungry: false,
    known,
    learnedThisJourney: [],
    path: [],
    last: null,
    ending: null,
  };
}
