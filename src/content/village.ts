// The traveler's own village, left behind at the start of the journey. Like
// journey.ts and weather.ts this owns its own types and imports nothing from
// core — `Weather` comes from `./weather`, another content module, so this
// stays the same content-to-content edge `encounters/types.ts` already uses.
//
// One village, four villagers, met once before the road. Every option gives
// outright rather than trades: there is nothing yet to spend before the
// journey has begun, so unlike an EventOption's four road trades, these run
// only the "give" side of that shape.
import type { Weather } from "./weather";

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
  // The two non-ledger currencies. Absent means the deltas are the gift.
  gives?: "sky" | "knowledge";
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
      id: "read-the-sky",
      label: "Ask the shepherd what the sky is doing",
      hpDelta: 0,
      foodDelta: 0,
      preparationDelta: 0,
      gives: "sky",
      resultText:
        "He is looking at the sky before he has finished turning round to you, and he takes his time over it. Then he tells you straight what it means to do.",
    },
    {
      id: "hear-the-road",
      label: "Sit with the trapper before you go",
      hpDelta: 0,
      foodDelta: 0,
      preparationDelta: 0,
      gives: "knowledge",
      resultText:
        "He has walked that road more times than he can be bothered counting, and it does not take much to get him talking about what a person is apt to meet out there.",
    },
  ],
};

// The one prose seam a forecast gets. `first` holds for exactly `holds` legs
// before `then` begins — both skies named, the count exact — because a rumor
// drawn straight from the journey's own weather script is never wrong, and
// exact leg counts are already public ("Leg 3 of 8"), so stating one here
// breaks no contract. No hedging: this is not "they say", it is what the
// road is actually about to do.
const SKY_NOUN: Record<Weather, string> = {
  clear: "clear weather",
  rain: "rain",
  wind: "wind",
};

export function skyRumor(
  first: Weather,
  holds: number,
  then: Weather,
): string {
  const firstNoun = SKY_NOUN[first];
  const firstSentence = firstNoun.charAt(0).toUpperCase() + firstNoun.slice(1);

  return `${firstSentence} holds for the next ${holds} legs, then ${SKY_NOUN[then]} moves in.`;
}
