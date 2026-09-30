import type { Destination } from "./types";

// Sanity-swept over 2000 seeds (2026-10-01): a careful player who knows
// nothing dies on about 18% of first journeys; one who knows everything
// almost never does. At 5 hp / 3 food the first figure was 42%.
export const START_HP = 6;
export const MAX_HP = 6;
export const START_FOOD = 4;
export const MAX_FOOD = 6;

// Days of road between the village and the far edge of the map. The
// destinations sit one day beyond the last of them.
export const ROAD_DAYS = 5;

// How a road node is filled. Rolled per node when the map is made.
export const NODE_ODDS = { animal: 0.55, place: 0.3 } as const; // rest: quiet

export const destinations: readonly Destination[] = [
  { id: "white-stag-lake", needs: "deer.dawn" },
  { id: "wolf-rock", needs: "wolves.chase" },
  { id: "acorn-valley", needs: "boar.sow" },
];
