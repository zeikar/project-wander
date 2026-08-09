// The wild bees, and the one situation the road can put them in.
import type { Encounter, Species } from "./types";

export const bees: Species = {
  id: "bees",
  name: "Wild Bees",
  fieldNote:
    "The pale comb at a hollow's mouth is this season's, and heavily guarded. The dark comb sits deep, capped and finished, and barely watched at all.",
};

export const beesEncounters: readonly Encounter[] = [
  {
    id: "bee-hollow",
    speciesId: "bees",
    title: "A Humming Hollow",
    description:
      "A split oak beside the road hums like a struck fence post. Dark comb glistens in the crack, and the air around it is thick with slow, heavy bees.",
    options: [
      {
        id: "reach-in",
        label: "Reach in bare-handed for the comb",
        hpDelta: -3,
        foodDelta: 2,
        preparationDelta: 0,
        resultText:
          "You come away with two fists of dripping comb and a constellation of stings up both arms.",
        // Repriced rather than closed: rain does not stop a bare hand, it slows
        // the bees that would otherwise swarm it. The clear-sky "constellation
        // of stings" would contradict a wound this small, so the line is
        // overridden along with the number — the two have to change together or
        // the result text ends up describing a worse wound than the one paid.
        weatherDeltas: {
          weather: "rain",
          hpDelta: -1,
          resultText:
            "You come away with a fist of dripping comb and one sting for it — the swarm too wet and sluggish to give chase.",
        },
      },
      {
        id: "smoke-them",
        label: "Use your prepared tinder to smoke them calm",
        hpDelta: 0,
        foodDelta: 2,
        preparationDelta: -1,
        resultText:
          "The hum drops to a murmur. You cut the comb free and leave the bees their half.",
        // Named in the AUTHORING RULE comment in content/weather.ts: rain closes
        // every TINDER option, this one included.
        closedIn: { weather: "rain", reason: "no tinder will smoke in this rain" },
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
];
