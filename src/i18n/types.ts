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
import type { FactId, RegionId, Sky, SpeciesId, Wind } from "../content/types";

export interface SceneText {
  // What the node is called on the map: the lie of the land, shared with other
  // roads of its region, so that fog — which leaves names — leaves a guess.
  place: string;
  // What can be seen of it a day away, before choosing the road.
  sign: string;
  // The same sign, read by someone who knows the animal. Not for places.
  signKnown?: string;
  title: string;
  description: string;
  // Per variant: the telling detail, and — for scenes that are not places —
  // what the notebook makes of it once the right fact is known.
  variants: Record<string, { tell?: string; reading?: string }>;
  // Per option: its label, and what happened, per variant. "*" answers for
  // every variant that has no line of its own.
  // `closed` is the reason shown when the sky rules the option out; required
  // for every option that has `closedIn`.
  options: Record<string, { label: string; result: Record<string, string>; closed?: string }>;
}

export interface DestinationText {
  name: string;
  rumor: string;
  // What is there, for the traveler who knew enough to see it.
  sight: string;
  // Coming back after seeing it: something not there the first time.
  sightAgain: string;
  // What happened instead, for the one who did not.
  missed: string;
  // Missing it again: closer to what was missing, still never the answer.
  missedAgain: string;
  // What would have made the difference. Names the kind of knowledge, never
  // the answer.
  hint: string;
}

export interface RegionText {
  name: string;
  village: { name: string; description: string };
  // The country's quiet days: its own places, so they live under the region.
  quiet: { place: string; sign: string; lines: readonly string[] };
  // The notebook's line for a region reached through a gate; required for every
  // region some gate points to, absent for the first.
  way?: string;
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
    // An option's hint with "this will teach you something" added to it.
    withLesson: (hint: string) => string;
    // The same, when what it teaches might be something already known.
    withMaybeLesson: (hint: string) => string;
    noFood: string;
    learned: string;
    fed: string;
    hungry: string;
    diedTitle: string;
    diedOf: { wounds: string; hunger: string };
    daysWalked: (n: number) => string;
    // The end-screen line for a far place reached before; n counts this time.
    nthVisit: (n: number) => string;
    // After a miss, where this journey went past what was missing, named by its
    // scene's title: a road walked on `day` where it was passed up, or where the
    // pack was too empty to stop for it; or one on the way not taken at the fork
    // on `day` (`another`: a scene of the same kind was walked elsewhere, with
    // something else going on). `noLead` is for a journey offered it nowhere,
    // which only a sky ruling the lesson out could leave.
    leadTaken: (day: number, title: string) => string;
    leadUnfed: (day: number, title: string) => string;
    leadLeft: (day: number, title: string, another: boolean) => string;
    noLead: string;
    learnedThisJourney: string;
    nothingLearned: string;
    theRoadBehind: string;
    // The places passed, in order, as one line.
    road: (places: readonly string[]) => string;
    // A resource as the status line shows it.
    stat: (label: string, value: number, max: number) => string;
    // The caption under the map, which names the region and the village it starts from.
    mapCaption: (region: string, village: string) => string;
    // Heading over the list of villages to set out from.
    setOutFrom: string;
    // The notebook's heading for the ways the traveler knows.
    ways: string;
    // The end-screen label over a way found on this journey.
    newWay: string;
    // A road on offer told apart from another of the same name by where it lies.
    onSide: (place: string, side: "left" | "middle" | "right") => string;
    // The line above a scene's title: what kind of thing this is.
    unknownAnimal: string;
    // A monster the notebook knows nothing of: nobody can yet say it is an animal at all.
    unknownThing: string;
    aPlace: string;
    // The label on what the notebook makes of a scene.
    reading: string;
    language: string;
    // The weather line: the next day's sky over the map, today's in a scene.
    tomorrow: (sky: string, wind: string) => string;
    today: (sky: string, wind: string) => string;
  };
  weather: {
    sky: Record<Sky, string>;
    wind: Record<Wind, string>;
    // What a sky does, said where the choice is made. Empty for clear.
    skyNote: Record<Sky, string>;
    // What the wind does to the traveler's scent. Not shown in rain, which
    // keeps scent from carrying at all.
    windNote: Record<Wind, string>;
    // A road's sign on a day of fog.
    fogSign: string;
  };
  regions: Record<RegionId, RegionText>;
  species: Record<SpeciesId, { name: string; more: string }>;
  facts: Record<FactId, string>;
  scenes: Record<string, SceneText>;
  destinations: Record<string, DestinationText>;
}
