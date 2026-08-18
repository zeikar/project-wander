// The traveler's own village, left behind at the start of the journey. Like
// journey.ts and weather.ts this owns its own types and imports nothing —
// content is the bottom of the dependency chain.
//
// One village, three villagers, met once before the road. Every option gives
// outright rather than trades: there is nothing yet to spend before the
// journey has begun, so unlike an EventOption's four road trades, these run
// only the "give" side of that shape.
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
  // through the same shape. hpDelta ships 0 on all three — villagers never
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
  ],
};
