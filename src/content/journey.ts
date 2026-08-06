// Two ways to walk one leg. They meet the SAME animals in the same proportion
// and pay the SAME toll; the only thing a route changes is how likely the leg
// turns something up. That restraint is measured, not modesty: every version
// that also priced the roads differently collapsed into one correct road, taken
// on 74-93% of the nodes where the two disagreed. Charging nothing is what keeps
// both of them worth taking.
export interface LegRoute {
  id: string;
  label: string;
  description: string;
  encounterChance: number;
}

export interface JourneyLeg {
  name: string;
  description: string;
  routes: readonly LegRoute[];
}

// The in-world rule behind both numbers, kept identical on every leg so it is
// learnable: open ground turns up less than thick cover.
// Measured over 300 seeds against the unbranched 0.6 road. At 0.5/0.75 neither
// way dominates — the quiet one is uniquely optimal on 13.6% of optimal-line
// travel nodes, the busy one on 10.5%, and the two disagree on 24.2%. Widening
// the gap makes the choice sharper and the journey easier at the same time
// (0.3/0.75 reaches 47.2% decisive but drops the best ending's lockout to
// 17.7%, and starves the wolves' `read-the-pack` down to 6.9%); narrowing it to
// 0.55/0.65 leaves the roads agreeing on 90.1% of nodes.
const QUIET_ROUTE_CHANCE = 0.5;
const BUSY_ROUTE_CHANCE = 0.75;

// How the journey ended, ranked best to worst by the selector in core/arrival.ts.
// These are outcomes, not flavour: the label is what the arrival screen calls the
// run, so leftover supplies and surviving hp both buy something at the gate.
export type ArrivalEndingId = "travelOn" | "limped" | "spent" | "arrived";

export interface ArrivalEnding {
  label: string;
  text: string;
}

export interface Journey {
  start: { hp: number; food: number; preparation: number };
  legs: readonly JourneyLeg[];
  // What finishing a leg costs, said out loud. These two lines are the only
  // place the road's price is ever stated; keeping the wording fixed is what
  // lets a player learn the rate by seeing it repeat.
  road: { fed: string; hungry: string };
  arrival: {
    name: string;
    endings: Record<ArrivalEndingId, ArrivalEnding>;
  };
}

