// The waxwing flock, and the two situations the road can put it in.
import type { Encounter, Species } from "./types";

export const waxwings: Species = {
  id: "waxwings",
  name: "Waxwing Flock",
  // ONE rung, deliberately, and the only species that stops at one. Names no
  // particular tree, for the reason given on the bees' notes: this is what the
  // codex shows whether the flock was watched in a rowan or along a thorn
  // hedge.
  //
  // A second note was refused rather than overlooked, and for the reason
  // recorded below this: the two situations pose the same lesson twice, so a
  // deeper note here would have to be written about a scene that already says
  // everything it has to say. It would change no readable decision, and it
  // would put `work-the-shaded-foot` behind a rung whose lesson the first note
  // already teaches — a tollbooth wearing knowledge's name. The ladder is as
  // deep as the content honestly is, per species, and this animal is one deep.
  fieldNotes: [
    "A flock works the sunlit face first, where the fruit reddens soonest. Whatever hangs in the shade ripens later and is still hanging when they have finished, with nobody left to argue about it.",
  ],
};

export const waxwingsEncounters: readonly Encounter[] = [
  // The fourth animal is a SECOND FOOD SOURCE, and that is not flavour. A sweep
  // that added two cost-shaped animals cut the bee hollow's share of encounters
  // from a third to a fifth and pushed the seeds where death is unavoidable from
  // 2.7% to 8.0%. A longer road needs another way to eat.
  {
    id: "rowan-flock",
    speciesId: "waxwings",
    codexLayer: 1,
    title: "A Flock in the Rowan",
    description:
      "A rowan by the road is loud with waxwings, forty or fifty of them working the berries in a rolling scrum. They take no notice of you at all. The ground underneath is scattered with what they have dropped.",
    options: [
      {
        id: "shake-the-bough",
        label: "Climb up and shake the laden bough",
        // Deepened from -2 so that the knowledge answer beside it is VISIBLY
        // cheaper. At -2 both wore "a little blood" — the band covers 1 and 2
        // alike — so `work-the-shaded-side` at -1 read as the same price for
        // the same food and was taken 0.0% of the time. A discount the label
        // cannot show is not a discount.
        hpDelta: -3,
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
        // Named in the AUTHORING RULE comment in content/weather.ts: wind closes
        // every SPREAD-CLOTH option, this one included — a groundsheet will not
        // stay put to catch anything.
        closedIn: {
          weather: "wind",
          reason: "nothing spread out would stay put in this wind",
        },
      },
      {
        id: "take-the-windfall",
        label: "Gather what has already fallen",
        hpDelta: 0,
        foodDelta: 1,
        preparationDelta: 0,
        resultText:
          "Bruised, some of it walked on by the birds, but it is food and it costs you nothing but stooping.",
        // Repriced rather than closed: the wind that ruins a spread groundsheet
        // is the same wind that knocks down twice the usual windfall, so the
        // clear-sky prose ("some of it walked on by the birds") has to change
        // along with the number, or it would understate what a night of wind
        // actually leaves on the ground.
        weatherDeltas: {
          weather: "wind",
          foodDelta: 2,
          resultText:
            "The wind has stripped the bough bare overnight; there is twice the usual scatter on the ground, and it costs you nothing but stooping.",
        },
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
        // Priced from 0, same reason as the stag's `step-uphill`: 100.0% of its
        // offers while free. Now it trades a scratch against `take-the-windfall`
        // costing nothing for less, and against `net-the-fall` paying in kit.
        hpDelta: -1,
        foodDelta: 2,
        preparationDelta: 0,
        codex: "requires",
        resultText:
          "You walk round to the north face, where the flock has not started and will not for days, and pick standing up with both hands. Nothing shaken and nothing spread — only the thorns of the hedge you pushed through to reach it.",
      },
    ],
  },
  // One more, and only one. A third was designed and thrown away: with the
  // rowan and this hedge both covered, every further idea was either this scene
  // with different words or a decision the mechanics cannot hold. The food
  // target does not need a third either — the share of encounters that can feed
  // a traveler is an average of per-species RATIOS, and two-of-two is the same
  // number as three-of-three. See the note in bees.ts.
  //
  // Both waxwing situations feed you, which is the point of the species: it is
  // the second food source, and an eight-leg road runs on food.
  {
    id: "thorn-hedge-flock",
    speciesId: "waxwings",
    // Rung 1, like the rowan, because it teaches the same lesson the rowan
    // does — which is exactly why the species stops one deep. See the note on
    // `waxwings` above.
    codexLayer: 1,
    title: "The Flock Moved On to the Thorn",
    description:
      "The rowans along this stretch have been stripped to the twig and the flock has shifted to a hawthorn hedge running the length of the field — a wall of thorn a man deep, with the haws hanging well inside it and forty birds working the top of it in a rolling scrum. What they knock loose falls into the grass at the foot.",
    options: [
      {
        id: "push-in-for-the-haws",
        label: "Push into the thorn and pick where the birds cannot",
        hpDelta: -3,
        foodDelta: 2,
        preparationDelta: 0,
        resultText:
          "You get in as far as your shoulders, which is far enough, and come out with two handfuls and a good deal less skin than you went in with. The hedge keeps most of one sleeve as well.",
      },
      {
        id: "beat-the-hedge-over-your-sheet",
        label: "Spread your groundsheet at the foot and beat the top",
        hpDelta: 0,
        foodDelta: 2,
        preparationDelta: -1,
        resultText:
          "You lay the sheet along the bottom of the hedge and go at the crown of it with a fence rail. Nearly everything that comes loose comes down on the cloth. The thorn has the sheet in ribbons by the time you are done, and you leave it where it lies.",
        // Named in the AUTHORING RULE comment in content/weather.ts: wind closes
        // every SPREAD-CLOTH option — the same groundsheet as `net-the-fall`,
        // and a hedge foot is no better a place to keep it lying flat.
        closedIn: {
          weather: "wind",
          reason: "nothing spread out would stay put in this wind",
        },
      },
      {
        id: "take-what-drops-below",
        label: "Work the grass under them for what falls",
        // The free rescue, and it pays — the same shape as the rowan's
        // `take-the-windfall`, because forty birds in a hedge are a reliable
        // way to get fruit onto the ground.
        hpDelta: 0,
        foodDelta: 1,
        preparationDelta: 0,
        resultText:
          "Forty birds working a hedge drop a great deal of what they pick up. It is bruised, and some of it has been stood on, and it is food, and it costs you nothing but bending down.",
        // Repriced under wind for the same physics as `take-the-windfall`, and
        // the sky's own line already promises it: "the wind shakes loose what
        // hung". Haws hang. Shipping this option flat while its twin at the
        // rowan gains from wind would leave that clause true of one hedge-full
        // of fruit and not the other, and the sweep showed the cost of the
        // omission — 6.5% of its offers against 26.7% for the twin, on
        // identical deltas.
        weatherDeltas: {
          weather: "wind",
          foodDelta: 2,
          resultText:
            "A night of this has emptied the crown of the hedge into the grass at its foot, and the birds are working what is left of the top with no interest in the ground at all. You fill both pockets standing up.",
        },
      },
      {
        id: "watch-where-they-start",
        label: "Sit out in the stubble and watch which face they work",
        hpDelta: -1,
        foodDelta: 0,
        preparationDelta: 0,
        codex: "teaches",
        resultText:
          "You give them an hour from the stubble, and open your hand on the thorn once, getting comfortable against it. They are not working the hedge at random. They start along the crown and the south face, where the sun has been longest and the haws have gone deepest red, and they leave the shaded foot of it entirely alone. Not ready yet. It will be.",
      },
      {
        id: "work-the-shaded-foot",
        label: "Go round to the shaded foot and pick there",
        hpDelta: -1,
        foodDelta: 2,
        preparationDelta: 0,
        codex: "requires",
        resultText:
          "You walk round to the north side and work the bottom of the hedge, where the flock has not started and will not for days. Standing up, both hands, nothing shaken and nothing spread — only the thorn itself to argue with.",
      },
    ],
  },
];
