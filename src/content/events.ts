// Places, not creatures. Like journey.ts and encounters.ts this owns its own
// types and imports nothing: content is the bottom of the dependency chain.
//
// An event fills the stretch of a leg that would otherwise turn up NOTHING.
// That placement is the whole design, and it is measured: mixing places into
// the animal pool would cut the species repeat rate the codex lives on, exactly
// as adding more animals does. Filling the empty stretch instead leaves the
// animal mix untouched.

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

// One authored place for now. It turns up about twice in an eight-leg journey,
// so a second and third are the obvious next content — but one is what was
// measured, and the deltas below are exactly the profile the sweep passed.
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
        hpDelta: 2,
        foodDelta: -1,
        preparationDelta: 0,
        resultText:
          "You eat, and you sleep dry under someone else's roof, and you wake up feeling considerably more like a person. You leave the shelter standing.",
      },
    ],
  },
];
