// The waxwing flock, and the one situation the road can put it in.
import type { Encounter, Species } from "./types";

export const waxwings: Species = {
  id: "waxwings",
  name: "Waxwing Flock",
  fieldNote:
    "A flock strips a rowan from the sunlit side, where the fruit reddens first. Whatever hangs in the shade ripens later and is still hanging when they have finished, with nobody left to argue about it.",
};

export const waxwingsEncounters: readonly Encounter[] = [
  // The fourth animal is a SECOND FOOD SOURCE, and that is not flavour. A sweep
  // that added two cost-shaped animals cut the bee hollow's share of encounters
  // from a third to a fifth and pushed the seeds where death is unavoidable from
  // 2.7% to 8.0%. A longer road needs another way to eat.
  {
    id: "rowan-flock",
    speciesId: "waxwings",
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
];
