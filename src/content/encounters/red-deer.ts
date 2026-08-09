// The red stag, and the one situation the road can put him in.
import type { Encounter, Species } from "./types";

export const redDeer: Species = {
  id: "red-deer",
  name: "Red Stag",
  fieldNote:
    "A stag in the rut is not hunting you, he is moving you. He drives downhill, away from the ground he is holding. Step up rather than back and you stop being a rival at all.",
};

export const redDeerEncounters: readonly Encounter[] = [
  // The fifth answers to SPACE, which neither of the other cost animals does:
  // the boar goes where its nose goes and the wolves read what you carry.
  {
    id: "rut-stag",
    speciesId: "red-deer",
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
];
