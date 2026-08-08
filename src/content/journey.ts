// Two ways to walk one leg. They meet the SAME animals in the same proportion
// and pay the SAME toll; the only thing a route changes is how likely the leg
// turns something up. That restraint is measured, not modesty: every version
// that also priced the roads differently collapsed into one correct road, taken
// on 74-93% of the nodes where the two disagreed. Charging nothing is what keeps
// both of them worth taking.
// The prose has to keep the same promise the rules do. A route may describe its
// COVER — open, overgrown, in plain sight — but must never imply that it is
// shorter, cheaper, safer to the point of being empty, or a way around a cost.
// There is no such saving, and the odds are the only thing being chosen between.
export interface LegRoute {
  id: string;
  label: string;
  description: string;
  encounterChance: number;
  signs: LegSigns;
}

// What the traveler can read off the ground before choosing. Three signs per
// leg, in that leg's own terrain, because a fork the player cannot read is not
// a decision: measured blind, choosing between two roads was worth 2.7 points
// when the roads said only what they were LIKE, and 17.3 when they said what
// was on them today.
// A sign lives on the ROUTE, not the leg, and that is the second attempt. Held
// at the leg, one line had to fit both ways, and it kept not fitting: "Empty
// both ways" contradicted the other button outright, and the pinewood's signs
// spoke of trunks and pines while sitting on a way described as "Out of the
// trees entirely". Two audits missed cases a reviewer then found. Per route,
// the mismatch cannot be written.
// A CATEGORY and never a species, and NOT because naming the creature would
// break anything — that was the hypothesis, and it was measured and wrong: the
// codex repeat rate held at 71-74% even when the sign named the animal. The
// reason is a plain trade. The kind recovers almost all the value (48.3%
// against 51.7% for the species), and a traveler reading a print in the mud
// knows something came through, not what to call it.
export interface LegSigns {
  animal: string;
  place: string;
  quiet: string;
}

export interface JourneyLeg {
  name: string;
  description: string;
  routes: readonly LegRoute[];
}

// How often a leg offers a fork WHERE ONE IS POSSIBLE. Roughly half of all
// rolls land below both roads' odds, where the two ways would turn up the same
// animal and land in an identical state; `offeredRoutes` refuses to call that a
// fork, so the realized rate is about half of this. 0.75 therefore puts about
// three real forks in an eight-leg journey.
// Every leg forking was the shipped shape, and a playtester stopped reading by
// the eighth turn of their first journey because "the fork resolved to
// 'headland vs hedge-line' with the same safe/risky framing every time" — a
// rhythm, not an event. It costs reach: with readable forks the best blind line
// arrives well on 48.3% of seeds at eight forks and 36.3% at three, against
// 31.0% for the shipped eight unreadable ones.
export const FORK_CHANCE = 0.75;

// The in-world rule behind both numbers, kept identical on every leg so it is
// learnable: open ground turns up less than thick cover.
// Measured over 300 seeds against the unbranched 0.6 road. At 0.5/0.75 neither
// way dominates — the quiet one is uniquely optimal on 13.6% of optimal-line
// travel nodes, the busy one on 10.5%, and the two disagree on 24.2%. Widening
// the gap makes the choice sharper and the journey easier at the same time
// (0.3/0.75 reaches 47.2% decisive but drops the best ending's lockout to
// 17.7%, and starves the wolves' `read-the-pack` down to 6.9%); narrowing it to
// 0.55/0.65 leaves the roads agreeing on 90.1% of nodes.
const QUIET_ROUTE_CHANCE = 0.5;
const BUSY_ROUTE_CHANCE = 0.75;

// How the journey ended, ranked best to worst by the selector in core/arrival.ts.
// These are outcomes, not flavour: the label is what the arrival screen calls the
// run, so leftover supplies and surviving hp both buy something at the gate.
export type ArrivalEndingId = "travelOn" | "limped" | "spent" | "arrived";

export interface ArrivalEnding {
  label: string;
  text: string;
}

export interface Journey {
  start: { hp: number; food: number; preparation: number };
  legs: readonly JourneyLeg[];
  // What finishing a leg costs, said out loud. These two lines are the only
  // place the road's price is ever stated; keeping the wording fixed is what
  // lets a player learn the rate by seeing it repeat.
  road: { fed: string; hungry: string };
  arrival: {
    name: string;
    endings: Record<ArrivalEndingId, ArrivalEnding>;
  };
}

