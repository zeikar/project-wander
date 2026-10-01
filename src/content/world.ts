import type { Destination, Region, RegionId } from "./types";

// Sanity-swept over 2000 seeds (2026-10-01): a careful player who knows
// nothing — random roads, guesses weighed by their average outcome — dies on
// about 17% of first journeys in the fields (20% before the weather and the
// repricing); one who knows everything almost never does. At 5 hp / 3 food
// the first figure was 42%.
export const START_HP = 6;
export const MAX_HP = 6;
export const START_FOOD = 4;
export const MAX_FOOD = 6;

// Days of road between the village and the far edge of the map. The
// destinations sit one day beyond the last of them.
export const ROAD_DAYS = 5;

// How a road node is filled. Rolled per node when the map is made.
export const NODE_ODDS = { animal: 0.55, place: 0.3 } as const; // rest: quiet

export const FIRST_REGION: RegionId = "fields";

export const regions: readonly Region[] = [
  {
    id: "fields",
    species: ["boar", "wolves", "deer"],
    places: ["old-camp", "overturned-cart", "shepherd-hut"],
    destinations: [
      { id: "white-stag-lake", needs: "deer.dawn" },
      { id: "wolf-rock", needs: "wolves.chase" },
      { id: "acorn-valley", needs: "boar.sow" },
    ],
    // How often each sky comes. Wind is even odds.
    skyOdds: { rain: 0.2, fog: 0.2 }, // rest: clear
    // The stag leaves along the lake's far shore: seeing it is what shows the way past the lake.
    gate: { destinationId: "white-stag-lake", to: "marsh" },
  },
  // Sanity-swept over 2000 seeds (2026-10-01), the same careful player as by
  // START_HP: knowing nothing dies on 19% of journeys here (fields 17%). One who
  // never takes an option with an unread outcome dies on 15% (fields 5%) — the
  // marsh has fewer certain ways to food. Knowing everything: 0.1%.
  {
    id: "marsh",
    species: ["heron", "otter", "lantern"],
    places: ["reed-hut", "sunken-boat"],
    destinations: [
      { id: "heron-island", needs: "heron.wade" },
      { id: "otter-weir", needs: "otter.cache" },
      { id: "lantern-shoal", needs: "lantern.dawn" },
    ],
    // Fog is the marsh's weather; rain keeps the fields' odds.
    skyOdds: { rain: 0.2, fog: 0.4 },
  },
];

export const destinations: readonly Destination[] = regions.flatMap((r) => r.destinations);

export function regionById(id: RegionId): Region {
  return regions.find((r) => r.id === id)!;
}
