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
      // Knowing what wolves do makes this safe, not free: backing out the way
      // you came costs the day. What it buys over the fire is that rain cannot
      // close it. Was 0 in every variant, which let knowledge settle the scene.
      {
        id: "back-away",
        needs: "wolves.chase",
        outcomes: {
          stalking: { hp: 0, food: -1 },
          passing: { hp: 0, food: 0 },
        },
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
      // Was free in every variant. Uphill is where he will not follow, not an
      // easy road.
      {
        id: "step-uphill",
        needs: "deer.drive",
        outcomes: {
          holding: { hp: -1, food: 0 },
          grazing: { hp: 0, food: 0 },
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
];

export function findScene(id: string): Scene | undefined {
  return scenes.find((scene) => scene.id === id);
}
