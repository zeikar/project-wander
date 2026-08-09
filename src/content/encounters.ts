// Authored encounter content. Like journey.ts, this owns its own types and
// imports nothing from the core: content is the bottom of the dependency chain.
// `Weather` is the one exception — imported from `./weather`, another content
// module, so this stays a content-to-content edge rather than reaching into
// core.
import type { Weather } from "./weather";

export interface EncounterOption {
  id: string;
  label: string;
  hpDelta: number;
  foodDelta: number;
  preparationDelta: number;
  // Gates availability on preparation the player is still CARRYING, and spends
  // none of it. Absent means no requirement. This is what gives holding
  // preparation a value of its own: spend it early and this door is shut later.
  requiresPreparation?: number;
  // Which side of the codex an option sits on. "teaches" is the observation
  // itself: offered only while the species is still unknown, and taking it is
  // what makes it known. "requires" is what that knowledge buys: offered only
  // after. The two share one menu slot, so learning swaps an option in rather
  // than lengthening the list. Absent means the option is always offered.
  codex?: "teaches" | "requires";
  resultText: string;
  // Rain or wind can close an option outright — its physics simply do not work
  // under that sky. The set here has to match the AUTHORING RULE comment in
  // content/weather.ts exactly: that comment is what the sky's own prose line
  // promises the player, and a mismatch would make the line lie. `reason` is
  // the prose the closed button itself shows.
  closedIn?: { weather: Exclude<Weather, "clear">; reason: string };
  // Rain or wind can reprice an option instead of closing it outright. `hpDelta`
  // and `foodDelta` here REPLACE the clear-sky figure — they are not added to
  // it — and `resultText` must be overridden whenever the clear-sky prose would
  // contradict the new number (see `reach-in`: a "constellation of stings"
  // cannot survive becoming a single sting).
  weatherDeltas?: {
    weather: Exclude<Weather, "clear">;
    hpDelta?: number;
    foodDelta?: number;
    resultText?: string;
  };
}

// An ANIMAL, as the codex knows it. Split out from the encounter because a
// species can be met in more than one situation and what you learned about it
// does not reset when the situation changes.
// Measured reason: 76.3% of runs meet a species twice, and before this the
// second meeting was byte-identical to the first — same options, same numbers,
// same prose. The road was drawing which SKIN you saw rather than which problem
// you solved. One species carries variants now, as a trial.
export interface Species {
  id: string;
  // What the codex calls it, which is not any one situation's title.
  name: string;
  // What watching this animal taught, in the traveler's own words. One per
  // SPECIES: the lesson is about the animal, so meeting it in a new situation
  // must not offer to teach it again.
  fieldNote: string;
}

export const speciesList: readonly Species[] = [
  {
    id: "boar",
    name: "Marsh Boar",
    fieldNote:
      "A marsh boar goes where its nose goes, and it never looks up. Give it something better to smell and it takes itself off the road.",
  },
  {
    id: "wolves",
    name: "Gray Wolves",
    fieldNote:
      "Wolves are not weighing whether they can take you. They are weighing whether you are worth an evening, and they read what you carry to decide it. Look equipped and they will usually go and be hungry somewhere else.",
  },
  {
    id: "bees",
    name: "Wild Bees",
    fieldNote:
      "The pale comb at a hollow's mouth is this season's, and heavily guarded. The dark comb sits deep, capped and finished, and barely watched at all.",
  },
  {
    id: "waxwings",
    name: "Waxwing Flock",
    fieldNote:
      "A flock strips a rowan from the sunlit side, where the fruit reddens first. Whatever hangs in the shade ripens later and is still hanging when they have finished, with nobody left to argue about it.",
  },
  {
    id: "red-deer",
    name: "Red Stag",
    fieldNote:
      "A stag in the rut is not hunting you, he is moving you. He drives downhill, away from the ground he is holding. Step up rather than back and you stop being a rival at all.",
  },
];

// A SITUATION the road can put in front of the traveler. Several may belong to
// one species; the reducer picks the species first and the situation second, so
// adding variants to one animal does not make that animal commoner.
export interface Encounter {
  id: string;
  // Which animal this is. The codex is keyed on THIS, not on `id`.
  speciesId: string;
  title: string;
  description: string;
  options: readonly EncounterOption[];
}

