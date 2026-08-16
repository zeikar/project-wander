// The wild bees, and the three situations the road can put them in.
import type { Encounter, Species } from "./types";

export const bees: Species = {
  id: "bees",
  name: "Wild Bees",
  // Neither note says WHERE the comb is. Knowledge is stored per species, so
  // these are what the codex shows whether the traveler learned them at the
  // split oak, at the wreck of it, or at a straw skep in a garden — and a note
  // naming a hollow would have the codex describe a place they never saw.
  //
  // Two rungs, and the second is the first one's REASON. The wrecked hollow's
  // observation already carried it: knowing where the guards stand is worth a
  // meal, knowing what they are standing over is worth a way past them when
  // there is no meal left to take.
  fieldNotes: [
    "The pale comb is this season's, still being drawn, and there are always bees standing at it doing nothing but standing. The dark comb, capped and finished, sits deepest and is barely watched at all.",
    "What they stand over is never the honey. It is the brood in the new pale comb, and that is what the standing about was always for — so a colony with its honey already taken still holds the pale half and has given up the deep end entirely.",
  ],
};

export const beesEncounters: readonly Encounter[] = [
  {
    id: "bee-hollow",
    speciesId: "bees",
    codexLayer: 1,
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
  // The bees carry three situations and only TWO of them feed you, and that
  // ratio was chosen before a word of this was written rather than discovered
  // afterwards. A species is drawn first and one of its situations second, so
  // the share of encounters that can feed a traveler is the average of those
  // ratios — and the bees and the rowan were the only two animals feeding on
  // every single meeting. Adding situations to them is the largest food lever
  // in the game and it only pulls DOWN. Left at 3-of-3 the road stays where
  // `wolves-at-a-kill` put it (56.7%); at 2-of-3 it comes back to 50.0%, near
  // where the road sat before this run of work, with no need to touch the
  // arrival gate. See docs/CONTENT.md.
  //
  // It SHIPPED as the situation that pays nothing, in the sow-and-litter shape:
  // the same knowledge with its usual use taken away. What the traveler learned
  // from bees was where the guards are and are not — and here the honey is
  // already gone, so knowing it bought passage instead of a meal. That is the
  // authoring reason, kept as history; the paragraph below is what the scene is
  // now, and the two disagree on purpose.
  //
  // It is the bees' SECOND rung, and the observation below is the evidence for
  // that: with the honey gone, what it reports is what the guards were ever
  // for. A traveler who has only ever watched a working hollow knows where they
  // stand and not why, so here the observation is on the menu and LOCKED —
  // visibly more to read than they can read yet.
  {
    id: "robbed-hollow",
    speciesId: "bees",
    codexLayer: 2,
    title: "A Hollow Already Taken",
    description:
      "Something has been at the split oak before you and made no attempt to be quiet about it. The crack is torn wide, pale comb lies about the roots in trodden pieces, and there is not a drop of honey left anywhere in it. The bees are still here, homeless and past reasoning with, and the road runs directly under the tree.",
    options: [
      {
        id: "push-through-the-homeless",
        label: "Put your head down and get past them",
        // The cornered answer, and it is in `FORCED_WOUNDS`. A band under the
        // ford and the lane because a colony with nothing left to defend has
        // no line to hold — they are furious rather than organised.
        hpDelta: -3,
        foodDelta: 0,
        preparationDelta: 0,
        resultText:
          "There is no line to them and nothing they are holding, which is the only reason there is a way through it at all. They come at your head and your hands the whole length of the tree, and your neck and both ears go up like bread.",
      },
      {
        id: "smoke-a-path",
        label: "Burn a little tinder and walk the smoke through ahead of you",
        hpDelta: 0,
        foodDelta: 0,
        preparationDelta: -1,
        resultText:
          "You get a smoulder going in a handful of your tinder and carry it low and in front. They give way to it the way bees have always given way to smoke, and you walk the whole length of the wreck without being touched once.",
        // Named in the AUTHORING RULE comment in content/weather.ts: rain closes
        // every TINDER option, this one included.
        closedIn: { weather: "rain", reason: "no tinder will smoke in this rain" },
      },
      {
        id: "wait-for-them-to-settle",
        label: "Sit it out and go by after dark",
        hpDelta: 0,
        foodDelta: -1,
        preparationDelta: 0,
        resultText:
          "You eat, and you wait out the afternoon at a distance, and at dusk they draw themselves together on what is left of the comb and stop caring about the road entirely. You go under the tree in the last of the light.",
      },
      {
        id: "read-the-wreck",
        label: "Sit down out of reach and work out what they are still standing over",
        hpDelta: -1,
        foodDelta: -1,
        preparationDelta: 0,
        codex: "teaches",
        resultText:
          "You give it an hour from the far side of the ditch, eating cold, and one finds you anyway and gets you just above the eye. But the shape of it comes clear. Whatever robbed this took the dark stuff from the deep end and left the pale comb at the mouth in pieces — and it is the wrecked pale comb they are still crowded on, the new stuff, the stuff with the brood in it. That is what the standing about was ever for. It was never the honey.",
      },
      {
        id: "skirt-what-they-still-hold",
        label: "Go along the side they have given up on",
        hpDelta: -1,
        foodDelta: 0,
        preparationDelta: 0,
        codex: "requires",
        resultText:
          "Knowing what they actually stand over, you can see which half of the wreck has been abandoned: the deep end, emptied and finished with and not worth a guard even now. You go along that side close enough to put a hand on the split, and take one sting on the wrist for the whole crossing.",
      },
    ],
  },
  // The third, and it feeds you — but it makes you choose WHICH resource to
  // take out of one object. The hollow's `leave-it` gestures at that trade; a
  // made thing with a dead half and a live half is the whole of it.
  {
    id: "old-skep",
    speciesId: "bees",
    codexLayer: 1,
    title: "A Skep in a Ruined Garden",
    description:
      "A cottage came down here long enough ago that the garden has gone to seed over the top of it, and on a stone shelf built into the one standing wall there is a straw bee skep. Half of it has collapsed and stands dry and empty. The colony has drawn itself into the other half and is getting on with the season regardless.",
    options: [
      {
        id: "cut-the-comb",
        label: "Cut the comb out of the sound half",
        hpDelta: -3,
        foodDelta: 2,
        preparationDelta: 0,
        resultText:
          "You get both hands into the straw and two good slabs of it out, and they have your wrists and one side of your face before you are back over the garden wall.",
      },
      {
        id: "strip-the-empty-half",
        label: "Pull the dry straw out of the collapsed side",
        // The free rescue, and it pays in the OTHER currency. Nothing here
        // dominates it: the two answers that beat it on food both cost blood or
        // kit, and this costs neither.
        hpDelta: 0,
        foodDelta: 0,
        preparationDelta: 1,
        resultText:
          "The fallen half is old straw and older wax and has been drying under that wall for years, and there is not a bee anywhere in it. It pulls apart in your hands and it is the best tinder you have carried on this road.",
      },
      {
        id: "smoke-the-skep",
        label: "Smoke them down and take your time over it",
        hpDelta: 0,
        foodDelta: 2,
        preparationDelta: -1,
        resultText:
          "A little of your tinder smouldering under the shelf, and the hum goes out of them inside a minute. You cut what you want, set the straw back the way it was standing, and leave them the rest of it.",
        // Named in the AUTHORING RULE comment in content/weather.ts: rain closes
        // every TINDER option, this one included.
        closedIn: { weather: "rain", reason: "no tinder will smoke in this rain" },
      },
      {
        id: "watch-the-mouth",
        label: "Sit on the wall and watch the mouth of it",
        hpDelta: 0,
        foodDelta: 0,
        preparationDelta: 0,
        codex: "teaches",
        resultText:
          "You take nothing and give them the hour instead. All the traffic is at the near end, where the comb shows pale through the straw and is still being drawn, and there are never fewer than three of them standing at that entrance doing nothing whatever but standing. The far end, dark through the weave, has nobody at the door at all.",
      },
      {
        id: "cut-from-the-back",
        label: "Open the back of the skep and cut from the dark end",
        hpDelta: -1,
        foodDelta: 2,
        preparationDelta: 0,
        codex: "requires",
        resultText:
          "You go in at the far end, through the straw, where the comb is capped and finished and nobody has thought to watch it in weeks. Two slabs, and one sting getting your hand back out, and the front of the skep never learns you were there.",
      },
    ],
  },
];
