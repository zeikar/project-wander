export interface JourneyLeg {
  name: string;
  description: string;
}

export interface Journey {
  start: { hp: number; food: number; preparation: number };
  legs: readonly JourneyLeg[];
  arrival: {
    name: string;
    variants: {
      unmarked: string;
      limped: string;
      provisioned: string;
      wellStocked: string;
      default: string;
    };
  };
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
    variants: {
      unmarked:
        "Alderbrook's gate is only a gap in the hedge, and you're through it before you've had time to feel it. Someone's wash hangs drying on the shrine steps, and no one minds you stepping around it. You reach the inn with light still in the sky and order supper you didn't feel you'd earned.",
      limped:
        "Alderbrook comes into view a roof at a time, and you count every one of them between rests. By the shrine's chipped bell, you sit down harder than you meant to. A woman sorting onions brings you water without being asked.",
      provisioned:
        "The mill wheel is still grinding when you walk into Alderbrook, loud over the water. Your pack still swings heavy with food, however much of it the road took and gave back along the way. The miller's boy eyeballs it and asks if you got lost on the way.",
      wellStocked:
        "Alderbrook's rooftops catch the last of the day's light as you walk in, pack still swinging at your hip. Your preparation sits at the exact count you started with, whatever the road swapped in and out of it. You end up handing half of it to the shrine keeper, who looks like she's been waiting for exactly this.",
      default:
        "Alderbrook turns out to be smaller than the stories made it sound: a mill, a shrine with a chipped bell, and a few dozen roofs. A dog barks twice at you and loses interest.",
    },
  },
};
