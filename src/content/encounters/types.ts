// The shapes the authored encounter content is written in. Lifted out of the
// one-file version so that each species can own a file without every species
// file importing every other one through an index.
//
// Like the rest of `content/`, this imports nothing from the core. `Weather`
// comes from `../weather`, another content module, so this stays a
// content-to-content edge rather than reaching into core.
import type { Weather } from "../weather";

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
