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
  // itself, and taking it records one RUNG of the species' ladder; "requires"
  // is what that rung buys. Which rung either of them is about is the
  // situation's own `codexLayer` below, not anything written here — this field
  // says only which side of the pair an option is on, which is why it did not
  // change when the codex stopped being a binary.
  // The two still share one menu slot at every depth: one rung short of its
  // rung the observation is live, shallower than that it is shown and refused,
  // and at its rung or deeper the unlocked answer stands in its place. Absent
  // means the option is always offered.
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
  // What watching this animal taught, in the traveler's own words. One entry
  // per LAYER, in the order they are learned: index k−1 is what rung k of this
  // species' ladder says, and the traveler holds the first `depth` of them.
  // THE ARRAY'S LENGTH IS THE SPECIES' WHOLE DEPTH — the one place that number
  // is defined. Nothing else declares how deep an animal goes, so authoring a
  // note is what makes a rung exist, and a situation may only sit at a rung
  // this array actually has (pinned in content.test.ts).
  // Still one ladder per SPECIES rather than per situation: the lessons are
  // about the animal, so meeting it somewhere new offers the next rung rather
  // than the first one over again.
  fieldNotes: readonly string[];
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
  // Which rung of its species' ladder this situation sits at: its `teaches`
  // option teaches THIS rung and its `requires` option needs it. One rung per
  // situation, and that is what keeps the codex slot to a single visible option
  // at every depth — one rung short of it the observation is live, shallower
  // than that it is shown and refused, and at the rung or deeper the unlocked
  // answer has taken its place.
  // A situation may sit deeper than 1 only where its species has a note that
  // deep to teach; a rung nothing teaches would strand every rung above it.
  codexLayer: number;
  options: readonly EncounterOption[];
}
