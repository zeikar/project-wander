// The shapes game data is written in. Data here is ids and numbers only —
// every word a player reads lives in a locale bundle under `src/i18n/`, keyed
// by the same ids, so adding a language never touches this folder.

export type SpeciesId = "boar" | "wolves" | "deer" | "heron" | "otter" | "lantern";

export type FactId =
  | "boar.nose"
  | "boar.sow"
  | "wolves.rank"
  | "wolves.chase"
  | "deer.drive"
  | "deer.dawn"
  | "heron.wade"
  | "heron.lift"
  | "otter.cache"
  | "otter.raid"
  | "lantern.drift"
  | "lantern.dawn";

// The sky over one day of road, and which way the wind blows along it.
export type Sky = "clear" | "rain" | "fog";
export type Wind = "behind" | "ahead";
export interface Weather {
  sky: Sky;
  wind: Wind;
}

export interface Species {
  id: SpeciesId;
  facts: readonly FactId[];
}

// What choosing an option does. `learn` records a fact in the notebook — the
// only thing that survives the journey.
export interface Outcome {
  hp: number;
  food: number;
  learn?: FactId;
}

export interface SceneOption {
  id: string;
  // Offered only once this fact is known: what knowing buys.
  needs?: FactId;
  // The option exists to learn. Once what it would teach is already known,
  // it is not offered — watching the same thing twice is not a choice.
  study?: true;
  // Skies under which this simply cannot be done. Still shown, with a reason.
  closedIn?: readonly Sky[];
  // One outcome per variant of the scene. The same choice can go very
  // differently depending on what is actually going on in front of you.
  outcomes: Readonly<Record<string, Outcome>>;
}

export interface Scene {
  id: string;
  // A monster is a scene where ordinary sense is wrong and the tell says which
  // guess is unsafe — never an animal with bigger numbers.
  kind: "animal" | "place" | "monster";
  species?: SpeciesId;
  // What can be going on in this scene. One is rolled per map node; the
  // description shows a tell, and `reads` is the fact that lets you read it.
  variants: readonly string[];
  reads?: FactId;
  // Scenes that turn on scent take their variant from the day's weather
  // instead of a roll: the wind carries the traveler's smell ahead or behind,
  // and rain keeps it from carrying at all. The text of whatever variant rain
  // picks must not name a wind direction — rain can fall in either wind.
  byWind?: Readonly<Record<Wind | "rain", string>>;
  options: readonly SceneOption[];
}

// Where a journey can end. `needs` is what it takes to actually see the thing
// the rumour promised — without it you arrive and miss it.
export interface Destination {
  id: string;
  needs: FactId;
}

export type RegionId = "fields";

// A stretch of country a journey crosses. `gate`: a region opens through exactly
// one sight; arriving at that destination and seeing it writes `to` into the notebook.
export interface Region {
  id: RegionId;
  species: readonly SpeciesId[];
  places: readonly string[];
  destinations: readonly Destination[];
  skyOdds: { rain: number; fog: number };
  gate?: { destinationId: string; to: RegionId };
}
