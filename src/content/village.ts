// The traveler's own village, left behind at the start of the journey. Like
// journey.ts and weather.ts this owns its own types and imports nothing —
// content is the bottom of the dependency chain.
//
// One village, three villagers on the morning, met once before the road. Every
// option gives outright rather than trades: there is nothing yet to spend
// before the journey has begun, so unlike an EventOption's four road trades,
// these run only the "give" side of that shape.
//
// FOUR are authored and THREE are ever offered, because the trapper has two
// moods and the traveler's own codex decides which one he is in. While he still
// has a rung to give he sits and talks about an animal (`teaches`); once there
// is nothing left to teach he goes over how you will sleep out there instead
// (`craft`). `offeredVillageOptions` in core is the single place that swap is
// made — the state it reads is `known`, and nothing here can see it.
//
// Three rather than four: the shepherd who read out the whole weather block
// was measured and cut. Forced onto each villager over 300 seeds, five blind
// policies averaged 16.3% best-ending with the smith, 14.1% with the baker,
// 12.0% with the trapper and 8.9% with him — so choosing him cost about 7.4pp
// against the smith — and a paired experiment (one policy consuming the
// forecast against an identical one ignoring it, both forced onto the
// shepherd) put what the forecast itself bought at +1.3pp. The precedent is
// already written down in content/weather.ts: a per-leg weather cue worth
// +0.3pp was deleted rather than shipped as decoration, and a whole-block
// forecast that costs the morning is the same instrument at a higher price.

export interface VillageOption {
  id: string;
  label: string;
  // Field names match EncounterOption on purpose, the same trick EventOption
  // documents (src/content/events.ts:10-14): costHint reads villager options
  // through the same shape. hpDelta ships 0 on all four — villagers never
  // touch hp — pinned by content test, and the reducer never applies it.
  hpDelta: number;
  foodDelta: number;
  preparationDelta: number;
  resultText: string;
  // Marks the one villager whose gift is not in the ledger. This used to be
  // `gives: "sky" | "knowledge"` — "which non-ledger currency" — and with the
  // shepherd cut there is only one left, so the field stopped answering a
  // which and started answering a yes/no. Written as the yes/no it now is,
  // rather than kept as a one-member union that reads like a choice.
  // A marker at all, rather than deriving it from the deltas: the trapper does
  // happen to be the only villager who moves neither food nor preparation, but
  // reading it that way would make the currency-distinctness test derive the
  // currency from the very deltas it then checks — a test that cannot fail —
  // and would materialize a species onto any future villager authored at zero.
  teaches?: true;
  // WHICH species the knowledge villager teaches. NEVER authored — the pick
  // is seeded and depends on what is already known, so it cannot live in
  // static content. `offeredVillageOptions` (core) fills it on the offered
  // copy of the knowledge option, and that function is the only place the pick
  // is defined: the screen and the reducer each CALL it and read this field off
  // what it hands back, neither of them re-implementing the choice. Pinned
  // absent in authored content by test.
  teachesSpecies?: string;
  // Marks the one conversation the trapper has left once the codex is full: no
  // rung to give, so he gives his craft for sleeping rough instead, and every
  // night's rest on this journey returns more than it would have. What that is
  // worth is a rule and lives in the reducer; this field only says WHICH option
  // it is.
  // A marker rather than something derived from the deltas, for exactly the
  // reason `teaches` is one: this option moves nothing in the ledger, so a
  // derivation would have to read "the villager who gives nothing" — which is
  // also what the trapper's OTHER option looks like, and would make the
  // currency-distinctness test derive the currency from the deltas it then
  // checks. Two markers, two currencies, neither inferred.
  craft?: true;
}

export interface Village {
  name: string;
  description: string;
  options: readonly VillageOption[];
}

// The one settlement in the prototype, and the "hometown" the title screen's
// premise line already promises the player is leaving.
export const village: Village = {
  name: "Ashfold",
  description:
    "Ashfold is smoke over its own chimneys and mud in its own lanes, small enough that half of it already knows you are leaving before you have said so.",
  options: [
    {
      id: "mend-your-straps",
      label: "Let the smith go over your straps",
      hpDelta: 0,
      foodDelta: 0,
      preparationDelta: 1,
      resultText:
        "He goes over every buckle without you having to ask, the way he does for anyone he knows is walking out past the mile stone. The pack sits tighter on your shoulder when he is done.",
    },
    {
      id: "share-a-loaf",
      label: "Take the loaf the baker is pressing on you",
      hpDelta: 0,
      foodDelta: 1,
      preparationDelta: 0,
      resultText:
        "She has one going spare and wraps it before you can say a word, still warm, and tucks it into the pack herself.",
    },
    {
      id: "hear-the-road",
      label: "Sit with the trapper before you go",
      hpDelta: 0,
      foodDelta: 0,
      preparationDelta: 0,
      teaches: true,
      resultText:
        "He has walked that road more times than he can be bothered counting, and it does not take much to get him talking about what a person is apt to meet out there.",
    },
    // The trapper's other mood, and the only option here that is not offered on
    // every morning: `offeredVillageOptions` puts it up in his slot exactly when
    // there is no rung left for him to give. Authored LAST so that swap lands
    // him third, where he has always stood.
    // He does something rather than teaches something — the currency is a
    // provision for this journey, not a line in the codex, which is the whole
    // reason it can be offered to a traveler who already knows everything.
    // THE LABEL STATES THE EFFECT BEFORE THE CLICK, and that is not decoration:
    // a fork was worth 2.7 points when it said only what the roads were like and
    // 17.3 when it said what was on them today, and this morning is
    // irreversible, so a promise kept back for the result line is a promise the
    // player could not spend. It names the effect and NOTHING ELSE — no animal,
    // no number, no magnitude — so retuning what a night is worth cannot make
    // this sentence false, and it keeps the standing rule that hp is named and
    // never priced (docs/CONTENT.md § Labels).
    {
      id: "make-your-camp",
      label:
        "Let the trapper show you how to sleep rough — every night on the road gives more back",
      hpDelta: 0,
      foodDelta: 0,
      preparationDelta: 0,
      craft: true,
      resultText:
        "There is nothing left about the animals out there that you have not worked out for yourself, and he knows it, so he spends the morning on your camp instead — where to put it, which side of a bank, how to lie so the cold cannot get under you. He has you build it twice before he is satisfied.",
    },
  ],
};
