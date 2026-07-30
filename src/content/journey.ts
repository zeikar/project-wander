export interface JourneyLeg {
  name: string;
  description: string;
}

export interface Journey {
  start: { hp: number; food: number; preparation: number };
  legs: readonly JourneyLeg[];
  arrival: { name: string; description: string };
}

// The one journey for the prototype vertical slice: a short walk from a
// hometown to a neighboring village, worth taking because the world is
// larger than expected, not because of any grand quest.
export const journey: Journey = {
  start: { hp: 20, food: 2, preparation: 2 },
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
  arrival: {
    name: "Alderbrook",
    description:
      "Alderbrook turns out to be smaller than the stories made it sound: a mill, a shrine with a chipped bell, and a few dozen roofs. A dog barks twice at you and loses interest.",
  },
};
