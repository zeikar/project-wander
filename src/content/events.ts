// Places, not creatures. Like journey.ts and encounters.ts this owns its own
// types and imports nothing: content is the bottom of the dependency chain.
//
// An event fills the stretch of a leg that would otherwise turn up NOTHING.
// That placement is the whole design, and it is measured: mixing places into
// the animal pool would cut the species repeat rate the codex lives on, exactly
// as adding more animals does. Filling the empty stretch instead can only ever
// ADD an animal meeting and never take one away, and it is the never-takes-away
// half the repeat rate needs. It does not leave the animal mix untouched: since
// PAIR_CHANCE a place-band leg may hold an animal beside the place, which walks
// the share of legs holding an animal at all from 0.500 to 0.625 on the quiet
// way and 0.750 to 0.875 on the busy one. Those four figures are closed form —
// the route's own odds plus EVENT_CHANCE x PAIR_CHANCE — not a sample; a sweep
// over 2,000,000 rng states reproduces them, which is evidence that the salts
// do not correlate with the band roll rather than evidence of the rate itself.
// More meetings is not the danger; fewer of them is.

// Deliberately its own type rather than a shared one with encounters. A place
// has no species to learn, so it carries neither `codex` nor `fieldNote`, and
// the two shapes are close enough that a common abstraction would be bigger
// than the duplication it removes. The field NAMES match `EncounterOption` on
// purpose, so the reducer's affordability check reads both.
export interface EventOption {
  id: string;
  label: string;
  hpDelta: number;
  foodDelta: number;
  preparationDelta: number;
  resultText: string;
}

export interface RoadEvent {
  id: string;
  title: string;
  description: string;
  options: readonly EventOption[];
}

// How much of the stretch ABOVE a route's own odds turns up a place instead of
// an empty leg. Measured at 0.25 over 300 seeds, and the value is load-bearing
// in a way that is easy to get wrong: at 0.5 the quiet way never passes empty,
// which erases the busy way's only advantage and drops it from being uniquely
// the right choice on 34.9% of optimal-line travel nodes to 5.3%. At 0.25 a
// high roll gives the quiet way nothing and the busy way a place, so each road
// has something the other does not, and the branch decides the run on 50.9% of
// those nodes rather than 24.2%.
export const EVENT_CHANCE = 0.25;

// How much of the place band ALSO holds an animal. It subdivides EVENT_CHANCE
// rather than the animals' own band, and that side is chosen, not arbitrary:
// a pair drawn out of the ANIMAL band would let the traveler answer the place
// instead of the animal already drawn, which thins the species repeat rate
// the codex lives on (see the note at the top of this file). Drawn out of the
// place band it can only ADD animal meetings.
// 0.5 is a starting value, not a measured one — it puts a pair on about an
// eighth of legs, roughly one a journey, which is enough to measure and small
// enough not to redraw the road. 1.0 was rejected outright: every place would
// have an animal at it, so the lone place stops existing and the PAIRED
// animal draws double against 0.5 — which walks the share of legs holding an
// animal at all from the route's own odds up to those odds plus the whole
// event band (0.5 -> 0.75 on the quiet way, 0.75 -> 1.0 on the busy one).
export const PAIR_CHANCE = 0.5;

