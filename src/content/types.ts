// The shapes game data is written in. Data here is ids and numbers only —
// every word a player reads lives in a locale bundle under `src/i18n/`, keyed
// by the same ids, so adding a language never touches this folder.

export type SpeciesId = "boar" | "wolves" | "deer";

export type FactId =
  | "boar.nose"
  | "boar.sow"
  | "wolves.rank"
  | "wolves.chase"
  | "deer.drive"
  | "deer.dawn";

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
  // One outcome per variant of the scene. The same choice can go very
  // differently depending on what is actually going on in front of you.
  outcomes: Readonly<Record<string, Outcome>>;
}

export interface Scene {
  id: string;
  kind: "animal" | "place";
  species?: SpeciesId;
  // What can be going on in this scene. One is rolled per map node; the
  // description shows a tell, and `reads` is the fact that lets you read it.
  variants: readonly string[];
  reads?: FactId;
  options: readonly SceneOption[];
}

// Where a journey can end. `needs` is what it takes to actually see the thing
// the rumour promised — without it you arrive and miss it.
export interface Destination {
  id: string;
  needs: FactId;
}
