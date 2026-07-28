// Authored encounter content. Like journey.ts, this owns its own types and
// imports nothing from the core: content is the bottom of the dependency chain.

export interface EncounterOption {
  id: string;
  label: string;
  hpDelta: number;
  foodDelta: number;
  preparationDelta: number;
  resultText: string;
}

export interface Encounter {
  id: string;
  title: string;
  description: string;
  options: readonly EncounterOption[];
}

// Three road encounters for the prototype. The animals are animals: they are
// hungry, territorial or busy, never villains, and every one of them can be
// answered without a fight.
export const encounters: readonly Encounter[] = [
  {
    id: "ford-boar",
    title: "A Boar in the Ford",
    description:
      "Where the road crosses the stream, a marsh boar stands mid-current ripping at reed roots. Mud steams on its shoulders, and there is no way across that does not pass within arm's reach of it.",
    options: [
      {
        id: "wade-past",
        label: "Wade past it, slow and steady",
        hpDelta: -6,
        foodDelta: 0,
        preparationDelta: 0,
        resultText:
          "It charges halfway across before you are clear, and its shoulder grinds you against the stones. Then it loses interest and goes back to the reeds.",
      },
      {
        id: "scatter-bait",
        label: "Scatter some of your prepared bait downstream",
        hpDelta: 0,
        foodDelta: 0,
        preparationDelta: -1,
        resultText:
          "It follows the smell downstream, unhurried. You cross with dry ankles and a hammering heart.",
      },
      {
        id: "wait-it-out",
        label: "Sit down out of sight and wait it out",
        hpDelta: 0,
        foodDelta: -1,
        preparationDelta: 0,
        resultText:
          "You wait out the afternoon behind a willow, eating to pass the time. Near dusk the boar climbs the far bank and is gone.",
      },
    ],
  },
  {
    id: "pine-shadows",
    title: "Gray Shapes Between the Pines",
    description:
      "Two lean gray shapes keep pace with you just off the road. When you stop, they stop. One lifts its nose and tests the air for a long moment.",
    options: [
      {
        id: "walk-on",
        label: "Keep walking and do not run",
        hpDelta: -4,
        foodDelta: 0,
        preparationDelta: 0,
        resultText:
          "One darts in to test you, teeth catching your calf. Then both peel away into the trees, as if they had agreed on something.",
      },
      {
        id: "light-torch",
        label: "Light one of your prepared pitch torches",
        hpDelta: 0,
        foodDelta: 0,
        preparationDelta: -1,
        resultText:
          "Both freeze at the flare. They back off stiff-legged, eyes green in the firelight.",
      },
      {
        id: "share-food",
        label: "Throw them a share of your food",
        hpDelta: 0,
        foodDelta: -1,
        preparationDelta: 0,
        resultText:
          "The sounds that follow you down the road are busy ones, not hungry ones.",
      },
    ],
  },
  {
    id: "bee-hollow",
    title: "A Humming Hollow",
    description:
      "A split oak beside the road hums like a struck fence post. Dark comb glistens in the crack, and the air around it is thick with slow, heavy bees.",
    options: [
      {
        id: "reach-in",
        label: "Reach in bare-handed for the comb",
        hpDelta: -3,
        foodDelta: 2,
        preparationDelta: 0,
        resultText:
          "You come away with two fists of dripping comb and a constellation of stings up both arms.",
      },
      {
        id: "smoke-them",
        label: "Use your prepared tinder to smoke them calm",
        hpDelta: 0,
        foodDelta: 2,
        preparationDelta: -1,
        resultText:
          "The hum drops to a murmur. You cut the comb free and leave the bees their half.",
      },
      {
        id: "leave-it",
        label: "Leave the tree its honey",
        hpDelta: 0,
        foodDelta: 0,
        preparationDelta: 0,
        resultText:
          "You mark the tree in your memory — worth knowing on the road home — and walk on.",
      },
    ],
  },
];
