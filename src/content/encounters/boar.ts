// The marsh boar, and the three situations the road can put it in. It is the
// one animal carrying variants so far; the trial and its measured reason are
// written above the second situation below.
import type { Encounter, Species } from "./types";

export const boar: Species = {
  id: "boar",
  name: "Marsh Boar",
  // Two rungs. The second was already written into `sow-and-litter`'s
  // observation and was doing nothing there but explaining why the first
  // lesson fails; it is a rung now rather than flavour.
  fieldNotes: [
    "A marsh boar goes where its nose goes, and it never looks up. Give it something better to smell and it takes itself off the road.",
    "A sow with a litter is the one that will not follow her nose, and no bait moves her: she keeps her own body between the young and whatever is coming. Give ground away from the litter rather than away from her, and she walks herself off your way keeping station on them.",
  ],
};

export const boarEncounters: readonly Encounter[] = [
  {
    id: "ford-boar",
    speciesId: "boar",
    codexLayer: 1,
    title: "A Boar in the Ford",
    description:
      "Where the road crosses the stream, a marsh boar stands mid-current ripping at reed roots. Mud steams on its shoulders, and there is no way across that does not pass within arm's reach of it.",
    options: [
      {
        id: "wade-past",
        label: "Wade past it, slow and steady",
        // Lowered from -6. This is the option a traveler with nothing left is
        // FORCED to take: at food 0 and preparation 0 the ford offers exactly
        // one answer, known or not, and `completeLeg` then charges the hungry
        // leg's 3 on top. At -6 that was 9 of a 14-hp pool on a single click
        // nobody chose. Measured over 300 seeds, this option and the stag's and
        // the wolves' were 54.1% of ALL deaths between them, and all three wore
        // the same label — the band cannot separate -4 from -6.
        // Not lowered further, because the bait and the wait cost real
        // resources: this has to stay dear enough that paying them is worth it.
        // That is the reasoning, not a guarantee — no test pins the ordering,
        // so re-measure the two paid answers if this moves again.
        hpDelta: -4,
        foodDelta: 0,
        preparationDelta: 0,
        resultText:
          "It charges halfway across before you are clear, and its shoulder grinds you against the stones. Then it loses interest and goes back to the reeds.",
      },
      {
        id: "scatter-bait",
        label: "Scatter some of your prepared bait downstream",
        hpDelta: 0,
        foodDelta: 0,
        preparationDelta: -1,
        resultText:
          "It follows the smell downstream, unhurried. You cross with dry ankles and a hammering heart.",
        // Named in the AUTHORING RULE comment in content/weather.ts: rain closes
        // every SCENT option, this one included.
        closedIn: { weather: "rain", reason: "the rain has killed every scent" },
      },
      {
        id: "wait-it-out",
        label: "Sit down out of sight and wait it out",
        hpDelta: 0,
        foodDelta: -1,
        preparationDelta: 0,
        resultText:
          "You wait out the afternoon behind a willow, eating to pass the time. Near dusk the boar climbs the far bank and is gone.",
      },
      {
        id: "watch-from-the-reeds",
        label: "Settle in the reeds and watch how it works the ford",
        hpDelta: -1,
        foodDelta: -1,
        preparationDelta: 0,
        codex: "teaches",
        resultText:
          "The afternoon goes, and a meal with it, and you come out of the reeds scratched to the elbow. But you watch it work the shallows the whole time, and it never once lifts its head to look at anything. It goes where its nose goes.",
      },
      {
        id: "bait-a-trace",
        label: "Lay a trace of scent and walk through behind it",
        hpDelta: 0,
        foodDelta: 0,
        preparationDelta: 0,
        requiresPreparation: 1,
        codex: "requires",
        resultText:
          "Knowing what leads it, you do not have to spend the bundle — a smear on a reed stem upwind is enough to turn it. It follows its nose off the crossing without hurrying, and you walk through behind it with your kit still full.",
        // Same physics as `scatter-bait`: this is a scent trick too, and rain
        // kills a scent whether or not the traveler knows to lay one.
        closedIn: { weather: "rain", reason: "the rain has killed every scent" },
      },
    ],
  },
  // Two more ways to meet the same animal. The trial this exists to run: a
  // second meeting used to be the first one again, and 76.3% of runs have one.
  //
  // These are not the ford with different words. The ford CORNERS you — with an
  // empty pack it offers one answer and that answer is the worst it has. The
  // wallow does the opposite and asks whether a risk is worth taking at all,
  // since walking on costs nothing. The sow corners you like the ford but
  // closes the trick that works there: she will not follow her nose off the
  // road, because what she is guarding is behind her.
  {
    id: "wallow-boar",
    speciesId: "boar",
    codexLayer: 1,
    title: "A Boar in the Wallow",
    description:
      "Off the road, down in a churned black hollow, a marsh boar lies on its side in the mud with its eyes shut. It has been rooting: the ground for ten yards around is turned over as though somebody had put a plough through it badly. Nothing here is in your way.",
    options: [
      {
        id: "keep-to-the-road",
        label: "Leave it sleeping and keep to the road",
        hpDelta: 0,
        foodDelta: 0,
        preparationDelta: 0,
        resultText:
          "You go by on the far side of the road, putting your feet down carefully, and it does not so much as open an eye. An hour later you are still listening for it behind you.",
      },
      {
        id: "root-where-it-rooted",
        label: "Go down and take what it has turned up",
        // Deepened from -2 for the reason given on the rowan's
        // `shake-the-bough`: `wait-downwind` has to be readably cheaper than
        // forcing it, and one band has to separate them for that to show.
        hpDelta: -3,
        foodDelta: 2,
        preparationDelta: 0,
        resultText:
          "The turned ground is thick with mast and pignut, and you fill both pockets before it comes awake and up the bank at you. You are over the fence before it reaches you, but not before the thorn hedge has its share of your arms.",
      },
      {
        id: "smoke-it-out-of-the-hollow",
        label: "Use your tinder to smoke it off the wallow",
        hpDelta: 0,
        foodDelta: 2,
        preparationDelta: -1,
        resultText:
          "A damp handful of your tinder on the windward lip is enough. It gets up grumbling and goes, and you have the whole turned hollow to yourself and all the time you want in it.",
        // Named in the AUTHORING RULE comment in content/weather.ts: rain closes
        // every TINDER option, this one included — everything but a pitch torch.
        closedIn: { weather: "rain", reason: "no tinder will smoke in this rain" },
      },
      {
        id: "watch-it-work-the-mud",
        label: "Sit on the bank and watch it sleep",
        // CHEAPER to learn than the ford, which charges a meal AND a scratch
        // for the same lesson — a playtest found the three animals that wound
        // you are exactly the three that charge food to study, so curiosity is
        // priced out precisely when the traveler is poorest, and a safe
        // situation is where an animal should be cheap to learn.
        // Not free, though: `encounters.test.ts` requires some always-offered
        // answer to strictly beat the observation, or knowledge costs nothing
        // and stops being worth having. That rule predates this trial and is
        // measured; `keep-to-the-road` is what it is priced against here.
        hpDelta: 0,
        foodDelta: -1,
        preparationDelta: 0,
        codex: "teaches",
        resultText:
          "You sit on the bank with your arms on your knees and give it an hour. It wakes, roots, moves four feet, roots again — and never once lifts its head to look at anything. It is not watching the world. It is smelling its way across it.",
      },
      {
        id: "wait-downwind",
        label: "Work the hollow from downwind while it sleeps",
        // Priced from 0 on the same measurement as the other two: knowledge
        // must buy an edge, not a free win.
        hpDelta: -1,
        foodDelta: 2,
        preparationDelta: 0,
        codex: "requires",
        resultText:
          "You come at the hollow from below the wind, which is the one direction it has no way of checking. You are ten feet from it, filling your pockets, and it sleeps through all of it — until it does not, and you leave the hollow faster than you entered it.",
        // Named in the AUTHORING RULE comment in content/weather.ts: wind closes
        // this because the trick depends on the traveler working FROM downwind,
        // which a shifting wind does not leave anywhere to stand.
        closedIn: {
          weather: "wind",
          reason: "no downwind worth working from in this wind",
        },
      },
    ],
  },
  // The boar's SECOND rung, and the evidence for that is the observation
  // below: what it reports is not "it goes where its nose goes" again but the
  // one case where that fails, and why. It has always read as the deeper
  // lesson; it is now priced as one.
  // Met at depth 0 this situation shows the observation LOCKED rather than
  // teaching out of order — a traveler who has never watched a boar can see
  // there is more in a sow than they can read, which is the whole reason the
  // rung is visible at all.
  {
    id: "sow-and-litter",
    speciesId: "boar",
    codexLayer: 2,
    title: "A Sow Across the Path",
    description:
      "The sow is standing in the middle of the path and she has seen you first. Behind her, six striped piglets are working the leaf litter, paying attention to nothing. She does not root, and she does not look away.",
    options: [
      {
        id: "push-through-the-thicket",
        label: "Put your head down and go through",
        hpDelta: -4,
        foodDelta: 0,
        preparationDelta: 0,
        resultText:
          "She comes the moment you commit, and she does not bluff the way the boars do. You get through it, and past her, and some way up the path before you sit down to see how bad your leg is.",
      },
      {
        id: "back-out-the-way-you-came",
        label: "Give her the path and go the long way",
        hpDelta: 0,
        foodDelta: -1,
        preparationDelta: 0,
        resultText:
          "You walk backwards until the bend takes her out of sight, then go round by the top of the wood. It costs you the rest of the afternoon and a meal eaten on your feet.",
      },
      {
        id: "thorn-brake-between-you",
        label: "Put your cut brush between you and her",
        hpDelta: 0,
        foodDelta: 0,
        preparationDelta: -1,
        resultText:
          "You drag your bundle of thorn across the path and edge round the outside of it. She watches the brush and not you, which is the whole of the trick, and the bundle stays where it falls.",
      },
      {
        id: "count-the-litter-from-cover",
        label: "Get into cover and watch what she does",
        hpDelta: -1,
        foodDelta: -1,
        preparationDelta: 0,
        codex: "teaches",
        resultText:
          "You spend the afternoon in a holly brake, eating cold, and she opens your hand on the way in when you are slower than she likes. But you see it: she never once puts her nose up to find you. She keeps her body between the path and the litter, and everything she does is downwind of them.",
      },
      {
        id: "step-off-the-piglets-line",
        label: "Move away from the litter, not away from her",
        // Priced from 0, as above.
        hpDelta: -1,
        foodDelta: 0,
        preparationDelta: 0,
        codex: "requires",
        resultText:
          "Knowing what she is actually guarding, you do not back down the path — you step wide, uphill, away from the piglets and not from her. She turns to keep herself between them and you, which walks her off the path. You take the holly brake on the way through, and the path is all you wanted.",
      },
    ],
  },
];
