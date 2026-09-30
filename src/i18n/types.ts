// Everything a player reads, for one language. A locale is one object of this
// shape; adding a language is writing another one and registering it in
// `index.ts`.
//
// Game text is keyed by the ids in `src/content/`. Those keys are plain
// `Record<string, …>` here, so a missing or misspelt one is caught by
// `i18n.test.ts` rather than the compiler — it walks the content and checks
// every locale has a line for every scene, variant, option and fact.
//
// Anything that varies with a number or a name is a function, so each
// language handles its own grammar (plurals, Korean particles) where it is
// written instead of through a template syntax.
import type { FactId, SpeciesId } from "../content/types";

export interface SceneText {
  // What the node is called on the map.
  place: string;
  // What can be seen of it a day away, before choosing the road.
  sign: string;
  // The same sign, read by someone who knows the animal. Animal scenes only.
  signKnown?: string;
  title: string;
  description: string;
  // Per variant: the telling detail, and — for animal scenes — what the
  // notebook makes of it once the right fact is known.
  variants: Record<string, { tell?: string; reading?: string }>;
  // Per option: its label, and what happened, per variant. "*" answers for
  // every variant that has no line of its own.
  options: Record<string, { label: string; result: Record<string, string> }>;
}

export interface DestinationText {
  name: string;
  rumor: string;
  // What is there, for the traveler who knew enough to see it.
  sight: string;
  // What happened instead, for the one who did not.
  missed: string;
  // What would have made the difference. Names the kind of knowledge, never
  // the answer.
  hint: string;
}

export interface Strings {
  meta: { name: string; htmlLang: string };
  ui: {
    title: string;
    premise: string;
    setOut: string;
    setOutAgain: string;
    day: (n: number) => string;
    hp: string;
    food: string;
    whereNext: string;
    rumors: string;
    notebook: string;
    notebookEmpty: string;
    unreadable: string;
    unknownOutcome: string;
    outcome: (hp: number, food: number) => string;
    willLearn: string;
    noFood: string;
    learned: string;
    fed: string;
    hungry: string;
    diedTitle: string;
    diedOf: { wounds: string; hunger: string };
    daysWalked: (n: number) => string;
    learnedThisJourney: string;
    nothingLearned: string;
    theRoadBehind: string;
    language: string;
  };
  village: { name: string; description: string };
  quiet: { place: string; sign: string; lines: readonly string[] };
  species: Record<SpeciesId, { name: string; more: string }>;
  facts: Record<FactId, string>;
  scenes: Record<string, SceneText>;
  destinations: Record<string, DestinationText>;
}
