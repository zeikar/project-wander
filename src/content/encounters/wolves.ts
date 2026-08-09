// The gray wolves, and the one situation the road can put them in.
import type { Encounter, Species } from "./types";

export const wolves: Species = {
  id: "wolves",
  name: "Gray Wolves",
  fieldNote:
    "Wolves are not weighing whether they can take you. They are weighing whether you are worth an evening, and they read what you carry to decide it. Look equipped and they will usually go and be hungry somewhere else.",
};

export const wolvesEncounters: readonly Encounter[] = [
  {
    id: "pine-shadows",
    speciesId: "wolves",
    title: "Gray Shapes Between the Pines",
    description:
      "Two lean gray shapes keep pace with you just off the road. When you stop, they stop. One lifts its nose and tests the air for a long moment.",
    options: [
      {
        id: "walk-on",
        label: "Keep walking and do not run",
        // Lowered from -4, for the reason given on the boar's `wade-past`: with
        // nothing in the pack this is the wolves' only answer. At the toll's
        // current value of 3 it lands exactly on `HUNGRY_TRAVEL_HP_LOSS` and so
        // reads as the middle band, plain "blood" — which is why it is worth
        // knowing that retuning the toll alone would move this wound into a
        // different band without touching its number. It shares that band with
        // the hollow's `reach-in`; the band is a reference point, not a
        // fingerprint.
        hpDelta: -3,
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
        // Lowered from 2 when the road went to eight legs. This was the only
        // `requires` option in the game asking for two preparation HELD, and a
        // longer walk spends preparation, so the payoff was simply not on the
        // table often enough to be worth learning: it was offered 59 times
        // across 300 seeds, and `read-the-pack` — the price of that knowledge —
        // sat at 10.3% of its offers, barely over the line at which this
        // project calls an option decoration. At 1 it is offered 130 times and
        // `read-the-pack` reaches 19.0%. Not lowered to 0, which measured
        // better still at 20.4%: `requiresPreparation` would then have exactly
        // one consumer left, which is the state a playtest already found
        // registers with nobody — and the label promises a kit to show.
        requiresPreparation: 1,
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
];
