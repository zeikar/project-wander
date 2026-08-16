// The red stag, and the two situations the road can put him in.
import type { Encounter, Species } from "./types";

export const redDeer: Species = {
  id: "red-deer",
  name: "Red Stag",
  // "Step up" was true of the hollow and of nowhere else; a drove lane between
  // two walls has no up, and that is the whole of what its scene is built on.
  // Neither note names the place it was learned in.
  //
  // Two rungs, and this is the one species whose note was SPLIT rather than
  // extended. It shipped as a single line carrying two facts — that he drives
  // rather than hunts, and that what he is driving you off has an edge — and
  // the second half was never what the hollow taught. The hollow shows a stag
  // pushing one way; only the lane, where being pushed is the way out, shows
  // what the edge is worth. So the line broke along the seam it already had.
  fieldNotes: [
    "A stag in the rut is not hunting you, he is moving you. He drives away from the ground he is holding, and he only ever drives the one way — so the direction he is not pushing you is a direction he has no argument with.",
    "What he is holding has an edge to it, and letting him drive you is a way of reaching it. Give him his way instead of arguing and he takes you to that edge himself, then stops of his own accord — past it you are not a rival any more, and there is always a way out where the ground he is keeping ends.",
  ],
};

export const redDeerEncounters: readonly Encounter[] = [
  // The fifth answers to SPACE, which neither of the other cost animals does:
  // the boar goes where its nose goes and the wolves read what you carry.
  {
    id: "rut-stag",
    speciesId: "red-deer",
    codexLayer: 1,
    title: "A Stag Holding the Hollow",
    description:
      "A red stag stands square in the low ground where the path runs, head up, breathing hard through a throat gone thick with the season. He has not been startled by you. He has been waiting for something to argue with, and you will do.",
    options: [
      {
        id: "push-past",
        label: "Walk straight through and do not look at him",
        // Lowered from -5, for the reason given on the boar's `wade-past`: a
        // destitute traveler who has not learned the stag is offered this and
        // nothing else, so it is a toll rather than a choice.
        hpDelta: -4,
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
        // Named in the AUTHORING RULE comment in content/weather.ts: wind closes
        // every SPREAD-CLOTH option — the same groundsheet trick as
        // `net-the-fall`, and it will not stay spread out any better here.
        closedIn: {
          weather: "wind",
          reason: "nothing spread out would stay put in this wind",
        },
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
        // Priced from 0. Measured at 100.0% of its offers while free: it beat
        // every other answer on every axis at once, so knowing the stag was not
        // an edge, it was an answer key — and that is the thing that collapsed
        // cross-run knowledge to one fixed table matching 300/300 seeds.
        // A scratch is enough. It does not have to be dear, only to cost a
        // DIFFERENT currency from the answers beside it, so that a traveler low
        // on blood and a traveler low on food want different things.
        hpDelta: -1,
        foodDelta: 0,
        preparationDelta: 0,
        codex: "requires",
        resultText:
          "You go up the bank instead of back down the path, which is the one direction he has no argument with. The thorn on the bank takes its own small toll on your hands, and he watches you climb out of his hollow and loses interest somewhere around the third step.",
      },
    ],
  },
  // A second way to meet him. It was AUTHORED on the shape that made
  // `sow-and-litter` worth authoring — the same knowledge, in a place where its
  // obvious use has nowhere to go: the hollow's lesson comes out as "step
  // uphill", and here there is no uphill, only stone on both sides. That
  // reading is history now, and the paragraph below is what replaced it. What
  // the lesson is really about survives the change of ground either way: he is
  // holding something, and a thing being held has an edge to it. In the hollow
  // that edge is above him. In a lane it is at the end of it — and it is that
  // second half, not the change of ground, that turned out to be a rung of its
  // own.
  //
  // The cornered answer costs exactly what the hollow's `push-past` costs, and
  // that is a MEASURED retreat from a nicer idea. It shipped at -3 first, on the
  // reasoning that the walls trapping the traveler also stop him getting a run —
  // a price the player could reason about rather than memorise. The sweep killed
  // it: a meal is worth about the 3 hp a hungry leg costs, so at -3 the wound and
  // the detour cost the same, and `back-down-the-lane` fell to 6.7% of its offers
  // against 28.9-34.9% for the identical answer in the three scenes that price
  // the wound at -4. Making the corner cheaper made a whole option worthless.
  // A scene has to keep its answers a currency apart, and here that costs a
  // pleasing bit of fiction.
  //
  // It is the stag's SECOND rung, and the split of his note is what says so:
  // the hollow shows a stag driving one way, and this scene is the only place
  // that shows what the far side of the driving is for. Met by a traveler who
  // has never watched him, the observation stands on the menu LOCKED — the lane
  // is legibly a scene with something in it, and reading it is what the first
  // rung buys.
  {
    id: "walled-lane-stag",
    speciesId: "red-deer",
    codexLayer: 2,
    title: "A Stag in the Drove Lane",
    description:
      "The lane runs between two drystone walls a cart's width apart, and he is standing in the middle of it with his head down and his breath going like a bellows. There is no bank to climb here and no field to step out into — only stone on both sides, him, and the length of the lane behind him.",
    options: [
      {
        id: "press-along-the-wall",
        label: "Get your shoulder to the wall and force the length of it",
        // Listed in `FORCED_WOUNDS` in content.test.ts, which pins that a
        // traveler holding nothing can still take it. See the note above this
        // encounter for why it is not the -3 it was authored as.
        hpDelta: -4,
        foodDelta: 0,
        preparationDelta: 0,
        resultText:
          "You go along the stones with your back against them, and he comes, and there is nowhere in a lane this width to be that is not in front of him. He puts you into the coping twice, and stands over you the second time until he decides he has made his point.",
      },
      {
        id: "back-down-the-lane",
        label: "Back out the way you came and go round by the field",
        hpDelta: 0,
        foodDelta: -1,
        preparationDelta: 0,
        resultText:
          "You walk backwards until the lane bends, then spend the afternoon going round two sides of a field to reach what the lane would have given you in twenty minutes. You eat on your feet.",
      },
      {
        id: "sheet-over-the-coping",
        label: "Lay your groundsheet over the wall top and go over it",
        hpDelta: 0,
        foodDelta: 0,
        preparationDelta: -1,
        resultText:
          "The coping is loose and edged like a saw, which is what the sheet is for. You go over it, drop into the field, and leave him the lane. The sheet stays where it is, cut through in two places.",
        // Named in the AUTHORING RULE comment in content/weather.ts: wind closes
        // every SPREAD-CLOTH option — the same groundsheet as `wave-your-kit`
        // and `net-the-fall`, and no better at staying put on a wall top.
        closedIn: {
          weather: "wind",
          reason: "nothing spread out would stay put in this wind",
        },
      },
      {
        id: "watch-which-end-he-holds",
        label: "Give him ground and watch how far he takes you",
        // Priced exactly as the hollow's observation, so the species costs one
        // thing to learn wherever it is met.
        hpDelta: -1,
        foodDelta: -1,
        preparationDelta: 0,
        codex: "teaches",
        resultText:
          "You let him work you back down the lane, eating as you go, and he opens your forearm on the coping for being slow about it. But he stops. Forty yards down he simply stops, and turns, and walks back up to the place he was standing in — and you understand he was never chasing you at all. He was pushing you off something, and the something has an edge to it.",
      },
      {
        id: "through-the-stock-gap",
        label: "Let him take you down to the stock gap, and go out through it",
        // Two bands cheaper than being cornered, for the same food and kit.
        // A scratch rather than nothing, on the rule the hollow's `step-uphill`
        // was priced by: knowledge buys an edge, never an answer key.
        hpDelta: -1,
        foodDelta: 0,
        preparationDelta: 0,
        codex: "requires",
        resultText:
          "Knowing there is an edge to what he is holding, you stop fighting the lane and let him have his way with you down the length of it — to the end, where every drove lane has a gap in the wall for getting stock into the field. He loses interest a stride before you reach it. The thorn stuffed into the gap costs you both hands and nothing else.",
      },
    ],
  },
];