// The animals are animals: they are hungry, territorial or busy, never
// villains, and every one of them can be answered without a fight.
export const encounters: readonly Encounter[] = [
  {
    id: "ford-boar",
    speciesId: "boar",
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
  {
    id: "sow-and-litter",
    speciesId: "boar",
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
  // The fourth animal is a SECOND FOOD SOURCE, and that is not flavour. A sweep
  // that added two cost-shaped animals cut the bee hollow's share of encounters
  // from a third to a fifth and pushed the seeds where death is unavoidable from
  // 2.7% to 8.0%. A longer road needs another way to eat.
  {
    id: "rowan-flock",
    speciesId: "waxwings",
    title: "A Flock in the Rowan",
    description:
      "A rowan by the road is loud with waxwings, forty or fifty of them working the berries in a rolling scrum. They take no notice of you at all. The ground underneath is scattered with what they have dropped.",
    options: [
      {
        id: "shake-the-bough",
        label: "Climb up and shake the laden bough",
        // Deepened from -2 so that the knowledge answer beside it is VISIBLY
        // cheaper. At -2 both wore "a little blood" — the band covers 1 and 2
        // alike — so `work-the-shaded-side` at -1 read as the same price for
        // the same food and was taken 0.0% of the time. A discount the label
        // cannot show is not a discount.
        hpDelta: -3,
        foodDelta: 2,
        preparationDelta: 0,
        resultText:
          "The flock goes up around you like thrown gravel. You come down with two double handfuls of berries and a long strip of bark taken out of your forearm.",
      },
      {
        id: "net-the-fall",
        label: "Spread your cloth below and shake it down",
        hpDelta: 0,
        foodDelta: 2,
        preparationDelta: -1,
        resultText:
          "Your groundsheet catches nearly everything that falls. It does not come out of the business clean, and you leave it behind stained through.",
        // Named in the AUTHORING RULE comment in content/weather.ts: wind closes
        // every SPREAD-CLOTH option, this one included — a groundsheet will not
        // stay put to catch anything.
        closedIn: {
          weather: "wind",
          reason: "nothing spread out would stay put in this wind",
        },
      },
      {
        id: "take-the-windfall",
        label: "Gather what has already fallen",
        hpDelta: 0,
        foodDelta: 1,
        preparationDelta: 0,
        resultText:
          "Bruised, some of it walked on by the birds, but it is food and it costs you nothing but stooping.",
        // Repriced rather than closed: the wind that ruins a spread groundsheet
        // is the same wind that knocks down twice the usual windfall, so the
        // clear-sky prose ("some of it walked on by the birds") has to change
        // along with the number, or it would understate what a night of wind
        // actually leaves on the ground.
        weatherDeltas: {
          weather: "wind",
          foodDelta: 2,
          resultText:
            "The wind has stripped the bough bare overnight; there is twice the usual scatter on the ground, and it costs you nothing but stooping.",
        },
      },
      {
        id: "watch-which-side",
        label: "Sit down and watch how the flock works the tree",
        hpDelta: 0,
        foodDelta: 0,
        preparationDelta: 0,
        codex: "teaches",
        resultText:
          "You give the tree an hour instead of a handful. They are not working it at random: they start where the sun has been longest and the berries have gone deepest red, and they leave the shaded side alone entirely. It is not ready yet. It will be.",
      },
      {
        id: "work-the-shaded-side",
        label: "Go round to the shaded side and pick there",
        // Priced from 0, same reason as the stag's `step-uphill`: 100.0% of its
        // offers while free. Now it trades a scratch against `take-the-windfall`
        // costing nothing for less, and against `net-the-fall` paying in kit.
        hpDelta: -1,
        foodDelta: 2,
        preparationDelta: 0,
        codex: "requires",
        resultText:
          "You walk round to the north face, where the flock has not started and will not for days, and pick standing up with both hands. Nothing shaken and nothing spread — only the thorns of the hedge you pushed through to reach it.",
      },
    ],
  },
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
