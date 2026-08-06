// Authored encounter content. Like journey.ts, this owns its own types and
// imports nothing from the core: content is the bottom of the dependency chain.

export interface EncounterOption {
  id: string;
  label: string;
  hpDelta: number;
  foodDelta: number;
  preparationDelta: number;
  // Gates availability on preparation the player is still CARRYING, and spends
  // none of it. Absent means no requirement. This is what gives holding
  // preparation a value of its own: spend it early and this door is shut later.
  requiresPreparation?: number;
  // Which side of the codex an option sits on. "teaches" is the observation
  // itself: offered only while the species is still unknown, and taking it is
  // what makes it known. "requires" is what that knowledge buys: offered only
  // after. The two share one menu slot, so learning swaps an option in rather
  // than lengthening the list. Absent means the option is always offered.
  codex?: "teaches" | "requires";
  resultText: string;
}

export interface Encounter {
  id: string;
  title: string;
  description: string;
  // What watching this animal taught, in the traveler's own words. Shown on the
  // encounter screen once it is known, and carried in the run's field notes.
  // One per encounter, because knowledge is tracked per encounter id.
  fieldNote: string;
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
    fieldNote:
      "A marsh boar goes where its nose goes, and it never looks up. Give it something better to smell and it takes itself off the road.",
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
      {
        id: "watch-from-the-reeds",
        label: "Settle in the reeds and watch how it works the ford",
        hpDelta: -1,
        foodDelta: -1,
        preparationDelta: 0,
        codex: "teaches",
        resultText:
          "The afternoon goes, and a meal with it, and you come out of the reeds scratched to the elbow. But you watch it work the shallows the whole time, and it never once lifts its head to look at anything. It goes where its nose goes.",
      },
      {
        id: "bait-a-trace",
        label: "Lay a trace of scent and walk through behind it",
        hpDelta: 0,
        foodDelta: 0,
        preparationDelta: 0,
        requiresPreparation: 1,
        codex: "requires",
        resultText:
          "Knowing what leads it, you do not have to spend the bundle — a smear on a reed stem upwind is enough to turn it. It follows its nose off the crossing without hurrying, and you walk through behind it with your kit still full.",
      },
    ],
  },
  {
    id: "pine-shadows",
    title: "Gray Shapes Between the Pines",
    description:
      "Two lean gray shapes keep pace with you just off the road. When you stop, they stop. One lifts its nose and tests the air for a long moment.",
    fieldNote:
      "Wolves are not weighing whether they can take you. They are weighing whether you are worth an evening, and they read what you carry to decide it. Look equipped and they will usually go and be hungry somewhere else.",
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
      {
        id: "show-your-kit",
        label: "Stand your ground and let them see your kit",
        hpDelta: 0,
        foodDelta: 0,
        preparationDelta: 0,
        requiresPreparation: 2,
        // Gated on knowledge because, offered from a first meeting, this
        // answered the wolves for free on almost every line that held the kit —
        // which left `light-torch` and `share-food` almost never worth taking.
        // Knowledge is what buys standing your ground now.
        codex: "requires",
        resultText:
          "The nearer one reads the torches at your belt, the bait bundle, the way you do not run. It decides you are more trouble than the evening is worth. Both drift back into the pines without hurrying.",
      },
      {
        id: "read-the-pack",
        label: "Keep pace with them and watch what they do",
        hpDelta: -2,
        foodDelta: -1,
        preparationDelta: 0,
        codex: "teaches",
        resultText:
          "You match them for the better part of an hour, throwing scraps to hold their interest, and one comes in close enough to open your forearm before drifting off. But you see it now. They are not working out whether they can take you. They are working out whether you are worth the evening, and they read your hands and your belt to decide it.",
      },
    ],
  },
  {
    id: "bee-hollow",
    title: "A Humming Hollow",
    description:
      "A split oak beside the road hums like a struck fence post. Dark comb glistens in the crack, and the air around it is thick with slow, heavy bees.",
    fieldNote:
      "The pale comb at a hollow's mouth is this season's, and heavily guarded. The dark comb sits deep, capped and finished, and barely watched at all.",
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
        preparationDelta: 1,
        resultText:
          "You leave the bees their comb. The oak's dead side gives up an armful of dry punk-wood instead — slow tinder, easy to light. You mark the tree in your memory and walk on.",
      },
      {
        id: "watch-the-flight-line",
        label: "Take nothing, and watch where the bees go instead",
        hpDelta: 0,
        foodDelta: 0,
        preparationDelta: 0,
        codex: "teaches",
        resultText:
          "You give the afternoon to the bees rather than the comb, following them in and out until the shape of the hollow makes sense. The pale comb at the mouth is this season's, still being built, and thick with guards. The dark comb sits deep, capped and finished, and almost nobody is watching it.",
      },
      {
        id: "work-the-deep-seam",
        label: "Go straight for the dark seam at the back",
        hpDelta: 0,
        foodDelta: 2,
        preparationDelta: 0,
        codex: "requires",
        resultText:
          "You go in where you know they are not: past the bright new comb at the mouth, along the seam to the old capped stuff at the back. Two fists of it, and no tinder spent — you were never where the guards were.",
      },
    ],
  },
];
