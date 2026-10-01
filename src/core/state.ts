import type { FactId, RegionId } from "../content/types";
import { FIRST_REGION } from "../content/world";
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
  // `opened`: the way found on this journey, if any.
  | { kind: "arrived"; destinationId: string; saw: boolean; opened: RegionId | null }
  | { kind: "died"; cause: "wounds" | "hunger" };

export interface GameState {
  phase: Phase;
  seed: number;
  region: RegionId; // the country this journey crosses
  map: WorldMap | null;
  at: string | null; // the node the traveler is standing on
  day: number;
  hp: number;
  food: number;
  // Whether today's walk went hungry — the road took blood instead of a meal.
  hungry: boolean;
  // The notebook. The only thing that survives a journey.
  known: readonly FactId[];
  // The ways the traveler knows — the notebook's other page, kept like `known`.
  open: readonly RegionId[];
  learnedThisJourney: readonly FactId[];
  path: readonly string[];
  last: LastEvent | null;
  ending: Ending | null;
}

export type GameAction =
  | { type: "START"; seed: number; region: RegionId }
  | { type: "MOVE"; nodeId: string }
  | { type: "CHOOSE"; optionId: string };

export function createInitialState(
  known: readonly FactId[] = [],
  open: readonly RegionId[] = [FIRST_REGION],
): GameState {
  return {
    phase: "title",
    seed: 0,
    region: FIRST_REGION,
    map: null,
    at: null,
    day: 0,
    hp: 0,
    food: 0,
    hungry: false,
    known,
    open,
    learnedThisJourney: [],
    path: [],
    last: null,
    ending: null,
  };
}
