// The gray wolves, and the two situations the road can put them in.
import type { Encounter, Species } from "./types";

export const wolves: Species = {
  id: "wolves",
  name: "Gray Wolves",
  // Two rungs. The second is what the kill's observation already said and the
  // pines' could not: the first note explains what they are weighing you
  // against when they have nothing, and this one what happens to that sum when
  // they already have their evening.
  fieldNotes: [
    "Wolves are not weighing whether they can take you. They are weighing whether you are worth an evening, and they read what you carry to decide it. Look equipped and they will usually go and be hungry somewhere else.",
    "A pack that has already eaten prices you against what it is standing on, not against its hunger, and the sum is nearly always no. What changes their minds is being crept up on, because creeping is what a thing worth chasing does. Go at them openly and they give ground.",
  ],
};

export const wolvesEncounters: readonly Encounter[] = [
  {
    id: "pine-shadows",
    speciesId: "wolves",
    codexLayer: 1,
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
  // A second way to meet them, and it is deliberately the OPPOSITE shape to the
  // pines. There, they are deciding about you and every answer is a price paid
  // to be left alone. Here they are busy with something else, nothing is in your
  // way, and the question is how much you want off a carcass that is not yours.
  //
  // The free answer FEEDS you. That is the point, and it is aimed at a defect
  // this project has measured repeatedly: the pines, the ford and the hollow all
  // corner a traveler with an empty pack into the worst wound on their menu, so
  // the scenes punish being poor hardest at the moment being poor is already
  // costing the most. `wait-out-the-feed` costs nothing, is open in every sky,
  // and pays — so the poorest traveler meeting this scene is the one it helps
  // most. No entry in `FORCED_WOUNDS`, because nothing here is forced.
  //
  // It also gives the wolves their first weather interaction: until now rain and
  // wind touched the boar, the bees, the rowan and the stag, and this animal
  // played identically under every sky.
  //
  // It is also the wolves' SECOND rung, and its own observation is the evidence
  // — "they are pricing you against what they have already got" is a different
  // fact from the pines' "they read what you carry", and it is only readable
  // where they have something. Met at depth 0 the observation is on the menu
  // and LOCKED: the traveler can see there is a reckoning going on here that
  // they cannot follow yet, which is the point of showing it rather than
  // teaching the ladder out of order.
  {
    id: "wolves-at-a-kill",
    speciesId: "wolves",
    codexLayer: 2,
    title: "A Kill Off the Road",
    description:
      "Forty yards off the road the gorse is moving, and the sound coming out of it is wet and businesslike. The pack has pulled down a young hind and is working on her. Not one of them has looked up since you stopped, and nothing here is between you and where you are going.",
    options: [
      {
        id: "wait-out-the-feed",
        label: "Sit up on the bank and wait for what they leave",
        // The free rescue for this scene, and it PAYS rather than merely costing
        // nothing — which is the whole reason the scene exists. The rowan's
        // `take-the-windfall` also feeds an empty pack; what is different here
        // is the company it keeps, since every other answer on this menu is a
        // wound or a spend. Pinned in content.test.ts, because the generic
        // rescue invariant only requires an option that costs nothing.
        // Nothing dominates it into decoration: it is the CHEAP take, and the
        // three answers beside it all buy more for a currency it does not spend.
        hpDelta: 0,
        foodDelta: 1,
        preparationDelta: 0,
        // Says nothing about eating your own supplies while you wait: this is
        // the answer a traveler at food 0 is meant to take, and prose that
        // assumes a pack with something in it would describe an impossible
        // afternoon in exactly its most important case.
        resultText:
          "You get up on the bank, where nothing can come at you without crossing open ground, and give them the evening. They go off heavy and unhurried before the light does, and there is more left on her than you expected — a night's worth off the shank, if you are not particular about it.",
      },
      {
        id: "go-in-while-they-feed",
        label: "Walk in now and cut away what you can carry",
        // Same band as the pines' `walk-on`, and on purpose: this species wounds
        // at one depth, so a player who has paid it once can price it here
        // without being taught again.
        hpDelta: -3,
        foodDelta: 2,
        preparationDelta: 0,
        resultText:
          "You get your hands on a hindquarter and most of it away with you. They do not give it up quietly, and one has your calf open before the rest decide you are not worth the argument.",
      },
      {
        id: "smoke-them-off-the-kill",
        label: "Put your tinder up and smoke them off her",
        hpDelta: 0,
        foodDelta: 2,
        preparationDelta: -1,
        resultText:
          "A smoulder of your tinder in the gorse upwind, and they are up and off her inside a minute — not frightened, only unwilling to eat in smoke. You take what you want at your own pace and leave them the rest of her.",
        // Named in the AUTHORING RULE comment in content/weather.ts: rain closes
        // every TINDER option, this one included.
        closedIn: { weather: "rain", reason: "no tinder will smoke in this rain" },
      },
      {
        id: "watch-how-they-divide-it",
        label: "Take nothing, and watch how they share her out",
        // Free of hp and food, unlike the pines' `read-the-pack`, for the reason
        // the wallow is cheaper to study than the ford: they are occupied here
        // and watching costs no skin. It is still not free in the sense that
        // matters — `wait-out-the-feed` strictly beats it in every sky, which is
        // the domination `content.test.ts` requires so that knowledge is paid
        // for in something.
        hpDelta: 0,
        foodDelta: 0,
        preparationDelta: 0,
        codex: "teaches",
        resultText:
          "You take nothing and give them the hour instead. It is not a scramble. The big one eats and the rest wait, and the ones waiting spend the whole of it looking at each other and at you — not at your face, at your hands and your belt. They are not asking whether they could take you. They are pricing you against what they have already got.",
      },
      {
        id: "take-a-share-openly",
        label: "Walk in openly and take a share",
        // Knowledge buys a band off `go-in-while-they-feed` for the same food,
        // which is a discount the label can actually show. Against the other
        // two it trades a different currency — blood where they cost kit, or
        // blood where they cost nothing but pay less.
        //
        // Deliberately NOT gated on `requiresPreparation`, unlike the pines'
        // `show-your-kit`, and the prose is written to earn that. An earlier
        // draft had the traveler walk in "with the torches on your belt where
        // they can be seen" — which promised equipment a traveler at
        // preparation 0 does not have, in a scene whose whole purpose is that
        // an empty pack is not punished here. What the knowledge buys at a
        // kill is knowing they are ALREADY fed, so the only question left is
        // whether you are worth getting up for; carrying yourself like trouble
        // settles that, and it costs nothing to carry.
        hpDelta: -1,
        foodDelta: 2,
        preparationDelta: 0,
        codex: "requires",
        resultText:
          "Knowing what they are actually weighing, you do not creep — creeping is what a thing worth chasing does. They have their evening already, and the only question left for them is whether you are worth getting up for. You walk in on her straight and at your own pace, and they give ground before you reach her. One takes a pass at your hand on the way out, more for the record than for anything else, and you leave with as much as you can carry.",
      },
    ],
  },
];
