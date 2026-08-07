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
        // Cheapened from -2 when the road went to eight legs: spreading five
        // species over it made a second wolf meeting rarer, and this
        // observation fell under the 10% of its offers at which this project
        // calls an option decoration. -1 is the FLOOR, not a tuning choice —
        // anything cheaper stops being strictly worse than `share-food`, and
        // that domination is the whole thing keeping knowledge from being free.
        // Current figures live in docs/CONTENT.md; they are not repeated here,
        // because a number in two places is a number that will disagree with
        // itself.
        hpDelta: -1,
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
  // The fourth animal is a SECOND FOOD SOURCE, and that is not flavour. A sweep
  // that added two cost-shaped animals cut the bee hollow's share of encounters
  // from a third to a fifth and pushed the seeds where death is unavoidable from
  // 2.7% to 8.0%. A longer road needs another way to eat.
  {
    id: "rowan-flock",
    title: "A Flock in the Rowan",
    description:
      "A rowan by the road is loud with waxwings, forty or fifty of them working the berries in a rolling scrum. They take no notice of you at all. The ground underneath is scattered with what they have dropped.",
    fieldNote:
      "A flock strips a rowan from the sunlit side, where the fruit reddens first. Whatever hangs in the shade ripens later and is still hanging when they have finished, with nobody left to argue about it.",
    options: [
      {
        id: "shake-the-bough",
        label: "Climb up and shake the laden bough",
        hpDelta: -2,
        foodDelta: 2,
        preparationDelta: 0,
        resultText:
          "The flock goes up around you like thrown gravel. You come down with two double handfuls of berries and a long strip of bark taken out of your forearm.",
      },
      {
        id: "net-the-fall",
        label: "Spread your cloth below and shake it down",
        hpDelta: 0,
        foodDelta: 2,
        preparationDelta: -1,
        resultText:
          "Your groundsheet catches nearly everything that falls. It does not come out of the business clean, and you leave it behind stained through.",
      },
      {
        id: "take-the-windfall",
        label: "Gather what has already fallen",
        hpDelta: 0,
        foodDelta: 1,
        preparationDelta: 0,
        resultText:
          "Bruised, some of it walked on by the birds, but it is food and it costs you nothing but stooping.",
      },
      {
        id: "watch-which-side",
        label: "Sit down and watch how the flock works the tree",
        hpDelta: 0,
        foodDelta: 0,
        preparationDelta: 0,
        codex: "teaches",
        resultText:
          "You give the tree an hour instead of a handful. They are not working it at random: they start where the sun has been longest and the berries have gone deepest red, and they leave the shaded side alone entirely. It is not ready yet. It will be.",
      },
      {
        id: "work-the-shaded-side",
        label: "Go round to the shaded side and pick there",
        hpDelta: 0,
        foodDelta: 2,
        preparationDelta: 0,
        codex: "requires",
        resultText:
          "You walk round to the north face, where the flock has not started and will not for days, and pick standing up with both hands. Nothing shaken, nothing spread, nothing torn.",
      },
    ],
  },
  // The fifth answers to SPACE, which neither of the other cost animals does:
  // the boar goes where its nose goes and the wolves read what you carry.
  {
    id: "rut-stag",
    title: "A Stag Holding the Hollow",
    description:
      "A red stag stands square in the low ground where the path runs, head up, breathing hard through a throat gone thick with the season. He has not been startled by you. He has been waiting for something to argue with, and you will do.",
    fieldNote:
      "A stag in the rut is not hunting you, he is moving you. He drives downhill, away from the ground he is holding. Step up rather than back and you stop being a rival at all.",
    options: [
      {
        id: "push-past",
        label: "Walk straight through and do not look at him",
        hpDelta: -5,
        foodDelta: 0,
        preparationDelta: 0,
        resultText:
          "He comes at the shoulder and you go down in the wet. It is the antler brow that opens your thigh, not the points. When you get up he has already gone back to standing where he was.",
      },
      {
        id: "wave-your-kit",
        label: "Make yourself large with everything you are carrying",
        hpDelta: 0,
        foodDelta: 0,
        preparationDelta: -1,
        resultText:
          "You open your arms with the groundsheet in both hands and become twice your own width. He decides against it. The sheet does not survive the hedge you back into.",
      },
      {
        id: "back-off-and-circle",
        label: "Back off and go the long way round the hollow",
        hpDelta: 0,
        foodDelta: -1,
        preparationDelta: 0,
        resultText:
          "It costs you the rest of the afternoon and a meal eaten walking, but the hollow is behind you and so is he.",
      },
      {
        id: "watch-where-it-drives",
        label: "Let him move you, and watch where he wants you to go",
        hpDelta: -1,
        foodDelta: -1,
        preparationDelta: 0,
        codex: "teaches",
        resultText:
          "You give him ground and let him work, eating as you go, and he takes a strip off your forearm for being slow about it. But he only ever pushes one way. Downhill, every time, out of the hollow and away from it — and the moment you are below him he stops caring where you are.",
      },
      {
        id: "step-uphill",
        label: "Step uphill and let him keep the hollow",
        hpDelta: 0,
        foodDelta: 0,
        preparationDelta: 0,
        codex: "requires",
        resultText:
          "You go up the bank instead of back down the path, which is the one direction he has no argument with. He watches you climb out of his hollow and loses interest somewhere around the third step.",
      },
    ],
  },
];