// Three places offering the same four trades — take supplies and leave
// something of your own, spend an evening for materials, pay in skin for what
// is out of reach, or stop and sleep — differing in ONE number: how good the
// night is.
//
// That restraint is measured, and four attempts bought it. Giving the places
// real characters kills their own options, because food is the binding resource
// on this road and any place handing over more of it makes its other three
// choices pointless: a cargo worth 3 food was taken on 99.8% of its offers and
// left the cart's other options at 0.9%, 2.9% and 0.4%. Thinning every take
// instead moved the decoration elsewhere (three options under 10%), and
// differentiating the roof as well made it worse (four, one at 0.5%). Only the
// night can vary, because it is the one axis food does not bind — and even
// there hp+1 is never worth a meal, since a meal is worth roughly the 3 hp a
// hungry leg costs. Two is the floor; the camp's three is the whole of the
// difference between these places.
//
// If a place should ever mean something genuinely different, it needs a new
// KIND of trade rather than a bigger one — and that is a change to re-measure.
export const roadEvents: readonly RoadEvent[] = [
  {
    id: "old-camp",
    title: "Someone Else's Camp",
    description:
      "A ring of blackened stones off the road, and a lean-to of pine boughs gone brown. Whoever built it did it well and did not come back for it. A cord still runs up into the branches above, holding something out of reach of the ground.",
    options: [
      {
        id: "trade-the-cache",
        label: "Take what is in the cache, and leave something of yours",
        hpDelta: 0,
        foodDelta: 2,
        preparationDelta: -1,
        resultText:
          "There is meal and dried fruit in a tin under the hearthstone, more than you expected. You take it and leave a coil of your own cord in its place, which is what you would want done.",
      },
      {
        id: "strip-the-lean-to",
        label: "Strip the lean-to for cord and dry tinder",
        hpDelta: 0,
        foodDelta: -1,
        preparationDelta: 1,
        resultText:
          "It takes the evening and a meal to pick the shelter apart properly, but the boughs have kept the underside bone dry, and whoever tied these knots was not in a hurry.",
      },
      {
        id: "cut-down-the-hang",
        label: "Climb for whatever is hanging in the branches",
        hpDelta: -2,
        foodDelta: 2,
        preparationDelta: 0,
        resultText:
          "The bag is hung high and well out from the trunk, which is the point of hanging it. You get it down, and you come down faster than you went up, through most of the lower branches.",
      },
      {
        id: "sleep-under-it",
        label: "Sleep under their lean-to and go on in the morning",
        // Three, where the other two places give two. A lean-to built by
        // someone who knew what they were doing is the best night on the road,
        // and this single number is the only thing distinguishing one place
        // from another. Measured: it lifts this option to 33.1% of its offers
        // against 17.3% for the other two, with nothing else moving.
        hpDelta: 3,
        foodDelta: -1,
        preparationDelta: 0,
        resultText:
          "You eat, and you sleep dry under someone else's roof, and you wake in the morning feeling like a different traveler entirely — the boughs were laid by somebody who had done it a hundred times. You leave the shelter standing.",
      },
    ],
  },
  {
    id: "wrecked-cart",
    title: "A Cart Off the Road",
    description:
      "A two-wheeled cart lies over on its side where the verge gave way, one shaft snapped clean off. The load is still roped under its sheet, and grass has grown up through the spokes since it happened.",
    options: [
      {
        id: "take-the-load",
        label: "Take from the load, and mark it as taken",
        hpDelta: 0,
        foodDelta: 2,
        preparationDelta: -1,
        resultText:
          "Sacked meal, mostly dry where the sheet held. You take two of them and tie a length of your own cord to the shaft where anyone coming back for it will see, which is the whole of the arrangement.",
      },
      {
        id: "cut-the-harness",
        label: "Cut away the harness for leather and rope",
        hpDelta: 0,
        foodDelta: -1,
        preparationDelta: 1,
        resultText:
          "The buckles have seized and it takes the evening and a meal to work them free, but harness leather is harness leather, and there is a great deal of good cord on a cart.",
      },
      {
        id: "lever-the-bed-up",
        label: "Lever the bed up and get at what went under it",
        hpDelta: -2,
        foodDelta: 2,
        preparationDelta: 0,
        resultText:
          "You get a fence rail under the bed and most of it up, and what spilled underneath is still there. The rail goes when your hands do, and the bed comes down across your shins.",
      },
      {
        id: "sleep-in-the-bed",
        label: "Sleep in the cart bed, out of the wet",
        hpDelta: 2,
        foodDelta: -1,
        preparationDelta: 0,
        resultText:
          "The sheet still sheds rain and the bed is a hand above the ground, which turns out to be the difference between a night and a bad night. You eat, and you sleep, and you leave the sheet where it is.",
      },
    ],
  },
  {
    id: "out-of-season-shieling",
    title: "A Shieling Out of Season",
    description:
      "A round stone hut on the slope above the path, roofed with turf that has begun to slip. Whoever brings animals up here will not be back until the grass turns. The door is a slab of stone leaned aside, which is how they left it.",
    options: [
      {
        id: "take-from-the-crock",
        label: "Take what is in the crock, and leave what you can spare",
        hpDelta: 0,
        foodDelta: 2,
        preparationDelta: -1,
        resultText:
          "Oats under a weighted lid, kept for a season that has not come round yet. You take what you need and put your spare tinder in beside them, and lean the lid back the way it was.",
      },
      {
        id: "pull-the-turf",
        label: "Pull dry turf and heather out of the roof",
        hpDelta: 0,
        foodDelta: -1,
        preparationDelta: 1,
        resultText:
          "The underside of a turf roof is the driest thing on a wet hill. It costs you the evening and a meal to work enough of it loose without bringing the rest down, and it will light in any weather.",
      },
      {
        id: "shift-the-hearth-slab",
        label: "Shift the hearth slab and get at the store beneath",
        hpDelta: -2,
        foodDelta: 2,
        preparationDelta: 0,
        resultText:
          "It is a herder's trick and it is not a light stone. You get it walked aside and the store under it is dry and good, and you take the skin off two knuckles putting the slab back.",
      },
      {
        id: "sleep-in-the-shieling",
        label: "Sleep inside with the slab pulled to",
        hpDelta: 2,
        foodDelta: -1,
        preparationDelta: 0,
        resultText:
          "Stone walls, a roof that mostly holds, and a door you can close. You eat, and you get a few hours that are better than none, and in the morning you leave the slab leaned exactly where it was.",
      },
    ],
  },
];
