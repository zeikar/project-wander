export interface JourneyLeg {
  name: string;
  description: string;
}

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
  start: { hp: 14, food: 2, preparation: 2 },
  legs: [
    {
      name: "The Old Millpond Road",
      description:
        "The road out of town runs past a millpond gone still and green. A heron watches you pass without bothering to fly.",
    },
    {
      name: "Crossroads Waymarker",
      description:
        "A wooden waymarker leans hard to one side, its painted letters faded to guesses. Someone has tied a strip of cloth to it, for luck or for grief.",
    },
    {
      name: "The Ferry Crossing",
      description:
        "An old ferryman rings a small bell to call the boat back from the far bank, grumbling about the toll before he even sees your coin.",
    },
    {
      name: "Pinewood Rise",
      description:
        "The path climbs through a thin pine wood where the wind sounds like distant conversation. Somewhere off in the trees, something large moves and then goes quiet.",
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