// The one journey for the prototype vertical slice: a short walk from a
// hometown to a neighboring village, worth taking because the world is
// larger than expected, not because of any grand quest.
export const journey: Journey = {
  // hp 14 rather than 20: at 20 a careful traveler was never near a threshold,
  // so no arrival condition could tell good play from lucky play.
  // food 3 rather than 2, for a four-leg walk: at 2, two legs were always walked
  // hungry, which capped a run that found no honey at hp 8 — one short of
  // TRAVEL_ON_HP_MIN. That made the best ending unreachable by ANY line of play
  // on 58.7% of seeds (measured over 300), and nothing on screen distinguished
  // a seed you lost from a seed you were never allowed to win. Three days of
  // food for a four-day road still runs out; it just stops deciding the run
  // before the player does. Lockout, measured exhaustively over 300 seeds, has
  // gone 58.7% -> 29.7% (this change) -> 44.7% (the codex) -> 29.7% (routes).
  // The old 70% no-dominance gate is NOT re-established for the branched game:
  // its best fixed policy was only SEARCHED for, by hill climbing, which bounds
  // the true best from below (33.7%), so a result under 70% proves nothing.
  // What is exhaustive about dominance sits beside the route constants above.
  // food 3 -> 4 when the road doubled to eight legs. Not a difficulty knob but
  // a length one, and it was chosen against a measured tension: starting food
  // moves BOTH the lockout and how survivable the road is, in the same
  // direction. At 3 the best ending was unreachable on 22.7% of seeds and a
  // simple careful line (fill the pack when it runs low, otherwise avoid
  // wounds) arrived alive on 60.3%; at 5 those become 5.0% and 79.0%, but the
  // rowan's `shake-the-bough` falls under 10% of its offers and stops being
  // worth taking. 4 halves the lockout to 13.0%, drops unavoidable death from
  // 1.7% to 0.3%, and leaves every option exactly as healthy as it was at 3.
  // Losing a twenty-minute journey to a seed costs far more than losing a
  // five-minute one, which is what moved this at all.
  start: { hp: 14, food: 4, preparation: 2 },
  legs: [
    {
      name: "The Old Millpond Road",
      description:
        "The road out of town runs past a millpond gone still and green. A heron watches you pass without bothering to fly.",
      routes: [
        {
          id: "towpath",
          label: "Stay on the towpath",
          description:
            "Flat and open, walked bare by the mill's own carts. You would see anything coming a long way off.",
          encounterChance: QUIET_ROUTE_CHANCE,
          signs: {
            animal:
              "Something has come up out of the pond and crossed the path, and not long ago.",
            place:
              "There is a cold fire-ring on the bank further along.",
            quiet:
              "Bare the whole way along it, and the heron does not even look up.",
          },
        },
        {
          id: "reed-beds",
          label: "Cut through the reed beds",
          description:
            "Green and close, and loud with things you cannot see. The heron came here for a reason.",
          encounterChance: BUSY_ROUTE_CHANCE,
          signs: {
            animal:
              "The reeds are pushed flat in a line going in, and nothing has come back out.",
            place:
              "Somebody trod a hollow in the reeds and left it behind them.",
            quiet:
              "Nothing in them but reeds, moving with the water.",
          },
        },
      ],
    },
    {
      name: "Crossroads Waymarker",
      description:
        "A wooden waymarker leans hard to one side, its painted letters faded to guesses. Someone has tied a strip of cloth to it, for luck or for grief.",
      routes: [
        {
          id: "cart-road",
          label: "Take the wide cart road",
          description:
            "Rutted and open to the sky. Whatever else it is, it is used.",
          encounterChance: QUIET_ROUTE_CHANCE,
          signs: {
            animal:
              "There is fresh dung in the ruts, still dark.",
            place:
              "Somebody has stopped on the verge and left a mark on it.",
            quiet:
              "Empty ruts as far as the next rise.",
          },
        },
        {
          id: "drovers-track",
          label: "Follow the old drovers' track",
          description:
            "Half grown over. Nobody has driven cattle up it in years, which does not mean nothing uses it.",
          encounterChance: BUSY_ROUTE_CHANCE,
          signs: {
            animal:
              "The grass down the middle is pressed over, all one way.",
            place:
              "Something is dumped where the track bends, half under the grass.",
            quiet:
              "The grass down the middle stands up unbroken.",
          },
        },
      ],
    },
    {
      name: "The Hedged Furlongs",
      description:
        "The road runs between old strip fields, each one a different green, divided by hedges nobody has laid in a generation. A woman working a bean row straightens up to watch you go by, and does not wave.",
      routes: [
        {
          id: "headland",
          label: "Walk the headland",
          description:
            "Bare ploughed earth along the field's edge, with the whole furlong open beside you.",
          encounterChance: QUIET_ROUTE_CHANCE,
          signs: {
            animal:
              "There are slots pressed into the wet plough ahead.",
            place:
              "There is a heap at the field corner that nobody grew.",
            quiet:
              "Nothing on the bare earth but the woman and her bean row.",
          },
        },
        {
          id: "hedge-line",
          label: "Follow the hedge line",
          description:
            "Blackthorn and hazel grown together into a wall, with a green tunnel running along the foot of it.",
          encounterChance: BUSY_ROUTE_CHANCE,
          signs: {
            animal:
              "A gap has been pushed through the blackthorn, with hair caught on it.",
            place:
              "There is something under the thorn further along that is not thorn.",
            quiet:
              "The tunnel runs on empty, and the thorn is unbroken.",
          },
        },
      ],
    },
    {
      name: "The Ferry Crossing",
      description:
        "An old ferryman rings a small bell to call the boat back from the far bank. Below the crossing the river spreads out wide and shallow, and a footpath runs down to meet it.",
      routes: [
        {
          id: "ferry",
          label: "Take the ferry across",
          description:
            "Open water and a bored old man. Out there you are in plain sight, and so is everything else.",
          encounterChance: QUIET_ROUTE_CHANCE,
          signs: {
            animal:
              "Something is swimming the channel, and the ferryman has stopped to watch it.",
            place:
              "There is a bundle roped to the landing stage that is not the ferryman's.",
            quiet:
              "Flat water, and the ferryman has nothing to say about it.",
          },
        },
        {
          id: "shallows",
          label: "Walk the bank down to the shallows",
          description:
            "Willow scrub the whole way, close enough to touch on both sides. It comes out at the same bank by the same evening, and the scrub is not empty.",
          encounterChance: BUSY_ROUTE_CHANCE,
          signs: {
            animal:
              "The willows are moving down there where there is no wind.",
            place:
              "There is something on the shingle that people put there.",
            quiet:
              "No tracks in the mud at all, the whole way down.",
          },
        },
      ],
    },
    {
      name: "Beckwith Common",
      description:
        "The hedges give out and the land opens into rough common — gorse, thin grass, and a scatter of sheep that belong to somebody. The wind up here has nothing to be stopped by.",
      routes: [
        {
          id: "open-common",
          label: "Cross the open common",
          description:
            "Cropped grass and burnt gorse stumps, and nothing taller than your knee for half a mile.",
          encounterChance: QUIET_ROUTE_CHANCE,
          signs: {
            animal:
              "The sheep have all moved off the short grass to the far side.",
            place:
              "Turf has been cut out of the bank in squares, and stacked.",
            quiet:
              "Short grass and burnt stumps, and nothing standing on it.",
          },
        },
        {
          id: "gorse-brakes",
          label: "Skirt the gorse brakes",
          description:
            "The gorse has gone unburned for years and stands over head height. There are runs through it that you did not make.",
          encounterChance: BUSY_ROUTE_CHANCE,
          signs: {
            animal:
              "One of the runs through the gorse has been opened wider than a sheep.",
            place:
              "There is a trampled space back in the gorse with ash in the middle of it.",
            quiet:
              "The runs are all closed over, and nothing has been through them.",
          },
        },
      ],
    },
    {
      name: "The Charcoal Burners' Ground",
      description:
        "The wood here has been cut and cut again. Black circles mark where the stacks stood, and the ground underfoot is soft with a century of ash. Nobody has burned here this season.",
      routes: [
        {
          id: "burnt-platforms",
          label: "Cross the burnt platforms",
          description:
            "Flat swept circles of black ground, open to the sky and joined end to end.",
          encounterChance: QUIET_ROUTE_CHANCE,
          signs: {
            animal:
              "There are prints crossing the ash, deeper than a man's.",
            place:
              "One of the stack rings has been used since it went cold.",
            quiet:
              "The ash lies unmarked from one ring to the next.",
          },
        },
        {
          id: "coppice-path",
          label: "Take the coppice path",
          description:
            "Hazel cut and regrown a dozen times into a thicket of poles, close enough that you go through it sideways.",
          encounterChance: BUSY_ROUTE_CHANCE,
          signs: {
            animal:
              "Poles are snapped off at chest height where something went through.",
            place:
              "There is a lean of cut poles that did not fall that way on its own.",
            quiet:
              "The poles stand close, and not one of them is broken.",
          },
        },
      ],
    },
    {
      name: "Pinewood Rise",
      description:
        "The path climbs through a thin pine wood where the wind sounds like distant conversation. Somewhere off in the trees, something large moves and then goes quiet.",
      routes: [
        {
          id: "bare-ridge",
          label: "Climb the bare ridge",
          description:
            "Out of the trees entirely, and no steeper for it. Nothing up there has anywhere to stand out of sight.",
          encounterChance: QUIET_ROUTE_CHANCE,
          signs: {
            animal:
              "There is something on the skyline up there that is not a rock.",
            place:
              "There is a wind-shelter of piled stones on the crest.",
            quiet:
              "Bare rock the whole way up, and nothing standing on it.",
          },
        },
        {
          id: "pines",
          label: "Keep to the pines",
          description:
            "Sheltered and close, and quiet the way a room is quiet when someone else is in it.",
          encounterChance: BUSY_ROUTE_CHANCE,
          signs: {
            animal:
              "Bark has been stripped off a pine at shoulder height.",
            place:
              "There is something built between two of the trunks, still standing.",
            quiet:
              "Only the wind, doing what it does in pines.",
          },
        },
      ],
    },
    {
      name: "The Long Descent",
      description:
        "The land tips, and for the first time you can see where you have been going: a valley with smoke standing in it, and somewhere down there a mill wheel you cannot hear yet.",
      routes: [
        {
          id: "drove-road",
          label: "Take the drove road down",
          description:
            "Wide, stony and walled on both sides, dropping the whole way with the valley open below you.",
          encounterChance: QUIET_ROUTE_CHANCE,
          signs: {
            animal:
              "Stones have been knocked off the wall further down, and recently.",
            place:
              "There is a shelter built into the wall where it turns.",
            quiet:
              "You can see a long way down it, and there is nothing on it.",
          },
        },
        {
          id: "hanging-wood",
          label: "Cut down through the hanging wood",
          description:
            "Old oak on a steep slope, holding the mist under it long after the road above has cleared.",
          encounterChance: BUSY_ROUTE_CHANCE,
          signs: {
            animal:
              "Leaf-mould is torn up in a line straight down the slope.",
            place:
              "There is something under the oaks that did not grow there.",
            quiet:
              "Nothing but mist, moving between the trunks.",
          },
        },
      ],
    },
  ],
  road: {
    fed: "A day's walking, and a meal gone from the pack.",
    hungry: "Nothing left in the pack. The miles take it out of you instead.",
  },
  arrival: {
    name: "Alderbrook",
    endings: {
      travelOn: {
        label: "You arrive with road still left in you",
        text: "The mill wheel is still grinding when you walk into Alderbrook, loud over the water. There is weight in your pack yet, and your legs have not finished with you. Sitting down outside the inn, what you find yourself thinking about is not the bed — it is the road going on past the hedge, and where it goes.",
      },
      limped: {
        label: "You arrive barely",
        text: "Alderbrook comes into view a roof at a time, and you count every one of them between rests. By the shrine's chipped bell you sit down harder than you meant to. A woman sorting onions brings you water without being asked, and does not ask anything back.",
      },
      spent: {
        label: "You arrive with nothing left",
        text: "You walk in with a pack that swings light and says nothing when you set it down. The road took the last of the food and the last of the kit somewhere back among the pines. You made it, which turns out to be a different feeling than arriving.",
      },
      arrived: {
        label: "You arrive",
        text: "Alderbrook turns out to be smaller than the stories made it sound: a mill, a shrine with a chipped bell, and a few dozen roofs. A dog barks twice at you and loses interest.",
      },
    },
  },
};
