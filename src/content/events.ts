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

// Three places, all offering the SAME four trades: take supplies and leave
// something of your own, spend an evening for materials, pay in skin for what
// is out of reach, or stop and sleep. Identical deltas is not laziness — it is
// what lets the fiction vary without any of the measured balance moving, since
// which place a roll picks cannot change a single reachable outcome. Only the
// prose differs, and prose is what "about two discoveries a journey" needed.
// Vary the deltas later if a place should mean something different; that is a
// change to re-measure, not a change to author.
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
          "Stone walls, a roof that mostly holds, and a door you can close. You eat and you sleep properly for once, and in the morning you leave the slab leaned exactly where it was.",
      },
    ],
  },
];
