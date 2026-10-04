import type { Strings } from "./types";

const ORDINALS = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth"];
const suffix = (n: number) => {
  const tens = n % 100;
  if (tens >= 11 && tens <= 13) {
    return "th";
  }
  return ({ 1: "st", 2: "nd", 3: "rd" } as Record<number, string>)[n % 10] ?? "th";
};
const ordinal = (n: number) => ORDINALS[n - 1] ?? `${n}${suffix(n)}`;
const signed = (n: number) => (n > 0 ? `+${n}` : `−${-n}`);

export const en: Strings = {
  meta: { name: "English", htmlLang: "en" },

  ui: {
    title: "Wander",
    premise: "You leave home for one reason: the world is larger than you thought.",
    setOut: "Set out",
    setOutAgain: "Set out again",
    day: (n) => (n === 0 ? "The day you set out" : `Day ${n}`),
    hp: "Health",
    food: "Food",
    whereNext: "Which road next",
    rumors: "Heard before setting out",
    notebook: "Notebook",
    notebookEmpty: "Nothing written yet.",
    unreadable: "What it means is not clear yet.",
    unknownOutcome: "no telling how it will go",
    outcome: (hp, food) => {
      const parts = [
        hp !== 0 ? `health ${signed(hp)}` : "",
        food !== 0 ? `food ${signed(food)}` : "",
      ].filter(Boolean);
      return parts.length > 0 ? parts.join(" · ") : "nothing lost, nothing gained";
    },
    withLesson: (hint) => `${hint} · something for the notebook`,
    withMaybeLesson: (hint) => `${hint} · perhaps something for the notebook`,
    noFood: "not enough food",
    learned: "Noted down",
    fed: "A day's walking, and a meal eaten on the way.",
    hungry: "Nothing to eat. The day's walking has worn you down.",
    diedTitle: "The road ends here",
    diedOf: {
      wounds: "The wounds are deep. You sit down with your back against a tree by the road. You do not get up again.",
      hunger: "You turn the empty pack out again and again. Your steps grow slower and slower, and stop.",
    },
    daysWalked: (n) => `${n} ${n === 1 ? "day" : "days"} on the road.`,
    nthVisit: (n) => `This is your ${ordinal(n)} time here.`,
    learnedThisJourney: "Learned on this journey",
    nothingLearned: "Nothing went into the notebook on this journey.",
    theRoadBehind: "The road behind",
    road: (places) => places.join(" → "),
    stat: (label, value, max) => `${label} ${value}/${max}`,
    mapCaption: (region, village) =>
      `${region}, from ${village} to the far places. The heavy line is the road you have walked.`,
    setOutFrom: "Which village to set out from",
    ways: "Ways known",
    newWay: "A new way",
    onSide: (place, side) =>
      `${place} ${{ left: "on the left", middle: "in the middle", right: "on the right" }[side]}`,
    unknownAnimal: "An animal you do not know yet",
    unknownThing: "Something you do not know yet",
    aPlace: "A place along the way",
    aPerson: "Someone met on the road",
    reading: "Reading",
    language: "Language",
    tomorrow: (sky, wind) => `Tomorrow's sky · ${sky}, ${wind}`,
    today: (sky, wind) => `Today's sky · ${sky}, ${wind}`,
  },

  weather: {
    sky: { clear: "clear", rain: "rain", fog: "fog" },
    wind: { behind: "wind from behind", ahead: "wind from ahead" },
    skyNote: {
      clear: "",
      rain: "In rain, scent does not carry far, and no fire will light.",
      fog: "The fog is thick. No sign can be seen at a distance.",
    },
    windNote: {
      behind: "The wind blows from behind you, onward. Your scent goes ahead of you.",
      ahead: "The wind blows from ahead. Your scent scatters behind you.",
    },
    fogSign: "Hidden in fog.",
  },

  regions: {
    fields: {
      name: "Ashdale Fields",
      village: {
        name: "Ashdale",
        description:
          "A small village of chimney smoke and muddy lanes, and nothing more. To anyone setting out, each villager passes on one thing they have heard.",
      },
      quiet: {
        place: "Track",
        sign: "No sign of anything.",
        lines: [
          "A day with nothing in it. The wind sweeps across the grass.",
          "A road with only birdsong for company.",
          "The shadow of a cloud walks on ahead.",
          "Someone has set a small stone on the cairn by the road. You add another and go on.",
        ],
      },
    },
    marsh: {
      name: "Willow Marsh",
      village: {
        name: "Willow Ferry",
        description:
          "A ferry landing where the causeway meets the reed beds. One flat-bottomed boat and a few reed roofs, and nothing more. To anyone setting out, the ferryman and the reed cutters each pass on one thing they have heard.",
      },
      quiet: {
        place: "Bank",
        sign: "No sign of anything.",
        lines: [
          "A day with nothing in it. The wind lays the reed beds over to one side as it passes.",
          "A road with only the lap of ripples against the bank for company.",
          "Far off beyond the reeds, a bird gives one long call. Then it is quiet again.",
          "A bundle of reeds someone tied and stood up by the causeway has blown over. You stand it up again and go on.",
        ],
      },
      way: "The white stag went back along the far shore of the lake. Where that shore ends and the reeds begin, there is a ferry landing: Willow Ferry. You can set out from there too.",
    },
  },

  species: {
    boar: { name: "Wild boar", more: "There is still more to know about wild boar." },
    wolves: { name: "Wolf", more: "There is still more to know about wolves." },
    deer: { name: "Red deer", more: "There is still more to know about red deer." },
    heron: { name: "Grey heron", more: "There is still more to know about grey herons." },
    otter: { name: "Otter", more: "There is still more to know about otters." },
    lantern: { name: "Marsh lantern", more: "There is still more to know about the marsh lantern." },
  },

  facts: {
    "boar.nose":
      "A boar goes where its nose leads and seldom lifts its head. With its nose down, it will not notice you passing close by. If its nose is up, it has already caught your scent.",
    "boar.sow":
      "A sow with piglets does not go by scent. She always stands between her piglets and you. On the side away from her piglets, she pays you no mind.",
    "wolves.rank":
      "Wolves eat by rank. Once even the smallest has eaten, the meal is over, and a full pack does not give chase.",
    "wolves.chase":
      "Wolves chase what runs. Stand your ground without turning your back, and they only test you, then give up.",
    "deer.drive":
      "A stag in rut drives others only away from the ground he holds. Anything that steps aside uphill does not interest him.",
    "deer.dawn":
      "Deer come down to the water at dawn, walking into the wind. Downwind of them, you go unseen. When the wind blows from your side, they do not come.",
    "heron.wade":
      "Where a heron stands, the water is knee-deep. Cross a flooded road on the heron's side. Water a heron will not step into is deep.",
    "heron.lift":
      "When the herons all lift at once, something is moving in the reeds. While they keep their places, the reed beds are empty.",
    "otter.cache":
      "An otter stores the fish it catches in a hollow under the bank. If a line of bubbles leads away across the water, it has gone; if the water at the hole is cloudy, it is still inside.",
    "otter.raid":
      "At night otters climb onto the mounds and go through any pack set down by a sleeper. A mound scattered with fish bones is one the otters climb every night.",
    "lantern.drift":
      "No one carries the marsh lantern. It does not sway with anyone's step; it glides over the water. Follow it at night and it leads into deep water.",
    "lantern.dawn":
      "At dawn the marsh lanterns settle only on firm ground. Each one soon fades, but join up the places where they have settled and a dry path shows across the water.",
  },

  scenes: {
    "ford-boar": {
      place: "Shore",
      sign: "Muddy water spreads downstream.",
      signKnown: "Muddy water spreads downstream. A boar is digging up the ford.",
      title: "The boar at the ford",
      description:
        "Where the road crosses a stream, a boar stands its ground in the middle of the ford. Steam rises from the mud on its shoulders. To cross, you must pass right under its nose.",
      variants: {
        rooting: {
          tell: "Its head is down in the water, tearing up reed roots. The current runs over its back and still it does not lift its head.",
          reading:
            "Nose down. It is going where its nose leads, with no reason to lift its head. You could pass right beside it and it would not know.",
        },
        alert: {
          tell: "Its nose is up, snuffing the air. The wind blows from behind you, towards it.",
          reading:
            "Nose up. It has already caught the scent the wind carried. Cross now and it will charge.",
        },
      },
      options: {
        cross: {
          label: "Cross straight over",
          result: {
            rooting: "You wade past it, parting the water. It never lifts its head.",
            alert:
              "Halfway across, it turns. Its shoulder catches you and you go sprawling on the stony bed. When you get up, it is tearing at the roots again. A boar with its nose up already knew.",
          },
        },
        wait: {
          label: "Sit on the bank and wait for sundown",
          result: {
            "*": "On an empty stomach you wait for the sun to sink. Only when it has climbed the bank and gone do you cross. The cold has got into you.",
          },
        },
        detour: {
          label: "Go a long way downstream to cross",
          result: {
            "*": "Half a day's walking to find a shallow place. A meal eaten on the way.",
          },
        },
        watch: {
          label: "Hide in the reeds and watch",
          result: {
            rooting:
              "Half a day goes, and a meal with it. In all that time it never once lifts its head. It goes only where its nose goes.",
            alert:
              "For a long while it holds its nose up, reading the wind. When the scent thins, it puts its nose back into the roots. It sees the world through its nose, not its eyes.",
          },
        },
        "take-roots": {
          label: "Cross, gathering the roots it has dug up",
          result: {
            rooting: "You lift an armful of roots from the water drifting past your feet. It never knows.",
            alert: "As you reach for the roots, it charges. You keep the roots, but you have paid for them.",
          },
        },
      },
    },

    "wallow-boar": {
      place: "Woods",
      sign: "The ground is turned over everywhere, as if by a plough.",
      signKnown: "The ground is turned over everywhere. A boar's wallow.",
      title: "The boar in the mud",
      description:
        "A little off the road, a boar lies on its side in a hollow of black mud. For ten paces around, the ground is dug over, acorns and roots laid bare. It is not in the way.",
      variants: {
        sleeping: {
          tell: "Its eyes are closed and it breathes slowly. Nothing else stirs around it.",
          reading:
            "Alone. No piglets to guard. Gleaning at the edge will not wake it.",
        },
        sow: {
          tell: "It lies there, but its eyes are open. Under the brush, several striped piglets squirm.",
          reading:
            "A sow with piglets. She will stand between her piglets and you. On the side away from her piglets, she pays you no mind.",
        },
      },
      options: {
        pass: {
          label: "Leave it be and go by",
          result: {
            "*": "You go by on quiet feet. For a long while after, you feel it at your back.",
          },
        },
        forage: {
          label: "Go down and gather what it has dug up",
          result: {
            sleeping:
              "Both pockets are full when it wakes. You flee over a bramble thicket and tear your arms.",
            sow: "Before you can pick up the first acorn, the sow is on her feet. She plants herself in front of the piglets and charges. Only when you throw yourself into the brush does she fall back. A sow with piglets guards her young, not her food.",
          },
        },
        watch: {
          label: "Sit on the bank and watch",
          result: {
            sleeping:
              "Half a day sitting. It wakes, moves four paces, digs, digs again, and never once lifts its head. It feels its way through the world with its nose.",
            sow: "Not once does the sow lift her nose to search for scent. When the piglets move, she only moves to stay between. She is always between her piglets and you.",
          },
        },
        "edge-forage": {
          label: "Gather only at the edge, away from the piglets",
          result: {
            sleeping: "You take one handful from the edge. It does not wake.",
            sow: "You take one handful from the edge across from the piglets. The sow watches you, but does not leave them.",
          },
        },
      },
    },

    "pine-wolves": {
      place: "Woods",
      sign: "Several sets of tracks run in a single line.",
      signKnown: "A wolf pack's tracks run in a single line.",
      title: "Grey shadows in the pines",
      description:
        "Walking a ridge thick with pines, you see grey shadows slip between the trees. One, two, three. Wolves.",
      variants: {
        stalking: {
          tell: "The shadows stop when you stop and move when you move. The distance neither closes nor widens.",
          reading:
            "They are following. Wolves chase what runs. Do not turn your back, and they will only test you, then give up.",
        },
        passing: {
          tell: "The shadows cross the ridge in single file. One looks back, only for a moment.",
          reading: "A pack passing through. As long as you do not run, they have no reason to mind you.",
        },
      },
      options: {
        "keep-walking": {
          label: "Pretend not to see, and walk faster",
          result: {
            stalking:
              "As your steps quicken, so do the shadows. At the end of the ridge one darts in, bites your calf, and falls back.",
            passing: "The shadows vanish over the ridge. There was no need to hurry.",
          },
        },
        climb: {
          label: "Climb a tree and sit out the night",
          result: {
            "*": "You tie yourself to a branch and stay awake through the night. Below, footsteps come and go a few times. When you climb down at dawn, every limb is stiff.",
          },
        },
        fire: {
          label: "Light a fire and wait for daylight",
          closed: "too wet for a fire to catch",
          result: {
            "*": "All night by the fire, chewing dry bread. At dawn the shadows are gone.",
          },
        },
        watch: {
          label: "Put your back to a tree and watch",
          result: {
            stalking:
              "One comes close and backs off, again and again. Flinch and it comes on; hold firm and it backs off. Holding firm, you take a bite on the back of the hand, but now you know. They chase what runs.",
            passing:
              "The pack goes by without looking. Then a hare bolts, and all three turn at once. They chase what runs.",
          },
        },
        "back-away": {
          label: "Back off without turning, then follow the pack at a distance",
          result: {
            stalking:
              "Without taking your eyes off them, you step back one pace at a time. The shadows test you a few times, lose interest, and go over the ridge. You keep your distance and follow. In a clearing lies a fallen deer, and the leader eats first. The rest wait their turn; each one, once fed, draws back and lies down. Fed, the pack does not get up even when the crows land. A meal eaten along the way.",
            passing:
              "You follow the pack over the ridge, keeping your distance. In a clearing they circle a fallen deer and eat in turn, the leader first. Each one, once fed, draws back and lies down, and the fed pack does not chase off even the crows. A meal eaten along the way.",
          },
        },
      },
    },

    "kill-wolves": {
      place: "Valley",
      sign: "A flock of crows circles one spot.",
      signKnown: "Where the crows circle, wolves have made a kill.",
      title: "A clearing after the kill",
      description:
        "In a clearing by the road lies a fallen deer, and beside it, wolves. One of the deer's hind legs stretches out towards the road.",
      variants: {
        full: {
          tell: "Wolves with swollen bellies lie sprawled beside the bones. Only the smallest is still tearing at the meat.",
          reading:
            "Even the smallest is eating. The meal is nearly over. A full pack does not give chase.",
        },
        hungry: {
          tell: "The wolves stand around the deer, baring their teeth at one another. None has touched it yet.",
          reading: "Not even the leader has eaten. Step in now and you fight the whole pack.",
        },
      },
      options: {
        "night-walk": {
          label: "Wait for dark and slip past the clearing",
          result: {
            "*": "You feel your way past the clearing in the dark. Thorns scratch you and you stumble, but the pack pays you no attention.",
          },
        },
        "go-around": {
          label: "Go the long way round the clearing",
          result: {
            "*": "A long loop through the woods, back to the road. It took a meal's worth of time.",
          },
        },
        steal: {
          label: "Cut off the outstretched hind leg",
          result: {
            full: "As the knife goes in, the smallest one snarls and lunges. It bites your arm, but you keep the meat.",
            hungry:
              "The moment the knife touches it, the whole pack turns. Clutching the meat, you roll down the slope and only just get away. There is no stepping in among a hungry pack.",
          },
        },
        watch: {
          label: "Watch from behind a rock",
          result: {
            full: "The leader first, then the rest in turn. The smallest eats only after the others have lain down. The full ones do not chase off even the crows.",
            hungry:
              "While the leader eats, the others wait. As each turn ends, one more draws back and lies down. They eat by rank, and the fed ones do not give chase.",
          },
        },
        "wait-for-scraps": {
          label: "Wait for the full ones to draw back, then take a piece",
          result: {
            full: "When the last one has drawn back and lain down, you go in and cut away a piece of what is left. Not one of them gets up.",
            hungry:
              "You go in as the turns are nearly done, but the last one is still hungry. You take one small scrap and back away.",
          },
        },
      },
    },

    "rut-stag": {
      place: "Valley",
      sign: "Bark has been stripped from the trees at head height.",
      signKnown: "A stag has rubbed his antlers here. There is a stag in the valley.",
      title: "The stag holding the valley",
      description:
        "The road goes down into a narrow valley, and at the bottom stands a red stag. His antlers spread wide as branches.",
      variants: {
        holding: {
          tell: "He bellows and paws the ground. He paces only the lower end of the valley.",
          reading:
            "He is holding his ground. He drives others only away from the ground he holds. Step aside up the slope and he will leave you be.",
        },
        grazing: {
          tell: "Head down, he grazes. Moss hangs from his antlers.",
          reading: "He is guarding nothing. He will pay no mind if you pass.",
        },
      },
      options: {
        cross: {
          label: "Cut across the valley",
          result: {
            holding:
              "Three paces in, he lowers his head and comes at you. His antlers send you tumbling down into the valley. He does not follow, as if driving you off were enough.",
            grazing: "He does not even lift his head. All the way across, there is only the sound of his grazing.",
          },
        },
        wait: {
          label: "Hide in the brush until he leaves",
          result: {
            "*": "Half a day in the brush on an empty stomach. Only when he goes off down the valley towards evening do you pass.",
          },
        },
        detour: {
          label: "Go the long way round by the ridge",
          result: {
            "*": "Half a day along the ridge. His bellowing comes up from the valley.",
          },
        },
        watch: {
          label: "Climb a rock and watch",
          result: {
            holding:
              "When another stag comes into the valley, he drives it one way only. Always downhill, away from his ground. A stag that steps aside uphill does not interest him.",
            grazing:
              "Now and then he lifts his head and looks down the valley. The hinds are there. A young stag comes close and he drives it off, only ever away from the hinds.",
          },
        },
        "step-uphill": {
          label: "Step aside up the slope and watch the valley through the night",
          result: {
            holding:
              "He takes no interest in what is above him. You claw up the steep slope, slipping again and again, and spend the night pressed into a cleft in the rock. Before first light, the hinds he was guarding go down to the water at the valley floor. They all walk into the wind. Not one goes where the wind blows towards the water.",
            grazing:
              "You take the long way up to a path above the slope and spend the night chewing dry bread. Before first light, deer go down to the water at the valley floor. They all walk into the wind. Not one goes where the wind blows towards the water.",
          },
        },
      },
    },

    "dawn-water": {
      place: "Shore",
      sign: "The sound of water beyond the mist.",
      signKnown: "The sound of water beyond the mist. Deer come down to this water at dawn.",
      title: "Water at dawn",
      description:
        "Just before daybreak you reach the shore of a small lake. The mud at the water's edge is full of slender hoofprints.",
      variants: {
        downwind: {
          tell: "The mist drifts from the water towards you.",
          reading:
            "The wind blows from the water towards you. Your scent does not reach the deer. This morning they will come down.",
        },
        upwind: {
          tell: "The mist drifts from you out over the water.",
          reading: "The wind blows from behind you, towards the water. This morning the deer will not come as far as the water.",
        },
        rain: {
          tell: "Rain pocks the water. The hoofprints in the mud are fresh.",
          reading:
            "Rain buries scent. This morning the deer will come down to the water whichever way the wind blows.",
        },
      },
      options: {
        "fill-and-go": {
          label: "Fill your water and go",
          result: { "*": "You fill your water bottle and take to the road again." },
        },
        rest: {
          label: "Sit by the water and rest",
          result: {
            downwind:
              "You sit by the water with your feet in it. Out of the mist a few deer come down, drink, and go.",
            upwind:
              "You sit by the water with your feet in it. At the edge of the woods something stops short, then turns back.",
            rain: "You sit under a willow and wait for the rain to stop. Through the rain a few deer come down, drink, and go.",
          },
        },
        watch: {
          label: "Lie flat on the slope and watch",
          result: {
            downwind:
              "Just before sunrise the deer come down to the water, walking into the wind. Not one looks your way. Downwind of them, you go unseen.",
            upwind:
              "The deer come down as far as the edge of the woods, then stop with their noses up. One stamps, and they all turn back. When the wind blows from your side, they do not come.",
            rain: "In the rain the deer come down to the water without a pause. They lift their noses but catch nothing. When the scent does not reach them, it is the same as going unseen.",
          },
        },
        "follow-trail": {
          label: "Climb back up the trail the deer came down",
          result: {
            downwind:
              "Mushrooms have come up in the grass where the deer were grazing. You pick a handful of the ones not trampled.",
            upwind: "No one came down today. The trail is only wet with dew.",
            rain: "Up the deer path, rutted by the rain, mushrooms have come up at the edge of an untrampled patch of grass.",
          },
        },
      },
    },

    "heron-shallows": {
      place: "Shore",
      sign: "Ahead, the road goes down into the water.",
      signKnown: "Ahead, the road goes down into the water. A heron stands in it.",
      title: "The heron on the flooded road",
      description:
        "The causeway slants down into the risen water and disappears. On the far bank, willows stand in a row. Somewhere in the water between stands a heron.",
      variants: {
        near: {
          tell: "The heron stands motionless right where the road goes under.",
          reading: "Where a heron stands, the water is knee-deep. The water over the road is shallow. Follow the road across.",
        },
        aside: {
          tell: "The heron stands well off the line of the road, beside the reeds. Where the road goes under, the water is black.",
          reading:
            "The heron keeps off the road. The water over it is deep. Cross on the heron's side.",
        },
      },
      options: {
        wade: {
          label: "Wade across along the road",
          result: {
            near: "The water laps at your knees. Underfoot, the road runs unbroken to the far side. The heron only steps aside a few paces.",
            aside:
              "Ten paces in, the bottom drops away. You go under, swallow water, and gash your shin on a sunken stake. When you have floundered to the far side and look back, the heron is standing just where it was, off the road. Water a heron will not step into is deep.",
          },
        },
        wait: {
          label: "Sit on the bank and wait for the water to fall",
          result: {
            "*": "Half a day on the bank on an empty stomach. Only when the sun sinks and the water falls do you cross. The wet wind has chilled you through.",
          },
        },
        "pole-around": {
          label: "Feel the bottom with a pole and cross by the shallows",
          closed: "the far bank is lost in fog",
          result: {
            "*": "Eyes on the willows across the water, you sound the bottom with a pole picked up on the way and tread only where it is shallow. It takes half a day. A meal eaten on the way.",
          },
        },
        watch: {
          label: "Lie on the bank and watch the heron",
          result: {
            near: "Half a day goes, and a meal with it. It follows fish back and forth along the road, but wherever the water would reach its feathers, it always turns back. Where a heron stands, the water is shallow.",
            aside:
              "It only moves slowly along the reeds, and never once steps onto the road. A drifting branch turns over the road and is pulled under. Water a heron will not step into is deep.",
          },
        },
        "heron-line": {
          label: "Cross by the heron's shallows, and lift the fish trap set there",
          result: {
            near: "You cross knee-deep along the road where it stood. In a trap tied to a stake by the road are a few small carp.",
            aside:
              "You go the long way round on its side, keeping to the shallow line. The water is knee-deep, but the way is long. By the time you lift a few carp from the trap by the reeds, after so long in the cold water, you cannot feel your legs.",
          },
        },
      },
    },

    "heron-reeds": {
      place: "Reeds",
      sign: "Reed beds cross the road. A few grey birds settle into them.",
      signKnown: "Reed beds cross the road. A few herons settle into them.",
      title: "Herons in the reeds",
      description:
        "The road goes into reeds higher than your head. In every pool among them stands a heron.",
      variants: {
        settled: {
          tell: "The herons stand with their necks drawn in, looking down at the water. One slowly moves a foot.",
          reading: "The herons are keeping their places. The reed beds are empty. Nothing is moving inside.",
        },
        lifting: {
          tell: "As you reach the edge of the reed beds, the herons all lift at once. Somewhere inside, the reeds sway as if something were brushing through them.",
          reading:
            "They lifted all at once. Not because of you. Something is moving in the reeds. Water or beast, this is no time to go in.",
        },
      },
      options: {
        "push-through": {
          label: "Push straight through the reeds",
          result: {
            settled: "Only the slap of water underfoot. The herons turn their heads to look, but do not fly.",
            lifting:
              "In the middle of the reed beds, the water underfoot begins to move. Water pushing in through the reeds is at your waist in moments. The reeds cut your palms as you hold on, all the way to the far bank. What was moving was water. The herons knew it first.",
          },
        },
        wait: {
          label: "Sit at the edge and wait",
          result: {
            settled:
              "Half a day sitting, on an empty stomach. In all that time the herons do not shift once. When you stand up, the cold has got into you.",
            lifting:
              "On an empty stomach you sit at the edge and wait. Towards evening the herons come down one by one and take their places again. Only then do you go in. The reed stems are wet at the base. The cold has got into you.",
          },
        },
        skirt: {
          label: "Go round the reed beds along the bank",
          result: {
            "*": "Half a day along the bank, round the edge of the reed beds. A meal eaten on the way.",
          },
        },
        watch: {
          label: "Sit on dry ground and watch the herons",
          result: {
            settled:
              "For half a day they never once fly. Towards evening the water rises and comes in, wetting the reed stems, and only then do they lift all at once. When something moves in the reeds, the herons know first.",
            lifting:
              "You watch where they rose. Soon water floods in among the reeds and covers the road. When the water has drained and the reeds are still, the herons come down one by one and take their places again. While the herons keep their places, the reed beds are empty.",
          },
        },
        "dig-roots": {
          label: "Dig lotus roots in the shallows where the herons fish",
          result: {
            settled: "Beside the herons you reach into the shallow water and dig out a few joints of lotus root. They only turn their heads.",
            lifting:
              "You wait on the bank for the water in the reeds to pass, then go in. By the time you have dug a few joints of lotus root out of the mud, you are soaked through and your teeth are chattering.",
          },
        },
      },
    },

    "otter-bank": {
      place: "Shore",
      sign: "A slide is worn smooth down the bank. Scales glint in the mud.",
      signKnown: "A slide is worn smooth down the bank. Otters come and go here.",
      title: "The otter under the bank",
      description:
        "The current has eaten into the bank, leaving a hole at the waterline. Fish scales lie scattered in the mud in front of it.",
      variants: {
        cached: {
          tell: "The hole is quiet. A line of bubbles starts at its mouth and leads away across the water.",
          reading: "It has stored its fish and gone. The line of bubbles is the way it went. It is safe to reach in.",
        },
        holed: {
          tell: "The water at the hole is cloudy. There is no line of bubbles anywhere.",
          reading: "It is still inside, guarding its store. Reach in and you will be bitten.",
        },
      },
      options: {
        "reach-under": {
          label: "Reach into the hole and feel around",
          result: {
            cached:
              "You reach in until the cold water is at your shoulder. Slippery things meet your fingertips. By the time you have drawn out several fish, your arm is numb with cold.",
            holed:
              "As your fingers touch a fish, teeth sink into the back of your hand. You pull your arm out with one fish still in your grip. In the cloudy water, the otter puts its head out and glares at you. The water was cloudy because it was inside.",
          },
        },
        pass: {
          label: "Leave it be and go by",
          result: { "*": "You leave the smell of fish behind and keep on along the causeway." },
        },
        watch: {
          label: "Sit in the reeds and watch the hole",
          result: {
            cached:
              "Towards evening a line of bubbles crosses the water, and an otter goes into the hole with a fish in its mouth. It comes out with nothing and draws its line of bubbles away again. The hole is its larder.",
            holed:
              "All day the cloudy water at the hole does not settle. Only in the evening does an otter put its head out, come out, and draw its line of bubbles away. When the water clears, there are fish piled inside the hole.",
          },
        },
        "take-one": {
          label: "Take just the one fish at the mouth of the hole",
          result: {
            cached: "Without reaching in, you take the one fish lodged at the mouth of the hole. The rest you leave to the otter.",
            holed:
              "You wait in the reeds for it to leave. Only as the sun sinks does the line of bubbles move away. By the time you take the fish at the mouth, you are stiff and shaking from crouching so long in the cold water.",
          },
        },
      },
    },

    "otter-camp": {
      place: "Shore",
      sign: "One dry mound rises out of the water. It is the only dry ground anywhere.",
      signKnown: "One dry mound rises out of the water. Otters live in this water.",
      title: "Night on the mound",
      description:
        "The sun is going down. There is water on every side, and the only place to lie down is this one mound above it. The pack has to be set down somewhere.",
      variants: {
        visited: {
          tell: "Fish bones lie scattered at the edge of the mound, and droppings flecked with scales are still wet.",
          reading: "Otters climb here every night. A pack set down by a sleeper will be empty by morning.",
        },
        clean: {
          tell: "The grass grows evenly to the top. Not a single track.",
          reading: "Otters do not climb this mound. It is safe to set the pack down and sleep.",
        },
      },
      options: {
        sleep: {
          label: "Set the pack down beside you and sleep",
          result: {
            visited:
              "A deep sleep. On waking, the end of the pack has been chewed open, and the dried fish and the bread are gone. Wet, webbed footprints lead down to the water. A mound scattered with fish bones was where they climbed every night.",
            clean: "You lie down on the grass and sleep deeply. Until morning there is only the sound of water.",
          },
        },
        "push-on": {
          label: "Do not sleep; walk the causeway through the night",
          result: {
            "*": "You feel your way along the causeway in the dark. More than once your foot goes into the water. By first light your legs are heavy as stone.",
          },
        },
        watch: {
          label: "Sit up all night beside the pack",
          result: {
            visited:
              "You sit up through the night, chewing dry bread. Around midnight two otters climb out of the water. Though they see you awake, they circle the pack for a long while, then groom beside the fish bones and go back into the water. They climb here every night.",
            clean:
              "You sit up through the night, chewing dry bread. Nothing climbs this mound. Towards dawn, on a mound across the water, two otters climb out and worry an empty pack someone left behind. The edge of that mound is white with scattered fish bones.",
          },
        },
        "pack-pillow": {
          label: "Sleep with your head on the pack",
          result: {
            visited:
              "In the night the pack shifts under your head and you wake. An otter has chewed open the end of it and is pulling out one dried fish. The rest stays under your head. You go back to sleep.",
            clean: "You sleep deeply with your head on the pack. No one comes all night.",
          },
        },
      },
    },

    "lantern-light": {
      place: "Bank",
      sign: "Far out on the water past the bank, a single light floats.",
      signKnown: "Far out on the water past the bank, a single light floats. A marsh lantern.",
      title: "A light on the water",
      description:
        "The causeway runs on between the waters and fades into the dusk. Off to one side, low over the water, there is a light like a lantern. Anyone carrying a lantern in a marsh like this must know the way.",
      variants: {
        night: {
          tell: "The light moves. It does not sway with anyone's step. Its height never changes; it slides sideways over open water, as if gliding.",
          reading:
            "No one is carrying it. A light that does not sway with a step is no one's. Follow it and it leads into deep water.",
        },
        dawn: {
          tell: "The eastern sky is paling. The light has settled low on one spot over the water and does not move. Beneath it, a few tufts of grass stand out of the water.",
          reading:
            "The light is not wandering over the water; it has settled low in one place, with tufts of grass standing out beneath it. Follow this light and it will not draw you into deep water.",
        },
      },
      options: {
        follow: {
          label: "Go down off the causeway and follow the light",
          result: {
            night:
              "You go down off the causeway and follow the light. It is always twenty paces ahead. However far you go, it comes no nearer. The water rises from knee to waist to chest, then the bottom drops away. You swallow water and flounder, catch hold of a reed root, and only just crawl back up the bank. Looking back, you see the light floating in the middle of the deep water without the least sway. Beneath it there is only water. No one was ever carrying it.",
            dawn: "You go down off the causeway towards the light. After stepping into cold water among the tufts more than once, you tread where the light has settled, and the ground underfoot is firm. Meanwhile more lights settle on the water around you, one by one. Stepping from one to the next, you find dry ground running across the water like a path. As day breaks, the lights fade one by one, and only dew is left on the grass.",
          },
        },
        "call-out": {
          label: "Call out towards the light and wait for an answer",
          result: {
            "*": "On an empty stomach you stand on the causeway and call out towards the light, again and again. No answer comes. After so long in the cold wind off the water, you are chilled through.",
          },
        },
        "keep-to-causeway": {
          label: "Leave the light and keep to the causeway",
          result: {
            "*": "You look away from the light. The causeway swings wide around the marsh. A long walk, and a meal eaten on the way.",
          },
        },
        watch: {
          label: "Sit on the causeway and watch the light",
          result: {
            night:
              "You sit on the causeway chewing dry bread and watch the light until past midnight. It never once rises or dips. Through the reeds, over open water, it glides only where no one could set foot. Wherever it lingers, the water is blackest. No one carries this light. Had you followed it, you would have ended in the middle of deep water.",
            dawn: "You sit on the causeway chewing dry bread and watch the light. As day comes, more lights settle one by one on the far water. Every one sits where tufts of grass stand up, on ground above the water. Joined up, the lights show dry places laid like stepping stones from the causeway to the far side. At dawn the lights settle only on firm ground.",
          },
        },
        "dawn-ground": {
          label: "Cross the marsh where the lights settle, gathering waterbird eggs on the dry mounds",
          result: {
            night:
              "While the light wanders over the water, you crouch on the causeway on an empty stomach and wait. The night wind gets into your bones. At dawn, when the lights settle, you cross by stepping where they rest. There are waterbird eggs on every mound. By the time you have gathered a few, you are stiff and shaking.",
            dawn: "You step onto the tuft where the light rests. The ground underfoot is firm. As you cross to the next light, and the one after, they fade one by one. On every mound you pass, you gather a few waterbird eggs.",
          },
        },
      },
    },

    "old-camp": {
      place: "Woods",
      sign: "A thin thread of smoke rises.",
      title: "An abandoned camp",
      description:
        "Someone stopped here and moved on. Embers still glow in the ashes, and an empty sack hangs from a branch.",
      variants: { only: {} },
      options: {
        rest: {
          label: "Bring the embers back to life and rest the night",
          result: { "*": "You build up the fire with wood someone had gathered. For the first time in a long while, you sleep deeply." },
        },
        search: {
          label: "Go through what was left",
          result: { "*": "At the bottom of the sack is a handful of dried beans." },
        },
        pass: {
          label: "Walk on by",
          result: { "*": "Someone else's camp is someone else's. You keep on along the road." },
        },
      },
    },

    "overturned-cart": {
      place: "Track",
      sign: "Wheel tracks leave the road.",
      title: "A cart off the road",
      description:
        "A cart lies on its side in the ditch beside the road. No horse, no owner in sight. Under the cart bed, a few sacks are pinned.",
      variants: { only: {} },
      options: {
        search: {
          label: "Lift the cart and pull out the sacks",
          result: { "*": "Splintered wood cuts your palm, but the sacks are full of oats." },
        },
        pass: {
          label: "Leave it be",
          result: { "*": "The owner may come back. You leave the cart as it is and go on." },
        },
      },
    },

    "shepherd-hut": {
      place: "Valley",
      sign: "A stone hut on the hillside.",
      title: "A shepherd's hut, out of season",
      description:
        "A stone hut its shepherd left long ago. The hearth is cold, and the inside wall is covered with writing in charcoal.",
      variants: { only: {} },
      options: {
        sleep: {
          label: "Light the hearth and sleep",
          result: { "*": "The stone walls keep off the wind. You do not wake once until morning." },
        },
        "read-the-wall": {
          label: "Read the writing on the wall",
          result: {
            "*": "The shepherd wrote it down. 'Wolves eat by rank. Once even the smallest has eaten, a full pack does not chase the sheep.'",
          },
        },
        pass: {
          label: "Pass without stopping",
          result: { "*": "You leave the hut behind and go on down the slope." },
        },
      },
    },

    "reed-hut": {
      place: "Reeds",
      sign: "A roof on posts rises above the reed beds.",
      title: "A reed hut over the water",
      description:
        "A hut where the reed cutters stay each season. Four posts driven into the water hold up the floor, and the roof is woven of reeds. No one has come yet this season. Bundles of dry reeds are stacked on one side of the floor.",
      variants: { only: {} },
      options: {
        sleep: {
          label: "Climb the ladder and stay the night",
          result: {
            "*": "You spread dry reeds on the floor and cook supper. All night the water laps beneath the floor. Somewhere dry at last, you sleep deeply for the first time in a long while.",
          },
        },
        pass: {
          label: "Pass without stopping",
          result: { "*": "You leave the empty hut behind and keep on along the causeway." },
        },
      },
    },

    "sunken-boat": {
      place: "Bank",
      sign: "Below the bank, a boat lies tilted at the water's edge.",
      title: "A boat sunk below the bank",
      description:
        "A flat-bottomed boat lies half sunk below the bank. Its stern is caught on the bank; its bow is under water. Beneath the clear water, a jar is tied by a cord to the floor of the bow. Its mouth is sealed with wax.",
      variants: { only: {} },
      options: {
        search: {
          label: "Go into the water and bring up the jar",
          result: {
            "*": "The cold water rises to your chest. With numb fingers you undo the cord and come out with the jar in your arms. Under the wax it is full of salted fish. For a long while you shake, teeth chattering.",
          },
        },
        pass: {
          label: "Leave the boat and go on",
          result: { "*": "You look down once at the jar under the water, and keep on along the causeway." },
        },
      },
    },

    "old-shepherd": {
      place: "Valley",
      sign: "Sheep are scattered across the hillside. A dog is barking.",
      title: "The old man with the flock",
      description:
        "A flock grazes, scattered over the hillside. An old man with a stick sits on a rock, watching the edge of the woods. Lately, he says, wolves come every night to test the flock. When the dog runs out barking after them, the wolves turn and chase the dog right into the middle of the flock.",
      again:
        "The old man lifts his stick first. Are you not the traveller from last time, he asks. The flock is as it was, but there is one dog fewer. The wolves still come every night, he says.",
      variants: { only: {} },
      options: {
        "sit-by-fire": {
          label: "Spend the night at the old man's fire",
          result: {
            "*": "You bring out what you have and share it with him. He used to winter in the stone hut up the valley, he says. He wrote all sorts of things on the wall there; perhaps they are still there. When talk turns to wolves he points towards the pine ridge: if you want to know their ways, hide up there and watch them. The fire is warm.",
          },
        },
        "walk-the-flock": {
          label: "Spend a day herding the flock with him",
          result: {
            "*": "Until sundown you go up and down the slopes, gathering the strays. Your legs are shaking. The old man wraps up a piece of cheese for you and points towards the pine ridge. If you want to know the ways of wolves, he says, hide up there and watch them.",
          },
        },
        "stand-guard": {
          label: "Tie up the dog, and stand before the flock all night",
          result: {
            "*": "Around midnight three wolves come out of the woods and close in. You do not give an inch. They test you a few times and go back into the woods. In the morning the old man gives you a place in the hut, and when you wake from a nap, there is cheese by your head.",
          },
        },
        "tell-of-rock": {
          label: "Tell him what you saw at Wolf Rock",
          result: {
            "*": "For forty years, he says, he has heard that howling, but he has never gone near the rock. When he has heard you out, it is his turn to tell you something he knows. 'A rutting stag drives others only away from the ground he holds. Step aside uphill and he won't so much as look at you.'",
          },
        },
        pass: {
          label: "Greet him and go on",
          result: { "*": "The old man lifts his stick in answer. The dog follows a long way, then turns back." },
        },
      },
    },

    "charcoal-burner": {
      place: "Woods",
      sign: "Acrid smoke lies low among the trees.",
      title: "The charcoal burner",
      description:
        "In a clearing in the woods, an earth-covered kiln is smoking. A man with a blackened face tends it. The spring is across the clearing, he says, but lately the boars have dug up all the ground around it, and he cannot go to draw water.",
      again:
        "Over the kiln, the charcoal burner knows you and smiles. His face is as black as ever. The boars are digging around the spring again this year, he says.",
      variants: { only: {} },
      options: {
        "rest-by-kiln": {
          label: "Rest the night by the kiln",
          result: {
            "*": "All night the warmth of the kiln is at your back. You share what you have. The charcoal burner says little, but he never once lets the fire go out. Before sleep he says one thing: if you want to know the ways of boars, go and watch them at the ford downstream. They dig for roots there.",
          },
        },
        "carry-wood": {
          label: "Spend a day bringing in firewood for him",
          result: {
            "*": "Until sundown you carry loads of dry branches. Your shoulders are raw. The charcoal burner gives you a sack of baked potatoes. Anyone who had watched the boars at the ford downstream could fetch his water easily enough, he says, and laughs.",
          },
        },
        "fetch-water": {
          label: "Go past the boars and fetch him water from the spring",
          result: {
            "*": "The boars have their noses in the ground. You walk slowly past them to the spring and back. Not one lifts its head. The charcoal burner takes the water jar and laughs for a long while. That night he gives you a place by the kiln, and supper.",
          },
        },
        "tell-of-valley": {
          label: "Tell him what you saw in Acorn Valley",
          result: {
            "*": "When he was young, he says, he carried charcoal as far as the marsh to sell. When he has heard you out, he tells you something in turn. Once, in the marsh at night, he followed a light. He took it for a lantern someone was carrying. But the light did not sway; it glided over the water, and when he came to himself he was in water up to his chest.",
          },
        },
        pass: {
          label: "Walk on past the kiln",
          result: { "*": "The smell of smoke follows you a long way." },
        },
      },
    },

    "reed-cutter": {
      place: "Reeds",
      sign: "One side of the reed beds has been cut. There is the sound of a sickle.",
      title: "The reed cutter",
      description:
        "Cut reeds stand tied in bundles, in rows. A man waist-deep in the water stops his sickle and straightens his back. Towards sundown, he says, something can be heard moving in the reeds, so he stops work before the sun gets low. And so the work is always behind.",
      again:
        "The reed cutter waves, sickle still in hand. He knows you for the traveller from last time. The cut ground is wider than before. The sound at sundown is still there, he says.",
      variants: { only: {} },
      options: {
        "share-supper": {
          label: "Share what you have and stay in his hut",
          result: {
            "*": "You eat supper together in the reed hut on its posts. Water laps beneath the floor. Before sleep he tells you of a reed bed where the herons come down; they seem to know what is in the reeds, he says. Go and watch them there. For the first time in a long while, you sleep deeply.",
          },
        },
        "bundle-reeds": {
          label: "Spend a day tying reed bundles for him",
          result: {
            "*": "Tying and carrying wet reeds, your palms are cut by the leaves and sting. He gives you a few dried fish, and nods towards the reed bed where the herons come down. If a man could read those birds, he says, he could work on past sundown.",
          },
        },
        "watch-herons": {
          label: "Watch the herons, and help him work on past sundown",
          result: {
            "*": "The sun sinks. The herons keep their places. When you tell him the reed beds are empty, he works his sickle until dark. The work that was behind is done. That night he gives you a place in the hut, and some dried fish.",
          },
        },
        "tell-of-island": {
          label: "Tell him how you crossed to Heron Island",
          result: {
            "*": "He will not believe you walked to the island, until you tell him of the line of herons, and he slaps his knee. Then he tells you something in turn. Never set your pack down and sleep on a mound scattered with fish bones, he says. Otters climb up every night and go through it.",
          },
        },
        pass: {
          label: "Greet him and go on",
          result: { "*": "Behind you, the sickle starts up again." },
        },
      },
    },

    "eel-fisher": {
      place: "Shore",
      sign: "Below the bank, fish traps are staked in a row at the water's edge.",
      title: "The eel fisher",
      description:
        "Below the bank, fish traps are staked in a row at the water's edge. A man is hauling up a wet trap. He dries his catch on a mound, he grumbles, but every night something goes through it. Not a person, he says.",
      again:
        "The eel fisher puts down his trap and looks your way. Back again, he says. What he leaves drying on the mound still goes missing every night.",
      variants: { only: {} },
      options: {
        "share-fire": {
          label: "Share what you have by his fire, and rest",
          result: {
            "*": "He roasts eels over the fire, and you bring out what you have. The marsh night is loud with frogs. By the fire he points into the marsh. There is a dry mound out on the water; spend a night on it, he says, and you will learn who goes through the catch. He has never dared.",
          },
        },
        "haul-traps": {
          label: "Spend a day hauling traps with him",
          result: {
            "*": "Waist-deep in the water, you haul the traps and stake them again. You are frozen through. He gives you two smoked eels. He wishes someone would sit up a night on the mound, he mutters.",
          },
        },
        "guard-the-catch": {
          label: "Put his catch in a sack, and sleep on the mound with your head on it",
          result: {
            "*": "In the night something tugs at the sack under your head, lets go, and slips into the water. In the morning the sack is untouched. He is pleased, and gives you one of the eels.",
          },
        },
        "tell-of-weir": {
          label: "Tell him what you saw at Otter Weir",
          result: {
            "*": "When he hears that otters store their catch under the bank, he says those must be the ones that come to his mound. Then he tells you something he knows. If the herons in the reed beds all lift at once, do not go in, he says. Something is moving.",
          },
        },
        pass: {
          label: "Walk on between the traps",
          result: { "*": "An eel rolls over at the surface." },
        },
      },
    },
  },

  destinations: {
    "white-stag-lake": {
      name: "White Stag Lake",
      rumor: "At a lake to the north, they say, a white stag comes down to drink every dawn.",
      sight:
        "Before dawn you bury yourself in the reeds on the side where the wind blows off the lake. As the mist lifts, the white stag comes down among the deer. It drinks, lifts its head and seems to look your way for a long while, then drinks again.",
      sightAgain:
        "Back at the lakeshore. You bury yourself in the reeds on the side where the wind blows off the lake. The white stag comes down again today. A young stag follows it, his antlers still short, the hair on his back flecked with white. The two drink side by side, and only the young one lifts his head and looks your way for a long time.",
      missed:
        "You reach the lakeshore before dawn and hide in the brush. Out of the mist the deer come down as far as the edge of the woods. Among them is a white one. The white stag lifts its nose and stamps once. The whole herd turns back into the woods. Until sunrise, nothing comes down to the water.",
      missedAgain:
        "The lakeshore before dawn, again. This time you hide on a different shore from last time. The deer come down, but only to the far shore, and drink there. The white stag is among them. It is so far off that once the mist lifts, you cannot be sure whether the white was a deer or a wisp of mist.",
      hint: "If only you had known when, and from which side, deer come down to the water.",
    },
    "wolf-rock": {
      name: "Wolf Rock",
      rumor: "On moonlit nights, they say, wolves gather on a great rock and howl.",
      sight:
        "At sundown you sit in the grass below the rock. The wolves gather one by one, and one passes close, sniffing at you. You do not move. It soon loses interest. When the moon rises, the howling begins on top of the rock. Heard this close, it is like singing.",
      sightAgain:
        "Again at sundown you sit in the grass below the rock. The wolves look at you once and pass by. When the moon rises the howling begins, and tonight a few thin, high voices follow from the brush below the rock. Cubs born this spring. They never quite keep time.",
      missed:
        "As the rock comes into view, a wolf notices you. Before you can think, you are running. By the time you have shaken it off, howling sounds in the distance. Tonight the rock is out of reach again.",
      missedAgain:
        "This time you reach the foot of the rock before sundown. The wolves gather, and two of them walk straight towards you. Your feet step back of their own accord. That moment, both rush you at once. Only when you are across the stream does the sound of the chase stop. Tonight, too, the howling is at your back.",
      hint: "If only you had known how to stand your ground before wolves.",
    },
    "acorn-valley": {
      name: "Acorn Valley",
      rumor: "In autumn, they say, the boars of all the woods gather in one valley.",
      sight:
        "You settle at the valley's edge, on the slope away from the piglets. Below, dozens of boars dig for acorns. The sows guard only the piglets' side and do not look your way. You listen to them until sundown.",
      sightAgain:
        "Again you settle on the slope away from the piglets. This year the acorns are few. The boars dig deeper, and one old boar rams an oak trunk with his body to shake the acorns down. Each time, the piglets rush in a crowd to his feet.",
      missed:
        "The moment you step down into the valley, three sows with piglets rise at once. You fall back in haste and climb to the ridge, but the valley is already quiet. They have all gone into the brush.",
      missedAgain:
        "This time you read the wind and go down into the valley from downwind. Your scent cannot have reached them. Even so, halfway down the slope, a sow comes out in front of her piglets and stands across your way. Behind her, the piglets file into the brush. The valley goes quiet again.",
      hint: "If only you had known what a sow with piglets guards.",
    },
    "heron-island": {
      name: "Heron Island",
      rumor: "In the middle of the marsh, they say, there is an island where every heron in the marsh gathers to roost at evening.",
      sight:
        "The island lies across wide water. There is no boat. You look at the herons standing in the water. One, then another beyond it: grey shapes in a broken line all the way to the island. You follow that line into the water. All the way, the water laps at your knees. As you reach the island the sun sinks, and herons fly in from every side and settle on every willow branch. The beating of wings does not stop. You sit beneath the trees until they hang heavy and grey.",
      sightAgain:
        "Again you follow the line of herons across the water. In the island's willows there are nests that were not there before. All evening the young herons crane their necks and beg, and the parents come back from all over the marsh with food in their bills.",
      missed:
        "The island lies across wide water. You try going in at a few places, but each time, before ten paces, the bottom drops away. At sundown the herons pass overhead and fly in to the island. The island stays across the water.",
      missedAgain:
        "Again you stand at the water's edge with the island in sight. This time you go in where the water is calmest, but within a few steps it is up to your waist. You climb back onto the bank, soaked. Some way off, in the middle of the water, a heron is standing. Only its legs are under water. When the sun goes down, it too flies to the island.",
      hint: "If only you had known what the place where a heron stands can tell you.",
    },
    "otter-weir": {
      name: "Otter Weir",
      rumor: "At the old weir where the channel ends, they say, otters gather at sundown.",
      sight:
        "Beside the weir, the current has hollowed the bank inward. You settle in the reeds where you can see under it. As the sun sinks, lines of bubbles cross the water from every side. One family, then another, brings in its catch and puts it under the bank. One mother has two cubs with her. Their work done, they climb onto the old stakes of the weir, one to each, and groom, while the cubs slide down the worn slide on the bank into the water, again and again.",
      sightAgain:
        "Again you hide in the reeds where you can see under the bank. Tonight one mother does not put her catch under the bank, but sets it down before her cubs. The cubs tug and squabble over it for a long while, then slide down into the water, the two of them holding one fish between them.",
      missed:
        "You stand on the weir and wait until dark. Only water runs between the old stakes. Nothing comes. As you turn away in the dark, somewhere below the bank behind you, water splashes once.",
      missedAgain:
        "This time you settle at the water's edge below the weir. As the sun sinks, one line of bubbles crosses the water. Close to you it turns, goes down along the bank, and disappears beneath it. It does not come out again before dark.",
      hint: "If only you had known where an otter keeps its catch.",
    },
    "lantern-shoal": {
      name: "Lantern Shoal",
      rumor: "Out on the open water at the edge of the marsh, they say, dozens of lanterns stand in a line at dawn.",
      sight:
        "Before dawn you sit at the edge of the open water and wait. As the sky pales, the lights settle on the water one by one. Dozens of them in a line, reaching far across the water. Where each light rests, a tuft of grass stands up. Under the water, a firm sandbank runs out of the marsh like a ridge. Where the line of lights ends, beyond the mist, low hills lie fold on fold, bluish. As the sun rises the lights fade one by one. The hills remain.",
      sightAgain:
        "Again you walk the sandbank, following the places where the dawn lights rest. This time you go as far as the end of the line. Beyond the mist, at the foot of the hills, a thin thread of smoke rises. As the sun comes up, the lights go out one by one. You must turn back before you can no longer see where the firm ground is.",
      missed:
        "You reach the edge of the open water before dawn. As the sky pales, the lights settle on the water one by one. Not knowing where they lead, you cannot step into the water. You sit at the edge and wait for full day. When the sun is up the lights fade one by one, and the ripples glitter the same everywhere. What lies under the water cannot be seen.",
      missedAgain:
        "Again you meet the dawn at the edge of the open water. This time you watch the lights settle to the very end. They do not settle just anywhere. They seem to have places of their own, but what decides those places, you cannot tell. When the sun is up and the last light goes out, even where those places were grows unclear.",
      hint: "If only you had known what the dawn lights join up.",
    },
  },
};