// The one journey for the prototype vertical slice: a short walk from a
// hometown to a neighboring village, worth taking because the world is
// larger than expected, not because of any grand quest.
export const journey: Journey = {
  // hp 14 rather than 20: at 20 a careful traveler was never near a threshold,
  // so no arrival condition could tell good play from lucky play.
  // food 3 rather than 2, for a four-leg walk: at 2, two legs were always walked
  // hungry, which capped a run that found no honey at hp 8 — one short of
  // TRAVEL_ON_HP_MIN. That made the best ending unreachable by ANY line of play
  // on 58.7% of seeds (measured over 300), and nothing on screen distinguished
  // a seed you lost from a seed you were never allowed to win. Three days of
  // food for a four-day road still runs out; it just stops deciding the run
  // before the player does. Measured AT THE TIME: lockout 58.7% -> 29.7%, and
  // the best fixed priority table topping out at 59.3% of seeds (gate: 70%).
  // Both figures are historical — they predate the codex and the route branch,
  // each of which moved them. Currently measured over 300 seeds: lockout 29.7%
  // (exhaustive), and 33.7% for the best fixed policy FOUND BY HILL CLIMBING
  // over a stated class of priority tables and route rules. That last one is a
  // lower bound, not an optimum: it can only understate the true best policy,
  // so it disproves the 70% gate but cannot prove it. Re-measure before tuning
  // against either.
  start: { hp: 14, food: 3, preparation: 2 },
  legs: [
    {
      name: "The Old Millpond Road",
      description:
        "The road out of town runs past a millpond gone still and green. A heron watches you pass without bothering to fly.",
      routes: [
        {
          id: "towpath",
          label: "Stay on the towpath",
          description:
            "Flat and open, walked bare by the mill's own carts. You would see anything coming a long way off.",
          encounterChance: QUIET_ROUTE_CHANCE,
        },
        {
          id: "reed-beds",
          label: "Cut through the reed beds",
          // No route prose may promise time, distance or supplies: the roads
          // are priced identically on purpose, so a label that hints otherwise
          // is a lie about the only decision on this screen. This one used to
          // open with "Shorter,".
          description:
            "Green and close, and loud with things you cannot see. The heron came here for a reason.",
          encounterChance: BUSY_ROUTE_CHANCE,
        },
      ],
    },
    {
      name: "Crossroads Waymarker",
      description:
        "A wooden waymarker leans hard to one side, its painted letters faded to guesses. Someone has tied a strip of cloth to it, for luck or for grief.",
      routes: [
        {
          id: "cart-road",
          label: "Take the wide cart road",
          description:
            "Rutted and open to the sky. Whatever else it is, it is used.",
          encounterChance: QUIET_ROUTE_CHANCE,
        },
        {
          id: "drovers-track",
          label: "Follow the old drovers' track",
          description:
            "Half grown over. Nobody has driven cattle up it in years, which does not mean nothing uses it.",
          encounterChance: BUSY_ROUTE_CHANCE,
        },
      ],
    },
    {
      name: "The Ferry Crossing",
      // The ferryman used to grumble "about the toll before he even sees your
      // coin". That was written before the leg had two ways out of it, and it
      // made the bank walk read as a way to dodge a fare — a saving the rules
      // do not offer. There is no coin in this game.
      description:
        "An old ferryman rings a small bell to call the boat back from the far bank. Below the crossing the river spreads out wide and shallow, and a footpath runs down to meet it.",
      routes: [
        {
          id: "ferry",
          label: "Take the ferry across",
          // Not "there is nothing to meet out there" — this way still turns
          // something up half the time. A route may describe its COVER; it may
          // never promise an empty road.
          description:
            "Open water and a bored old man. Out there you are in plain sight, and so is everything else.",
          encounterChance: QUIET_ROUTE_CHANCE,
        },
        {
          id: "shallows",
          label: "Walk the bank down to the shallows",
          description:
            "Willow scrub the whole way, close enough to touch on both sides. It comes out at the same bank by the same evening, and the scrub is not empty.",
          encounterChance: BUSY_ROUTE_CHANCE,
        },
      ],
    },
    {
      name: "Pinewood Rise",
      description:
        "The path climbs through a thin pine wood where the wind sounds like distant conversation. Somewhere off in the trees, something large moves and then goes quiet.",
      routes: [
        {
          id: "bare-ridge",
          label: "Climb the bare ridge",
          description:
            "Out of the trees entirely, and no steeper for it. Nothing up there has anywhere to stand out of sight.",
          encounterChance: QUIET_ROUTE_CHANCE,
        },
        {
          id: "pines",
          label: "Keep to the pines",
          description:
            "Sheltered and close, and quiet the way a room is quiet when someone else is in it.",
          encounterChance: BUSY_ROUTE_CHANCE,
        },
      ],
    },
  ],
  road: {
    fed: "A day's walking, and a meal gone from the pack.",
    hungry: "Nothing left in the pack. The miles take it out of you instead.",
  },
  arrival: {
    name: "Alderbrook",
    endings: {
      travelOn: {
        label: "You arrive with road still left in you",
        text: "The mill wheel is still grinding when you walk into Alderbrook, loud over the water. There is weight in your pack yet, and your legs have not finished with you. Sitting down outside the inn, what you find yourself thinking about is not the bed — it is the road going on past the hedge, and where it goes.",
      },
      limped: {
        label: "You arrive barely",
        text: "Alderbrook comes into view a roof at a time, and you count every one of them between rests. By the shrine's chipped bell you sit down harder than you meant to. A woman sorting onions brings you water without being asked, and does not ask anything back.",
      },
      spent: {
        label: "You arrive with nothing left",
        text: "You walk in with a pack that swings light and says nothing when you set it down. The road took the last of the food and the last of the kit somewhere back among the pines. You made it, which turns out to be a different feeling than arriving.",
      },
      arrived: {
        label: "You arrive",
        text: "Alderbrook turns out to be smaller than the stories made it sound: a mill, a shrine with a chipped bell, and a few dozen roofs. A dog barks twice at you and loses interest.",
      },
    },
  },
};
