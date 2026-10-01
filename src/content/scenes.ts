import type { Outcome, Scene } from "./types";

// Same outcome whatever is going on — the choice does not depend on reading
// the scene, so the screen can state it plainly.
function always(variants: readonly string[], outcome: Outcome) {
  return Object.fromEntries(variants.map((v) => [v, outcome]));
}

// Every scene keeps a certain way through that costs no food — with an empty
// pack, time is paid in blood instead. In v0 an empty pack left one gamble,
// and that was where most deaths came from. Pinned in reducer.test.ts.
const FORD = ["rooting", "alert"] as const;
const WALLOW = ["sleeping", "sow"] as const;
const PINES = ["stalking", "passing"] as const;
const KILL = ["full", "hungry"] as const;
const RUT = ["holding", "grazing"] as const;
const WATER = ["downwind", "upwind", "rain"] as const;
const SHALLOWS = ["near", "aside"] as const;
const REEDS = ["settled", "lifting"] as const;
const BANK = ["cached", "holed"] as const;
const CAMP = ["visited", "clean"] as const;
const LIGHT = ["night", "dawn"] as const;
const ONE = ["only"] as const;

export const scenes: readonly Scene[] = [
  // --- boar -----------------------------------------------------------------
  {
    id: "ford-boar",
    kind: "animal",
    species: "boar",
    variants: FORD,
    reads: "boar.nose",
    byWind: { behind: "alert", ahead: "rooting", rain: "rooting" },
    options: [
      {
        id: "cross",
        outcomes: {
          rooting: { hp: 0, food: 0 },
          // Learning the hard way: the charge teaches what watching would have.
          alert: { hp: -2, food: 0, learn: "boar.nose" },
        },
      },
      { id: "wait", outcomes: always(FORD, { hp: -1, food: 0 }) },
      { id: "detour", outcomes: always(FORD, { hp: 0, food: -1 }) },
      {
        id: "watch",
        study: true,
        outcomes: always(FORD, { hp: 0, food: -1, learn: "boar.nose" }),
      },
      {
        id: "take-roots",
        needs: "boar.nose",
        outcomes: {
          rooting: { hp: 0, food: 1 },
          alert: { hp: -2, food: 1 },
        },
      },
    ],
  },
  {
    id: "wallow-boar",
    kind: "animal",
    species: "boar",
    variants: WALLOW,
    reads: "boar.sow",
    options: [
      { id: "pass", outcomes: always(WALLOW, { hp: 0, food: 0 }) },
      {
        id: "forage",
        outcomes: {
          sleeping: { hp: -1, food: 2 },
          sow: { hp: -3, food: 2, learn: "boar.sow" },
        },
      },
      {
        id: "watch",
        study: true,
        outcomes: {
          sleeping: { hp: 0, food: -1, learn: "boar.nose" },
          sow: { hp: 0, food: -1, learn: "boar.sow" },
        },
      },
      {
        id: "edge-forage",
        needs: "boar.sow",
        outcomes: always(WALLOW, { hp: 0, food: 1 }),
      },
    ],
  },

  // --- wolves ---------------------------------------------------------------
  {
    id: "pine-wolves",
    kind: "animal",
    species: "wolves",
    variants: PINES,
    reads: "wolves.chase",
    byWind: { behind: "stalking", ahead: "passing", rain: "passing" },
    options: [
      {
        id: "keep-walking",
        outcomes: {
          stalking: { hp: -2, food: 0 },
          passing: { hp: 0, food: 0 },
        },
      },
      { id: "climb", outcomes: always(PINES, { hp: -1, food: 0 }) },
      {
        id: "fire",
        closedIn: ["rain"],
        outcomes: always(PINES, { hp: 0, food: -1 }),
      },
      {
        id: "watch",
        study: true,
        outcomes: {
          stalking: { hp: -1, food: -1, learn: "wolves.chase" },
          passing: { hp: 0, food: -1, learn: "wolves.chase" },
        },
      },
      // Knowing they chase what runs, you can back off and follow the pack at a
      // distance — a day spent, and the next thing about wolves learned. A
      // different kind of trade from the fire or the tree, and gone once known.
      {
        id: "back-away",
        needs: "wolves.chase",
        study: true,
        outcomes: always(PINES, { hp: 0, food: -1, learn: "wolves.rank" }),
      },
    ],
  },
  {
    id: "kill-wolves",
    kind: "animal",
    species: "wolves",
    variants: KILL,
    reads: "wolves.rank",
    options: [
      { id: "night-walk", outcomes: always(KILL, { hp: -1, food: 0 }) },
      { id: "go-around", outcomes: always(KILL, { hp: 0, food: -1 }) },
      {
        id: "steal",
        outcomes: {
          full: { hp: -1, food: 2 },
          hungry: { hp: -4, food: 2, learn: "wolves.rank" },
        },
      },
      {
        id: "watch",
        study: true,
        outcomes: always(KILL, { hp: 0, food: -1, learn: "wolves.rank" }),
      },
      {
        id: "wait-for-scraps",
        needs: "wolves.rank",
        outcomes: {
          full: { hp: 0, food: 1 },
          hungry: { hp: -1, food: 1 },
        },
      },
    ],
  },

  // --- deer -----------------------------------------------------------------
  {
    id: "rut-stag",
    kind: "animal",
    species: "deer",
    variants: RUT,
    reads: "deer.drive",
    options: [
      {
        id: "cross",
        outcomes: {
          holding: { hp: -3, food: 0, learn: "deer.drive" },
          grazing: { hp: 0, food: 0 },
        },
      },
      { id: "wait", outcomes: always(RUT, { hp: -1, food: 0 }) },
      { id: "detour", outcomes: always(RUT, { hp: 0, food: -1 }) },
      {
        id: "watch",
        study: true,
        outcomes: always(RUT, { hp: 0, food: -1, learn: "deer.drive" }),
      },
      // Knowing he will not follow uphill, you can spend the night on the slope
      // and watch the hinds go down to water at dawn: one fact leading to the
      // next, and to the white stag. Gone once known.
      {
        id: "step-uphill",
        needs: "deer.drive",
        study: true,
        outcomes: {
          holding: { hp: -1, food: 0, learn: "deer.dawn" },
          grazing: { hp: 0, food: -1, learn: "deer.dawn" },
        },
      },
    ],
  },
  {
    id: "dawn-water",
    kind: "animal",
    species: "deer",
    variants: WATER,
    reads: "deer.dawn",
    byWind: { behind: "upwind", ahead: "downwind", rain: "rain" },
    options: [
      { id: "fill-and-go", outcomes: always(WATER, { hp: 0, food: 0 }) },
      { id: "rest", outcomes: always(WATER, { hp: 1, food: 0 }) },
      {
        id: "watch",
        study: true,
        outcomes: always(WATER, { hp: 0, food: -1, learn: "deer.dawn" }),
      },
      {
        id: "follow-trail",
        needs: "deer.dawn",
        outcomes: {
          downwind: { hp: 0, food: 1 },
          upwind: { hp: 0, food: 0 },
          // Rain buries scent, so the deer come down whatever the wind.
          rain: { hp: 0, food: 1 },
        },
      },
    ],
  },

  // --- heron ----------------------------------------------------------------
  {
    id: "heron-shallows",
    kind: "animal",
    species: "heron",
    variants: SHALLOWS,
    reads: "heron.wade",
    options: [
      {
        id: "wade",
        outcomes: {
          near: { hp: 0, food: 0 },
          aside: { hp: -2, food: 0, learn: "heron.wade" },
        },
      },
      { id: "wait", outcomes: always(SHALLOWS, { hp: -1, food: 0 }) },
      // The marsh's one option the fog closes: the willows on the far bank are
      // what you steer by.
      {
        id: "pole-around",
        closedIn: ["fog"],
        outcomes: always(SHALLOWS, { hp: 0, food: -1 }),
      },
      {
        id: "watch",
        study: true,
        outcomes: always(SHALLOWS, { hp: 0, food: -1, learn: "heron.wade" }),
      },
      // Costs hp in `aside`: the heron's line is long and cold, so knowing where
      // the shallows are does not waive the crossing.
      {
        id: "heron-line",
        needs: "heron.wade",
        outcomes: {
          near: { hp: 0, food: 1 },
          aside: { hp: -1, food: 1 },
        },
      },
    ],
  },
  {
    id: "heron-reeds",
    kind: "animal",
    species: "heron",
    variants: REEDS,
    reads: "heron.lift",
    options: [
      {
        id: "push-through",
        outcomes: {
          settled: { hp: 0, food: 0 },
          lifting: { hp: -2, food: 0, learn: "heron.lift" },
        },
      },
      { id: "wait", outcomes: always(REEDS, { hp: -1, food: 0 }) },
      { id: "skirt", outcomes: always(REEDS, { hp: 0, food: -1 }) },
      {
        id: "watch",
        study: true,
        outcomes: always(REEDS, { hp: 0, food: -1, learn: "heron.lift" }),
      },
      {
        id: "dig-roots",
        needs: "heron.lift",
        outcomes: {
          settled: { hp: 0, food: 1 },
          lifting: { hp: -1, food: 1 },
        },
      },
    ],
  },

  // --- otter ----------------------------------------------------------------
  {
    id: "otter-bank",
    kind: "animal",
    species: "otter",
    variants: BANK,
    reads: "otter.cache",
    options: [
      {
        id: "reach-under",
        outcomes: {
          cached: { hp: -1, food: 2 },
          holed: { hp: -2, food: 1, learn: "otter.cache" },
        },
      },
      { id: "pass", outcomes: always(BANK, { hp: 0, food: 0 }) },
      {
        id: "watch",
        study: true,
        outcomes: always(BANK, { hp: 0, food: -1, learn: "otter.cache" }),
      },
      // With the otter at home it costs a cold wait in the reeds for it to go.
      {
        id: "take-one",
        needs: "otter.cache",
        outcomes: {
          cached: { hp: 0, food: 1 },
          holed: { hp: -1, food: 1 },
        },
      },
    ],
  },
  {
    id: "otter-camp",
    kind: "animal",
    species: "otter",
    variants: CAMP,
    reads: "otter.raid",
    options: [
      {
        id: "sleep",
        outcomes: {
          visited: { hp: 1, food: -2, learn: "otter.raid" },
          clean: { hp: 1, food: 0 },
        },
      },
      { id: "push-on", outcomes: always(CAMP, { hp: -1, food: 0 }) },
      {
        id: "watch",
        study: true,
        outcomes: always(CAMP, { hp: 0, food: -1, learn: "otter.raid" }),
      },
      // A pillow keeps most of the pack, not all of it: they still get a meal.
      {
        id: "pack-pillow",
        needs: "otter.raid",
        outcomes: {
          visited: { hp: 1, food: -1 },
          clean: { hp: 1, food: 0 },
        },
      },
    ],
  },

  // --- lantern --------------------------------------------------------------
  {
    id: "lantern-light",
    kind: "monster",
    species: "lantern",
    variants: LIGHT,
    reads: "lantern.drift",
    options: [
      {
        id: "follow",
        outcomes: {
          night: { hp: -3, food: 0, learn: "lantern.drift" },
          dawn: { hp: -1, food: 0, learn: "lantern.dawn" },
        },
      },
      { id: "call-out", outcomes: always(LIGHT, { hp: -1, food: 0 }) },
      { id: "keep-to-causeway", outcomes: always(LIGHT, { hp: 0, food: -1 }) },
      // Two lessons, one per variant, as at the wallow: where the light settles
      // can only be seen at dawn. The menu must not give away which is on offer.
      {
        id: "watch",
        study: true,
        outcomes: {
          night: { hp: 0, food: -1, learn: "lantern.drift" },
          dawn: { hp: 0, food: -1, learn: "lantern.dawn" },
        },
      },
      // Knowing turns the danger into a guide, and it is still a trade: at
      // night the light has to be waited out in the cold before it settles.
      {
        id: "dawn-ground",
        needs: "lantern.dawn",
        outcomes: {
          night: { hp: -1, food: 1 },
          dawn: { hp: 0, food: 1 },
        },
      },
    ],
  },

  // --- places ---------------------------------------------------------------
  {
    id: "old-camp",
    kind: "place",
    variants: ONE,
    options: [
      { id: "rest", outcomes: always(ONE, { hp: 2, food: -1 }) },
      { id: "search", outcomes: always(ONE, { hp: 0, food: 1 }) },
      { id: "pass", outcomes: always(ONE, { hp: 0, food: 0 }) },
    ],
  },
  {
    id: "overturned-cart",
    kind: "place",
    variants: ONE,
    options: [
      { id: "search", outcomes: always(ONE, { hp: -1, food: 2 }) },
      { id: "pass", outcomes: always(ONE, { hp: 0, food: 0 }) },
    ],
  },
  {
    id: "shepherd-hut",
    kind: "place",
    variants: ONE,
    options: [
      { id: "sleep", outcomes: always(ONE, { hp: 2, food: -1 }) },
      // A second way to learn: someone else watched, and wrote it down.
      {
        id: "read-the-wall",
        study: true,
        outcomes: always(ONE, { hp: 0, food: 0, learn: "wolves.rank" }),
      },
      { id: "pass", outcomes: always(ONE, { hp: 0, food: 0 }) },
    ],
  },
  {
    id: "reed-hut",
    kind: "place",
    variants: ONE,
    options: [
      { id: "sleep", outcomes: always(ONE, { hp: 2, food: -1 }) },
      { id: "pass", outcomes: always(ONE, { hp: 0, food: 0 }) },
    ],
  },
  {
    id: "sunken-boat",
    kind: "place",
    variants: ONE,
    options: [
      { id: "search", outcomes: always(ONE, { hp: -1, food: 2 }) },
      { id: "pass", outcomes: always(ONE, { hp: 0, food: 0 }) },
    ],
  },

  // --- people ---------------------------------------------------------------
  // Each wants one thing the traveler may know, and pays for it in kind: a bed
  // and a meal (+1, +1), beside the rest (+2, -1) and the work (-1, +2) anyone
  // can have. Telling what was seen at a far place earns what they know.
  {
    id: "old-shepherd",
    kind: "person",
    variants: ONE,
    options: [
      { id: "sit-by-fire", outcomes: always(ONE, { hp: 2, food: -1 }) },
      { id: "walk-the-flock", outcomes: always(ONE, { hp: -1, food: 2 }) },
      { id: "stand-guard", needs: "wolves.chase", outcomes: always(ONE, { hp: 1, food: 1 }) },
      {
        id: "tell-of-rock",
        seen: "wolf-rock",
        study: true,
        outcomes: always(ONE, { hp: 0, food: 0, learn: "deer.drive" }),
      },
      { id: "pass", outcomes: always(ONE, { hp: 0, food: 0 }) },
    ],
  },
  {
    id: "charcoal-burner",
    kind: "person",
    variants: ONE,
    options: [
      { id: "rest-by-kiln", outcomes: always(ONE, { hp: 2, food: -1 }) },
      { id: "carry-wood", outcomes: always(ONE, { hp: -1, food: 2 }) },
      { id: "fetch-water", needs: "boar.nose", outcomes: always(ONE, { hp: 1, food: 1 }) },
      {
        id: "tell-of-valley",
        seen: "acorn-valley",
        study: true,
        outcomes: always(ONE, { hp: 0, food: 0, learn: "lantern.drift" }),
      },
      { id: "pass", outcomes: always(ONE, { hp: 0, food: 0 }) },
    ],
  },
  // The two marsh people each know what the other needs.
  {
    id: "reed-cutter",
    kind: "person",
    variants: ONE,
    options: [
      { id: "share-supper", outcomes: always(ONE, { hp: 2, food: -1 }) },
      { id: "bundle-reeds", outcomes: always(ONE, { hp: -1, food: 2 }) },
      { id: "watch-herons", needs: "heron.lift", outcomes: always(ONE, { hp: 1, food: 1 }) },
      {
        id: "tell-of-island",
        seen: "heron-island",
        study: true,
        outcomes: always(ONE, { hp: 0, food: 0, learn: "otter.raid" }),
      },
      { id: "pass", outcomes: always(ONE, { hp: 0, food: 0 }) },
    ],
  },
  {
    id: "eel-fisher",
    kind: "person",
    variants: ONE,
    options: [
      { id: "share-fire", outcomes: always(ONE, { hp: 2, food: -1 }) },
      { id: "haul-traps", outcomes: always(ONE, { hp: -1, food: 2 }) },
      { id: "guard-the-catch", needs: "otter.raid", outcomes: always(ONE, { hp: 1, food: 1 }) },
      {
        id: "tell-of-weir",
        seen: "otter-weir",
        study: true,
        outcomes: always(ONE, { hp: 0, food: 0, learn: "heron.lift" }),
      },
      { id: "pass", outcomes: always(ONE, { hp: 0, food: 0 }) },
    ],
  },
];

export function findScene(id: string): Scene | undefined {
  return scenes.find((scene) => scene.id === id);
}
