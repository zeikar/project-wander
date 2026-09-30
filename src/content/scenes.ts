import type { Outcome, Scene } from "./types";

// Same outcome whatever is going on — the choice does not depend on reading
// the scene, so the screen can state it plainly.
function always(variants: readonly string[], outcome: Outcome) {
  return Object.fromEntries(variants.map((v) => [v, outcome]));
}

const FORD = ["rooting", "alert"] as const;
const WALLOW = ["sleeping", "sow"] as const;
const PINES = ["stalking", "passing"] as const;
const KILL = ["full", "hungry"] as const;
const RUT = ["holding", "grazing"] as const;
const WATER = ["downwind", "upwind"] as const;
const ONE = ["only"] as const;

export const scenes: readonly Scene[] = [
  // --- boar -----------------------------------------------------------------
  {
    id: "ford-boar",
    kind: "animal",
    species: "boar",
    variants: FORD,
    reads: "boar.nose",
    options: [
      {
        id: "cross",
        outcomes: {
          rooting: { hp: 0, food: 0 },
          // Learning the hard way: the charge teaches what watching would have.
          alert: { hp: -2, food: 0, learn: "boar.nose" },
        },
      },
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
    options: [
      {
        id: "keep-walking",
        outcomes: {
          stalking: { hp: -2, food: 0 },
          passing: { hp: 0, food: 0 },
        },
      },
      { id: "fire", outcomes: always(PINES, { hp: 0, food: -1 }) },
      {
        id: "watch",
        study: true,
        outcomes: {
          stalking: { hp: -1, food: -1, learn: "wolves.chase" },
          passing: { hp: 0, food: -1, learn: "wolves.chase" },
        },
      },
      {
        id: "back-away",
        needs: "wolves.chase",
        outcomes: always(PINES, { hp: 0, food: 0 }),
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
          full: { hp: 0, food: 2 },
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
      { id: "detour", outcomes: always(RUT, { hp: 0, food: -1 }) },
      {
        id: "watch",
        study: true,
        outcomes: always(RUT, { hp: 0, food: -1, learn: "deer.drive" }),
      },
      {
        id: "step-uphill",
        needs: "deer.drive",
        outcomes: always(RUT, { hp: 0, food: 0 }),
      },
    ],
  },
  {
    id: "dawn-water",
    kind: "animal",
    species: "deer",
    variants: WATER,
    reads: "deer.dawn",
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
          downwind: { hp: 0, food: 2 },
          upwind: { hp: 0, food: 0 },
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
